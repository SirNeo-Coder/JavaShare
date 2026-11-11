# CKB-107 — Session step count returned "not found" after the followed module was deleted

- Status: resolved on PR #95 before merge
- First recorded: 2026-11-11
- Last verified: 2026-11-11
- Area: class session step count — `getSupabaseSessionStepProgress` in `backend/src/supabase-repository.ts`
- Search terms: step count 404, Module not found on session/step-progress, deleted module during class session, Step N done chip disappears, CodeRabbit PR #95

## Symptom

Found by CodeRabbit (review on 9247579), then reproduced: the teacher deletes the module the class session is following.
`GET /api/classes/:id/session/step-progress` answers 404 "Module not found" instead of `{ step: null }`. On screen the
chip just hides (the screen treats any error as no count), but each re-read is an error reply.

## Root cause

The followed page is kept on the classroom after its module is deleted, and `loadCourseModuleRow` throws 404 for a
missing module. The same case was handled for **Enter classroom** in CKB-103 but not in the new count route.

## Durable solution

A 404 from loading the followed module means "no step": the route answers `{ step: null }`. Other errors still fail.

## Regression proof

- `tests/session-step-done.test.mjs` (real routes): "a followed module deleted during the session has no count, not an
  error (CKB-107)" — shown failing with the fix removed, passing restored.

## History

- 2026-11-11 — CodeRabbit: one valid finding (fixed with the teacher's approval); index-key suggestion not valid (two
  students can share a name); docstring check not applied.
