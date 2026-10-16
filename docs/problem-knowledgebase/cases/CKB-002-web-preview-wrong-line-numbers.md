# CKB-002 — Web preview console showed wrong line numbers

- Status: resolved
- First recorded: 2026-10-16
- Last verified: 2026-10-16
- Area: web projects (stage one PR b), `app/webPreview.ts` (`buildPreview`, the `add` line-mapping helper)
- Search terms: web preview wrong line number, console line off by one, error points to wrong line, script.js line wrong, index.html line wrong, stylesheet shifts lines

## Symptom

Before the web workspace was finished, its new automated checks showed errors mapped to the wrong line. A page with `<p>x</p>`, then a missing `<script src="app.js">`, then `<script>boom()</script>` reported `boom()` on index.html line 2 instead of line 3. The lines after an inlined stylesheet were also off. A student would have been sent to the wrong line.

## Root cause

`buildPreview` joins index.html with the inlined CSS and JS, and records for every line of the combined page which file and line it came from. When a piece of text ended with a line break, the helper recorded the empty line after it as belonging to that piece. The next piece (for example the CSS file) then started on a line that was already recorded, so every later line was shifted.

## Durable solution

A line belongs to the first text actually written on it. A trailing empty line after a line break is left for the next piece. See the comment above `add` in `app/webPreview.ts`.

## Regression proof

- `tests/web-workspace.test.mjs`:
  - "maps document lines back to the student's file and line" checks script.js:3, style.css:2, index.html:7 and index.html:9.
  - "works without <head>, and warns about missing files" checks index.html:3.
- Command: `npm test`.
- **Shown failing before the fix:** both tests failed against the first version (line 2 reported instead of 3), and passed after the fix, during the 2026-10-16 session.
- A real-browser check on 2026-10-16 showed correct `file:line` for logs and errors from index.html and script.js, including after a linked stylesheet.
- Commit `5ca6334` (PR #2; the bug never reached a commit).

## Recurrence triage

If a console line points to the wrong place, first check that the browser reports document-relative line numbers. Chromium did on 2026-10-16; other browsers were not checked. Compare the error's raw line with `preview.lineMap`. If the raw line is right but the mapping is wrong, it is this case; if the raw line itself is wrong, it is browser behaviour.

## History

- 2026-10-16 — Caught by the new tests while building PR (b); fixed before commit.
