# CKB-007 — Module exit slip was one flag for the whole module, not per lesson

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: `backend/src/supabase-repository.ts`, `backend/src/routes.ts`, `supabase/migrations/`
- Search terms: exit slip marked done on every lesson, goal meter wrong after one lesson, exit slip checkbox already checked, module progress exit slip, course module exit slip

## Symptom

Caught during development of the module viewer (`app/ModuleViewer.tsx`), before this reached any
student — not a live incident. A weekly module (`docs/course-format.md`) has one lesson per class
day, and each lesson has its own exit slip (`lesson.exitSlip.id`). The `module_progress` table
added in PR #6 stored exit-slip completion as a single `exit_slip_done` boolean for the whole
module, and `PUT .../progress/exit-slip` took `{ done: boolean }` with no field identifying which
lesson. Marking lesson 1's exit slip done would have shown lesson 2's (and every other lesson's)
exit slip as already done too, and the goal meter would have over-counted.

## Root cause

The `exit_slip_done` column and its route were designed assuming one exit slip per module. The
format actually has one exit slip per lesson, and a module can have several lessons. Missed
during planning because the earlier design discussion focused on the goal meter and the two
performance-task submissions; the exit slip's own per-lesson `id` field in `docs/course-format.md`
was overlooked until wiring up the actual lesson-by-lesson viewer made the shape mismatch visible.

## Durable solution

Exit-slip completion now goes through the same mechanism as a lesson step: `step_states` (jsonb),
keyed by whichever id is being marked — a step block's own `id`, or a lesson's `exitSlip.id`. One
map, one route (`PUT .../progress/step`), so a lesson's exit slip can never collide with another
lesson's. `backend/src/supabase-repository.ts`'s `setSupabaseModuleStepState` is the only write
path; there is no separate exit-slip function or route. `exit_slip_done` was dropped by migration
`20261018000300_module_progress_exit_slip_fix.sql` (a new migration — the earlier
`20261018000100_module_progress.sql` was never edited, per rule 3).

## Regression proof

- Test file: `tests/module-progress.test.mjs`, test "module progress: step checklist, exit slip,
  and both performance-task versions". The fixture
  (`tests/fixtures/sample-module.codeshare.json`) has two lessons, each with its own exit slip, so
  the test can tell a real fix from a coincidental pass.
- Command: `node --test --test-concurrency=1 tests/module-progress.test.mjs` (also covered by
  `npm test`).
- **Shown failing before the fix:** temporarily changed `setSupabaseModuleStepState` to collapse
  any id containing `"slip"` into one shared key (`ANY_EXIT_SLIP`), reproducing "one flag for every
  lesson's exit slip". The test failed (`AssertionError: expected 'pass', got undefined` — even the
  single-lesson assertion broke, since the shared key clobbers the per-slip lookup). Reverted the
  change; the test passes again.
- Commit: this change, branch `module-viewer`.

## Recurrence triage

If a future symptom is "a checkbox/status shows done when it shouldn't have been touched yet",
check whether the write path keys its state by the right id (step, exit slip, lesson, or module)
before assuming the bug is new — this exact shape (one shared flag standing in for several
distinct things) is the recurring failure mode here.

## History

- 2026-10-18 — Found while wiring `app/ModuleViewer.tsx` to PR #6's progress routes (never
  shipped to a student). Fixed in the same change: new migration drops `exit_slip_done`, exit-slip
  completion folds into `step_states`, keyed by the exit slip's own id.
