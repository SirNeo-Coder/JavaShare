# Teacher progress dashboard verification — 2026-10-20

Branch: `codex/teacher-progress-dashboard` (based on `codex/printed-module-worksheet`).
All names and accounts in screenshots are disposable local fixtures, not real students.

## Required checks

- `npm run build:all`: passed for pages and server.
- `npm run lint`: passed with 0 errors and 8 existing warnings in `app/CodeEditor.tsx` and `app/page.tsx`.
- `npm test -- --test-concurrency=1 --test-reporter=spec`: 80 tests passed, 0 failed, 0 skipped.
- Final suite includes all 11 dashboard checks (2 rendered-HTML/style checks, 8 HTTP subchecks,
  and their parent test). The final isolated HTTP run also passed 9/9 including its parent.
- `npm run classroom:offline`: local Supabase start and build passed; launcher reused the existing
  port-3000 classroom. `npm run classroom:offline -- --build-only` passed for the final source.
  The final production build was also served separately on local port 3100 with local Supabase
  and laptop Java enabled, preserving the existing classroom server.

## Test levels and regression proof

- `teacher-dashboard.test.mjs` calls the real shared HTTP handler against local Supabase. It tests
  class ownership, authentication, current membership, calculation parity with student summaries,
  closed lessons, both submission slots, removed task/module records, empty classes, pagination,
  refresh, average-status rounding, and no progress writes or student-source disclosure. These are server integration
  checks; they do not drive a browser.
- `teacher-dashboard-ui.test.mjs` renders React HTML and inspects dashboard CSS. These are isolated
  rendering/style checks, not click-through app tests. The real app was checked separately below.
- CKB-010: removing the new progress query's class filter failed four subchecks. Totals incorrectly
  changed from 20% to 33%, and the same student's other class leaked into this class. Restored:
  all focused checks passed.
- CKB-039: restoring the shared `.teacher-avatar` name in the new component and styles failed the
  avatar isolation test. Restored: both rendering checks passed.
- CKB-041: deriving status from the rounded mean failed both new boundary tests: averages that
  round to 100% with unfinished work, and to 0% with some work. Restored: final suite passed.
- CKB-040: Cancel initially left focus on BODY. Focusing a trigger before closing the native modal
  also failed. Final browser result is recorded below. There is no automated native-dialog focus
  harness; no automated failing-before/passing-after claim is made for this interaction.

## Real-app checks

- Teacher sign-in, class overview, saved counts, Students and Curriculum navigation: passed.
- Student name search and completion filter combination, including no-match state: passed.
- Individual student: 1 of 3 modules complete, 33% overall, with 100%/0%/0% module cards: passed.
- Empty class: zero totals and Curriculum's Add module guidance: passed.
- Add module: uploaded `tests/fixtures/sample-module.codeshare.json`; module count changed from
  3 to 4, lesson count from 6 to 8, and the full-module mean changed from 10% to 7%: passed.
- View module details: existing teacher preview and lesson/task Open to students switches: passed.
- First lesson's Open to students switch saved and showed checked: passed.
- Teacher Run used laptop Java and printed `1`, `2`, `3`: passed.
- Back to modules returned to the new Curriculum cards: passed.
- Delete module opened a modal and focused Cancel; Cancel preserved the module: passed.
- Final CKB-040 check: Cancel returned focus to the original Delete module BUTTON; before the fix,
  the same check returned BODY. The final check was run against the last offline production build.
- Desktop browser reported 1500 CSS pixels with three module columns and no horizontal overflow.
  Final screenshots: [desktop](teacher-dashboard-desktop.jpg), [narrow layout](teacher-dashboard-phone.jpg).
- Narrow-screen navigation, filters, card stacking and no horizontal overflow: checked in the
  desktop app's browser. Its viewport/zoom scaling prevented an exact 390-CSS-pixel emulation;
  the narrow layout was inspected at the actual reported width, not claimed as a real phone.

## Limits and untested areas

- No hosted changes or deployments, no migration, no new internet-loaded assets.
- Cloudflare production and a real phone or second classroom device were not tested.
- Full destructive Delete confirmation was not clicked in the browser; the existing module
  deletion route is covered by `tests/course-modules.test.mjs`. Cancel was tested in the browser.
