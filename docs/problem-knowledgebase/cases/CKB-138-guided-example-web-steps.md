# CKB-138 — Guided example refused on web (HTML/CSS) steps

- Status: resolved on `feature/web-guided-example`
- First recorded: 2026-11-24
- Last verified: 2026-11-24
- Area: module upload rules (`backend/src/course-module-schema.ts`), task completion route (`backend/src/routes.ts`)
- Search terms: guided example web step, works on Java steps only for now, .NET three-part, HTML guided example,
  Run the guided example before completing this task on a web step, Net MVC guided

## Symptom

The teacher wanted the .NET 1 resume weeks in three parts (sample, guided example, own task) like Java Weeks 15–17.
Uploading a web step with `activity.guided` was refused: "A guided example (activity.guided) works on Java steps only
for now".

## Root cause

Two Java-only limits. Upload refused `guided` on any step that was not Java. With that lifted, completion would still
fail: the completion route accepted guided evidence only as Java files, so a web page's guided proof was refused.
Everything else (order, page-text checking, preview and class-step ticks, offline web runs) already worked for web.

## Durable solution

Upload accepts `guided` on Java steps and web steps (all files `.html`/`.css`/`.js`, the existing `webStep` rule);
C# steps stay refused. The completion route checks guided evidence with web file rules when the step's files are web
files, the same as the sample evidence. Java is unchanged.

## Regression proof

- `tests/web-module-steps.test.mjs`: "guided example on web steps: upload accepts it on HTML and JavaScript steps,
  still refuses C#; Java is unchanged" — failed with the upload rule restored to Java only.
- Same file, offline real routes: "offline, a web step with a guided example completes only with guided page evidence
  (CKB-138)" — failed with the route's Java-only guided evidence restored, and with the upload rule restored.
- Same file: "sample, then guided, then the own task, each checked by page text; guided never completes" (rule only).
- `tests/web-guided.browser.mjs` (offline classroom settings, port 3072): student sample → guided → task; teacher
  preview ticks all three; class step shows and ticks the guided example. Not shown failing (needs a rebuild per break).
- `tests/module-guided.browser.mjs` offline: Java guided example unchanged.

## History

- 2026-11-24 — Built on `feature/web-guided-example` (Stage 1 of the .NET 1 three-part weeks).
