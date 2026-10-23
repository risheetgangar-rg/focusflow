-- "Every day until Friday": the last day a repeating task or reminder comes back.
alter table public.tasks add column repeat_until date;
