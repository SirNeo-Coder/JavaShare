# Weeks 12 and 13 module verification

Verified 2026-10-21 on branch `codex/week12-week13-modules`, based on `b027634`
(`codex/module-sample-first`, PR #27). Content and tests only; no application, migration,
configuration, hosted SQL, deployment, merge or settings change.

## Required checks

- PASS — `npm run build:all`: production app and backend.
- PASS — `npm run lint`: zero errors, eight existing warnings, none in the new files.
- PASS — `sg docker -c 'npm test -- --test-reporter=spec'`: 208 passed, no failures or skips.
- PASS — focused new module tests: 27/27. All 22 baselines and 22 alterations actually compile
  and run with laptop javac, as do both personal starters and reference examples.
- PASS — production Chromium offline: both JSON uploads, first-step sample verification,
  unchanged-output feedback, task completion, next-step gating and saved step restoration.
- PASS — actual browser CheerpJ Java 8: all 22 samples and all 22 alterations.
- PASS — regression proof: removing InvalidDistanceException.java from the final Week 13
  snapshot failed the named Week 12–14 compatibility test with the expected deep-equality
  assertion. The file was restored immediately and the full 208-test suite then passed.
- PASS — `git diff --check`.

## What was exercised

The isolated schema/content check validates both uploads, globally unique ids, distinct sample
and task targets, predecessor links, exact Week 14 supporting-class compatibility, complete
sample sources, absence of blocked runtime APIs and Vehicle-free personal starters. The Java
checks use the real laptop runner, with fixed supplied input, all supporting files and the real
sample/task comparison helpers. Every alteration is applied using test-only edits; solved
replacement files are never uploaded. Unchanged sample output and failed processes cannot pass
the task target. Sources roll through every activity in Weeks 12 and 13, then run the first Week
14 ArrayList sample without replacing the supporting classes. Rubrics total 50 points each.

The real browser editor checks use rebuilt production app 3022, disposable local Supabase
accounts/classes, normal authenticated uploads and actual Run code clicks. They read saved
progress immediately after sample and task runs, prove the next activity stays locked after a
sample alone, open the next loaded sample and revisit the completed saved draft. The checks
remove their disposable local class and accounts. Screenshots were inspected at
/tmp/week12-completed.png and /tmp/week13-completed.png. Existing classroom server 3012 was left
running. Online compilation/execution uses app 3020 and a separate static runner origin 3021,
with the public runner's actual postMessage protocol, CheerpJ and Java 8. It verifies every
sample and alteration, rather than feeding invented Java output to the app.

Existing route, permission, browser-result, stale-write, preservation, project-track separation,
migration and UI regressions were rerun in the full suite. They test rules and actual routes
with local Supabase. The new browser checks test the real student screen. No new application
branch or migration was added, so there is no new application unit or migration test to write.

## Failures, skips and limits

No final gate failed and no test was skipped. The deliberately broken supporting-class fixture
failed as expected and was restored. No application/content failure was found during these runs.
The originals, printed date/session differences, renumbering and approved memory-list substitution
are documented in the two module READMEs. Week 13 real disk access is reading only, not a claimed
file-handling exercise. The original printed PDFs/DOCX files were not edited or visually revalidated.

Not checked: hosted deployment/upload, Windows, other browsers, a physical disconnected Wi-Fi
student device, or clicking through every alteration in the full editor. All alterations did run
in actual laptop Java and browser Java 8. The generation prompt/playbook, later weeks, file
persistence, thread timing and Swing remain separate work. The sample-first app and existing
history migration must be installed before uploading these JSON files. Temporary test servers
are stopped after verification; no real class was changed.

## Reproduce

Run the required build/lint/test commands above. For the browser script, use local Supabase and
production servers 3020 (browser Java), 3022 (laptop Java) and a separate static java-runtime/public
server 3021 with its CSP and HTTP Range support. Set JAVA_RUNNER_URL=http://localhost:3021/ on the
app servers; use LOCAL_JAVA_EXECUTION=true and CODESHARE_LAPTOP=true for 3022 only. The browser
script accepts CODESHARE_PLAYWRIGHT_MODULE and PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH for the installed
Playwright module and Chromium binary. It makes and cleans up disposable local accounts/classes.
Never point these tests at hosted data.

## Full automated suite

Command: `sg docker -c 'npm test -- --test-reporter=spec'`

### tests/api-router.test.mjs

- ✔ router: path parameters, query, cookies, and JSON body reach the handler (69.074302ms)
- ✔ router: middleware passes on with next(), stops by responding, and next(error) reaches the error handler (3.616277ms)
- ✔ router: cookies, 204, unknown routes, bad JSON, and size limits (22.547902ms)
- ✔ router: the larger JSON body cap is scoped to the module-upload route, not every route (14.956421ms)
- ✔ routes: register, stay signed in with the cookie, get a live pass, sign out (802.638176ms)
- ✔ routes: a chat message's live signal finishes sending before the reply (CKB-006) (740.163415ms)

### tests/browser-java-bridge.test.mjs

- ✔ browser bridge: committed JAR matches its Java source (376.620749ms)
- ✔ browser bridge: packages, inheritance, input and Unicode run together (2301.521123ms)
- ✔ browser bridge: compile error, stderr and crash after expected output all fail (3371.821335ms)
- ✔ browser bridge: combined stdout/stderr stops at 64 KB and missing classes cannot survive another run (3158.459402ms)
- ✔ browser bridge: flat browser strings become distinct source folders, including duplicate class names (1972.382467ms)

### tests/browser-java-client.test.mjs

- ✔ browser Java: refuses same origin, insecure, credentialed and path-based runner addresses (1.619843ms)
- ✔ browser Java: authenticates frame messages, sends every source/input/package, and tears down after result or timeout (4.812382ms)
- ✔ browser Java: offline uses only the existing authenticated laptop endpoint (45.241178ms)
- ✔ interactive Java: streams prompts, waits for blank and Unicode answers, and rejects stale or foreign input requests (CKB-049) (2.990163ms)
- ✔ interactive Java: the five-second execution budget is cumulative across input waits (1.642067ms)
- ✔ interactive Java: Stop preserves printed output and removes a waiting run (2.20015ms)
- ✔ interactive Java: abandoned input stops after two minutes (1.049493ms)
- ✔ interactive Java: total submitted input and streamed output stay bounded (1.499179ms)
- ✔ interactive Java: streamed output stays bounded (0.942539ms)
- ✔ interactive Java: an older runner fails clearly during independent deployments (0.875789ms)
- ✔ interactive Java: a run cancelled before startup never appends its frame (0.679782ms)

### tests/browser-java-progress.test.mjs

- ✔ online module tasks: browser results check the task target and cannot reuse a sample pass (2812.418559ms)
- ✔ online Java progress: browser evidence obeys membership, exact output, successful exit, saved version and part access (3397.97768ms)
- ✔ online Java mode: missing address fails clearly; unsafe addresses are refused; legacy server mode remains available (1982.193678ms)
- ✔ online sample first: server-owned stages reject edited samples and save verification separately from task completion (2808.462372ms)

### tests/browser-java-runtime.test.mjs

- ✔ browser runtime: only the parent starts Java; flat strings preserve duplicate filenames for the bridge (9.823834ms)
- ✔ browser runtime: invalid sources and download failure report failure instead of progress (3.693908ms)
- ✔ browser runtime: public asset policy permits CheerpJ's required nested runtime frame only (CKB-047) (0.450088ms)
- ✔ browser runtime: live input waits for authenticated matching answers and streams output before completion (CKB-049) (2.480759ms)
- ✔ browser runtime: live input cannot exceed the existing total input limit (1.565498ms)

### tests/classroom-ui.test.mjs

- ✔ module catalog: displays saved progress and distinguishes continuing from reviewing (20.495501ms)
- ✔ module catalog: the server's live lock disables opening and only the weekly pick gets its badge (3.487051ms)
- ✔ module catalog: teacher browsing never invents student progress (0.913253ms)
- ✔ workspace drawers: closed panels stay mounted but inaccessible so closing can animate (5.652725ms)
- ✔ module worksheet: alteration instructions and target stay separate from the sample (23.218381ms)
- ✔ module parts: a locked next task does not hide the current task's discussion (1.067494ms)
- ✔ module pages: inactive lessons and task editors stay mounted so navigation cannot discard drafts (8.370134ms)
- ✔ module parts: author grouping spans days and assigns discussion and exit slips exactly once (2.111257ms)
- ✔ module parts: older lessons and redacted closed lessons retain their own safe pages (1.111504ms)
- ✔ module paper: tables, analogies, notes and error guides display their actual supplied content safely (9.662917ms)
- ✔ module worksheet: named parts, unchanged samples, page controls and teacher-only sample preview coexist (14.783871ms)
- ✔ module worksheet: inter-step tables and notes retain the uploaded reading order (14.926622ms)

### tests/course-module-schema.test.mjs

- ✔ course module schema: accepts a module matching docs/course-format.md (20.446093ms)
- ✔ course module schema: rejects a step missing expectedOutput (1.280405ms)
- ✔ course module schema: rejects an unknown course (1.047929ms)
- ✔ course module schema: rejects the wrong format tag (1.07347ms)
- ✔ course module schema: rejects a step id reused by another lesson's step (CKB-007's bug class, reachable at upload) (3.540812ms)
- ✔ course module schema: rejects a step id that collides with an exit slip's id (0.790616ms)
- ✔ course module schema: rejects a java step file path that /api/execute could never run (a space) (1.010734ms)
- ✔ course module schema: rejects a java step file path over /api/execute's 160-character cap (1.982351ms)
- ✔ course module schema: rejects an unrunnable .java performance-task file path (0.808064ms)
- ✔ course module schema: rejects duplicate lesson ids before they can share an availability switch (CKB-019) (1.954044ms)
- ✔ course module schema: accepts a module with no step `part` fields, unchanged (backward compatible) (0.73449ms)
- ✔ course module schema: accepts a step with a `part` title, including one shared across two lessons (0.602649ms)
- ✔ course module schema: rejects an empty `part` title (2.382204ms)

