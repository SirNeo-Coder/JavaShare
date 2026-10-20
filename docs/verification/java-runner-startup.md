# Java runner startup verification — 2026-10-21

Branch: `codex/java-runner-startup`, based on main `8fb41ff`.
Isolated checkout: `/tmp/codeshare-java-runner-startup`.

## Results and limitations

- ✔ `npm run build:all`: production Next.js and backend TypeScript passed.
- ✔ `npm run lint`: zero errors, eight existing warnings; no new warning.
- ✔ `sg docker -c 'npm test -- --test-reporter=spec'`: 145 passed, zero failed,
  cancelled or skipped. Full named results grouped by file below.
- ✔ `node --test --test-isolation=none --test-reporter=spec tests/browser-java-client.test.mjs tests/browser-java-runtime.test.mjs`:
  21 passed, zero failures/skips after both deliberate regressions were restored.
- ✔ `npx --no-install wrangler deploy --dry-run --config java-runtime/wrangler.jsonc --outdir outputs/java-startup-runtime`:
  package accepted, no deployment or hosted change.
- ✔ `sg docker -c 'npm run classroom:offline -- --check'`: local profile ready.
- ✔ `git diff --check`.
- **Browser failure / CKB-057:** one local tight-loop test made its tab unresponsive;
  subsequent runs on that runner hostname did not become ready. No fix for that
  separate issue is included. See below; passing mocked timers do not resolve it.
- **Not verified:** the teacher's exact 120-second timeout, their affected browser,
  a hosted deployment of this change, physical internet disconnection, Windows,
  another Wi-Fi device, other browsers, or a real two-minute input wait.

## Original online evidence

Read-only checks of `https://codeshare-java.ireneojrseraspe.workers.dev/` found the
correct CKB-047 frame permission and interactive runner. Both JARs and vendor loader
responded successfully. Requests with `Range: bytes=0-31` for each JAR returned
HTTP 200 and the entire file, not partial content. Actual CheerpJ logged unsupported
Range errors for both. A temporary browser-only Hello CodeShare run nevertheless
completed in 5.5 seconds. This proves a hosting incompatibility, not the exact cause
of the teacher's screenshot timeout.

