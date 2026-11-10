# CKB-101 — Worksheet header folds on a page that then cannot scroll back up

- Status: resolved
- First recorded: 2026-11-10
- Last verified: 2026-11-10
- Area: classroom Module worksheet folding header — `app/ModuleViewer.tsx` (`ModuleContent`, `foldOnScroll`), `app/globals.css` (`.worksheet-fold`)
- Search terms: worksheet header stuck folded, progress strip hidden, step tabs gone, cannot scroll up, short page, header collapse, fold away

## Symptom

Found while building the folding worksheet header (same branch, before review). On a worksheet page
only a little taller than the worksheet, scrolling down folded the note, **MODULE PROGRESS** and step
tabs away. The page then fit without scrolling, so scrolling up did nothing and they stayed hidden
(only hovering the title bar showed them).

## Root cause

The first version folded whenever the page scrolled down past 24 pixels. Folding gives the page the
header's space; when that space was bigger than the page's remaining scroll room, the scroll position
dropped to the top and no further scroll events could arrive to unfold it.

## Durable solution

`foldOnScroll` folds only when the page would still scroll more than 24 pixels after folding
(page scroll room minus the fold's own height). Short pages never fold; they need no extra room.

## Regression proof

- `tests/workspace-drawers.browser.mjs` — "worksheet hover stays open, outside closing preserves pages, Escape restores its ear"
  (teacher and student): "a page that would fit once folded never folds, so scrolling up is never stuck",
  then a long page folds on scroll down, shows on title-bar hover and on scroll up.
- Shown failing: with the room check removed and the app rebuilt, both roles failed on that assertion
  (14 passed, 3 failed counting the parent); restored, 17/17 passed.
- Commit: branch `feature/worksheet-collapsing-header`
