# CKB-063 — Later curriculum links do not match the uploaded module ids

- Status: investigating; verified content mismatch, repair not approved
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

Proposed for a separate approved repair: make predecessor references match existing uploaded ids,
preserve module ids/student work, and test the complete actual curriculum chain. Do not weaken
moduleAccessBlock or silently alias unrelated uploads. No lesson file was changed in PR #37 repair.

## Regression proof

- tests/week15-week21.browser.mjs: every code week opens its first project with Java files only.
- Command: node --test tests/week15-week21.browser.mjs (local production app, bundled Playwright).
- Initial fixture omitted Week 14. A temporary diagnostic added real Weeks 12–14 and seeded
  disposable prior passes; Week 18 still failed with HTTP 403 missing java-2-w17.
- Diagnostic run: 3 passed / 3 failed including parent. A Week 17 feedback wait also timed out;
  that separate failure is undiagnosed. Diagnostic fixture changes were removed.
- No fix applied, so no passing regression proof yet. Evidence/limits:
  docs/verification/subject-module-sharing.md, PR #37 repair on codex/subject-module-sharing.

## Recurrence triage

Compare previousModuleId to actual id values, not filenames, titles or week numbers. Verify the
same teacher/subject library contains the linked id. Distinguish a genuine missing upload from
this mismatched reference. Keep student/class completion separate (CKB-010/060/062).

## History

- 2026-10-22 — Found while repairing PR #37 conflicts. Recorded for teacher review; curriculum
  preserved exactly as merged. No app workaround or hosted change.
