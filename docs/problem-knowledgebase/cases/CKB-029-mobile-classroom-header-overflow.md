# CKB-029 — Classroom top bar runs off the phone screen

- Status: resolved
- First recorded: 2026-10-19
- Last verified: 2026-10-19
- Area: classroom top bar / `app/globals.css`
- Search terms: mobile header cut off, Class home Modules off screen, phone horizontal scrolling

## Symptom

Responsive verification of the classroom redesign found the existing top bar's actions extending
past a 390-pixel frame. The DOM measured `scrollWidth: 471` for `innerWidth: 390`; the header actions
ended at x=471.36. The classroom content itself stayed inside its frame.

## Root cause

The old narrow-screen rule kept the brand and all header actions side by side in a two-column
grid. Their combined minimum widths exceeded the available width, especially with the saved
115% text size.

## Durable solution

At widths up to 680 pixels, `app/globals.css` puts the same top bar contents into two rows and
accounts for its 100-pixel height when sizing the workspace. Desktop top bar appearance stays
as supplied by the teacher. No control or setting is removed.

## Regression proof

- Display/layout check through the real built app in a 390 × 844 local iframe, at 115% text size.
- Failing measurement before the fix: `scrollWidth (471) > innerWidth (390)`.
- Final measurement and screenshot: `docs/verification/classroom-figma-ui.md`.
- No automated layout runner exists in this repository. Component/server tests cannot measure CSS
  layout; the browser geometry check is the applicable verification here.
- Commit: the classroom UI change on `codex/classroom-figma-ui`.

## Recurrence triage

Measure the `.topbar`, `.header-actions`, and main workspace separately. Long code should scroll
inside its editor; it should not widen the page. Preserve all existing top bar actions when
adjusting its phone layout.

## History

- 2026-10-19 — Found during the teacher-approved Figma classroom workflow change; corrected the
  phone layout while preserving the supplied desktop header.
