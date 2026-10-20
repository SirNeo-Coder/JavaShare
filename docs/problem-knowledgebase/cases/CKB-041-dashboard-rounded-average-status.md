# CKB-041 — Rounded averages gave the wrong completion status

- Status: resolved
- First recorded: 2026-10-20
- Last verified: 2026-10-20
- Area: `backend/src/supabase-repository.ts`, `app/TeacherClassDashboard.tsx`
- Search terms: Finished with an incomplete module, 100 percent average not finished, zero percent In progress, dashboard completion filter rounding

## Symptom

Found in final code review of the new dashboard before release. A student's module percentages
of 99 and 100 average to 99.5, displayed as 100%. The original card/filter implementation would
call that Finished despite only one module being complete. Small progress spread over several
modules could similarly round to 0% and be called Not started.

## Root cause

Status and filtering used the rounded average instead of the actual per-module/per-student
completion records. Rounding is suitable for the displayed meter, not a completion decision.

## Durable solution

The class-wide read returns status separately from the rounded mean. Finished requires every
included percentage to be 100 and at least one included record. In progress requires any
nonzero progress. Cards and filters use that status. Individual module percentages still use the
existing goal-meter calculation; this fix concerns dashboard averages only.

## Regression proof

- `tests/teacher-dashboard.test.mjs`:
  - "rounded 100% averages do not label unfinished students or modules Finished (CKB-041)".
  - "rounded 0% averages retain In progress when a student has completed an item (CKB-041)".
- Command: `node --test --test-reporter=spec tests/teacher-dashboard.test.mjs`.
- Replacing the status decision with a rounded-average comparison failed both tests. Restoring
  the decision based on the underlying percentages passed the final full suite.
- Commit: dashboard implementation on `codex/teacher-progress-dashboard`.

## Recurrence triage

When a status disagrees with the completed count, inspect whether it uses a rounded display value.

## History

- 2026-10-20 — Found and fixed within the approved dashboard work, with real-route regression proof.