### tests/course-modules.test.mjs

- ✔ course modules: teacher uploads, class members read, only the teacher may upload or delete (2347.803598ms)

### tests/kb-search.test.mjs

- ✔ kb:search finds the matching bug record first (100.968345ms)
- ✔ kb:search says so when nothing matches (84.291944ms)

### tests/landing-pages.test.mjs

- ✔ landing pages: class roster, a student's own module summary, and a teacher's view of a student's progress (2861.596526ms)
- ✔ class list and creation: a teacher creates classes, a student joins one, and one class's workspace never bleeds into another's (2004.455084ms)

### tests/live-classes.test.mjs

- ✔ live invitations: all live classes are offered, dismissal hides only that session, and a new activity invites again (5.704675ms)
- ✔ live invitations: refresh preserves dismissal, ending a session clears it, and a stopped presentation can invite again (3.968942ms)
- ✔ live invitations: receive-only listeners refresh on start, stop, and reconnect; cleanup removes their channels and ignores late events (1.320967ms)
- ✔ live invitations: entering or leaving the workspace waits for old channels to close before reusing their topics (135.846161ms)

### tests/module-activities.test.mjs

- ✔ module activities: legacy challenge JSON remains readable while progress follows the sample (35.386326ms)
- ✔ module activities: parts spanning lessons require every task and never require a paper liplet (1.540844ms)
- ✔ module activities: matching text cannot pass a failed process; internal whitespace still matters (0.760714ms)
- ✔ sample first: verification requires the declared result and unchanged sample, never completes an alteration (2.989487ms)
- ✔ sample first: upload accepts opt-in and declared errors, rejects sample progress-key collisions (6.212507ms)
- ✔ module activities: supporting classes survive and src aliases cannot duplicate Main.java (CKB-038) (0.614117ms)
- ✔ module tasks: explicit ids isolate completion and unlock one step at a time inside a part (2.790659ms)
- ✔ module tasks: upload rejects duplicate task ids and collisions with stored progress keys (7.664048ms)
- ✔ module tasks: real Java checks the alteration, redacts the next step and preserves rolling work (12078.86594ms)
- ✔ module activities: real multi-file Java result unlocks only that student, without teacher switches or liplets (CKB-038) (9003.169431ms)
- ✔ module activities: compile errors and a crash after the right output cannot pass (5580.119392ms)
- ✔ module activities: prior project is copied only for its owner/class and later saves never replace it (1069.675426ms)
- ✔ module activities: JSON supplies fixed program input and demo execution cannot award a pass (1454.539753ms)
- ✔ weekly Java projects: personal drafts roll forward separately, preserve submissions and never advance module progress (1708.268974ms)
- ✔ module activities: offline ignores online runner address and refuses browser progress (1024.089632ms)
- ✔ sample first: real Java verifies samples, completes alterations, restores step drafts and refuses stale tabs (10435.795806ms)
- ✔ sample first: a declared runtime error verifies only the demonstration and existing completions survive opt-in (5279.559634ms)

