# Rolling module tasks verification

Date: 2026-10-20. Branch: `codex/rolling-module-tasks`.

## Final checks

- `npm run build:all`: passed frontend production build and backend TypeScript.
- `npm run lint`: zero errors, eight existing warnings.
- `sg docker -c 'npm test -- --test-reporter=spec'`: 160 passed, zero failed, zero skipped.
- `git diff --check`: passed.
- All eleven Week 14 reference alterations compiled and ran through the actual laptop runner,
  matching the JSON task output. No solved code is included in student task files.

Initial full-suite run: 159 passed, one failed. An older screen fixture used a legacy completion
key and was incorrectly labelled as a new task. The label now uses the explicit new task-key
namespace. Final suite above supersedes that run.

## Regression proof

Temporarily returned the sample from `activityTask`, removing task-target selection.
`node --test --test-isolation=none --test-reporter=spec --test-name-pattern='module tasks: explicit ids' tests/module-activities.test.mjs`
reported one failed test, Capacity: 20 instead of Capacity: 25. Restoring the fix reported the
same test passing. Both logs were inspected; the production helper is restored.

## Test levels

Unit checks exercise upload identity collisions, sample/task selection, exact output and
per-step access. Rendered-markup checks exercise worksheet/editor labels and partially open
parts. Local Supabase route tests exercise authenticated laptop execution, browser evidence,
redaction, stale writes, class/student scope, saved projects and old/new completion separation.
Week 14 tests use real multi-file javac execution for every alteration.

Browser results remain approved practice evidence, not grading. No internet-disconnected
Wi-Fi-device, Windows, hosted deployment or actual student account test. File persistence,
Swing window checks and the remaining weekly documents were not implemented.

## Document checks

The original eight PDF pages are retained; three practice pages are appended (11 total), all
8.5 by 13 inches. The lesson plan preserves its original school grid and adds one appendix
(9 pages total). Both final artifacts were rendered to images and inspected. Instructions
and target outputs derive from the revised JSON. Original supplied files were not overwritten.

## Real browser checks

Production app against disposable local Supabase accounts/classes only:

- Online app port 3010, public runner port 3011: actual CheerpJ/Java 8 ran Week 14
  Step 1. Unchanged sample output failed the alteration. Changing the removal index and
  friendly error message produced the exact target and showed Completed. CheerpJ attribution
  remained visible.
- Step 2 was inaccessible before that pass. It then displayed separate Sample code, Sample
  output, Your task and Expected task output. Opening its main editor preserved the previous
  altered Main.java. The student then used the second sample to make the Lola Nena change.
- Saved work reopened in a separate offline production app on port 3012. Actual laptop javac
  ran the saved LinkedList task, returned its exact target and showed Completed. No CheerpJ
  image was present. The offline environment deliberately also had an online runner URL set.
- A local database read confirmed only the two new task completion keys, the saved Lola Nena
  Main.java and no personal submission. Automated route tests separately cover previous-week
  copying, class/student boundaries and preservation of submissions.
- The temporary static test server initially lacked HTTP byte-range support required by the
  Java runtime. Adding range responses to that temporary server allowed the real browser
  check; no product runtime or hosted setting was changed.
- `sg docker -c 'npm run classroom:offline -- --check'`: offline configuration ready.

Screenshots were inspected through the in-app browser. This was local browser/runtime testing,
not a hosted rollout or a physically disconnected classroom Wi-Fi test.

## Complete runner names grouped by file

Command for every file below: `sg docker -c 'npm test -- --test-reporter=spec'`.

### tests/api-router.test.mjs

- ✔ router: path parameters, query, cookies, and JSON body reach the handler (38.70808ms)
- ✔ router: middleware passes on with next(), stops by responding, and next(error) reaches the error handler (2.332868ms)
- ✔ router: cookies, 204, unknown routes, bad JSON, and size limits (19.750165ms)
- ✔ router: the larger JSON body cap is scoped to the module-upload route, not every route (10.586319ms)
- ✔ routes: register, stay signed in with the cookie, get a live pass, sign out (504.41176ms)
- ✔ routes: a chat message's live signal finishes sending before the reply (CKB-006) (719.440276ms)

