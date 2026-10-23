# Personal performance-task workflow verification — 2026-10-23

Branch: `codex/personal-performance-workflow`, integrated with main `7946f0b`.

## Results and limits

- Full automated suite: **335 passed, 0 failed, 0 skipped** against actual local Supabase and laptop Java.
- Build: `npm run classroom:offline -- --build-only` passed, including `npm run build:all` (Next.js production build and backend TypeScript). `npm run build:all` and lint passed again after removing an unused optional type property; no runtime behavior changed after the full suite.
- Lint: `npm run lint` passed with **0 errors and 8 existing warnings** (seven image warnings and one effect-dependency warning).
- Offline production browser: **4 passed, 0 failed, 0 skipped**. Online production browser: **5 passed, 0 failed, 0 skipped**, including live Program input, Stop, exact-file submission and teacher execution/review.
- Three deliberately broken regressions failed; all passed after restoring the fixes.
- No hosted deployment, hosted database changes, Windows run, or physically disconnected classroom Wi-Fi/device test was performed. Offline checks used local Supabase, production Next.js and the laptop JVM. Online browser used actual CheerpJ with disposable local accounts and a separate local runner origin.
- Online success evidence remains browser-reported and can be falsified with developer tools, as explicitly approved. Legacy submissions cannot recover historical checklists; first review captures and labels the current checklist. No new migration or dependency.

## What each level proves

Pure rules and rendered component tests check precedence, paper exemption, controls and labels in isolation. API tests call the real app routes with local authentication/database and verify student/class scope, owner-only review, stale writes, frozen snapshots, submission/review identity and preserved progress. Laptop execution tests compile and run Java, including failure, crash, timeout and handled exceptions. Browser checks exercise actual student and teacher pages, the production API, saved data and real runners. Hosted services and physical classroom networking are outside this verification.

## Commands

The host requires Docker group access; tests were run through `sg docker -c '…'`. Supabase credentials were read from the local CLI without printing or storing them in this report.

```sh
npm run classroom:offline -- --build-only
npm run lint
npm test -- --test-reporter=spec --test-reporter-destination=/tmp/codeshare-personal-verified-tests.log --test-reporter=/tmp/codeshare-personal-test-reporter.mjs --test-reporter-destination=/tmp/codeshare-personal-results.jsonl
```

The extra reporter options followed the test glob, so Node used its normal spec output; the actual 335 named results below come from the captured command output, not the unused JSON destination. The underlying package command is `node --test "tests/*.test.mjs"`.

