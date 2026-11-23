-- Module editor (teacher, 2026-11-23): before an upload, an editor save or a restore replaces a shared
-- module, its old content is kept here so the teacher can restore it. Student work is never stored here.
create table if not exists public.subject_module_versions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  subject text not null check (subject in ('java', 'net-mvc')),
  module_id text not null,
  content jsonb not null,
  replaced_by text not null check (replaced_by in ('upload', 'edit', 'restore')),
  created_at timestamptz not null default now()
);
create index if not exists subject_module_versions_module on public.subject_module_versions (teacher_id, subject, module_id, created_at desc);
alter table public.subject_module_versions enable row level security;
revoke all on public.subject_module_versions from anon, authenticated;
grant all on public.subject_module_versions to service_role;
