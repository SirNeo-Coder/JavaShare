# CKB-113 — Preview sample code could not compile a sample that uses a supporting class

- Status: resolved
- First recorded: 2026-11-11
- Last verified: 2026-11-11
- Area: teacher module worksheet — `app/ModuleViewer.tsx` (`StepView`, `runnableFiles`)
- Search terms: cannot find symbol class Vehicle, Preview sample code Run fails, teacher worksheet sample does not compile, 2 errors, supporting class missing in preview, answer key run fails

## Symptom

Found while checking the teacher-only answer key (2026-11-11). In the worksheet's teacher-only
**Preview sample code**, pressing **Run** on a step whose sample uses a class supplied by the
module's supporting files printed `error: cannot find symbol  symbol: class Vehicle ... 2 errors`
instead of the step's sample output. The same code runs correctly in **Work in code editor**.

## Root cause

`StepView` sent only the step's own `files` to the runner. A module's supporting classes live in
the module's `starterFiles`, which the preview never included, so any sample that extends or calls
a supporting class failed to compile. Student runs were never affected: a student's run goes
through the Module project, which merges supporting files server-side.

## Durable solution

`runnableFiles(support, files)` adds the module's `starterFiles` to what the preview run sends,
leaving out any path the step itself supplies, and the editable boxes keep showing only the step's
own files. Both worksheet and paged views pass `support={module.starterFiles ?? []}`.

Known ceiling (marked `ponytail:` in the code): only the module's starter files are added, not
classes a previous step introduced. A sample that depends on an earlier step's new class still
needs **Work in code editor**.

## Regression proof

- `tests/classroom-ui.test.mjs` — "module worksheet: a sample preview run carries the module's
  supporting classes (CKB-113)": `runnableFiles` adds the supporting class, keeps the step's own
  copy of a shared path, and preserves order. Shown failing with the merge removed.
- Real app (local Supabase, `npm run dev`): teacher worksheet → Step 1 → **Answer key (teacher
  only)** → **Load answer into Preview sample code** → **Run** printed `Capacity: 25`; before the
  fix the same click printed `cannot find symbol: class Vehicle`.
- Commit: branch `feature/module-answer-key`