- Interrupted uploads, a deliberately failed delete, and a real session expiry were not simulated.
- Progress is saved completion, not grades, learning time, weekly trends, or streaks. Refresh is
  explicit; this dashboard does not subscribe to live progress events.

## Earlier check failures, corrected or rerun

- The initial new fixture batch omitted an empty `performance_task` value on one row and failed
  the table's NOT NULL constraint. The fixture now provides `{}` explicitly; route assertions pass.
- Lint initially rejected a test variable named `module`; renamed it to `courseSummary`.
- One full-suite attempt reported 78 passed / 2 failed (the parent and one child) when local
  Supabase returned “An invalid response was received from the upstream server” while inserting
  classroom membership for a test fixture. No dashboard assertion ran in that child. The isolated
  rerun passed; the final full sequential run passed 80/80. The underlying transient cause was not
  established, and no retry was added to mask it.
- Deliberate CKB-010, CKB-039 and CKB-041 mutation failures are regression proof, not unresolved
  final failures. All modified source was restored before final checks.

## Full test results by file

Command: `npm test -- --test-concurrency=1 --test-reporter=spec`. Marks and names follow the runner.

### tests/api-router.test.mjs

- ✔ router: path parameters, query, cookies, and JSON body reach the handler
- ✔ router: middleware passes on with next(), stops by responding, and next(error) reaches the error handler
- ✔ router: cookies, 204, unknown routes, bad JSON, and size limits
- ✔ router: the larger JSON body cap is scoped to the module-upload route, not every route
- ✔ routes: register, stay signed in with the cookie, get a live pass, sign out
- ✔ routes: a chat message's live signal finishes sending before the reply (CKB-006)

### tests/classroom-ui.test.mjs

- ✔ module catalog: displays saved progress and distinguishes continuing from reviewing
- ✔ module catalog: the server's live lock disables opening and only the weekly pick gets its badge
- ✔ module catalog: teacher browsing never invents student progress
- ✔ workspace drawers: closed panels stay mounted but inaccessible so closing can animate
- ✔ module pages: inactive lessons and task editors stay mounted so navigation cannot discard drafts
- ✔ module parts: author grouping spans days and assigns discussion and exit slips exactly once
- ✔ module parts: older lessons and redacted closed lessons retain their own safe pages
- ✔ module paper: tables, analogies, notes and error guides display their actual supplied content safely
- ✔ module worksheet: named parts, real code/output, page controls and hidden practice editors coexist
- ✔ module worksheet: inter-step tables and notes retain the uploaded reading order

### tests/course-module-schema.test.mjs

- ✔ course module schema: accepts a module matching docs/course-format.md
- ✔ course module schema: rejects a step missing expectedOutput
- ✔ course module schema: rejects an unknown course
- ✔ course module schema: rejects the wrong format tag
- ✔ course module schema: rejects a step id reused by another lesson's step (CKB-007's bug class, reachable at upload)
- ✔ course module schema: rejects a step id that collides with an exit slip's id
- ✔ course module schema: rejects a java step file path that /api/execute could never run (a space)
- ✔ course module schema: rejects a java step file path over /api/execute's 160-character cap
- ✔ course module schema: rejects an unrunnable .java performance-task file path
- ✔ course module schema: rejects duplicate lesson ids before they can share an availability switch (CKB-019)
- ✔ course module schema: accepts a module with no step `part` fields, unchanged (backward compatible)
- ✔ course module schema: accepts a step with a `part` title, including one shared across two lessons
- ✔ course module schema: rejects an empty `part` title

### tests/course-modules.test.mjs

- ✔ course modules: teacher uploads, class members read, only the teacher may upload or delete

### tests/kb-search.test.mjs

- ✔ kb:search finds the matching bug record first
- ✔ kb:search says so when nothing matches

### tests/landing-pages.test.mjs

- ✔ landing pages: class roster, a student's own module summary, and a teacher's view of a student's progress
- ✔ class list and creation: a teacher creates classes, a student joins one, and one class's workspace never bleeds into another's

