# CKB-090 — Week 15 personal task cannot keep its files between runs online

- Status: resolved locally (online); offline still blocked by the laptop runner's file rule
- First recorded: 2026-11-05
- Last verified: 2026-11-05
- Area: personal performance-task Java projects (`personalPathError` in `backend/src/supabase-repository.ts`, personal **＋**/rename in `app/StudentModuleActivity.tsx`), Week 15 personal task text
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

Teacher decision (2026-11-05, plan A):

- `personalPathError` accepts Java paths and safe `.txt` names (`javaProjectPath`, the same rule as
  CKB-088). Save, run, **Submit this version**, review and carry-forward keep `.txt` files like Java
  files; the online run already passes them to the program.
- In a personal Java project, **＋** and rename accept `.txt`; a new `.txt` file opens empty, with no
  class template, and the dialog says "Add another class, or a .txt data file". The module project
  stays Java-only apart from the files a step supplies.
- Week 15's personal task: step 3 says to add the data file with **＋**; the testing tip, steps 7, 8 and
  12 say every CodeShare run starts from the saved tabs, so a "second run" puts old lines in the log
  and data file tabs. Rule recorded in `AGENTS.md`.
- Files a program writes during a run are still not kept (option C, not approved). Offline still
  refuses `java.io`.

## Regression proof

- `tests/java-data-files.test.mjs`: `data files: a personal Java project keeps a .txt data file
  through save, run, submit and review (CKB-090)` — save with `stock.txt` succeeds, `../stock.txt`
  is refused, Submit needs a successful run of the exact saved files, and the teacher's review
  returns `stock.txt`. Failed with `main`'s `supabase-repository.ts`, passed restored.
- Command: `node --test tests/java-data-files.test.mjs`
- Real app, local online mode (`next dev`, local runner page, real CheerpJ, local Supabase,
  disposable accounts deleted afterwards): **＋** created `stock.txt` (plain-text tab); the sari-sari
  example printed `Skipped bad line: Rice (kg),fifty` / `Stock saved: {Bread=8, Softdrink=24}`;
  **Save work**, **Submit this version** worked; the teacher's **Review personal submission**
  showed the `stock.txt` tab read-only.
- Not run: the hosted site; next week's carry-forward of a `.txt` file in the browser.

## Recurrence triage

If a personal Java program's saved or logged data is missing on the next run, check this case before
suspecting the student's code.

## History

- 2026-11-05 — Found while applying the CKB-089 content change; reported to the teacher.
- 2026-11-05 — Teacher approved plan A: allow `.txt` in personal Java projects and reword the
  two-run checks. Branch `feature/personal-txt-files`, commit `1645c70`, PR #80.
