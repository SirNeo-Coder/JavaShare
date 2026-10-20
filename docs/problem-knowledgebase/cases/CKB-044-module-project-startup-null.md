# CKB-044 — Module project header crashed while the class was loading

- Status: resolved
- First recorded: 2026-10-20
- Last verified: 2026-10-20
- Area: `app/page.tsx`, `app/moduleActivityState.ts`
- Search terms: cannot read moduleTitle of null, student reload startup crash, signed in class loading

## Symptom

The local browser showed "Cannot read properties of null (reading 'moduleTitle')" after reloading
as the disposable student during implementation. This was caught before committing the feature.

## Root cause

Comparing two optional class ids could compare undefined with undefined and select the module
header even when the module project itself was null. The signed-in student can exist before the
class response arrives.

## Durable solution

`moduleProjectForClass` requires a project, a loaded class and the student role before comparing
class ids. The header and main editor reuse its result. No project from another class is shown.

## Regression proof

`tests/student-module-activity-ui.test.mjs`, "module activity screen: signing in starts safely
before a class or project exists (CKB-044)". Checks the signed-in/no-class/no-project combination,
class mismatch, teacher role, and initial rendered screen. Removing the empty-state guard made
the test fail; restoring it passed. The real browser reload subsequently opened the classroom
and restored the saved files normally.

Command: `node --test --test-reporter=spec tests/student-module-activity-ui.test.mjs`.
Branch: `codex/student-module-activities`; see the verification report.

## Recurrence triage

If startup fails before the module is selected, inspect the empty loading state before checking
saved Java files or the runner.

## History

- 2026-10-20 — Found in local browser verification and fixed before feature delivery.
