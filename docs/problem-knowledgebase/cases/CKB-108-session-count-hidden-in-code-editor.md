# CKB-108 — Session step count disappeared in Work in code editor

- Status: resolved on its own branch (`fix/session-count-shared-step`)
- First recorded: 2026-11-11
- Last verified: 2026-11-11
- Area: class session step count — `getSupabaseSessionStepProgress` in `backend/src/supabase-repository.ts`, `class:shared-step` listener in `app/page.tsx`
- Search terms: Step N done chip gone in code editor, count replaced by Shared with class, cannot monitor students while coding, Work in code editor hides done count

## Symptom

Teacher report: during a class session the chip **Step 3 · 11/20 done** showed with the worksheet open, but after
**Work in code editor** only **Shared with class · Stop sharing** remained, so the teacher could not watch who finished.

## Root cause

**Work in code editor** closes the worksheet, which sends "no page" for the session, and shares the step. The count read
only the followed worksheet page, so with the worksheet closed it had no step and the chip hid.

## Durable solution

The count uses the followed page's step while a worksheet page is open; with the worksheet closed it uses the
**Shared with class** step. A share starting or stopping (`class:shared-step`) also re-reads the count.

## Regression proof

- `tests/session-step-done.test.mjs` (real routes): "Work in code editor: with the worksheet closed, the Shared with class
  step is counted (CKB-108)" — shown failing with the server fix removed.
- `tests/session-step-done.browser.mjs` (real app, offline settings): **Work in code editor** keeps **Step 1 · 1/2 done**,
  and a student's finished run then shows **2/2** — shown failing (timeout) on a build without the fix.

## History

- 2026-11-11 — Reported by the teacher with screenshots; fix approved.
