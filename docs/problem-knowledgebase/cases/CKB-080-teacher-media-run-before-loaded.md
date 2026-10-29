# CKB-080 — Teacher's Run on a media step right after opening or uploading shows a cross

- Status: resolved (Cloudflare runtime, repeated runs; offline unchanged)
- First recorded: 2026-10-29
- Last verified: 2026-10-29 (fix on `fix/media-run-before-loaded`, Cloudflare runtime on this laptop)
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

**Run** cannot start on a media step until this device has the module's media (teacher approved
2026-10-29). Student: `StudentModuleActivity` keeps **▶ Run code** off, labelled **Loading media…**,
until the media list and files have loaded (or failed, offline), and `run()` refuses while loading.
Teacher: `ModuleContent` passes `mediaLoading` (loaded files belong to an older list) to `StepView`, whose
**Run** on a media step shows **Loading media…** and stays off; a failed load counts as "no media", so the
step falls back to **Checked by your teacher for now** instead of waiting forever.

## Regression proof

- `tests/web-module-steps.browser.mjs` on the teacher's revised Weeks 1–3 (Cloudflare runtime, local R2).
  The student walk no longer waits for the media itself; the teacher preview presses **Run** at once.
- Without the fix: 3 of 3 runs failed — the student walk stopped at Week 3 Step 2 every time, and the
  teacher preview showed `✗ Page text matches` on Step 2 in 1 of 3. On `main` before: 3 of 6 and 1 of 10.
- With the fix: 6 of 6 runs passed (9 pass, 5 skipped, 0 fail), and once more after restoring it.
- Offline (no media storage): 7 pass, 7 skipped, 0 fail; media steps still fall back to **Mark done**.

## Recurrence triage

If a media step's **Your output** has no `Media checks:` lines but the media files are listed under
**Media files**, the run started before the files finished loading.
