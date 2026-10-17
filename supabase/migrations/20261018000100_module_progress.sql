-- Tracks a student's progress through a weekly course module (docs/course-format.md).
-- Modules are JSON files, not database rows, so module_id is free text (the module's "id"
-- field, e.g. "java-2-w15") rather than a foreign key.
--   step_states        {stepId: "pass" | "fail"} for each lesson step the student has run
--   exit_slip_done     the day's exit slip was answered
--   performance_task   {sample: {...}, own: {...}} the two tracked submissions (sample code
--                       the student runs, and the student's own version); each holds
--                       {files, status, submittedAt}
-- The goal meter is computed from these on read, not stored.
create table public.module_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  module_id text not null,
  step_states jsonb not null default '{}'::jsonb check (jsonb_typeof(step_states) = 'object'),
  exit_slip_done boolean not null default false,
  performance_task jsonb not null default '{}'::jsonb check (jsonb_typeof(performance_task) = 'object'),
  updated_at timestamptz not null default now(),
  unique (student_id, module_id)
);

create index module_progress_classroom_idx on public.module_progress(classroom_id);

create trigger set_module_progress_updated_at
  before update on public.module_progress
  for each row execute function public.set_updated_at();

alter table public.module_progress enable row level security;

-- No anon/authenticated policies: since migration 20261016000200, those roles have no table
-- privileges at all. The server (service role) enforces who may read or write a row.
