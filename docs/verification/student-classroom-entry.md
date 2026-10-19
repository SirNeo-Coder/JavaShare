# Student classroom entry — verification

2026-10-20, branch `codex/student-classroom-entry`. Approved workflow change and orphan cleanup. No hosted services changed.

## Results and limits

- PASS — `npm run classroom:offline -- --build-only`: local Docker Supabase and the offline launcher ran the complete `npm run build:all` (Next frontend plus backend TypeScript). Local health reported `supabase-local`, connected, repository ready. Refreshed only the supervised Next worker; local port 3000 stays running.
- PASS WITH EXISTING WARNINGS — `npm run lint`: exit 0; 0 errors, 8 warnings (seven existing image-element warnings and the existing classroom live-effect dependency warning). No new warning category added. Node also printed its existing typeless-package notices during tests.
- PASS — `npm test`: **88 pass, 0 fail, 0 skipped, 0 cancelled**. Names grouped by file below, retaining the runner's ✔ marks (the teacher-dashboard parent is included in the runner's count).
- PASS — `npx tsc --noEmit` and `git diff --check`.
- PASS — focused regression: `node --test tests/student-classroom-entry.test.mjs`, 8/8. Replaced only `Landing.tsx` temporarily with the previous committed version: 7 pass / **1 fail**, specifically **student chooser: a former class-home selection cannot resurrect the removed module landing page**. Restored the fixed file byte-for-byte: 8/8 pass. The full suite/build above used the restored implementation.
- LIMIT — required-password-reset screen was observed before classroom entry. No password was changed through the form, so completion of that credential flow was not tested. Clearing the generated profile flag alone did not clear the existing session's reset claim; that is not a simulated successful password change.
- LIMIT — session-expiry recovery was inspected for parity with logout, not forced through an expired browser session. Denied browser storage is covered by an injected storage test, not an OS privacy setting. No hosted deployment, physical classroom device, full Wi-Fi disconnection, or fresh live-invitation announcement was tested in this pass.

## Rule checks and real-app checks

The six new destination/storage tests exercise entry rules on their own; the two chooser tests render the real React component on the server without browser effects. They do not prove sign-in or networking by themselves. Existing route/repository tests use local Supabase to check authentication, memberships, class-scoped files, progress and permissions. Router, schema, rendering, preview, helper and throttle tests check their own layers. The following browser checks exercise the built app, normal sign-in forms, real route calls and local Supabase together.

## Local offline browser checks

Used six generated accounts and three isolated QA classes; no real student data. The generated records were validated by exact IDs/names/emails and deleted after the checks. Temporary fixture credentials and local service environment capture were removed.

1. PASS — Student with one membership signed in directly to the correct classroom and **My Practice Code**, with **Classes**, **Modules**, left module/project controls and right chat control. Refresh reopened the same class.
2. PASS — **Classes** opened and stayed on the chooser even with one membership; **Join another class** remained and **Your modules** was absent. **Open class** entered directly.
3. PASS — New multi-class student saw the chooser. Opening Beta, refreshing, switching through **Classes** to Alpha, then signing back in reopened the last successful class.
4. PASS — Another student signed in on the same browser and entered their own sole class (Beta). Returning to the multi-class account reopened its Alpha preference.
5. PASS — Removed only the generated multi-class account's remembered Alpha membership. Refresh showed Beta/Gamma in the chooser and did not reopen Alpha.
6. PASS — Student without memberships saw **Join your class**. Joining with the generated Alpha code opened the classroom immediately. **Module** opened the existing **Course modules** browser.
7. PASS — Generated reset-required student saw **Create a new password**, before any classroom. No credential was entered or changed.
8. PASS — Teacher signed in to **Classes**, opened the existing Overview/Students/Curriculum dashboard, used **Enter classroom**, then **Class home** returned to that same dashboard.
9. PASS — Loaded the multi-class chooser, then removed its Beta membership before pressing the now-stale **Open class**. The real server refused entry with **Classroom access denied**. **Retry** retained the error safely, **Classes** recovered to the sole remaining Gamma card without auto-entry, and **Open class** successfully entered Gamma.

Screenshot of direct student arrival: `/tmp/codeshare-student-entry.png` (generated QA identity only).

## Orphan sweep

Removed `StudentModules`, `ModuleStatus`/`ModuleSummary`, `statusLabel`, the old local `ProgressBar`, `selectedModuleId`, its `openClassroom` reset wrapper and the obsolete module-open invitation guard from `Landing.tsx`. Removed only the six `activity-summary-*` CSS selectors whose last caller was that screen. The module-summary API, shared progress styles, teacher dashboard, module worksheet and existing messaging remain in use. No route, migration or dependency was removed.

## Full test runner results

Command for every file below: `npm test` → `node --test "tests/*.test.mjs"`.

### `tests/api-router.test.mjs`

- ✔ router: path parameters, query, cookies, and JSON body reach the handler
- ✔ router: middleware passes on with next(), stops by responding, and next(error) reaches the error handler
- ✔ router: cookies, 204, unknown routes, bad JSON, and size limits
- ✔ router: the larger JSON body cap is scoped to the module-upload route, not every route
- ✔ routes: register, stay signed in with the cookie, get a live pass, sign out
- ✔ routes: a chat message's live signal finishes sending before the reply (CKB-006)

### `tests/classroom-ui.test.mjs`

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

