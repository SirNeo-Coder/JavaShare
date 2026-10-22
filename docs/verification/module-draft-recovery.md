# Module draft recovery verification — 2026-10-23

Branch: `codex/module-draft-recovery`, based on main `fc0972c` (completion-saving PR #41 merged).
Teacher approved fixing the three reviewed defects. No hosted changes or new migration.

## Final results

- `npm run build:all`: Next.js production and backend TypeScript builds pass.
- `npm run lint`: 0 errors, 8 pre-existing warnings.
- `npm test`: 329 pass, 0 fail, 0 skipped. Final equivalent run below includes the picker correction.
- `npm run classroom:offline -- --check`: existing local Supabase configuration ready.
- Browser: 7 pass, 0 fail, 0 skipped, against the local production app and local Supabase.
- Three deliberate regressions were caught; restored unit/feedback checks pass 9/9.

## What the checks exercise

`module-device-store.test.mjs` checks restoration rules directly: expected exceptions, unchanged
source, module version/task identity, legacy records, multiple preserved backups and pending evidence.
`module-run-feedback.test.mjs` checks rendered messages, including a local pass after prior completion.
These tests alone do not exercise IndexedDB, React effects, or networking.

`module-draft-recovery.browser.mjs` exercises actual production pages, IndexedDB, reloads, teacher
uploads, server validation and completion persistence with disposable local users/classes.
Online Java responses and failed completion responses are controlled test inputs. It does not
download or execute CheerpJ. The offline cases execute real Java through laptop javac.
The completion retry uses the same id and only announces unlocking after real server acceptance.
The teacher-correction case keeps the content cache fresh to exercise version invalidation.

## Deliberate failures and restored proof

For each mutation, the source was restored in a finally block; no broken source was committed.
Commands: `node tests/module-device-store.test.mjs` and `node tests/module-run-feedback.test.mjs`.

- Replace `matchesSample(draft.sample, step)` with `draft.sample.success`: 2 fail / 3 pass.
  Failing names: `module drafts: expected-error verification survives reload with unfinished edits`;
  `module drafts: invalid sample evidence resets safely while valid pending completion survives`.
- Disable the module-version/task-identity comparison: 1 fail / 4 pass.
  Failing name: `module drafts: changed lesson, task identity and legacy drafts keep backups without reusing evidence`.
- Restore the premature completion wording for pending sync: 1 fail / 3 pass.
  Failing name: `module feedback: local passes wait for server acceptance even after an earlier completion`.
- Restore fixes: all 5 device-record and all 4 feedback tests pass.
- The browser teacher-correction test first failed because the picker selected from stale content.
  After checking its version before choosing a step, that same test passes.

## Earlier failed checks

- Initial build could not resolve Next through an external node_modules symlink. Reused installed
  package files inside the worktree; no dependency/configuration change was needed.
- First browser launch looked for a different Chromium version. Reran with the installed executable.
- First configured offline browser run lacked `CODESHARE_LAPTOP=true`, so the production server
  selected the browser runner. Corrected the temporary launcher and added a runner-mode assertion;
  final offline browser tests pass on real laptop Java.
- Lint rejected a newly declared `module` variable. Renamed that local value to `currentModule`;
  final lint passes with the same eight existing warnings.

## Browser results

The app used ports 3040 (online behavior) and 3042 (laptop behavior), with only local Supabase.
Set `CODESHARE_PLAYWRIGHT_MODULE` and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to the installed
Playwright module and Chromium executable. Command:

```sh
sg docker -c 'node --test --test-reporter=spec tests/module-draft-recovery.browser.mjs'
```

### tests/module-draft-recovery.browser.mjs

```text
▶ module draft recovery online
  ✔ expected-error verification and unfinished code survive reopening (3887.601182ms)
  ✔ rejected completion stays pending through reload and unlocks only after retry acceptance (1867.174128ms)
  ✔ teacher correction refreshes cached instructions and archives stale code and pending evidence (1762.319216ms)
✔ module draft recovery online (10087.100984ms)
▶ module draft recovery offline
  ✔ expected-error verification and unfinished code survive reopening (4794.508745ms)
  ✔ laptop Java completes the restored alteration without losing its code (2649.67358ms)
✔ module draft recovery offline (9122.385433ms)
ℹ tests 7
ℹ suites 0
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 23218.014361
```

## Full suite, grouped by source file

`npm test` runs `node --test "tests/*.test.mjs"`. Final run after the picker correction used
the same test selection, adding a reporter that records the runner's file/name/result fields:

```sh
sg docker -c 'node --test --test-reporter=spec --test-reporter-destination=/tmp/module-recovery-suite.log --test-reporter=/tmp/codeshare-test-report.mjs --test-reporter-destination=/tmp/module-recovery-results.jsonl "tests/*.test.mjs"'
```

### tests/api-client.test.mjs

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

### tests/api-router.test.mjs

```text
✔ router: path parameters, query, cookies, and JSON body reach the handler
✔ router: middleware passes on with next(), stops by responding, and next(error) reaches the error handler
✔ router: cookies, 204, unknown routes, bad JSON, and size limits
✔ router: the larger JSON body cap is scoped to the module-upload route, not every route
✔ routes: register, stay signed in with the cookie, get a live pass, sign out
✔ routes: a chat message's live signal finishes sending before the reply (CKB-006)
```

### tests/browser-java-bridge.test.mjs

```text
✔ browser bridge: committed JAR matches its Java source
✔ browser bridge: packages, inheritance, input and Unicode run together
✔ browser bridge: compile error, stderr and crash after expected output all fail
✔ browser bridge: combined stdout/stderr stops at 64 KB and missing classes cannot survive another run
✔ browser bridge: flat browser strings become distinct source folders, including duplicate class names
```

### tests/browser-java-client.test.mjs

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

### tests/browser-java-progress.test.mjs

```text
✔ online module tasks: browser results check the task target and cannot reuse a sample pass
✔ online Java progress: browser evidence obeys membership, exact output, successful exit, saved version and part access
✔ online Java mode: missing address fails clearly; unsafe addresses are refused; legacy server mode remains available
✔ online sample first: server-owned stages reject edited samples and save verification separately from task completion
```

### tests/browser-java-runtime.test.mjs

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

### tests/classroom-ui.test.mjs

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

### tests/course-module-schema.test.mjs

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

### tests/course-modules.test.mjs

```text
✔ course modules: teacher uploads, class members read, only the teacher may upload or delete
```

### tests/java-run-progress.test.mjs

```text
✔ Java progress: idle, finished and failed runs leave no loading indicator
✔ Java progress: saving, starting and checking are visible accessible status messages
✔ Java progress: waiting for an answer replaces the working message
```

### tests/java-suggestions.test.mjs

```text
✔ Java suggestions: keywords, standard names and print statements match typed prefixes
✔ Java suggestions: current-file names are unique and ignore comments and string literals
✔ Java suggestions: comments, escaped strings, characters and text blocks never open suggestions
✔ Java suggestions: empty, short, selected, numeric and unsupported member prefixes stay quiet
✔ Java suggestions: insertion replaces the full word and preserves surrounding code
✔ Java suggestions: print snippets place the caret inside the parentheses
✔ Java suggestions: the main statement keeps existing indentation and puts the caret in its body
```

### tests/kb-search.test.mjs

```text
✔ kb:search finds the matching bug record first
✔ kb:search says so when nothing matches
```

### tests/landing-pages.test.mjs

```text
✔ landing pages: class roster, a student's own module summary, and a teacher's view of a student's progress
✔ class list and creation: a teacher creates classes, a student joins one, and one class's workspace never bleeds into another's
```

### tests/live-classes.test.mjs

```text
✔ live invitations: all live classes are offered, dismissal hides only that session, and a new activity invites again
✔ live invitations: refresh preserves dismissal, ending a session clears it, and a stopped presentation can invite again
✔ live invitations: receive-only listeners refresh on start, stop, and reconnect; cleanup removes their channels and ignores late events
✔ live invitations: entering or leaving the workspace waits for old channels to close before reusing their topics
```

### tests/module-activities.test.mjs

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
```

### tests/module-activity-migration.test.mjs

```text
✔ module step migration: additive history preserves work, completion and submissions; repeats safely and permits old readers
```

### tests/module-availability.test.mjs

```text
✔ module availability: unknown modules and step ids cannot create progress (CKB-018)
✔ module availability migration: preserves existing content and work, opens existing modules, defaults new uploads closed, and safely reruns
✔ module availability: first part opens automatically, future content is withheld, and teacher switches cannot bypass student progress
✔ module availability: reupload preserves work and new parts require their preceding activities
✔ module availability: the same module in two classes has independent switches, and concurrent teacher edits keep both changes
✔ module availability: modules without a performance task reject its switch and submission
```

### tests/module-catalog-order.test.mjs

```text
✔ module catalog order: unfinished weeks run from 12 to 21 despite active and locked flags
✔ module catalog order: finishing Week 12 puts Week 13 first and Week 12 last
✔ module catalog order: only complete modules move below all unfinished weeks
✔ module catalog order: equal weeks keep their existing order and an empty catalog stays empty
```

### tests/module-completion.test.mjs

```text
✔ summaries contain only required metadata, keep legacy scope and refuse browser roles
✔ opening a step prepares local files without saving project code or draft history
✔ failed output, sample-only evidence, changed samples and direct flags cannot save code or complete
✔ a successful checkpoint saves exact files, sample verification and completion together once
✔ legacy samples and intentional-error verification keep distinct completion rules
✔ module updates, stale projects and live restrictions keep existing successful work intact
✔ completion-only modules: read-only preparation, small summaries and guarded successful checkpoints
```

### tests/module-device-store.test.mjs

```text
✔ module device cache keys isolate student, classroom, module, and activity
✔ module content cache expires so teacher updates are fetched
✔ module drafts: expected-error verification survives reload with unfinished edits
✔ module drafts: changed lesson, task identity and legacy drafts keep backups without reusing evidence
✔ module drafts: invalid sample evidence resets safely while valid pending completion survives
```

### tests/module-prerequisites.test.mjs

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

### tests/module-progress.test.mjs

```text
✔ module progress: step checklist, exit slip, and both performance-task versions (new feature, no prior CKB)
✔ module progress: two simultaneous first touches of a module don't 500 (write race)
✔ module progress: a module in two classrooms doesn't share one student's progress (classroom scoping)
✔ module progress: two simultaneous performance-task submissions don't lose one (write race)
```

### tests/module-resume.test.mjs

```text
✔ module resume: two completed Monday steps reopen at Day 2 Step 3 after saved progress is reloaded
✔ module resume: verifying a sample, failing a task or legacy passes cannot skip an unfinished alteration
✔ module resume: closed lessons and locked steps are excluded; completed modules have no unfinished step
✔ module exercises: revised requirements get separate identities and retain unsolved samples
```

### tests/module-run-feedback.test.mjs

```text
✔ module feedback: prominent sample verification does not claim task completion
✔ module feedback: distinguishes old sample, wrong output, new completion and earlier completion
✔ module feedback: sample-first editor shows baseline target before allowing edits
✔ module feedback: local passes wait for server acceptance even after an earlier completion
```

### tests/module-weekly-active.test.mjs

```text
✔ module weekly active + shared project: pick, lock, and project file round-trip
```

### tests/realtime.test.mjs

```text
✔ realtime: an unrelated topic's subscriber never waits on another topic's pending removal
✔ realtime: resubscribing the same topic waits for its own pending removal to finish first (CKB-017)
✔ realtime: signing out clears pending cleanup so the next sign-in's subscriber never waits on the discarded client's teardown
✔ offline: classroom devices reach local Supabase through the laptop's address
✔ throttle sends at most once per interval and never drops the newest value
✔ channel rules: members join, outsiders are refused, only the teacher broadcasts to the class
✔ browser pass cannot read tables directly
```

### tests/rolling-module-tasks.test.mjs

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

### tests/session-activity.test.mjs

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

### tests/session-expiry.test.mjs

```text
✔ session: student expires at fifteen minutes and teacher at two hours, despite background reads (CKB-051)
✔ session: only explicit activity renews the role deadline, accounting for the delayed last gesture
✔ session: old seven-day cookies, forged cookies and invalid renewal bodies are refused
✔ session: activity keeps the seven-day maximum and secure cookie settings
✔ session: live passes cannot outlast inactivity or renew an expired sign-in
```

### tests/student-classroom-entry.test.mjs

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

### tests/student-module-activity-ui.test.mjs

```text
✔ module activity screen: signing in starts safely before a class or project exists (CKB-044)
✔ module activity screen: main Java editor has project tabs, sample output, Console, Run code and Save work
```

### tests/subject-module-sharing.test.mjs

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

### tests/teacher-dashboard-ui.test.mjs

```text
✔ teacher dashboard: navigation maps Students and Curriculum and exposes loading instead of fake totals
✔ teacher dashboard: avatar styles cannot override the existing classroom avatar (CKB-039)
```

### tests/teacher-dashboard.test.mjs

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

### tests/teacher-web-projects.test.mjs

```text
✔ teacher web projects: lists every personal web project for the selected student and class, and reads saved files on demand
✔ teacher web projects: only the owning teacher reads a current class member's projects; guesses and write methods are refused
✔ teacher web projects: empty lists and files are readable, repeated reads never save, and a student's save appears on refresh
✔ teacher web preview: blocks network resources before student code while preserving the doctype and console line map
✔ teacher web preview: allows eval/Function so a saved eval()-based calculator behaves the same as it does for the student
✔ teacher web preview: headless pages retain console locations and missing HTML keeps its existing warning
```

### tests/web-workspace.test.mjs

```text
✔ inlines linked CSS and JavaScript, no external loads
✔ maps document lines back to the student's file and line
✔ capture script sits on the <head> line and does not shift lines
✔ works without <head>, and warns about missing files
✔ a </script> inside JavaScript cannot break out of the inlined script
✔ no index.html gives a friendly message
✔ file names must fit the project language
```

### tests/week12-week13-modules.test.mjs

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

### tests/week15-week21-modules.test.mjs

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

### tests/weekly-java-project-ui.test.mjs

```text
✔ weekly Java editor: module shows sample output and only module source
✔ weekly Java editor: personal shows its own source, input and explicit submission
✔ weekly Java editor: alteration shows its own target and remembers completed tasks
```

## Limits and rollout

Hosted Cloudflare CPU recovery, production deployment, actual CheerpJ execution, physical
disconnected classroom Wi-Fi and other browsers are unverified in this change. The online browser
tests intentionally control runner evidence; server checks and offline Java are real.
No additional database-layer tests/migration apply because database and server code are unchanged.
Existing server integration checks run in the full suite. The extra lesson fetch occurs only when
the fetched progress version differs from cached content; no hosted CPU performance claim is made.

Older unversioned drafts are preserved as readable backups and need the current sample verified
again. The student can copy earlier changes after verification. Clearing device storage still
removes unfinished local work and local backups. Server completions are unchanged.
