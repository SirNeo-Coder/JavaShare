# CKB-069 — Completion banner announces unlock before server acceptance

- Status: resolved locally; hosted rollout unverified
- First recorded: 2026-10-23
- Last verified: 2026-10-23
- Area: Module project device drafts and completion feedback
- Search terms: Completed next activity unlocked, sync pending, failed save, passed locally

## Symptom

A passing local run displayed **Completed — next activity unlocked** even when the completion request failed. The separate status said sync pending, and server access remained locked.

## Root cause

The result banner received a local pass before the server response and had no pending-sync state. Earlier feedback checks covered passes and failures, not unaccepted local passes.

## Durable solution

`StudentModuleActivity.tsx` marks local task passes as pending until acceptance. `ModuleRunFeedback` displays **Passed locally — awaiting sync** during the request, after rejection, and after restoring queued completion. Both initial acceptance and retry clear pending state. Earlier completion does not make a later unsynced run appear accepted.

## Regression proof

- `tests/module-run-feedback.test.mjs`: `module feedback: local passes wait for server acceptance even after an earlier completion`.
- Browser: `rejected completion stays pending through reload and unlocks only after retry acceptance`.
- Restoring the premature completion wording fails the feedback regression; restoring the fix passes.
- Commands and every named result: [verification](../../verification/module-draft-recovery.md).
- Branch: `codex/module-draft-recovery`.

## Recurrence triage

Check the actual completion response and saved progress. Local output matching cannot announce an unlock. Preserve the queued completion id and code after a failed request.

## History

- 2026-10-23 — Teacher approved fixing the three completion-saving review findings.