### tests/module-activity-migration.test.mjs

- ✔ module step migration: additive history preserves work, completion and submissions; repeats safely and permits old readers (1630.395602ms)

### tests/module-availability.test.mjs

- ✔ module availability: unknown modules and step ids cannot create progress (CKB-018) (2543.186838ms)
- ✔ module availability migration: preserves existing content and work, opens existing modules, defaults new uploads closed, and safely reruns (1496.167467ms)
- ✔ module availability: first part opens automatically, future content is withheld, and teacher switches cannot bypass student progress (1870.000337ms)
- ✔ module availability: reupload preserves work and new parts require their preceding activities (1782.863518ms)
- ✔ module availability: the same module in two classes has independent switches, and concurrent teacher edits keep both changes (1955.34151ms)
- ✔ module availability: modules without a performance task reject its switch and submission (1160.789178ms)

### tests/module-progress.test.mjs

- ✔ module progress: step checklist, exit slip, and both performance-task versions (new feature, no prior CKB) (2286.661511ms)
- ✔ module progress: two simultaneous first touches of a module don't 500 (write race) (833.195289ms)
- ✔ module progress: a module in two classrooms doesn't share one student's progress (classroom scoping) (1180.176341ms)
- ✔ module progress: two simultaneous performance-task submissions don't lose one (write race) (772.796944ms)

