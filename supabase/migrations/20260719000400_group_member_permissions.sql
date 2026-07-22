create table if not exists public.group_member_permissions (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  chat_muted boolean not null default false,
  editing_locked boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

alter table public.group_member_permissions enable row level security;
grant all privileges on table public.group_member_permissions to service_role;
