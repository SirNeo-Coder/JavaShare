# CKB-130 — Sample-first editor lock is not obvious, so students and teacher think typing is broken

- Status: resolved on `fix/obvious-sample-lock`
- First recorded: 2026-11-20
- Last verified: 2026-11-20
- Area: module project editor (sample-first), teacher live help view
- Search terms: student can't type, could not edit editor, cannot type anything, teacher cannot edit student code,
  eventually able to edit, read-only editor, locked editor, Week 15 online

## Symptom

Online, during class with three-part Week 15, students said they could not type. The teacher, watching a student in
**Students / projects**, could not type either; after some back and forth both could.

## Root cause

Not a defect in the lock (CKB-054, agreed sample-first rule): a sample-first step's editor is read-only until the
unchanged sample runs, and every run keeps it read-only until it finishes (online, loading Java can take a while).
The only explanations were the Console panel text and a small status line under the teacher's editor.
Reproduced locally offline: following, class step and typing all worked; the lock was the only read-only state.

## Durable solution

`editorLockNote` in `app/StudentModuleActivity.tsx` shows a bold line in the editor itself: **🔒 Locked — press ▶
Run code to check the sample first. Then you can edit.** or, during a run, **⏳ Loading Java or running — the editor
unlocks when the run finishes.** The teacher's live view shows **🔒 Locked — the student must press ▶ Run code to check
the sample first. Then you both can edit.** CSS gives the notice its own grid row
(`.editor-card:has(> .editor-lock)`). The lock rules are unchanged.

## Regression proof

- `tests/module-run-feedback.test.mjs`: "editor lock: sample-first and running say why the editor is read-only; an
  open editor says nothing" — failed with the notice removed, passed restored.
- `tests/sample-lock-notice.browser.mjs` (offline, laptop Java): notice on the student's screen and in the teacher's
  live view, one short line each; both disappear after Sample verified and the editor is editable.

## History

- 2026-11-20 — Notice added on `fix/obvious-sample-lock` (teacher chose "make the lock obvious" over removing it).