Browser commands (with the installed Playwright module and Chromium executable supplied through `CODESHARE_PLAYWRIGHT_MODULE` and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`):

```sh
node --test --test-reporter=spec tests/personal-performance.browser.mjs
PERSONAL_BROWSER_MODE=online node --test --test-reporter=spec tests/personal-performance.browser.mjs
```

The test expects local production servers on ports 3032 (laptop Java) and 3033 (online browser Java), with the public runner assets on a separate port 3034. All fixture users/classes are disposable and removed afterward.

## Earlier failures and corrections

- Initial restricted-shell Supabase checks could not access Docker; their skips were not counted as passes. Re-ran with actual local database access, including the previously skipped snapshot regression.
- Restricted-shell production build failed before application type checking; reran with the normal local build permissions successfully.
- Early browser runs exposed fixture timing/accessible-name assumptions and Program input's unstable implicit label. Fixed the test waits/selectors and supplied a stable explicit input label; actual typing and Enter are covered online.
- First integrated suite had 334 passes and one failure: the paper-continuation fixture was blocked by main's newly merged prerequisites. Made its predecessor completed and paper module text-only; final suite passed all 335.
- First integrated browser setup returned 400 because class creation now requires `subject: "Java"`. Updated that fixture to the current API and reran.

## Deliberate-break regression proof

Each source change was temporary and restored in a `finally` block before the passing run.

| File / named test | Deliberate break | Broken | Restored |
| --- | --- | --- | --- |
| `tests/browser-java-progress.test.mjs` — personal browser runs: failure, stale files and direct submission refused; review binds to a frozen submission | Remove successful saved-file submission guard | ✖ failed, exit 1 | ✔ passed, exit 0 |
| `tests/personal-performance.test.mjs` — personal continuation: current work wins, then submitted personal files, then draft, then personal starters | Prefer earlier draft over submitted copy | ✖ failed, exit 1 | ✔ passed, exit 0 |
| `tests/browser-java-progress.test.mjs` — personal browser runs: failure, stale files and direct submission refused; review binds to a frozen submission | Remove review submission-identity guard | ✖ failed, exit 1 | ✔ passed, exit 0 |

Commands: `node --test --test-reporter=spec --test-name-pattern="personal browser runs" tests/browser-java-progress.test.mjs` and `node --test --test-reporter=spec --test-name-pattern="personal continuation" tests/personal-performance.test.mjs`, run once with each break and once restored. Repeated on the integrated branch.

## Full suite — named results grouped by file

Command: `npm test` with the reporter arguments shown above. Marks/names retained from the runner; timing omitted. Includes parent tests and their subtests, matching the runner's total of 335.

### `tests/api-client.test.mjs`

```text
✔ API client: HTML 503 reports the failed status without exposing the response body
✔ API client: plain-text 502 reports the failed status without exposing the response body
✔ API client: empty 500 reports the failed status without exposing the response body
✔ API client: malformed JSON 503 reports the failed status without exposing the response body
✔ API client: JSON errors preserve the server message and prerequisite details
✔ API client: successful JSON and 204 responses preserve request options and session events
✔ API client: HTML 401 expires protected sessions but leaves failed login and registration alone
✔ API client: malformed successful responses are rejected instead of returning empty data
✔ API client: network failures remain failures and are not retried
```

### `tests/api-router.test.mjs`

```text
✔ router: path parameters, query, cookies, and JSON body reach the handler
✔ router: middleware passes on with next(), stops by responding, and next(error) reaches the error handler
✔ router: cookies, 204, unknown routes, bad JSON, and size limits
✔ router: the larger JSON body cap is scoped to the module-upload route, not every route
✔ routes: register, stay signed in with the cookie, get a live pass, sign out
✔ routes: a chat message's live signal finishes sending before the reply (CKB-006)
```

### `tests/browser-java-bridge.test.mjs`

```text
✔ browser bridge: committed JAR matches its Java source
✔ browser bridge: packages, inheritance, input and Unicode run together
✔ browser bridge: compile error, stderr and crash after expected output all fail
✔ browser bridge: combined stdout/stderr stops at 64 KB and missing classes cannot survive another run
✔ browser bridge: flat browser strings become distinct source folders, including duplicate class names
```

### `tests/browser-java-client.test.mjs`

```text
✔ browser Java: refuses same origin, insecure, credentialed and path-based runner addresses
✔ browser Java: authenticates frame messages, sends every source/input/package, and tears down after result or timeout
✔ browser Java: offline uses only the existing authenticated laptop endpoint
✔ browser Java: startup stages authenticate messages and identify the stalled stage without extending the deadline (CKB-056)
✔ browser Java: startup feedback never contaminates Java output or accepts stages after execution starts (CKB-056)
✔ interactive Java: streams prompts, waits for blank and Unicode answers, and rejects stale or foreign input requests (CKB-049)
✔ interactive Java: the five-second execution budget is cumulative across input waits
✔ interactive Java: Stop preserves printed output and removes a waiting run
✔ interactive Java: abandoned input stops after two minutes
✔ interactive Java: total submitted input and streamed output stay bounded
✔ interactive Java: streamed output stays bounded
✔ interactive Java: an older runner fails clearly during independent deployments
✔ interactive Java: a run cancelled before startup never appends its frame
```

### `tests/browser-java-progress.test.mjs`

```text
✔ online module tasks: browser results check the task target and cannot reuse a sample pass
✔ online Java progress: browser evidence obeys membership, exact output, successful exit, saved version and part access
✔ online Java mode: missing address fails clearly; unsafe addresses are refused; legacy server mode remains available
✔ online sample first: server-owned stages reject edited samples and save verification separately from task completion
✔ personal browser runs: failure, stale files and direct submission refused; review binds to a frozen submission
✔ personal compatibility: legacy snapshots retain files and freeze their first review checklist; paper week carries the personal track
```

### `tests/browser-java-runtime.test.mjs`

```text
✔ browser runtime: only the parent starts Java; flat strings preserve duplicate filenames for the bridge
✔ browser runtime: whole-file downloads preserve binary compiler JARs without Range support (CKB-056)
✔ browser runtime: missing compiler assets report the filename and stage without starting Java (CKB-056)
✔ browser runtime: failed compiler downloads report their stage and do not compile (CKB-056)
✔ browser runtime: invalid sources and download failure report failure instead of progress
✔ browser runtime: public asset policy permits CheerpJ's required nested runtime frame only (CKB-047)
✔ browser runtime: live input waits for authenticated matching answers and streams output before completion (CKB-049)
✔ browser runtime: live input cannot exceed the existing total input limit
```

### `tests/classroom-ui.test.mjs`

```text
✔ module catalog: displays saved progress and distinguishes continuing from reviewing
✔ module catalog: the server's live lock disables opening and only the weekly pick gets its badge
✔ module catalog: teacher browsing never invents student progress
✔ workspace drawers: closed panels stay mounted but inaccessible so closing can animate
✔ workspace rails: one Module control and the role's Projects control share the fixed left rail
✔ module worksheet: alteration instructions and target stay separate from the sample
✔ module parts: a locked next task does not hide the current task's discussion
✔ module pages: inactive lessons and task editors stay mounted so navigation cannot discard drafts
✔ module parts: author grouping spans days and assigns discussion and exit slips exactly once
✔ module parts: older lessons and redacted closed lessons retain their own safe pages
✔ module paper: tables, analogies, notes and error guides display their actual supplied content safely
✔ module worksheet: named parts, unchanged samples, page controls and teacher-only sample preview coexist
✔ module worksheet: inter-step tables and notes retain the uploaded reading order
```

### `tests/course-module-schema.test.mjs`

```text
✔ course module schema: accepts a module matching docs/course-format.md
✔ course module schema: rejects a step missing expectedOutput
✔ course module schema: rejects an unknown course
✔ course module schema: rejects the wrong format tag
✔ course module schema: rejects a step id reused by another lesson's step (CKB-007's bug class, reachable at upload)
✔ course module schema: rejects a step id that collides with an exit slip's id
✔ course module schema: rejects a java step file path that /api/execute could never run (a space)
✔ course module schema: rejects a java step file path over /api/execute's 160-character cap
✔ course module schema: rejects an unrunnable .java performance-task file path
✔ course module schema: rejects duplicate lesson ids before they can share an availability switch (CKB-019)
✔ course module schema: accepts a module with no step `part` fields, unchanged (backward compatible)
✔ course module schema: accepts a step with a `part` title, including one shared across two lessons
✔ course module schema: rejects an empty `part` title
```

### `tests/course-modules.test.mjs`

```text
✔ course modules: teacher uploads, class members read, only the teacher may upload or delete
```

### `tests/java-run-progress.test.mjs`

```text
✔ Java progress: idle, finished and failed runs leave no loading indicator
✔ Java progress: saving, starting and checking are visible accessible status messages
✔ Java progress: waiting for an answer replaces the working message
```

### `tests/java-suggestions.test.mjs`

```text
✔ Java suggestions: keywords, standard names and print statements match typed prefixes
✔ Java suggestions: current-file names are unique and ignore comments and string literals
✔ Java suggestions: comments, escaped strings, characters and text blocks never open suggestions
✔ Java suggestions: empty, short, selected, numeric and unsupported member prefixes stay quiet
✔ Java suggestions: insertion replaces the full word and preserves surrounding code
✔ Java suggestions: print snippets place the caret inside the parentheses
✔ Java suggestions: the main statement keeps existing indentation and puts the caret in its body
```

### `tests/kb-search.test.mjs`

```text
✔ kb:search finds the matching bug record first
✔ kb:search says so when nothing matches
```

### `tests/landing-pages.test.mjs`

```text
✔ landing pages: class roster, a student's own module summary, and a teacher's view of a student's progress
✔ class list and creation: a teacher creates classes, a student joins one, and one class's workspace never bleeds into another's
```

### `tests/live-classes.test.mjs`

```text
✔ live invitations: all live classes are offered, dismissal hides only that session, and a new activity invites again
✔ live invitations: refresh preserves dismissal, ending a session clears it, and a stopped presentation can invite again
✔ live invitations: receive-only listeners refresh on start, stop, and reconnect; cleanup removes their channels and ignores late events
✔ live invitations: entering or leaving the workspace waits for old channels to close before reusing their topics
```

### `tests/module-activities.test.mjs`

```text
✔ module activities: legacy challenge JSON remains readable while progress follows the sample
✔ module activities: parts spanning lessons require every task and never require a paper liplet
✔ module activities: matching text cannot pass a failed process; internal whitespace still matters
✔ sample first: verification requires the declared result and unchanged sample, never completes an alteration
✔ sample first: upload accepts opt-in and declared errors, rejects sample progress-key collisions
✔ module activities: supporting classes survive and src aliases cannot duplicate Main.java (CKB-038)
✔ module tasks: explicit ids isolate completion and unlock one step at a time inside a part
✔ module tasks: upload rejects duplicate task ids and collisions with stored progress keys
✔ module tasks: real Java checks the alteration, redacts the next step and preserves rolling work
✔ module activities: real multi-file Java result unlocks only that student, without teacher switches or liplets (CKB-038)
✔ module activities: compile errors and a crash after the right output cannot pass
✔ module activities: prior project is copied only for its owner/class and later saves never replace it
✔ module activities: JSON supplies fixed program input and demo execution cannot award a pass
✔ weekly Java projects: personal drafts roll forward separately, preserve submissions and never advance module progress
✔ module activities: offline ignores online runner address and refuses browser progress
✔ sample first: real Java verifies samples, completes alterations, restores step drafts and refuses stale tabs
✔ sample first: a declared runtime error verifies only the demonstration and existing completions survive opt-in
✔ personal offline runs: compile failure, crash and timeout cannot submit; handled exceptions can
```

### `tests/module-activity-migration.test.mjs`

```text
✔ module step migration: additive history preserves work, completion and submissions; repeats safely and permits old readers
```

### `tests/module-availability.test.mjs`

```text
✔ module availability: unknown modules and step ids cannot create progress (CKB-018)
✔ module availability migration: preserves existing content and work, opens existing modules, defaults new uploads closed, and safely reruns
✔ module availability: first part opens automatically, future content is withheld, and teacher switches cannot bypass student progress
✔ module availability: reupload preserves work and new parts require their preceding activities
✔ module availability: the same module in two classes has independent switches, and concurrent teacher edits keep both changes
✔ module availability: modules without a performance task reject its switch and submission
```

### `tests/module-catalog-order.test.mjs`

```text
✔ module catalog order: unfinished weeks run from 12 to 21 despite active and locked flags
✔ module catalog order: finishing Week 12 puts Week 13 first and Week 12 last
✔ module catalog order: only complete modules move below all unfinished weeks
✔ module catalog order: equal weeks keep their existing order and an empty catalog stays empty
```

### `tests/module-completion.test.mjs`

```text
✔ summaries contain only required metadata, keep legacy scope and refuse browser roles
✔ opening a step prepares local files without saving project code or draft history
✔ failed output, sample-only evidence, changed samples and direct flags cannot save code or complete
✔ a successful checkpoint saves exact files, sample verification and completion together once
✔ legacy samples and intentional-error verification keep distinct completion rules
✔ module updates, stale projects and live restrictions keep existing successful work intact
✔ completion-only modules: read-only preparation, small summaries and guarded successful checkpoints
```

### `tests/module-device-store.test.mjs`

```text
✔ module device cache keys isolate student, classroom, module, and activity
✔ module content cache expires so teacher updates are fetched
✔ module drafts: expected-error verification survives reload with unfinished edits
✔ module drafts: changed lesson, task identity and legacy drafts keep backups without reusing evidence
✔ module drafts: invalid sample evidence resets safely while valid pending completion survives
```

### `tests/module-prerequisites.test.mjs`

```text
✔ module prerequisites: oldest unfinished ancestor blocks later weeks even when the immediate predecessor passed
✔ module prerequisites: sample verification, failed tasks and superseded ids cannot unlock a later module
✔ module prerequisites: missing and cyclic links give teacher repair messages without looping
✔ module prerequisites: live class permits the weekly chain but still blocks unrelated modules
✔ module prerequisites: banner names the earliest week and offers Continue; missing modules offer no dead button
✔ blocks content before prerequisites
✔ blocks progress before prerequisites
✔ blocks module project before prerequisites
✔ blocks paper record before prerequisites
✔ blocks activity before prerequisites
✔ blocks laptop run before prerequisites
✔ blocks browser result before prerequisites
✔ blocks personal open before prerequisites
✔ blocks personal save before prerequisites
✔ blocks submission before prerequisites
✔ live class catch-up, ordered unlock, teacher preview and student/class isolation
✔ module prerequisites: real routes reject every later-module entry, isolate students/classes and preserve saved work
```

### `tests/module-progress.test.mjs`

```text
✔ module progress: step checklist, exit slip, and both performance-task versions (new feature, no prior CKB)
✔ module progress: two simultaneous first touches of a module don't 500 (write race)
✔ module progress: a module in two classrooms doesn't share one student's progress (classroom scoping)
✔ module progress: two simultaneous performance-task submissions don't lose one (write race)
```

### `tests/module-resume.test.mjs`

```text
✔ module resume: two completed Monday steps reopen at Day 2 Step 3 after saved progress is reloaded
✔ module resume: verifying a sample, failing a task or legacy passes cannot skip an unfinished alteration
✔ module resume: closed lessons and locked steps are excluded; completed modules have no unfinished step
✔ module exercises: revised requirements get separate identities and retain unsolved samples
```

### `tests/module-run-feedback.test.mjs`

```text
✔ module feedback: prominent sample verification does not claim task completion
✔ module feedback: distinguishes old sample, wrong output, new completion and earlier completion
✔ module feedback: sample-first editor shows baseline target before allowing edits
✔ module feedback: local passes wait for server acceptance even after an earlier completion
```

### `tests/module-weekly-active.test.mjs`

```text
✔ module weekly active + shared project: pick, lock, and project file round-trip
```

### `tests/personal-performance.test.mjs`

```text
✔ personal continuation: current work wins, then submitted personal files, then draft, then personal starters
✔ Week 20: Java 2 proposal stays paper-only; other weeks retain Java submission
```

### `tests/realtime.test.mjs`

```text
✔ realtime: an unrelated topic's subscriber never waits on another topic's pending removal
✔ realtime: resubscribing the same topic waits for its own pending removal to finish first (CKB-017)
✔ realtime: signing out clears pending cleanup so the next sign-in's subscriber never waits on the discarded client's teardown
✔ offline: classroom devices reach local Supabase through the laptop's address
✔ throttle sends at most once per interval and never drops the newest value
✔ channel rules: members join, outsiders are refused, only the teacher broadcasts to the class
✔ browser pass cannot read tables directly
```

### `tests/rolling-module-tasks.test.mjs`

```text
✔ Week 14 tasks: revised upload keeps published ids and links to the preceding Vehicle project
✔ Week 14 sample 1: java-2-w14-d1-s1
✔ Week 14 sample 2: java-2-w14-d1-s2
✔ Week 14 sample 3: java-2-w14-d2-s3
✔ Week 14 sample 4: java-2-w14-d2-s4
✔ Week 14 sample 5: java-2-w14-d3-s5
✔ Week 14 sample 6: java-2-w14-d3-s6
✔ Week 14 sample 7: java-2-w14-d4-s7
✔ Week 14 sample 8: java-2-w14-d4-s8
✔ Week 14 sample 9: java-2-w14-d4-s9
✔ Week 14 sample 10: java-2-w14-d4-s10
✔ Week 14 sample 11: java-2-w14-d5-s11
✔ Week 14 samples: all eleven baselines verify with real Java, including the declared error demonstration
✔ Week 14 Step 1: java-2-w14-d1-s1
✔ Week 14 Step 2: java-2-w14-d1-s2
✔ Week 14 Step 3: java-2-w14-d2-s3
✔ Week 14 Step 4: java-2-w14-d2-s4
✔ Week 14 Step 5: java-2-w14-d3-s5
✔ Week 14 Step 6: java-2-w14-d3-s6
✔ Week 14 Step 7: java-2-w14-d4-s7
✔ Week 14 Step 8: java-2-w14-d4-s8
✔ Week 14 Step 9: java-2-w14-d4-s9
✔ Week 14 Step 10: java-2-w14-d4-s10
✔ Week 14 Step 11: java-2-w14-d5-s11
✔ Week 14 tasks: all eleven alterations produce their published targets with real multi-file Java
```

### `tests/session-activity.test.mjs`

```text
✔ idle browser: background updates do not renew, warns at fourteen minutes and signs out at fifteen
✔ idle browser: real gestures renew at most once per minute and preserve the last gesture time
✔ idle browser: continuing during the warning clears it and starts a fresh idle period
✔ idle browser: a delayed background timer cannot report an old gesture as recent activity
✔ idle browser: a five-hour suspension expires before the returning gesture can renew
✔ idle browser: another tab's renewal is shared, and sign-out clears all tabs
✔ idle browser: suspended timer reads a newer deadline even before its storage event arrives
✔ idle browser: changing accounts reloads old data without deleting the new session
✔ idle browser: failed renewal cannot extend expiry, and cleanup removes listeners and timers
✔ idle browser: wrong login password leaves the session alone; a protected 401 signs it out
```

### `tests/session-expiry.test.mjs`

```text
✔ session: student expires at fifteen minutes and teacher at two hours, despite background reads (CKB-051)
✔ session: only explicit activity renews the role deadline, accounting for the delayed last gesture
✔ session: old seven-day cookies, forged cookies and invalid renewal bodies are refused
✔ session: activity keeps the seven-day maximum and secure cookie settings
✔ session: live passes cannot outlast inactivity or renew an expired sign-in
```

### `tests/student-classroom-entry.test.mjs`

```text
✔ student entry: a single membership opens that classroom even with an obsolete saved choice
✔ student entry: multiple memberships reopen only a remembered class the student still belongs to
✔ student entry: no membership never opens a saved or invented classroom
✔ student entry: teachers, required password reset and explicit Classes navigation do not auto-enter
✔ student entry: remembered classrooms stay separate for different accounts on a shared browser
✔ student entry: unavailable browser storage still permits single-class entry and safe multi-class choice
✔ student chooser: a former class-home selection cannot resurrect the removed module landing page
✔ teacher chooser: class creation and the teacher dashboard entry remain available
```

### `tests/student-module-activity-ui.test.mjs`

```text
✔ module activity screen: signing in starts safely before a class or project exists (CKB-044)
✔ module activity screen: main Java editor has project tabs, sample output, Console, Run code and Save work
```

### `tests/subject-module-sharing.test.mjs`

```text
✔ class creation requires exactly Java or Net MVC and an assigned class cannot switch subjects
✔ upload once reaches same-subject classes, excludes the other subject and another teacher, and includes later classes
✔ members read only their classes; students and another teacher cannot choose subjects, share, upload or delete
✔ shared corrections refresh list, reader, student summary and dashboard without mixing progress, drafts or submissions
✔ shared-only prerequisites unlock per class and never reuse another class's completion
✔ old uploads stay readable before subject selection and remain backed up; conflicting sharing needs the selected current version
✔ shared deletion removes access and weekly picks across that subject while preserving backups, student work and the other subject
✔ subject modules: one subject per class, one upload per teacher/subject, separate student work
✔ subject library migration: preserves old uploads and student work, repeats safely, and restricts subjects and direct access
```

### `tests/teacher-dashboard-ui.test.mjs`

```text
✔ teacher dashboard: navigation maps Students and Curriculum and exposes loading instead of fake totals
✔ teacher dashboard: avatar styles cannot override the existing classroom avatar (CKB-039)
```

### `tests/teacher-dashboard.test.mjs`

```text
✔ refuses signed-out users, students, foreign teachers, and invalid class IDs
✔ counts saved completion and both submissions, including closed lessons, without exposing source
✔ keeps the same student's progress separate between classes and excludes former members
✔ returns finite zero totals for empty classes and modules with no students
✔ rounded 100% averages do not label unfinished students or modules Finished (CKB-041)
✔ rounded 0% averages retain In progress when a student has completed an item (CKB-041)
✔ reads every progress page instead of silently truncating a full year
✔ a new read reflects saved results without changing student progress
✔ teacher dashboard
```

### `tests/teacher-web-projects.test.mjs`

```text
✔ teacher web projects: lists every personal web project for the selected student and class, and reads saved files on demand
✔ teacher web projects: only the owning teacher reads a current class member's projects; guesses and write methods are refused
✔ teacher web projects: empty lists and files are readable, repeated reads never save, and a student's save appears on refresh
✔ teacher web preview: blocks network resources before student code while preserving the doctype and console line map
✔ teacher web preview: allows eval/Function so a saved eval()-based calculator behaves the same as it does for the student
✔ teacher web preview: headless pages retain console locations and missing HTML keeps its existing warning
```

### `tests/web-workspace.test.mjs`

```text
✔ inlines linked CSS and JavaScript, no external loads
✔ maps document lines back to the student's file and line
✔ capture script sits on the <head> line and does not shift lines
✔ works without <head>, and warns about missing files
✔ a </script> inside JavaScript cannot break out of the inlined script
✔ no index.html gives a friendly message
✔ file names must fit the project language
```

### `tests/week12-week13-modules.test.mjs`

```text
✔ Weeks 12–14: uploads validate, identities link, and no personal starter receives the Vehicle family
✔ Week 12 Step 1: java-2-w12-s1 sample and alteration
✔ Week 12 Step 2: java-2-w12-s2 sample and alteration
✔ Week 12 Step 3: java-2-w12-s3 sample and alteration
✔ Week 12 Step 4: java-2-w12-s4 sample and alteration
✔ Week 12 Step 5: java-2-w12-s5 sample and alteration
✔ Week 12 Step 6: java-2-w12-s6 sample and alteration
✔ Week 12 Step 7: java-2-w12-s7 sample and alteration
✔ Week 12 Step 8: java-2-w12-s8 sample and alteration
✔ Week 12 Step 9: java-2-w12-s9 sample and alteration
✔ Week 13 Step 1: java-2-w13-s1 sample and alteration
✔ Week 13 Step 2: java-2-w13-s2 sample and alteration
✔ Week 13 Step 3: java-2-w13-s3 sample and alteration
✔ Week 13 Step 4: java-2-w13-s4 sample and alteration
✔ Week 13 Step 5: java-2-w13-s5 sample and alteration
✔ Week 13 Step 6: java-2-w13-s6 sample and alteration
✔ Week 13 Step 7: java-2-w13-s7 sample and alteration
✔ Week 13 Step 8: java-2-w13-s8 sample and alteration
✔ Week 13 Step 9: java-2-w13-s9 sample and alteration
✔ Week 13 Step 10: java-2-w13-s10 sample and alteration
✔ Week 13 Step 11: java-2-w13-s11 sample and alteration
✔ Week 13 Step 12: java-2-w13-s12 sample and alteration
✔ Week 13 Step 13: java-2-w13-s13 sample and alteration
✔ Week 13 completed classes run Week 14 ArrayList without replacing supporting classes
✔ Weeks 12–13: every sample and small alteration runs in a rolling multi-file project with real Java
✔ Week 12: personal starter and reference example compile and run independently
✔ Week 13: personal starter and reference example compile and run independently
```

### `tests/week15-week21-modules.test.mjs`

```text
✔ Weeks 12–21: actual curriculum links resolve and current tasks control ordered access
✔ Week 15: upload accepts additions and every original lesson value survives
✔ Week 16: upload accepts additions and every original lesson value survives
✔ Week 17: upload accepts additions and every original lesson value survives
✔ Week 18: upload accepts additions and every original lesson value survives
✔ Week 19: upload accepts additions and every original lesson value survives
✔ Week 20: upload accepts additions and every original lesson value survives
✔ Week 21: upload accepts additions and every original lesson value survives
✔ Weeks 15–21: old samples and headless messages cannot pass new tasks or bypass their sample gate
✔ Week 15 Step 1: disk sample and alteration
✔ Week 15 Step 2: disk sample and alteration
✔ Week 15 Step 3: disk sample and alteration
✔ Week 15 Step 4: disk sample and alteration
✔ Week 15 Step 5: disk sample and alteration
✔ Week 15 Step 6: disk sample and alteration
✔ Week 15 Step 7: disk sample and alteration
✔ Week 15 Step 8: disk sample and alteration
✔ Week 15 Step 9: disk sample and alteration
✔ Week 15 Step 10: disk sample and alteration
✔ Week 15: original disk samples and each independent alteration match real Java output
✔ Week 16 Step 1: sample and alteration
✔ Week 16 Step 2: sample and alteration
✔ Week 16 Step 3: sample and alteration
✔ Week 16 Step 4: sample and alteration
✔ Week 16 Step 5: sample and alteration
✔ Week 16 Step 6: sample and alteration
✔ Week 16 Step 7: sample and alteration
✔ Week 16: complete samples and meaningful alterations run through the classroom laptop runner
✔ Week 17 Step 1: sample and alteration
✔ Week 17 Step 2: sample and alteration
✔ Week 17 Step 3: sample and alteration
✔ Week 17 Step 4: sample and alteration
✔ Week 17 Step 5: sample and alteration
✔ Week 17 Step 6: sample and alteration
✔ Week 17: complete samples and meaningful alterations run through the classroom laptop runner
✔ Week 18 Step 1: sample and alteration
✔ Week 18 Step 2: sample and alteration
✔ Week 18 Step 3: sample and alteration
✔ Week 18 Step 4: sample and alteration
✔ Week 18 Step 5: sample and alteration
✔ Week 18: complete samples and meaningful alterations run through the classroom laptop runner
✔ Week 19 Step 1: sample and alteration
✔ Week 19 Step 2: sample and alteration
✔ Week 19 Step 3: sample and alteration
✔ Week 19 Step 4: sample and alteration
✔ Week 19: complete samples and meaningful alterations run through the classroom laptop runner
✔ Week 21 Step 1: sample and alteration
✔ Week 21: complete samples and meaningful alterations run through the classroom laptop runner
✔ Week 15: classroom file access stays blocked while desktop exercises remain explicitly separate
```

### `tests/weekly-java-project-ui.test.mjs`

```text
✔ weekly Java editor: module shows sample output and only module source
✔ weekly Java editor: personal shows its own source, input and explicit submission
✔ weekly Java editor: alteration shows its own target and remembers completed tasks
✔ personal submission: button starts disabled and teacher editor cannot save or edit
```

## Production browser — named results

### `tests/personal-performance.browser.mjs` — offline

Command: `node --test --test-reporter=spec tests/personal-performance.browser.mjs` with local laptop Java mode.

```text
▶ personal offline screens: successful submission, separate draft, frozen teacher run and complete checklist
  ✔ Projects exposes the personal workflow and both entry points reopen the same draft (1962.479762ms)
  ✔ failed run cannot submit; success enables submission; edits invalidate it (7428.099674ms)
  ✔ teacher opens frozen files in main editor, runs them and saves every checklist item (1917.787071ms)
✔ personal offline screens: successful submission, separate draft, frozen teacher run and complete checklist (12516.65917ms)
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 14304.356546
```

### `tests/personal-performance.browser.mjs` — online

Command: `PERSONAL_BROWSER_MODE=online node --test --test-reporter=spec tests/personal-performance.browser.mjs`. Actual CheerpJ; completed in about 6.6 minutes.

```text
▶ personal online screens: successful submission, separate draft, frozen teacher run and complete checklist
  ✔ Projects exposes the personal workflow and both entry points reopen the same draft (1594.632ms)
  ✔ live Program input works and Stop invalidates a previously successful run (105694.262137ms)
  ✔ failed run cannot submit; success enables submission; edits invalidate it (206386.193101ms)
  ✔ teacher opens frozen files in main editor, runs them and saves every checklist item (79912.972219ms)
✔ personal online screens: successful submission, separate draft, frozen teacher run and complete checklist (394631.342613ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 396365.708204
```
