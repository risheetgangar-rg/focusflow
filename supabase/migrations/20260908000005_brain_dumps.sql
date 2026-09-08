create table public.brain_dumps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  raw_text text not null,
  source text not null default 'text' check (source in ('text', 'voice')),
  parsed_data jsonb,
  created_at timestamptz not null default now()
);

create index brain_dumps_user_id_idx on public.brain_dumps (user_id);

alter table public.brain_dumps enable row level security;

create policy "brain_dumps_select_own" on public.brain_dumps for select using (auth.uid() = user_id);
create policy "brain_dumps_insert_own" on public.brain_dumps for insert with check (auth.uid() = user_id);
