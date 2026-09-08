create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  color text not null default '#6366f1',
  target_count smallint not null default 3 check (target_count between 1 and 7),
  target_period text not null default 'week' check (target_period in ('week')),
  preferred_time time,
  reminder_enabled boolean not null default false,
  reminder_time time,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index habits_user_id_idx on public.habits (user_id);

alter table public.habits enable row level security;

create policy "habits_select_own" on public.habits for select using (auth.uid() = user_id);
create policy "habits_insert_own" on public.habits for insert with check (auth.uid() = user_id);
create policy "habits_update_own" on public.habits for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits_delete_own" on public.habits for delete using (auth.uid() = user_id);

create trigger habits_set_updated_at
  before update on public.habits
  for each row execute function public.set_updated_at();

create table public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  status text not null check (status in ('completed', 'partial', 'skipped')),
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

create index habit_completions_habit_id_idx on public.habit_completions (habit_id, date);

alter table public.habit_completions enable row level security;

create policy "habit_completions_select_own" on public.habit_completions for select using (auth.uid() = user_id);
create policy "habit_completions_insert_own" on public.habit_completions for insert with check (auth.uid() = user_id);
create policy "habit_completions_update_own" on public.habit_completions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habit_completions_delete_own" on public.habit_completions for delete using (auth.uid() = user_id);
