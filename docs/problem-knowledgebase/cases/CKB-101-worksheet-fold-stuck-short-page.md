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

CodeRabbit on PR #93 found two more ways to stay folded, both fixed (teacher approved 2026-11-10):

- The 0.3-second wait after a fold ignored every scroll, so scrolling straight back up stayed folded.
  It now ignores only a move that lands at the page bottom (the move folding itself causes); the
  student's own scrolling up always unfolds.
- Every page change (part buttons, step tabs, **Previous / Next page**) now shows the strip again
  (`showPage`), as the teacher chose.

## Regression proof

- `tests/workspace-drawers.browser.mjs` — "worksheet hover stays open, outside closing preserves pages, Escape restores its ear"
  (teacher and student): "a page that would fit once folded never folds, so scrolling up is never stuck",
  then a long page folds on scroll down, shows on title-bar hover and on scroll up; "scrolling straight
  back up right after folding still shows them"; "keyboard focus on a step tab shows them while folded";
  "changing page shows them again".
- Each new check shown failing (both roles) on a rebuilt app: without the bottom-only wait, without
  `:focus-within`, and without the page-change reset; 17/17 with all restored.
- Shown failing: with the room check removed and the app rebuilt, both roles failed on that assertion
  (14 passed, 3 failed counting the parent); restored, 17/17 passed.
- Commit: branch `feature/worksheet-collapsing-header`
