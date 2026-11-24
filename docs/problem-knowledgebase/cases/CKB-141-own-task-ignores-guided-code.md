# CKB-141 — Week 1 own tasks ignored the guided code still in the editor

- Status: resolved on `content/dotnet1-week01-own-from-guided`
- First recorded: 2026-11-24
- Last verified: 2026-11-24
- Area: module content, `docs/modules/dotnet1/week01/DotNet1_Week_01.threepart.codeshare.json` (own-task wording),
  printed step guide (pages 9–17)
- Search terms: code editing continuity, own task did not say delete the skill, guided line still in editor, Your task
  output ignores guided example, add goal but skill still there, start from guided code

## Symptom

The teacher found in .NET 1 Week 1, Monday Step 2: Your task said "Add a third goal", but its Expected task output was
the sample plus the goal only. After Guided example verified the student's code still holds the guided skill line, so a
student who followed the wording got skill and goal and failed. Nothing told them to take the skill out. Every one of the
9 steps had the same gap; Step 7 even said "Leave line 9 as it is" after the student had repaired line 9.

## Root cause

The three-part file (CKB-138 Stage 2) built each own task as "the sample plus a different change, instead of the guided
change" (like Java Week 17's outputs), but the .NET wording said "add …" as if starting from the sample, while CodeShare
keeps the guided code in the editor ("Your code stays in the editor").

## Durable solution

Teacher's choice (2026-11-24): each own task starts from the guided code. Every Your task now says what to do with the
line added in the guided example (change it, move it, take it out, undo the repair, swap). Expected outputs, answer
keys, line numbers and the `-v2` question ids are unchanged, because what each task must produce did not change.

## Regression proof

- `tests/dotnet1-week01-three-part.test.mjs`: for every step, the edits the wording describes (`fromGuided` in
  `tests/fixtures/dotnet1-week01-three-part-edits.json`), applied to the guided page, give the own-task answer page, and
  the wording mentions the guided code. Failed with Step 2 following the old wording (goal added, skill kept).
- `tests/dotnet1-week01-three-part.browser.mjs`: a student in real CodeShare changes the code left after the guided run
  and gets Completed on all 9 steps, offline and online settings.
- The printed step pages carry the new wording (same test file).

## History

- 2026-11-24 — Reported by the teacher; fixed on `content/dotnet1-week01-own-from-guided`.
