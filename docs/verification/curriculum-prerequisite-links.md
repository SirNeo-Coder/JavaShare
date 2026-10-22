# CKB-063 curriculum prerequisite correction — 2026-10-22

Branch: `codex/curriculum-prerequisite-links`, based on main `21766ba` after shared-library
PR #37 merged. Teacher approved the repair plan in this chat. No merge, deployment, hosted
upload/settings/SQL, migration or real student record was changed.

## Outcome

Only `previousModuleId` changed in the Week 18, 19, 20 and 21 JSON files:
`java-2-w17-module`, `java-2-w18-module`, `java-2-w19-module`, `java-2-w20-module` respectively.
Every other byte in those files matches main. All other curriculum assets and task-edit fixtures
are unchanged. Application, backend, schema, configuration and migration files are unchanged.

The actual Week 12–21 chain resolves. The unchanged access check still requires every current
activity pass in the full chain. Sample-only/legacy passes cannot substitute; missing uploads
still block. Week 20 retains zero code tasks, and Week 21 still depends through it on Week 19.
[Teacher re-upload instructions](../curriculum-prerequisite-reupload.md).

## Final checks

| Command/check | Result |
| --- | --- |
| `npm run build:all` | PASS frontend production build and backend TypeScript build |
| `npm run lint` | PASS, 0 errors / 8 existing warnings |
| `sg docker -c 'npm test'` | PASS 303/303; 0 failed, skipped or cancelled |
| `sg docker -c 'node --test tests/module-prerequisites.test.mjs tests/subject-module-sharing.test.mjs'` | PASS 26/26; 0 failed/skipped |
| `sg docker -c 'npm run classroom:offline -- --build-only'` | PASS; existing local Supabase retained, no reset |
| Actual curriculum production browser | PASS 8/8; 0 failed/skipped |
| Offline prerequisite production browser | PASS 5/5; 0 failed/skipped |
| Subject-sharing production browser | PASS 7/7; 0 failed/skipped |
| Each of four bad links deliberately restored separately | Expected FAIL in all four trials; corrected files restored, regression PASS |
| JSON preservation / unchanged application comparison against main | PASS |
| `node --test tests/kb-search.test.mjs` | PASS 2/2; 0 failed/skipped |
| `npm run kb:search -- "Week 18 missing Week 17 predecessor suffix"` | PASS CKB-063 first |
| Browser script syntax, new document links and `git diff --check` | PASS |

The lint warnings are the existing `react-hooks/exhaustive-deps` warning and seven
`@next/next/no-img-element` warnings in `app/page.tsx`.

## Failures and unverified areas

- The first isolated build failed because Turbopack cannot resolve Next.js from a `node_modules`
  symlink outside the checkout. Copied the already-installed dependencies into this checkout;
  the required build and offline launcher build then passed. No config/package change.
- Restricted sandbox runs initially refused Node test-worker/git subprocess operations. Repeated
  with the permitted execution environment; the meaningful regression failure/pass and preservation
  results below come from those successful executions.
- The pre-fix curriculum regression and four deliberate-break trials failed as expected. There
  are no final failed or skipped checks in the suites above.
- The earlier Week 17 feedback timeout did not recur in the local curriculum browser check.
  Its cause remains unknown; no timeout/feedback/runner repair was made or claimed.
- Hosted re-upload, production student recovery, online CheerpJ, visible GUI interaction,
  disconnected classroom Wi-Fi, physical student devices, Windows and other browsers were not
  verified. Browser tests used Chromium and localhost, not a second device over Wi-Fi.
- Existing curriculum runtime limits remain: Week 15 classroom file APIs are blocked, and original
  thread examples retain timing/order assumptions. Correct links do not establish broader runtime
  support or curriculum rollout readiness.

## Regression proof

Command before correction, after correction, and after restoring each deliberately broken link:

```text
node --test --test-name-pattern='actual curriculum' tests/week15-week21-modules.test.mjs
```

Before correction:

```text
✖ Weeks 12–21: actual curriculum links resolve and current tasks control ordered access
AssertionError: Week 18 must reference the actual preceding module id
+ 'java-2-w17'
- 'java-2-w17-module'
```

