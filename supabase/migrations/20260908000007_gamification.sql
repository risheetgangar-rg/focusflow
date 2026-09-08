create table public.user_gamification (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  xp integer not null default 0,
  level integer not null default 1,
  current_momentum integer not null default 0,
  longest_momentum integer not null default 0,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_gamification enable row level security;

create policy "user_gamification_select_own" on public.user_gamification for select using (auth.uid() = user_id);
create policy "user_gamification_insert_own" on public.user_gamification for insert with check (auth.uid() = user_id);
create policy "user_gamification_update_own" on public.user_gamification for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger user_gamification_set_updated_at
  before update on public.user_gamification
  for each row execute function public.set_updated_at();

-- xp_events is the authoritative, immutable ledger — user_gamification.xp is a
-- cached sum kept in sync by the service layer, never written to directly by
-- anything except the trigger below.
create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null,
  source_id text,
  xp_amount integer not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  -- Same action (e.g. completing one specific task) can never award XP twice.
  unique (user_id, event_type, source_id)
);

create index xp_events_user_id_idx on public.xp_events (user_id);

alter table public.xp_events enable row level security;

create policy "xp_events_select_own" on public.xp_events for select using (auth.uid() = user_id);
create policy "xp_events_insert_own" on public.xp_events for insert with check (auth.uid() = user_id);

create function public.apply_xp_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_gamification (user_id, xp, last_activity_at)
  values (new.user_id, new.xp_amount, now())
  on conflict (user_id) do update
    set xp = public.user_gamification.xp + new.xp_amount,
        last_activity_at = now();
  return new;
end;
$$;

create trigger xp_events_apply
  after insert on public.xp_events
  for each row execute function public.apply_xp_event();

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  xp_reward integer not null default 0,
  criteria jsonb not null default '{}'::jsonb
);

-- Reference data, readable by any signed-in user; no user-owned RLS needed.
alter table public.achievements enable row level security;
create policy "achievements_select_all" on public.achievements for select using (true);

insert into public.achievements (code, name, description, xp_reward) values
  ('FIRST_STEP', 'First Step', 'Complete your first task.', 20),
  ('MOMENTUM', 'Momentum', 'Complete 3 tasks in one session.', 25),
  ('TINY_WINS', 'Tiny Wins', 'Complete 5 small tasks.', 25),
  ('DEEP_FOCUS', 'Deep Focus', 'Complete a focus session of 25 minutes or more.', 30),
  ('COMEBACK', 'Comeback', 'Return after time away and complete something.', 25);

create table public.user_achievements (
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

create policy "user_achievements_select_own" on public.user_achievements for select using (auth.uid() = user_id);
create policy "user_achievements_insert_own" on public.user_achievements for insert with check (auth.uid() = user_id);

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('daily', 'side', 'boss', 'comeback')),
  title text not null,
  description text,
  target integer not null default 1,
  progress integer not null default 0,
  xp_reward integer not null default 0,
  date date not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, type, title, date)
);

create index quests_user_date_idx on public.quests (user_id, date);

alter table public.quests enable row level security;

create policy "quests_select_own" on public.quests for select using (auth.uid() = user_id);
create policy "quests_insert_own" on public.quests for insert with check (auth.uid() = user_id);
create policy "quests_update_own" on public.quests for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
