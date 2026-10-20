# Java Console loading and running status — verification, 2026-10-21

Branch: `codex/java-console-progress`, directly based on main (`8fb41ff`). Teacher approved the
proposal, then explicitly requested merge and push. This is independent of open PRs #25–28;
no rolling-task, sample-first, or curriculum changes are being merged with it.

## Final gates

- PASS — `npm run build:all`: production frontend and backend TypeScript build.
- PASS — `npm run classroom:offline -- --build-only`: actual local Docker setup/configuration and complete production build.
- PASS WITH EXISTING WARNINGS — `npm run lint`: 0 errors, 8 existing image/live-effect warnings.
- PASS — `npm test`: 143 passed, 0 failed/skipped (main's 140 checks plus three progress render checks).
- PASS — final grouped run: `node --test --test-reporter=/tmp/earlet-test-reporter.mjs 'tests/*.test.mjs'`, 143 passed, 0 failed/skipped. This temporary reporting module only formats test events by file; exact names and marks are below.
- PASS — real online and offline production browser runs: 12 passed including their two parent suites, 0 failures/skips. Actual online CheerpJ compiled/executed Java, and offline used laptop javac. Online CheerpJ branding stayed visible; offline did not load/display it.
- PASS — deliberately made JavaRunProgress return null: two named status-render checks failed (1 pass, 2 failures). Restored the code and reran: 3/3 passed. The final suite and actual app tests also pass.
- PASS — `git diff --check` and source review. Only StudentModuleActivity and its CSS change application behavior; no helper/runner protocol, server, dependency, schema or configuration change.

## Failures and limits

The first browser run had one failed offline personal check and its failed parent (8 passes,
2 failures). Its rapid runs did not respect the existing 1.5-second laptop execution limit.
The harness now respects that limit and asserts actual HTTP success before accepting previous
output as evidence. The final offline/online run passes all 12 checks. No application rate-limit
change was made. The two deliberately failing render checks are regression proof, not remaining failures.

NOT VERIFIED — hosted automatic deployment, physical mobile/touch devices, Windows, Firefox/Brave,
or a physical classroom LAN with internet disconnected. A full two-minute startup timeout was
not forced in the UI; existing execution-client timeout tests remain in the passing full suite.
No manual deployment or hosted settings/database action was performed. Existing classroom
processes were preserved; isolated temporary verification origins were used.

## What the checks exercise

The three `java-run-progress.test.mjs` checks render the strip in isolation: absence when idle,
visible status/spinner semantics, and the input-wait text. The mutation proves the checks reject
a missing strip. They do not exercise React events or network timing.

`java-run-progress.browser.mjs` exercises the real production student module/personal editor,
local Supabase APIs and actual Java. It holds individual save/config/result requests only to
make transitional states observable; it does not replace Java output. It verifies saving before
execution, loading before output, checking until the real response, reduced-motion behavior,
clearing after success/compiler error/request error/Stop, error recovery and Save work alone.
Online personal Java actually waits for Scanner input, receives Ada on Enter and prints Hello Ada;
offline uses the existing input-before-Run behavior. Temporary accounts/classes are removed.
The banner was visually inspected from the captured online loading screenshot.

No migration, server-permission or hosted integration check applies to this UI-only change.

## Reproduce and check on screen

Use isolated rebuilt production apps with local Supabase on ports 3030 (online Java) and 3032
(offline, CODESHARE_LAPTOP=true and LOCAL_JAVA_EXECUTION=true). Online JAVA_RUNNER_URL points to a
separate local static origin on 3031 serving java-runtime/public with its existing CSP/Range support.
The browser script rejects remote database addresses, uses only those fixed local app URLs,
and creates/removes disposable verification accounts/classes.

```sh
CODESHARE_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/absolute/path/to/chrome \
node --test tests/java-run-progress.browser.mjs
```

The existing workspace Playwright and installed Chromium were used; no dependency or browser
was downloaded. The executable override can be omitted if Playwright's matching browser is installed.

1. As a student, open a module in the main editor and press Run code. Watch the strip above Actual output: saving, Java starting/running, then output checking. It clears once the output arrives.
2. Introduce a compiler error and run again. The strip clears and the error remains in Actual output. Fix the code and rerun.
3. Use Save work without Run code: no Java-running strip appears.
4. In the personal project, run Java that asks a question. Online, the strip points to Program input; Enter sends the answer and Stop clears a waiting run. Offline, enter input before Run as before.
5. Enable reduced motion. The message stays visible while the spinner stops rotating.

## Real production browser — command above

File: `tests/java-run-progress.browser.mjs`

```text
  ✔ shows saving and startup immediately, checking until the actual result, and honors reduced motion (1031.402235ms)
  ✔ a failed run clears the indicator and the next run recovers (2664.130208ms)
  ✔ compiler errors clear progress and remain visible in Actual output (2152.19468ms)
  ✔ Save work alone does not claim Java is running (101.877495ms)
  ✔ offline personal Java retains input-before-Run and clears progress after real javac (2297.825482ms)
✔ Java progress offline: real student Console statuses and completion (10726.53836ms)
  ✔ shows saving and startup immediately, checking until the actual result, and honors reduced motion (7254.439772ms)
  ✔ a failed run clears the indicator and the next run recovers (5903.938445ms)
  ✔ compiler errors clear progress and remain visible in Actual output (4010.909136ms)
  ✔ Save work alone does not claim Java is running (69.140448ms)
  ✔ personal Java shows input waiting, resumes on Enter, and clears after Stop (8825.222317ms)
✔ Java progress online: real student Console statuses and completion (28323.577738ms)
```

## Complete suite — names and marks grouped by file

Commands: `npm test` and the final grouped command above.

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
