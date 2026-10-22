-- Tasks and reminders are different things: a task is something you do (and
-- can lock in on with a timer); a reminder is a nudge at a time, with no timer.
alter table public.tasks
  add column kind text not null default 'task' check (kind in ('task', 'reminder'));
