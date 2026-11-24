# CKB-139 — Web preview and class step list ✗ Page text matches under a green match banner

- Status: resolved on `fix/web-checklist-target`
- First recorded: 2026-11-24
- Last verified: 2026-11-24
- Area: teacher Module preview and students' class step on web steps; `app/StudentModuleActivity.tsx`, `app/WebStepRun.tsx`
- Search terms: red cross under green banner, Page text matches cross in preview, Required output shows sample,
  class step web page says differs, Page has 1 ul > li found 2

## Symptom

On a web step in the teacher's Module preview or the class step, a run that matches the guided example or the task
shows the green **Matches Expected guided output.** / **Matches Expected task output.** banner, but the check list
under it says **✗ Page text matches** (and any sample page check, e.g. **✗ Page has 1 ul > li — found 2**), with
**Required output** showing the sample's output. Seen in `/tmp/codeshare-web-guided-preview.png` and
`/tmp/codeshare-web-guided-class-step.png` from `tests/web-guided.browser.mjs`. Already on main before CKB-138
(task runs showed it too); Java steps have no such list. The student's own work had the same fault one step later: a guided run's list
compared with the task output, so **Guided example verified** sat above ✗ Page text matches.

## Root cause

`app/StudentModuleActivity.tsx` chose the list's target as "the sample" whenever it was a preview, otherwise "the
task" (CKB-083's `shownAsSample`). The guided example was never a target, and a preview never moved past the sample.

## Durable solution

`webListTarget` picks what the list compares with, the same thing the banner checked. Own work: the run's check
(sample, guided example or task). Preview and class step: the check the run matched; a run matching nothing compares
with the next unticked check (Sample → Guided example → Your task; teacher's choice, 2026-11-24). The sample's page
checks show only when the target is the sample (and for older own-work steps without a task id, as before).

## Regression proof

- `tests/module-run-feedback.test.mjs`: "web check list target: preview uses the matched check or the next unticked
  one; own work uses the run's check" — failed with the old rule put back, passed restored.
- `tests/web-guided.browser.mjs` (offline, port 3072): own-work guided run ✓ Page text matches; failed guided run's
  Required output is the guided output; preview no-match run shows the next unticked output; preview guided and task
  matches and the class step guided run list only ✓ Page text matches. With the old rule built: 4 of 5 failed; restored 5/5.
- `tests/web-sample-first.browser.mjs` 6/6 (CKB-083 sample tick kept); `tests/module-guided.browser.mjs` offline 5/5.

## History

- 2026-11-24 — Found during CKB-138 browser testing; teacher approved the fix (next unticked check for no match).
- 2026-11-24 — Fixed on `fix/web-checklist-target`.
