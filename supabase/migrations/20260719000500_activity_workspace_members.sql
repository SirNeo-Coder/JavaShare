create table if not exists public.activity_workspace_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  is_leader boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

alter table public.activity_workspace_members enable row level security;
grant all privileges on table public.activity_workspace_members to service_role;
