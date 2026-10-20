# Earlet hover and outside closing — verification, 2026-10-20

Branch: `codex/earlet-hover-dismiss`, based on `codex/rolling-module-tasks` at `1c581ee`
(open PR #25). The teacher approved the proposal in a later message before editing.
Implementation `83cb931` is pushed; [PR #26](https://github.com/SirNeo-Coder/JavaShare/pull/26)
is open against PR #25’s branch. No merge or deployment was performed.
No hosted settings, services, migrations, dependencies or student data were changed.

## Final results

- PASS — `npm run build:all`: frontend production build and backend TypeScript build.
- PASS — `npm run classroom:offline -- --build-only`: local Docker startup/configuration and the full production build. An isolated offline production app served the browser checks on port 3016; existing classroom servers were left running.
- PASS WITH EXISTING WARNINGS — `npm run lint`: 0 errors, 8 existing warnings (image elements and live-effect dependencies).
- PASS — `npm test`: 160 passed, 0 failed/skipped. The final code was also checked with `node --test --test-reporter=/tmp/earlet-test-reporter.mjs 'tests/*.test.mjs'`; this temporary reporter emitted the per-file marks below: 160 passed, 0 failed/skipped.
- PASS — actual Chromium classroom interaction regression: 13 passed (12 teacher/student subtests plus their parent), 0 failed/skipped. Both real offline **Run code** executions printed `Drawer offline check`.
- PASS — deliberate regression proof: temporarily changed the worksheet's `onPointerMove` back to `onPointerEnter`, built and served that mutation, and ran the same browser regression. Both named worksheet tests failed because Escape could not leave the worksheet closed (10 passed, 3 failed counting the parent). Restored the fix, rebuilt, and reran: 13/13 passed.
- PASS — `git diff --check`.

## Failures and verification limits

The first full-suite run reported 158 passed / 2 failed (one dashboard subtest and its parent):
`rounded 100% averages do not label unfinished students or modules Finished (CKB-041)` failed
while inserting a disposable class member with `An invalid response was received from the upstream server`.
The full rerun and final grouped run both passed 160/160. No application/database fix was made for this transient local service failure.

Initial browser setup needed the installed Chromium executable because the bundled Playwright
expected a different browser revision; no download or dependency installation was performed.
The test's outside coordinates were corrected for the app's scale, and its Projects Escape check
now focuses a control inside that panel, matching the existing Escape behavior.

The interaction tests exposed and then caught both worksheet moving-ear problems: uncovering
another rail ear beneath the mouse and reopening after Escape. These are fixed and protected by
the real-browser regression, including deliberate failure/restoration above.

NOT VERIFIED — hosted deployment, Firefox/Brave specifically, physical touch devices, a second
physical LAN device, or clicks inside an embedded web-preview frame. Existing services on ports
3000 and 3012 were not restarted. This delivery requires running/deploying the new build to see it.

## What the checks exercise

`classroom-ui.test.mjs` renders components to test the mounted/inert accessibility contract and
module rendering rules in isolation. Those checks do not exercise native pointer/focus effects.
The new `workspace-drawers.browser.mjs` uses the actual local production app, API, local Supabase,
and laptop Java with disposable teacher/student accounts and a class, removed in `finally`.
It samples intermediate positions in both slide directions, checks focus and keyboard actions,
clicks inside/on triggers/outside, keeps worksheets open on pointer leave, confirms worksheet
content and unsent chat survive closing, checks Pin dismissal, emulates reduced motion, and
executes Java through the on-screen **Run code** button. An isolated hook-only DOM unit harness
is not installed; the actual-app regression covers that interaction instead. No hosted integration
or migration test applies because there is no server/schema change.

## Re-run the browser regression

Start a rebuilt offline app (`npm run classroom:offline`; restart an older classroom process if
necessary) and run against its local URL. Supply an existing Playwright module path if it is not
installed in the project; this test intentionally adds no project dependency:

```sh
CODESHARE_BROWSER_URL=http://127.0.0.1:3000 \
CODESHARE_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/absolute/path/to/chrome \
node --test tests/workspace-drawers.browser.mjs
```

The executable override can be omitted when Playwright's matching browser is installed.
The test refuses remote app/database addresses. The original verification used the installed
workspace Playwright/Chromium and a dedicated local server on port 3016.

## Manual teacher check

1. Enter a class. Move the mouse over **Module**, **Students / projects** (teacher) or **Projects** (student), and **Chat**. Each panel slides open; editor focus does not move.
2. Move away: the panel stays open. Click inside: it stays open. Click outside: it slides closed.
3. Select a module. Close its worksheet outside, then hover its separate **Module** ear to reopen. Move away and confirm it stays open. Close and reopen; the current page remains.
4. Focus a control inside the worksheet and press Escape while the mouse stays at the original ear position. It stays closed and focus returns to **Module worksheet**.
5. Type an unsent chat draft. Pin the panel on a wide desktop, then click outside. Reopen: the draft remains. With reduced motion enabled, opening and closing are immediate.

## Browser regression — command above

File: `tests/workspace-drawers.browser.mjs`

```text
  ✔ teacher: classroom-modules opens on hover without focus theft, stays open on leave, and slides closed outside
  ✔ teacher: classroom-projects opens on hover without focus theft, stays open on leave, and slides closed outside
  ✔ teacher: classroom-chat opens on hover without focus theft, stays open on leave, and slides closed outside
  ✔ teacher: worksheet hover stays open, outside closing preserves pages, Escape restores its ear
  ✔ teacher: reduced motion, chat draft and pinned outside closing
  ✔ teacher: offline Run code still uses laptop Java after panel interactions
  ✔ student: classroom-modules opens on hover without focus theft, stays open on leave, and slides closed outside
  ✔ student: classroom-projects opens on hover without focus theft, stays open on leave, and slides closed outside
  ✔ student: classroom-chat opens on hover without focus theft, stays open on leave, and slides closed outside
  ✔ student: worksheet hover stays open, outside closing preserves pages, Escape restores its ear
  ✔ student: reduced motion, chat draft and pinned outside closing
  ✔ student: offline Run code still uses laptop Java after panel interactions
✔ workspace drawers: real offline classroom pointer and keyboard interactions
```

## Complete suite — names and runner marks grouped by file

Commands: `npm test` and the final grouped `node --test` command above.

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
- ✔ interactive Java: streams prompts, waits for blank and Unicode answers, and rejects stale or foreign input requests (CKB-049)
- ✔ interactive Java: the five-second execution budget is cumulative across input waits
- ✔ interactive Java: Stop preserves printed output and removes a waiting run
- ✔ interactive Java: abandoned input stops after two minutes
- ✔ interactive Java: total submitted input and streamed output stay bounded
- ✔ interactive Java: streamed output stays bounded
- ✔ interactive Java: an older runner fails clearly during independent deployments
- ✔ interactive Java: a run cancelled before startup never appends its frame

### tests/browser-java-progress.test.mjs

- ✔ online module tasks: browser results check the task target and cannot reuse a sample pass
- ✔ online Java progress: browser evidence obeys membership, exact output, successful exit, saved version and part access
- ✔ online Java mode: missing address fails clearly; unsafe addresses are refused; legacy server mode remains available

### tests/browser-java-runtime.test.mjs

- ✔ browser runtime: only the parent starts Java; flat strings preserve duplicate filenames for the bridge
- ✔ browser runtime: invalid sources and download failure report failure instead of progress
- ✔ browser runtime: public asset policy permits CheerpJ's required nested runtime frame only (CKB-047)
- ✔ browser runtime: live input waits for authenticated matching answers and streams output before completion (CKB-049)
- ✔ browser runtime: live input cannot exceed the existing total input limit

### tests/classroom-ui.test.mjs

- ✔ module catalog: displays saved progress and distinguishes continuing from reviewing
- ✔ module catalog: the server's live lock disables opening and only the weekly pick gets its badge
- ✔ module catalog: teacher browsing never invents student progress
- ✔ workspace drawers: closed panels stay mounted but inaccessible so closing can animate
- ✔ module worksheet: alteration instructions and target stay separate from the sample
- ✔ module parts: a locked next task does not hide the current task's discussion
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
- ✔ module tasks: explicit ids isolate completion and unlock one step at a time inside a part
- ✔ module tasks: upload rejects duplicate task ids and collisions with stored progress keys
- ✔ module tasks: real Java checks the alteration, redacts the next step and preserves rolling work
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

### tests/rolling-module-tasks.test.mjs

- ✔ Week 14 tasks: revised upload keeps published ids and links to the preceding Vehicle project
- ✔ Week 14 Step 1: java-2-w14-d1-s1
- ✔ Week 14 Step 2: java-2-w14-d1-s2
- ✔ Week 14 Step 3: java-2-w14-d2-s3
- ✔ Week 14 Step 4: java-2-w14-d2-s4
- ✔ Week 14 Step 5: java-2-w14-d3-s5
- ✔ Week 14 Step 6: java-2-w14-d3-s6
- ✔ Week 14 Step 7: java-2-w14-d4-s7
- ✔ Week 14 Step 8: java-2-w14-d4-s8
- ✔ Week 14 Step 9: java-2-w14-d4-s9
- ✔ Week 14 Step 10: java-2-w14-d4-s10
- ✔ Week 14 Step 11: java-2-w14-d5-s11
- ✔ Week 14 tasks: all eleven alterations produce their published targets with real multi-file Java

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
- ✔ weekly Java editor: alteration shows its own target and remembers completed tasks