### tests/browser-java-bridge.test.mjs

- ✔ browser bridge: committed JAR matches its Java source (258.76162ms)
- ✔ browser bridge: packages, inheritance, input and Unicode run together (1343.636181ms)
- ✔ browser bridge: compile error, stderr and crash after expected output all fail (2426.784593ms)
- ✔ browser bridge: combined stdout/stderr stops at 64 KB and missing classes cannot survive another run (2142.134255ms)
- ✔ browser bridge: flat browser strings become distinct source folders, including duplicate class names (1257.859444ms)

### tests/browser-java-client.test.mjs

- ✔ browser Java: refuses same origin, insecure, credentialed and path-based runner addresses (2.138346ms)
- ✔ browser Java: authenticates frame messages, sends every source/input/package, and tears down after result or timeout (4.638081ms)
- ✔ browser Java: offline uses only the existing authenticated laptop endpoint (34.309812ms)
- ✔ interactive Java: streams prompts, waits for blank and Unicode answers, and rejects stale or foreign input requests (CKB-049) (3.155029ms)
- ✔ interactive Java: the five-second execution budget is cumulative across input waits (7.355754ms)
- ✔ interactive Java: Stop preserves printed output and removes a waiting run (1.176379ms)
- ✔ interactive Java: abandoned input stops after two minutes (9.402994ms)
- ✔ interactive Java: total submitted input and streamed output stay bounded (1.075018ms)
- ✔ interactive Java: streamed output stays bounded (0.759135ms)
- ✔ interactive Java: an older runner fails clearly during independent deployments (3.202052ms)
- ✔ interactive Java: a run cancelled before startup never appends its frame (0.747789ms)

### tests/browser-java-progress.test.mjs

- ✔ online module tasks: browser results check the task target and cannot reuse a sample pass (2778.410659ms)
- ✔ online Java progress: browser evidence obeys membership, exact output, successful exit, saved version and part access (2010.951251ms)
- ✔ online Java mode: missing address fails clearly; unsafe addresses are refused; legacy server mode remains available (976.207221ms)

### tests/browser-java-runtime.test.mjs

- ✔ browser runtime: only the parent starts Java; flat strings preserve duplicate filenames for the bridge (5.760048ms)
- ✔ browser runtime: invalid sources and download failure report failure instead of progress (3.220195ms)
- ✔ browser runtime: public asset policy permits CheerpJ's required nested runtime frame only (CKB-047) (0.329429ms)
- ✔ browser runtime: live input waits for authenticated matching answers and streams output before completion (CKB-049) (2.123085ms)
- ✔ browser runtime: live input cannot exceed the existing total input limit (2.568908ms)

### tests/classroom-ui.test.mjs

- ✔ module catalog: displays saved progress and distinguishes continuing from reviewing (13.108328ms)
- ✔ module catalog: the server's live lock disables opening and only the weekly pick gets its badge (2.69882ms)
- ✔ module catalog: teacher browsing never invents student progress (0.554564ms)
- ✔ workspace drawers: closed panels stay mounted but inaccessible so closing can animate (3.031316ms)
- ✔ module worksheet: alteration instructions and target stay separate from the sample (10.014811ms)
- ✔ module parts: a locked next task does not hide the current task's discussion (0.505951ms)
- ✔ module pages: inactive lessons and task editors stay mounted so navigation cannot discard drafts (5.55027ms)
- ✔ module parts: author grouping spans days and assigns discussion and exit slips exactly once (1.828085ms)
- ✔ module parts: older lessons and redacted closed lessons retain their own safe pages (0.649289ms)
- ✔ module paper: tables, analogies, notes and error guides display their actual supplied content safely (3.435808ms)
- ✔ module worksheet: named parts, unchanged samples, page controls and teacher-only sample preview coexist (5.91054ms)
- ✔ module worksheet: inter-step tables and notes retain the uploaded reading order (14.539095ms)

### tests/course-module-schema.test.mjs

