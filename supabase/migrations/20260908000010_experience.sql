-- Cosmetic theme, onboarding state, and what the user said they want help with.
alter table public.profiles
  add column theme text not null default 'paper'
    check (theme in ('paper', 'midnight', 'sage', 'dusk', 'sunrise')),
  add column onboarding_completed boolean not null default false,
  add column focus_areas text[] not null default '{}';

-- Optional Boss Tasks: a big intimidating task whose subtasks are its "phases".
alter table public.tasks
  add column is_boss boolean not null default false;

insert into public.achievements (code, name, description, xp_reward) values
  ('BOSS_SLAYER', 'Boss Slayer', 'Defeat your first Boss Task.', 50)
on conflict (code) do nothing;

-- Lightweight internal product events (no dashboard, just a trail we can query).
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index analytics_events_user_time_idx on public.analytics_events (user_id, created_at desc);
create index analytics_events_user_name_idx on public.analytics_events (user_id, name);

alter table public.analytics_events enable row level security;

create policy "analytics_events_select_own" on public.analytics_events for select using (auth.uid() = user_id);
create policy "analytics_events_insert_own" on public.analytics_events for insert with check (auth.uid() = user_id);
