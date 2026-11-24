# CKB-142 — A line number in Your task pointed at the wrong line after the guided example

- Status: resolved on `content/dotnet1-week01-line-refs`
- First recorded: 2026-11-24
- Last verified: 2026-11-24
- Area: module content, `docs/modules/dotnet1/week01/DotNet1_Week_01.threepart.codeshare.json` (Step 3's Your task),
  printed step guide page 11
- Search terms: continuity, line number moved, element from line 16, wrong line after guided example, line shifts down,
  i instead of mark

## Symptom

Found while answering the teacher's "does this check continuity?". Week 1 Step 3's Your task said "the element from
line 16". The discussion counts lines in the sample, where line 16 holds `<mark>`. But the student has just typed the
guided paragraph on line 14, so in their editor that line is now 17, and line 16 holds `<i>Bayanihan</i>`. A student
counting in the editor could pick `i` instead of `mark`.

## Root cause

Your task now starts from the guided code (CKB-141), and inserting the guided line moves every line below it down. The
wording still counted lines in the sample, and no check compared a task's line number with the editor after the guided
example.

## Durable solution

Step 3 now says "the element on line 16 of the sample in the discussion". A test rule: every "line N" in Your task must
point at the same line in the guided page as in the sample, or at the guided line itself, unless the wording says
"of the sample". The reusable three-part prompt carries the same rule.

## Regression proof

`tests/dotnet1-week01-three-part.test.mjs` ("guided lines and answer-key lines sit where they say"): failed on the old
Step 3 wording ("line 16 moved after the guided example (sample: <mark>…; editor: <i>Bayanihan</i>…)"), passes now.

## History

- 2026-11-24 — Found and fixed on `content/dotnet1-week01-line-refs` (teacher approved).