- ✔ course module schema: accepts a module matching docs/course-format.md (21.173786ms)
- ✔ course module schema: rejects a step missing expectedOutput (1.469143ms)
- ✔ course module schema: rejects an unknown course (1.263339ms)
- ✔ course module schema: rejects the wrong format tag (2.001816ms)
- ✔ course module schema: rejects a step id reused by another lesson's step (CKB-007's bug class, reachable at upload) (3.613026ms)
- ✔ course module schema: rejects a step id that collides with an exit slip's id (1.378099ms)
- ✔ course module schema: rejects a java step file path that /api/execute could never run (a space) (2.97431ms)
- ✔ course module schema: rejects a java step file path over /api/execute's 160-character cap (6.152716ms)
- ✔ course module schema: rejects an unrunnable .java performance-task file path (4.692307ms)
- ✔ course module schema: rejects duplicate lesson ids before they can share an availability switch (CKB-019) (1.318701ms)
- ✔ course module schema: accepts a module with no step `part` fields, unchanged (backward compatible) (1.078386ms)
- ✔ course module schema: accepts a step with a `part` title, including one shared across two lessons (5.657937ms)
- ✔ course module schema: rejects an empty `part` title (5.407291ms)

### tests/course-modules.test.mjs

- ✔ course modules: teacher uploads, class members read, only the teacher may upload or delete (1956.700315ms)

### tests/kb-search.test.mjs

- ✔ kb:search finds the matching bug record first (87.533539ms)
- ✔ kb:search says so when nothing matches (67.571568ms)

### tests/landing-pages.test.mjs

- ✔ landing pages: class roster, a student's own module summary, and a teacher's view of a student's progress (2121.063207ms)
- ✔ class list and creation: a teacher creates classes, a student joins one, and one class's workspace never bleeds into another's (1579.605355ms)

### tests/live-classes.test.mjs

- ✔ live invitations: all live classes are offered, dismissal hides only that session, and a new activity invites again (2.245799ms)
- ✔ live invitations: refresh preserves dismissal, ending a session clears it, and a stopped presentation can invite again (0.541802ms)
- ✔ live invitations: receive-only listeners refresh on start, stop, and reconnect; cleanup removes their channels and ignores late events (1.225212ms)
- ✔ live invitations: entering or leaving the workspace waits for old channels to close before reusing their topics (60.642103ms)

### tests/module-activities.test.mjs

- ✔ module activities: legacy challenge JSON remains readable while progress follows the sample (55.629637ms)
- ✔ module activities: parts spanning lessons require every task and never require a paper liplet (0.964628ms)
- ✔ module activities: matching text cannot pass a failed process; internal whitespace still matters (0.458821ms)
- ✔ module activities: supporting classes survive and src aliases cannot duplicate Main.java (CKB-038) (7.661953ms)
- ✔ module tasks: explicit ids isolate completion and unlock one step at a time inside a part (1.850383ms)
- ✔ module tasks: upload rejects duplicate task ids and collisions with stored progress keys (3.796361ms)
- ✔ module tasks: real Java checks the alteration, redacts the next step and preserves rolling work (8878.479404ms)
- ✔ module activities: real multi-file Java result unlocks only that student, without teacher switches or liplets (CKB-038) (6650.66164ms)
- ✔ module activities: compile errors and a crash after the right output cannot pass (4506.454554ms)
- ✔ module activities: prior project is copied only for its owner/class and later saves never replace it (685.188904ms)
- ✔ module activities: JSON supplies fixed program input and demo execution cannot award a pass (1077.844247ms)
- ✔ weekly Java projects: personal drafts roll forward separately, preserve submissions and never advance module progress (1211.640438ms)
- ✔ module activities: offline ignores online runner address and refuses browser progress (639.399761ms)

### tests/module-availability.test.mjs

- ✔ module availability: unknown modules and step ids cannot create progress (CKB-018) (2065.260967ms)
- ✔ module availability migration: preserves existing content and work, opens existing modules, defaults new uploads closed, and safely reruns (1277.074632ms)
- ✔ module availability: first part opens automatically, future content is withheld, and teacher switches cannot bypass student progress (1299.594509ms)
- ✔ module availability: reupload preserves work and new parts require their preceding activities (789.6244ms)
- ✔ module availability: the same module in two classes has independent switches, and concurrent teacher edits keep both changes (852.331658ms)
- ✔ module availability: modules without a performance task reject its switch and submission (882.089464ms)

