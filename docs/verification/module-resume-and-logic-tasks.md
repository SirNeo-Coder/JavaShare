# Module resume and meaningful exercise verification

2026-10-21. Branch `codex/module-resume-and-logic-tasks`; base
`codex/classroom-drawer-controls` at `d75d054`. No hosted SQL, deployment, settings or merge.

## Outcome and scope

The worksheet resumes its next unfinished step from server progress. Completing Week 12's
Monday steps, reloading and reopening shows DAY 2 · Step 3 with the inheritance sample.
First opening loads complete sample files; revisits restore the step's own edits. Module,
personal, earlier-week and submitted work remain separate. The prepared alteration/sample-first
work was integrated with current Console loading and drawer fixes. Seven Week 12/13 exercises
now use object state, inherited behavior, object ordering, dispatch or exception paths rather
than changing labels alone. New `-v2` task ids keep prior results from passing changed work.

## Required checks

- `npm run build:all`: production frontend and backend passed using the normal local runtime.
- `npm run lint`: zero errors; eight existing warnings (one effect-dependency warning, seven
  image-element warnings). No skips; no new warning suppression.
- `sg docker -c 'npm test'`: 221 passed, zero failed/cancelled/skipped/todo.
- `sg docker -c 'npm run classroom:offline -- --build-only'`: passed; existing local Supabase retained.
- `git diff --check`: passed.

## What the checks prove

`module-resume.test.mjs`, schema, matching and feedback tests check individual rules; rendered
markup tests inspect the visible labels. `module-activities.test.mjs` and browser-java-progress
exercise real routes with disposable users/classes in local Supabase. Laptop tests compile/run
actual multi-file Java, including every Week 12/13 sample and alteration and Week 14 compatibility.
The additive history migration is checked in a disposable database for preservation, repeated
application and old-reader compatibility. Local Supabase already had the history column; no
reset or hosted migration was performed.

`module-resume.browser.mjs` goes through the real local production app, first with laptop javac
and then with actual browser CheerpJ Java. It verifies separate sample evidence, rejection of
unchanged output, task completion, Tuesday resume after reload, correct supporting classes,
earlier draft restoration, another student's separate progress and, offline, full completion
leading to the performance task with personal edits preserved and no implicit submission.
`module-exercise-java8.browser.mjs` runs each of the seven revised samples and alterations on
actual CheerpJ Java 8. These are execution checks, not fabricated successful browser results.

## Deliberate-break proof

1. Temporarily removed the completion check from `moduleResumeStep`. Command:
   `node --test --test-reporter=spec tests/module-resume.test.mjs`. The named
   **module resume: two completed Monday steps reopen at Day 2 Step 3 after saved progress is reloaded**
   failed, selecting Step 1. The all-complete rule also failed. Restored in a finally block;
   both rules passed in the final full suite.
2. Temporarily changed the Week 12 Step 7 reference edit to leave the fleet order unchanged.
   Command: `node --test --test-reporter=spec tests/week12-week13-modules.test.mjs`.
   **Week 12 Step 7: java-2-w12-s7 sample and alteration** failed its real-Java output comparison.
   Restored in a finally block; every sample/alteration passed in the final suite.

## Initial failures and corrections

- A symlinked external dependency directory prevented Next's isolated build from resolving its
  package. Copied the existing installed dependencies into the isolated checkout; no dependency
  or configuration change. The first shell runtime also produced an unparsable TypeScript
  configuration response; the normal `sg docker` runtime built both app and backend successfully.
- Initial lint rejected a test variable named `module`; renamed it to `content`. Final lint has
  zero errors and the same eight existing warnings.
- The first browser assertion expected no task record after an unchanged attempt. The app
  correctly stored `fail` without completion. Corrected the assertion to refuse `pass`; the
  final real online/offline checks passed. No application change was needed for this assertion.

## Limits and teacher rollout

Hosted rollout remains unverified. The teacher must apply the prepared additive
`20261021000100_module_activity_projects.sql`, deploy the reviewed app and upload the revised
Week 12/13/14 JSON in the intended class. See `docs/module-sample-first-setup.md`.
No hosted data/settings/deploy changed. Windows, physical disconnected classroom devices and
non-Chromium browsers were not checked. The offline launcher build and actual local browser
javac runs cover the laptop path; they do not establish a physical Wi-Fi device test. The original
printed Week 12/13 documents are unchanged. Output completion remains practice evidence, not a grade.

