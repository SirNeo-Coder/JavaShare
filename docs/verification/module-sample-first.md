# Sample-first module verification

Verified 2026-10-21 on branch `codex/module-sample-first`, based on `codex/earlet-hover-dismiss` (PR #26, stacked on PR #25). No hosted SQL, deployment, merge, or settings changes.

## Re-verification 2026-10-28 (CKB-077)

The browser script had gone stale against later approved changes (Week 14's Week 13 prerequisite,
read-only step opening, resume at the next part, the five-minute device lesson copy, device-only
online sample checks). Test-only refresh on branch `claude/sample-first-test-refresh`, based on
main `aadda3a`; no app change.

- FAIL before — unchanged script, offline and online: worksheet never opened (prerequisite notice).
- PASS after — `node --test --test-reporter=spec tests/module-sample-first.browser.mjs`: offline 5/5
  and online 5/5 (four steps plus parent each), local production 3022/3020, runner 3021, local Supabase.
- PASS — `npm run build:all`; `npm run lint` 0 errors, 8 existing warnings; `npm test` 369/369.

## Final gate

- PASS — `npm run build:all` (production app and backend).
- PASS — `npm run lint`: zero errors, eight existing warnings.
- PASS — `npm test -- --test-reporter=spec`: 181 passed, zero failed/skipped.
- PASS — `npm run classroom:offline -- --build-only`: actual offline launcher/configuration and build.
- PASS — actual production Chromium: five offline checks and five online checks. These totals include each parent suite.
- PASS — actual browser Java 8: eleven published sample baselines plus parent suite, 12/12.
- PASS — mutation proof: bypassing `samplePending` made the named verification regression fail with `false !== true`; restoring it passed the same test.
- PASS — reviewed DOCX appendix and all PDF practice pages; the original eight DOCX page renders are pixel-identical to the previously reviewed render. Original PDF first-eight page content streams are identical. DOCX remains nine pages; PDF remains eleven pages, all 8.5 × 13 inches.

## Failures encountered and resolved

The first sandbox build could not read the TypeScript subprocess configuration; the same required build passed with local process access. Initial lint flagged rendering from a React ref; rendering now uses state. One full-suite legacy-response assertion failed because history was exposed to older modules; the additive field is now limited to opted-in modules and all 181 tests pass. The first UI test used the wrong case for React's readOnly attribute; corrected. Early browser harness runs tried to close an already automatically closed worksheet, read the previous editor before its asynchronous open finished, ignored the existing laptop run rate limit, and counted hidden worksheet logos. The final harness waits for loading, respects the rate limit and scopes branding to the visible editor. Final actual offline/online tests pass without app errors.

## Coverage and limits

Pure helper/render checks test rules in isolation. Route integration tests use local Supabase and actual javac for sample/task completion, source preservation, prerequisite gating, old completion, declared errors, stale writes and personal separation. The migration test creates and removes a disposable local PostgreSQL database, applies the new file twice, and verifies preserved work/completions/submissions, the object constraint, and compatibility with old readers. Actual browser tests use rebuilt production app origins 3020/3022 and separate static runner origin 3021, disposable local classes/accounts, real Run code clicks, immediate saved-progress reads, reload and step switching. Offline has no CheerpJ branding; online visibly retains it. All eleven sample baselines were also run through the public runner's real postMessage interface on CheerpJ Java 8. All eleven alterations ran successfully with actual laptop Java.

Not tested: hosted Cloudflare/Supabase rollout, Windows, a physical disconnected classroom Wi-Fi device, all browsers, all eleven alterations through browser Java. Week 14 is the only revised curriculum in this change. Other weeks, file persistence, thread output redesign, Swing, and the generation prompt/playbook remain separate. Existing completed tasks intentionally skip the new sample requirement. Legacy source work predating step identity is preserved as a readable backup; historical per-step versions that never existed cannot be reconstructed.

## Reproducing browser checks

Use local production servers only, with local Supabase and the new migration. Keep any existing classroom server separate. Server 3020 uses online Java with JAVA_RUNNER_URL=http://localhost:3021/; 3022 uses LOCAL_JAVA_EXECUTION=true and CODESHARE_LAPTOP=true. Serve java-runtime/public on 3021 with its CSP and HTTP Range support for JAR files. Browser test commands below also set CODESHARE_PLAYWRIGHT_MODULE to the bundled Playwright index.mjs and PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to the installed Chromium executable. They create and clean up their own local users/classes.

## Full automated suite

Command: `sg docker -c 'npm test -- --test-reporter=spec'`

### tests/api-router.test.mjs

- ✔ router: path parameters, query, cookies, and JSON body reach the handler (73.060887ms)
- ✔ router: middleware passes on with next(), stops by responding, and next(error) reaches the error handler (3.200764ms)
- ✔ router: cookies, 204, unknown routes, bad JSON, and size limits (42.09533ms)
- ✔ router: the larger JSON body cap is scoped to the module-upload route, not every route (18.689202ms)
- ✔ routes: register, stay signed in with the cookie, get a live pass, sign out (846.231577ms)
- ✔ routes: a chat message's live signal finishes sending before the reply (CKB-006) (816.502239ms)

### tests/browser-java-bridge.test.mjs

- ✔ browser bridge: committed JAR matches its Java source (321.216245ms)
- ✔ browser bridge: packages, inheritance, input and Unicode run together (2122.484746ms)
- ✔ browser bridge: compile error, stderr and crash after expected output all fail (3886.520643ms)
- ✔ browser bridge: combined stdout/stderr stops at 64 KB and missing classes cannot survive another run (2242.404559ms)
- ✔ browser bridge: flat browser strings become distinct source folders, including duplicate class names (1220.308501ms)

### tests/browser-java-client.test.mjs

- ✔ browser Java: refuses same origin, insecure, credentialed and path-based runner addresses (2.829454ms)
- ✔ browser Java: authenticates frame messages, sends every source/input/package, and tears down after result or timeout (3.814887ms)
- ✔ browser Java: offline uses only the existing authenticated laptop endpoint (38.898867ms)
- ✔ interactive Java: streams prompts, waits for blank and Unicode answers, and rejects stale or foreign input requests (CKB-049) (8.11663ms)
- ✔ interactive Java: the five-second execution budget is cumulative across input waits (0.9782ms)
- ✔ interactive Java: Stop preserves printed output and removes a waiting run (2.268278ms)
- ✔ interactive Java: abandoned input stops after two minutes (1.356903ms)
- ✔ interactive Java: total submitted input and streamed output stay bounded (1.413994ms)
- ✔ interactive Java: streamed output stays bounded (0.878653ms)
- ✔ interactive Java: an older runner fails clearly during independent deployments (1.612401ms)
- ✔ interactive Java: a run cancelled before startup never appends its frame (0.692126ms)

### tests/browser-java-progress.test.mjs

- ✔ online module tasks: browser results check the task target and cannot reuse a sample pass (3510.005169ms)
- ✔ online Java progress: browser evidence obeys membership, exact output, successful exit, saved version and part access (2346.61051ms)
- ✔ online Java mode: missing address fails clearly; unsafe addresses are refused; legacy server mode remains available (1403.85339ms)
- ✔ online sample first: server-owned stages reject edited samples and save verification separately from task completion (1705.227904ms)

### tests/browser-java-runtime.test.mjs

- ✔ browser runtime: only the parent starts Java; flat strings preserve duplicate filenames for the bridge (15.526606ms)
- ✔ browser runtime: invalid sources and download failure report failure instead of progress (3.897107ms)
- ✔ browser runtime: public asset policy permits CheerpJ's required nested runtime frame only (CKB-047) (3.792596ms)
- ✔ browser runtime: live input waits for authenticated matching answers and streams output before completion (CKB-049) (3.375247ms)
- ✔ browser runtime: live input cannot exceed the existing total input limit (2.314083ms)

### tests/classroom-ui.test.mjs

- ✔ module catalog: displays saved progress and distinguishes continuing from reviewing (21.314263ms)
- ✔ module catalog: the server's live lock disables opening and only the weekly pick gets its badge (3.891056ms)
- ✔ module catalog: teacher browsing never invents student progress (2.032695ms)
- ✔ workspace drawers: closed panels stay mounted but inaccessible so closing can animate (4.253722ms)
- ✔ module worksheet: alteration instructions and target stay separate from the sample (17.973776ms)
- ✔ module parts: a locked next task does not hide the current task's discussion (1.05726ms)
- ✔ module pages: inactive lessons and task editors stay mounted so navigation cannot discard drafts (14.932605ms)
- ✔ module parts: author grouping spans days and assigns discussion and exit slips exactly once (1.586932ms)
- ✔ module parts: older lessons and redacted closed lessons retain their own safe pages (4.318769ms)
- ✔ module paper: tables, analogies, notes and error guides display their actual supplied content safely (6.890273ms)
- ✔ module worksheet: named parts, unchanged samples, page controls and teacher-only sample preview coexist (18.008018ms)
- ✔ module worksheet: inter-step tables and notes retain the uploaded reading order (25.507759ms)

### tests/course-module-schema.test.mjs

- ✔ course module schema: accepts a module matching docs/course-format.md (22.514359ms)
- ✔ course module schema: rejects a step missing expectedOutput (1.343127ms)
- ✔ course module schema: rejects an unknown course (1.241678ms)
- ✔ course module schema: rejects the wrong format tag (0.982398ms)
- ✔ course module schema: rejects a step id reused by another lesson's step (CKB-007's bug class, reachable at upload) (2.395661ms)
- ✔ course module schema: rejects a step id that collides with an exit slip's id (0.694304ms)
- ✔ course module schema: rejects a java step file path that /api/execute could never run (a space) (0.559327ms)
- ✔ course module schema: rejects a java step file path over /api/execute's 160-character cap (1.763352ms)
- ✔ course module schema: rejects an unrunnable .java performance-task file path (0.942753ms)
- ✔ course module schema: rejects duplicate lesson ids before they can share an availability switch (CKB-019) (0.780367ms)
- ✔ course module schema: accepts a module with no step `part` fields, unchanged (backward compatible) (0.693277ms)
- ✔ course module schema: accepts a step with a `part` title, including one shared across two lessons (0.766095ms)
- ✔ course module schema: rejects an empty `part` title (0.970027ms)

