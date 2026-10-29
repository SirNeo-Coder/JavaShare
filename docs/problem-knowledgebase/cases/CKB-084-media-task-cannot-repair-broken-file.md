# CKB-084 — A media step's task cannot repair a file its sample lists as broken

- Status: open (design limit); worked around in the teacher's Week 3 Step 5 task (2026-10-29)
- First recorded: 2026-10-29
- Last verified: 2026-10-29
- Area: `backend/src/module-activities.ts` (`checkModuleRun`, `mediaCheckLines`); the teacher's `check_web_steps.cjs`
- Search terms: task never completes, images/snack.svg on the page: nothing, Expected media element absent, repair task on media step, mediaChecks broken applies to task, Week 3 Step 5 task

## Symptom

Found while writing the Weeks 1–3 revision answers. The first Week 3 Step 5 task was "repair
`images/snack.svg` to `images/snacks.svg`". Its answer could never pass: the teacher's checker reported
`Expected media element absent: images/snack.svg`, and CodeShare's media rule would show
`images/snack.svg on the page` with a cross ("nothing").

## Root cause

A step's `mediaChecks` (files meant to be broken in the sample) are applied to the step's task too.
`checkModuleRun` uses `mediaLinesPass(step.mediaChecks, …)` for both the sample and the
`activity` run, and `mediaCheckLines` requires every listed `src` to be on the page. Page checks
(`webChecks`) apply to the sample only, but media expectations do not. The teacher's checker
behaves the same way.

## Durable solution

Not built. Content rule for now: a task must not remove or repair a file listed in its step's
`mediaChecks`. Week 3 Step 5's task diagnoses instead (adds
`<p>Broken: images/snack.svg should be images/snacks.svg.</p>`) and Step 6's sample repairs the
paths. If repair tasks are wanted later, the app would apply `mediaChecks` to the sample only (like
`webChecks`), with the task keeping the plain media rule; that needs the teacher's approval.

## Regression proof

- None in CodeShare (no code change). The teacher's checker run of the first answer failed with
  `dotnet-1-w03-d4-s5: Expected media element absent: images/snack.svg`; the revised answer passes
  (`Week_03/Verification.md`, revision section).

## Recurrence triage

If a media step's task shows a cross on a `… on the page` line, compare the task with the step's
`mediaChecks`: the task removed or renamed a file the sample is expected to show broken.