## Automated names grouped by file

Command for every file below: `sg docker -c 'npm test'` (runs `node --test "tests/*.test.mjs"`).
All marks below are the final runner's marks, without durations.

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

- ✔ online module tasks: browser results check the task target and cannot reuse a sample pass
- ✔ online Java progress: browser evidence obeys membership, exact output, successful exit, saved version and part access
- ✔ online Java mode: missing address fails clearly; unsafe addresses are refused; legacy server mode remains available
- ✔ online sample first: server-owned stages reject edited samples and save verification separately from task completion

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
- ✔ sample first: verification requires the declared result and unchanged sample, never completes an alteration
- ✔ sample first: upload accepts opt-in and declared errors, rejects sample progress-key collisions
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
- ✔ sample first: real Java verifies samples, completes alterations, restores step drafts and refuses stale tabs
- ✔ sample first: a declared runtime error verifies only the demonstration and existing completions survive opt-in

### tests/module-activity-migration.test.mjs

- ✔ module step migration: additive history preserves work, completion and submissions; repeats safely and permits old readers

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

### tests/module-resume.test.mjs

- ✔ module resume: two completed Monday steps reopen at Day 2 Step 3 after saved progress is reloaded
- ✔ module resume: verifying a sample, failing a task or legacy passes cannot skip an unfinished alteration
- ✔ module resume: closed lessons and locked steps are excluded; completed modules have no unfinished step
- ✔ module exercises: revised requirements get separate identities and retain unsolved samples

### tests/module-run-feedback.test.mjs

- ✔ module feedback: prominent sample verification does not claim task completion
- ✔ module feedback: distinguishes old sample, wrong output, new completion and earlier completion
- ✔ module feedback: sample-first editor shows baseline target before allowing edits

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
- ✔ Week 14 sample 1: java-2-w14-d1-s1
- ✔ Week 14 sample 2: java-2-w14-d1-s2
- ✔ Week 14 sample 3: java-2-w14-d2-s3
- ✔ Week 14 sample 4: java-2-w14-d2-s4
- ✔ Week 14 sample 5: java-2-w14-d3-s5
- ✔ Week 14 sample 6: java-2-w14-d3-s6
- ✔ Week 14 sample 7: java-2-w14-d4-s7
- ✔ Week 14 sample 8: java-2-w14-d4-s8
- ✔ Week 14 sample 9: java-2-w14-d4-s9
- ✔ Week 14 sample 10: java-2-w14-d4-s10
- ✔ Week 14 sample 11: java-2-w14-d5-s11
- ✔ Week 14 samples: all eleven baselines verify with real Java, including the declared error demonstration
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

### tests/week12-week13-modules.test.mjs

- ✔ Weeks 12–14: uploads validate, identities link, and no personal starter receives the Vehicle family
- ✔ Week 12 Step 1: java-2-w12-s1 sample and alteration
- ✔ Week 12 Step 2: java-2-w12-s2 sample and alteration
- ✔ Week 12 Step 3: java-2-w12-s3 sample and alteration
- ✔ Week 12 Step 4: java-2-w12-s4 sample and alteration
- ✔ Week 12 Step 5: java-2-w12-s5 sample and alteration
- ✔ Week 12 Step 6: java-2-w12-s6 sample and alteration
- ✔ Week 12 Step 7: java-2-w12-s7 sample and alteration
- ✔ Week 12 Step 8: java-2-w12-s8 sample and alteration
- ✔ Week 12 Step 9: java-2-w12-s9 sample and alteration
- ✔ Week 13 Step 1: java-2-w13-s1 sample and alteration
- ✔ Week 13 Step 2: java-2-w13-s2 sample and alteration
- ✔ Week 13 Step 3: java-2-w13-s3 sample and alteration
- ✔ Week 13 Step 4: java-2-w13-s4 sample and alteration
- ✔ Week 13 Step 5: java-2-w13-s5 sample and alteration
- ✔ Week 13 Step 6: java-2-w13-s6 sample and alteration
- ✔ Week 13 Step 7: java-2-w13-s7 sample and alteration
- ✔ Week 13 Step 8: java-2-w13-s8 sample and alteration
- ✔ Week 13 Step 9: java-2-w13-s9 sample and alteration
- ✔ Week 13 Step 10: java-2-w13-s10 sample and alteration
- ✔ Week 13 Step 11: java-2-w13-s11 sample and alteration
- ✔ Week 13 Step 12: java-2-w13-s12 sample and alteration
- ✔ Week 13 Step 13: java-2-w13-s13 sample and alteration
- ✔ Week 13 completed classes run Week 14 ArrayList without replacing supporting classes
- ✔ Weeks 12–13: every sample and small alteration runs in a rolling multi-file project with real Java
- ✔ Week 12: personal starter and reference example compile and run independently
- ✔ Week 13: personal starter and reference example compile and run independently

