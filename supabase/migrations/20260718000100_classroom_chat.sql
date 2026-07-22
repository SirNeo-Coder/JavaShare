alter table public.classrooms
  add column if not exists chat_muted boolean not null default false;

