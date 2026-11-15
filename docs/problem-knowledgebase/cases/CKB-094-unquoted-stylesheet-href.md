# CKB-094 — A link line whose href has no quotes is not given its stylesheet

- Status: open; worked around in the teacher's Resume Week 4 content (2026-11-08); app fix not approved yet
- First recorded: 2026-11-08
- Last verified: 2026-11-12 (script `src`, Game Week 1); 2026-11-08 (CodeShare's own `buildTeacherPreview` in a sandboxed `srcdoc` frame, and a student's personal
  project in the real app on the offline-settings server, port 3042; Chromium)
- Area: `app/webPreview.ts` (`buildPreview`: the `<link…>` and `<script src…>` matches that inline project files)
- Search terms: styles.css not applied, no style in CodeShare, href=styles.css without quotes, unquoted href, stylesheet works
  in a browser but not in CodeShare, link rel=stylesheet, external CSS, Resume Week 4, personal project plain page

## Symptom

A page with `<link rel=stylesheet href=styles.css>` (no quotes around the href) shows no style from styles.css in
CodeShare's page window: Juan's navigation stays `Home | Projects | Contact` instead of `HOME | PROJECTS | CONTACT`, and the
h1 stays black. A real browser opening the same files (the teacher's checker) applies the stylesheet, so the page text and
the page checks differ between the two. No error or warning is shown to the student.

## Root cause

`buildPreview` inlines a linked stylesheet only when its `href` is in quotes: it reads the address with
`/\bhref\s*=\s*["']([^"']+)["']/`. HTML allows an unquoted attribute value, so the browser would load `styles.css`, but in
CodeShare the `<link>` is left as it is, and the preview's no-internet policy (`style-src 'unsafe-inline'`) blocks it. The
`<script src="…">` match also requires quotes, so an unquoted script address is likely affected the same way (not checked).

## Durable solution

Content (done): every Resume Week 4 sample, answer and starter page writes each attribute value in quotes, and the module
tells students to keep the quotes in the link line (module p. 3, problem guide p. 5, task page 10, DLL). The teacher's
`Resume/Week_04/test_checker.py` (`test_every_value_in_quotes_ckb_094`) fails if any step, starter or example page has an
unquoted attribute value.

App (not done, needs approval): accept unquoted `href` and `src` values in `buildPreview`'s link and script matches, with a
unit test of `buildPreview` for `<link rel=stylesheet href=styles.css>`.

## Regression proof

- `buildTeacherPreview` in a sandboxed `srcdoc` frame against the teacher's checker, Juan's index.html with the link line
  unquoted (2026-11-08): CodeShare gave `Home | Projects | Contact`, h1 `rgb(0, 0, 0)`; the checker gave
  `HOME | PROJECTS | CONTACT`, h1 `rgb(19, 48, 92)`. With quotes both gave the styled page.
- Real app (offline settings, 3042): a copy of `tests/web-module-steps.browser.mjs` whose Week 4 personal subtest writes
  `href=styles.css` failed: the page window showed `['Home | Projects | Contact', 'rgb(0, 0, 0)', 'rgba(0, 0, 0, 0)',
  'normal']` instead of `['HOME | PROJECTS | CONTACT', 'rgb(19, 48, 92)', 'rgb(255, 243, 196)', 'italic']`. The real
  subtest (with quotes) passed on 3042 and 8787.
- The content guard was shown failing: with Step 4's projects.html link line unquoted in a copy of the JSON,
  `test_every_value_in_quotes_ckb_094` failed (`('dotnet-1-r04-d2-s4', 'projects.html')`); with the real JSON it passed.

## Also a script's src (2026-11-12, .NET 2 Game Week 1)

The same cause covers `<script src=game.js></script>`: `buildPreview` inlines a script only when its `src` is in quotes, so the
unquoted line loads nothing in CodeShare's srcdoc page window (no error, no console lines; with the Console box of CKB-117 the
box simply does not appear), while the teacher's checker and any browser run it. Worked around in the content again: every
Game week's `index.html` quotes every value (`test_checker.py`, "every attribute value is in quotes"), and the Thursday problem
guide names the missing quotes as a cause.

## Recurrence triage

If a student's styles work when the teacher opens the files elsewhere but not in CodeShare, look at the link line: the
href must be in quotes, `href="styles.css"`.