After correction:

```text
✔ Weeks 12–21: actual curriculum links resolve and current tasks control ordered access
ℹ pass 1
ℹ fail 0
```

Then restored the old reference in each Week 18, 19, 20 and 21 file individually. Each run
failed at that week's `must reference the actual preceding module id` assertion. Restored each
file in a `finally` block and reran: 1/1 passed. No lesson/code/id/output mutation was necessary.

The isolated regression loads all ten actual JSON files, validates each link, checks ordered
access after predecessor completion, refuses later weeks while an ancestor has one failed
current task despite sample/legacy passes, and checks that old completion cannot replace a
missing uploaded module. The existing seven preservation tests now compare predecessor ids
with the actual earlier files rather than synthesizing an incorrect id from the week number.

## Real app and offline browser evidence

Production Next.js app at `http://localhost:3022`, with local Supabase, `DATABASE_MODE=supabase-local`,
`LOCAL_JAVA_EXECUTION=true` and `CODESHARE_LAPTOP=true`. The server had no display for the preserved
GUI examples. Each browser suite created and removed its own local test teacher, student and
classes. No real account or shared library was used. The temporary server was stopped afterward;
the teacher's existing classroom server was left running.

The curriculum fixture uploads the real Weeks 12–21. Only disposable test-student completion
records are seeded to prepare earlier weeks. For each code week, removing a prerequisite task
pass gives 403 with the correct earlier module id; restoring those fixture passes opens the
real project through the app. Week 21's check removes a Week 19 pass through written Week 20.
These seeded records are setup/access evidence, not a claim that all those tasks were completed
by browser Java. A separate UI check runs the actual Week 16 alteration with laptop Java, earns
its final missing pass, opens Week 17 after reload and confirms unfinished Week 17 still blocks
Week 18. It also verifies sample-only evidence does not complete a task.

The teacher UI re-upload check starts with the old incorrect references, uploads all four
corrected files through **Upload module**, verifies the shared library holds the exact corrected
JSON, and compares the complete saved student row before/after. Module files, personal draft,
per-step draft/history/backup, current/sample/retired completion keys, both submitted snapshots
and the record timestamp remain unchanged. Subject-sharing and prerequisite suites additionally
verify same-subject correction propagation, teacher ownership, Java/Net MVC separation,
student/class isolation, live catch-up and saved later work. Offline browser checks block and
assert zero external resource requests and use actual laptop Java.

Browser environment for all commands below:

```text
CODESHARE_PLAYWRIGHT_MODULE=/home/ireneo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/home/ireneo/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome
```

Set those two values inside `sg docker -c '...'`, then run the indicated command against the
local test server. They are local runtime paths, not app settings or committed dependencies.

### tests/week15-week21.browser.mjs

Command: `node --test tests/week15-week21.browser.mjs` (with the browser environment above, in the Docker group).

- ✔ all ten Week 12–21 JSON files upload through the real app
- ✔ re-uploading corrected Weeks 18–21 updates the shared Java library without changing saved student records
- ✔ actual earlier-task records block each later code week and completed prerequisites open Java-only projects
- ✔ Week 16 verifies its unchanged sample without completing the task
- ✔ Week 16 completes the alteration, opens the next sample and restores saved edits
- ✔ unfinished Week 16 blocks Week 17; a real successful alteration unlocks Week 17 while Week 18 still waits
- ✔ Week 17 checks actual panel changes; the no-display sample alone never completes
- ✔ Weeks 15–21 local browser: uploads, sample gate, completion, saved drafts and real component checks

### tests/module-prerequisites.browser.mjs

Command: `PREREQUISITE_BROWSER_MODE=offline node --test tests/module-prerequisites.browser.mjs` (with the browser environment above, in the Docker group).

