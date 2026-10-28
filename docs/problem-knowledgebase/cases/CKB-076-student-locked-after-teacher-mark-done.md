# CKB-076 — Student's next step stays locked after the teacher's Mark done

- Status: resolved (offline browser check)
- First recorded: 2026-10-28
- Last verified: 2026-10-28
- Area: `app/ModuleWorkspace.tsx` module content device cache
- Search terms: Mark done no effect, teacher marked step but student still locked, next step not opening after teacher check, module stays on Performance task page, stale module cache

## Symptom

After the teacher pressed **Mark done** on a media step, the student reopened the module and the
worksheet showed no current step (the following step was still locked) for up to five minutes.

## Root cause

The student's device keeps the access-filtered module content for five minutes and refreshes it
only when the module version changes or the student's own completion returns new content. A
teacher's write changes progress without the module version, so the cached locks stayed.

## Durable solution

`ModuleWorkspace.selectModule` refetches the module when the cached copy is older than the
server's progress `updatedAt`. Device and server clocks differ; a device clock running ahead can
still delay the refresh, never longer than the existing five minutes.

## Regression proof

- `tests/web-module-steps.browser.mjs`: "teacher dashboard shows the web student's percentage and
  marks a media step done" (student resumes at Step 3 after the teacher marks Step 2).
- Shown failing: with the refetch removed and rebuilt, that subtest failed 6 of 6 runs (worksheet
  current step not found); restored and rebuilt: 9/9.

## Recurrence triage

If **Mark done** shows **Done ✓** but the student is still locked after reloading, check the
student's progress (`updatedAt`) against the device cache age before suspecting the server.

## History

- 2026-10-28 — Found while testing Slice 1 teacher **Mark done**; fixed before delivery.
