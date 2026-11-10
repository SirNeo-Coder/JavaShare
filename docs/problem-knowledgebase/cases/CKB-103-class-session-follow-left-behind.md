# CKB-103 — Students stayed on the teacher's page after the teacher left; a deleted module blocked Enter classroom

- Status: resolved on PR #94 before merge
- First recorded: 2026-11-10
- Last verified: 2026-11-10
- Area: class session (CKB-102) — `app/page.tsx` (teacher follow effect), `app/ModuleWorkspace.tsx`, `setSupabaseClassSession` in `backend/src/supabase-repository.ts`
- Search terms: students stuck following, page buttons stay grey after Class home, teacher left the classroom, Could not start the class session, module deleted during session, stale follow, CodeRabbit PR #94

## Symptom

Found by CodeRabbit on PR #94, then reproduced:

1. The teacher leaves the classroom (**Class home**, by keyboard) with a module worksheet open. Students keep
   following that page, page buttons greyed out, until **End session** or 30 minutes pass.
2. The teacher deletes or re-uploads the followed module during a session. The next **Enter classroom**
   fails with "Could not start the class session" until the 30 minutes pass.

## Root cause

1. Leaving unmounts the worksheet without reporting it closed, and the page kept the last followed page in
   memory. A pointer click on **Class home** happens to close the worksheet first (outside click), so only
   the keyboard showed the stuck state; but the kept page was also re-sent from the class list (whose first
   class counts as current) and after entering again, racing the release.
2. `PUT .../session` re-checked the kept followed page even when the request didn't send one.

## Durable solution

- `ModuleWorkspace` reports "no page" when it unmounts; the teacher follow effect sends `follow: null` to the
  class it last followed when the current class changes.
- The server checks only a newly sent page; a page report while no session runs starts nothing.

## Regression proof

- `tests/class-session.test.mjs` — "a page report alone never starts one" and "a followed module deleted during the session
  does not block Enter classroom" (real routes); each shown failing with its server change removed.
- `tests/class-session.browser.mjs` — keyboard **Class home**: server page cleared, students' worksheets close, and no later
  request re-sends the old page (session class second in the teacher's list). Shown failing without the release and,
  separately, without the unmount report; passing 3/3 with both.

## History

- 2026-11-10 — CodeRabbit on PR #94: two Minor findings, both valid; teacher approved the fixes.
