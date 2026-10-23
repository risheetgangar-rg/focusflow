-- "Time's up!" arrives at the exact minute a Lock-in timer ends, and reminders
-- arrive at their time: the sender now runs every 5 minutes, and a tiny check
-- runs every minute that only calls the app when a timer has really run out.

alter table public.focus_sessions add column if not exists timeup_sent_at timestamptz;

select cron.unschedule('unstuck-notify');
select cron.schedule(
  'unstuck-notify',
  '*/5 * * * *',
  $$
  select net.http_get(
    url := 'https://focusflow-drab-beta.vercel.app/api/notifications/send',
    headers := jsonb_build_object('x-job-token', (select token from public.job_tokens where name = 'notify'))
  );
  $$
);

select cron.schedule(
  'unstuck-timer',
  '* * * * *',
  $$
  select net.http_get(
    url := 'https://focusflow-drab-beta.vercel.app/api/notifications/timer',
    headers := jsonb_build_object('x-job-token', (select token from public.job_tokens where name = 'notify'))
  )
  where exists (
    select 1 from public.focus_sessions
    where ended_at is null
      and timeup_sent_at is null
      and planned_minutes is not null
      and started_at > now() - interval '6 hours'
      and started_at + make_interval(mins => planned_minutes) <= now()
  );
  $$
);
