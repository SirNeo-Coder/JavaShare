# CKB-034 — Narrow worksheet is pushed off the left edge after focus

- Status: resolved
- First recorded: 2026-10-19
- Last verified: 2026-10-19
- Area: classroom clipping / `app/globals.css`
- Search terms: module worksheet off screen, narrow drawer shifted left, focus pans classroom, module ear outside screen

## Symptom

Caught during responsive checks before release. After resizing with the ear focused and opening
it by keyboard, the worksheet group was displaced 378px left of its classroom, despite the
reader having its correct open transform of zero. Much of the paper was clipped away.

## Root cause

`overflow:hidden` clips visual overflow but still allows focus-related scrolling of the classroom
container. Focusing the moving ear while its old wider position was outside a narrowed classroom
panned that container. Checking the drawer's transform alone missed the ancestor displacement.

## Durable solution

The classroom uses `overflow:clip`, so off-screen drawers cannot create a focus-scrollable
container. The open worksheet ear also fits inside its parent width. The paper's own vertical
scroll area remains available. Existing focus changes still use preventScroll.

## Regression proof

- Real browser before: classroom left 0, worksheet group left -378, open drawer transform zero.
- After: repeat narrow keyboard open/close with the final build and measure the parent/group
  positions. See `docs/verification/printed-module-worksheet.md` for actual results.
- This layout/focus check runs in the real browser; React server-render tests cannot measure
  browser focus scrolling or responsive layout. No assertion about CSS text alone substitutes for it.
- Commit: `9b538d5` on `codex/printed-module-worksheet`; [PR #16](https://github.com/SirNeo-Coder/JavaShare/pull/16).

## Recurrence triage

Measure both the drawer transform and all ancestor scroll offsets. A zero transform with the
entire group displaced indicates focus scrolling, not a missing slide animation (CKB-031).

## History

- 2026-10-19 — Found while checking the approved worksheet at narrow width; fixed before release.
