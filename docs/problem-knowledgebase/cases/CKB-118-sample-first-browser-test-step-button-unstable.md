# CKB-118 — Sample-first browser test cannot click the worksheet's Step 2 button

- Status: investigating
- First recorded: 2026-11-15
- Last verified: 2026-11-15
- Area: `tests/module-sample-first.browser.mjs` (test only so far; app behaviour not shown to be wrong)
- Search terms: element is not stable, Step 2 button timeout, sample first browser test fails, loads the next sample, deliberate error demonstration, locator.click timeout

## Symptom

`tests/module-sample-first.browser.mjs` fails "loads the next sample, completes its alteration, and restores the
first step after reload" (offline and online) and, offline, "recognizes the deliberate error demonstration without
completing its task". Playwright waits 12 s on the worksheet's `MONDAY · Step 2` button: "element is not stable".
Found while checking the guided-example change (Stage B).

## Root cause

Not diagnosed. It is not the guided-example change: a build of untouched `main` (`d775f87`) fails the same two
tests the same way. The button keeps moving when clicked, probably a worksheet or drawer animation that came after
CKB-077's last fix of this test.

## Durable solution

Not decided. Diagnose before changing either the test or the app.

## Regression proof

- None yet. Command: `SAMPLE_BROWSER_MODE=offline node --test tests/module-sample-first.browser.mjs` against a
  local production build on 3022 (see `docs/verification/module-sample-first.md`).

## Recurrence triage

Compare with CKB-077 (the same test stuck before its first step). Here the first two subtests pass and only the
step-switch click times out.

## History

- 2026-11-15 — Seen during the guided-example work; shown failing on untouched `main` too. Left for its own task.
