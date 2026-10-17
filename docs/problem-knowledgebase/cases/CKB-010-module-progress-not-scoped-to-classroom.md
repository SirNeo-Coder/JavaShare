# CKB-010 — Module progress wasn't scoped to classroom

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: `backend/src/supabase-repository.ts`, `supabase/migrations/`
- Search terms: module progress shared between classes, same module two classrooms, step already
  marked done in a different class, progress leaked across classrooms, student in two classes
  same module

## Symptom

Not a live incident — an open finding from `/code-review` on PR #6/#7, tracked in
`docs/handoffs/stage-two.md`, before either PR shipped to a student. `module_progress` rows were
unique only on `(student_id, module_id)`. `module_id` is free text from a module's own JSON file
(`docs/course-format.md`), not unique across classrooms — `course_modules` is correctly scoped by
`(classroom_id, module_id)`, so the same module id can legitimately exist in two different
classrooms (e.g. a teacher reusing one week's module file across two sections of the same
course). A student who is a member of both classrooms (supported today — `loadClasses` returns
every classroom a student belongs to) would have their progress on that module in one classroom
leak into/collide with the other: marking a step done in classroom A would make classroom B's copy
of the same module look already-completed too, since both read/wrote the same row.

## Root cause

`loadOrCreateModuleProgress` and `updateModuleProgressWithMerge` (the only two places that touch
this table) filtered and upserted by `student_id`/`module_id` only, even though `classroom_id` was
already stored on every row — the scoping gap was in the queries, not a missing column.

## Durable solution

- New migration `20261018000400_module_progress_scope_to_classroom.sql` drops the 2-column unique
  constraint and replaces it with `(student_id, classroom_id, module_id)` (the earlier migration
  files were never touched, per rule 3).
- `loadOrCreateModuleProgress`'s select, upsert (`onConflict`), and race-winner select, and
  `updateModuleProgressWithMerge`'s conditional update, all now also filter by `classroom_id`.

## Regression proof

- Test file: `tests/module-progress.test.mjs`, test "module progress: a module in two classrooms
  doesn't share one student's progress (classroom scoping)". Uploads the same fixture module to
  two classrooms, puts one student in both, marks a step done in classroom A, and asserts
  classroom B's progress is still empty.
- Command: `node --test --test-concurrency=1 tests/module-progress.test.mjs` (also covered by
  `npm test`).
- **Shown failing before the fix:** with the migration applied but the repository code
  unchanged, the test failed with `Could not start module progress: there is no unique or
  exclusion constraint matching the ON CONFLICT specification` (the old code's two-column
  `onConflict` no longer matched the new three-column constraint) — a direct demonstration that
  the old queries never accounted for `classroom_id`. Fixed the queries; the test passes.
- Commit: this change, branch `module-viewer`.

## Recurrence triage

If a future symptom is "progress/state from one class shows up in another" for any per-student,
per-classroom feature, check whether every query against that table filters by `classroom_id` (not
just that the column exists on the row) — this is the same shape as CKB-007 (one shared key
standing in for several distinct things), one level up: here the missing distinguishing key was
the classroom, not the lesson.

## History

- 2026-10-18 — Found by `/code-review` on PR #6/#7, tracked as an open finding in
  `docs/handoffs/stage-two.md`. Fixed in this change: regression test shown failing against the
  old queries (via the migration-first approach, which made the mismatch surface as a Postgres
  error), then `loadOrCreateModuleProgress`/`updateModuleProgressWithMerge` scoped by
  `classroom_id`, test passing.
