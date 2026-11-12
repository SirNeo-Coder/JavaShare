# CKB-117 — A web run's console.log lines were never shown unless its check failed

- Status: resolved (branch `feature/web-console-lines`)
- First recorded: 2026-11-12
- Last verified: 2026-11-12
- Area: page window — `app/webPreview.ts` (`webRunResult`), `app/WebStepRun.tsx` (`WebCheckList`, `WebConsole`), `app/StudentModuleActivity.tsx` (web personal projects)
- Search terms: console.log not shown, where is my console output, page window empty, JavaScript step shows nothing, console lines hidden, only a tick, .NET 2 Week 1, personal web project console

## Symptom

Found while preparing .NET 2 Week 1 (JavaScript, 2026-11-12). After **Run code** on a web module step, the page window
showed the page and **✓ Console output matches**, but never the lines `console.log` printed. They appeared only under
**Your output** when the check failed. A step whose run file is `index.html` never showed its console lines at all, and a
web personal project showed none either. A `.js` run file shows an empty page, so a passing JavaScript step showed nothing
the student had printed. Students must never use the browser's own console (CKB-085), so they had no way to see it.

## Root cause

`webRunResult` kept the console lines only as the compared output of a `.js` run, and the page window showed that output
only in the side-by-side comparison of a failed check. Nothing displayed the lines otherwise.

## Durable solution

- `webRunResult` also returns every console line (`lines`), whatever the run file. Checking is unchanged: a `.js` run
  file still compares the console lines, any other run file the page text.
- `WebConsole` shows a **Console** box with those lines under every web run: module steps (also the teacher's **Run** in
  **View module details**, which uses the same `WebCheckList`) and web personal projects, including the teacher's review.
  A page-text run that printed nothing shows no box, so HTML and CSS weeks look as before; a `.js` run that printed nothing
  says "Nothing was printed with console.log."
- A web personal project shows its results panel only when the run printed a line or raised an error. The first version
  always gave it an (empty) panel, which narrowed the personal page window from the full window to 798 px and turned
  Resume Week 9's and Week 10's `max-width: 900px` query on (CKB-112); `tests/web-module-steps.browser.mjs` caught it
  ("the personal project's page window is wider than the breakpoint at this browser size (798px)", Week 9 and Week 10
  personal subtests, offline settings). A personal page that prints lines now has a narrower page, like a module step.

## Regression proof

- `tests/web-module-steps.test.mjs` — "web console (CKB-117)": a passing `.js` run shows its lines in the Console box with
  no comparison; a page-text run shows its lines; a silent HTML page shows no box. Shown failing with the box removed from
  `WebCheckList`; restored, passes.
- Real app: `tests/web-module-steps.browser.mjs` walks .NET 2 Game Week 1 and checks the Console box after each `.js` task run
  (Steps 2–9), and its `.js` subtest checks the box on the teacher's **Run** and the student's run. Its Resume Week 9 and 10
  personal subtests failed against the first version (empty panel, 798 px) and pass after the fix.

## Recurrence triage

If console lines are missing again, first check that the run still reaches `webRunResult` with `lines`, then that the
results panel renders `WebConsole` (inside `WebCheckList` for module steps, in `webResults` for personal projects).
