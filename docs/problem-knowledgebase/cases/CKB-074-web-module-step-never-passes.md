# CKB-074 — Web module steps (HTML, CSS, JavaScript) can never pass

- Status: resolved (local tests and offline browser checks)
- First recorded: 2026-10-28
- Last verified: 2026-10-28
- Area: Net MVC web modules — `backend/src/supabase-repository.ts`, `backend/src/routes.ts`, `backend/src/module-activities.ts`, `app/StudentModuleActivity.tsx`, `app/ModuleViewer.tsx`, `app/ModuleWorkspace.tsx`, `app/page.tsx`
- Search terms: web step never passes, HTML module stuck at 0%, next part never opens, Automatic activity checking currently supports Java only, Net MVC module progress, DotNet1 Week, webChecks dropped on upload, mediaChecks missing

## Symptom

In a Net MVC class, every HTML/CSS/JavaScript module step showed "Automatic activity checking
currently supports Java only." The **Module project** button did not open web steps, no step could
reach "pass", so parts, the performance task and the next week never opened and progress stayed 0%.
Uploaded `webChecks`, `mediaChecks` and `includeMediaOutput` were silently dropped.

## Root cause

Every layer assumed Java: three repository refusals on `step.language !== "java"`, completion and
run routes that accepted only `.java` file names and only browser results from the online Java
runner, Java-only filters on the worksheet and Module project buttons, and a Java-only module editor.
The upload schema (zod) strips unknown step fields, so the web/media check fields vanished.

## Durable solution

- A step is a web step when all its files end `.html`/`.css`/`.js` (`webStep`); `checkableStep`
  lets Java or web steps through. Web steps run in the browser preview online and offline and
  complete through `POST .../progress/complete`, which accepts web paths (`moduleWebPathError`)
  and skips the Java runner refusals only for web files. The repository requires the step's own
  kind of files, so Java steps cannot be completed with web files.
- Page text / console output rule: `webPageOutput`/`webRunResult` in `app/webPreview.ts`;
  comparison stays `matchesActivityOutput`.
- Web paths keep `src/` (`sourcePath`), and Java's `expectedError` never applies to web steps.
- Steps with a `Media checks:` section are refused by completion and passed by the teacher's
  **Mark done** (`markSupabaseTeacherCheckedStep`).
- Schema keeps `webChecks`, `mediaChecks`, `includeMediaOutput` as optional fields.

## Regression proof

- `tests/web-module-steps.test.mjs` (`node --test tests/web-module-steps.test.mjs`, local Supabase):
  "web steps offline (real routes): web completions are accepted, media steps wait for the teacher,
  Java is unchanged" and the rule/render tests in the same file.
- Shown failing: restoring the old repository refusal failed 4 route subtests (11/16 pass); applying
  the offline Java refusal to web files failed 5 (incl. the Java subtest); ignoring uncaught errors
  failed 2 rule tests; merging web `src/` like Java failed 1. Each restored: 16/16.
- `tests/web-module-steps.browser.mjs` against an offline-settings production build with the
  teacher's real Week 1–3 files: 9/9.
- Commit: see branch `feature/web-module-steps`.

## Recurrence triage

If a web step shows a cross, compare **Required output** with **Your output** first: Week 1's files
before 2026-10-29 put the page text on the title line (`Visible page text: ...`), which the agreed rule
never produces; the revised Week 1 file and printed module have the line break (re-upload if an old copy is in use).
A step that shows "Checked by your teacher for now" waits for the teacher, not a bug. Indented raw
source text in **Your output** is CKB-075. A student still locked after **Mark done** is CKB-076.

## History

- 2026-10-29 — Teacher's Week 1 files revised (JSON and printed module, pp. 1–6): all 8 expected outputs
  now have a line break after `Visible page text:`, taken from real runs; the teacher's checker fails
  the old one-line outputs and passes the new ones (`Week_01_Verification.md` in the teacher's folder).

- 2026-10-28 — Slice 1 of 3 (daily web module steps). Teacher decisions in the prompt; recommended
  answers approved for the walk-through week, media steps, `.txt` files and `.js` run files.
