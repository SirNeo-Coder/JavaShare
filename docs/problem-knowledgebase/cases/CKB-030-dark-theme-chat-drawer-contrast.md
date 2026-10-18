# CKB-030 — Existing dark theme overrides the new light chat drawer

- Status: resolved
- First recorded: 2026-10-19
- Last verified: 2026-10-19
- Area: chat drawer / `app/globals.css`
- Search terms: chat messages invisible, dark theme chat text, drawer low contrast, Figma light chat

## Symptom

Caught in the built classroom UI before release. In dark mode, the new chat drawer had dark text
on a dark background, despite its Figma styling defining light conversation bubbles. Computed
styles showed chat background `rgb(24, 34, 53)` and text `rgb(35, 50, 75)`; message bubbles used
`rgb(37, 48, 71)` with text `rgb(52, 68, 95)`.

## Root cause

Existing selectors beginning `html[data-theme="dark"]` were more specific than the new workspace
selectors. They replaced the drawer's backgrounds while its new text colors remained dark.

## Durable solution

Scope the new conversation styling to `#classroom-chat` inside the classroom workspace. Those
selectors outrank the old dark-mode chat rules and preserve the reference's light message area
and navy heading in both themes, without altering the top bar or the saved theme setting.

## Regression proof

- Display/layout check through the real built app in dark mode, with actual local teacher and
  student messages. Failing computed colors recorded above; final colors and screenshots are in
  `docs/verification/classroom-figma-ui.md`.
- No browser layout runner exists in the repository. React server-rendering tests do not compute
  CSS; the real-browser computed-style and screenshot checks are used here.
- Commit: the classroom UI change on `codex/classroom-figma-ui`.

## Recurrence triage

Check backgrounds and text separately. The top bar follows the saved light/dark preference; the
Figma chat conversation area stays light in both modes. Confirm the messages still arrive through
the existing routes and live channels rather than diagnosing this styling issue as delivery loss.

## History

- 2026-10-19 — Found during verification of the teacher-approved Figma classroom workflow change.
