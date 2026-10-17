# CKB-014 — A correct run's output could be replaced by a save-failure message

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: `app/ModuleViewer.tsx`
- Search terms: run output disappeared, correct output replaced with error, step output
  overwritten, save failed but showed run error, StepView run output lost

## Symptom

Not a live incident — an open finding from `/code-review` on PR #6/#7, tracked in
`docs/handoffs/stage-two.md`, before either PR shipped to a student. In `StepView.run`, running a
java step and saving its progress result shared one `try` block: `setOutput(result.output)` ran
first (showing the student's real program output), then the progress-save PUT ran inside the same
`try`. If that save failed, the single outer `catch` replaced the already-correct output with a
generic "Could not run this step" message - a student who ran correct code would see an error
message where their correct output had just been, with no way to tell their code actually worked.

## Root cause

The run and the save were two independent operations with two independent failure modes, but
only one `catch` covered both - a failure in the second (save) overwrote the result of the first
(run) because `setOutput` was called again, unconditionally, in the shared catch block.

## Durable solution

The save call now lives in its own `saveStepResult` helper with its own try/catch. On success it
behaves as before (`onChecked(status)`). On failure it appends a note to the existing output
(`setOutput((current) => \`${current}\n\n(Could not save this result: ...)\`)`) instead of
replacing it, so the real program output stays visible.

## Regression proof

- No frontend test harness exists in this repo; verified live in a real browser instead (same
  method as CKB-008), against a live local-Supabase-backed dev server (`npm run dev`).
- With `window.fetch` patched to reject only requests to `/progress/step`: running Tuesday's step
  (expected output "3\n2\n1") showed the real output `3 2 1` followed by "(Could not save this
  result: Simulated network failure)" underneath it - the correct output was not replaced.
  Restored `fetch` and re-ran Monday's step for real: it showed "1 2 3" and a "PASSED" chip with
  no save-failure note, confirming the fix didn't change the working path.
- Commit: this change, branch `module-viewer`.

## Recurrence triage

If a future symptom is "the output on screen doesn't match what the code actually printed," check
whether a run and a save (or any two independent network calls) share one try/catch before
assuming the execution result itself is wrong.

## History

- 2026-10-18 — Found by `/code-review` on PR #6/#7, tracked as an open finding in
  `docs/handoffs/stage-two.md`. Fixed in this change: the save call split into its own
  `saveStepResult` helper with its own try/catch, verified live by simulating a save failure and
  confirming the real output survives, then confirming the real (non-simulated) path still works.
