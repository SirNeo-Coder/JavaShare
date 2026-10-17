# CKB-009 — Module progress: a lost write and a 500 under concurrent saves

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: `backend/src/supabase-repository.ts`
- Search terms: module progress 500 on first open, duplicate key value violates unique constraint
  module_progress, performance task submission disappeared, sample submission lost, step result
  overwritten, two tabs open the same module, concurrent module progress save

## Symptom

Not a live incident — found by `/code-review` on PR #6/#7 (listed as open findings in
`docs/handoffs/stage-two.md`) before either PR shipped to a student. Two distinct symptoms, both
from the same file:

1. The very first time a student opens a module, the server does select-then-insert on
   `module_progress`. If the student has the module open in two tabs (or a flaky connection
   retries the request), both requests see no row and both try to insert — the second gets a raw
   Postgres unique-violation that surfaces as a generic 500, not a usable error.
2. `setSupabaseModuleStepState` and `setSupabaseModulePerformanceTask` read the whole
   `step_states`/`performance_task` jsonb column, merge one key into it in JavaScript, then
   overwrite the whole column. Two near-simultaneous saves (e.g. submitting the performance task's
   sample-code run and the student's own version close together) can both read the same
   pre-write state; whichever writes second overwrites the first one's change entirely.

## Root cause

Both routes were written for the single-writer case (one student, one save at a time) and never
re-checked against the module viewer's actual usage, where a student can trigger two saves close
together (two performance-task slots, a step re-run while an earlier save is still in flight, or
simply two open tabs). `loadOrCreateModuleProgress` used a plain `insert` instead of the
upsert-on-conflict pattern already used elsewhere in this file (`joinSupabaseClass`,
`saveSupabaseFile`'s version upsert) for exactly this kind of race. The two write routes did a
plain read-merge-write with no concurrency check at all.

## Durable solution

- `loadOrCreateModuleProgress` now upserts with `onConflict: "student_id,module_id",
  ignoreDuplicates: true`; when the upsert is ignored (another request won the race), it selects
  the winner's row instead of throwing. No schema change — the unique constraint already existed.
- `setSupabaseModuleStepState`/`setSupabaseModulePerformanceTask` now go through
  `updateModuleProgressWithMerge`, which reads the row, builds the merged patch, and writes back
  conditioned on `.eq("updated_at", row.updated_at)` — `updated_at` is trigger-managed
  (`set_updated_at`) and changes on every write with no client input, so it works as an optimistic
  lock with no new column. If the conditional write matches no row (someone else wrote first), it
  reloads and retries, up to 5 attempts, so a losing request's data is folded in rather than lost
  or rejected.

## Regression proof

- Test file: `tests/module-progress.test.mjs`.
  - "module progress: two simultaneous first touches of a module don't 500 (write race)"
  - "module progress: two simultaneous performance-task submissions don't lose one (write race)"
- Command: `node --test --test-concurrency=1 tests/module-progress.test.mjs` (also covered by
  `npm test`).
- **Shown failing before the fix:** against the pre-fix code, the first-touch test's second
  concurrent request returned 500 (`Could not start module progress: duplicate key value violates
  unique constraint "module_progress_student_id_module_id_key"`); the performance-task test failed
  with the sample submission missing (`expected 'pass', got undefined`) after the own-version
  write landed second and overwrote it. Both pass after the fix.
- Commit: this change, branch `module-viewer`.

## Recurrence triage

If a future symptom is "a save silently didn't stick" or "the first thing a student does in a
session 500s," check whether the write path is read-then-overwrite-whole-column with no
concurrency guard before assuming the bug is new — the fix pattern here (upsert-ignore-then-select
for creation, `updated_at`-conditioned retry for merges) applies to any other table in this file
that gets the same read-merge-write treatment.

## History

- 2026-10-18 — Found by `/code-review` on PR #6/#7, tracked as open findings in
  `docs/handoffs/stage-two.md`. Fixed in this change: regression tests shown failing against the
  old code, then `loadOrCreateModuleProgress` (upsert-on-conflict) and the two write routes
  (`updated_at`-conditioned retry merge) fixed, tests passing.