### tests/course-modules.test.mjs

- ✔ course modules: teacher uploads, class members read, only the teacher may upload or delete (2974.750815ms)

### tests/kb-search.test.mjs

- ✔ kb:search finds the matching bug record first (156.229383ms)
- ✔ kb:search says so when nothing matches (95.455434ms)

### tests/landing-pages.test.mjs

- ✔ landing pages: class roster, a student's own module summary, and a teacher's view of a student's progress (3390.176684ms)
- ✔ class list and creation: a teacher creates classes, a student joins one, and one class's workspace never bleeds into another's (1529.940196ms)

### tests/live-classes.test.mjs

- ✔ live invitations: all live classes are offered, dismissal hides only that session, and a new activity invites again (2.300242ms)
- ✔ live invitations: refresh preserves dismissal, ending a session clears it, and a stopped presentation can invite again (0.583745ms)
- ✔ live invitations: receive-only listeners refresh on start, stop, and reconnect; cleanup removes their channels and ignores late events (1.572328ms)
- ✔ live invitations: entering or leaving the workspace waits for old channels to close before reusing their topics (150.483948ms)

### tests/module-activities.test.mjs

- ✔ module activities: legacy challenge JSON remains readable while progress follows the sample (55.744623ms)
- ✔ module activities: parts spanning lessons require every task and never require a paper liplet (1.367706ms)
- ✔ module activities: matching text cannot pass a failed process; internal whitespace still matters (1.506514ms)
- ✔ sample first: verification requires the declared result and unchanged sample, never completes an alteration (1.127629ms)
- ✔ sample first: upload accepts opt-in and declared errors, rejects sample progress-key collisions (9.755519ms)
- ✔ module activities: supporting classes survive and src aliases cannot duplicate Main.java (CKB-038) (0.480609ms)
- ✔ module tasks: explicit ids isolate completion and unlock one step at a time inside a part (9.14445ms)
- ✔ module tasks: upload rejects duplicate task ids and collisions with stored progress keys (5.856301ms)
- ✔ module tasks: real Java checks the alteration, redacts the next step and preserves rolling work (10540.043903ms)
- ✔ module activities: real multi-file Java result unlocks only that student, without teacher switches or liplets (CKB-038) (7194.246588ms)
- ✔ module activities: compile errors and a crash after the right output cannot pass (4592.061545ms)
- ✔ module activities: prior project is copied only for its owner/class and later saves never replace it (718.083554ms)
- ✔ module activities: JSON supplies fixed program input and demo execution cannot award a pass (1103.322194ms)
- ✔ weekly Java projects: personal drafts roll forward separately, preserve submissions and never advance module progress (1280.811968ms)
- ✔ module activities: offline ignores online runner address and refuses browser progress (674.023311ms)
- ✔ sample first: real Java verifies samples, completes alterations, restores step drafts and refuses stale tabs (8828.547013ms)
- ✔ sample first: a declared runtime error verifies only the demonstration and existing completions survive opt-in (4695.27545ms)

