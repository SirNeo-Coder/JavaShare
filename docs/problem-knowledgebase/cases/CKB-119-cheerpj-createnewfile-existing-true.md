# CKB-119 — Online, createNewFile() on a file that already exists answers true

- Status: resolved in Week 15 content (CheerpJ's own behaviour remains)
- First recorded: 2026-11-15
- Last verified: 2026-11-15
- Area: online Java / CheerpJ browser runtime (`java.io.File#createNewFile`); Week 15 Step 1 task
- Search terms: Created again? true, createNewFile second time true, Week 15 Step 1 task never completes, File
  Handling module stuck at Step 1, create the file twice, online Java file differs from laptop Java

## Symptom

Found while building the three-part Week 15 file (branch `feature/guided-example`). Run through the real online
runner, the Week 15 Step 1 task answer (`java-2-w15-d1-s1-alter-v1`, create fleet.txt a second time) prints
`Created again? true`. Laptop Java prints `Created again? false`, which was the task's expected output. No student
report yet.

## Root cause

CheerpJ's own `java.io.File` returns true from `createNewFile()` even when the file was made a moment earlier in
the same run; real Java returns false. Like CKB-073 (`delete()` on a non-empty folder answers true), the call runs
inside CheerpJ's JRE, where CodeShare has no hook. Offline could not cover it either: the laptop runner blocks every
program that uses `java.io` (`backend/src/java-runner.ts`). So the task could not be completed online or offline,
and every later Week 15 step stayed locked behind it.

## Durable solution

Week 15 content must not expect `createNewFile()` to answer false for an existing file. Step 1's task now creates a
second, new file (trips.txt), which answers true on both runners, under a new id `java-2-w15-d1-s1-alter-v3`
(teacher, 2026-11-15; `-v2` is taken by the three-part file's different Step 1 task). The printed PDF/Word module
is corrected by the teacher by hand.

## Regression proof

- `tests/week15-java8.browser.mjs`, "Week 15 online: every sample and task answer gives its expected output in
  CheerpJ Java 8": runs all 10 samples and 10 task answers through the real runner.
- Command: `node --test tests/week15-java8.browser.mjs` with any page on localhost:3020 and `java-runtime/public`
  served on 3021 (`npx wrangler dev --port 3021`).
- Shown failing with the old task (`task 1: java-2-w15-d1-s1-alter-v1`, output `Created again? true`), passing
  21/21 with the fix; also 21/21 on the teacher's `Java2_Week_15.revised.codeshare.json`.

## Recurrence triage

If a file-handling task passes on the laptop but not online, check CKB-072 (old files kept between runs: `Folder made?
false`), CKB-073 (folder delete), CKB-089 (append mode) and this case (`createNewFile` on an existing file). Run
`tests/week15-java8.browser.mjs` (or a copy for the week in question).

## History

- 2026-11-15 — Seen while running every Week 15 three-part answer online. Fixed in the Week 15 module on
  `fix/week15-step1-createnewfile` with the teacher's approval.
