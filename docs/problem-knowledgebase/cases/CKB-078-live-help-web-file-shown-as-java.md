# CKB-078 — Teacher live help shows a student's web file as Java

- Status: resolved (offline browser check)
- First recorded: 2026-10-29
- Last verified: 2026-10-29
- Area: `app/page.tsx` teacher live help view (**Students / projects** → student)
- Search terms: live help says Java on HTML, teacher sees index.html coloured as Java, Net MVC live help wrong editor, Live student project Java label on web page

## Symptom

Found while planning Slice 2 (web personal projects), by reading the code: when the teacher selects a
Net MVC student in **Students / projects**, the live view's heading always says **Java** and the
editor colours `index.html` as Java, for web module steps (Slice 1) and web personal projects.

## Root cause

The live view was built for Java-only module work: its label and `language="java"` were fixed
values. Slice 1 made web steps reach that view without changing it, and no test looked at the
teacher's live view of a web file.

## Durable solution

The live view takes both the label and the editor language from the open file's name
(`fileLanguage(studentLiveView.path)` from `backend/src/file-paths.ts`): **Web page** and HTML/CSS/
JavaScript colouring for web files, **Java** otherwise.

## Regression proof

- `tests/web-module-steps.browser.mjs`: "Week 2 personal performance-task project (Slice 2): …" —
  the teacher selects the student and sees **Web page** with the HTML source code editor.
- `node --test --test-reporter=spec tests/web-module-steps.browser.mjs` on an offline-settings
  build (port 3042).
- Shown failing: with the fixed `Java`/`language="java"` restored and rebuilt, the subtest failed
  (`actual: 'Java', expected: 'Web page'`); restored and rebuilt: 11/11.
- Java live help unchanged: `tests/teacher-live-help.browser.mjs` 7/7 offline.

## Recurrence triage

`.txt` reference files still show **Java** (known limit of `fileLanguage`). If an `.html` file shows
**Java**, check the path the student's screen sends (`live.onFile`) before the view.

## History

- 2026-10-29 — Found and fixed in Slice 2 (`feature/web-personal-project`).
