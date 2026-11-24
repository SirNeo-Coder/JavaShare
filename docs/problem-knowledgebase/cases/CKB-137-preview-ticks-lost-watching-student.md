# CKB-137 — Preview ticks lost after watching a student

- Status: teacher side resolved on `fix/preview-ticks-kept`; student side not reproduced
- First recorded: 2026-11-24
- Last verified: 2026-11-24
- Area: teacher Module preview (Work in code editor), Students / projects live help, practice ticks (CKB-131)
- Search terms: sample and guided check cleared, ticks cleared after error, ○ Sample ○ Guided ✓ Your task,
  checks reset in live classroom, runtime error clears checks

## Symptom

In the live classroom the teacher ticked **Sample, unchanged code** and **Guided example**, then ran the task with a
runtime error. After fixing the code, the correct run showed ○ Sample ○ Guided ✓ Your task. The page did not reload and
the code stayed. The teacher reported the same on a student's class step, with the student clicking nothing.

## Root cause

The ticks live only in the open editor. Selecting a student in **Students / projects** closes the teacher's editor;
**Back to Week N · Step M** reopens it from a saved copy that kept the code (CKB-116) but not the ticks.

Not the error run: in real browsers, offline (laptop Java) and online (local CheerpJ runner), a runtime or compile error
kept both ticks on the teacher's preview and the student's class step. Selecting a student did not touch the student's
ticks either. The student-side report is not explained yet.

## Durable solution

The saved copy also carries the ticks (`practicePassed`), and the reopened editor starts from them. Still on this page
only: never saved, reset by a reload.

## Regression proof

- `tests/session-step-done.browser.mjs` (offline): teacher selects Ben, clicks **Back to Week 60 · Step 1**, ✓ Sample
  is still there and Ben's ticks are unchanged. Failed with the fix removed ("the teacher's sample tick survives
  watching a student"), passed restored.

## History

- 2026-11-24 — Teacher side fixed on `fix/preview-ticks-kept`. Student side: no cause found; needs the device, browser
  and exact steps if it happens again.