- ✔ Week 14 names Week 12 and Continue restores the next unfinished saved step during live class
- ✔ Week 13 must pass before Week 14 opens; reload retains the ordered unlock and Week 14 work
- ✔ both Projects shortcuts recheck changed prerequisites and offer Continue without overwriting later work
- ✔ missing prerequisite has a teacher-upload message; teacher preview remains available
- ✔ prerequisites offline: banner, saved-step resume and ordered unlock through the real app

### tests/subject-module-sharing.browser.mjs

Command: `SUBJECT_BROWSER_URL=http://localhost:3022 node --test tests/subject-module-sharing.browser.mjs` (with the browser environment above, in the Docker group).

- ✔ Create a class offers only Java and Net MVC, and Java classes share an existing upload
- ✔ uploading a correction updates both Java classes; Net MVC has its own module set
- ✔ a differing saved class copy asks before replacing the shared version
- ✔ deletion waits for the sharing scope before offering a confirmation
- ✔ shared deletion warns about all Java classes and Cancel keeps the module
- ✔ student opens the shared module and runs its sample using laptop Java with no external requests
- ✔ subject sharing browser: subject choice, existing upload sharing, subject isolation, corrections, deletion warning and offline Java

## Full suite: every named result, grouped by file

The isolated functions/markup checks test rules on their own. Route/database checks use real
local Supabase and the actual API handlers; Java checks compile/execute real sources. The browser
checks above additionally go through the running app and its screens. No hosted integration or
physical-device check is implied. The focused 26/26 command repeats the names under
`module-prerequisites.test.mjs` and `subject-module-sharing.test.mjs` below.

### tests/api-router.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ router: path parameters, query, cookies, and JSON body reach the handler
- ✔ router: middleware passes on with next(), stops by responding, and next(error) reaches the error handler
- ✔ router: cookies, 204, unknown routes, bad JSON, and size limits
- ✔ router: the larger JSON body cap is scoped to the module-upload route, not every route
- ✔ routes: register, stay signed in with the cookie, get a live pass, sign out
- ✔ routes: a chat message's live signal finishes sending before the reply (CKB-006)

### tests/browser-java-bridge.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ browser bridge: committed JAR matches its Java source
- ✔ browser bridge: packages, inheritance, input and Unicode run together
- ✔ browser bridge: compile error, stderr and crash after expected output all fail
- ✔ browser bridge: combined stdout/stderr stops at 64 KB and missing classes cannot survive another run
- ✔ browser bridge: flat browser strings become distinct source folders, including duplicate class names

### tests/browser-java-client.test.mjs

Command: `sg docker -c 'npm test'`.

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

Command: `sg docker -c 'npm test'`.

- ✔ online module tasks: browser results check the task target and cannot reuse a sample pass
- ✔ online Java progress: browser evidence obeys membership, exact output, successful exit, saved version and part access
- ✔ online Java mode: missing address fails clearly; unsafe addresses are refused; legacy server mode remains available
- ✔ online sample first: server-owned stages reject edited samples and save verification separately from task completion

### tests/browser-java-runtime.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ browser runtime: only the parent starts Java; flat strings preserve duplicate filenames for the bridge
- ✔ browser runtime: whole-file downloads preserve binary compiler JARs without Range support (CKB-056)
- ✔ browser runtime: missing compiler assets report the filename and stage without starting Java (CKB-056)
- ✔ browser runtime: failed compiler downloads report their stage and do not compile (CKB-056)
- ✔ browser runtime: invalid sources and download failure report failure instead of progress
- ✔ browser runtime: public asset policy permits CheerpJ's required nested runtime frame only (CKB-047)
- ✔ browser runtime: live input waits for authenticated matching answers and streams output before completion (CKB-049)
- ✔ browser runtime: live input cannot exceed the existing total input limit

### tests/classroom-ui.test.mjs

Command: `sg docker -c 'npm test'`.

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

Command: `sg docker -c 'npm test'`.

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

Command: `sg docker -c 'npm test'`.

- ✔ course modules: teacher uploads, class members read, only the teacher may upload or delete

### tests/java-run-progress.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ Java progress: idle, finished and failed runs leave no loading indicator
- ✔ Java progress: saving, starting and checking are visible accessible status messages
- ✔ Java progress: waiting for an answer replaces the working message

