# Classroom drawer controls — verification, 2026-10-21

Branch `codex/classroom-drawer-controls`, based directly on main `9257ea7` (merged PR #31).
Teacher approved one fixed Module/Projects rail, hover opening and animated outside closing.
Only the relevant earlier CKB-053 repair was reused; open PR #26 and its rolling-module-tasks
base were not merged. The existing Java status/startup fixes remain in place.

## Results

- PASS — `npm run build:all`: production frontend and backend types/build.
- PASS — `npm run classroom:offline -- --build-only`: actual local Supabase/Docker readiness
  and the restored final `npm run build:all` through the classroom launcher.
- PASS WITH EXISTING WARNINGS — `npm run lint`: 0 errors, 8 existing image/live-effect warnings.
- PASS — `npm test`: 149 passed, 0 failed/skipped; each name and mark below, grouped by file.
- PASS — restored production browser checks: 17 passed, 0 failed/skipped (16 role-specific
  checks plus the parent). Exact names and marks below.
- PASS — `git diff --check` and targeted review of all callers, removed pin callback, worksheet
  tab/hover bridge CSS, rail stacking and unchanged Java Console rendering.

## Intentional failures and regression proof

Initial real-app run: 10 passed, 7 failed counting the parent. The phone Projects close button
was invisible because the old generic mobile sidebar rule set display:none. This left the
harness at phone size, causing the later Pin/Run tests to fail too. The Projects drawer now
explicitly keeps its flex display; the final suite includes a nonzero visible-panel width check.

Then temporarily disabled the outside close call in useOutsideDismiss and restored an extra
worksheet Module button. Built and served that deliberately broken version. Browser totals:
2 passed, 15 failed, 0 skipped counting the parent. Both roles' outside-close checks timed out;
both roles' layout checks failed with **a second worksheet ear must not cover Projects**.
Source was restored from saved copies, rebuilt through the offline launcher and rerun.
The deliberate failure names and marks are included below; these are regression proof,
not outstanding application failures.

## Coverage levels and limits

`tests/classroom-ui.test.mjs` checks rendering in isolation: closed drawers stay mounted/inert,
plus exactly one initial Module control and the correct role-specific Projects label.
Rendering alone cannot exercise pointer handlers, focus, animations or overlapping hit targets.

`tests/workspace-drawers.browser.mjs` enters the actual production classroom with disposable
teacher/student accounts and a fixture module in local Supabase. It checks every catalog,
worksheet, Projects and Chat panel, samples intermediate horizontal positions in both slide
directions, inside/outside/trigger clicks, no hover focus theft, staying open on leave,
keyboard/Escape, selected page and unsaved main-editor text, All modules and student top-bar
Modules, reduced motion, pinned outside closing, chat draft and touch taps. It checks two fixed
left tabs and real hover reachability at 1500×1000, 942×895 and 455×890, plus enlarged UI at 1500×1000
with scale 1.5. Screenshots were captured and visually inspected. Both roles also run real laptop
Java and receive Drawer offline check after drawer interactions. Fixtures are removed in finally.
No new server/schema/permission paths exist, so new API or migration tests do not apply.

NOT VERIFIED — hosted rollout/browser cache, physical phones/touch hardware, disconnected Wi-Fi
on another device, Firefox/Brave/Windows specifically, or online CheerpJ execution in this drawer
slice. The frontend is shared online/offline; Java execution code was unchanged and its existing
regressions pass. Pointer presses inside the separate web-preview frame do not bubble to the
classroom document, so that frame is not covered by outside dismissal. Use the surrounding
classroom, tab toggle, × or Escape to close. No hosted setting, deployment, database push,
dependency, migration or hosted account/student-data change was performed.

## Re-run

Start local Supabase and a rebuilt offline production classroom with the existing
`npm run classroom:offline` launcher. Point CODESHARE_BROWSER_URL at its local frontend address.
The test refuses a non-local frontend or Supabase address. Local administrative credentials are
read only by the Node test process, never exposed to browser code.

```sh
CODESHARE_BROWSER_URL=http://127.0.0.1:3016 \
CODESHARE_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/absolute/path/to/chrome \
node tests/workspace-drawers.browser.mjs
```

Installed workspace Playwright/Chromium were reused; no dependency was added. The browser path
and module overrides are optional with a normally installed matching Playwright browser.
The verification server used local offline configuration on 3016; existing classroom servers
were preserved. For named full-suite output, `NODE_OPTIONS=--test-reporter=/absolute/path/to/reporter.mjs npm test`
used a display-only reporter printing FILE and each original runner name with ✔/✖; it changes
neither the test cases nor the npm test command. The 149 names below come from that final run.

## Screen check for teacher review

1. Enter a class, hover Module, and select a module. Only one Module and one Projects tab remain
   (Students / projects for teachers), even with the worksheet open or on a smaller screen.
2. Hover each tab: its panel slides open; leaving it stays open. Click inside: it stays open.
   Click in the classroom outside it: it slides closed. Both animation directions are visible
   unless reduced motion is enabled in the device's accessibility settings.
3. Reopen Module: the selected worksheet returns to its page. All modules returns to the catalog.
   Hover Projects: the project list opens and the worksheet closes. Close Projects: the worksheet
   stays closed until Module is opened again.
4. Check ×, Escape, keyboard Enter and touch taps; type a chat draft, close outside and reopen.
   The draft and unsaved main-editor work remain. Run code still produces Java output.

## Full suite — exact names by file

Command: `NODE_OPTIONS=--test-reporter=/tmp/earlet-test-reporter.mjs npm test`.


### tests/api-router.test.mjs

- ✔ router: path parameters, query, cookies, and JSON body reach the handler
- ✔ router: middleware passes on with next(), stops by responding, and next(error) reaches the error handler
- ✔ router: cookies, 204, unknown routes, bad JSON, and size limits
- ✔ router: the larger JSON body cap is scoped to the module-upload route, not every route
- ✔ routes: register, stay signed in with the cookie, get a live pass, sign out
- ✔ routes: a chat message's live signal finishes sending before the reply (CKB-006)

### tests/browser-java-bridge.test.mjs

- ✔ browser bridge: committed JAR matches its Java source
- ✔ browser bridge: packages, inheritance, input and Unicode run together
- ✔ browser bridge: compile error, stderr and crash after expected output all fail
- ✔ browser bridge: combined stdout/stderr stops at 64 KB and missing classes cannot survive another run
- ✔ browser bridge: flat browser strings become distinct source folders, including duplicate class names

### tests/browser-java-client.test.mjs

- ✔ browser Java: refuses same origin, insecure, credentialed and path-based runner addresses
- ✔ browser Java: authenticates frame messages, sends every source/input/package, and tears down after result or timeout
- ✔ browser Java: offline uses only the existing authenticated laptop endpoint
- ✔ browser Java: startup stages authenticate messages and identify the stalled stage without extending the deadline (CKB-056)
- ✔ browser Java: startup feedback never contaminates Java output or accepts stages after execution starts (CKB-056)
- ✔ interactive Java: streams prompts, waits for blank and Unicode answers, and rejects stale or foreign input requests (CKB-049)
- ✔ interactive Java: the five-second execution budget is cumulative across input waits
- ✔ interactive Java: Stop preserves printed output and removes a waiting run
- ✔ interactive Java: abandoned input stops after two minutes
- ✔ interactive Java: total submitted input and streamed output stay bounded
- ✔ interactive Java: streamed output stays bounded
- ✔ interactive Java: an older runner fails clearly during independent deployments
- ✔ interactive Java: a run cancelled before startup never appends its frame

### tests/browser-java-progress.test.mjs

- ✔ online Java progress: browser evidence obeys membership, exact output, successful exit, saved version and part access
- ✔ online Java mode: missing address fails clearly; unsafe addresses are refused; legacy server mode remains available

### tests/browser-java-runtime.test.mjs

- ✔ browser runtime: only the parent starts Java; flat strings preserve duplicate filenames for the bridge
- ✔ browser runtime: whole-file downloads preserve binary compiler JARs without Range support (CKB-056)
- ✔ browser runtime: missing compiler assets report the filename and stage without starting Java (CKB-056)
- ✔ browser runtime: failed compiler downloads report their stage and do not compile (CKB-056)
- ✔ browser runtime: invalid sources and download failure report failure instead of progress
- ✔ browser runtime: public asset policy permits CheerpJ's required nested runtime frame only (CKB-047)
- ✔ browser runtime: live input waits for authenticated matching answers and streams output before completion (CKB-049)
- ✔ browser runtime: live input cannot exceed the existing total input limit

### tests/classroom-ui.test.mjs

- ✔ module catalog: displays saved progress and distinguishes continuing from reviewing
- ✔ module catalog: the server's live lock disables opening and only the weekly pick gets its badge
- ✔ module catalog: teacher browsing never invents student progress
- ✔ workspace drawers: closed panels stay mounted but inaccessible so closing can animate
- ✔ workspace rails: one Module control and the role's Projects control share the fixed left rail
- ✔ module pages: inactive lessons and task editors stay mounted so navigation cannot discard drafts
- ✔ module parts: author grouping spans days and assigns discussion and exit slips exactly once
- ✔ module parts: older lessons and redacted closed lessons retain their own safe pages
- ✔ module paper: tables, analogies, notes and error guides display their actual supplied content safely
- ✔ module worksheet: named parts, unchanged samples, page controls and teacher-only sample preview coexist
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

### tests/java-run-progress.test.mjs

- ✔ Java progress: idle, finished and failed runs leave no loading indicator
- ✔ Java progress: saving, starting and checking are visible accessible status messages
- ✔ Java progress: waiting for an answer replaces the working message

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

### tests/module-activities.test.mjs

- ✔ module activities: legacy challenge JSON remains readable while progress follows the sample
- ✔ module activities: parts spanning lessons require every task and never require a paper liplet
- ✔ module activities: matching text cannot pass a failed process; internal whitespace still matters
- ✔ module activities: supporting classes survive and src aliases cannot duplicate Main.java (CKB-038)
- ✔ module activities: real multi-file Java result unlocks only that student, without teacher switches or liplets (CKB-038)
- ✔ module activities: compile errors and a crash after the right output cannot pass
- ✔ module activities: prior project is copied only for its owner/class and later saves never replace it
- ✔ module activities: JSON supplies fixed program input and demo execution cannot award a pass
- ✔ weekly Java projects: personal drafts roll forward separately, preserve submissions and never advance module progress
- ✔ module activities: offline ignores online runner address and refuses browser progress

### tests/module-availability.test.mjs

- ✔ module availability: unknown modules and step ids cannot create progress (CKB-018)
- ✔ module availability migration: preserves existing content and work, opens existing modules, defaults new uploads closed, and safely reruns
- ✔ module availability: first part opens automatically, future content is withheld, and teacher switches cannot bypass student progress
- ✔ module availability: reupload preserves work and new parts require their preceding activities
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

### tests/session-activity.test.mjs

- ✔ idle browser: background updates do not renew, warns at fourteen minutes and signs out at fifteen
- ✔ idle browser: real gestures renew at most once per minute and preserve the last gesture time
- ✔ idle browser: continuing during the warning clears it and starts a fresh idle period
- ✔ idle browser: a delayed background timer cannot report an old gesture as recent activity
- ✔ idle browser: a five-hour suspension expires before the returning gesture can renew
- ✔ idle browser: another tab's renewal is shared, and sign-out clears all tabs
- ✔ idle browser: suspended timer reads a newer deadline even before its storage event arrives
- ✔ idle browser: changing accounts reloads old data without deleting the new session
- ✔ idle browser: failed renewal cannot extend expiry, and cleanup removes listeners and timers
- ✔ idle browser: wrong login password leaves the session alone; a protected 401 signs it out

### tests/session-expiry.test.mjs

- ✔ session: student expires at fifteen minutes and teacher at two hours, despite background reads (CKB-051)
- ✔ session: only explicit activity renews the role deadline, accounting for the delayed last gesture
- ✔ session: old seven-day cookies, forged cookies and invalid renewal bodies are refused
- ✔ session: activity keeps the seven-day maximum and secure cookie settings
- ✔ session: live passes cannot outlast inactivity or renew an expired sign-in

### tests/student-classroom-entry.test.mjs

- ✔ student entry: a single membership opens that classroom even with an obsolete saved choice
- ✔ student entry: multiple memberships reopen only a remembered class the student still belongs to
- ✔ student entry: no membership never opens a saved or invented classroom
- ✔ student entry: teachers, required password reset and explicit Classes navigation do not auto-enter
- ✔ student entry: remembered classrooms stay separate for different accounts on a shared browser
- ✔ student entry: unavailable browser storage still permits single-class entry and safe multi-class choice
- ✔ student chooser: a former class-home selection cannot resurrect the removed module landing page
- ✔ teacher chooser: class creation and the teacher dashboard entry remain available

### tests/student-module-activity-ui.test.mjs

- ✔ module activity screen: signing in starts safely before a class or project exists (CKB-044)
- ✔ module activity screen: main Java editor has project tabs, sample output, Console, Run code and Save work

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

### tests/weekly-java-project-ui.test.mjs

- ✔ weekly Java editor: module shows sample output and only module source
- ✔ weekly Java editor: personal shows its own source, input and explicit submission

## Real-app browser suite — exact names

File: `tests/workspace-drawers.browser.mjs`. Command shown above with the same display-only
reporter via NODE_OPTIONS; this is the restored final offline production run.

- ✔ teacher: classroom-modules opens on hover without focus theft, stays open on leave, and slides closed outside
- ✔ teacher: classroom-projects opens on hover without focus theft, stays open on leave, and slides closed outside
- ✔ teacher: classroom-chat opens on hover without focus theft, stays open on leave, and slides closed outside
- ✔ teacher: worksheet hover stays open, outside closing preserves pages, Escape restores its ear
- ✔ teacher: one Module and one Projects ear stay separate and reachable at different screen sizes
- ✔ teacher: reduced motion, chat draft and pinned outside closing
- ✔ teacher: touch taps toggle Module, Projects and Chat ears
- ✔ teacher: offline Run code still uses laptop Java after panel interactions
- ✔ student: classroom-modules opens on hover without focus theft, stays open on leave, and slides closed outside
- ✔ student: classroom-projects opens on hover without focus theft, stays open on leave, and slides closed outside
- ✔ student: classroom-chat opens on hover without focus theft, stays open on leave, and slides closed outside
- ✔ student: worksheet hover stays open, outside closing preserves pages, Escape restores its ear
- ✔ student: one Module and one Projects ear stay separate and reachable at different screen sizes
- ✔ student: reduced motion, chat draft and pinned outside closing
- ✔ student: touch taps toggle Module, Projects and Chat ears
- ✔ student: offline Run code still uses laptop Java after panel interactions
- ✔ workspace drawers: real offline classroom pointer and keyboard interactions

## Deliberate regression run — exact names and marks

File: `tests/workspace-drawers.browser.mjs`. Same browser command, deliberately broken build.
2 passed, 15 failed, 0 skipped; both known mutations were restored before the final passing run.

- ✖ teacher: classroom-modules opens on hover without focus theft, stays open on leave, and slides closed outside
- ✖ teacher: classroom-projects opens on hover without focus theft, stays open on leave, and slides closed outside
- ✖ teacher: classroom-chat opens on hover without focus theft, stays open on leave, and slides closed outside
- ✖ teacher: worksheet hover stays open, outside closing preserves pages, Escape restores its ear
- ✖ teacher: one Module and one Projects ear stay separate and reachable at different screen sizes
- ✖ teacher: reduced motion, chat draft and pinned outside closing
- ✖ teacher: touch taps toggle Module, Projects and Chat ears
- ✔ teacher: offline Run code still uses laptop Java after panel interactions
- ✖ student: classroom-modules opens on hover without focus theft, stays open on leave, and slides closed outside
- ✖ student: classroom-projects opens on hover without focus theft, stays open on leave, and slides closed outside
- ✖ student: classroom-chat opens on hover without focus theft, stays open on leave, and slides closed outside
- ✖ student: worksheet hover stays open, outside closing preserves pages, Escape restores its ear
- ✖ student: one Module and one Projects ear stay separate and reachable at different screen sizes
- ✖ student: reduced motion, chat draft and pinned outside closing
- ✖ student: touch taps toggle Module, Projects and Chat ears
- ✔ student: offline Run code still uses laptop Java after panel interactions
- ✖ workspace drawers: real offline classroom pointer and keyboard interactions
