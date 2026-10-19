# CKB-032 — Module tables and error guides disappear

- Status: resolved
- First recorded: 2026-10-19
- Last verified: 2026-10-19
- Area: module viewer / `app/ModuleViewer.tsx`
- Search terms: module table missing, blank table, error guide invisible, printed module appearance, analogy formatting

## Symptom

While comparing the teacher's printed-module reference with the viewer, tables and error guides
had no visible content. Analogies and notes lost their distinct presentation.

## Root cause

The upload schema already accepted all these blocks, but the viewer's non-step branch rendered
only `term` and `markdown`. Tables use columns/rows; error guides use see/means/fix rows, and error
blocks also have a message. Their real content was never rendered.

## Durable solution

`ModulePaperBlock` renders every existing non-step block type using React text nodes and the
existing restricted inline formatting. Tables scroll within the page, analogies/notes get labelled
boxes, and error guides/errors keep their supplied rows/messages. The worksheet uses those same
blocks on a white paper surface. No PDF upload, external asset or schema change.

## Regression proof

- `tests/classroom-ui.test.mjs`: `module paper: tables, analogies, notes and error guides display their actual supplied content safely`.
- `module worksheet: named parts, real code/output, page controls and hidden practice editors coexist` also checks the task rubric.
- Command: `node tests/classroom-ui.test.mjs`. Temporarily disabling the table renderer produced
  7 passes and 2 failures; restoring it passed all 9. This explicitly reproduces the omitted table
  path, not a claim that the entire old viewer was restored.
- Real offline browser displayed a supplied table, analogy, note and error guide in an isolated
  local test module. Full results: `docs/verification/printed-module-worksheet.md`.
- Commit: `9b538d5` on `codex/printed-module-worksheet`; [PR #16](https://github.com/SirNeo-Coder/JavaShare/pull/16).

## Recurrence triage

Inspect the uploaded block type and actual server response first. A lesson closed by the teacher
correctly has no blocks sent to the student. Do not fill a closed page with copied sample content.

## History

- 2026-10-19 — Found during the teacher-approved worksheet workflow change; rendered the existing content types and added regression proof.
