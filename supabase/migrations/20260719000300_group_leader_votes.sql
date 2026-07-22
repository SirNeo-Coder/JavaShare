create table if not exists public.group_leader_votes (
  team_id uuid not null references public.teams(id) on delete cascade,
  voter_id uuid not null references public.profiles(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (team_id, voter_id)
);

create index if not exists group_leader_votes_candidate_idx on public.group_leader_votes(team_id, candidate_id);
alter table public.group_leader_votes enable row level security;
grant all privileges on table public.group_leader_votes to service_role;
