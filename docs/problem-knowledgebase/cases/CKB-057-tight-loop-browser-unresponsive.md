# CKB-057 — A tight Java loop made a local browser tab unresponsive

- Status: investigating; no fix approved
- First recorded: 2026-10-21
- Last verified: 2026-10-21
- Area: online Java / browser renderer and execution timeout
- Search terms: while true, infinite loop, unresponsive tab, Stop, timeout, next run stuck, Java runner opening

## Symptom

During CKB-056 browser checks, a saved program with
`System.out.println("Loop started"); while (true) {}` made the local test tab
unresponsive. App `127.0.0.1:3040` and runner `127.0.0.1:3041` had different origins
but the same browser site. DOM inspection, close and navigation commands timed out.
The following run using that runner hostname remained at Opening Java runner.

## Root cause

Not established. A tight loop blocking a renderer shared with the parent or other
runner frames is a hypothesis. CKB-056 changes loading only, not the Java execution
budget, scheduling or frame teardown. It has not been established whether this
behavior predates CKB-056 or occurs in a regular browser on hosted CodeShare.

A repeat with the app at `localhost:3040` and runner at `127.0.0.1:3041` displayed
Execution stopped after 5 seconds and kept the parent usable. A later normal run
on the earlier runner hostname still did not become ready. Switching only the
local runner hostname to `localhost:3041` allowed a normal program to complete.
This is limited evidence of site/process involvement, not a durable solution.

## Durable solution

Pending targeted diagnosis and a separate teacher-approved plan. Do not claim that
the loading fix cures this issue, weaken sandbox permissions, or change hosted
settings as a workaround. No execution architecture change is included in CKB-056.

## Regression proof

- Manual actual CheerpJ/production app/local Supabase trial described above.
- No automated regression or deliberately broken/restored fix exists for this case.
- Existing controlled-clock timeout tests pass; they do not execute an actual
  infinite Java loop or prove that a browser renderer can be interrupted.
- Evidence and limitations: `docs/verification/java-runner-startup.md`.

## Recurrence triage

First distinguish a responsive Console showing a named startup stage from an
unresponsive browser tab after an earlier tight loop. Check whether a fresh runner
frame becomes ready, not only the parent deadline. Use disposable local accounts
and an isolated browser when reproducing; do not run a tight loop in a teacher's
working browser session.

## History

- 2026-10-21 — Found while testing CKB-056; recorded separately without expanding
  the approved startup-download fix. Hosted impact and baseline comparison pending.
