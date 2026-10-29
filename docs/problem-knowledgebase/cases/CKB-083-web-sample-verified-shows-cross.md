# CKB-083 — After "Sample verified", a web step's result list shows a cross

- Status: resolved (Cloudflare runtime and offline browser checks)
- First recorded: 2026-10-29
- Last verified: 2026-10-29
- Area: `app/StudentModuleActivity.tsx` web result list (`WebCheckList`) in sample-first modules
- Search terms: Sample verified but Page text matches crossed, page checks disappear after sample, Required output shows task output, sample-first web step, Net MVC Java workflow, alteration task web

## Symptom

Found while proving web steps in the Java workflow (sample first, then the task). After the student
runs the unchanged sample, the banner says **Sample verified — now complete Your task.**, but the list
under it shows **✗ Page text matches** with **Required output** = the task's output, and the sample's
page checks vanish. Nothing is saved wrongly; the screen contradicts itself.

## Root cause

The list chose its expected output and page checks from `pendingSample`, which turns false the moment
the sample is verified. The same sample run was then re-judged against the task that had just opened.

## Durable solution

The list judges a run by what that run was checked as (`lastCheck.check`: sample or task); before any
run it follows `pendingSample`.

## Regression proof

- `tests/web-sample-first.browser.mjs`, "a page step opens its sample read-only; the unchanged run
  verifies it with its page check; the task completes it" expects `✓ Page text matches` and
  `✓ Page has 1 ul > li` after **Sample verified**.
- Shown failing on Cloudflare's runtime with the fix removed (`✗ Page text matches` only), passing with
  it restored (5/5), and passing offline (5/5).

## Recurrence triage

If a sample-first web step shows a cross right after **Sample verified**, check which expected output
the list is given for that run.