### tests/module-activity-migration.test.mjs

- ✔ module step migration: additive history preserves work, completion and submissions; repeats safely and permits old readers (1594.370905ms)

### tests/module-availability.test.mjs

- ✔ module availability: unknown modules and step ids cannot create progress (CKB-018) (2987.877586ms)
- ✔ module availability migration: preserves existing content and work, opens existing modules, defaults new uploads closed, and safely reruns (1205.283104ms)
- ✔ module availability: first part opens automatically, future content is withheld, and teacher switches cannot bypass student progress (1440.917598ms)
- ✔ module availability: reupload preserves work and new parts require their preceding activities (1134.85828ms)
- ✔ module availability: the same module in two classes has independent switches, and concurrent teacher edits keep both changes (1166.20721ms)
- ✔ module availability: modules without a performance task reject its switch and submission (1087.52153ms)

### tests/module-progress.test.mjs

- ✔ module progress: step checklist, exit slip, and both performance-task versions (new feature, no prior CKB) (2554.013863ms)
- ✔ module progress: two simultaneous first touches of a module don't 500 (write race) (628.129738ms)
- ✔ module progress: a module in two classrooms doesn't share one student's progress (classroom scoping) (934.954671ms)
- ✔ module progress: two simultaneous performance-task submissions don't lose one (write race) (699.361098ms)