### `tests/course-module-schema.test.mjs`

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

### `tests/course-modules.test.mjs`

- ✔ course modules: teacher uploads, class members read, only the teacher may upload or delete

### `tests/kb-search.test.mjs`

- ✔ kb:search finds the matching bug record first
- ✔ kb:search says so when nothing matches

### `tests/landing-pages.test.mjs`

- ✔ landing pages: class roster, a student's own module summary, and a teacher's view of a student's progress
- ✔ class list and creation: a teacher creates classes, a student joins one, and one class's workspace never bleeds into another's

### `tests/live-classes.test.mjs`

- ✔ live invitations: all live classes are offered, dismissal hides only that session, and a new activity invites again
- ✔ live invitations: refresh preserves dismissal, ending a session clears it, and a stopped presentation can invite again
- ✔ live invitations: receive-only listeners refresh on start, stop, and reconnect; cleanup removes their channels and ignores late events
- ✔ live invitations: entering or leaving the workspace waits for old channels to close before reusing their topics

### `tests/module-availability.test.mjs`

- ✔ module availability: unknown modules and step ids cannot create progress (CKB-018)
- ✔ module availability migration: preserves existing content and work, opens existing modules, defaults new uploads closed, and safely reruns
- ✔ module availability: new modules withhold closed content and reject direct progress writes; only the class teacher can open them
- ✔ module availability: closing and reopening preserves work and the full-module meter; reupload preserves settings and new lessons start closed
- ✔ module availability: the same module in two classes has independent switches, and concurrent teacher edits keep both changes
- ✔ module availability: modules without a performance task reject its switch and submission

### `tests/module-progress.test.mjs`

- ✔ module progress: step checklist, exit slip, and both performance-task versions (new feature, no prior CKB)
- ✔ module progress: two simultaneous first touches of a module don't 500 (write race)
- ✔ module progress: a module in two classrooms doesn't share one student's progress (classroom scoping)
- ✔ module progress: two simultaneous performance-task submissions don't lose one (write race)

### `tests/module-weekly-active.test.mjs`

- ✔ module weekly active + shared project: pick, lock, and project file round-trip

### `tests/realtime.test.mjs`

- ✔ realtime: an unrelated topic's subscriber never waits on another topic's pending removal
- ✔ realtime: resubscribing the same topic waits for its own pending removal to finish first (CKB-017)
- ✔ realtime: signing out clears pending cleanup so the next sign-in's subscriber never waits on the discarded client's teardown
- ✔ offline: classroom devices reach local Supabase through the laptop's address
- ✔ throttle sends at most once per interval and never drops the newest value
- ✔ channel rules: members join, outsiders are refused, only the teacher broadcasts to the class
- ✔ browser pass cannot read tables directly

### `tests/student-classroom-entry.test.mjs`

- ✔ student entry: a single membership opens that classroom even with an obsolete saved choice
- ✔ student entry: multiple memberships reopen only a remembered class the student still belongs to
- ✔ student entry: no membership never opens a saved or invented classroom
- ✔ student entry: teachers, required password reset and explicit Classes navigation do not auto-enter
- ✔ student entry: remembered classrooms stay separate for different accounts on a shared browser
- ✔ student entry: unavailable browser storage still permits single-class entry and safe multi-class choice
- ✔ student chooser: a former class-home selection cannot resurrect the removed module landing page
- ✔ teacher chooser: class creation and the teacher dashboard entry remain available

### `tests/teacher-dashboard-ui.test.mjs`

- ✔ teacher dashboard: navigation maps Students and Curriculum and exposes loading instead of fake totals
- ✔ teacher dashboard: avatar styles cannot override the existing classroom avatar (CKB-039)

### `tests/teacher-dashboard.test.mjs`

- ✔ refuses signed-out users, students, foreign teachers, and invalid class IDs
- ✔ counts saved completion and both submissions, including closed lessons, without exposing source
- ✔ keeps the same student's progress separate between classes and excludes former members
- ✔ returns finite zero totals for empty classes and modules with no students
- ✔ rounded 100% averages do not label unfinished students or modules Finished (CKB-041)
- ✔ rounded 0% averages retain In progress when a student has completed an item (CKB-041)
- ✔ reads every progress page instead of silently truncating a full year
- ✔ a new read reflects saved results without changing student progress
- ✔ teacher dashboard

### `tests/teacher-web-projects.test.mjs`

- ✔ teacher web projects: lists every personal web project for the selected student and class, and reads saved files on demand
- ✔ teacher web projects: only the owning teacher reads a current class member's projects; guesses and write methods are refused
- ✔ teacher web projects: empty lists and files are readable, repeated reads never save, and a student's save appears on refresh
- ✔ teacher web preview: blocks network resources before student code while preserving the doctype and console line map
- ✔ teacher web preview: allows eval/Function so a saved eval()-based calculator behaves the same as it does for the student
- ✔ teacher web preview: headless pages retain console locations and missing HTML keeps its existing warning

### `tests/web-workspace.test.mjs`

- ✔ inlines linked CSS and JavaScript, no external loads
- ✔ maps document lines back to the student's file and line
- ✔ capture script sits on the <head> line and does not shift lines
- ✔ works without <head>, and warns about missing files
- ✔ a </script> inside JavaScript cannot break out of the inlined script
- ✔ no index.html gives a friendly message
- ✔ file names must fit the project language