### tests/module-run-feedback.test.mjs

- ✔ module feedback: prominent sample verification does not claim task completion (11.612471ms)
- ✔ module feedback: distinguishes old sample, wrong output, new completion and earlier completion (4.331351ms)
- ✔ module feedback: sample-first editor shows baseline target before allowing edits (14.00992ms)

### tests/module-weekly-active.test.mjs

- ✔ module weekly active + shared project: pick, lock, and project file round-trip (2703.312873ms)

### tests/realtime.test.mjs

- ✔ realtime: an unrelated topic's subscriber never waits on another topic's pending removal (52.096317ms)
- ✔ realtime: resubscribing the same topic waits for its own pending removal to finish first (CKB-017) (101.631539ms)
- ✔ realtime: signing out clears pending cleanup so the next sign-in's subscriber never waits on the discarded client's teardown (51.656972ms)
- ✔ offline: classroom devices reach local Supabase through the laptop's address (1.150524ms)
- ✔ throttle sends at most once per interval and never drops the newest value (83.919906ms)
- ✔ channel rules: members join, outsiders are refused, only the teacher broadcasts to the class (16153.284442ms)
- ✔ browser pass cannot read tables directly (34.242476ms)

### tests/rolling-module-tasks.test.mjs

- ✔ Week 14 tasks: revised upload keeps published ids and links to the preceding Vehicle project (32.187643ms)
- ✔ Week 14 sample 1: java-2-w14-d1-s1 (1763.977265ms)
- ✔ Week 14 sample 2: java-2-w14-d1-s2 (2007.031597ms)
- ✔ Week 14 sample 3: java-2-w14-d2-s3 (2139.593728ms)
- ✔ Week 14 sample 4: java-2-w14-d2-s4 (2299.796142ms)
- ✔ Week 14 sample 5: java-2-w14-d3-s5 (2028.134891ms)
- ✔ Week 14 sample 6: java-2-w14-d3-s6 (1360.300254ms)
- ✔ Week 14 sample 7: java-2-w14-d4-s7 (808.311371ms)
- ✔ Week 14 sample 8: java-2-w14-d4-s8 (899.81853ms)
- ✔ Week 14 sample 9: java-2-w14-d4-s9 (927.851918ms)
- ✔ Week 14 sample 10: java-2-w14-d4-s10 (790.187581ms)
- ✔ Week 14 sample 11: java-2-w14-d5-s11 (1437.533924ms)
- ✔ Week 14 samples: all eleven baselines verify with real Java, including the declared error demonstration (16471.141691ms)
- ✔ Week 14 Step 1: java-2-w14-d1-s1 (1152.888704ms)
- ✔ Week 14 Step 2: java-2-w14-d1-s2 (1009.659221ms)
- ✔ Week 14 Step 3: java-2-w14-d2-s3 (1163.585209ms)
- ✔ Week 14 Step 4: java-2-w14-d2-s4 (830.409667ms)
- ✔ Week 14 Step 5: java-2-w14-d3-s5 (821.613133ms)
- ✔ Week 14 Step 6: java-2-w14-d3-s6 (774.67215ms)
- ✔ Week 14 Step 7: java-2-w14-d4-s7 (942.187535ms)
- ✔ Week 14 Step 8: java-2-w14-d4-s8 (832.380073ms)
- ✔ Week 14 Step 9: java-2-w14-d4-s9 (628.138115ms)
- ✔ Week 14 Step 10: java-2-w14-d4-s10 (667.39562ms)
- ✔ Week 14 Step 11: java-2-w14-d5-s11 (878.444824ms)
- ✔ Week 14 tasks: all eleven alterations produce their published targets with real multi-file Java (9705.228985ms)

