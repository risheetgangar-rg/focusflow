-- "Welcome back" mode: notice when someone returns after time away, park the
-- pile, and let them move it all forward in one tap (with an exact Undo).

alter table public.profiles
  add column last_seen_at timestamptz,
  -- Start of the absence we're currently welcoming them back from (null = not in welcome-back mode).
  add column away_since timestamptz,
  -- "Show my full list" pressed today: don't bring welcome-back mode straight back.
  add column welcome_dismissed_on date;

-- One row per "I was away" tap, holding the old dates so Undo puts them back exactly.
create table public.date_shifts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  days integer not null,
  changes jsonb not null,
  created_at timestamptz not null default now(),
  undone_at timestamptz
);

create index date_shifts_user_time_idx on public.date_shifts (user_id, created_at desc);
alter table public.date_shifts enable row level security;
create policy "date_shifts_select_own" on public.date_shifts for select using (auth.uid() = user_id);
create policy "date_shifts_insert_own" on public.date_shifts for insert with check (auth.uid() = user_id);
create policy "date_shifts_update_own" on public.date_shifts for update using (auth.uid() = user_id);

-- Brain dump items marked "Note" instead of "Task".
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index notes_user_time_idx on public.notes (user_id, created_at desc);
alter table public.notes enable row level security;
create policy "notes_select_own" on public.notes for select using (auth.uid() = user_id);
create policy "notes_insert_own" on public.notes for insert with check (auth.uid() = user_id);
create policy "notes_delete_own" on public.notes for delete using (auth.uid() = user_id);
