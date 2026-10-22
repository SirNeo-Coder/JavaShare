# CKB-067 — Verified error sample locks unfinished code after reload

- Status: resolved locally; hosted rollout unverified
- First recorded: 2026-10-23
- Last verified: 2026-10-23
- Area: Module project device drafts and completion feedback
- Search terms: expected error observed, reload, read-only alteration, sample verification lost

## Symptom

After a declared error sample verifies, editing its alteration and reopening the step restores read-only alteration code and asks for the unchanged sample.

## Root cause

Restoration treated Java's success flag as sample verification. An expected exception has success=false. Existing cache tests covered keys and expiration, not restoring verified samples.

## Durable solution

`moduleDeviceStore.ts` reuses `matchesSample` and `unchangedSample`. The editor restores verified sample state, including declared exceptions, and reuses that state when running alterations.

## Regression proof

- `tests/module-device-store.test.mjs`: `module drafts: expected-error verification survives reload with unfinished edits`.
- Browser: `expected-error verification and unfinished code survive reopening`, online and offline.
- Deliberately replacing `matchesSample` with `draft.sample.success` fails the regression; restoring the fix passes.
- Commands and every named result: [verification](../../verification/module-draft-recovery.md).
- Branch: `codex/module-draft-recovery`.

## Recurrence triage

Distinguish declared expected exceptions from arbitrary execution failures. Check both unchanged sample source and declared output/exception.

## History

- 2026-10-23 — Teacher approved fixing the three completion-saving review findings.

