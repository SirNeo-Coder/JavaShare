-- Weekly module pick (workflow change, see docs/knowledgebase/workflow-state.md): the teacher
-- chooses one uploaded module as "this week's" for a class. While a live activity is running
-- (classrooms.current_activity_id is set), a student may only open that one module - every other
-- module in their catalog stays locked for the duration. Enforced server-side in
-- supabase-repository.ts, not just hidden in the UI.
-- Free text matching course_modules.module_id, like module_progress.module_id already is (same
-- reason: module_id is only unique scoped to a classroom, not globally, so it is not a column
-- course_modules itself exposes a stable foreign key on). deleteSupabaseModule clears this column
-- itself when the deleted module was the active pick, since there is no FK to do it automatically.
alter table public.classrooms add column if not exists active_module_id text;

-- A student's one evolving project for a module - the same files replaced step by step (e.g. one
-- Main.java), matching how the printed worksheet works, separate from the two performance-task
-- submissions already tracked in performance_task. Starts empty; the module viewer seeds it from
-- the first step's sample files on first open.
alter table public.module_progress add column if not exists project_files jsonb not null default '[]'::jsonb check (jsonb_typeof(project_files) = 'array');
