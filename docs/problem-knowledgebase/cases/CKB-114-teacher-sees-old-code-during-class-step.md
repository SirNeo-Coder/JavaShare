# CKB-114 — Teacher saw a student's old code, not the class step they were typing in

- Status: resolved (branch `fix/class-step-live-help`)
- First recorded: 2026-11-12
- Last verified: 2026-11-12
- Area: teacher live help during a class session — `app/page.tsx` (`sendModuleSnapshot`, the `live` link on `StudentModuleActivity`, the **Live:** card), `app/liveText.ts` (`liveProjectKind`)
- Search terms: classroom mode student code stuck, teacher sees old code, code before classroom mode started, student live code editor in class session, Students / projects shows saved code, class step not live, shared step live help

## Symptom

Teacher report: in classroom mode, selecting a student in **Students / projects** showed the code the student
had before the class session started, not the code they were typing in the module step the teacher had open.

## Root cause

During a session the student works in the shared **Class step** (CKB-099/CKB-102), which is a `kind: "preview"`
project with `shared: true`. Teacher live help (2026-10-27) only sent a student's **Module project** or
**Personal project**: the `live` link was withheld from any preview, and `sendModuleSnapshot` sent "nothing open"
for a preview. The teacher's screen then fell back to the student's saved workspace files: their old code.
The class step was added after live help and the exclusion (meant for the teacher's own preview) caught it too.

## Durable solution

`liveProjectKind` (`app/liveText.ts`) decides what a student sends: module, personal, or the shared class step;
never a teacher's own preview or review. Both the `live` link and `sendModuleSnapshot` use it. The teacher's card
reads **Live: <name> · Class step · Week N · Step M**; the teacher's typing reaches the student's class step and,
like the class step itself, is never saved. Still only on the student's own one-person channel while selected.

## Regression proof

- `tests/teacher-live-help.test.mjs` — "teacher live help: a student's shared class step is sent; a teacher's own preview or review is not (CKB-114)" (rule on its own)
- `tests/class-step-live-help.browser.mjs` — "class step live help: the teacher sees and edits the class step a student is typing in, not their saved project"
  (real app, offline settings, local Supabase: session, Work in code editor shares, student types, teacher sees it live and not the saved "MY OWN EDIT",
  student's further typing arrives, teacher's typing reaches the student, nothing saved)
- Shown failing: `liveProjectKind` returning null for the class step failed both tests (browser: no **Live:** card; that broken run
  used a server without the laptop switch, which live help does not depend on); restored, both pass with full offline settings.
- Also passing on this build: `class-shared-step`, `class-session`, `session-step-done`, `teacher-live-help` browser tests; `npm test` 465/465.

## Recurrence triage

If the **Live:** card never appears, check the student sends `team:module-live` with `kind: "preview"` on its own
team channel after the teacher's `teacher: true` presence. If it shows a Module project instead, the student is not on
the class step (check `class:shared-step` / CKB-099).

## History

- 2026-11-12 — CodeRabbit on PR #106: late edits across a project switch (CKB-115) and a stronger saved-row check; fixed.

- 2026-11-12 — Teacher reported old code in classroom mode; approved showing the live class step. Built and tested.
