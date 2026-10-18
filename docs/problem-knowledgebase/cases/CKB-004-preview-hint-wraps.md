# CKB-004 — "Press Run to see your page here" split onto three lines

- Status: resolved
- First recorded: 2026-10-16
- Last verified: 2026-10-16
- Area: web projects (stage one PR b), empty preview hint in `app/page.tsx`, `.web-preview-empty` in `app/globals.css`
- Search terms: preview hint broken, Press Run split, text on separate lines, empty preview message layout

## Symptom

Before the first Run of a web project, the preview area showed "Press", "Run", and "to see your page here." on three separate, widely spaced lines. Found during the offline-mode test.

## Root cause

`.web-preview-empty` centres its contents with CSS grid. Grid makes each piece of loose text and each `<b>` a separate cell, so the sentence broke apart.

## Durable solution

The sentence is wrapped in one `<span>`, so the grid has a single cell to centre. Any grid- or flex-centred box holding mixed text and bold words needs that one wrapper.

## Regression proof

- Display-only, checked on screen: one line, "Press **Run** to see your page here." (offline mode, 1440×900, 2026-10-16).
- Commit `02bb903` (PR #2).

## Recurrence triage

Inspect the box in the browser: if the text and the `<b>` show as separate grid items, the wrapper is missing.

## History

- 2026-10-16 — Found in the offline-mode test of PR (b); fixed in the same PR.
