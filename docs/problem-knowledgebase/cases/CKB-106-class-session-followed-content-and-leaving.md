# CKB-106 — Followed task page locked, discussion text blank; Class home could miss the release

- Status: resolved on PR #94 before merge
- First recorded: 2026-11-10
- Last verified: 2026-11-10
- Area: class session (CKB-102) — `studentModuleView`/`classSessionFollow` in `backend/src/supabase-repository.ts`, `showClasses`/`sendFollow` in `app/page.tsx`, task slot in `app/ModuleViewer.tsx`
- Search terms: performance task shows Complete the previous part first while following, discussion text missing under a step, blank text after the step, Class home during a page report, students still following after Class home, CodeRabbit PR #94 fourth and fifth reviews

## Symptom

Found by CodeRabbit (reviews on 3a0ba02 and 8bd4cd0), then reproduced:

1. The teacher turns to **Performance task**; a following student who hasn't finished the module sees
   "Complete the previous part first".
2. On a step's page, the discussion text after the step is blank for a student whose next step is locked.
3. A failed page report, then **Class home** while the next report is on its way: the release was skipped.
4. A page turned while **Class home** was releasing could start a report after the release.

## Root cause

1. Task text was sent only by the student's own progress. 2. Text after a step belongs to the next step, and the
followed view opened steps only up to the teacher's step. 3. The release relied on the last-report record, which a failed
report clears. 4. Nothing stopped page reports during the release.

## Durable solution

1. While following the task page, the task text is sent for reading; submitting still checks the student's own progress.
2. While following, the text owned by the next step is sent too; that step itself stays locked.
3–4. **Class home** stops page reports, waits for any on their way, then releases the current class; if that fails, page
reports start again and the message shows. The worksheet's task button is greyed out when there is nothing to start.

## Regression proof

- `tests/class-session.test.mjs` (real routes): "the task page shows the task text for reading; submitting it stays refused" and
  "a followed step's page keeps its discussion text; the next step stays locked" — each shown failing with its fix removed.
- `tests/class-session.browser.mjs`: first report fails once a second waits, the second is held, keyboard **Class home**, a page
  turned during the release — students released, no report after the release. Shown failing with fix 3 and, separately, fix 4
  removed (rebuilt each time); passing 2/2 restored.

## History

- 2026-11-10 — CodeRabbit: four findings, all valid (docstring check not applied); teacher approved all.
