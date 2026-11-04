# CKB-090 — Week 15 personal task cannot keep its files between runs online

- Status: investigating, not fixed (needs a teacher decision)
- First recorded: 2026-11-05
- Last verified: 2026-11-05 (read in code, not run)
- Area: personal performance-task Java projects (`personalPathError` in `backend/src/supabase-repository.ts`), online Java runs
- Search terms: personal project data file, stock.txt cannot add, log does not grow on second run, data doubles, Make Your Program Remember, save and load next run, .txt in personal project

## Symptom

Found while changing the Week 15 personal performance task for CKB-089. The task asks students to
make a data file, run twice and see the log grow without the data doubling. No student has reported
it yet.

## Root cause

- A personal Java project accepts only `.java` files (`personalPathError` uses `JAVA_PATH`), so a
  student cannot add a data file such as `stock.txt`. CKB-088 allowed `.txt` in module steps only.
- Every online run starts with an empty folder (CKB-072), so files a program writes are gone by the
  next run. "Run twice: the log grows" and "the data must not double" cannot be seen online.
- Offline, the laptop runner refuses programs that use `java.io`.

Submitting still works: personal runs only need to finish without an error, and a missing data
file gives the example's polite "No stock yet" message.

## Durable solution

None yet. Options for the teacher: allow `.txt` files in personal Java projects (like CKB-088), keep
files written by a run in the project, or change the task's two-run checks for CodeShare.

## Regression proof

- None yet.

## Recurrence triage

If a personal Java program's saved or logged data is missing on the next run, check this case before
suspecting the student's code.

## History

- 2026-11-05 — Found while applying the CKB-089 content change; reported to the teacher.
