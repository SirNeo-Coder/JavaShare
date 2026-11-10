# CKB-105 — Older page could win; a failed release was silent; a student could be pulled back in

- Status: resolved on PR #94 before merge
- First recorded: 2026-11-10
- Last verified: 2026-11-10
- Area: class session (CKB-102) — `app/page.tsx` (teacher page reports, `showClasses`, `loadWorkspace` error path)
- Search terms: students on an older page, turning pages quickly, Class home with no connection, Could not release students from your worksheet, student pulled back into the classroom after Classes, dismissal lost after a failed refresh, CodeRabbit PR #94 third review

## Symptom

Found by CodeRabbit's third review of PR #94, then reproduced in the browser test:

1. Turning pages quickly: if the earlier page report reached the server last, students stayed on the older page.
2. **Class home** when the release request failed: the teacher left with no warning; students stayed following.
3. A student pulled into a session, after any failed classroom refresh, was pulled straight back in when they
   went to **Classes** (the "already joined this session" note was removed).

## Root cause

1. Each page change was sent at once, so two reports could be on the way together.
2. The release was a background request after leaving; its failure was ignored, and messages only show inside the classroom.
3. The CKB-026 rule (a failed scoped load undoes the invitation dismissal) ran for every refresh, not only the first entry.

## Durable solution

1. Page reports go one at a time; while one is on its way, only the newest page waits.
2. **Class home** waits for page reports on their way, then releases the students before leaving; if that fails it stays
   in the classroom and says "Could not release students from your worksheet…" so the teacher can retry or press End session.
3. Only a failed load before the class's workspace has loaded since it was entered undoes the dismissal.

## Regression proof

`tests/class-session.browser.mjs` (real app, offline settings): holds the first page report and checks students end on the
newest page; blocks the release and expects the message with the teacher still in the classroom; fails one student refresh
then checks **Classes** keeps the student there. Each shown failing with its fix removed (rebuilt each time); passing 2/2 restored.

## History

- 2026-11-10 — CodeRabbit third review of PR #94: three findings (two Major, one Minor), all valid; teacher approved the fixes.
  The release message is shown before leaving (instead of after) because messages are not shown on the class list.