### tests/module-progress.test.mjs

- ✔ module progress: step checklist, exit slip, and both performance-task versions (new feature, no prior CKB) (1738.910737ms)
- ✔ module progress: two simultaneous first touches of a module don't 500 (write race) (520.562326ms)
- ✔ module progress: a module in two classrooms doesn't share one student's progress (classroom scoping) (1127.705247ms)
- ✔ module progress: two simultaneous performance-task submissions don't lose one (write race) (640.516088ms)

### tests/module-weekly-active.test.mjs

- ✔ module weekly active + shared project: pick, lock, and project file round-trip (1985.006202ms)

### tests/realtime.test.mjs

- ✔ realtime: an unrelated topic's subscriber never waits on another topic's pending removal (56.131831ms)
- ✔ realtime: resubscribing the same topic waits for its own pending removal to finish first (CKB-017) (103.387605ms)
- ✔ realtime: signing out clears pending cleanup so the next sign-in's subscriber never waits on the discarded client's teardown (51.17285ms)
- ✔ offline: classroom devices reach local Supabase through the laptop's address (0.701012ms)
- ✔ throttle sends at most once per interval and never drops the newest value (83.910138ms)
- ✔ channel rules: members join, outsiders are refused, only the teacher broadcasts to the class (15528.581074ms)
- ✔ browser pass cannot read tables directly (3.431304ms)

### tests/rolling-module-tasks.test.mjs

- ✔ Week 14 tasks: revised upload keeps published ids and links to the preceding Vehicle project (25.167845ms)
- ✔ Week 14 Step 1: java-2-w14-d1-s1 (1796.70157ms)
- ✔ Week 14 Step 2: java-2-w14-d1-s2 (1071.471203ms)
- ✔ Week 14 Step 3: java-2-w14-d2-s3 (1441.767746ms)
- ✔ Week 14 Step 4: java-2-w14-d2-s4 (1771.811277ms)
- ✔ Week 14 Step 5: java-2-w14-d3-s5 (1044.872823ms)
- ✔ Week 14 Step 6: java-2-w14-d3-s6 (579.534447ms)
- ✔ Week 14 Step 7: java-2-w14-d4-s7 (623.934713ms)
- ✔ Week 14 Step 8: java-2-w14-d4-s8 (677.911206ms)
- ✔ Week 14 Step 9: java-2-w14-d4-s9 (665.243953ms)
- ✔ Week 14 Step 10: java-2-w14-d4-s10 (497.562057ms)
- ✔ Week 14 Step 11: java-2-w14-d5-s11 (562.871521ms)
- ✔ Week 14 tasks: all eleven alterations produce their published targets with real multi-file Java (10737.875488ms)

### tests/session-activity.test.mjs

- ✔ idle browser: background updates do not renew, warns at fourteen minutes and signs out at fifteen (66.441912ms)
- ✔ idle browser: real gestures renew at most once per minute and preserve the last gesture time (19.334261ms)
- ✔ idle browser: continuing during the warning clears it and starts a fresh idle period (22.715797ms)
- ✔ idle browser: a delayed background timer cannot report an old gesture as recent activity (7.7792ms)
- ✔ idle browser: a five-hour suspension expires before the returning gesture can renew (5.996067ms)
- ✔ idle browser: another tab's renewal is shared, and sign-out clears all tabs (4.103434ms)
- ✔ idle browser: suspended timer reads a newer deadline even before its storage event arrives (3.656522ms)
- ✔ idle browser: changing accounts reloads old data without deleting the new session (3.68764ms)
- ✔ idle browser: failed renewal cannot extend expiry, and cleanup removes listeners and timers (3.499907ms)
- ✔ idle browser: wrong login password leaves the session alone; a protected 401 signs it out (8.072337ms)

### tests/session-expiry.test.mjs

