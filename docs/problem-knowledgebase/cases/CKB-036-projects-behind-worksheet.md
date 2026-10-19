# CKB-036 — Projects is covered by the separate worksheet

- Status: resolved
- First recorded: 2026-10-19
- Last verified: 2026-10-19
- Area: classroom left panels / `app/ModuleWorkspace.tsx`, `app/page.tsx`
- Search terms: Projects does not open, worksheet covers Projects, left panel behind module

## Symptom

Found during final caller inspection before release: opening Projects only closed the old module
browser flag, while the independent wider worksheet stayed above Projects in the same left space.

## Root cause

The new worksheet had its own open state. The existing Projects toggle could not suspend that
state, unlike the old browser which already shared Projects' visibility controls.

## Durable solution

Pass the existing Projects open state into ModuleWorkspace. While Projects is open, the worksheet
and its additional ear become unavailable/inert; its selected page and mounted draft remain.
Closing Projects restores that worksheet visit. No second copy of Projects or its handlers.

## Regression proof

- Caller inspection identified the missing state connection; no claim of an automated before-fix
  browser failure. Final real browser opens Projects while a worksheet is selected, confirms
  worksheet data-open false, Projects data-open true and visible project controls; closing Projects
  restores the worksheet. See `docs/verification/printed-module-worksheet.md`.
- Full 68-test suite passes. Native browser interaction is the applicable verification for this
  integration; server-render tests cannot drive its stateful toggles.
- Commit: `9b538d5` on `codex/printed-module-worksheet`; [PR #16](https://github.com/SirNeo-Coder/JavaShare/pull/16).

## Recurrence triage

Check both open states and stacking/visibility, rather than creating a new Projects panel.

## History

- 2026-10-19 — Caught and corrected while preserving the existing classroom controls in the approved worksheet change.
