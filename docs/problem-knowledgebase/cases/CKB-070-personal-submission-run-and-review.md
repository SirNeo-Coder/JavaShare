# CKB-070 — Personal submission lacked successful-run checks and frozen teacher review

- Status: resolved locally; final integrated verification recorded in the linked report
- First recorded: 2026-10-23
- Last verified: 2026-10-23
- Area: personal performance projects, submission and teacher review
- Search terms: Submit this version without Run, failed run submission, personal project missing, teacher checklist, frozen submission, prior draft overwrites submission

## Symptom

Projects initially showed no personal Java entry. Personal submission accepted unrun files.
Teacher student/module cards offered no personal-submission review. Continuing a later week
preferred the previous draft, and reopening personal work could import lesson starter files.

## Root cause

The existing editor discarded the personal runner's success result and posted a client pass flag.
The server accepted files/status without run evidence. Project preparation merged lesson starters
and preferred prior drafts. No submission identity/checklist review storage or teacher entry existed.
Existing CKB-045/043/009/010 regressions passed before changes: they protected earlier scope,
not these new requirements. The browser check also found Program input's implicit label changed
with textarea contents; an explicit accessible label keeps typing/Enter targeting stable.

## Durable solution

Reuse personal draft and own snapshot JSON. Record successful execution against exact saved files;
clear evidence on saves/run start and refuse stale/mismatched submissions. Keep browser practice
evidence online, laptop Java offline. Use personal-only initialization, preserve current drafts and
prefer previous submissions, including continuation across the paper proposal. New submissions
freeze files/checklist, earn progress and reset their own teacher review. Teacher access checks
class ownership/membership and submission identity; read-only main-editor runs never save progress.
Legacy checklists are explicitly labelled when captured. Preserve merged prerequisite, shared
subject, device draft recovery and completion-only module behavior.

## Regression proof

- `tests/browser-java-progress.test.mjs`: personal browser runs: failure, stale files and direct submission refused; review binds to a frozen submission.
- `tests/personal-performance.test.mjs`: personal continuation: current work wins, then submitted personal files, then draft, then personal starters.
- `tests/module-activities.test.mjs`: personal offline runs: compile failure, crash and timeout cannot submit; handled exceptions can.
- `tests/personal-performance.browser.mjs`: actual student and teacher screens, offline Java and online Program input/Stop.
- Removing the submission guard, reversing continuation preference and removing review identity
  checking each failed the corresponding regression; exact restoration passed.
- Commands, every named result and limits: [verification](../../verification/personal-performance-workflow.md).
- Branch: `codex/personal-performance-workflow`.

## Recurrence triage

Correct output is not successful execution. Verify saved file identity, latest run outcome and
module scope separately. A review must address the submitted copy, never the latest editable draft.
A previous submitted project takes priority only during first initialization of the next module.

## History

- 2026-10-23 — Teacher approved the proposal; implemented with existing editor/runner/storage,
  then integrated newer main to preserve prerequisites, sharing and device recovery.
