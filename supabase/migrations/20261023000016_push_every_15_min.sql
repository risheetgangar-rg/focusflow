-- Notifications that arrive with the app closed: every 15 minutes the database
-- asks the app to send due reminders and refresh each person's "next up" card.
-- (Vercel's free plan only allows a daily cron, so the schedule lives here.)

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- A random key made inside the database; only the service role can read it.
create table if not exists public.job_tokens (
  name text primary key,
  token text not null
);
alter table public.job_tokens enable row level security;
-- No policies on purpose: signed-in people can't read or write it.

insert into public.job_tokens (name, token)
values ('notify', encode(extensions.gen_random_bytes(32), 'hex'))
on conflict (name) do nothing;

select cron.schedule(
  'unstuck-notify',
  '*/15 * * * *',
  $$
  select net.http_get(
    url := 'https://focusflow-drab-beta.vercel.app/api/notifications/send',
    headers := jsonb_build_object('x-job-token', (select token from public.job_tokens where name = 'notify'))
  );
  $$
);
