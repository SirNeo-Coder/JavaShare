# CKB-022 — Existing student web preview permits network requests

- Status: investigating for New web project; resolved for module web steps (2026-10-28)
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: app/webPreview.ts, app/page.tsx student iframe
- Search terms: student preview loads external resources, web preview network access, offline preview fetch allowed, CDN not blocked

## Symptom

Found during item-5 compatibility checks. A disposable saved project called fetch to a local
request counter on a different origin (port 3010). **Run preview** in the new teacher viewer
made no requests; **Run code** in the existing student view made one `/fetch` request. The
counter contained `[]` before the student run and `["/fetch"]` afterward. No internet host or
real student data was used. This conflicts with the project's no-external-load rule.

## Root cause

The existing `buildPreview` inlines local project CSS/JS, but leaves external references in
the HTML and does not add a network-blocking policy. `sandbox="allow-scripts"` isolates the
page from CodeShare, but does not itself forbid fetch or external resources. The older test
"inlines linked CSS and JavaScript, no external loads" only checks local fixture links are
inlined; its name is broader than what it proves.

## Durable solution

Not implemented for the student view. Item 5 adds `buildTeacherPreview` with a restrictive
policy before student code; applying that policy to the existing student workflow needs a
separate proposal/approval and compatibility checks for accepted project content. Do not
claim the student's old renderer blocks requests because the teacher viewer now does.

## Regression proof

- Browser reproduction: run the same saved HTML/CSS/JS in teacher and student views with a
  local-only HTTP request counter. Teacher console prints Network request blocked, retains
  correct script.js:6 location, and produces no counter entries; the student request reaches
  the counter. Parent-page access is blocked in both views.
- The fixture, production app on port 3001, and request counter were temporary local checks.
- **Unresolved:** no student-path fix or automated fail-before/pass-after test yet. Teacher
  policy tests and mutation proof cover only the new teacher wrapper.
- Record commit: pending item-5 implementation commit on `codex/teacher-web-projects`.

## Recurrence triage

Distinguish missing local project files (the renderer already warns) from external network
references. Confirm whether the screen uses `buildPreview` or `buildTeacherPreview`. A
working sandbox parent-access check does not establish that network access is blocked.

## History

- 2026-10-18 — Reproduced locally during the approved teacher viewer's compatibility checks.
  Recorded without changing the separately existing student renderer. No hosted service changed.
- 2026-10-28 — Teacher approved the no-internet policy for module web steps (Slice 1, CKB-074):
  `useWebPageRun` (`app/WebStepRun.tsx`) builds with `buildTeacherPreview`. Proof:
  `tests/web-module-steps.browser.mjs` "a module page loads nothing from outside CodeShare (rule 5):
  stylesheet, picture and fetch are blocked" — a local request counter received
  `/style.css`, `/picture.png`, `/data` with the old renderer and nothing with the fix. The student's
  own **New web project** preview (`app/page.tsx`) still uses `buildPreview` and remains open.
