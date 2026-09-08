create table public.daily_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  completed_count integer not null default 0,
  rescheduled_count integer not null default 0,
  remaining_count integer not null default 0,
  reflection text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create index daily_reviews_user_date_idx on public.daily_reviews (user_id, date);

alter table public.daily_reviews enable row level security;

create policy "daily_reviews_select_own" on public.daily_reviews for select using (auth.uid() = user_id);
create policy "daily_reviews_insert_own" on public.daily_reviews for insert with check (auth.uid() = user_id);
create policy "daily_reviews_update_own" on public.daily_reviews for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger daily_reviews_set_updated_at
  before update on public.daily_reviews
  for each row execute function public.set_updated_at();
