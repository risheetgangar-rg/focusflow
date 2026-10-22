-- Make tasks personal (build plan steps 2 and 5).
alter table public.tasks
  -- Fixed-date things (appointments) never move when the plan shifts forward.
  add column fixed_date boolean not null default false,
  -- The "Must do" star: comes first, and counts as one level more urgent.
  add column must_do boolean not null default false,
  -- What kind of task it is, for smarter first steps and ordering.
  add column task_type text not null default 'other'
    check (task_type in ('bills', 'work', 'calls', 'home', 'health', 'other'));
