# CKB-053 — Duplicate Module tab and missing hover/outside drawer controls

- Status: resolved locally; teacher review and hosted rollout pending
- First recorded: 2026-10-20
- Last verified: 2026-10-21
- Area: classroom Module, Projects / Students / projects, Chat and worksheet
- Search terms: double module, project tab, earlet, mouse over, hover gone again, click outside, drawer, slide closed, small screen

## Symptom

Two Module tabs appeared after selecting a module, covering Projects. Hover opening and
outside-click closing were missing from the current main classroom.

## Root cause

The original rail opened the catalog, while ModuleWorkspace created another moving Module tab
for a selected worksheet. Its position could overlap Projects. The earlier CKB-053 repair was
only on open PR #26, based on the unmerged rolling-module-tasks branch; it had never reached
main. Main's rail still had click-only handlers and no outside listener. Worksheet hover-leave
also closed its preview, contrary to the approved rule. A real small-screen check additionally
exposed the older global sidebar rule hiding Projects on phones.

## Durable solution

ModuleWorkspace owns one fixed left rail: Module and Projects (Students / projects for teachers).
Module opens the catalog before selection, then reopens the selected worksheet; All modules
and the student's top-bar Modules return to the catalog. Remove the second worksheet tab,
moving-tab CSS/hover bridge, pointer-leave closing and orphaned pin callback. Keep the fixed
rail above drawers and explicitly display the Projects panel on phones.

Mouse hover opens without taking focus. Leaving stays open. First click latches a hover-opened
tab; subsequent click, touch or keyboard activation toggles. Shared useOutsideDismiss ignores
the panel and its aria-controls triggers, closes on other document pointer presses, including
pinned panels. Keep the mounted/inert panels and 250ms CSS transitions, reduced-motion support,
worksheet visit/pages, unsent chat and editor drafts, Close/Escape and existing Java behavior.
No route, data, dependency, migration or hosted configuration change.

## Regression proof

- Rendering: tests/classroom-ui.test.mjs — existing mounted/inert regression plus fixed rail/role labels.
- Real app: tests/workspace-drawers.browser.mjs — both roles, intermediate animation positions,
  focus, pointer leave, inside/outside/trigger clicks, Escape, retained page, single rail geometry,
  phone/desktop/enlarged UI, reduced motion, pinned draft, touch taps and actual laptop Java.
- Named results, commands, deliberate regression proof and limits: [verification](../../verification/classroom-drawer-controls.md).
- Branch: codex/classroom-drawer-controls, directly based on main 9257ea7.

## Recurrence triage

Check the running branch/build before changing CSS. Check that data-open changes on hover and
outside press. Reduced motion intentionally removes animation. Confirm only two left rail
buttons after selecting a module, and check actual hit targets at the affected screen size.
A click inside the separate web-preview frame does not bubble to the classroom document.

## History

- 2026-10-20 — Earlier hover/outside repair on codex/earlet-hover-dismiss, PR #26 targeting
  unmerged codex/rolling-module-tasks; main did not receive it.
- 2026-10-21 — Teacher reported duplicate Module, lost hover/outside behavior, then approved
  one fixed Module/Projects rail and porting the relevant repair directly onto current main.