### tests/session-activity.test.mjs

- ✔ idle browser: background updates do not renew, warns at fourteen minutes and signs out at fifteen (94.161237ms)
- ✔ idle browser: real gestures renew at most once per minute and preserve the last gesture time (16.482132ms)
- ✔ idle browser: continuing during the warning clears it and starts a fresh idle period (9.488645ms)
- ✔ idle browser: a delayed background timer cannot report an old gesture as recent activity (6.587694ms)
- ✔ idle browser: a five-hour suspension expires before the returning gesture can renew (5.306711ms)
- ✔ idle browser: another tab's renewal is shared, and sign-out clears all tabs (4.839023ms)
- ✔ idle browser: suspended timer reads a newer deadline even before its storage event arrives (5.952703ms)
- ✔ idle browser: changing accounts reloads old data without deleting the new session (3.611963ms)
- ✔ idle browser: failed renewal cannot extend expiry, and cleanup removes listeners and timers (5.143514ms)
- ✔ idle browser: wrong login password leaves the session alone; a protected 401 signs it out (7.146571ms)

### tests/session-expiry.test.mjs

- ✔ session: student expires at fifteen minutes and teacher at two hours, despite background reads (CKB-051) (116.647261ms)
- ✔ session: only explicit activity renews the role deadline, accounting for the delayed last gesture (25.200978ms)
- ✔ session: old seven-day cookies, forged cookies and invalid renewal bodies are refused (22.069136ms)
- ✔ session: activity keeps the seven-day maximum and secure cookie settings (9.895066ms)
- ✔ session: live passes cannot outlast inactivity or renew an expired sign-in (8.561051ms)

### tests/student-classroom-entry.test.mjs

