# CKB-019 — Duplicate lesson ids could make two lessons share one opening switch

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: module upload / backend/src/course-module-schema.ts
- Search terms: duplicate lesson id, lesson switch opens two lessons, availability id collision, repeated lesson id accepted

## Symptom

Found before release while preparing teacher lesson-open controls. A focused schema test made
the second lesson reuse the first lesson's id; upload validation still accepted it. Since the
new switch targets a lesson by id, both lessons would then open together. This was identified
before the controls were released, rather than reported from a live class.

## Root cause

CKB-011 added uniqueness checks for step and exit-slip ids, which identify saved progress.
Lesson ids were not included, because they were not previously used for availability.

## Durable solution

`courseModule` in `backend/src/course-module-schema.ts` includes lesson ids in the existing
module-wide uniqueness check alongside step and exit-slip ids. Reject the ambiguous upload
before it can create shared controls. Stable unique ids remain required by `docs/course-format.md`.
The validator checks one module at a time, not every separately uploaded course file.

## Regression proof

- File: `tests/course-module-schema.test.mjs`.
- Exact test: "course module schema: rejects duplicate lesson ids before they can share an availability switch (CKB-019)".
- Command before fix: `sg docker -c 'node --test --test-name-pattern="unknown modules|duplicate lesson ids" tests/module-availability.test.mjs tests/course-module-schema.test.mjs'`.
- **Failed before fix:** `true !== false` (safeParse accepted the duplicate).
- **Passed after fix:** full `sg docker -c 'npm test'`: 46/46, no skips. Existing step/exit-slip
  collision cases also still pass.
- This tests the upload rule on its own; API tests separately exercise real module uploads.
- Commit: `0b0a76b` on `codex/lesson-availability`, PR #11; see the stage-three handoff.

## Recurrence triage

If two progress markers change together, check CKB-011/007 first. If two lesson switches act
together, inspect the uploaded lesson ids and whether the upload route used `courseModule`.
An older module with duplicate lesson ids must be corrected with distinct stable ids before
using independent controls. No automatic historical-id rewrite is performed.

## History

- 2026-10-18 — Teacher approved lesson-open controls as a workflow change. Extended CKB-011's
  validation at the newly relevant lesson-id boundary, with a failing-before/passing-after test.
