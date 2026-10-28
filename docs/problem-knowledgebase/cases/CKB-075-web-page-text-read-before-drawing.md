# CKB-075 — Web step page text read before the preview frame had drawn

- Status: mitigated (fix in place; could not be reproduced on demand)
- First recorded: 2026-10-28
- Last verified: 2026-10-28
- Area: `app/webPreview.ts` capture script, `app/WebStepRun.tsx`
- Search terms: Your output shows indentation, raw HTML text spacing, page text has leading spaces, innerText wrong, correct sample fails, Page text matches cross on unchanged sample

## Symptom

During Slice 1 browser checks, the unchanged Week 2 sample failed twice (Steps 2 and 3 in two
runs): **Your output** showed the page text with the source file's indentation and blank lines,
like `textContent`, instead of the visible text.

## Root cause

Most likely: the page text was read on `load` plus one timer, before the new sandboxed (separate
origin) frame had been laid out. Without a layout, `innerText` falls back to the raw text. After
the failure the same frame returned the correct `innerText`, and its size differed from its box,
showing it had been resized after the read. Not proven: six later runs with the old code passed.

## Durable solution

The capture script waits for two animation frames after `load` before reading `innerText`
(animation frames only run once the frame draws), and `useWebPageRun` scrolls the new frame into
view so it can draw. A frame that never draws ends after 5 seconds with a clear message.

## Regression proof

- `tests/web-module-steps.test.mjs`: "web preview: the sandbox reports page text after drawing,
  flags uncaught errors, and opens the run file" checks the capture script waits for drawing.
- `tests/web-module-steps.browser.mjs`: "a preview that starts below the screen edge still reads
  the drawn page text, not the raw source" checks the fix does not time out on short screens.
- Not shown failing: with the old code rebuilt, the Week 2 steps passed in 6 of 6 browser runs, so no test
  reliably catches this bug.

## Recurrence triage

Indented or extra-blank **Your output** for an unchanged sample points here. A real text difference
in one line (for example `Visible page text: X` on one line) is the module file, see CKB-074.

## History

- 2026-10-28 — Found while testing Slice 1 web module steps; fixed before delivery.
