# CKB-043 — Matching output alone could falsely complete an activity

- Status: resolved
- First recorded: 2026-10-20
- Last verified: 2026-10-20
- Area: `backend/src/java-runner.ts`, `module-activities.ts`, `supabase-repository.ts`
- Search terms: right output then crash passes, sample pass reused for new challenge, task complete without successful execution

## Symptom

During the approved student-activity implementation, the previous runner was found to return
stdout instead of the error when a program printed text and then crashed. A second completion
risk was found during review: adding a distinct challenge to a previously passed sample step
would otherwise inherit that sample's saved pass.

## Root cause

The old string-only result lost the process exit status and preferred stdout over stderr. The
first draft of the new challenge flow reused the old sample step's completion key.

## Durable solution

The runner returns success separately from output, including timeout/output-limit/runtime error
failures. The server requires success and the configured output. A step with an `activity` uses
`<step id>:activity` as its progress key, separate from the legacy sample pass. Upload validation
rejects collisions involving these keys. Direct code pass flags are rejected; only actual runs
can record activity results. Existing sample records remain stored but cannot pass new work.

## Regression proof

`tests/module-activities.test.mjs`:
- "module activities: matching text cannot pass a failed process; internal whitespace still matters".
- "module activities: compile errors and a crash after the right output cannot pass".
- "module activities: parts spanning lessons require every task and never require a paper liplet"
  includes an assertion that old sample passes cannot complete the new challenges.

Command: `node --test --test-reporter=spec tests/module-activities.test.mjs`.
Removing the success requirement failed the focused output regression; restored for the final
passing suite. The real Java crash case is also exercised against the actual routes.
Branch: `codex/student-module-activities`; see the verification report for final evidence.

## Recurrence triage

Distinguish matching stdout from a successful process. Check which requirement earned a stored
pass before reusing it for newly added work.

## History

- 2026-10-20 — Found and fixed while implementing the teacher-approved student activity workflow.
