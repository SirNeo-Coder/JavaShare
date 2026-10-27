# CKB-068 — Corrected lessons restore old code and sample evidence

- Status: resolved locally; hosted rollout unverified
- First recorded: 2026-10-23
- Last verified: 2026-10-23
- Area: Module project device drafts and completion feedback
- Search terms: teacher correction, old draft, sample rejected, activity id changed, cached instructions, backup

## Symptom

A corrected lesson restores earlier code and credits its old sample evidence. The server rejects it. Browser verification also found the picker choosing a step from stale content before opening the editor.

## Root cause

Device records lacked module version and task identity. Restoration did not revalidate sample evidence. The picker combined fresh progress with cached instructions before choosing a step.

## Durable solution

`moduleDeviceStore.ts` records version and task identity. Mismatched, legacy, or invalid records preserve code in readable backups and discard obsolete verification/pending evidence. Existing backups survive subsequent corrections. `ModuleWorkspace.tsx` checks the content version before choosing a step; `page.tsx` checks it again when preparing the editor. `StudentModuleActivity.tsx` loads the current sample and shows **Work saved before lesson changes**. No database migration or server guard changed.

## Regression proof

- `tests/module-device-store.test.mjs`: `module drafts: changed lesson, task identity and legacy drafts keep backups without reusing evidence`; `module drafts: invalid sample evidence resets safely while valid pending completion survives`.
- Browser: `teacher correction refreshes cached instructions and archives stale code and pending evidence`.
- Disabling version/identity comparison fails the unit regression. The browser test failed with the stale picker, then passed after its correction.
- Commands and every named result: [verification](../../verification/module-draft-recovery.md).
- Branch: `codex/module-draft-recovery`.

## Recurrence triage

Compare downloaded content and prepared-project versions. Keep old code readable; never apply an earlier exercise's evidence to a new task or delete a draft to clear a conflict.

## History

- 2026-10-23 — Teacher approved fixing the three completion-saving review findings.

