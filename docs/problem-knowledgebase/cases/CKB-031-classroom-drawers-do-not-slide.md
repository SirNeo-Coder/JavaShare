# CKB-031 — Classroom side panels appear instantly instead of sliding

- Status: resolved
- First recorded: 2026-10-19
- Last verified: 2026-10-19
- Area: classroom drawers / `app/WorkspaceDrawer.tsx`, `app/page.tsx`, `app/globals.css`
- Search terms: no animation, side panel does not slide, module drawer pops in, chat drawer instant

## Symptom

The teacher could see the new classroom UI but its side panels had no drawer animation. Before
the fix, the real browser reported the closed module panel as `hidden: true`, `display: none`,
transition duration `0s`.

## Root cause

The first Figma implementation used the HTML `hidden` attribute and a CSS `display:none` rule
for Modules, Chat and Projects, without a sliding transition. Closing therefore removed the panel
from rendering immediately, preventing any slide-out effect.

## Durable solution

Keep the existing panels and their contents mounted. Use `data-open` for the visual state and
`inert` plus `aria-hidden` to block closed controls immediately. CSS translates Modules/Projects
from the left and Chat from the right in 250 ms. Delay visibility hiding until the closing slide
ends. Clip off-screen panels within the classroom. Respect `prefers-reduced-motion: reduce` by
removing transitions. Pin spacing checks the open marker, and focus changes prevent scrolling.

No timer, second chat system, new module storage, dependency, route or migration is needed.

## Regression proof

- `tests/classroom-ui.test.mjs`: `workspace drawers: closed panels stay mounted but inaccessible so closing can animate`.
- `node tests/classroom-ui.test.mjs`: restoring the old hidden attribute caused this check to fail
  (4 passed, 1 failed); restoring the fix passed all 5 focused checks.
- `npm test`: 64 passed, no failures/skips. The component check protects rendering/accessibility;
  the real-browser samples protect actual sliding behavior.
- Real browser on localhost:3000 sampled Modules moving from x=-422 toward 0 and Chat from x=362
  toward 0, with intermediate positions and the reverse movement on close. Projects also moved
  through intermediate positions from the left.
- Chat and lesson drafts survived close/reopen; six rapid chat reversals matched the requested
  state. Escape returned focus. Pinned margins cleared on close and returned on reopening.
- Reduced-motion rule inspected in the delivered stylesheet; operating-system preference could
  not be toggled through the available browser controls. See verification for this limit.
- Full evidence: `docs/verification/drawer-slide-animation.md`.
- Commit: drawer-animation fix on `codex/drawer-slide-animation`.

## Recurrence triage

Distinguish a panel with no transition from a browser whose reduced-motion preference intentionally
disables it. If it appears instantly, check the current served CSS/JS and computed duration first.
Do not restore `hidden`/`display:none` on the animated outer panels. Inner inactive lesson sections
still use `hidden` correctly; they are not drawer animations.

## History

- 2026-10-19 — Teacher requested real drawer motion after seeing the Figma UI. Approved the
  targeted proposal as an adjustment; fixed all three panels and checked the existing localhost.