- ✔ session: student expires at fifteen minutes and teacher at two hours, despite background reads (CKB-051) (95.414555ms)
- ✔ session: only explicit activity renews the role deadline, accounting for the delayed last gesture (16.109454ms)
- ✔ session: old seven-day cookies, forged cookies and invalid renewal bodies are refused (13.74885ms)
- ✔ session: activity keeps the seven-day maximum and secure cookie settings (13.289226ms)
- ✔ session: live passes cannot outlast inactivity or renew an expired sign-in (12.485106ms)

### tests/student-classroom-entry.test.mjs

- ✔ student entry: a single membership opens that classroom even with an obsolete saved choice (1.294026ms)
- ✔ student entry: multiple memberships reopen only a remembered class the student still belongs to (0.284807ms)
- ✔ student entry: no membership never opens a saved or invented classroom (0.592562ms)
- ✔ student entry: teachers, required password reset and explicit Classes navigation do not auto-enter (0.202499ms)
- ✔ student entry: remembered classrooms stay separate for different accounts on a shared browser (0.400147ms)
- ✔ student entry: unavailable browser storage still permits single-class entry and safe multi-class choice (0.436591ms)
- ✔ student chooser: a former class-home selection cannot resurrect the removed module landing page (14.945965ms)
- ✔ teacher chooser: class creation and the teacher dashboard entry remain available (1.994155ms)

### tests/student-module-activity-ui.test.mjs

- ✔ module activity screen: signing in starts safely before a class or project exists (CKB-044) (17.321313ms)
- ✔ module activity screen: main Java editor has project tabs, sample output, Console, Run code and Save work (12.180984ms)

### tests/teacher-dashboard-ui.test.mjs

- ✔ teacher dashboard: navigation maps Students and Curriculum and exposes loading instead of fake totals (53.333273ms)
- ✔ teacher dashboard: avatar styles cannot override the existing classroom avatar (CKB-039) (3.464351ms)

### tests/teacher-dashboard.test.mjs

- ✔ refuses signed-out users, students, foreign teachers, and invalid class IDs (8.899426ms)
- ✔ counts saved completion and both submissions, including closed lessons, without exposing source (30.893478ms)
- ✔ keeps the same student's progress separate between classes and excludes former members (25.498449ms)
- ✔ returns finite zero totals for empty classes and modules with no students (28.748953ms)
- ✔ rounded 100% averages do not label unfinished students or modules Finished (CKB-041) (51.893744ms)
- ✔ rounded 0% averages retain In progress when a student has completed an item (CKB-041) (48.253654ms)
- ✔ reads every progress page instead of silently truncating a full year (62.491434ms)
- ✔ a new read reflects saved results without changing student progress (50.153326ms)
- ✔ teacher dashboard (1799.390563ms)

### tests/teacher-web-projects.test.mjs

- ✔ teacher web projects: lists every personal web project for the selected student and class, and reads saved files on demand (1688.829808ms)
- ✔ teacher web projects: only the owning teacher reads a current class member's projects; guesses and write methods are refused (1076.966572ms)
- ✔ teacher web projects: empty lists and files are readable, repeated reads never save, and a student's save appears on refresh (1057.901749ms)
- ✔ teacher web preview: blocks network resources before student code while preserving the doctype and console line map (1.418152ms)
- ✔ teacher web preview: allows eval/Function so a saved eval()-based calculator behaves the same as it does for the student (0.13448ms)
- ✔ teacher web preview: headless pages retain console locations and missing HTML keeps its existing warning (0.187059ms)

### tests/web-workspace.test.mjs

- ✔ inlines linked CSS and JavaScript, no external loads (8.01452ms)
- ✔ maps document lines back to the student's file and line (1.204149ms)
- ✔ capture script sits on the <head> line and does not shift lines (0.581392ms)
- ✔ works without <head>, and warns about missing files (7.98653ms)
- ✔ a </script> inside JavaScript cannot break out of the inlined script (0.869714ms)
- ✔ no index.html gives a friendly message (0.435356ms)
- ✔ file names must fit the project language (4.149048ms)

### tests/weekly-java-project-ui.test.mjs

- ✔ weekly Java editor: module shows sample output and only module source (19.650816ms)
- ✔ weekly Java editor: personal shows its own source, input and explicit submission (3.800133ms)
- ✔ weekly Java editor: alteration shows its own target and remembers completed tasks (7.040205ms)
