create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  importance smallint not null default 3 check (importance between 1 and 5),
  urgency smallint not null default 3 check (urgency between 1 and 5),
  friction smallint not null default 1 check (friction between 1 and 5),
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes > 0),
  due_at timestamptz,
  scheduled_at timestamptz,
  completed_at timestamptz,
  parent_task_id uuid references public.tasks (id) on delete cascade,
  source text not null default 'manual' check (source in ('manual', 'brain_dump', 'voice', 'recurring')),
  recurrence_rule text check (recurrence_rule is null or recurrence_rule in ('daily', 'weekly', 'monthly')),
  started_at timestamptz,
  postponed_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_user_id_idx on public.tasks (user_id);
create index tasks_user_status_idx on public.tasks (user_id, status);
create index tasks_due_at_idx on public.tasks (due_at);

alter table public.tasks enable row level security;

create policy "tasks_select_own" on public.tasks for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on public.tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_delete_own" on public.tasks for delete using (auth.uid() = user_id);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create table public.task_subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  position integer not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index task_subtasks_task_id_idx on public.task_subtasks (task_id, position);

alter table public.task_subtasks enable row level security;

create policy "task_subtasks_select_own" on public.task_subtasks for select using (auth.uid() = user_id);
create policy "task_subtasks_insert_own" on public.task_subtasks for insert with check (auth.uid() = user_id);
create policy "task_subtasks_update_own" on public.task_subtasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "task_subtasks_delete_own" on public.task_subtasks for delete using (auth.uid() = user_id);

create trigger task_subtasks_set_updated_at
  before update on public.task_subtasks
  for each row execute function public.set_updated_at();
