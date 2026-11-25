# CKB-147 — Media step "Checked by your teacher for now" stays Locked after running the sample

- Status: resolved on `fix/sample-lock-leftovers`
- First recorded: 2026-11-25
- Last verified: 2026-11-25
- Area: web media steps in sample-first modules — `app/StudentModuleActivity.tsx`, `app/moduleDeviceStore.ts`,
  `backend/src/module-activities.ts` (`withoutMediaChecks`)
- Search terms: Locked — press Run code to check the sample first, Checked by your teacher for now, .NET Week 2,
  Multimedia and Tables, media step never unlocks, guided example on a media step, no media uploaded

## Symptom

In a Net MVC class, .NET 1 Week 2 (three-part, every step a media step) showed **Checked by your teacher for now**.
Running the unchanged sample showed the page, but the editor stayed **Locked**; the student could never reach the
Guided example or Your task.

## Root cause

Without the module's media uploaded, a media step is teacher-checked. The student run returned right after showing the
page (`if (teacherChecked) { ...; return; }`), before any check, so the sample (and guided example) were never verified
and the lock never opened. Their expected outputs end in `Media checks:` lines that only a run with the media can meet.

## Durable solution

On a teacher-checked step the run is checked against `withoutMediaChecks(step)`: the expected page text with the
`Media checks:` section removed, page-element checks unchanged. An unchanged sample with matching text is Sample
verified (on the device), the guided example likewise; the task is still marked done by the teacher (unchanged). A
reload keeps such evidence (`restoreModuleDraft` accepts either form). Uploading the media still switches the step to
full automatic checks.

## Regression proof

- `tests/module-activities.test.mjs`: `media steps without uploaded media: the unchanged sample and the guided example
  pass by page text alone (CKB-147)` — real Week 2 three-part Step 1; also wrong text, edited sample, task stays teacher's.
- `tests/module-device-store.test.mjs`: `module drafts: a media step's sample verified by page text alone survives
  reload; a wrong text does not (CKB-147)`.
- Shown failing with `withoutMediaChecks` returning the step unchanged and the restore rule removed; passing restored.
- Not tested in a real browser click-through (see the pull request).

## History

- 2026-11-25 — Teacher's screenshot from a .NET test class. Fixed on `fix/sample-lock-leftovers`.