Primary references: [CheerpJ server requirements](https://cheerpj.com/docs/guides/basic-server-setup#range-requests),
[CheerpJ binary memory files](https://cheerpj.com/docs/reference/cheerpOSAddStringFile).
The fix downloads complete binary JARs into `/str/` before library startup.

## Real app and actual Java checks

Built production app, local Supabase, disposable local student/teacher/class,
actual CheerpJ 4.3 / Java 8. A temporary Python server on port 3041 deliberately
lacked Range support and used the committed runner Content-Security-Policy. No
runtime policy, compiler JAR, Java helper or production configuration was changed.

- ✔ Practice **Run code**: Main.java printed `Hello, CodeShare!`; no browser warnings/errors.
  Loading text progressed through Starting Java 8 and Starting Java compiler.
- ✔ Multi-file practice: Main.java used saved Greeter.java. Output appeared before
  answering. Enter sent `Zoë 🐕`, then an empty line; final output was
  `Name? Blank answer? Hello, Zoë 🐕, blank=true`.
- ✔ Repeat run / **Stop**: at the first prompt, Stop preserved `Name?` and added
  `Execution stopped.` The active frame was removed by the normal client cleanup.
- ✔ Offline production app on port 3042: the same two-file Scanner program, with
  input `Offline` and a blank line supplied before Run, printed
  `Name? Blank answer? Hello, Offline, blank=true` using laptop Java. The page
  contained zero Java execution frames and zero CheerpJ logos, despite JAVA_RUNNER_URL
  being configured. No offline behavior was added.
- ✔ Module sample: uploaded only to the disposable local class; fixed JSON input
  `14` produced `Sample: 14` and **Passed** through the real module-result route.
  No live-input field was used. Three supporting/source tabs were present.
- ✔ Normal run on a fresh local runner hostname printed `Recovered after Stop and timeout`.
  This is not proof of recovery on the original hung renderer (see below).
- ✔ Completed normal/multi-file/module trials had no browser errors, including
  no unsupported-Range error. Runner log showed ordinary whole-file GETs for JARs.

Screenshot of actual module result: `/tmp/codeshare-java-startup-result.jpg`
(local verification evidence; disposable names only, no credentials).

## Tight-loop check: separate unresolved finding

**Do not report this as an unconditional browser-timeout pass.** With the app on
`127.0.0.1:3040` and runner on `127.0.0.1:3041`, the program
`System.out.println("Loop started"); while (true) {}` made browser inspection,
close and navigation commands time out. The browser automation session was reset.
A new parent at `localhost:3040` remained usable and a repeat loop displayed
`Execution stopped after 5 seconds`, but the following run on the earlier runner
hostname stayed at Opening Java runner until Stop was clicked. Restarting only the
local app with runner hostname `localhost:3041` allowed normal Java and module
checks to finish. Site/process involvement is a hypothesis, not a confirmed cause.

CKB-057 records this separately. No comparison against the old runner, independent
regular-browser reproduction or hosted reproduction was performed. The download
fix does not alter execution scheduling, the five-second budget or teardown.
Further execution changes need a separate proposal and teacher approval.

## Regression proof and levels

- Restored only the old `/app/javac.jar:/app/codeshare-runner.jar` classpath:
  **✖ browser runtime: whole-file downloads preserve binary compiler JARs without Range support (CKB-056)**.
  Restored memory classpath: focused suite passed.
- Removed the saved-stage update in the client while retaining the callback:
  **✖ browser Java: startup stages authenticate messages and identify the stalled stage without extending the deadline (CKB-056)**.
  Restored update: all 21 focused checks passed.
- Both mutations used try/finally restoration. Only the working fix is committed.

Client tests use a controlled clock and browser mocks: message ownership, bounded
stages, unchanged deadline, result separation, caps and interactive cancellation.
Runtime tests use a VM and binary response fixtures: full-download behavior, exact
binary bytes, classpath, status ordering, missing assets and network errors. These
are isolated rule checks. Existing bridge tests use a real JDK; existing integration
tests use local Supabase and laptop javac. The UI checks above use the real app and
actual CheerpJ, not a mocked Java runtime. No new standalone hook test harness was
introduced: both editable callers reuse useJavaConsole and the actual practice UI
exercised its new stage callback. Module batch mode was checked separately.

## Initial failed checks and environment handling

The first isolated build could not resolve dependencies outside its filesystem
root through a node_modules symlink. A private local dependency copy fixed that.
A sandboxed build then could not parse TypeScript subprocess output; the standard
build passed outside that restriction. The first sandboxed test-runner invocation
reported only file-level results; focused isolation-none checks printed all 21
names, and the full Docker-capable run printed all 145 names below.
The in-app browser does not support the existing Save work naming prompt; a helper
file was persisted before that prompt failed, then verified by the multi-file run.
No change to Save work is part of this fix. No package, configuration or dependency
was changed to address these local testing limitations.

## Teacher rollout and retest

1. Review the PR and merge only when satisfied. The assistant does not merge.
2. Let the configured normal builds publish both CodeShare and its separate Java
   runner from the reviewed commit. No setting or database migration is needed.
3. Refresh CodeShare in the affected browser. Run the screenshot's Hello CodeShare
   program twice; note any Last stage timeout. Verify a multi-file input program,
   Enter, Stop while waiting and a module sample.
4. If the original timeout remains, record its exact Last stage and browser details
   before proposing another fix. CKB-056 is a mitigation, not a proven complete
   explanation of the initial report. Review CKB-057 before trying tight loops in
   any working classroom browser.

No hosted deployment, SQL, settings change or `supabase db push` was performed.
Rollback is a normal code revert; no data migration or saved-work conversion exists.

## Full named test results

Command: `sg docker -c 'npm test -- --test-reporter=spec'`.
Marks and names below are copied from the successful runner output, grouped by file.

### api-router.test.mjs

- ✔ router: path parameters, query, cookies, and JSON body reach the handler
- ✔ router: middleware passes on with next(), stops by responding, and next(error) reaches the error handler
- ✔ router: cookies, 204, unknown routes, bad JSON, and size limits
- ✔ router: the larger JSON body cap is scoped to the module-upload route, not every route
- ✔ routes: register, stay signed in with the cookie, get a live pass, sign out
- ✔ routes: a chat message's live signal finishes sending before the reply (CKB-006)

### browser-java-bridge.test.mjs

- ✔ browser bridge: committed JAR matches its Java source
- ✔ browser bridge: packages, inheritance, input and Unicode run together
- ✔ browser bridge: compile error, stderr and crash after expected output all fail
- ✔ browser bridge: combined stdout/stderr stops at 64 KB and missing classes cannot survive another run
- ✔ browser bridge: flat browser strings become distinct source folders, including duplicate class names

### browser-java-client.test.mjs

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

### browser-java-progress.test.mjs

- ✔ online Java progress: browser evidence obeys membership, exact output, successful exit, saved version and part access
- ✔ online Java mode: missing address fails clearly; unsafe addresses are refused; legacy server mode remains available

### browser-java-runtime.test.mjs

- ✔ browser runtime: only the parent starts Java; flat strings preserve duplicate filenames for the bridge
- ✔ browser runtime: whole-file downloads preserve binary compiler JARs without Range support (CKB-056)
- ✔ browser runtime: missing compiler assets report the filename and stage without starting Java (CKB-056)
- ✔ browser runtime: failed compiler downloads report their stage and do not compile (CKB-056)
- ✔ browser runtime: invalid sources and download failure report failure instead of progress
- ✔ browser runtime: public asset policy permits CheerpJ's required nested runtime frame only (CKB-047)
- ✔ browser runtime: live input waits for authenticated matching answers and streams output before completion (CKB-049)
- ✔ browser runtime: live input cannot exceed the existing total input limit

### classroom-ui.test.mjs

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

### course-module-schema.test.mjs

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

### course-modules.test.mjs

- ✔ course modules: teacher uploads, class members read, only the teacher may upload or delete

### kb-search.test.mjs

- ✔ kb:search finds the matching bug record first
- ✔ kb:search says so when nothing matches

### landing-pages.test.mjs

- ✔ landing pages: class roster, a student's own module summary, and a teacher's view of a student's progress
- ✔ class list and creation: a teacher creates classes, a student joins one, and one class's workspace never bleeds into another's

### live-classes.test.mjs

- ✔ live invitations: all live classes are offered, dismissal hides only that session, and a new activity invites again
- ✔ live invitations: refresh preserves dismissal, ending a session clears it, and a stopped presentation can invite again
- ✔ live invitations: receive-only listeners refresh on start, stop, and reconnect; cleanup removes their channels and ignores late events
- ✔ live invitations: entering or leaving the workspace waits for old channels to close before reusing their topics

### module-activities.test.mjs

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

### module-availability.test.mjs

- ✔ module availability: unknown modules and step ids cannot create progress (CKB-018)
- ✔ module availability migration: preserves existing content and work, opens existing modules, defaults new uploads closed, and safely reruns
- ✔ module availability: first part opens automatically, future content is withheld, and teacher switches cannot bypass student progress
- ✔ module availability: reupload preserves work and new parts require their preceding activities
- ✔ module availability: the same module in two classes has independent switches, and concurrent teacher edits keep both changes
- ✔ module availability: modules without a performance task reject its switch and submission

### module-progress.test.mjs

- ✔ module progress: step checklist, exit slip, and both performance-task versions (new feature, no prior CKB)
- ✔ module progress: two simultaneous first touches of a module don't 500 (write race)
- ✔ module progress: a module in two classrooms doesn't share one student's progress (classroom scoping)
- ✔ module progress: two simultaneous performance-task submissions don't lose one (write race)

### module-weekly-active.test.mjs

- ✔ module weekly active + shared project: pick, lock, and project file round-trip

### realtime.test.mjs

- ✔ realtime: an unrelated topic's subscriber never waits on another topic's pending removal
- ✔ realtime: resubscribing the same topic waits for its own pending removal to finish first (CKB-017)
- ✔ realtime: signing out clears pending cleanup so the next sign-in's subscriber never waits on the discarded client's teardown
- ✔ offline: classroom devices reach local Supabase through the laptop's address
- ✔ throttle sends at most once per interval and never drops the newest value
- ✔ channel rules: members join, outsiders are refused, only the teacher broadcasts to the class
- ✔ browser pass cannot read tables directly

### session-activity.test.mjs

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

### session-expiry.test.mjs

- ✔ session: student expires at fifteen minutes and teacher at two hours, despite background reads (CKB-051)
- ✔ session: only explicit activity renews the role deadline, accounting for the delayed last gesture
- ✔ session: old seven-day cookies, forged cookies and invalid renewal bodies are refused
- ✔ session: activity keeps the seven-day maximum and secure cookie settings
- ✔ session: live passes cannot outlast inactivity or renew an expired sign-in

### student-classroom-entry.test.mjs

- ✔ student entry: a single membership opens that classroom even with an obsolete saved choice
- ✔ student entry: multiple memberships reopen only a remembered class the student still belongs to
- ✔ student entry: no membership never opens a saved or invented classroom
- ✔ student entry: teachers, required password reset and explicit Classes navigation do not auto-enter
- ✔ student entry: remembered classrooms stay separate for different accounts on a shared browser
- ✔ student entry: unavailable browser storage still permits single-class entry and safe multi-class choice
- ✔ student chooser: a former class-home selection cannot resurrect the removed module landing page
- ✔ teacher chooser: class creation and the teacher dashboard entry remain available

### student-module-activity-ui.test.mjs

- ✔ module activity screen: signing in starts safely before a class or project exists (CKB-044)
- ✔ module activity screen: main Java editor has project tabs, sample output, Console, Run code and Save work

### teacher-dashboard-ui.test.mjs

- ✔ teacher dashboard: navigation maps Students and Curriculum and exposes loading instead of fake totals
- ✔ teacher dashboard: avatar styles cannot override the existing classroom avatar (CKB-039)

### teacher-dashboard.test.mjs

- ✔ refuses signed-out users, students, foreign teachers, and invalid class IDs
- ✔ counts saved completion and both submissions, including closed lessons, without exposing source
- ✔ keeps the same student's progress separate between classes and excludes former members
- ✔ returns finite zero totals for empty classes and modules with no students
- ✔ rounded 100% averages do not label unfinished students or modules Finished (CKB-041)
- ✔ rounded 0% averages retain In progress when a student has completed an item (CKB-041)
- ✔ reads every progress page instead of silently truncating a full year
- ✔ a new read reflects saved results without changing student progress
- ✔ teacher dashboard

### teacher-web-projects.test.mjs

- ✔ teacher web projects: lists every personal web project for the selected student and class, and reads saved files on demand
- ✔ teacher web projects: only the owning teacher reads a current class member's projects; guesses and write methods are refused
- ✔ teacher web projects: empty lists and files are readable, repeated reads never save, and a student's save appears on refresh
- ✔ teacher web preview: blocks network resources before student code while preserving the doctype and console line map
- ✔ teacher web preview: allows eval/Function so a saved eval()-based calculator behaves the same as it does for the student
- ✔ teacher web preview: headless pages retain console locations and missing HTML keeps its existing warning

### web-workspace.test.mjs

- ✔ inlines linked CSS and JavaScript, no external loads
- ✔ maps document lines back to the student's file and line
- ✔ capture script sits on the <head> line and does not shift lines
- ✔ works without <head>, and warns about missing files
- ✔ a </script> inside JavaScript cannot break out of the inlined script
- ✔ no index.html gives a friendly message
- ✔ file names must fit the project language

### weekly-java-project-ui.test.mjs

- ✔ weekly Java editor: module shows sample output and only module source
- ✔ weekly Java editor: personal shows its own source, input and explicit submission
