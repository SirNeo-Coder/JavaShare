# CKB-050 — Production Students and Curriculum fail with missing module tables

- Status: investigating (teacher reports hosted SQL success; production checks pending)
- First recorded: 2026-10-20
- Last verified: 2026-10-20
- Area: production database setup, teacher dashboard
- Search terms: production students not loading, Curriculum unexpected server error, module-progress 500, missing module tables, module_progress NULL, course_modules NULL

## Symptom

The teacher's production screenshots show **Students / Student progress** and
**Curriculum** displaying **Unexpected server error**. Browser and Worker logs
show failed GET requests to `/api/classes/:classroomId/module-progress`.
Curriculum displays its fallback count of zero modules while loading has failed.

## Root cause

The teacher ran `select to_regclass('public.module_progress'),
to_regclass('public.course_modules');` in the hosted Supabase SQL Editor. Both
values were NULL: neither required table exists in the database checked.
`getSupabaseTeacherClassProgress` in `backend/src/supabase-repository.ts` reads
both, so even an empty curriculum cannot be returned. The shared dashboard
request supplies both student and module cards.

The running app was deployed without its module database updates in that project.
Local module tests used an already-migrated local Supabase database; they did not
establish that the hosted database had those tables. Confirm the checked project
matches the Worker's SUPABASE_URL before applying the repair. The expanded Worker
exception was not obtained; table absence is established by the SQL result.
CKB-009's concurrent-write cause does not explain these failing teacher reads.

## Durable solution

The teacher approved applying the six **existing** `20261018` migrations in order
as an adjustment. Follow [production-module-setup.md](../../production-module-setup.md).
Keep existing migration files unchanged and preserve accounts/class membership.
No new application code, tables beyond the existing approved design, dependency,
or hosted setting is required. The teacher applies hosted SQL; assistants do not.

Before future production module use, verify actual required tables and fields in
the correct hosted project. A passing build or connection check alone does not
prove module database readiness. Do not reset the database or blindly reapply
partially completed SQL. Storage creation does not transfer local module data.

## Regression proof

- Before repair: teacher-supplied table check returned NULL / NULL and production
  screenshots showed failed dashboard requests.
- Existing route integration coverage: `tests/teacher-dashboard.test.mjs`,
  including empty classes and classes with modules; it uses local Supabase.
- Repair verification: run the guide's read-only table/field/constraint check,
  then refresh Students/Curriculum and verify student module save/reload/progress.
- Local SQL and repository check evidence is recorded in `docs/handoffs/stage-one.md`.
- No production repair or post-repair browser check has been performed by the
  assistant. A production failing-before/passing-after proof is still pending.
- Commit: branch `codex/production-module-setup`.

## Recurrence triage

Check the actual table names before investigating roster rendering. If the tables
exist, inspect the full Worker error and required fields/permissions; do not
assume this case explains every 500. The old build error about an executable
does not identify the cause of a current running dashboard failure.

## History

- 2026-10-20 — Teacher reported production failure, provided logs and the NULL
  table check, and approved the existing migration repair as an adjustment.
  Teacher subsequently supplied a SQL success screenshot. Readiness-query and
  production browser recovery remain unverified. The teacher explicitly requested
  merging the repair documentation into main.
