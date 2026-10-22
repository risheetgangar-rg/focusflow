-- The dread meter: after finishing, one optional tap on how it felt compared
-- with how heavy it seemed beforehand. The Ta-Da List counts the "easier" ones.
alter table public.tasks
  add column felt text check (felt in ('easier', 'same', 'harder'));