### tests/module-run-feedback.test.mjs

- ✔ module feedback: prominent sample verification does not claim task completion (20.47889ms)
- ✔ module feedback: distinguishes old sample, wrong output, new completion and earlier completion (5.420368ms)
- ✔ module feedback: sample-first editor shows baseline target before allowing edits (12.091044ms)

### tests/module-weekly-active.test.mjs

- ✔ module weekly active + shared project: pick, lock, and project file round-trip (2851.767437ms)

### tests/realtime.test.mjs

- ✔ realtime: an unrelated topic's subscriber never waits on another topic's pending removal (63.865407ms)
- ✔ realtime: resubscribing the same topic waits for its own pending removal to finish first (CKB-017) (104.037187ms)
- ✔ realtime: signing out clears pending cleanup so the next sign-in's subscriber never waits on the discarded client's teardown (52.824629ms)
- ✔ offline: classroom devices reach local Supabase through the laptop's address (0.67463ms)
- ✔ throttle sends at most once per interval and never drops the newest value (87.063207ms)
- ✔ channel rules: members join, outsiders are refused, only the teacher broadcasts to the class (16035.083191ms)
- ✔ browser pass cannot read tables directly (7.835124ms)

### tests/rolling-module-tasks.test.mjs

- ✔ Week 14 tasks: revised upload keeps published ids and links to the preceding Vehicle project (26.843283ms)
- ✔ Week 14 sample 1: java-2-w14-d1-s1 (2013.647118ms)
- ✔ Week 14 sample 2: java-2-w14-d1-s2 (2171.023725ms)
- ✔ Week 14 sample 3: java-2-w14-d2-s3 (1608.894915ms)
- ✔ Week 14 sample 4: java-2-w14-d2-s4 (1426.499623ms)
- ✔ Week 14 sample 5: java-2-w14-d3-s5 (895.562102ms)
- ✔ Week 14 sample 6: java-2-w14-d3-s6 (940.078457ms)
- ✔ Week 14 sample 7: java-2-w14-d4-s7 (1012.489486ms)
- ✔ Week 14 sample 8: java-2-w14-d4-s8 (706.832047ms)
- ✔ Week 14 sample 9: java-2-w14-d4-s9 (752.98101ms)
- ✔ Week 14 sample 10: java-2-w14-d4-s10 (654.080849ms)
- ✔ Week 14 sample 11: java-2-w14-d5-s11 (652.914414ms)
- ✔ Week 14 samples: all eleven baselines verify with real Java, including the declared error demonstration (12839.181195ms)
- ✔ Week 14 Step 1: java-2-w14-d1-s1 (514.99127ms)
- ✔ Week 14 Step 2: java-2-w14-d1-s2 (488.746923ms)
- ✔ Week 14 Step 3: java-2-w14-d2-s3 (489.531661ms)
- ✔ Week 14 Step 4: java-2-w14-d2-s4 (550.583425ms)
- ✔ Week 14 Step 5: java-2-w14-d3-s5 (570.889269ms)
- ✔ Week 14 Step 6: java-2-w14-d3-s6 (540.457722ms)
- ✔ Week 14 Step 7: java-2-w14-d4-s7 (532.061973ms)
- ✔ Week 14 Step 8: java-2-w14-d4-s8 (535.505285ms)
- ✔ Week 14 Step 9: java-2-w14-d4-s9 (512.055329ms)
- ✔ Week 14 Step 10: java-2-w14-d4-s10 (556.335098ms)
- ✔ Week 14 Step 11: java-2-w14-d5-s11 (682.526063ms)
- ✔ Week 14 tasks: all eleven alterations produce their published targets with real multi-file Java (5976.143493ms)

