# CKB-080 — Teacher's Run on a media step right after opening or uploading shows a cross

- Status: open — diagnosed, not fixed (outside the approved student-media task; fix proposed to the teacher)
- First recorded: 2026-10-29
- Last verified: 2026-10-29 (on `main` at `7644cf2`, Cloudflare runtime on this laptop)
- Area: `app/ModuleViewer.tsx` `StepView` (teacher **Run** in **View module details**), module media loading
- Search terms: Week 3 Step 2 fails then passes, Page text matches cross on media step, Media checks missing from Your output, flaky Week 3 media browser test, Run right after Add media files

## Symptom

Found while testing students' own media (2026-10-29). `tests/web-module-steps.browser.mjs`, subtest
"Week 3 media (Slice 3b, Cloudflare R2)", fails about 1 run in 2 on unmodified `main` (3 of 6 runs,
then 1 of 10): Week 3 Step 2 shows **✗ Page text matches**, its page checks tick, and there are no
media lines. **Your output** stops after the page text; the required `Media checks:` lines are
missing. Pressing **Run** again passes.

Also seen on the student screen (2026-10-29, sample-first test): pressing **▶ Run code** on a media
step before this device has loaded the module's media runs the page without them; the step first says
"Checked by your teacher for now", then the result list shows that run once the media arrive. The
browser tests wait until the media are loaded before running (same as a student pressing **Run** again).

## Root cause

`StepView` decides at the moment **Run** is pressed whether the module's media files are loaded
(`hasMedia`). If they are still loading, the page runs without them and with no media test. When
loading finishes, the step stops saying "Checked by your teacher for now" and shows the earlier
result — a run without media — as a cross. The browser test presses **Run** straight after **Add
media files**, so it sometimes hits this window; a teacher pressing **Run** quickly can too.

## Durable solution

Not built yet. Proposed: in `StepView`, clear the shown result when the loaded media change (or keep
**Run** disabled while the teacher's media are loading), so a run without media is never shown as the
media step's result.

## Regression proof

None yet. The browser subtest above is the catching test (intermittent); a fix should make it pass
repeatedly (for example 10 runs in a row).

## Recurrence triage

If a media step's **Your output** has no `Media checks:` lines but the media files are listed under
**Media files**, the run started before the files finished loading.
