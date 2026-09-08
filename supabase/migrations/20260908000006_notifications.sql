alter table public.profiles
  add column notify_task_reminders boolean not null default true,
  add column notify_habit_reminders boolean not null default true,
  add column notify_deadline_reminders boolean not null default true,
  add column notify_rescue_reminders boolean not null default true,
  add column quiet_hours_start time,
  add column quiet_hours_end time;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own" on public.push_subscriptions for select using (auth.uid() = user_id);
create policy "push_subscriptions_insert_own" on public.push_subscriptions for insert with check (auth.uid() = user_id);
create policy "push_subscriptions_delete_own" on public.push_subscriptions for delete using (auth.uid() = user_id);

create trigger push_subscriptions_set_updated_at
  before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete cascade,
  habit_id uuid references public.habits (id) on delete cascade,
  reminder_type text not null check (
    reminder_type in ('upcoming_task', 'deadline_approaching', 'habit_reminder', 'missed_task', 'reschedule_suggestion', 'rescue')
  ),
  scheduled_for timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'dismissed', 'snoozed')),
  notification_title text not null,
  notification_body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reminders_user_id_idx on public.reminders (user_id, status);
-- One in-flight reminder per (user, task or habit, type) avoids duplicate sends across cron ticks.
create unique index reminders_dedupe_task_idx on public.reminders (user_id, task_id, reminder_type)
  where task_id is not null and status in ('pending', 'sent');
create unique index reminders_dedupe_habit_idx on public.reminders (user_id, habit_id, reminder_type, scheduled_for)
  where habit_id is not null and status in ('pending', 'sent');

alter table public.reminders enable row level security;

create policy "reminders_select_own" on public.reminders for select using (auth.uid() = user_id);
create policy "reminders_insert_own" on public.reminders for insert with check (auth.uid() = user_id);
create policy "reminders_update_own" on public.reminders for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "reminders_delete_own" on public.reminders for delete using (auth.uid() = user_id);

create trigger reminders_set_updated_at
  before update on public.reminders
  for each row execute function public.set_updated_at();