### tests/java-suggestions.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ Java suggestions: keywords, standard names and print statements match typed prefixes
- ✔ Java suggestions: current-file names are unique and ignore comments and string literals
- ✔ Java suggestions: comments, escaped strings, characters and text blocks never open suggestions
- ✔ Java suggestions: empty, short, selected, numeric and unsupported member prefixes stay quiet
- ✔ Java suggestions: insertion replaces the full word and preserves surrounding code
- ✔ Java suggestions: print snippets place the caret inside the parentheses
- ✔ Java suggestions: the main statement keeps existing indentation and puts the caret in its body

### tests/kb-search.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ kb:search finds the matching bug record first
- ✔ kb:search says so when nothing matches

### tests/landing-pages.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ landing pages: class roster, a student's own module summary, and a teacher's view of a student's progress
- ✔ class list and creation: a teacher creates classes, a student joins one, and one class's workspace never bleeds into another's

### tests/live-classes.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ live invitations: all live classes are offered, dismissal hides only that session, and a new activity invites again
- ✔ live invitations: refresh preserves dismissal, ending a session clears it, and a stopped presentation can invite again
- ✔ live invitations: receive-only listeners refresh on start, stop, and reconnect; cleanup removes their channels and ignores late events
- ✔ live invitations: entering or leaving the workspace waits for old channels to close before reusing their topics

### tests/module-activities.test.mjs

Command: `sg docker -c 'npm test'`.

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

Command: `sg docker -c 'npm test'`.

- ✔ module step migration: additive history preserves work, completion and submissions; repeats safely and permits old readers

### tests/module-availability.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ module availability: unknown modules and step ids cannot create progress (CKB-018)
- ✔ module availability migration: preserves existing content and work, opens existing modules, defaults new uploads closed, and safely reruns
- ✔ module availability: first part opens automatically, future content is withheld, and teacher switches cannot bypass student progress
- ✔ module availability: reupload preserves work and new parts require their preceding activities
- ✔ module availability: the same module in two classes has independent switches, and concurrent teacher edits keep both changes
- ✔ module availability: modules without a performance task reject its switch and submission

### tests/module-prerequisites.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ module prerequisites: oldest unfinished ancestor blocks later weeks even when the immediate predecessor passed
- ✔ module prerequisites: sample verification, failed tasks and superseded ids cannot unlock a later module
- ✔ module prerequisites: missing and cyclic links give teacher repair messages without looping
- ✔ module prerequisites: live class permits the weekly chain but still blocks unrelated modules
- ✔ module prerequisites: banner names the earliest week and offers Continue; missing modules offer no dead button
- ✔ blocks content before prerequisites
- ✔ blocks progress before prerequisites
- ✔ blocks module project before prerequisites
- ✔ blocks paper record before prerequisites
- ✔ blocks activity before prerequisites
- ✔ blocks laptop run before prerequisites
- ✔ blocks browser result before prerequisites
- ✔ blocks personal open before prerequisites
- ✔ blocks personal save before prerequisites
- ✔ blocks submission before prerequisites
- ✔ live class catch-up, ordered unlock, teacher preview and student/class isolation
- ✔ module prerequisites: real routes reject every later-module entry, isolate students/classes and preserve saved work

### tests/module-progress.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ module progress: step checklist, exit slip, and both performance-task versions (new feature, no prior CKB)
- ✔ module progress: two simultaneous first touches of a module don't 500 (write race)
- ✔ module progress: a module in two classrooms doesn't share one student's progress (classroom scoping)
- ✔ module progress: two simultaneous performance-task submissions don't lose one (write race)

### tests/module-resume.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ module resume: two completed Monday steps reopen at Day 2 Step 3 after saved progress is reloaded
- ✔ module resume: verifying a sample, failing a task or legacy passes cannot skip an unfinished alteration
- ✔ module resume: closed lessons and locked steps are excluded; completed modules have no unfinished step
- ✔ module exercises: revised requirements get separate identities and retain unsolved samples

