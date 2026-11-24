# CKB-143 — Java Weeks 15 and 17: Your task ignored the guided code still in the editor

- Status: resolved on `content/java-own-from-guided`
- First recorded: 2026-11-25
- Last verified: 2026-11-25
- Area: module content, `docs/modules/week15/Java2_Week_15.threepart.codeshare.json` and
  `docs/modules/week17/Java2_Week_17.threepart.codeshare.json` (own-task wording), Week 17 printed module (pages A-2,
  A-8, A-9, A-10, A-14)
- Search terms: Java three-part, own task ignores guided code, add the same sign twice, put the bus back, Not a number
  stays, worker on the EDT stays, ZZZ 999 twice, newlines++ still there, start from guided code

## Symptom

Found when the teacher asked to check the Java three-part weeks against CKB-141. After **Guided example verified** the
student's code stays in the editor, but 7 of 30 own tasks were worded as if starting again from the sample, while their
expected output is the sample plus the own change only. A student who followed the words failed:

- Week 15 Step 3: `newlines++;` stays, so line breaks are still counted (and nothing said where to count the space).
- Week 15 Step 8: "Keep the old Tricycle line", but the guided example had deleted `out.write(old);`.
- Week 17 Step 1 / Step 10: "Add the same sign / plate" adds a second copy (4 controls, 6 plates).
- Week 17 Step 5 / 6 / 7: the guided change (Not a number, bus 8 km, worker on the EDT) stays in the output.

Week 16 already started every own task from the guided code ("Keep…", "Put … back").

## Root cause

Same class as CKB-141: the Week 15 and Week 17 three-part files built each own task as "the sample plus a different
change", worded from the sample, and no check applied the own task to the guided code.

## Durable solution

Teacher approved (2026-11-25) new wording for the 7 tasks; each says what to do with the guided change (move it, put it
back, take it out). Expected outputs, answer keys and task ids are unchanged. The Week 17 printed module (five pages) and Word
lesson plan (five own-task lines) carry the new wording. Week 15's printed module prints no own tasks.

## Regression proof

- `tests/week17-three-part.test.mjs` ("guided lines and answer-key lines sit where they say") and
  `tests/week15-week21-modules.test.mjs` ("Week 15 three-part: guided lines and Your task's line numbers…"): the edits the
  wording describes (`fromGuided` in `tests/fixtures/week17-three-part-edits.json` and the new
  `tests/fixtures/week15-three-part-edits.json`), applied to the guided code, give the own-task answer. Shown failing with
  Week 17 Step 1 and Week 15 Step 3 following the old wording.
- Same tests, CKB-142's rule for Java: every "line N" in Your task names the same line in the guided code as in the sample,
  or a guided line. Shown failing with "count a space on line 14" in Week 15 Step 3 (the guided lines move line 14).
- `tests/week15-week21-modules.test.mjs` ("Week 15 three-part: sample, guided example and own task give their exact
  output…"): all 10 Week 15 samples, guided examples and own answers run alone through the CodeShare Java bridge.

## History

- 2026-11-25 — Found on the teacher's request after CKB-141; fixed on `content/java-own-from-guided` (teacher approved).
