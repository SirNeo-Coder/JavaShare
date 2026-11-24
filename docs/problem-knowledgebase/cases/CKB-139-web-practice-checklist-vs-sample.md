# CKB-139 — Web preview and class step list ✗ Page text matches under a green match banner

- Status: open (found 2026-11-24 while testing CKB-138; not fixed, waiting for the teacher's decision)
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
(task runs showed it too); Java steps have no such list.

## Root cause (suspected, not yet confirmed in code)

The page's check list is built against the step's own sample output and sample page checks; the practice banner
(CKB-128/131) compares against sample, guided and task separately. In preview the list is never pointed at the
output the run matched.

## Durable solution

Not decided. Likely: in preview and class step, compare the list against whichever target the run matched (or hide
it when the banner already says which matched).

## Regression proof

None yet.

## History

- 2026-11-24 — Found during CKB-138 browser testing; reported to the teacher.
