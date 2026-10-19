# CKB-033 — Escape from a hover-opened worksheet loses its focus target

- Status: resolved
- First recorded: 2026-10-19
- Last verified: 2026-10-19
- Area: hover worksheet / `app/ModuleWorkspace.tsx`, `app/WorkspaceDrawer.tsx`
- Search terms: hover drawer Escape focus lost, worksheet keyboard focus, closed module controls

## Symptom

Caught before release: hover-open the worksheet, focus its practice editor, and press Escape.
The panel closed, but the active element had no accessible label instead of returning to the ear.

## Root cause

Hover intentionally does not move keyboard focus when opening. The existing drawer focus effect
therefore had no saved focus target to restore on close. A catalog card can also become inert
when its separate browser closes, making it an unsuitable return target.

## Durable solution

The worksheet's close/Escape action explicitly focuses its persistent Module ear. Hover-leave
closure does not steal focus. The shared drawer skips a previous focus target inside an inert
panel. Click and keyboard opening retain the existing drawer focus behavior.

## Regression proof

- Real browser before fix: hover opened the drawer, the practice editor received Escape, the
  drawer closed and `document.activeElement` had no accessible label.
- Real browser after fix: focus an Overview control in the final build; Escape closes it and focus returns to the
  button labelled `Module worksheet`.
- This is a browser regression check, not a new automated DOM interaction test. Existing React
  rendering tests cannot exercise effects or native focus. See `docs/verification/printed-module-worksheet.md`.
- Commit: `9b538d5` on `codex/printed-module-worksheet`; [PR #16](https://github.com/SirNeo-Coder/JavaShare/pull/16).

## Recurrence triage

Distinguish pointer-only hover from keyboard/click opening. Entering a hover drawer must not move
focus by itself. Closing with Escape from inside must leave a reachable keyboard target.

## History

- 2026-10-19 — Found and fixed while checking the approved hover worksheet before release.
