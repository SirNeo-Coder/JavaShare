# CKB-135 — Edit module shows Unexpected server error on the live site

- Status: repaired by the teacher (live migration applied 2026-11-23)
- First recorded: 2026-11-23
- Last verified: 2026-11-23
- Area: module editor, hosted database readiness (same class as CKB-067)
- Search terms: Edit module Unexpected server error, editor 500, /editor 500, subject_module_versions missing,
  module editor won't open live

## Symptom

On the live site, after PR #133 was merged, **Curriculum → Edit module** showed "Unexpected server error"; the browser
console showed `GET /api/classrooms/…/modules/java-2-w12/editor` → 500.

## Root cause

The new app code reads the earlier-versions table `subject_module_versions`, but the hosted database did not have it yet:
the teacher's read-only check `select to_regclass('public.subject_module_versions');` returned `NULL`. The migration
`20261123000100_subject_module_versions.sql` had not been applied before the deploy. Re-uploading an existing module
would have failed the same way.

## Durable solution

The teacher pasted the unchanged migration into the hosted SQL Editor ("Success. No rows returned"); **Edit module** then
opened. No code change. Pull requests that add a migration keep stating, at the top of their test steps, that it must be
applied before deploying.

## Regression proof

Not a code bug, so no automated test. `tests/module-editor.test.mjs` "module versions migration" checks the table exists
locally; the live check is the `to_regclass` query above.

## History

- 2026-11-23 — Reported with a screenshot after merge; confirmed with `to_regclass` (NULL); fixed by applying the migration.
