# CKB-058 — Module worksheet reopens at Monday instead of unfinished work

- Status: resolved locally; hosted rollout pending
- First recorded: 2026-10-21
- Last verified: 2026-10-21
- Area: ModuleViewer, ModuleWorkspace, moduleParts, weekly Module project button
- Search terms: remember module position, reopen Monday, next unfinished step, Tuesday Step 3, resume progress

## Symptom

After finishing steps, opening the module again starts at its first worksheet page. The teacher
also reports Monday source remaining in Tuesday's editor and missing small alteration exercises.

## Root cause

ModuleContent initializes paperPage to zero on every visit independently of saved step_states.
The catalog already chose an unfinished editor step, so its worksheet and editor disagreed. The
Projects button always chose the first available Java step. CKB-052/054's task/sample fixes and
Week 12/13 JSON existed only on unmerged branches; their new regressions passed when reused.

## Durable solution

moduleResumeStep in app/moduleParts.ts selects the first accessible step lacking its own saved
completion. Worksheet, catalog and Module project use it. Progress refresh resets manual page
selection, so completion moves the next worksheet opening forward. Sample-only verification,
failed attempts, legacy sample passes and superseded task requirements cannot skip unfinished
work. All-complete worksheets open the performance task (or final page without one); teachers
still start at Overview. Resume reuses server progress and adds no navigation storage or migration.

Integrate CKB-052/054's prepared task checks, sample loading and per-step drafts with current Java
loading feedback and drawer controls. Revised Week 12/13 exercises use behavior/output changes
and new task ids. Original published module/lesson/step ids and historical results stay intact.
The already prepared additive activity_projects migration is required for sample-first history.

## Regression proof

- tests/module-resume.test.mjs: four named rules cover Monday-to-Tuesday resume, incomplete
  sample/task evidence, locked/closed content, all-complete state and revised identities.
- tests/module-resume.browser.mjs: real local production browser checks complete Monday, reload,
  reopen Tuesday, load its supporting files, restore earlier drafts, isolate another student,
  and preserve personal work when all steps lead to the performance task. Both laptop and actual
  CheerpJ execution are exercised, not fabricated output.
- tests/week12-week13-modules.test.mjs runs all 22 samples and alterations with laptop javac.
- Deliberately ignoring completion fails the named Monday-to-Tuesday rule. Deliberately leaving
  the polymorphic array order unchanged fails Week 12 Step 7's real Java regression. Both restored.
- Commands, final results, initial resolved test errors and limits: docs/verification/module-resume-and-logic-tasks.md.

## Recurrence triage

Distinguish correct saved completion with a wrong opening page from unsaved/failed work. Verify
both app version and uploaded JSON, plus activity_projects availability. Sample verification
alone does not complete an alteration. Similar-looking new requirements must not reuse old ids.

## History

- 2026-10-21 — Teacher approved resume, automatic sample loading and meaningful changed-output
  tasks, using Week 14 as the reference. Prior CKB-052/054 work reused, not implemented again.
