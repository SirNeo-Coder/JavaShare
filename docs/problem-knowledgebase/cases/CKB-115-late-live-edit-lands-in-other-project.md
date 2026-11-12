# CKB-115 — A late live-help edit could land in the project a student had just switched to

- Status: resolved (branch `fix/live-help-activity-label`)
- First recorded: 2026-11-12
- Last verified: 2026-11-12
- Area: teacher live help — `app/page.tsx` (`team:module-live`, `team:module-operation`), `app/StudentModuleActivity.tsx` (`applyEdit`), `app/liveText.ts` (`liveActivityKey`)
- Search terms: teacher typing appears in wrong project, stray text in student's own code after Stop sharing, live help edit after switching project, module project changed by teacher after class step, CodeRabbit PR #106

## Symptom

Found by CodeRabbit (PR #106 review, outside-diff Major finding), not seen in class. If the teacher's typing in a
student's live project is still on its way when the student switches project (Stop sharing returns them from the
class step; or Module project ↔ Personal project), it could be typed into the newly opened project's file with the
same name. The student's Save work or a successful run would then keep it.

## Root cause

A live edit carried only the file name (e.g. `Main.java`) and a position. The student's screen applied it to
whichever project had that file open, without checking which project the edit was made for. Present since teacher
live help (2026-10-27) for Module ↔ Personal switches; CKB-114 added the class-step switch.

## Durable solution

Every live snapshot and edit carries its project label, `liveActivityKey` (kind, module and step). The student's
open editor (`applyEdit`) refuses an edit labelled for another project; the teacher's view ignores student edits
labelled for a project other than the one it is showing. The teacher takes the label from the student's snapshot.

## Regression proof

- `tests/teacher-live-help.test.mjs` — "teacher live help: each open project has its own label, so a late edit for the class step never fits the student's own project (CKB-115)" (rule on its own)
- `tests/class-step-live-help.browser.mjs` — real app, offline settings: after Stop sharing, a captured teacher class-step edit is replayed
  over the live connection; the student's own Main.java stays exactly as it was. It also compares the student's whole saved row
  (files, step progress, personal project) before and after (CodeRabbit nitpick on PR #106).
- Shown failing: with the label check removed from `applyEdit`, the replayed edit turned `"MY OWN EDIT: "` into `"Teacher help + …`
  in the student's own project; restored, it passes.

## Recurrence triage

If teacher typing stops reaching a student at all, check both screens send and expect the same label (an old cached
page sends none). If stray text appears in a group project, that is the group channel (`team:file-operation`), not this.

## History

- 2026-11-12 — CodeRabbit on PR #106 (merged before checking); teacher approved the fix. Built and tested.