### tests/live-classes.test.mjs

- ✔ live invitations: all live classes are offered, dismissal hides only that session, and a new activity invites again
- ✔ live invitations: refresh preserves dismissal, ending a session clears it, and a stopped presentation can invite again
- ✔ live invitations: receive-only listeners refresh on start, stop, and reconnect; cleanup removes their channels and ignores late events
- ✔ live invitations: entering or leaving the workspace waits for old channels to close before reusing their topics

### tests/module-availability.test.mjs

- ✔ module availability: unknown modules and step ids cannot create progress (CKB-018)
- ✔ module availability migration: preserves existing content and work, opens existing modules, defaults new uploads closed, and safely reruns
- ✔ module availability: new modules withhold closed content and reject direct progress writes; only the class teacher can open them
- ✔ module availability: closing and reopening preserves work and the full-module meter; reupload preserves settings and new lessons start closed
- ✔ module availability: the same module in two classes has independent switches, and concurrent teacher edits keep both changes
- ✔ module availability: modules without a performance task reject its switch and submission

### tests/module-progress.test.mjs

- ✔ module progress: step checklist, exit slip, and both performance-task versions (new feature, no prior CKB)
- ✔ module progress: two simultaneous first touches of a module don't 500 (write race)
- ✔ module progress: a module in two classrooms doesn't share one student's progress (classroom scoping)
- ✔ module progress: two simultaneous performance-task submissions don't lose one (write race)

### tests/module-weekly-active.test.mjs

- ✔ module weekly active + shared project: pick, lock, and project file round-trip

### tests/realtime.test.mjs

- ✔ realtime: an unrelated topic's subscriber never waits on another topic's pending removal
- ✔ realtime: resubscribing the same topic waits for its own pending removal to finish first (CKB-017)
- ✔ realtime: signing out clears pending cleanup so the next sign-in's subscriber never waits on the discarded client's teardown
- ✔ offline: classroom devices reach local Supabase through the laptop's address
- ✔ throttle sends at most once per interval and never drops the newest value
- ✔ channel rules: members join, outsiders are refused, only the teacher broadcasts to the class
- ✔ browser pass cannot read tables directly

### tests/teacher-dashboard-ui.test.mjs

- ✔ teacher dashboard: navigation maps Students and Curriculum and exposes loading instead of fake totals
- ✔ teacher dashboard: avatar styles cannot override the existing classroom avatar (CKB-039)

### tests/teacher-dashboard.test.mjs

- ✔ refuses signed-out users, students, foreign teachers, and invalid class IDs
- ✔ counts saved completion and both submissions, including closed lessons, without exposing source
- ✔ keeps the same student's progress separate between classes and excludes former members
- ✔ returns finite zero totals for empty classes and modules with no students
- ✔ rounded 100% averages do not label unfinished students or modules Finished (CKB-041)
- ✔ rounded 0% averages retain In progress when a student has completed an item (CKB-041)
- ✔ reads every progress page instead of silently truncating a full year
- ✔ a new read reflects saved results without changing student progress
- ✔ teacher dashboard

### tests/teacher-web-projects.test.mjs

- ✔ teacher web projects: lists every personal web project for the selected student and class, and reads saved files on demand
- ✔ teacher web projects: only the owning teacher reads a current class member's projects; guesses and write methods are refused
- ✔ teacher web projects: empty lists and files are readable, repeated reads never save, and a student's save appears on refresh
- ✔ teacher web preview: blocks network resources before student code while preserving the doctype and console line map
- ✔ teacher web preview: allows eval/Function so a saved eval()-based calculator behaves the same as it does for the student
- ✔ teacher web preview: headless pages retain console locations and missing HTML keeps its existing warning

### tests/web-workspace.test.mjs

- ✔ inlines linked CSS and JavaScript, no external loads
- ✔ maps document lines back to the student's file and line
- ✔ capture script sits on the <head> line and does not shift lines
- ✔ works without <head>, and warns about missing files
- ✔ a </script> inside JavaScript cannot break out of the inlined script
- ✔ no index.html gives a friendly message
- ✔ file names must fit the project language
