# CKB-055 — Console stays Ready while Java is loading or running

- Status: fixed; 143/143 suite and 12/12 real browser checks pass; main delivery tracked by PR #29
- First recorded: 2026-10-21
- Last verified: 2026-10-21
- Area: student module/personal Console, `app/StudentModuleActivity.tsx`, `app/globals.css`
- Search terms: Java loading, working out output, Working button, Console Ready, no spinner, startup feedback

## Symptom

The teacher's screenshot showed **Working…** on Run code while Console still displayed
**Ready — edit your project, then press Run code.** The teacher requested a visible indication
beside the output that Java was still loading or working, then approved the proposal and
explicitly requested push and merge.

## Root cause

StudentModuleActivity's busy flag served saving, submitting and executing. Only the footer used
that flag for Working. Console output/status changed after a result, so Java's initial download,
startup or compilation could leave an apparently idle Console. Using the busy flag directly for
Java status would also incorrectly label plain saves/submissions as execution.

Related CKB-054 on the separate sample-first branch addresses finished-run feedback, not this
waiting interval; its existing three render checks passed before the new diagnosis. This fix is
based directly on main, without merging those separate sample/curriculum PRs.

## Durable solution

Track the current run message only inside `run`, beginning before the file save. Show an accessible
`JavaRunProgress` strip above Actual output, with a spinner disabled by reduced-motion preferences.
Report saving, Java starting/running, and output checking. For offline modules, the server executes
and checks in the same request, so use combined running/checking wording. Personal interactive
input waiting replaces the working message. Clear the message in finally after success or failure;
Stop follows the existing unsuccessful-result path. Keep output and completion/submission semantics.

No server, runner protocol, dependency, migration or hosted setting change is required.

## Regression proof

- `tests/java-run-progress.test.mjs`: three named render checks cover idle/finished/failed absence,
  accessible saving/starting/checking messages and input-wait replacement.
- Deliberately made JavaRunProgress return null: two status checks failed (1 pass, 2 failures).
  Restored rendering: all three passed.
- `tests/java-run-progress.browser.mjs`: actual production apps, local Supabase, laptop javac and
  actual online CheerpJ verify delayed saves/startup/results, reduced motion, completion, request
  errors/recovery, compiler errors, Save work without Java status, input/Enter and Stop.
- Implementation `8198348`, [delivery PR #29](https://github.com/SirNeo-Coder/JavaShare/pull/29); teacher explicitly requested merge/push.
- Full test names, commands, failures and limits: [verification](../../verification/java-console-progress.md).

## Recurrence triage

Check that the new build is served and whether runMessage is set before the initial save.
Do not confuse saving or submitting alone with executing. For an indefinitely pending runner,
the existing startup/input/execution timeouts still apply; this indicator does not repair Java
loading failures or change its execution limits.

## History

- 2026-10-21 — Teacher approved the Console status proposal, including animated indicator and
  input waiting; explicitly authorized push/merge. Independent branch `codex/java-console-progress`.