- ✔ student entry: a single membership opens that classroom even with an obsolete saved choice (1.937481ms)
- ✔ student entry: multiple memberships reopen only a remembered class the student still belongs to (0.341765ms)
- ✔ student entry: no membership never opens a saved or invented classroom (0.187911ms)
- ✔ student entry: teachers, required password reset and explicit Classes navigation do not auto-enter (0.175116ms)
- ✔ student entry: remembered classrooms stay separate for different accounts on a shared browser (0.411044ms)
- ✔ student entry: unavailable browser storage still permits single-class entry and safe multi-class choice (0.351204ms)
- ✔ student chooser: a former class-home selection cannot resurrect the removed module landing page (13.160075ms)
- ✔ teacher chooser: class creation and the teacher dashboard entry remain available (2.127608ms)

### tests/student-module-activity-ui.test.mjs

- ✔ module activity screen: signing in starts safely before a class or project exists (CKB-044) (22.115832ms)
- ✔ module activity screen: main Java editor has project tabs, sample output, Console, Run code and Save work (12.973174ms)

### tests/teacher-dashboard-ui.test.mjs

- ✔ teacher dashboard: navigation maps Students and Curriculum and exposes loading instead of fake totals (25.095324ms)
- ✔ teacher dashboard: avatar styles cannot override the existing classroom avatar (CKB-039) (6.206103ms)

### tests/teacher-dashboard.test.mjs

- ✔ refuses signed-out users, students, foreign teachers, and invalid class IDs (36.797875ms)
- ✔ counts saved completion and both submissions, including closed lessons, without exposing source (100.710206ms)
- ✔ keeps the same student's progress separate between classes and excludes former members (64.09728ms)
- ✔ returns finite zero totals for empty classes and modules with no students (68.045855ms)
- ✔ rounded 100% averages do not label unfinished students or modules Finished (CKB-041) (82.778298ms)
- ✔ rounded 0% averages retain In progress when a student has completed an item (CKB-041) (75.959498ms)
- ✔ reads every progress page instead of silently truncating a full year (138.780809ms)
- ✔ a new read reflects saved results without changing student progress (97.048442ms)
- ✔ teacher dashboard (3465.077641ms)

### tests/teacher-web-projects.test.mjs

- ✔ teacher web projects: lists every personal web project for the selected student and class, and reads saved files on demand (3176.307824ms)
- ✔ teacher web projects: only the owning teacher reads a current class member's projects; guesses and write methods are refused (1654.257978ms)
- ✔ teacher web projects: empty lists and files are readable, repeated reads never save, and a student's save appears on refresh (1753.763969ms)
- ✔ teacher web preview: blocks network resources before student code while preserving the doctype and console line map (1.601747ms)
- ✔ teacher web preview: allows eval/Function so a saved eval()-based calculator behaves the same as it does for the student (0.150161ms)
- ✔ teacher web preview: headless pages retain console locations and missing HTML keeps its existing warning (0.231275ms)

### tests/web-workspace.test.mjs

- ✔ inlines linked CSS and JavaScript, no external loads (6.899677ms)
- ✔ maps document lines back to the student's file and line (1.022972ms)
- ✔ capture script sits on the <head> line and does not shift lines (0.84086ms)
- ✔ works without <head>, and warns about missing files (0.534047ms)
- ✔ a </script> inside JavaScript cannot break out of the inlined script (0.586652ms)
- ✔ no index.html gives a friendly message (0.469902ms)
- ✔ file names must fit the project language (0.65354ms)

### tests/week12-week13-modules.test.mjs

