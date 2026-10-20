# CKB-052 — Module practice checks the sample instead of the student alteration

- Status: resolved for the approved task-flow and Weeks 12–14; later curriculum work pending
- First recorded: 2026-10-20
- Last verified: 2026-10-21
- Area: module worksheet, main editor, module validation, saved projects, completion and unlocking
- Search terms: sample output vs task output, simple alteration, rolling code, next step locked, Completed, existing sample pass

## Symptom

The teacher needs a sample with a nearby but different student target. The worksheet/editor
checked the sample output and opened whole parts. Existing weekly JSON had no separate task
ids or predecessor links. The teacher supplied Weeks 12-17 and approved the app flow plus a
revised Week 14 example first.

## Root cause

The preceding approved sample-only slice deliberately ignored legacy activity data. Its
completion helper returned the sample step id, result checks used step.expectedOutput/stdin,
and access grouped every step in a part. Re-uploading sample content did not change that rule.
CKB-043's process-success requirement still passed its regression; this is a changed workflow,
not evidence that its original failed-process defect returned.

## Durable solution

An explicit stable activity.id opts into a separate task target and task:<id> record. Legacy
modules retain sample behavior. Both laptop and browser result routes use activityTask; the
server enforces individual prerequisites and redacts future task content. moduleParts keeps
open discussion visible when a later step in the same part is locked. Student labels distinguish
sample/task output and show Completed. Existing saved sources win over templates and weekly
copying remains separate for module and personal projects. No migration or runtime change.

Week 14 retains published module/lesson/step ids and adds eleven task ids. Stable output avoids
platform-specific exception wording and HashSet order. A crashing sample gets a successful
alteration; a crash never earns completion.

## Regression proof

- tests/module-activities.test.mjs: module tasks: explicit ids isolate completion and unlock one step at a time inside a part
- tests/module-activities.test.mjs: module tasks: real Java checks the alteration, redacts the next step and preserves rolling work
- tests/browser-java-progress.test.mjs: online module tasks: browser results check the task target and cannot reuse a sample pass
- tests/classroom-ui.test.mjs: module parts: a locked next task does not hide the current task's discussion
- tests/rolling-module-tasks.test.mjs: all eleven actual Java alterations match the published targets
- Full names, commands and browser limits: docs/verification/rolling-module-tasks.md.

Mutation proof: temporarily returned the sample from activityTask; the explicit-id regression
failed (Capacity: 20 instead of Capacity: 25). Restored it and the same check passed.

## Recurrence triage

Check for an explicit activity.id. Legacy activity without it intentionally remains sample-only.
Never turn a sample pass into a new task pass or reuse a task id for a changed requirement.
A missing predecessor starts from starter files; current work is never overwritten later.
Week 15 runtime data persistence and Week 17 Swing verification are separate, unapproved stages.
Weeks 15/16 also lacked exitSlip.afterStep; Week 17 lacked performanceTask.starterFiles. Those
provided files were reviewed but not changed.

## History

- 2026-10-20 — Teacher approved the core alteration workflow and Week 14 pilot.
- 2026-10-21 — Teacher approved new Week 12 OOP and Week 13 exceptions JSON. Both use
  sample-first verification, small alterations, complete supporting classes and stable predecessor
  links into Week 14. Week 13 disk examples remain reading material; runnable checked-exception
  practice uses the approved in-memory substitute. No new app defect or app change. Evidence:
  `docs/verification/week12-week13-modules.md`.

Implementation: `f07bb71`; review: [PR #25](https://github.com/SirNeo-Coder/JavaShare/pull/25).
