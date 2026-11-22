# CKB-133 — Class session loses the class module while the teacher works in the code editor

- Status: resolved on `fix/session-module-sync`
- First recorded: 2026-11-20 (reported again 2026-11-23)
- Last verified: 2026-11-23
- Area: class session follow, Share with class, module prerequisites, refresh
- Search terms: students not sync to the module and step the teacher is in, refresh lands outside the module, not able
  to open step because of prerequisite, active class rule overrules prerequisites, students not locked to Week 15

## Symptom

Online, in the real class with three-part Week 15: students were not kept on the teacher's module and step. After a
refresh they landed outside it, and opening the step was refused by the Week 14 prerequisite.

## Root cause

Students follow the teacher's open worksheet page (`session_page`). **Work in code editor** closes that worksheet, so the
page report becomes `null` (CKB-108). From then on `classSessionFollow` returned nothing, so module reads went back to
`enforceStudentModuleAccess`: the class step stayed in the editor, but **Module** showed the student's own weeks and the
class module was locked for students behind. Reproduced locally (offline): refresh with the worksheet open or on the class
step worked; opening Module while the teacher coded did not.

## Durable solution

`sessionFollow` in `backend/src/supabase-repository.ts`: with no worksheet page, a running session follows the shared step
(`page: "step:<id>"`, `shared: true`). Both the session read and module access use it, so the class module opens past
prerequisites up to that step. `ModuleWorkspace` selects that module without opening the worksheet over the class step;
`ModuleViewer` resolves `step:<id>` to the step's page. Every shared-step re-read also re-reads the session. End session
still restores prerequisites.

## Regression proof

- `tests/session-shared-follow.browser.mjs` (offline): a student behind on the prerequisite gets the class step, opens
  Module at the shared step with page buttons off and no access notice, refreshes and gets both again; the server returns
  the module (200) during the session and 403 after End session. With the fallback disabled and rebuilt: failed; restored:
  passed.
- `class-session`, `class-shared-step`, `session-step-done`, `sample-lock-notice`, `class-step-live-help`,
  `teacher-live-help` browser tests pass.

## History

- 2026-11-23 — Fixed on `fix/session-module-sync`.
