-- Existing uploads and student work remain intact until the teacher chooses a subject.
alter table public.classrooms add column if not exists module_subject text
  check (module_subject in ('java', 'net-mvc'));

create table if not exists public.subject_modules (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null check (subject in ('java', 'net-mvc')),
  module_id text not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (teacher_id, subject, module_id),
  check (content->>'id' = module_id),
  check (content->>'course' in ('java-1', 'java-2', 'dotnet-1', 'dotnet-2')),
  check ((subject = 'java' and content->>'course' in ('java-1', 'java-2'))
      or (subject = 'net-mvc' and content->>'course' in ('dotnet-1', 'dotnet-2')))
);
drop trigger if exists set_subject_modules_updated_at on public.subject_modules;
create trigger set_subject_modules_updated_at before update on public.subject_modules
  for each row execute function public.set_updated_at();
alter table public.subject_modules enable row level security;
revoke all on public.subject_modules from anon, authenticated;
grant all on public.subject_modules to service_role;
