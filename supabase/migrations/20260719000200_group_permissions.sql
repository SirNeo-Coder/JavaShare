alter table public.teams
  add column chat_muted boolean not null default false,
  add column editing_locked boolean not null default false;
