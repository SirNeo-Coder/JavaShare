# CKB-140 — A long web result squeezes the task text and runs past the panel

- Status: resolved on `fix/web-results-scroll`
- First recorded: 2026-11-24
- Last verified: 2026-11-24
- Area: right panel of the module code editor on web steps (`app/globals.css`: `.module-activity-details`, `.web-checks`)
- Search terms: console not visible, output occupies the entire area, make it scrollable, instructions squeezed,
  task text one line, Required output cut off, Show page hidden, results not scrollable

## Symptom

A student reported that the console was not visible and the output filled the whole area. In the teacher's screenshots
(.NET 1 Week 1, Steps 1–2), after a run the right panel showed the task text as a thin strip with a tiny scrollbar,
then the banner, then the check list with Required output and Your output running past the bottom of the panel, with
no way to scroll to the rest. Java steps were fine: their Actual output box scrolls.

## Root cause

The right panel is a column. `.web-checks` was `flex:none`, so the web check list always took its full height and never
scrolled; the panel clips anything below (`overflow:hidden`). The task text (`.module-activity-details`) was the only
part allowed to shrink, so a long result squeezed it almost to nothing.

## Durable solution

In the side panel only, the check list may shrink and scrolls on its own (`.module-activity-console>.web-checks`,
`min-height:min(120px,25%)`), and the task text keeps at least `min(100px,25%)`. On a 720-pixel-high screen the task
text, the banner, a scrollable result and Show page all fit. The floating page window is unchanged.

## Regression proof

- `tests/web-results-scroll.browser.mjs` (offline, 1366 × 720, Week 1 Step 9, a run that matches nothing): the task text
  and the result each keep their room, the result scrolls to the end of Your output, Show page stays in the panel.
  Failed with the old CSS, passed restored.
- Unchanged: `tests/workspace-drawers.browser.mjs` 17/17, `web-guided`, `web-sample-first`,
  `dotnet1-week01-three-part`, Java `module-guided` (offline).

## History

- 2026-11-24 — Reported by a student via the teacher; fixed on `fix/web-results-scroll`.