### tests/module-run-feedback.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ module feedback: prominent sample verification does not claim task completion
- ✔ module feedback: distinguishes old sample, wrong output, new completion and earlier completion
- ✔ module feedback: sample-first editor shows baseline target before allowing edits

### tests/module-weekly-active.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ module weekly active + shared project: pick, lock, and project file round-trip

### tests/realtime.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ realtime: an unrelated topic's subscriber never waits on another topic's pending removal
- ✔ realtime: resubscribing the same topic waits for its own pending removal to finish first (CKB-017)
- ✔ realtime: signing out clears pending cleanup so the next sign-in's subscriber never waits on the discarded client's teardown
- ✔ offline: classroom devices reach local Supabase through the laptop's address
- ✔ throttle sends at most once per interval and never drops the newest value
- ✔ channel rules: members join, outsiders are refused, only the teacher broadcasts to the class
- ✔ browser pass cannot read tables directly

### tests/rolling-module-tasks.test.mjs

Command: `sg docker -c 'npm test'`.

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

Command: `sg docker -c 'npm test'`.

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

Command: `sg docker -c 'npm test'`.

- ✔ session: student expires at fifteen minutes and teacher at two hours, despite background reads (CKB-051)
- ✔ session: only explicit activity renews the role deadline, accounting for the delayed last gesture
- ✔ session: old seven-day cookies, forged cookies and invalid renewal bodies are refused
- ✔ session: activity keeps the seven-day maximum and secure cookie settings
- ✔ session: live passes cannot outlast inactivity or renew an expired sign-in

### tests/student-classroom-entry.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ student entry: a single membership opens that classroom even with an obsolete saved choice
- ✔ student entry: multiple memberships reopen only a remembered class the student still belongs to
- ✔ student entry: no membership never opens a saved or invented classroom
- ✔ student entry: teachers, required password reset and explicit Classes navigation do not auto-enter
- ✔ student entry: remembered classrooms stay separate for different accounts on a shared browser
- ✔ student entry: unavailable browser storage still permits single-class entry and safe multi-class choice
- ✔ student chooser: a former class-home selection cannot resurrect the removed module landing page
- ✔ teacher chooser: class creation and the teacher dashboard entry remain available

### tests/student-module-activity-ui.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ module activity screen: signing in starts safely before a class or project exists (CKB-044)
- ✔ module activity screen: main Java editor has project tabs, sample output, Console, Run code and Save work

### tests/subject-module-sharing.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ class creation requires exactly Java or Net MVC and an assigned class cannot switch subjects
- ✔ upload once reaches same-subject classes, excludes the other subject and another teacher, and includes later classes
- ✔ members read only their classes; students and another teacher cannot choose subjects, share, upload or delete
- ✔ shared corrections refresh list, reader, student summary and dashboard without mixing progress, drafts or submissions
- ✔ shared-only prerequisites unlock per class and never reuse another class's completion
- ✔ old uploads stay readable before subject selection and remain backed up; conflicting sharing needs the selected current version
- ✔ shared deletion removes access and weekly picks across that subject while preserving backups, student work and the other subject
- ✔ subject modules: one subject per class, one upload per teacher/subject, separate student work
- ✔ subject library migration: preserves old uploads and student work, repeats safely, and restricts subjects and direct access

### tests/teacher-dashboard-ui.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ teacher dashboard: navigation maps Students and Curriculum and exposes loading instead of fake totals
- ✔ teacher dashboard: avatar styles cannot override the existing classroom avatar (CKB-039)

### tests/teacher-dashboard.test.mjs

Command: `sg docker -c 'npm test'`.

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

Command: `sg docker -c 'npm test'`.

- ✔ teacher web projects: lists every personal web project for the selected student and class, and reads saved files on demand
- ✔ teacher web projects: only the owning teacher reads a current class member's projects; guesses and write methods are refused
- ✔ teacher web projects: empty lists and files are readable, repeated reads never save, and a student's save appears on refresh
- ✔ teacher web preview: blocks network resources before student code while preserving the doctype and console line map
- ✔ teacher web preview: allows eval/Function so a saved eval()-based calculator behaves the same as it does for the student
- ✔ teacher web preview: headless pages retain console locations and missing HTML keeps its existing warning

