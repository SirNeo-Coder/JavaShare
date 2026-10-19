# CKB-037 — Inter-step discussion moves ahead of its code

- Status: resolved
- First recorded: 2026-10-20
- Last verified: 2026-10-20
- Area: worksheet pages / `app/moduleParts.ts`, `app/ModuleViewer.tsx`
- Search terms: module notes out of order, table before its code, JSON reading order, all discussion in Overview

## Symptom

Checking the supplied Week 14 Collections JSON exposed a pre-release pagination defect: collecting
all non-step blocks in Overview moved method tables and look-closely notes ahead of their code.

## Root cause

The first worksheet grouped by part, then filtered non-step blocks into Overview and steps into
separate pages. That preserved every block but lost the author's reading order within each part.

## Durable solution

`modulePartPages` walks each part in order. Overview contains only the opening discussion; each
step starts a new page and retains its following discussion/tables until the next step. The exit
slip is at the end of that part, rather than before its steps. Named grouping and old-file lesson
fallback are retained; source JSON and all ids stay unchanged.

## Regression proof

- `tests/classroom-ui.test.mjs`: `module worksheet: inter-step tables and notes retain the uploaded reading order`.
- Temporarily restored the collect-all-discussion behavior: 9 passed, this test failed. Restored
  the fix: 10/10 passed. Full suite: 69/69 at this point.
- Exact supplied JSON validated against the real schema and rendered all 11 steps across five
  lesson groups and 17 digital pages. Every supplied step file and expected output was found
  unchanged in the rendered result. Real browser showed the ArrayList table after its output and
  the LinkedList comparison table on Step 2, followed by the Monday liplet.
- Commit: implementation on `codex/printed-module-worksheet`.

## Recurrence triage

Check order as well as presence. Content can all exist but still be confusing if filtering moves
an explanation away from the step it describes. Digital page boundaries are not PDF page numbers.

## History

- 2026-10-20 — Teacher supplied the actual JSON and asked to continue; its inter-step content exposed the issue before release.
