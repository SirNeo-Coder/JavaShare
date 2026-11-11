# CKB-107 — Browser test stops at Week 1 Step 4: the folded worksheet header covers the step tab

- Status: resolved
- First recorded: 2026-11-11
- Last verified: 2026-11-11
- Area: `tests/web-module-steps.browser.mjs` (`openStep` in the student walk; test only, no app change)
- Search terms: locator.click Timeout 20000ms exceeded, Step 4, element is not stable, header intercepts pointer events, printed-output intercepts pointer events, worksheet step tabs fold, student walk stops at Week 1, sample-first weeks subtest fails, every personal subtest fails after it

## Symptom

Building Resume Week 8 (2026-11-11), `tests/web-module-steps.browser.mjs` on Cloudflare's runtime (8787) failed in the student walk
at Week 1 Step 4: `locator.click: Timeout 20000ms exceeded … waiting for locator('#classroom-worksheet').getByRole('button', { name:
/Step 4$/ }) … element is not stable … <pre class="printed-output">… intercepts pointer events … <header>…</header> intercepts pointer
events`. The Week 2–8 personal subtests then failed too (each builds on the walk's progress). The teacher preview and media
subtests passed, so every sample still worked.

## Root cause

The app is right; the test went stale. PR #93 (merged 2026-11-10, CKB-101) folds the worksheet's note, progress and step tabs away
while the worksheet scrolls down and unfolds them when it scrolls back up. The walk opens later steps from the worksheet after an
earlier step left it scrolled down; Playwright scrolls the folded tab into view but does not scroll the worksheet up, so the tab
stays under the worksheet header and the click lands on the header. A student scrolls up and the tabs unfold, so students are not
affected. PR #93's own checks did not run this browser test, and the Week 7 run (2026-11-10) happened before PR #93 merged.

## Durable solution

`openStep` clicks the step tab with `dispatchEvent("click")`, as the test already does for file tabs that the worksheet drawer may
cover. Any new test that clicks a worksheet step tab after the worksheet has scrolled should do the same, or scroll the worksheet
to the top first.

## Regression proof

- `tests/web-module-steps.browser.mjs`: "sample-first weeks (Java workflow): every step of every built week verifies its unchanged
  sample, then completes its task with the answer in solutions/" and the Week 2–8 personal subtests after it.
- Command: `node --test --test-reporter=spec tests/web-module-steps.browser.mjs` with `WEB_STEPS_BASE_URL` 8787 / 3042.
- Shown failing before the fix: yes (8787, 2026-11-11, the error above: 5 passed, 9 failed); passing after it: 8787 14 passed, 5
  skipped, 0 failed (72/72 steps "sample verified, task completed"); 3042 13 passed, 6 skipped, 0 failed.
- Commit: branch `docs/net-resume-week-08`.

## Recurrence triage

"intercepts pointer events" from a worksheet `header` after scrolling means a folded tab; "element is not stable" alone may be the
fold animation. If the tab is visible and the click still does nothing, check the worksheet's own step-tab handler instead.

## History

- 2026-11-11 — Found while building Resume Week 8; the teacher approved the one-line fix in the Week 8 PR.
