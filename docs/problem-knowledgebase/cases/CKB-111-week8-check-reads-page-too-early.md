# CKB-111 — Week 8 browser check could read the page window before the student's page arrived

- Status: resolved (test only, no app change)
- First recorded: 2026-11-11
- Last verified: 2026-11-11
- Area: `tests/web-module-steps.browser.mjs` (Week 8 personal subtest, `looks`)
- Search terms: Week 8 personal subtest flaky, Cannot read properties of null getComputedStyle, page window iframe readyState complete too early, CodeRabbit PR #96

## Symptom

Found by CodeRabbit (PR #96 review on 2b764a7); not seen failing yet. The Week 8 check waited only for the page window's frame to
report `readyState === "complete"`, then read `h2`, `.top li:first-child`, `nav a` and `.more a`. A frame can report "complete" for
its empty first document before the student's page is in it, so the check could fail at random although the app is right.

## Root cause

The wait did not include the elements read next; the other weeks' checks already wait for their elements.

## Durable solution

The wait also requires `h2`, `.top li:first-child`, `nav a` and `.more a` to exist, for the student preview and the teacher review.

## Regression proof

- `tests/web-module-steps.browser.mjs` (offline settings, port 3062): 13 passed, 6 skipped (the usual skips), 0 failed.
- Not shown failing first: the race depends on timing and could not be forced reliably.

## History

- 2026-11-11 — CodeRabbit findings on PR #96 checked: this one valid (fixed with the teacher's approval); the non-nav focus link was
  already fixed in 2b764a7; the dispatchEvent click is deliberate (CKB-107).
