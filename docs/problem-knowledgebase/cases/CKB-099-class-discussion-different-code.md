# CKB-099 — Students had different code, or none, while the class discussed Week 15

- Status: resolved (Share with class); hosted migration pending
- First recorded: 2026-11-10
- Last verified: 2026-11-10
- Area: classroom module discussion — `app/page.tsx` (shared step), `app/StudentModuleActivity.tsx`, `app/ModuleWorkspace.tsx`, `backend/src/supabase-repository.ts`, `backend/src/routes.ts`, `classrooms.shared_module_id`/`shared_step_id`
- Search terms: students cannot open week 15 during discussion, not yet in that week, students opened different code, discuss module together, same default code as the teacher, reset student code, class discussion, follow the teacher, Share with class

## Symptom

Reported by the teacher after discussing Week 15 in class (no screenshot): some students could not
open Week 15 because they had not reached that week, and students who could open it had different
code from each other and from the teacher's screen.

## Root cause

Not a defect; the agreed rules worked as designed but had no class-discussion mode:

- Rolling prerequisites (CKB-060) block a module until every linked earlier week is finished.
- Week 15 is `sampleFirst`: **Work in code editor** restores a started step's saved edits, and
  opening a module resumes each student's own next unfinished step (CKB-058). Later steps are withheld.

So each student saw their own step and edits, or nothing.

## Durable solution

- The teacher's **Module preview** has **Share with class** / **Stop sharing**; the classroom header
  shows **Shared with class · Week N · Step M** with **Stop sharing**. The class's shared step is
  stored on `classrooms` (`20261110000100_classroom_shared_step.sql`); `PUT .../shared-step` is the
  class teacher only and checks the step exists.
- `GET /api/classes/:id/shared-step` gives any class member that step's sample fields and the
  module's starter files, never its task, whatever their progress. The rest of the module keeps its
  locks. The shared module's media is readable while shared (`enforceModuleMediaAccess`).
- `class:shared-step` only says the share changed; each member re-reads it (also on entering the
  class, focus and reconnect). Students switch to **Class step · Week N · Step M** (`kind: "preview"`,
  `shared: true`): editable, runnable, never saved, no progress. Their worksheet closes. The student's
  current work is saved first (a run in progress is waited for, on the device only).
- Stopping, or **Return to class project**, reopens the student's own module step or personal project
  through the normal opening path, unchanged.

## Regression proof

- `tests/class-shared-step.test.mjs` — "class step: a student's shared step opens for any role, is labelled, and never offers Save work" (rule on its own) and
  "class step: real routes share one step with every member past prerequisites, sample only, nothing saved" (real routes, local Supabase: teacher-only sharing,
  missing step/module 404, other teacher 403, outsider 403, payload without the task, module content still 403, media allowed only while shared, no progress written)
- `tests/class-shared-step.browser.mjs` — "Share with class: students behind and ahead get the same fresh step; Stop sharing returns their own work"
  (real app, offline settings, laptop Java: a student not yet in the week and a student with their own edits both get the identical sample, the worksheet closes,
  a run prints the edit, Stop sharing returns the second student to their own edits, nothing saved)
- Shown failing: route test with the payload or media exception broken; unit test with students refused previews; browser test with the student
  switch disabled, and again with the worksheet close removed (each rebuilt); all passed after restoring.
- `npm test` 430/430. Commit: branch `feature/class-shared-step`

## Recurrence triage

If students don't switch, check the class channel event and that `GET .../shared-step` returns the step for them.
If a student sees their own worksheet over the class step, check `closeSignal`. If the step opens for some
students but a media step lacks pictures, check `enforceModuleMediaAccess` and that the hosted migration is applied.

## History

- 2026-11-10 — CodeRabbit on PR #91 found late-reply, slow-save and stale-media gaps; fixed before merge (CKB-100).
- 2026-11-10 — Teacher asked for a current-module mode so every student gets the same default code as the
  teacher while discussing; approved Share with class with the recommended choices (button-started, students
  switch automatically, no completion credit). Built and tested.