- ✔ Weeks 12–14: uploads validate, identities link, and no personal starter receives the Vehicle family (83.532944ms)
- ✔ Week 12 Step 1: java-2-w12-s1 sample and alteration (3824.241439ms)
- ✔ Week 12 Step 2: java-2-w12-s2 sample and alteration (2136.763059ms)
- ✔ Week 12 Step 3: java-2-w12-s3 sample and alteration (1524.444611ms)
- ✔ Week 12 Step 4: java-2-w12-s4 sample and alteration (1520.831833ms)
- ✔ Week 12 Step 5: java-2-w12-s5 sample and alteration (2355.077565ms)
- ✔ Week 12 Step 6: java-2-w12-s6 sample and alteration (1808.654485ms)
- ✔ Week 12 Step 7: java-2-w12-s7 sample and alteration (1699.062982ms)
- ✔ Week 12 Step 8: java-2-w12-s8 sample and alteration (1388.867103ms)
- ✔ Week 12 Step 9: java-2-w12-s9 sample and alteration (1634.541111ms)
- ✔ Week 13 Step 1: java-2-w13-s1 sample and alteration (1223.413559ms)
- ✔ Week 13 Step 2: java-2-w13-s2 sample and alteration (1317.746442ms)
- ✔ Week 13 Step 3: java-2-w13-s3 sample and alteration (1423.061089ms)
- ✔ Week 13 Step 4: java-2-w13-s4 sample and alteration (1267.162878ms)
- ✔ Week 13 Step 5: java-2-w13-s5 sample and alteration (1243.729549ms)
- ✔ Week 13 Step 6: java-2-w13-s6 sample and alteration (1506.062868ms)
- ✔ Week 13 Step 7: java-2-w13-s7 sample and alteration (1342.001992ms)
- ✔ Week 13 Step 8: java-2-w13-s8 sample and alteration (1280.292253ms)
- ✔ Week 13 Step 9: java-2-w13-s9 sample and alteration (870.660232ms)
- ✔ Week 13 Step 10: java-2-w13-s10 sample and alteration (1517.355695ms)
- ✔ Week 13 Step 11: java-2-w13-s11 sample and alteration (1274.798856ms)
- ✔ Week 13 Step 12: java-2-w13-s12 sample and alteration (1452.837554ms)
- ✔ Week 13 Step 13: java-2-w13-s13 sample and alteration (1227.857353ms)
- ✔ Week 13 completed classes run Week 14 ArrayList without replacing supporting classes (724.485702ms)
- ✔ Weeks 12–13: every sample and small alteration runs in a rolling multi-file project with real Java (35573.298793ms)
- ✔ Week 12: personal starter and reference example compile and run independently (863.566096ms)
- ✔ Week 13: personal starter and reference example compile and run independently (1105.498017ms)

### tests/weekly-java-project-ui.test.mjs

- ✔ weekly Java editor: module shows sample output and only module source (37.165555ms)
- ✔ weekly Java editor: personal shows its own source, input and explicit submission (5.068738ms)
- ✔ weekly Java editor: alteration shows its own target and remembers completed tasks (3.927149ms)

## Focused real Java checks

Command: `node --test --test-reporter=spec tests/week12-week13-modules.test.mjs`

### tests/week12-week13-modules.test.mjs

- ✔ Weeks 12–14: uploads validate, identities link, and no personal starter receives the Vehicle family (16.729689ms)
- ✔ Week 12 Step 1: java-2-w12-s1 sample and alteration (884.796551ms)
- ✔ Week 12 Step 2: java-2-w12-s2 sample and alteration (841.26377ms)
- ✔ Week 12 Step 3: java-2-w12-s3 sample and alteration (761.147592ms)
- ✔ Week 12 Step 4: java-2-w12-s4 sample and alteration (744.414683ms)
- ✔ Week 12 Step 5: java-2-w12-s5 sample and alteration (786.600974ms)
- ✔ Week 12 Step 6: java-2-w12-s6 sample and alteration (833.84462ms)
- ✔ Week 12 Step 7: java-2-w12-s7 sample and alteration (849.106175ms)
- ✔ Week 12 Step 8: java-2-w12-s8 sample and alteration (823.964735ms)
- ✔ Week 12 Step 9: java-2-w12-s9 sample and alteration (806.900245ms)
- ✔ Week 13 Step 1: java-2-w13-s1 sample and alteration (755.3833ms)
- ✔ Week 13 Step 2: java-2-w13-s2 sample and alteration (894.249262ms)
- ✔ Week 13 Step 3: java-2-w13-s3 sample and alteration (811.549921ms)
- ✔ Week 13 Step 4: java-2-w13-s4 sample and alteration (805.446043ms)
- ✔ Week 13 Step 5: java-2-w13-s5 sample and alteration (826.39102ms)
- ✔ Week 13 Step 6: java-2-w13-s6 sample and alteration (880.193266ms)
- ✔ Week 13 Step 7: java-2-w13-s7 sample and alteration (841.847377ms)
- ✔ Week 13 Step 8: java-2-w13-s8 sample and alteration (909.64154ms)
- ✔ Week 13 Step 9: java-2-w13-s9 sample and alteration (750.101496ms)
- ✔ Week 13 Step 10: java-2-w13-s10 sample and alteration (823.636092ms)
- ✔ Week 13 Step 11: java-2-w13-s11 sample and alteration (815.362314ms)
- ✔ Week 13 Step 12: java-2-w13-s12 sample and alteration (952.637776ms)
- ✔ Week 13 Step 13: java-2-w13-s13 sample and alteration (854.159837ms)
- ✔ Week 13 completed classes run Week 14 ArrayList without replacing supporting classes (457.743993ms)
- ✔ Weeks 12–13: every sample and small alteration runs in a rolling multi-file project with real Java (18714.867998ms)
- ✔ Week 12: personal starter and reference example compile and run independently (804.013845ms)
- ✔ Week 13: personal starter and reference example compile and run independently (804.024099ms)

