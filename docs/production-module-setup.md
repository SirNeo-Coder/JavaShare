# Repair: Students and Curriculum fail in production

Approved as an adjustment on 2026-10-20. See CKB-050. The teacher's read-only SQL
check returned NULL for both `public.module_progress` and `public.course_modules`.
The dashboard reads both tables even when no modules have been uploaded.

## Before running anything

Use the hosted Supabase project whose Project URL matches the CodeShare Worker's
`SUPABASE_URL`. Compare the URL yourself; do not share keys. This procedure is for
the confirmed starting state where **both module tables are absent**. If either
already exists, stop and inspect which updates are missing instead of rerunning
table creation. Existing student accounts and class membership are retained.

## Apply the existing files

In Supabase's SQL Editor, start a new query. Open each file below, copy its whole
contents, paste it into the query, and run it. Replace the previous query text
before running the next file. Run them in this order:

1. [Create progress storage](../supabase/migrations/20261018000100_module_progress.sql).
2. [Create uploaded-module storage](../supabase/migrations/20261018000200_course_modules.sql).
3. [Use progress per lesson](../supabase/migrations/20261018000300_module_progress_exit_slip_fix.sql).
4. [Keep progress separate by class](../supabase/migrations/20261018000400_module_progress_scope_to_classroom.sql).
5. [Add availability fields](../supabase/migrations/20261018000500_module_availability.sql).
6. [Add weekly selection and saved Java files](../supabase/migrations/20261018000600_module_weekly_active_and_shared_project.sql).

For this repair, a convenience file can be made by concatenating those six files
unchanged, in that order. It has the same one-time use and partial-success limits.
The original files remain the source of truth. No new migration is needed.

**If any query fails, stop and retain its error and which file was running.** Do
not run a database reset, drop tables, rerun the entire sequence, or use
`supabase db push`. Do not treat a failed sequence as safely repeatable: earlier
updates may already have succeeded. Hosted migration history may not list updates
applied by hand; check the actual tables and fields.

## Check afterwards

Run this read-only query; every result should be true:

```sql
select
  to_regclass('public.module_progress') is not null as progress_table,
  to_regclass('public.course_modules') is not null as modules_table,
  exists (select 1 from information_schema.columns where table_schema = 'public'
    and table_name = 'module_progress' and column_name = 'project_files') as saved_java_files,
  exists (select 1 from information_schema.columns where table_schema = 'public'
    and table_name = 'course_modules' and column_name = 'open_lesson_ids') as lesson_availability,
  exists (select 1 from information_schema.columns where table_schema = 'public'
    and table_name = 'course_modules' and column_name = 'performance_task_open') as task_availability,
  exists (select 1 from information_schema.columns where table_schema = 'public'
    and table_name = 'classrooms' and column_name = 'active_module_id') as weekly_module,
  exists (select 1 from pg_constraint where conrelid = to_regclass('public.module_progress')
    and conname = 'module_progress_student_id_classroom_id_module_id_key') as progress_per_class;
```

Then, in production:

1. Open the affected class and press **Refresh**. **Students** should show its
   current student roster; **Curriculum** should show an empty list without the
   server error. No app rebuild is required to make these tables available.
2. Use **Add module** with the intended module JSON. Modules and progress on the
   laptop are separate data; creating these tables does not transfer them online.
3. Sign in as a student in that class, open the uploaded module, edit and save its
   project, then reload and check that the saved files remain. Run an activity
   with the required output and check the teacher's refreshed saved progress.

Keep the repair marked pending until the teacher confirms these production
checks. Do not claim restored production service from local checks alone.
