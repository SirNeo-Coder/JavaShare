# CKB-134 — Module editor refused every wording save (database key order)

- Status: resolved on `feature/module-editor-wording` before delivery
- First recorded: 2026-11-23
- Last verified: 2026-11-23
- Area: module editor wording check — `backend/src/module-wording.ts` (`onlyWordingChanged`)
- Search terms: Save changes refused, Only wording can change in the module editor, edit module wording 400,
  module editor rejects unchanged code, wording save fails

## Symptom

During development, **Save changes** in the module editor refused a change to one task's wording with "Only wording can
change in the module editor for now…", although nothing but wording had changed.

## Root cause

The check compared the saved module and the edited one as JSON text. The database (jsonb) stores a module's fields in
its own order, while the edited module kept the uploaded file's order, so the texts differed even with equal content.

## Durable solution

`onlyWordingChanged` blanks every wording field in both modules and compares them with their fields sorted, so field
order never matters. The real save path (upload, then save through the server and database) is tested.

## Regression proof

- `tests/module-editor.test.mjs`: "module editor: real wording save, refusals, earlier versions and restore leave student
  work untouched" — failed (400) before sorting, passes with it. The wording check itself was also broken on purpose
  (always true): "wording changes pass and everything else is refused" and the real-save test failed; restored, both pass.

## History

- 2026-11-23 — Caught and fixed on `feature/module-editor-wording` before the pull request.
