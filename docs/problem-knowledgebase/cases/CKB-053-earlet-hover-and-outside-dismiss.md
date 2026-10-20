# CKB-053 — Earlets require clicks and panels do not close outside

- Status: resolved locally; teacher review and hosted rollout pending
- First recorded: 2026-10-20
- Last verified: 2026-10-20
- Area: classroom Module, Projects / Students / projects, Chat and module worksheet
- Search terms: earlet, mouse over, hover, panel animation, click outside, slide closed, worksheet reopens after Escape

## Symptom

The teacher reported that hovering the classroom earlets did not animate their panels open,
and requested animated closing when clicking outside. The separate worksheet already supported
hover, but leaving it closed the preview.

## Root cause

The three rail buttons in `app/page.tsx` only had click handlers. No panel registered an
outside-pointer listener. CKB-031's mounted panels and CSS transitions still existed; the missing
interaction handlers prevented the requested state changes, rather than a missing animation.
The worksheet's pointer-leave handler implemented a different closing rule.

Browser regression checks also exposed the moving worksheet ear uncovering the Projects ear
underneath it, and reopening when its closing motion placed it beneath a stationary mouse.
Both could hide its keyboard return target after Escape (related to CKB-033).

## Durable solution

Keep the mounted/inert drawer and existing 250 ms CSS transitions. Add mouse hover opening to
rail earlets without capturing focus. A first click on a hover-opened ear keeps it open; later
clicks retain toggle behavior. Keyboard and touch opening remain available.

`app/useOutsideDismiss.ts` shares outside pointer handling between `WorkspaceDrawer` and
Projects. Ignore targets inside the panel or any of its `aria-controls` triggers. An outside
press closes even a pinned panel; Pin still reserves desktop space. Closed controls immediately
become inaccessible while the slide finishes. No backdrop blocks the editor.

In `ModuleWorkspace`, remove hover-leave closing and unused pin callback state. Keep the original
worksheet pointer area protected during opening AND closing. Open its moving ear on actual
mouse movement, so its own slide under a stationary pointer cannot reopen it. Preserve worksheet
selection/pages and chat drafts across closing. No server, route, dependency or migration change.

## Regression proof

- Existing regression: `tests/classroom-ui.test.mjs`, `workspace drawers: closed panels stay mounted but inaccessible so closing can animate`; baseline 12/12 file checks passed.
- Real-app regression: `tests/workspace-drawers.browser.mjs`, teacher/student hover, inside/trigger/outside clicks, both animation directions, keyboard/Escape, worksheet pages/focus, reduced motion, pinned closing, chat drafts, and offline Run code.
- Implementation `83cb931`, [PR #26](https://github.com/SirNeo-Coder/JavaShare/pull/26).
- Final commands, results, deliberate mutation and limitations: [verification](../../verification/earlet-hover-dismiss.md).

## Recurrence triage

Check whether `data-open` changes before changing CSS. A panel that stays closed on hover has
an interaction problem; a changing state with no intermediate movement may be CKB-031 or an
intentional reduced-motion preference. Check moving-ear hit targets and keyboard focus if the
worksheet closes then immediately reopens. Verify the browser is serving the rebuilt branch.

## History

- 2026-10-20 — Teacher supplied three screenshots and approved consistent hover opening and outside-click closing. Work on `codex/earlet-hover-dismiss`, based on the open rolling-tasks branch.
