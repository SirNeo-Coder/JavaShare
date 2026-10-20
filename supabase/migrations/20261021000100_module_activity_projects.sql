-- Preserve each step's working files before loading the next sample. Existing columns and
-- completion records stay intact; older application versions ignore this additive history.
alter table public.module_progress
  add column if not exists activity_projects jsonb not null default '{}'::jsonb
  check (jsonb_typeof(activity_projects) = 'object');

comment on column public.module_progress.activity_projects is
  'Module-only working drafts keyed by task id, active key, and pre-sample backup. Not submissions.';
