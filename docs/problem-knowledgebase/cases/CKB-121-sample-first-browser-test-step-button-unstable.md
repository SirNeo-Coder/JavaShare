# CKB-121 — Sample-first browser test cannot click the worksheet's Step 2 button

- Status: resolved
- First recorded: 2026-11-15
- Last verified: 2026-11-15
- Area: `tests/module-sample-first.browser.mjs` (`openStep`; test only, no app change)
- Search terms: element is not stable, Step 2 button timeout, sample first browser test fails, loads the next sample, deliberate error demonstration, locator.click timeout, paper-instructions intercepts pointer events, printed-output intercepts pointer events, header intercepts pointer events

## Symptom

`tests/module-sample-first.browser.mjs` fails "loads the next sample, completes its alteration, and restores the
first step after reload" (offline and online) and, sometimes, "recognizes the deliberate error demonstration without
completing its task" (online every time after the first failure; offline it passed in two of two runs on 2026-11-15).
Playwright waits 12 s on the worksheet's `MONDAY · Step 2` button: "element is not stable", then
`<div class="paper-instructions">`, `<pre class="printed-output">` or `<header>` "intercepts pointer events".
Found while checking the guided-example change (Stage B); it fails the same way on untouched `main` (`d775f87`).

## Root cause

The app is right; the test went stale, the same way as CKB-107. Since CKB-101 (PR #93, 2026-11-10) the worksheet's
progress and step tabs fold away while the worksheet scrolls down. The first subtest's **Work in code editor** click
scrolls the Step 1 page down, so the tabs fold. When the worksheet reopens (now on Step 2) they are still folded.
Measured just before the click: the drawer slide settles after about 280 ms (that is the brief "not stable"); afterwards
the button sits still at its place under the scrolled worksheet (scrolled 891 px), covered by the page's content.
Playwright scrolls the button "into view" but cannot unfold the tabs, so it never clicks. A student scrolls up or
hovers the title bar and the tabs return. This test was last refreshed (CKB-077, 2026-10-28) before the fold existed.

## Durable solution

`openStep` clicks the step tab with `dispatchEvent("click")`, as `tests/web-module-steps.browser.mjs` does since
CKB-107. Any test that clicks a worksheet step tab after the worksheet has scrolled should do the same, or scroll the
worksheet to the top first. Not changed (teacher's choice, 2026-11-15): when the worksheet moves to the next unfinished
step by itself after a completion, the folded tabs stay folded; choosing a page by hand unfolds them.

## Regression proof

- `tests/module-sample-first.browser.mjs`, offline (3022) and online (app 3030, runner 3031 — 3020/3021 were in use by
  another session; only the base address in a temporary copy changed), local production build of `d775f87`.
- Command: `SAMPLE_BROWSER_MODE=offline|online CODESHARE_PLAYWRIGHT_MODULE=… PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=… node --test --test-reporter=spec tests/module-sample-first.browser.mjs`
- Shown failing before the fix: offline 3 passed / 2 failed; online 2 passed / 3 failed (both step-switch subtests).
  After: offline 5/5 three runs in a row; online 5/5.
- No deliberate app break: no app code changed.
- Commit: branch `fix/sample-first-step-tab`.

## Recurrence triage

Same as CKB-107: "intercepts pointer events" from worksheet content or a `header` after scrolling means a folded step
tab. "Element is not stable" alone for well under a second is the drawer slide. If the tab is visible and the click
still does nothing, check the worksheet's own step-tab handler instead.

## History

- 2026-11-15 — Seen during the guided-example work; shown failing on untouched `main` too. Left for its own task.
- 2026-11-15 — Diagnosed as the CKB-107 folded-tab cause; test-only fix approved by the teacher.
