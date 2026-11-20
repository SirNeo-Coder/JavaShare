# CKB-128 — Teacher preview and class-step runs show no result banner

- Status: resolved on `fix/session-step-done-online`
- First recorded: 2026-11-20
- Last verified: 2026-11-20
- Area: module preview (Work in code editor), Share with class step, run feedback
- Search terms: no notification code right, passed the test, teacher view no result, green banner missing,
  class step no green, Matches Expected task output, preview run not checked

## Symptom

In the teacher's Week 15 Module preview, Actual output matched Expected task output exactly, but nothing said so.
Students on the shared class step had no green banner either, though they had one on their own module work.

## Root cause

Teacher previews and the class step are both `kind: "preview"` activities. Their Run code only ran the program, and
`ModuleRunFeedback` is rendered only when `!preview`, so no comparison or banner happened. Not a regression: the
preview was built as "never saved or checked".

## Durable solution

`previewMatch` in `app/StudentModuleActivity.tsx` compares a preview run on the device with the task's expected output,
then the sample's (same `matchesActivityOutput` / `matchesSample` rules as real checks). `PreviewRunFeedback` shows
**Matches Expected task output.**, **Matches Expected sample output.** or **Differs from the expected output.**, with
"Practice only — not saved, and no step is marked Completed." Nothing is saved; no progress changes.

## Regression proof

- `tests/module-run-feedback.test.mjs`: "preview feedback: task, sample and differing runs each get a banner that
  never claims Completed" — failed with the task comparison removed, passed restored.
- `tests/session-step-done.browser.mjs` (offline, laptop Java): the teacher's preview run shows the sample banner;
  Ben's class-step runs show Differs, then Matches Expected task output.

## History

- 2026-11-20 — Fixed on `fix/session-step-done-online`.
