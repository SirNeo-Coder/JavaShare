# CKB-063 — Later curriculum links do not match the uploaded module ids

- Status: resolved locally; teacher re-upload and hosted verification pending
- First recorded: 2026-10-22
- Last verified: 2026-10-22
- Area: Weeks 17–21 curriculum / cross-module prerequisites
- Search terms: Week 18 missing Week 17, teacher needs to upload prerequisite, module suffix

## Symptom

During PR #37 integration verification, the real local curriculum preparation route refused
Week 18 with a missing java-2-w17 message, even though the Week 17 JSON had uploaded successfully.

## Root cause

The preserved Week 17 id is java-2-w17-module, while Week 18 previousModuleId is java-2-w17.
Weeks 19–21 similarly link to unsuffixed ids while their predecessors use the -module suffix.
These exact files already exist in main 82cd333. The approved prerequisite guard follows exact
ids; a saved completion cannot replace a missing linked module. Sample execution/content
preservation tests did not validate this complete actual-file chain.

## Durable solution

Teacher-approved repair: change only Weeks 18–21 `previousModuleId` references to the actual
preceding ids (`java-2-w17-module` through `java-2-w20-module`). Preserve module/activity ids and
every other JSON byte. No guard, alias, lesson, schema, migration or runner change.
Re-upload the four files through **Java class → Curriculum → Add module** with the same ids;
[teacher instructions](../../curriculum-prerequisite-reupload.md) explain preservation and scope.

## Discovery evidence before repair

- tests/week15-week21.browser.mjs: every code week opens its first project with Java files only.
- Command: node --test tests/week15-week21.browser.mjs (local production app, bundled Playwright).
- Initial fixture omitted Week 14. A temporary diagnostic added real Weeks 12–14 and seeded
  disposable prior passes; Week 18 still failed with HTTP 403 missing java-2-w17.
- Diagnostic run: 3 passed / 3 failed including parent. A Week 17 feedback wait also timed out;
  that separate failure is undiagnosed. Diagnostic fixture changes were removed.
- At discovery no fix or passing regression proof existed. Historical evidence/limits:
  docs/verification/subject-module-sharing.md, PR #37 repair on codex/subject-module-sharing.

## Repair regression proof — 2026-10-22

- `tests/week15-week21-modules.test.mjs` loads the actual Weeks 12–21, compares links to actual
  predecessor ids and exercises the unchanged access check with unfinished/current/sample/legacy
  records. Missing uploads still block. Week 20 remains written work.
- The new regression failed before correction (`java-2-w17` versus `java-2-w17-module`) and passed
  afterward. Each of the four wrong links was then independently restored: all four trials failed;
  restoring the corrected files passed again. Every other JSON byte is unchanged against main.
- `tests/week15-week21.browser.mjs` now supplies all ten real modules and disposable earlier passes.
  Real routes block/unlock each affected code week, including Week 21 through written Week 20.
  Browser Run code completes a Week 16 alteration and unlocks Week 17 while Week 18 stays blocked.
  Teacher UI re-upload preserves the entire saved student row: module/personal drafts, sample and
  retired task evidence, per-step history, backup and submitted snapshots.
- Build/offline launcher build pass; lint 0 errors/8 existing warnings; full suite 303/303;
  focused shared/prerequisite checks 26/26; curriculum browser 8/8, offline prerequisites 5/5,
  subject sharing 7/7. No final failures or skips. Named checks/commands, initial build failure,
  fixture setup limits and unverified areas: [verification](../../verification/curriculum-prerequisite-links.md).
- The separate Week 17 feedback timeout did not recur locally; its cause is still unknown.
  No feedback change was made. Hosted re-upload/recovery and physical offline devices are unverified.

## Recurrence triage

Compare previousModuleId to actual id values, not filenames, titles or week numbers. Verify the
same teacher/subject library contains the linked id. Distinguish a genuine missing upload from
this mismatched reference. Keep student/class completion separate (CKB-010/060/062).

## History

- 2026-10-22 — Found while repairing PR #37 conflicts. Recorded for teacher review; curriculum
  preserved exactly as merged. No app workaround or hosted change.

- 2026-10-22 — Teacher approved the four-reference repair, actual-file regression, disposable
  browser setup, preservation checks and PR delivery. Local repair verified on
  `codex/curriculum-prerequisite-links`, based on merged shared-library main `21766ba`.
  No hosted change, merge or deployment.

- Delivered as `e162e87`, [PR #38](https://github.com/SirNeo-Coder/JavaShare/pull/38).
  Named local checks pass; teacher review/re-upload and hosted verification remain open.
