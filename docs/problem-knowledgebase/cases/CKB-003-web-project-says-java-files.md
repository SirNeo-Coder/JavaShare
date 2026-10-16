# CKB-003 — Web project sidebar said "3 Java file(s)"

- Status: resolved
- First recorded: 2026-10-16
- Last verified: 2026-10-16
- Area: web projects (stage one PR b), Current assignment card in the sidebar, `app/page.tsx`
- Search terms: Java file(s), web project file count, Repository count wrong, sidebar says Java

## Symptom

After pressing **New web project**, the sidebar's Repository box said "3 Java file(s)", although the files were index.html, style.css and script.js. Found during the offline-mode test.

## Root cause

The label was written as "Java file(s)" when every project was Java, and the web workspace change didn't update it.

## Durable solution

The label says "web file(s)" for web projects and "Java file(s)" otherwise. When adding a project language, search `app/page.tsx` for "Java" labels that describe the project, not the language.

## Regression proof

- Display-only, checked on screen: "4 web file(s)" for the web project after adding a file (offline mode, 2026-10-16).
- No automated test; the page has no component test setup yet.
- Commit `02bb903` (PR #2).

## Recurrence triage

Look for other hard-coded "Java" wording shown for non-Java projects (dialogs, status bar, Group status box).

## History

- 2026-10-16 — Found in the offline-mode test of PR (b); fixed in the same PR.
