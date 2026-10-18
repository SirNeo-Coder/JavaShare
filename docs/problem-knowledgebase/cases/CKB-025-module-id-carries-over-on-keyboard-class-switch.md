# CKB-025 — A keyboard class switch carried the old classroom's open module id into the new one

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: app/Landing.tsx
- Search terms: wrong module opens after switching classes, module not found after tabbing to
  Classes, student sees another class's module id, keyboard navigation class home module leak

## Symptom

Found by a second-opinion code review (Claude Code), not reported by a teacher. `selectedModuleId`
lives in the parent `Landing` component, above the `key={classroom.id}` remount boundary that
resets it when a student switches classrooms with the mouse (clicking a class card unmounts and
remounts the whole class-home subtree). Tabbing to the always-reachable **Classes** button while a
module is open bypasses that remount: the module overlay has no focus trap, so a student who opens
a module in class A, tabs to **Classes**, and opens class B gets `StudentModules` mounted for B
while `selectedModuleId` still holds A's module id - at best "module not found", at worst a
different, differently-titled module in B that happens to reuse the same id.

## Root cause

Module-open state was reset only by whichever path happened to force a remount (the mouse click's
`key` change), not by the actual thing that should invalidate it - a classroom change. Keyboard
navigation reaches the same button without going through that remount.

## Durable solution

`Landing.tsx` no longer calls `setSelectedClassroomId` directly from either the **Classes** button
or a class card's **Open class** button. Both now go through a small `openClassroom(id)` helper
that sets `selectedClassroomId` and resets `selectedModuleId` together, so a classroom change can
never leave a stale module id behind regardless of which path triggered it. (A `useEffect` keyed on
`selectedClassroomId` was tried first but rejected - `react-hooks/set-state-in-effect` flags
synchronous `setState` in an effect body as a cascading-render risk, and there are only two call
sites to fix directly.)

## Regression proof

- No frontend unit-test harness exists in this project for `Landing.tsx`'s component state.
- Verified by code reading: both state-changing call sites now route through the one helper that
  resets both pieces of state together, so there is no longer a path that changes
  `selectedClassroomId` without also resetting `selectedModuleId`.
- **Not reproduced in a real browser** (keyboard-only Tab navigation past the module overlay to
  **Classes**, then opening a second class) - this session avoided interactive browser testing of
  this feature to not disturb another concurrently running dev-server session sharing the same
  browser profile's session cookie and local Supabase instance. Said plainly rather than silently
  skipped.

## Recurrence triage

If a student reports "wrong module" or "module not found" right after switching classes, check
whether the switch happened via mouse (remount) or keyboard (no remount) - this case was keyboard
first-and-the-tab-order, the mouse path already worked.

## History

- 2026-10-18 — Second-opinion review found the gap (`docs/handoffs/stage-three-review-findings.md`,
  finding 3); fixed on `codex/stage-three-review-fixes` after teacher approval.