## Actual production browser and Java 8 checks

Command: `sg docker -c 'env CODESHARE_PLAYWRIGHT_MODULE=<installed Playwright index.mjs> PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<installed Chromium> node --test --test-reporter=spec tests/week12-week13.browser.mjs'`

### tests/week12-week13.browser.mjs

- ✔ Week 12: sample first, unchanged output, saved completion and next sample (10741.958578ms)
- ✔ Week 13: sample first, unchanged output, saved completion and next sample (10147.068375ms)
- ✔ Weeks 12–13 offline: real uploads, editor sample verification, completion and saved drafts (25162.879462ms)
- ✔ Java 8 Week 12 Step 1: sample and alteration (16410.404263ms)
- ✔ Java 8 Week 12 Step 2: sample and alteration (10656.000713ms)
- ✔ Java 8 Week 12 Step 3: sample and alteration (10907.904082ms)
- ✔ Java 8 Week 12 Step 4: sample and alteration (11284.09432ms)
- ✔ Java 8 Week 12 Step 5: sample and alteration (10716.895135ms)
- ✔ Java 8 Week 12 Step 6: sample and alteration (11212.151186ms)
- ✔ Java 8 Week 12 Step 7: sample and alteration (11965.130935ms)
- ✔ Java 8 Week 12 Step 8: sample and alteration (10678.139338ms)
- ✔ Java 8 Week 12 Step 9: sample and alteration (13189.356728ms)
- ✔ Java 8 Week 13 Step 1: sample and alteration (13918.236843ms)
- ✔ Java 8 Week 13 Step 2: sample and alteration (12421.026814ms)
- ✔ Java 8 Week 13 Step 3: sample and alteration (12495.878445ms)
- ✔ Java 8 Week 13 Step 4: sample and alteration (13825.389813ms)
- ✔ Java 8 Week 13 Step 5: sample and alteration (11859.402683ms)
- ✔ Java 8 Week 13 Step 6: sample and alteration (11873.666335ms)
- ✔ Java 8 Week 13 Step 7: sample and alteration (11644.96947ms)
- ✔ Java 8 Week 13 Step 8: sample and alteration (11905.2139ms)
- ✔ Java 8 Week 13 Step 9: sample and alteration (10493.380395ms)
- ✔ Java 8 Week 13 Step 10: sample and alteration (11721.296193ms)
- ✔ Java 8 Week 13 Step 11: sample and alteration (11631.539828ms)
- ✔ Java 8 Week 13 Step 12: sample and alteration (10822.560238ms)
- ✔ Java 8 Week 13 Step 13: sample and alteration (11756.301916ms)
- ✔ Weeks 12–13 online: all samples and alterations match in actual CheerpJ Java 8 (263945.595314ms)
