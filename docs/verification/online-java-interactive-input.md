# Interactive online Java verification — 2026-10-20

Branch: codex/online-java-interactive-input, based on main after PR #21.

## Required checks

- npm run build:all: passed; production Next.js build and backend TypeScript.
- npm run lint: 0 errors, 8 existing warnings (images and existing live-effect dependencies).
- sg docker -c 'npm test -- --test-reporter=spec': 125 passed, 0 failed, 0 cancelled, 0 skipped.
- npx wrangler deploy --dry-run --config java-runtime/wrangler.jsonc --outdir outputs/interactive-java-runtime: passed, 9 files, no bindings, no deployment.
- sg docker -c 'npm run classroom:offline -- --check': offline configuration ready.
- git diff --check: passed.

## Real app checks

Actual production app, disposable accounts/classes in local Supabase, actual CheerpJ 4.3/Java 8.
App online at 127.0.0.1:3006 (teacher) and localhost:3006 (student); separate public
runner served locally at localhost:3007 with the committed CSP. No hosted setting changed.

- Teacher: Main.java + Greeter.java; no input before Run; System.out.print prompt appeared
  before entering an answer. Entered Zoë 🐕, 7, then an empty line in three successive waits.
  Result: Name? Favourite number? Blank answer? Hello, Zoë 🐕, 7, blank=true.
- Stop during an unanswered question preserved the prompt and displayed Execution stopped.
- Endless loop stopped after five seconds. A correct run then printed Recovered after Stop and timeout.
- Module sample used its supplied JSON input 14 without any live-input control, printed
  Sample: 14 and passed. The next part opened. Second sample printed 3/2/1 and passed.
- Personal performance-task project contained supporting classes; two live answers Neo and 27
  printed Your name? Your number? Hello, Neo: 27. Its status remained Personal project;
  a real progress GET still showed 50%, both sample/own submissions null, and only the two
  module sample pass records. Running did not submit or advance another step.
- Offline production on port 3008, LOCAL_JAVA_EXECUTION=true and CODESHARE_LAPTOP=true
  with the online runner URL also set: existing Program input 7 produced Laptop: 7.
  DOM inspection confirmed zero Java execution frames and no CheerpJ logo.
  Existing user server on port 3000 was left running.

Screenshots are local, ignored verification artifacts under outputs/interactive-java:
teacher-interactive.png, personal-interactive.png and offline-java.png.

## Regression proof and test levels

A temporary diagnostic using the original helper and Scanner reproduced No line found
with empty input and succeeded with Neo supplied before execution.

Temporarily disabled the client's live-input request branch. The CKB-049 regression
failed (the run incorrectly timed out during typing). Restored the fix; all 16
client/runtime checks passed, then the full 125-test suite above passed.

Client protocol tests exercise message ownership, stale-question rejection, prompt streaming,
blank/Unicode input, cumulative active time, waiting expiry, Stop, caps, startup cancellation
and independent deployment compatibility using browser mocks and a controlled clock.
Runtime tests exercise its Java/native message bridge in a VM. Those are isolated rule checks,
not a substitute for CheerpJ. Existing bridge checks use a real JDK and ensure the committed JAR
matches its Java source. Existing route tests use local Supabase; offline activity tests run javac.
The browser checks above exercise the real app, Java runtime, Console and module progress.

## Failures, warnings and untested areas

The first focused run had 22 passes and one fixture failure: the updated mock returned
a literal backslash-n instead of a newline. Corrected the fixture; no final test failures/skips.
The initial local Workers start refused compatibility date 2026-10-20 because the installed
binary supports only 2026-10-19. Used a command-line local-only override for browser testing;
committed/hosted settings were unchanged. CheerpJ logged HTTP-range warnings on the local
asset server; the actual prompt/input runs listed above completed. Hosted interactive
execution and hosted range handling were not verified by this local test.
The two-minute idle limit was checked with a controlled clock, not a real two-minute browser wait.
No physically disconnected-internet, other-Wi-Fi-device, Windows or other-browser test.
Offline interactive input was outside the approved slice; its existing input-before-Run remains.
No secure grading claim: browser evidence is still approved practice evidence only.

## Full test names grouped by file

Command for every file below: sg docker -c 'npm test -- --test-reporter=spec'.
Pass marks and names are copied from the runner; timings omitted.

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

