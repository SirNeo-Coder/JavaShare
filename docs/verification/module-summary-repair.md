# Module summary repair verification — 2026-10-23

Documentation-only repair instructions and CKB-067. The existing migration and all
application, test and configuration files are unchanged. The teacher approved the
existing update, confirmed all four prerequisites, applied the transactional SQL
package, and reports: SQL succeeded and Module now loads. This is teacher-reported
hosted recovery, not an independent assistant browser check.

Documentation commit: e1a5a16; review: [PR #43](https://github.com/SirNeo-Coder/JavaShare/pull/43).

## Final checks

- `npm run build:all`: PASS (Next.js production build and backend TypeScript build).
- `npm run lint`: PASS, 0 errors and 8 existing warnings (CodeEditor image; page hook
  dependencies and six page images). No lint rules were changed.
- `npm test`: PASS, 325 tests, 325 passes, 0 failures, 0 skips, 0 cancelled.
- `git diff --check`: PASS.
- Byte comparison: the delivered SQL package contains the existing migration
  unchanged between `begin;` and `commit;`. This does not execute hosted SQL.

## Earlier failed attempts and resolution

Initial worktree build failed because Turbopack does not resolve the linked
node_modules outside its root. Dependencies were copied locally without installation
or manifest changes. A subsequent sandboxed build could not read TypeScript
--showConfig output; the approved child-process-capable retry passed.

The first sandboxed npm test failed for browser-java-bridge and kb-search; direct
checks identified spawnSync EPERM for node/jar/java. These are environment failures,
not ignored passes. The complete suite was rerun with approved local child-process/
Docker access and all 325 checks passed. No application fixes were made for them.

## What the checks cover

The existing module-completion integration tests call the real shared API handlers
against local Supabase with disposable teacher/student/class fixtures. They exercise
the actual summary RPC, legacy/shared class scope, browser-role denial and guarded
successful writes. Pure rule/markup checks in the suite run without a browser.
No assistant-hosted-browser check is claimed. No new unit test applies to prose-only
changes. Installing the migration is not a new code path in this branch.

The teacher's missing-function check returned false before repair; the teacher then
reports successful SQL and recovered module loading. No deliberate missing-function
mutation was run on shared databases. This is operational before/after evidence,
not a newly written automated regression. The existing RPC tests would fail against
a local database without the required function.

## Remaining limits

Teacher subsequently confirms all five function/permission readiness values true.
Both teacher/student role checks and actual completion/reload verification remain
unconfirmed; the all-true reply is recorded as SQL readiness evidence only. Hosted CPU recovery is a separate incident and is not
proven by module-list recovery. Physical Wi-Fi and an offline launcher/browser run
were not repeated: this branch changes documentation only. Existing local route/
Supabase/real Java tests ran as part of the suite.

## Named test results, grouped by file

Command: `npm test` (`node --test "tests/*.test.mjs"`). Names and marks below are
copied from the final runner output; durations are retained.

### tests/api-client.test.mjs

```text
✔ API client: HTML 503 reports the failed status without exposing the response body (58.619945ms)
✔ API client: plain-text 502 reports the failed status without exposing the response body (5.275992ms)
✔ API client: empty 500 reports the failed status without exposing the response body (0.590053ms)
✔ API client: malformed JSON 503 reports the failed status without exposing the response body (0.696828ms)
✔ API client: JSON errors preserve the server message and prerequisite details (7.373532ms)
✔ API client: successful JSON and 204 responses preserve request options and session events (3.373293ms)
✔ API client: HTML 401 expires protected sessions but leaves failed login and registration alone (2.504388ms)
✔ API client: malformed successful responses are rejected instead of returning empty data (2.855838ms)
✔ API client: network failures remain failures and are not retried (0.714803ms)
```

### tests/api-router.test.mjs

```text
✔ router: path parameters, query, cookies, and JSON body reach the handler (38.613878ms)
✔ router: middleware passes on with next(), stops by responding, and next(error) reaches the error handler (1.830935ms)
✔ router: cookies, 204, unknown routes, bad JSON, and size limits (39.383099ms)
✔ router: the larger JSON body cap is scoped to the module-upload route, not every route (8.646649ms)
✔ routes: register, stay signed in with the cookie, get a live pass, sign out (680.786174ms)
✔ routes: a chat message's live signal finishes sending before the reply (CKB-006) (819.069735ms)
```

### tests/browser-java-bridge.test.mjs

```text
✔ browser bridge: committed JAR matches its Java source (280.441868ms)
✔ browser bridge: packages, inheritance, input and Unicode run together (1925.394899ms)
✔ browser bridge: compile error, stderr and crash after expected output all fail (2605.894922ms)
✔ browser bridge: combined stdout/stderr stops at 64 KB and missing classes cannot survive another run (2288.198537ms)
✔ browser bridge: flat browser strings become distinct source folders, including duplicate class names (1576.386837ms)
```

### tests/browser-java-client.test.mjs

```text
✔ browser Java: refuses same origin, insecure, credentialed and path-based runner addresses (2.13234ms)
✔ browser Java: authenticates frame messages, sends every source/input/package, and tears down after result or timeout (9.271432ms)
✔ browser Java: offline uses only the existing authenticated laptop endpoint (43.125127ms)
✔ browser Java: startup stages authenticate messages and identify the stalled stage without extending the deadline (CKB-056) (2.763487ms)
✔ browser Java: startup feedback never contaminates Java output or accepts stages after execution starts (CKB-056) (1.047417ms)
✔ interactive Java: streams prompts, waits for blank and Unicode answers, and rejects stale or foreign input requests (CKB-049) (1.575063ms)
✔ interactive Java: the five-second execution budget is cumulative across input waits (0.828563ms)
✔ interactive Java: Stop preserves printed output and removes a waiting run (0.785396ms)
✔ interactive Java: abandoned input stops after two minutes (1.690756ms)
✔ interactive Java: total submitted input and streamed output stay bounded (0.800758ms)
✔ interactive Java: streamed output stays bounded (0.650558ms)
✔ interactive Java: an older runner fails clearly during independent deployments (0.691503ms)
✔ interactive Java: a run cancelled before startup never appends its frame (0.708495ms)
```

### tests/browser-java-progress.test.mjs

```text
✔ online module tasks: browser results check the task target and cannot reuse a sample pass (3027.359214ms)
✔ online Java progress: browser evidence obeys membership, exact output, successful exit, saved version and part access (3397.045814ms)
✔ online Java mode: missing address fails clearly; unsafe addresses are refused; legacy server mode remains available (1871.308836ms)
✔ online sample first: server-owned stages reject edited samples and save verification separately from task completion (3237.445933ms)
```

### tests/browser-java-runtime.test.mjs

```text
✔ browser runtime: only the parent starts Java; flat strings preserve duplicate filenames for the bridge (12.022902ms)
✔ browser runtime: whole-file downloads preserve binary compiler JARs without Range support (CKB-056) (2.813779ms)
✔ browser runtime: missing compiler assets report the filename and stage without starting Java (CKB-056) (3.397802ms)
✔ browser runtime: failed compiler downloads report their stage and do not compile (CKB-056) (1.723072ms)
✔ browser runtime: invalid sources and download failure report failure instead of progress (4.752241ms)
✔ browser runtime: public asset policy permits CheerpJ's required nested runtime frame only (CKB-047) (2.041767ms)
✔ browser runtime: live input waits for authenticated matching answers and streams output before completion (CKB-049) (2.39925ms)
✔ browser runtime: live input cannot exceed the existing total input limit (2.256099ms)
```

### tests/classroom-ui.test.mjs

```text
✔ module catalog: displays saved progress and distinguishes continuing from reviewing (19.075821ms)
✔ module catalog: the server's live lock disables opening and only the weekly pick gets its badge (9.862458ms)
✔ module catalog: teacher browsing never invents student progress (0.728867ms)
✔ workspace drawers: closed panels stay mounted but inaccessible so closing can animate (4.776326ms)
✔ workspace rails: one Module control and the role's Projects control share the fixed left rail (5.605057ms)
✔ module worksheet: alteration instructions and target stay separate from the sample (23.780481ms)
✔ module parts: a locked next task does not hide the current task's discussion (2.695223ms)
✔ module pages: inactive lessons and task editors stay mounted so navigation cannot discard drafts (10.758291ms)
✔ module parts: author grouping spans days and assigns discussion and exit slips exactly once (2.931201ms)
✔ module parts: older lessons and redacted closed lessons retain their own safe pages (1.181734ms)
✔ module paper: tables, analogies, notes and error guides display their actual supplied content safely (5.625525ms)
✔ module worksheet: named parts, unchanged samples, page controls and teacher-only sample preview coexist (16.141762ms)
✔ module worksheet: inter-step tables and notes retain the uploaded reading order (10.667423ms)
```

### tests/course-module-schema.test.mjs

```text
✔ course module schema: accepts a module matching docs/course-format.md (18.222498ms)
✔ course module schema: rejects a step missing expectedOutput (1.703115ms)
✔ course module schema: rejects an unknown course (1.047562ms)
✔ course module schema: rejects the wrong format tag (0.816457ms)
✔ course module schema: rejects a step id reused by another lesson's step (CKB-007's bug class, reachable at upload) (4.145852ms)
✔ course module schema: rejects a step id that collides with an exit slip's id (1.202859ms)
✔ course module schema: rejects a java step file path that /api/execute could never run (a space) (0.916931ms)
✔ course module schema: rejects a java step file path over /api/execute's 160-character cap (1.949617ms)
✔ course module schema: rejects an unrunnable .java performance-task file path (1.648196ms)
✔ course module schema: rejects duplicate lesson ids before they can share an availability switch (CKB-019) (1.005799ms)
✔ course module schema: accepts a module with no step `part` fields, unchanged (backward compatible) (1.440946ms)
✔ course module schema: accepts a step with a `part` title, including one shared across two lessons (3.405148ms)
✔ course module schema: rejects an empty `part` title (2.083296ms)
```

### tests/course-modules.test.mjs

```text
✔ course modules: teacher uploads, class members read, only the teacher may upload or delete (2270.471386ms)
```

### tests/java-run-progress.test.mjs

```text
✔ Java progress: idle, finished and failed runs leave no loading indicator (15.891413ms)
✔ Java progress: saving, starting and checking are visible accessible status messages (7.587482ms)
✔ Java progress: waiting for an answer replaces the working message (0.547622ms)
```

### tests/java-suggestions.test.mjs

```text
✔ Java suggestions: keywords, standard names and print statements match typed prefixes (6.405857ms)
✔ Java suggestions: current-file names are unique and ignore comments and string literals (4.876772ms)
✔ Java suggestions: comments, escaped strings, characters and text blocks never open suggestions (2.344339ms)
✔ Java suggestions: empty, short, selected, numeric and unsupported member prefixes stay quiet (0.967881ms)
✔ Java suggestions: insertion replaces the full word and preserves surrounding code (0.417451ms)
✔ Java suggestions: print snippets place the caret inside the parentheses (0.272933ms)
✔ Java suggestions: the main statement keeps existing indentation and puts the caret in its body (0.165077ms)
```

### tests/kb-search.test.mjs

```text
✔ kb:search finds the matching bug record first (141.375678ms)
✔ kb:search says so when nothing matches (93.002197ms)
```

### tests/landing-pages.test.mjs

```text
✔ landing pages: class roster, a student's own module summary, and a teacher's view of a student's progress (2605.885087ms)
✔ class list and creation: a teacher creates classes, a student joins one, and one class's workspace never bleeds into another's (1907.017142ms)
```

### tests/live-classes.test.mjs

```text
✔ live invitations: all live classes are offered, dismissal hides only that session, and a new activity invites again (2.60914ms)
✔ live invitations: refresh preserves dismissal, ending a session clears it, and a stopped presentation can invite again (0.853611ms)
✔ live invitations: receive-only listeners refresh on start, stop, and reconnect; cleanup removes their channels and ignores late events (2.205751ms)
✔ live invitations: entering or leaving the workspace waits for old channels to close before reusing their topics (79.981297ms)
```

### tests/module-activities.test.mjs

```text
✔ module activities: legacy challenge JSON remains readable while progress follows the sample (17.670519ms)
✔ module activities: parts spanning lessons require every task and never require a paper liplet (0.74851ms)
✔ module activities: matching text cannot pass a failed process; internal whitespace still matters (0.418046ms)
✔ sample first: verification requires the declared result and unchanged sample, never completes an alteration (0.632876ms)
✔ sample first: upload accepts opt-in and declared errors, rejects sample progress-key collisions (2.278043ms)
✔ module activities: supporting classes survive and src aliases cannot duplicate Main.java (CKB-038) (0.642258ms)
✔ module tasks: explicit ids isolate completion and unlock one step at a time inside a part (2.190788ms)
✔ module tasks: upload rejects duplicate task ids and collisions with stored progress keys (5.854571ms)
✔ module tasks: real Java checks the alteration, redacts the next step and preserves rolling work (13333.559838ms)
✔ module activities: real multi-file Java result unlocks only that student, without teacher switches or liplets (CKB-038) (8978.634406ms)
✔ module activities: compile errors and a crash after the right output cannot pass (6372.57639ms)
✔ module activities: prior project is copied only for its owner/class and later saves never replace it (1180.984389ms)
✔ module activities: JSON supplies fixed program input and demo execution cannot award a pass (1507.218421ms)
✔ weekly Java projects: personal drafts roll forward separately, preserve submissions and never advance module progress (1930.591685ms)
✔ module activities: offline ignores online runner address and refuses browser progress (747.511844ms)
✔ sample first: real Java verifies samples, completes alterations, restores step drafts and refuses stale tabs (9351.354585ms)
✔ sample first: a declared runtime error verifies only the demonstration and existing completions survive opt-in (4769.108169ms)
```

### tests/module-activity-migration.test.mjs

```text
✔ module step migration: additive history preserves work, completion and submissions; repeats safely and permits old readers (1382.869048ms)
```

### tests/module-availability.test.mjs

```text
✔ module availability: unknown modules and step ids cannot create progress (CKB-018) (2395.671601ms)
✔ module availability migration: preserves existing content and work, opens existing modules, defaults new uploads closed, and safely reruns (1227.202818ms)
✔ module availability: first part opens automatically, future content is withheld, and teacher switches cannot bypass student progress (1985.809768ms)
✔ module availability: reupload preserves work and new parts require their preceding activities (1857.63214ms)
✔ module availability: the same module in two classes has independent switches, and concurrent teacher edits keep both changes (2060.722736ms)
✔ module availability: modules without a performance task reject its switch and submission (1697.431066ms)
```

### tests/module-catalog-order.test.mjs

```text
✔ module catalog order: unfinished weeks run from 12 to 21 despite active and locked flags (2.466687ms)
✔ module catalog order: finishing Week 12 puts Week 13 first and Week 12 last (0.336582ms)
✔ module catalog order: only complete modules move below all unfinished weeks (0.296558ms)
✔ module catalog order: equal weeks keep their existing order and an empty catalog stays empty (0.369176ms)
```

### tests/module-completion.test.mjs

```text
▶ completion-only modules: read-only preparation, small summaries and guarded successful checkpoints
✔ summaries contain only required metadata, keep legacy scope and refuse browser roles (440.408344ms)
✔ opening a step prepares local files without saving project code or draft history (270.091739ms)
✔ failed output, sample-only evidence, changed samples and direct flags cannot save code or complete (565.202105ms)
✔ a successful checkpoint saves exact files, sample verification and completion together once (331.815275ms)
✔ legacy samples and intentional-error verification keep distinct completion rules (587.362125ms)
✔ module updates, stale projects and live restrictions keep existing successful work intact (300.852473ms)
✔ completion-only modules: read-only preparation, small summaries and guarded successful checkpoints (4549.642459ms)
```

### tests/module-device-store.test.mjs

```text
✔ module device cache keys isolate student, classroom, module, and activity (5.656043ms)
✔ module content cache expires so teacher updates are fetched (0.460122ms)
```

### tests/module-prerequisites.test.mjs

```text
✔ module prerequisites: oldest unfinished ancestor blocks later weeks even when the immediate predecessor passed (3.733106ms)
✔ module prerequisites: sample verification, failed tasks and superseded ids cannot unlock a later module (0.741256ms)
✔ module prerequisites: missing and cyclic links give teacher repair messages without looping (0.242403ms)
✔ module prerequisites: live class permits the weekly chain but still blocks unrelated modules (0.653306ms)
✔ module prerequisites: banner names the earliest week and offers Continue; missing modules offer no dead button (15.091825ms)
▶ module prerequisites: real routes reject every later-module entry, isolate students/classes and preserve saved work
✔ blocks content before prerequisites (44.481145ms)
✔ blocks progress before prerequisites (35.949582ms)
✔ blocks module project before prerequisites (31.957165ms)
✔ blocks paper record before prerequisites (104.951869ms)
✔ blocks activity before prerequisites (89.383422ms)
✔ blocks laptop run before prerequisites (47.495804ms)
✔ blocks browser result before prerequisites (31.448509ms)
✔ blocks personal open before prerequisites (24.859423ms)
✔ blocks personal save before prerequisites (30.744518ms)
✔ blocks submission before prerequisites (39.203424ms)
✔ live class catch-up, ordered unlock, teacher preview and student/class isolation (847.880208ms)
✔ module prerequisites: real routes reject every later-module entry, isolate students/classes and preserve saved work (3782.624206ms)
```

### tests/module-progress.test.mjs

```text
✔ module progress: step checklist, exit slip, and both performance-task versions (new feature, no prior CKB) (1977.83141ms)
✔ module progress: two simultaneous first touches of a module don't 500 (write race) (696.589795ms)
✔ module progress: a module in two classrooms doesn't share one student's progress (classroom scoping) (1070.6786ms)
✔ module progress: two simultaneous performance-task submissions don't lose one (write race) (877.118318ms)
```

### tests/module-resume.test.mjs

```text
✔ module resume: two completed Monday steps reopen at Day 2 Step 3 after saved progress is reloaded (1.492991ms)
✔ module resume: verifying a sample, failing a task or legacy passes cannot skip an unfinished alteration (0.432094ms)
✔ module resume: closed lessons and locked steps are excluded; completed modules have no unfinished step (1.409366ms)
✔ module exercises: revised requirements get separate identities and retain unsolved samples (2.966157ms)
```

### tests/module-run-feedback.test.mjs

```text
✔ module feedback: prominent sample verification does not claim task completion (10.080159ms)
✔ module feedback: distinguishes old sample, wrong output, new completion and earlier completion (2.197705ms)
✔ module feedback: sample-first editor shows baseline target before allowing edits (8.04917ms)
```

### tests/module-weekly-active.test.mjs

```text
✔ module weekly active + shared project: pick, lock, and project file round-trip (2711.220701ms)
```

### tests/realtime.test.mjs

```text
✔ realtime: an unrelated topic's subscriber never waits on another topic's pending removal (53.348418ms)
✔ realtime: resubscribing the same topic waits for its own pending removal to finish first (CKB-017) (100.819146ms)
✔ realtime: signing out clears pending cleanup so the next sign-in's subscriber never waits on the discarded client's teardown (51.793406ms)
✔ offline: classroom devices reach local Supabase through the laptop's address (0.636546ms)
✔ throttle sends at most once per interval and never drops the newest value (82.490584ms)
✔ channel rules: members join, outsiders are refused, only the teacher broadcasts to the class (15871.043222ms)
✔ browser pass cannot read tables directly (10.729216ms)
```

### tests/rolling-module-tasks.test.mjs

```text
✔ Week 14 tasks: revised upload keeps published ids and links to the preceding Vehicle project (30.865582ms)
▶ Week 14 samples: all eleven baselines verify with real Java, including the declared error demonstration
✔ Week 14 sample 1: java-2-w14-d1-s1 (1808.956185ms)
✔ Week 14 sample 2: java-2-w14-d1-s2 (2126.603428ms)
✔ Week 14 sample 3: java-2-w14-d2-s3 (1743.762012ms)
✔ Week 14 sample 4: java-2-w14-d2-s4 (2679.109337ms)
✔ Week 14 sample 5: java-2-w14-d3-s5 (1952.461105ms)
✔ Week 14 sample 6: java-2-w14-d3-s6 (2086.004724ms)
✔ Week 14 sample 7: java-2-w14-d4-s7 (1111.746699ms)
✔ Week 14 sample 8: java-2-w14-d4-s8 (1096.77714ms)
✔ Week 14 sample 9: java-2-w14-d4-s9 (808.337832ms)
✔ Week 14 sample 10: java-2-w14-d4-s10 (893.070209ms)
✔ Week 14 sample 11: java-2-w14-d5-s11 (901.081268ms)
✔ Week 14 samples: all eleven baselines verify with real Java, including the declared error demonstration (17214.918973ms)
▶ Week 14 tasks: all eleven alterations produce their published targets with real multi-file Java
✔ Week 14 Step 1: java-2-w14-d1-s1 (865.463874ms)
✔ Week 14 Step 2: java-2-w14-d1-s2 (809.203933ms)
✔ Week 14 Step 3: java-2-w14-d2-s3 (811.826263ms)
✔ Week 14 Step 4: java-2-w14-d2-s4 (828.185526ms)
✔ Week 14 Step 5: java-2-w14-d3-s5 (755.671634ms)
✔ Week 14 Step 6: java-2-w14-d3-s6 (758.230212ms)
✔ Week 14 Step 7: java-2-w14-d4-s7 (757.961461ms)
✔ Week 14 Step 8: java-2-w14-d4-s8 (1047.110921ms)
✔ Week 14 Step 9: java-2-w14-d4-s9 (750.272686ms)
✔ Week 14 Step 10: java-2-w14-d4-s10 (961.700866ms)
✔ Week 14 Step 11: java-2-w14-d5-s11 (1276.851865ms)
✔ Week 14 tasks: all eleven alterations produce their published targets with real multi-file Java (9625.749085ms)
```

### tests/session-activity.test.mjs

```text
✔ idle browser: background updates do not renew, warns at fourteen minutes and signs out at fifteen (106.713319ms)
✔ idle browser: real gestures renew at most once per minute and preserve the last gesture time (16.261835ms)
✔ idle browser: continuing during the warning clears it and starts a fresh idle period (8.306604ms)
✔ idle browser: a delayed background timer cannot report an old gesture as recent activity (10.63931ms)
✔ idle browser: a five-hour suspension expires before the returning gesture can renew (2.514938ms)
✔ idle browser: another tab's renewal is shared, and sign-out clears all tabs (10.65327ms)
✔ idle browser: suspended timer reads a newer deadline even before its storage event arrives (10.514566ms)
✔ idle browser: changing accounts reloads old data without deleting the new session (1.524804ms)
✔ idle browser: failed renewal cannot extend expiry, and cleanup removes listeners and timers (8.407939ms)
✔ idle browser: wrong login password leaves the session alone; a protected 401 signs it out (6.977187ms)
```

### tests/session-expiry.test.mjs

```text
✔ session: student expires at fifteen minutes and teacher at two hours, despite background reads (CKB-051) (168.828384ms)
✔ session: only explicit activity renews the role deadline, accounting for the delayed last gesture (39.827297ms)
✔ session: old seven-day cookies, forged cookies and invalid renewal bodies are refused (37.160032ms)
✔ session: activity keeps the seven-day maximum and secure cookie settings (11.824803ms)
✔ session: live passes cannot outlast inactivity or renew an expired sign-in (10.954632ms)
```

### tests/student-classroom-entry.test.mjs

```text
✔ student entry: a single membership opens that classroom even with an obsolete saved choice (5.397251ms)
✔ student entry: multiple memberships reopen only a remembered class the student still belongs to (0.369465ms)
✔ student entry: no membership never opens a saved or invented classroom (0.356455ms)
✔ student entry: teachers, required password reset and explicit Classes navigation do not auto-enter (0.198975ms)
✔ student entry: remembered classrooms stay separate for different accounts on a shared browser (0.425643ms)
✔ student entry: unavailable browser storage still permits single-class entry and safe multi-class choice (0.416827ms)
✔ student chooser: a former class-home selection cannot resurrect the removed module landing page (14.311832ms)
✔ teacher chooser: class creation and the teacher dashboard entry remain available (2.382329ms)
```

### tests/student-module-activity-ui.test.mjs

```text
✔ module activity screen: signing in starts safely before a class or project exists (CKB-044) (23.298309ms)
✔ module activity screen: main Java editor has project tabs, sample output, Console, Run code and Save work (17.124367ms)
```

### tests/subject-module-sharing.test.mjs

```text
▶ subject modules: one subject per class, one upload per teacher/subject, separate student work
✔ class creation requires exactly Java or Net MVC and an assigned class cannot switch subjects (508.520286ms)
✔ upload once reaches same-subject classes, excludes the other subject and another teacher, and includes later classes (615.006363ms)
✔ members read only their classes; students and another teacher cannot choose subjects, share, upload or delete (116.265944ms)
✔ shared corrections refresh list, reader, student summary and dashboard without mixing progress, drafts or submissions (555.078217ms)
✔ shared-only prerequisites unlock per class and never reuse another class's completion (344.136454ms)
✔ old uploads stay readable before subject selection and remain backed up; conflicting sharing needs the selected current version (476.701704ms)
✔ shared deletion removes access and weekly picks across that subject while preserving backups, student work and the other subject (277.749515ms)
✔ subject modules: one subject per class, one upload per teacher/subject, separate student work (4726.369722ms)
✔ subject library migration: preserves old uploads and student work, repeats safely, and restricts subjects and direct access (2268.019448ms)
```

### tests/teacher-dashboard-ui.test.mjs

```text
✔ teacher dashboard: navigation maps Students and Curriculum and exposes loading instead of fake totals (19.933059ms)
✔ teacher dashboard: avatar styles cannot override the existing classroom avatar (CKB-039) (4.944054ms)
```

### tests/teacher-dashboard.test.mjs

```text
▶ teacher dashboard
✔ refuses signed-out users, students, foreign teachers, and invalid class IDs (28.317708ms)
✔ counts saved completion and both submissions, including closed lessons, without exposing source (116.35578ms)
✔ keeps the same student's progress separate between classes and excludes former members (117.500163ms)
✔ returns finite zero totals for empty classes and modules with no students (142.477857ms)
✔ rounded 100% averages do not label unfinished students or modules Finished (CKB-041) (116.264853ms)
✔ rounded 0% averages retain In progress when a student has completed an item (CKB-041) (113.84829ms)
✔ reads every progress page instead of silently truncating a full year (155.401857ms)
✔ a new read reflects saved results without changing student progress (182.961183ms)
✔ teacher dashboard (4584.241628ms)
```

### tests/teacher-web-projects.test.mjs

```text
✔ teacher web projects: lists every personal web project for the selected student and class, and reads saved files on demand (3852.61734ms)
✔ teacher web projects: only the owning teacher reads a current class member's projects; guesses and write methods are refused (2622.053885ms)
✔ teacher web projects: empty lists and files are readable, repeated reads never save, and a student's save appears on refresh (2025.67233ms)
✔ teacher web preview: blocks network resources before student code while preserving the doctype and console line map (2.146958ms)
✔ teacher web preview: allows eval/Function so a saved eval()-based calculator behaves the same as it does for the student (0.325565ms)
✔ teacher web preview: headless pages retain console locations and missing HTML keeps its existing warning (0.686601ms)
```

### tests/web-workspace.test.mjs

```text
✔ inlines linked CSS and JavaScript, no external loads (4.351414ms)
✔ maps document lines back to the student's file and line (0.834049ms)
✔ capture script sits on the <head> line and does not shift lines (0.432856ms)
✔ works without <head>, and warns about missing files (0.389962ms)
✔ a </script> inside JavaScript cannot break out of the inlined script (0.38891ms)
✔ no index.html gives a friendly message (0.309977ms)
✔ file names must fit the project language (0.748348ms)
```

### tests/week12-week13-modules.test.mjs

```text
✔ Weeks 12–14: uploads validate, identities link, and no personal starter receives the Vehicle family (46.920904ms)
▶ Weeks 12–13: every sample and small alteration runs in a rolling multi-file project with real Java
✔ Week 12 Step 1: java-2-w12-s1 sample and alteration (4200.359526ms)
✔ Week 12 Step 2: java-2-w12-s2 sample and alteration (3126.081168ms)
✔ Week 12 Step 3: java-2-w12-s3 sample and alteration (2630.618731ms)
✔ Week 12 Step 4: java-2-w12-s4 sample and alteration (1612.483725ms)
✔ Week 12 Step 5: java-2-w12-s5 sample and alteration (1525.356567ms)
✔ Week 12 Step 6: java-2-w12-s6 sample and alteration (1482.979373ms)
✔ Week 12 Step 7: java-2-w12-s7 sample and alteration (1593.966627ms)
✔ Week 12 Step 8: java-2-w12-s8 sample and alteration (1314.219684ms)
✔ Week 12 Step 9: java-2-w12-s9 sample and alteration (1426.180528ms)
✔ Week 13 Step 1: java-2-w13-s1 sample and alteration (1662.701045ms)
✔ Week 13 Step 2: java-2-w13-s2 sample and alteration (2054.315637ms)
✔ Week 13 Step 3: java-2-w13-s3 sample and alteration (1338.619543ms)
✔ Week 13 Step 4: java-2-w13-s4 sample and alteration (1112.142249ms)
✔ Week 13 Step 5: java-2-w13-s5 sample and alteration (1621.030529ms)
✔ Week 13 Step 6: java-2-w13-s6 sample and alteration (1154.524819ms)
✔ Week 13 Step 7: java-2-w13-s7 sample and alteration (899.334693ms)
✔ Week 13 Step 8: java-2-w13-s8 sample and alteration (1118.436328ms)
✔ Week 13 Step 9: java-2-w13-s9 sample and alteration (1077.75419ms)
✔ Week 13 Step 10: java-2-w13-s10 sample and alteration (947.028705ms)
✔ Week 13 Step 11: java-2-w13-s11 sample and alteration (1020.519718ms)
✔ Week 13 Step 12: java-2-w13-s12 sample and alteration (953.429215ms)
✔ Week 13 Step 13: java-2-w13-s13 sample and alteration (1049.645897ms)
✔ Week 13 completed classes run Week 14 ArrayList without replacing supporting classes (456.967826ms)
✔ Weeks 12–13: every sample and small alteration runs in a rolling multi-file project with real Java (35385.251208ms)
✔ Week 12: personal starter and reference example compile and run independently (844.094068ms)
✔ Week 13: personal starter and reference example compile and run independently (870.709584ms)
```

### tests/week15-week21-modules.test.mjs

```text
✔ Weeks 12–21: actual curriculum links resolve and current tasks control ordered access (17.014531ms)
✔ Week 15: upload accepts additions and every original lesson value survives (47.994145ms)
✔ Week 16: upload accepts additions and every original lesson value survives (5.144104ms)
✔ Week 17: upload accepts additions and every original lesson value survives (11.300208ms)
✔ Week 18: upload accepts additions and every original lesson value survives (5.943428ms)
✔ Week 19: upload accepts additions and every original lesson value survives (24.074717ms)
✔ Week 20: upload accepts additions and every original lesson value survives (2.20554ms)
✔ Week 21: upload accepts additions and every original lesson value survives (3.193948ms)
✔ Weeks 15–21: old samples and headless messages cannot pass new tasks or bypass their sample gate (10.824828ms)
▶ Week 15: original disk samples and each independent alteration match real Java output
✔ Week 15 Step 1: disk sample and alteration (4544.238973ms)
✔ Week 15 Step 2: disk sample and alteration (3913.546002ms)
✔ Week 15 Step 3: disk sample and alteration (2088.710832ms)
✔ Week 15 Step 4: disk sample and alteration (1723.241516ms)
✔ Week 15 Step 5: disk sample and alteration (1756.955711ms)
✔ Week 15 Step 6: disk sample and alteration (1548.890132ms)
✔ Week 15 Step 7: disk sample and alteration (1546.965669ms)
✔ Week 15 Step 8: disk sample and alteration (1446.494947ms)
✔ Week 15 Step 9: disk sample and alteration (1937.046788ms)
✔ Week 15 Step 10: disk sample and alteration (2276.385087ms)
✔ Week 15: original disk samples and each independent alteration match real Java output (22811.612071ms)
▶ Week 16: complete samples and meaningful alterations run through the classroom laptop runner
✔ Week 16 Step 1: sample and alteration (2267.701434ms)
✔ Week 16 Step 2: sample and alteration (2397.940561ms)
✔ Week 16 Step 3: sample and alteration (1921.558915ms)
✔ Week 16 Step 4: sample and alteration (1565.022221ms)
✔ Week 16 Step 5: sample and alteration (1935.980508ms)
✔ Week 16 Step 6: sample and alteration (2419.697398ms)
✔ Week 16 Step 7: sample and alteration (3644.788447ms)
✔ Week 16: complete samples and meaningful alterations run through the classroom laptop runner (16154.354298ms)
▶ Week 17: complete samples and meaningful alterations run through the classroom laptop runner
✔ Week 17 Step 1: sample and alteration (1268.425855ms)
✔ Week 17 Step 2: sample and alteration (2320.834762ms)
✔ Week 17 Step 3: sample and alteration (2243.536675ms)
✔ Week 17 Step 4: sample and alteration (1200.868316ms)
✔ Week 17 Step 5: sample and alteration (2274.575779ms)
✔ Week 17 Step 6: sample and alteration (1124.514838ms)
✔ Week 17: complete samples and meaningful alterations run through the classroom laptop runner (10434.10946ms)
▶ Week 18: complete samples and meaningful alterations run through the classroom laptop runner
✔ Week 18 Step 1: sample and alteration (1269.449023ms)
✔ Week 18 Step 2: sample and alteration (1293.764772ms)
✔ Week 18 Step 3: sample and alteration (1290.669101ms)
✔ Week 18 Step 4: sample and alteration (1252.974107ms)
✔ Week 18 Step 5: sample and alteration (3330.366559ms)
✔ Week 18: complete samples and meaningful alterations run through the classroom laptop runner (8438.376876ms)
▶ Week 19: complete samples and meaningful alterations run through the classroom laptop runner
✔ Week 19 Step 1: sample and alteration (2318.158017ms)
✔ Week 19 Step 2: sample and alteration (1357.368152ms)
✔ Week 19 Step 3: sample and alteration (2495.91111ms)
✔ Week 19 Step 4: sample and alteration (2425.820722ms)
✔ Week 19: complete samples and meaningful alterations run through the classroom laptop runner (8598.346869ms)
▶ Week 21: complete samples and meaningful alterations run through the classroom laptop runner
✔ Week 21 Step 1: sample and alteration (2412.681342ms)
✔ Week 21: complete samples and meaningful alterations run through the classroom laptop runner (2413.066937ms)
✔ Week 15: classroom file access stays blocked while desktop exercises remain explicitly separate (0.637022ms)
```

### tests/weekly-java-project-ui.test.mjs

```text
✔ weekly Java editor: module shows sample output and only module source (37.836584ms)
✔ weekly Java editor: personal shows its own source, input and explicit submission (11.970847ms)
✔ weekly Java editor: alteration shows its own target and remembers completed tasks (3.228782ms)
```

### Runner totals

```text
ℹ tests 325
ℹ suites 0
ℹ pass 325
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 78723.193152
```
