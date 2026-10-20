# CKB-054 — Sample loading and run feedback are unclear in the module editor

- Status: resolved locally; hosted rollout pending
- First recorded: 2026-10-21
- Last verified: 2026-10-21
- Area: module worksheet, main Java editor, activity preparation/results, saved step work
- Search terms: where is confirmation, output still old, tiny Console message, load sample automatically, sample first, save completed progress

## Symptom

The teacher's student screenshot showed unchanged sample source and output after Run code, but
the only rejection was a tiny Console-heading message. After completing Step 1, opening Step 2
retained the first Main.java, requiring manual copying. The teacher requested automatic sample
loading, an unchanged baseline run before alteration, and a clear result banner. Approved on
2026-10-21 after a concrete proposal including saved step drafts and intentional-error handling.

## Root cause

CKB-052 intentionally prioritized existing saved files over each new sample, and checked only
alteration targets. Its regressions passed; this is an expanded workflow rather than a return
of its false-completion defect. StudentModuleActivity rendered status only in a nine-pixel
heading/footer. It also chose status from accumulated completion, so a failed later run could
still display Completed without distinguishing that run from the earlier saved achievement.

## Durable solution

Opted-in sampleFirst modules use each step's files on first opening and restore its own saved
working draft on revisits. An additive activity_projects column retains those drafts plus a
readable pre-update backup; project_files stays the active rolling project. Project saves check
both step identity and version. Separate sample keys record verification without completing or
unlocking an alteration; old completed tasks remain completed without fabricated sample evidence.
The server chooses the stage, checks unchanged supplied files and its own result, and refuses
stale/browser results for another active step. A declared expectedError can verify a failed
runtime demonstration, but only a successful alteration can complete its task.

The large ModuleRunFeedback banner is outside scrolling instructions, above Actual output.
It distinguishes sample verification, expected-error observation, unchanged sample output,
mismatch and completion. Latest result and earlier saved completion remain separate. Week 14
opts in and supplies the declared Step 8 exception plus a stable Step 1 sample message; printed
practice and lesson appendices describe the same flow and the sample correction.

## Regression proof

- tests/module-activities.test.mjs: sample verification/output/source rules; real javac and
  actual routes prove separate verification/completion, draft restoration, stale refusal,
  deliberate runtime errors, preserved prior work and preserved existing completion.
- tests/browser-java-progress.test.mjs: online stages remain server-owned and edited samples
  cannot verify solely from matching browser-reported text.
- tests/module-run-feedback.test.mjs: separate visible messages and earlier completion.
- tests/module-activity-migration.test.mjs: a disposable local database proves additive/repeated
  migration preservation, the object constraint, and old readers' retained data shape.
- tests/rolling-module-tasks.test.mjs: all eleven actual sample runs (one declared error) and
  all eleven successful alterations match the published targets.
- Full exact test names, mutation proof and browser evidence are recorded in
  docs/verification/module-sample-first.md (181 automated passes; actual production browser 5/5 offline and 5/5 online; every sample on actual Java 8).

## Recurrence triage

Confirm sampleFirst in the uploaded module, not only the repository JSON. Check migration and
app deployment precede re-upload. An already completed task skips the new baseline; an old sample
pass cannot complete an alteration. A failed later run must retain completion while reporting its
own mismatch. Exception stack frames vary between JVMs; match the declared type only for a declared
error demonstration, and never relax the successful-process requirement for task completion.

## History

- 2026-10-21 — Teacher approved sample-first loading, baseline verification, per-step working
  preservation and visible result banners. Branch codex/module-sample-first; no hosted action.

Mutation proof: bypassed samplePending and observed the named verification assertion fail with
false !== true, then restored the implementation and observed the same check pass. All exact
commands, test names and resolved initial failures are in the verification report.
