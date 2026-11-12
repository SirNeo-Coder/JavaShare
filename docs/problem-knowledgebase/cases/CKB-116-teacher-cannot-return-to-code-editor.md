# CKB-116 — After opening a student, the teacher could not get back to their Work in code editor

- Status: resolved (branch `fix/teacher-back-to-code-editor`)
- First recorded: 2026-11-12
- Last verified: 2026-11-12
- Area: teacher classroom view — `app/page.tsx` (`teacherPreview`, the **Students / projects** click, `chooseTeam`, team header), `app/StudentModuleActivity.tsx` (`files` on the editor handle)
- Search terms: cannot go back to work in code editor, lost my code after opening a student, have to reopen module and click work in code editor again, shared step editor closed, teacher edits gone after viewing student

## Symptom

Teacher report: after opening a student in **Students / projects**, there was no way back to the **Work in code editor**
being shared; the teacher had to open **Module** and press **Work in code editor** again, which also lost their edits.

## Root cause

Selecting a student closes the teacher's own editor (`setModuleActivity(null)`) so the student's project can show, and
nothing kept it. The teacher's preview is never saved, so its edits were gone too. Reselecting the same student also
cleared their live view, and the student never resent it (the teacher's watching presence had not changed).

## Durable solution

- Before closing it, the teacher's preview is kept in memory with its current files (`teacherPreview`); never saved.
- **Back to Week N · Step M** next to the workspace title reopens it exactly as it was. It is in the title column because the
  header grid has three columns: a fourth item wrapped out of sight and hid **Stop sharing**.
- Reselecting the same student keeps their live project, which kept updating in the background. Closing the
  teacher's own editor no longer clears the hidden copy behind that view (the cleanup is for a student's own editor only),
  so the view stays live both ways rather than freezing (CodeRabbit on PR #108).
- Students are not touched: no re-share, their class step is not reset.

## Regression proof

- `tests/class-step-live-help.browser.mjs` — real app, offline settings: the teacher edits their copy, opens a student, presses
  **Back to Week 60 · Step 1** and finds their edit; the student's class step is unchanged; the student types meanwhile and selecting
  them again shows it live; their next typing reaches the teacher and the teacher's typing reaches them.
- Shown failing: keeping the copy without the teacher's files ("the teacher's own edits are back"); clearing the live view on
  reselect (the **Live:** card never returned); clearing the hidden copy when the teacher's editor closed (the student's
  "After return" typing never arrived). Restored: passes.
- Display-only check: screenshot of the header shows **Back to Week 60 · Step 1**, **End session** and **Stop sharing** on one row.

## Recurrence triage

If the button is missing, check `teacherPreview` is set in the **Students / projects** click (preview only, teacher only). If the
student's live card is blank after going back and forth, check `chooseTeam` keeps live state for the same team.

## History

- 2026-11-12 — CodeRabbit on PR #108 (Major, valid): the reselected view froze; fixed with the teacher's approval.

- 2026-11-12 — Teacher reported it while testing CKB-114, then asked to keep their edits; approved. Built and tested.
