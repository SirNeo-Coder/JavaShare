# CKB-124 — Guided code shows grey bars; Week 15 Step 1 note says a second run returns false

- Status: resolved on `fix/week15-guided-display`
- First recorded: 2026-11-15
- Last verified: 2026-11-15
- Area: `app/ModuleViewer.tsx` worksheet guided example; Week 15 module files (Step 1 `checkYourself`, three-part discussion)
- Search terms: grey bars in guided code, guided example code highlighted, indentation grey, discussion points out of
  order, line 9 after line 10, Run Step 1 a second time, createNewFile refuses returns false, Exists before? false again

## Symptom

The teacher's test class (teacher and student views) showed the worksheet's guided code with grey bars in its
indentation, unlike **Sample code**. Week 15 Step 1's discussion listed "Look at line 10" before "Look at line 9". The
Step 1 note said a second run finds fleet.txt already there and `createNewFile()` returns **false**.

## Root cause

- The guided code was a bare `pre code`, so it got the single-word `code` highlight; Sample code sits in
  `.printed-sample`, which clears that background.
- The three-part file's Step 1 points were written in teaching order, not line order.
- The note predates CKB-072/CKB-088: every CodeShare run starts in an empty folder, so a second run again shows
  `Exists before? false` and `Created now? true`.

## Durable solution

The guided code renders inside `.printed-sample` like Sample code. Discussion points stay in line order. The note now
says each CodeShare run starts in an empty folder and what a computer that keeps its files would show instead.

## Regression proof

- `tests/module-guided.browser.mjs`: the worksheet check now requires the guided code inside `.printed-sample` with no
  background; shown failing without the fix ("the guided code is boxed like Sample code"), passing with it.
- `tests/week15-week21-modules.test.mjs`, "Week 15 three-part: only tasks differ from the module; discussion lines are
  real and in order"; fails on the previous three-part file.
- The note is text only; no automatic check.

## Recurrence triage

Grey highlight inside a code box means it is missing a box class such as `.printed-sample`. A Week 15 text that says
a file "is already there" from an earlier run is wrong in CodeShare (CKB-072).

## History

- 2026-11-15 — Teacher tried the three-part Week 15 in a test class; approved all three fixes.
