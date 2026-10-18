# CKB-018 — Progress accepted a module or step that had never been uploaded

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: module progress / backend/src/supabase-repository.ts
- Search terms: invented module progress, unknown module accepted, missing module returns progress, unknown step saves, progress for deleted module

## Symptom

Found before release while preparing teacher lesson-open controls. A member could request
progress for a module that did not exist and get 200 plus a new progress row. A PUT could save
an invented step id. CKB-010 covers class scoping, but did not establish whether a module or
step exists. No prior case matched this validation gap.

## Root cause

The progress endpoints were built before uploaded modules existed. They checked membership,
then created/updated a row using request-supplied module/step ids without consulting
`course_modules`. Later upload support did not add that relationship check. Earlier progress
tests even used module ids without uploading content, so they encoded this gap.

## Durable solution

`getSupabaseModuleProgress`, `setSupabaseModuleStepState`, and
`setSupabaseModulePerformanceTask` load the actual class/module first. Unknown modules return
404; unknown step/exit-slip ids return 400; a missing task returns 404. Closed content refuses
writes with 403. Validation happens before creating a progress row. Tests now upload real
content and explicitly open it when testing the separate progress paths.

## Regression proof

- File: `tests/module-availability.test.mjs`.
- Exact test: "module availability: unknown modules and step ids cannot create progress (CKB-018)".
- Command before fix: `sg docker -c 'node --test --test-name-pattern="unknown modules|duplicate lesson ids" tests/module-availability.test.mjs tests/course-module-schema.test.mjs'`.
- **Failed before fix:** the missing-module GET returned `200 !== 404`.
- **Passed after fix:** full `sg docker -c 'npm test'`: 46/46, no skips. It also verifies
  unknown-step refusal and that invalid requests leave no progress rows.
- These requests run the real API handlers and local Supabase; they do not click a browser.
- Commit: `0b0a76b` on `codex/lesson-availability`, PR #11; see the stage-three handoff.

## Recurrence triage

If valid work is missing only in another class, check CKB-010. If a real module cannot open,
confirm it is uploaded to this exact class, then inspect membership and availability. Do not
restore support for arbitrary ids to bypass a closed lesson or a deleted module.

## History

- 2026-10-18 — Teacher approved lesson-open controls as a workflow change, including server-side
  write checks. Reproduced this existing validation gap and closed it with regression evidence.