### tests/weekly-java-project-ui.test.mjs

- ✔ weekly Java editor: module shows sample output and only module source
- ✔ weekly Java editor: personal shows its own source, input and explicit submission
- ✔ weekly Java editor: alteration shows its own target and remembers completed tasks

## Real browser names grouped by script

### tests/module-resume.browser.mjs

Command: `sg docker -c 'CODESHARE_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/absolute/path/to/chrome node --test --test-reporter=spec tests/module-resume.browser.mjs'`

- ✔ first sample verifies separately; unchanged output cannot complete its alteration
- ✔ meaningful object-state alteration completes Step 1 and opens Step 2
- ✔ finishing Monday and reloading opens Tuesday Step 3 with its own sample
- ✔ earlier drafts restore, personal work stays separate, and another student starts at Step 1
- ✔ all steps lead to the performance task; personal edits and prior module drafts remain separate
- ✔ module resume offline: sample loading, Monday completion, Tuesday resume and separate projects
- ✔ first sample verifies separately; unchanged output cannot complete its alteration
- ✔ meaningful object-state alteration completes Step 1 and opens Step 2
- ✔ finishing Monday and reloading opens Tuesday Step 3 with its own sample
- ✔ earlier drafts restore, personal work stays separate, and another student starts at Step 1
- ✔ module resume online: sample loading, Monday completion, Tuesday resume and separate projects

ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 94361.257726

### tests/module-exercise-java8.browser.mjs

Command: `sg docker -c 'CODESHARE_PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/absolute/path/to/chrome node --test --test-reporter=spec tests/module-exercise-java8.browser.mjs'`

- ✔ Java 8 Week 12 Step 1: unchanged sample and revised alteration
- ✔ Java 8 Week 12 Step 3: unchanged sample and revised alteration
- ✔ Java 8 Week 12 Step 4: unchanged sample and revised alteration
- ✔ Java 8 Week 12 Step 7: unchanged sample and revised alteration
- ✔ Java 8 Week 13 Step 6: unchanged sample and revised alteration
- ✔ Java 8 Week 13 Step 9: unchanged sample and revised alteration
- ✔ Java 8 Week 13 Step 11: unchanged sample and revised alteration
- ✔ revised Week 12–13 exercises: unchanged samples and meaningful alterations run on actual browser Java 8

ℹ tests 8
ℹ suites 0
ℹ pass 8
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 115767.969923

The existing historical sample-first and Week 12/13 standalone browser scripts were adapted to the current single Module tab. Their historical counts are preserved in their source-branch reports; they were not rerun for this delivery. The new browser scripts above provide the current production-app and revised-Java evidence.

## Delivery

Implementation `ad7efe6` is committed and pushed. [PR #33](https://github.com/SirNeo-Coder/JavaShare/pull/33) targets `codex/classroom-drawer-controls` (PR #32). GitHub connector creation returned 403; authenticated CLI creation succeeded. No merge or hosted action. Verification servers were stopped and disposable test users/classes cleaned up. The primary checkout remains unchanged.

## Final documentation check

After the review-link update, a sandboxed direct run of the two knowledge-base checks could
not spawn its child process (`EPERM`); this was an execution restriction, not an assertion failure.
Reran in the same normal runtime used for the successful full suite:
`sg docker -c 'node --test --test-reporter=spec tests/kb-search.test.mjs'`.

- ✔ kb:search finds the matching bug record first
- ✔ kb:search says so when nothing matches

Two passed, zero failed/skipped. These are repeat checks already included in the 221 full-suite
total, not additional distinct coverage. Final whitespace and clean-branch checks passed.
