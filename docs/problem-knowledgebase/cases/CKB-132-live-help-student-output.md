# CKB-132 — Teacher live view shows a student's code but not their output

- Status: resolved on `feature/live-student-output`
- First recorded: 2026-11-20
- Last verified: 2026-11-20
- Area: teacher live help (Students / projects), class step, team module live channel
- Search terms: see the console and output of student, student output when I click them, not just their code,
  LIVE STUDENT VIEW console empty, Ready click Run to compile Main.java in live view

## Symptom

Watching **Abucay, Jhon** on the class step, the teacher saw the student's code but the right panel was the teacher's
own empty console ("Ready — click Run to compile Main.java"), not the student's output or result.

## Root cause

Not a regression: teacher live help (2026-10-27) sends only the open file, edits and cursors on `team:module-*`. The run
output and result stayed on the student's device.

## Durable solution

`StudentModuleActivity` reports `{ output, status, result, tone, checks }` through `live.onRun` whenever it changes (web:
error plus output). `page.tsx` keeps the latest in `moduleRunRef`, broadcasts `team:module-run` only while
`shareModuleLive` allows (teacher selected), and resends it after each snapshot. The teacher's right panel becomes
**Live output: <name>** with status, result box and **Actual output**. Output capped at 20,000 characters; nothing saved.

## Regression proof

- `tests/sample-lock-notice.browser.mjs` (offline): after the student's sample run, the teacher's panel shows
  `Capacity: 20` and a green **Sample verified** box. Rebuilt with the sending removed: failed; restored: passed.
- `teacher-live-help`, `class-step-live-help`, `session-step-done` browser tests still pass.

## History

- 2026-11-20 — Added on `feature/live-student-output`.
