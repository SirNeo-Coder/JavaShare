# CKB-131 — Preview and class step have no guided example check

- Status: resolved on `fix/preview-guided-check`
- First recorded: 2026-11-20
- Last verified: 2026-11-20
- Area: teacher Module preview, students' class step, practice banner (CKB-128)
- Search terms: no check for the guided sample, guided code no confirmation, not the expected outcome, three checks,
  sample guided task, class step guided example missing

## Symptom

In the teacher's Module preview the unchanged sample went green, but the correct guided example run said
**Differs from the expected output.** The teacher wanted three checks: unchanged sample, guided example, task.

## Root cause

CKB-128's `previewMatch` compared only the task and the sample. `stepPreview` passed only the task's instruction and
expected output, and the shared-step payload left the guided example out, so neither screen knew it.

## Durable solution

`previewMatch` checks task, then guided, then sample. `PreviewRunFeedback` lists **Sample, unchanged code**, **Guided
example** (when the step has one) and **Your task**, each ticked once a run matched during this preview. The task's
`guided` travels with the preview (`stepPreview`) and the shared step (`supabaseSharedStepPayload`), so the class step
shows the discussion and guided example too. Never the answer key; nothing saved; the count still needs the task.

## Regression proof

- `tests/module-run-feedback.test.mjs`: "preview feedback: guided example output matches as guided, and each check stays
  ticked" — failed with the guided comparison removed, passed restored.
- `tests/session-step-done.browser.mjs` (offline): teacher preview shows ✓ Sample ○ Guided ○ Task; Ben's class step
  shows the guided example, his guided run ticks it without counting as done, his task run ticks Task and counts.

## History

- 2026-11-20 — Fixed on `fix/preview-guided-check` (students included at the teacher's request).
