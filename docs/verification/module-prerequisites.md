# Module prerequisite verification

2026-10-21. Branch `codex/module-prerequisites`, based on main at `9fba8a7` (merged PR #33).
Implementation `20d5931`; [PR #35](https://github.com/SirNeo-Coder/JavaShare/pull/35).

## Outcome

Later modules require all current module activities in their complete predecessor chain to pass.
The banner names the oldest unfinished week and Continue opens its saved unfinished step.
Personal performance submissions and handwritten liplets remain separate. Live class allows
catch-up in the weekly module's ancestors. Missing uploads and cycles give teacher-repair messages.
All access checks run before returning module content or creating/updating progress. No migration.

## Required checks

- `sg docker -c 'npm run build:all'`: passed (production frontend and backend).
- `sg docker -c 'npm run classroom:offline -- --build-only'`: passed, using existing local
  Supabase without a reset; includes the final frontend/backend build.
- `sg docker -c 'npm run lint'`: zero errors, eight existing warnings (seven image warnings
  and one existing effect dependency warning). No new warning suppression.
- `sg docker -c 'npm test'`: 238 passed, zero failed/cancelled/skipped/todo.
- Real production browser checks: 10 passed, zero failed/skipped across offline and online modes.
- `git diff --check`: passed.

The original checkout and its other-chat work were preserved. No hosted services, merge,
existing migrations, project identities or module JSON were changed.

## What the checks prove

Pure checks cover oldest-first order, current task ids, legacy sample modules, missing uploads,
cycles and live-class ancestor access. Rendered markup checks the banner and Continue label.
Real route checks use disposable local Supabase users/classes and exercise content, progress,
activity preparation, module saves, execution, browser results, personal open/save and submission.
They prove another student's or class's passes cannot unlock work and denied requests preserve
all existing later files, per-step history, completions and submitted snapshots. Existing rolling
project tests now supply an uploaded, completed predecessor to match the approved rule.

Browser checks use built production servers on 3022 (laptop Java) and 3020 (online/browser Java),
both backed only by local Supabase, with the existing public Java runner served separately on 3021.
They click the banner and Continue action during live class, restore the saved next step, run
actual Java to unlock Weeks 13 and 14 in order, reload, preserve later work and personal snapshots,
check both Projects shortcuts after an earlier task identity changes, and show the missing-upload
message. Teacher preview access is checked through authenticated requests. Offline rejects all
non-local browser requests and asserts that none were attempted. Online actually runs CheerpJ
Java 8, retaining its existing attribution; no fabricated browser result is used by these checks.

## Deliberate-break proof

Temporarily removed the body of `enforceStudentModuleAccess`, keeping the regressions in place.
`sg docker -c 'node --test --test-reporter=spec --test-name-pattern="real routes" tests/module-prerequisites.test.mjs'`
failed **blocks content before prerequisites**: the response was 200 instead of required 403.
Other guarded paths and the preservation assertion also failed. Restored the source in a finally
block, then ran `sg docker -c 'node --test --test-reporter=spec tests/module-prerequisites.test.mjs'`:
all 17 checks passed. The final full suite also passed.

## Initial failures corrected

- Native Node tests do not support TypeScript constructor parameter properties. Replaced that
  syntax with ordinary declared fields/assignments; production and native tests then passed.
- The new preservation assertion initially expected only the saved personal Main.java. Existing
  project opening correctly adds missing supporting classes. The corrected assertion verifies
  that saved Main.java, module files and submitted snapshots retain their contents.
- The browser fixture's batch insert omitted required empty objects on one row, so setup failed;
  supplied them and asserted the insert result. Test steps also needed distinct displayed numbers.
- Browser automation typed before the asynchronous editor-opening transition finished and
  initially did not respect the laptop run-rate limit. It now waits for the correct module/editor
  and the existing delay, and fails promptly on a run error/mismatch.
- A verification build invalidated assets in still-running local servers. Restarted the two
  task-owned servers after the final build and repeated the final browser checks successfully.
These intermediate failures are not counted as final passes.

## Limits and rollout

Hosted Cloudflare/Supabase rollout, live Week 13/14 uploads, physical disconnected Wi-Fi student
devices, Windows and non-Chromium browsers remain unverified. Online browser behavior was tested
locally, not on a deployed Worker. Existing students' later work stays stored but is blocked until
current prerequisites pass. The displayed percentage still includes performance submissions;
readiness for the next module uses activity passes. Project naming/independent IDs remain separate.

The teacher reported PR #33 merged, the history migration verified, Cloudflare Ready, and Week 12
uploaded. Week 13/14 live uploads remain unverified. No new migration is required here. After
reviewing/merging the PR, use the existing deployment process and ensure all linked module JSON
files are uploaded in the intended class. No assistant hosted action was performed. Temporary verification servers were stopped; the
browser fixtures removed their classrooms and accounts. Final cleanup found zero test classrooms.

## Named automated results by file

Command for all files below: `sg docker -c 'npm test'`. Marks/names are the runner's final passing
results, grouped by source file; durations omitted. The 17 new checks are in module-prerequisites.

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

### tests/module-exercise-java8.browser.mjs

- ✔ kb:search finds the matching bug record first
- ✔ kb:search says so when nothing matches

### tests/module-prerequisites.test.mjs

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

## Named browser results

File: `tests/module-prerequisites.browser.mjs`.
Command (local servers described above must already be running):

```sh
sg docker -c 'CODESHARE_PLAYWRIGHT_MODULE=/home/ireneo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/home/ireneo/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome node --test --test-reporter=spec tests/module-prerequisites.browser.mjs'
```

- ✔ Week 14 names Week 12 and Continue restores the next unfinished saved step during live class
- ✔ Week 13 must pass before Week 14 opens; reload retains the ordered unlock and Week 14 work
- ✔ both Projects shortcuts recheck changed prerequisites and offer Continue without overwriting later work
- ✔ missing prerequisite has a teacher-upload message; teacher preview remains available
- ✔ prerequisites offline: banner, saved-step resume and ordered unlock through the real app
- ✔ Week 14 names Week 12 and Continue restores the next unfinished saved step during live class
- ✔ Week 13 must pass before Week 14 opens; reload retains the ordered unlock and Week 14 work
- ✔ both Projects shortcuts recheck changed prerequisites and offer Continue without overwriting later work
- ✔ missing prerequisite has a teacher-upload message; teacher preview remains available
- ✔ prerequisites online: banner, saved-step resume and ordered unlock through the real app

## Main refresh and conflict resolution — 2026-10-22

PR #35 was reapplied on main `c770731` (Java suggestions, PR #34). Both sets of
progress notes, problem-index entries and prompt records were retained. Independent Java
suggestion and prerequisite banner styles were both retained where they met at the end
of the stylesheet. No feature logic or test fixture was changed by the resolution.

- PASS `npm run build:all`: production frontend and backend.
- PASS `npm run lint`: zero errors, the same eight existing warnings.
- PASS `npm test`: **245/245**, zero failures and zero skips. All previous named
  tests above passed again; the seven newly inherited tests are listed below.
- PASS preservation comparison: original feature application/config/test files are unchanged;
  only already-merged main editor additions were incorporated. For #36, all original curriculum
  JSON/PDF/Word/supporting-file bytes are unchanged.
- PASS documentation checks: no conflict markers, unique problem case numbers, existing
  targets for every problem-index case link.
- NOT REPEATED for this refresh: browser sessions, offline launcher build, document rendering,
  mutation proofs and hosted rollout. Earlier evidence and limits above still apply.

The teacher requested conflict repair for #35, #36 and #37 together. Main retains CKB-059
(Java caret); prerequisites use CKB-060, curriculum CKB-061, subject sharing CKB-062.
PR #36 stays a draft for curriculum review. No pull request was merged or deployed.

### `tests/java-suggestions.test.mjs`

Command: `npm test`. These isolated rule checks are new to this feature branch from main.

- ✔ Java suggestions: keywords, standard names and print statements match typed prefixes
- ✔ Java suggestions: current-file names are unique and ignore comments and string literals
- ✔ Java suggestions: comments, escaped strings, characters and text blocks never open suggestions
- ✔ Java suggestions: empty, short, selected, numeric and unsupported member prefixes stay quiet
- ✔ Java suggestions: insertion replaces the full word and preserves surrounding code
- ✔ Java suggestions: print snippets place the caret inside the parentheses
- ✔ Java suggestions: the main statement keeps existing indentation and puts the caret in its body