### tests/session-activity.test.mjs

- ✔ idle browser: background updates do not renew, warns at fourteen minutes and signs out at fifteen (101.523294ms)
- ✔ idle browser: real gestures renew at most once per minute and preserve the last gesture time (11.220008ms)
- ✔ idle browser: continuing during the warning clears it and starts a fresh idle period (8.998367ms)
- ✔ idle browser: a delayed background timer cannot report an old gesture as recent activity (3.414255ms)
- ✔ idle browser: a five-hour suspension expires before the returning gesture can renew (3.025189ms)
- ✔ idle browser: another tab's renewal is shared, and sign-out clears all tabs (4.285445ms)
- ✔ idle browser: suspended timer reads a newer deadline even before its storage event arrives (2.04887ms)
- ✔ idle browser: changing accounts reloads old data without deleting the new session (1.518779ms)
- ✔ idle browser: failed renewal cannot extend expiry, and cleanup removes listeners and timers (10.482715ms)
- ✔ idle browser: wrong login password leaves the session alone; a protected 401 signs it out (7.206801ms)

### tests/session-expiry.test.mjs

- ✔ session: student expires at fifteen minutes and teacher at two hours, despite background reads (CKB-051) (137.983957ms)
- ✔ session: only explicit activity renews the role deadline, accounting for the delayed last gesture (27.927614ms)
- ✔ session: old seven-day cookies, forged cookies and invalid renewal bodies are refused (29.60144ms)
- ✔ session: activity keeps the seven-day maximum and secure cookie settings (8.479576ms)
- ✔ session: live passes cannot outlast inactivity or renew an expired sign-in (9.653626ms)

### tests/student-classroom-entry.test.mjs

- ✔ student entry: a single membership opens that classroom even with an obsolete saved choice (2.053674ms)
- ✔ student entry: multiple memberships reopen only a remembered class the student still belongs to (0.375947ms)
- ✔ student entry: no membership never opens a saved or invented classroom (0.265997ms)
- ✔ student entry: teachers, required password reset and explicit Classes navigation do not auto-enter (0.205373ms)
- ✔ student entry: remembered classrooms stay separate for different accounts on a shared browser (0.47866ms)
- ✔ student entry: unavailable browser storage still permits single-class entry and safe multi-class choice (0.831199ms)
- ✔ student chooser: a former class-home selection cannot resurrect the removed module landing page (15.443692ms)
- ✔ teacher chooser: class creation and the teacher dashboard entry remain available (2.110211ms)

### tests/student-module-activity-ui.test.mjs

- ✔ module activity screen: signing in starts safely before a class or project exists (CKB-044) (16.098893ms)
- ✔ module activity screen: main Java editor has project tabs, sample output, Console, Run code and Save work (10.875007ms)

### tests/teacher-dashboard-ui.test.mjs

- ✔ teacher dashboard: navigation maps Students and Curriculum and exposes loading instead of fake totals (20.634252ms)
- ✔ teacher dashboard: avatar styles cannot override the existing classroom avatar (CKB-039) (7.092643ms)

### tests/teacher-dashboard.test.mjs

- ✔ refuses signed-out users, students, foreign teachers, and invalid class IDs (18.718378ms)
- ✔ counts saved completion and both submissions, including closed lessons, without exposing source (51.151697ms)
- ✔ keeps the same student's progress separate between classes and excludes former members (55.82376ms)
- ✔ returns finite zero totals for empty classes and modules with no students (48.015468ms)
- ✔ rounded 100% averages do not label unfinished students or modules Finished (CKB-041) (57.844494ms)
- ✔ rounded 0% averages retain In progress when a student has completed an item (CKB-041) (66.508001ms)
- ✔ reads every progress page instead of silently truncating a full year (107.35687ms)
- ✔ a new read reflects saved results without changing student progress (57.489028ms)
- ✔ teacher dashboard (2444.603606ms)

