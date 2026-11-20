# CKB-129 — Class session step count ignores online status and class-step runs

- Status: resolved on `fix/session-step-done-online`
- First recorded: 2026-11-20
- Last verified: 2026-11-20
- Area: class session bar, Step N · X/Y done, presence on the class live channel
- Search terms: done student not counting, 0/20 done, Nobody yet, students already did the step, step count wrong,
  count only online students

## Symptom

In the real class, with three-part Week 15 Step 1 shared, the bar showed **Step 1 · 0/20 done** and **Nobody yet**,
though students had done the step.

## Root cause

Two things. (1) The count read only saved `task:<activity id>` passes. Three-part Week 15 Step 1 is task
`java-2-w15-d1-s1-alter-v2` (fares.txt); the class had earlier passed `alter-v1`/`alter-v3` (trips.txt), a different
exercise by the agreed rule. (2) Class-step runs are never saved, so passing during the session could not count.
It also listed offline students.

## Durable solution

Teacher's rule (2026-11-20): count only students online now; Done = a saved pass or a matching class-step run. The
server returns `{ id, name }` for each student. A student whose class-step run matches calls `onPracticePass`, which
re-tracks presence on `class:<id>` with `done: ["moduleId:stepId"]`. `onlineStepDone` in `app/SessionStepDone.tsx`
keeps online students and adds those marks. Nothing is written to the database. Limits: a reload clears the mark
until the student runs correctly again; browser tools could fake it (practice only, accepted).

## Regression proof

- `tests/session-step-online.test.mjs`: "session step count: only online students, saved passes and this step's
  class-step runs" — failed with the online filter removed, passed restored.
- `tests/session-step-done.test.mjs`: real routes return ids.
- `tests/session-step-done.browser.mjs` (offline): 0/2 → 1/2 on Ana's saved pass → Ben's differing run leaves 1/2 →
  his matching class-step run makes 2/2 with nothing saved → Ana closes her page → 1/1.

## History

- 2026-11-20 — Fixed on `fix/session-step-done-online`.
