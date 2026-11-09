# CKB-096 — Browser tests stop at Submit: "Submitted" also matches "Last submitted"

- Status: resolved
- First recorded: 2026-11-09
- Last verified: 2026-11-09
- Area: `tests/web-module-steps.browser.mjs` (Week 2–5 personal subtests), `tests/web-sample-first.browser.mjs` (test only; no app change)
- Search terms: strict mode violation, .actionbar .sync resolved to 2 elements, Submitted, Last submitted, personal project subtest fails after Submit this version, Week 2 personal performance-task project fails, Week 3 Week 4 Week 5 personal subtests fail

## Symptom

Building Resume Week 5 (2026-11-09), `tests/web-module-steps.browser.mjs` on the offline-settings server (3042) failed in
the Week 2 personal subtest right after **Submit this version**: `locator('.actionbar .sync').filter({ hasText: 'Submitted' })
resolved to 2 elements: <span class="sync" aria-live="polite">Submitted</span> and <span class="sync">Last submitted: Nov 9,
2026, 8:40 AM</span>`. The Week 3, 4 and 5 personal subtests failed the same way (each also builds on the week before's
submission). The student walk (every step of Weeks 1–5) passed.

## Root cause

The app is right; the tests went stale. PR #85 (merged 2026-11-09) shows **Last submitted: <date>** in the personal project's
action bar, in a second `span.sync`. Playwright's `hasText` matches part of the text and ignores capitals, so "Submitted"
matched both spans, and a locator that matches two elements stops in strict mode. PR #85's own checks did not run these
browser tests, and the Week 4 run (2026-11-08) happened before PR #85 merged.

## Durable solution

Tests wait for the sync line whose whole text is exactly "Submitted": `locator(".actionbar .sync", { hasText: /^Submitted$/ })`
(four lines in `tests/web-module-steps.browser.mjs`, one in `tests/web-sample-first.browser.mjs`). Any new test that waits
for a short status word in `.actionbar .sync` should match the whole text.

## Regression proof

- `tests/web-module-steps.browser.mjs`: "Week 2 personal performance-task project (Slice 2)…", "Week 3 personal project…",
  "Week 4 personal project…", "Week 5 personal project…"; `tests/web-sample-first.browser.mjs`.
- Command: `node --test --test-reporter=spec tests/web-module-steps.browser.mjs` with `WEB_STEPS_BASE_URL` 3042 / 8787.
- Shown failing before the fix: yes (3042, 2026-11-09, the error above); passing after it: see the handoff's update log.
- Commit: branch `docs/net-resume-week-05`.

## Recurrence triage

"resolved to 2 elements" on a locator after a UI change means the test's text match is too loose; a timeout with no
"Submitted" at all means the submission itself failed (check the page's alert and `progress/performance-task`).

## History

- 2026-11-09 — Found while building Resume Week 5; the teacher approved fixing the five locators in the Week 5 PR.
