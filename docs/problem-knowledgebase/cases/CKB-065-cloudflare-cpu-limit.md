# CKB-065 — Module practice saves exceed Cloudflare's CPU limit

- Status: implementation in progress; server step verified locally, browser step next
- First recorded: 2026-10-22
- Last verified: 2026-10-22
- Area: module projects, prerequisite reads, Cloudflare CPU
- Search terms: 503, exceededCpu, cpuTimeMs 10, Save work, failed runs save code, completion-only saves, cache modules

## Symptom

Teacher screenshots showed module/progress and other requests failing with 503.
A supplied module-project save invocation reported exceededCpu at 10 ms CPU and
404 ms total time. The raw log and student/network/account information are omitted.
The related HTML/JSON error message is handled separately in PR #39.

## Root cause

The supplied invocation proves CPU exhaustion for that save. The free account plan
was not directly inspected. Local Worker profiles with actual Week 12–21 content
identified full-library Supabase response parsing as a major cost. Each prerequisite
check loaded every module's full content, followed by duplicate selected-module reads.
The old online editor also saved before every Run code and posted unsuccessful
results. Opening a step wrote its prepared project files too.

Earlier diagnosis/profile records are in PR #39. A healthy public read does not
establish that signed-in saves fit the hosted CPU budget. CKB-035's cache freshness
regression also applies: a saved copy must not hide teacher/module/access changes.

## Durable solution

The teacher explicitly approved the combined device-cache/local-draft, completion-only
saving and lighter-server-read plan. Online Module project practice should keep
unfinished code and sample verification on the device, then send one server-validated
successful checkpoint. Failed runs must not replace earlier successful code. Server
identity/class/prerequisite/live-week/activity/source/project-version checks remain.
Later locked content stays withheld until server-confirmed completion.

The new migration defines server-only metadata reads derived from current content
and a checkpoint write guarded by module/project versions. No stored summary cache,
new dependency, data rename, deleted work or existing migration edits. The selected
module is read once after prerequisite enforcement. Existing routes remain compatible.
Teacher setup: docs/module-completion-setup.md. Only local SQL has been applied.

## Regression proof

Server step: existing focused integration checks passed 67/67; extended new
module-completion checks passed 7/7, no skips. Build: npm run build:all passed.
New checks cover small/scoped summaries and browser-role denial; no full-library
access read; opening without project writes; rejection of failed/sample-only/direct
pass evidence; atomic successful code/verification/completion; duplicate checkpoints;
legacy/error samples; stale modules/projects, live locks and isolation.
Deliberately restoring opening-time saves fails the new regression; restoring the
fix passes. Frontend request counts, actual browser/cache behavior, full suite and
Worker profiling still need final verification. Hosted CPU recovery is unverified.
Branch: codex/module-completion-saves.

## Recurrence triage

Inspect the invocation outcome before assuming traffic, missing tables or a daily
request limit. Count actual requests separately from CPU per request. Do not claim
that fewer requests alone fixes a heavy successful checkpoint. Verify cache keys,
module versions, task identities and stale-write guards before reusing old content.

## History

- 2026-10-22 — Teacher supplied CPU failure evidence, required free hosting, and
  approved local module practice with code saved only after successful completion.
  Server groundwork is verified locally; browser implementation is in progress.
