# Java Console progress — verification, 2026-10-21

Current correction: `codex/classroom-java-progress`, implementation `8ae4f1a`. Initially based on
main `7089377` (PR #29); latest main `b3c74e0` including startup repair PR #30 was preserved in
merge `398aa8c` before the final integrated checks.
Correction delivery: [PR #31](https://github.com/SirNeo-Coder/JavaShare/pull/31), with the teacher's existing explicit merge/push authorization.
The teacher reported no animation in the regular Code editor and approved the targeted correction.
Earlier merge/push authorization continues for this correction. No other open feature/curriculum
PR is included; no hosted settings, server code, dependencies or migrations change.

## Results

- PASS — `npm run build:all`: production frontend and backend TypeScript.
- PASS — `npm run classroom:offline -- --build-only`: actual local Docker setup/configuration and restored final production build.
- PASS WITH EXISTING WARNINGS — `npm run lint`: 0 errors, 8 existing image/live-effect warnings.
- PASS — final integrated `npm test`: 148 passed, 0 failed/skipped. The original correction baseline also passed 143/143. Exact final runner names and marks are grouped by file below.
- PASS — final actual production Chromium/Java checks: 20 passed, 0 failed/skipped (18 subtests plus two parent suites). Includes the regular student AND teacher Console online and offline, as well as all previous module/personal checks.
- REGRESSION PROVED — on the initial 7089377 baseline, temporarily forced only the regular Console's JavaRunProgress message to null, rebuilt and served it. Both roles' regular Console tests failed in both modes; totals 10 passed / 10 failed counting parents. The direct visibility assertion failed with `the regular Code editor must render the status strip`. Restored source, rebuilt through the offline launcher and reran: all 20 passed.
- PASS — spinner rotation measured through changing computed transforms, rather than only checking its CSS animation name. Before integration, actual blank online output was asserted while the status remained visible. Main now supplies startup-stage output; final checks require Opening Java runner text alongside the indicator. Screenshots of regular student/teacher Consoles and the strip were captured and inspected.
- PASS — `git diff --check` and focused source review. The application change reuses the existing component from page.tsx; there is no new application helper, timer, state, stylesheet or dependency.

## Missed coverage, intentional failures and limits

PR #29 fixed module and personal-project Consoles but omitted the regular Code editor. Its three
render tests and original 12 browser checks passed because none entered that screen. The teacher's
new screenshot correctly exposed that gap. The regular run path set Starting Java text, but the
interactive runner cleared output at startup and this screen never rendered JavaRunProgress.
The corrected integration uses its existing Java-only running flag; output clearing no longer
removes the independent status strip. Only the output pre is marked busy, keeping the accessible
status outside the busy region. Web previews and plain Save work retain their existing behavior.

The deliberate mutation's failures are expected regression evidence, not remaining failures:
regular startup/rotation visibility fails and the dependent input/status checks also fail.
The restored final integrated 20-check run and full 148-test suite have no failures or skips.
The original PR #29 harness initially ignored the laptop's 1.5-second run limit; that prior
harness issue remains fixed without changing the app's limit.

NOT VERIFIED — hosted automatic deployment/current browser build, physical mobile/touch devices,
Windows, Firefox/Brave specifically, or a physical disconnected classroom Wi-Fi device. A full
120-second startup timeout was not forced in this UI check; existing execution-client timeout
checks are in the passing suite. No manual deployment or hosted configuration/database action
was performed. Existing classroom processes were preserved; isolated local test servers were used.

## Coverage levels

`java-run-progress.test.mjs` tests the shared strip's rendering in isolation (three existing
checks, unchanged). No isolated Home-render test is added: it cannot exercise the authenticated
regular classroom run path. The real-app browser tests now provide that regression coverage.

`java-run-progress.browser.mjs` uses actual production apps, local Supabase and actual Java.
Individual save/config/result/startup requests are held to make transitional states observable;
Java output is not replaced. Existing module/personal checks cover save/startup/checking, failed
requests/recovery, compiler errors, Save work alone and real online input/Stop versus offline
input-before-Run. New regular student/teacher checks enter My Practice Code / Teacher Demo Workspace,
hold browser startup, preserve main's new Opening Java runner output, assert the visible rotating indicator, check reduced
motion, then finish real Java. They also run Scanner input, Enter, Stop online, and compiler errors.
CheerpJ branding stays visible online; offline stays on laptop javac. Temporary accounts/classes
are removed in finally. No schema, server-permission or hosted integration check applies.

## Re-run

Use rebuilt local production apps on 3030 (online Java) and 3032 (offline, LOCAL_JAVA_EXECUTION=true,
CODESHARE_LAPTOP=true), with local Supabase. Online JAVA_RUNNER_URL points to a separate static
origin on 3031 serving java-runtime/public with its existing CSP and HTTP Range support.

```sh
CODESHARE_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/absolute/path/to/chrome \
node --test tests/java-run-progress.browser.mjs
```

The installed workspace Playwright and Chromium were reused; no download or dependency was added.
The executable override is optional when Playwright's matching browser is installed.

## Manual check of the teacher's reported screen

1. Enter a class in the regular Code editor (My Practice Code for a student; teacher demo for the teacher).
2. Press Run code. Above the output, the rotating strip says Java is loading or running… Please wait.
3. While online Java starts, Stop and loading-stage text may be visible; the strip must remain visible.
4. Run code asking for an answer. Online, the strip points to Program input; Enter resumes the run, and Stop cancels. Offline, input stays before Run.
5. Run invalid Java: output shows the compiler error and the strip clears. Enable reduced motion: text remains while rotation stops.

## History

- Original module/personal delivery: implementation `8198348`, PR #29 merged at `7089377`.
- Follow-up: regular caller was omitted; teacher approved adding the same strip there. Correction `8ae4f1a` passed its tests, then latest main startup repair PR #30 was integrated and rechecked (148 suite / 20 browser). Existing repair notes and stage output were preserved.

## Actual production browser — command above

File: `tests/java-run-progress.browser.mjs`

```text
  ✔ shows saving and startup immediately, checking until the actual result, and honors reduced motion (859.8642ms)
  ✔ a failed run clears the indicator and the next run recovers (2398.765311ms)
  ✔ compiler errors clear progress and remain visible in Actual output (1955.41244ms)
  ✔ Save work alone does not claim Java is running (70.072831ms)
  ✔ offline personal Java retains input-before-Run and clears progress after real javac (2131.169854ms)
  ✔ regular student Console: spinner rotates through startup, then clears after real Java (2695.857203ms)
  ✔ regular student Console: input and compiler errors clear progress; online Stop works (4420.254089ms)
  ✔ regular teacher Console: spinner rotates through startup, then clears after real Java (2679.831661ms)
  ✔ regular teacher Console: input and compiler errors clear progress; online Stop works (4405.083038ms)
✔ Java progress offline: real module, personal and classroom Console statuses (24956.360998ms)
  ✔ shows saving and startup immediately, checking until the actual result, and honors reduced motion (10538.729063ms)
  ✔ a failed run clears the indicator and the next run recovers (8574.964074ms)
  ✔ compiler errors clear progress and remain visible in Actual output (6662.40771ms)
  ✔ Save work alone does not claim Java is running (71.119801ms)
  ✔ personal Java shows input waiting, resumes on Enter, and clears after Stop (14977.335195ms)
  ✔ regular student Console: spinner rotates through startup, then clears after real Java (7273.591415ms)
  ✔ regular student Console: input and compiler errors clear progress; online Stop works (21881.677694ms)
  ✔ regular teacher Console: spinner rotates through startup, then clears after real Java (7736.873861ms)
  ✔ regular teacher Console: input and compiler errors clear progress; online Stop works (19906.472522ms)
✔ Java progress online: real module, personal and classroom Console statuses (100405.204972ms)
```

## Deliberate missing-regular-indicator mutation

Same browser command, with only the regular strip hidden.

```text
  ✔ shows saving and startup immediately, checking until the actual result, and honors reduced motion (1025.014255ms)
  ✔ a failed run clears the indicator and the next run recovers (2405.283343ms)
  ✔ compiler errors clear progress and remain visible in Actual output (1967.854743ms)
  ✔ Save work alone does not claim Java is running (69.288681ms)
  ✔ offline personal Java retains input-before-Run and clears progress after real javac (2098.518508ms)
  ✖ regular student Console: spinner rotates while output is blank, then clears after real Java (1712.154094ms)
  ✖ regular student Console: input and compiler errors clear progress; online Stop works (1676.876818ms)
  ✖ regular teacher Console: spinner rotates while output is blank, then clears after real Java (1715.69069ms)
  ✖ regular teacher Console: input and compiler errors clear progress; online Stop works (1655.514565ms)
✖ Java progress offline: real module, personal and classroom Console statuses (17602.006723ms)
  ✔ shows saving and startup immediately, checking until the actual result, and honors reduced motion (7042.516237ms)
  ✔ a failed run clears the indicator and the next run recovers (5305.553547ms)
  ✔ compiler errors clear progress and remain visible in Actual output (4421.242339ms)
  ✔ Save work alone does not claim Java is running (71.593784ms)
  ✔ personal Java shows input waiting, resumes on Enter, and clears after Stop (10408.172494ms)
  ✖ regular student Console: spinner rotates while output is blank, then clears after real Java (97.337121ms)
  ✖ regular student Console: input and compiler errors clear progress; online Stop works (30063.010322ms)
  ✖ regular teacher Console: spinner rotates while output is blank, then clears after real Java (178.737574ms)
  ✖ regular teacher Console: input and compiler errors clear progress; online Stop works (30055.161697ms)
✖ Java progress online: real module, personal and classroom Console statuses (90549.698879ms)
```

## Complete suite — exact runner names and marks grouped by file

Command: `npm test`, final integrated source.

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