### tests/teacher-web-projects.test.mjs

- ✔ teacher web projects: lists every personal web project for the selected student and class, and reads saved files on demand (2285.244146ms)
- ✔ teacher web projects: only the owning teacher reads a current class member's projects; guesses and write methods are refused (1500.133076ms)
- ✔ teacher web projects: empty lists and files are readable, repeated reads never save, and a student's save appears on refresh (1262.679516ms)
- ✔ teacher web preview: blocks network resources before student code while preserving the doctype and console line map (1.570391ms)
- ✔ teacher web preview: allows eval/Function so a saved eval()-based calculator behaves the same as it does for the student (0.133816ms)
- ✔ teacher web preview: headless pages retain console locations and missing HTML keeps its existing warning (0.271592ms)

### tests/web-workspace.test.mjs

- ✔ inlines linked CSS and JavaScript, no external loads (9.330338ms)
- ✔ maps document lines back to the student's file and line (0.877877ms)
- ✔ capture script sits on the <head> line and does not shift lines (0.459651ms)
- ✔ works without <head>, and warns about missing files (0.460461ms)
- ✔ a </script> inside JavaScript cannot break out of the inlined script (0.298271ms)
- ✔ no index.html gives a friendly message (7.636491ms)
- ✔ file names must fit the project language (16.190804ms)

### tests/weekly-java-project-ui.test.mjs

- ✔ weekly Java editor: module shows sample output and only module source (24.085421ms)
- ✔ weekly Java editor: personal shows its own source, input and explicit submission (4.304921ms)
- ✔ weekly Java editor: alteration shows its own target and remembers completed tasks (2.955162ms)

## Actual offline browser

Command: `SAMPLE_BROWSER_MODE=offline node --test --test-reporter=spec tests/module-sample-first.browser.mjs`

### tests/module-sample-first.browser.mjs

- ✔ loads the exact sample and requires verification before editing (2560.102119ms)
- ✔ shows visible old-sample and mismatch banners, then saves completion immediately (7527.944998ms)
- ✔ loads the next sample, completes its alteration, and restores the first step after reload (8726.576513ms)
- ✔ recognizes the deliberate error demonstration without completing its task (3156.847932ms)
- ✔ sample first offline: real editor verification, feedback, saved completion and step restoration (24207.621409ms)

## Actual online browser

Command: `SAMPLE_BROWSER_MODE=online node --test --test-reporter=spec tests/module-sample-first.browser.mjs`

### tests/module-sample-first.browser.mjs

- ✔ loads the exact sample and requires verification before editing (7699.077791ms)
- ✔ shows visible old-sample and mismatch banners, then saves completion immediately (17432.801478ms)
- ✔ loads the next sample, completes its alteration, and restores the first step after reload (18653.279586ms)
- ✔ recognizes the deliberate error demonstration without completing its task (6547.144611ms)
- ✔ sample first online: real editor verification, feedback, saved completion and step restoration (52537.280022ms)

## All published samples on Java 8

Command: `node --test --test-reporter=spec tests/week14-java8.browser.mjs`

### tests/week14-java8.browser.mjs

- ✔ Java 8 sample 1: java-2-w14-d1-s1 (7298.054415ms)
- ✔ Java 8 sample 2: java-2-w14-d1-s2 (5727.212759ms)
- ✔ Java 8 sample 3: java-2-w14-d2-s3 (5693.733259ms)
- ✔ Java 8 sample 4: java-2-w14-d2-s4 (6442.529171ms)
- ✔ Java 8 sample 5: java-2-w14-d3-s5 (5862.914378ms)
- ✔ Java 8 sample 6: java-2-w14-d3-s6 (5517.123651ms)
- ✔ Java 8 sample 7: java-2-w14-d4-s7 (5570.742231ms)
- ✔ Java 8 sample 8: java-2-w14-d4-s8 (4427.842622ms)
- ✔ Java 8 sample 9: java-2-w14-d4-s9 (4063.302995ms)
- ✔ Java 8 sample 10: java-2-w14-d4-s10 (4333.223974ms)
- ✔ Java 8 sample 11: java-2-w14-d5-s11 (4599.353313ms)
- ✔ Week 14 online samples: every published baseline verifies in actual CheerpJ Java 8 (59855.154464ms)
