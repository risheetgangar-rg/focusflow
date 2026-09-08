create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  planned_minutes integer,
  actual_minutes integer,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index focus_sessions_user_id_idx on public.focus_sessions (user_id);

alter table public.focus_sessions enable row level security;

create policy "focus_sessions_select_own" on public.focus_sessions for select using (auth.uid() = user_id);
create policy "focus_sessions_insert_own" on public.focus_sessions for insert with check (auth.uid() = user_id);
create policy "focus_sessions_update_own" on public.focus_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
