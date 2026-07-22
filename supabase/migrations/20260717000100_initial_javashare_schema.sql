create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 80),
  email text not null unique,
  role text not null check (role in ('teacher', 'student')),
  password_reset_required boolean not null default false,
  password_reset_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null default 'Object-Oriented Programming',
  join_code text not null unique check (join_code = upper(join_code)),
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  live_share_project_id uuid,
  current_activity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.classroom_members (
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (classroom_id, user_id)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  slug text not null,
  name text not null,
  leader_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (classroom_id, slug)
);
create unique index teams_classroom_owner_unique
  on public.teams (classroom_id, owner_id) where owner_id is not null;

create table public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 1 and 100),
  description text not null default '' check (char_length(description) <= 1000),
  mode text not null check (mode in ('individual', 'group')),
  starter_code text not null default '' check (char_length(starter_code) <= 200000),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete cascade,
  title text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index projects_team_activity_unique
  on public.projects (team_id, activity_id) where activity_id is not null;

alter table public.classrooms
  add constraint classrooms_live_share_project_fk
  foreign key (live_share_project_id) references public.projects(id) on delete set null,
  add constraint classrooms_current_activity_fk
  foreign key (current_activity_id) references public.activities(id) on delete set null;

create table public.code_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  path text not null,
  language text not null default 'java',
  content text not null default '' check (char_length(content) <= 200000),
  version integer not null default 1 check (version > 0),
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, path)
);

create table public.file_versions (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.code_files(id) on delete cascade,
  version integer not null check (version > 0),
  content text not null default '',
  author_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (file_id, version)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  files jsonb not null default '[]'::jsonb check (jsonb_typeof(files) = 'array'),
  feedback text not null default '',
  status text not null default 'submitted' check (status in ('submitted', 'reviewed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submission_credits (
  submission_id uuid not null references public.submissions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (submission_id, user_id)
);

create table public.saved_works (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  files jsonb not null default '[]'::jsonb check (jsonb_typeof(files) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  text text not null check (char_length(btrim(text)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index classroom_members_user_idx on public.classroom_members(user_id);
create index team_members_user_idx on public.team_members(user_id);
create index teams_classroom_idx on public.teams(classroom_id);
create index activities_classroom_idx on public.activities(classroom_id);
create index projects_classroom_idx on public.projects(classroom_id);
create index projects_team_idx on public.projects(team_id);
create index code_files_project_idx on public.code_files(project_id);
create index file_versions_file_idx on public.file_versions(file_id);
create index submissions_project_idx on public.submissions(project_id);
create index submissions_team_idx on public.submissions(team_id);
create index saved_works_owner_idx on public.saved_works(owner_id);
create index messages_team_created_idx on public.messages(team_id, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles', 'classrooms', 'teams', 'activities', 'projects',
    'code_files', 'submissions', 'saved_works'
  ] loop
    execute format(
      'create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      table_name, table_name
    );
  end loop;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'name'), ''), split_part(coalesce(new.email, ''), '@', 1)),
    lower(coalesce(new.email, '')),
    'student'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_classroom_member(target_classroom_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.classroom_members cm
    where cm.classroom_id = target_classroom_id and cm.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_classroom_teacher(target_classroom_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.classrooms c
    where c.id = target_classroom_id and c.teacher_id = (select auth.uid())
  );
$$;

create or replace function public.is_team_member(target_team_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.team_members tm
    where tm.team_id = target_team_id and tm.user_id = (select auth.uid())
  ) or exists (
    select 1 from public.teams t
    join public.classrooms c on c.id = t.classroom_id
    where t.id = target_team_id and c.teacher_id = (select auth.uid())
  );
$$;

alter table public.profiles enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_members enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.activities enable row level security;
alter table public.projects enable row level security;
alter table public.code_files enable row level security;
alter table public.file_versions enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_credits enable row level security;
alter table public.saved_works enable row level security;
alter table public.messages enable row level security;

create policy "users read their own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy "members read classrooms"
  on public.classrooms for select to authenticated
  using (public.is_classroom_member(id) or teacher_id = (select auth.uid()));
create policy "members read classroom memberships"
  on public.classroom_members for select to authenticated
  using (public.is_classroom_member(classroom_id) or public.is_classroom_teacher(classroom_id));
create policy "members read classroom teams"
  on public.teams for select to authenticated
  using (public.is_classroom_member(classroom_id) or public.is_classroom_teacher(classroom_id));
create policy "members read team memberships"
  on public.team_members for select to authenticated
  using (public.is_team_member(team_id));
create policy "members read classroom activities"
  on public.activities for select to authenticated
  using (public.is_classroom_member(classroom_id) or public.is_classroom_teacher(classroom_id));
create policy "members read accessible projects"
  on public.projects for select to authenticated
  using (public.is_team_member(team_id));
create policy "members read accessible files"
  on public.code_files for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and public.is_team_member(p.team_id)));
create policy "members update accessible files"
  on public.code_files for update to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and public.is_team_member(p.team_id)))
  with check (exists (select 1 from public.projects p where p.id = project_id and public.is_team_member(p.team_id)));
create policy "members read team messages"
  on public.messages for select to authenticated
  using (public.is_team_member(team_id));
create policy "members send team messages"
  on public.messages for insert to authenticated
  with check (author_id = (select auth.uid()) and public.is_team_member(team_id));

alter publication supabase_realtime add table public.classrooms;
alter publication supabase_realtime add table public.teams;
alter publication supabase_realtime add table public.code_files;
alter publication supabase_realtime add table public.messages;
