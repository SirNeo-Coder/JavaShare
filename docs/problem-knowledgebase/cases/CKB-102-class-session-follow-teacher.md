# CKB-102 — Class discussion needed manual steps; students didn't follow the teacher

- Status: in progress — slice 1 built (session, pull-in, follow pages, End session, 30-minute end); slice 2 agreed, not built
- First recorded: 2026-11-10
- Last verified: 2026-11-10
- Area: classroom module discussion — `app/page.tsx`, `app/ModuleWorkspace.tsx`, `app/ModuleViewer.tsx`, `app/Landing.tsx`, `app/liveClasses.ts`, `backend/src/supabase-repository.ts`, `backend/src/routes.ts`, `classrooms.session_*`
- Search terms: class mode, enter classroom pulls students in, students follow the teacher's module page, Share with class should be automatic, end session, students behind cannot read the week being discussed, 30 minutes inactive, merit credit during discussion

## Symptom

Teacher request (2026-11-10, screenshot of **Refresh** / **Enter classroom ↗**): entering the classroom
should bring every online student in, keep their work, and show each of them whatever module and
page the teacher opens; **Work in code editor** should reach students without pressing **Share with
class**.

## Root cause

Not a defect. Entering a classroom, opening a module and Share with class (CKB-099) were separate,
manual, per-person actions; students on the class list only got the **Your class is live** popup for
activities and presentations, and prerequisites (CKB-060) kept later weeks unreadable.

## Durable solution (slice 1)

- `classrooms.session_*` (`20261111000100_class_session.sql`). `PUT /api/classes/:id/session`
  (class teacher): **Enter classroom** starts it, the teacher's open worksheet page is sent as
  `follow`, **End session** ends it with the shared step. `session_seen_at` is renewed by the teacher's
  `POST /api/auth/activity`; a read more than 30 minutes later ends it and broadcasts `class:session`.
- Class summaries carry `hasSession` and `liveSessionId: session:<start>`; the student class list
  enters that class automatically, once per session, instead of the popup.
- While a module is followed, `getSupabaseModule`, its progress read and media skip the prerequisite
  check for that module and open steps up to the teacher's step. Writes keep `enforceStudentModuleAccess`.
- Students' worksheets follow the page (`followPage`), with page buttons disabled, no Work in code
  editor and no device copy. During a session the teacher's Work in code editor calls Share with class.

## Regression proof

- `tests/class-session.test.mjs` — "class session: a followed worksheet shows the teacher's page and offers no page buttons" (rule on its own) and
  "class session: real routes start, follow, renew, expire and end a session; reading opens, writing keeps its locks" (real routes, local Supabase).
- `tests/class-session.browser.mjs` — real app, offline settings (laptop Java): a student on the class list is pulled in, two students behind
  follow the teacher's pages into a week they haven't reached, Work in code editor shares the step, End session releases them.
- Shown failing: no extra steps opened, teacher interaction not renewing, expiry ignored, worksheet ignoring the followed page, a progress row
  started by following (route tests); auto-join off, students not following (browser test, each rebuilt); all passed after restoring.
- `tests/class-shared-step.browser.mjs` caught the progress row a followed read used to start; it now presses **End session** first.
- `tests/live-classes.test.mjs` updated: the class list also refreshes on `class:session`.

## Recurrence triage

If students aren't pulled in, check `hasSession` in `/api/bootstrap` and the class list's `class:session` listener.
If a student's worksheet doesn't move, check the teacher's `PUT .../session` follow and that the drawer was
opened by a click (the hover preview isn't followed). If a locked week shows "Complete the previous activity",
check `session_step_id` and `classSessionFollow`.

## History

- 2026-11-10 — CodeRabbit third review: page order, silent failed release, re-join after a failed refresh; fixed (CKB-105).
- 2026-11-10 — CodeRabbit re-review: simultaneous requests could revive End session or a closed page; fixed (CKB-104).
- 2026-11-10 — CodeRabbit on PR #94 found two gaps (leaving the classroom, a deleted followed module); fixed before merge (CKB-103).
- 2026-11-10 — Teacher asked for a class mode; approved slice 1 and slice 2 (A: students read the module up to
  the teacher's page; credit for tasks done in a locked week; earlier weeks stay unfinished). Slice 1 built.
