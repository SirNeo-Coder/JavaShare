-- A weekly course module (docs/course-format.md) a teacher uploaded for a class. The whole
-- validated JSON file is kept as-is in `content`; CodeShare never edits it, only replaces it
-- whole on re-upload (course-format.md rule 2: ids are kept, content is replaced).
create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  module_id text not null,
  content jsonb not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (classroom_id, module_id)
);

create index course_modules_classroom_idx on public.course_modules(classroom_id);

create trigger set_course_modules_updated_at
  before update on public.course_modules
  for each row execute function public.set_updated_at();

alter table public.course_modules enable row level security;

-- No anon/authenticated policies: since migration 20261016000200, those roles have no table
-- privileges at all. The server (service role) enforces who may read or write a row.