### tests/web-workspace.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ inlines linked CSS and JavaScript, no external loads
- ✔ maps document lines back to the student's file and line
- ✔ capture script sits on the <head> line and does not shift lines
- ✔ works without <head>, and warns about missing files
- ✔ a </script> inside JavaScript cannot break out of the inlined script
- ✔ no index.html gives a friendly message
- ✔ file names must fit the project language

### tests/week12-week13-modules.test.mjs

Command: `sg docker -c 'npm test'`.

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

### tests/week15-week21-modules.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ Weeks 12–21: actual curriculum links resolve and current tasks control ordered access
- ✔ Week 15: upload accepts additions and every original lesson value survives
- ✔ Week 16: upload accepts additions and every original lesson value survives
- ✔ Week 17: upload accepts additions and every original lesson value survives
- ✔ Week 18: upload accepts additions and every original lesson value survives
- ✔ Week 19: upload accepts additions and every original lesson value survives
- ✔ Week 20: upload accepts additions and every original lesson value survives
- ✔ Week 21: upload accepts additions and every original lesson value survives
- ✔ Weeks 15–21: old samples and headless messages cannot pass new tasks or bypass their sample gate
- ✔ Week 15 Step 1: disk sample and alteration
- ✔ Week 15 Step 2: disk sample and alteration
- ✔ Week 15 Step 3: disk sample and alteration
- ✔ Week 15 Step 4: disk sample and alteration
- ✔ Week 15 Step 5: disk sample and alteration
- ✔ Week 15 Step 6: disk sample and alteration
- ✔ Week 15 Step 7: disk sample and alteration
- ✔ Week 15 Step 8: disk sample and alteration
- ✔ Week 15 Step 9: disk sample and alteration
- ✔ Week 15 Step 10: disk sample and alteration
- ✔ Week 15: original disk samples and each independent alteration match real Java output
- ✔ Week 16 Step 1: sample and alteration
- ✔ Week 16 Step 2: sample and alteration
- ✔ Week 16 Step 3: sample and alteration
- ✔ Week 16 Step 4: sample and alteration
- ✔ Week 16 Step 5: sample and alteration
- ✔ Week 16 Step 6: sample and alteration
- ✔ Week 16 Step 7: sample and alteration
- ✔ Week 16: complete samples and meaningful alterations run through the classroom laptop runner
- ✔ Week 17 Step 1: sample and alteration
- ✔ Week 17 Step 2: sample and alteration
- ✔ Week 17 Step 3: sample and alteration
- ✔ Week 17 Step 4: sample and alteration
- ✔ Week 17 Step 5: sample and alteration
- ✔ Week 17 Step 6: sample and alteration
- ✔ Week 17: complete samples and meaningful alterations run through the classroom laptop runner
- ✔ Week 18 Step 1: sample and alteration
- ✔ Week 18 Step 2: sample and alteration
- ✔ Week 18 Step 3: sample and alteration
- ✔ Week 18 Step 4: sample and alteration
- ✔ Week 18 Step 5: sample and alteration
- ✔ Week 18: complete samples and meaningful alterations run through the classroom laptop runner
- ✔ Week 19 Step 1: sample and alteration
- ✔ Week 19 Step 2: sample and alteration
- ✔ Week 19 Step 3: sample and alteration
- ✔ Week 19 Step 4: sample and alteration
- ✔ Week 19: complete samples and meaningful alterations run through the classroom laptop runner
- ✔ Week 21 Step 1: sample and alteration
- ✔ Week 21: complete samples and meaningful alterations run through the classroom laptop runner
- ✔ Week 15: classroom file access stays blocked while desktop exercises remain explicitly separate

### tests/weekly-java-project-ui.test.mjs

Command: `sg docker -c 'npm test'`.

- ✔ weekly Java editor: module shows sample output and only module source
- ✔ weekly Java editor: personal shows its own source, input and explicit submission
- ✔ weekly Java editor: alteration shows its own target and remembers completed tasks

