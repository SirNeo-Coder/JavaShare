# Stage-three item 5: teacher review of saved student web projects

Verified 2026-10-18 on `codex/teacher-web-projects`, based on `ae234a6`
(`codex/lesson-availability`, PR #11). Detailed proposal and workflow-change classification
approved by the teacher before application edits. No migration, new dependency, new live channel,
secret change, or hosted service change.

## Results and unresolved issues

- **51/51 automated tests pass, 0 failures, 0 skips**, command `sg docker -c 'npm test'`.
  All five new tests also passed again after the deliberate protection-removal checks.
- **Build passes**, `sg docker -c 'npm run build:all'`. An earlier direct sandbox build compiled
  but stopped with "Could not parse output from TypeScript's --showConfig". The same build
  succeeded outside that restriction. No source workaround or compiler setting was added.
- **Lint: 0 errors, 9 existing warnings**, `npm run lint` (seven image warnings; existing hook
  dependency warnings in page and ModuleViewer). `npx tsc --noEmit` passed; the final production
  build also completed its type check. `git diff --check` passes.
- Existing preview/class-home baseline: 9/9 passed before edits. Knowledge-base search checks:
  2/2 passed again after adding CKB-020/021/022.
- **Fixed CKB-020:** read-only source trapped Tab. Failed in the real app before the one-line
  guard; after rebuilding, Tab and Shift+Tab left the source field, read-only typing had no
  effect, and editable student source still inserted four spaces on Tab.
- **Unresolved CKB-021:** the pre-existing `PUT /api/files/:fileId` lets a class teacher save
  over a student's personal file through a direct request. Reproduced with one disposable file,
  then restored its content. The new viewer has only GET routes and no save controls, but that
  does not repair the older API's write permissions. No permission rewrite was approved here.
- **Unresolved CKB-022:** the unchanged student preview permits network requests. A local-only
  counter received no requests while the teacher preview ran, then received `/fetch` when the
  same saved script ran in the student preview. The teacher wrapper's policy is new and scoped
  to this feature; do not claim the older student renderer now blocks network resources.
- **Not verified:** hosted Supabase/Cloudflare/online deployment, Windows, mobile layout, other
  browser engines, a second physical device, physically disconnecting the internet, every
  navigation/network escape possible in student JavaScript, or a full audit of old write APIs.
  Infinite JavaScript loops retain the existing browser-tab freeze risk. Saved-copy naming uses
  an existing prompt that the in-app browser does not support; source saving completed, but
  named-copy creation was not verified here.

## Real production app checks

Used separate teacher/student sign-ins on `127.0.0.1:3001` and `localhost:3001`, local Supabase,
and laptop Java enabled. Temporary users/classes/projects, request counter, tabs and production
server were removed afterward. The existing port-3000 app and Docker services were left running.

1. Teacher class home showed **View web projects** beside each student's **View module progress**.
   Alex's list had Portfolio and Click counter. Selecting Portfolio showed only its saved
   index.html/script.js/style.css, no editing/save controls, and no preview until **Run preview**.
2. Switched file tabs; read-only CSS rejected a typed character. Ran the page: linked project CSS
   rendered, clicking its button changed Clicks: 0 to Clicks: 1. Console showed `Portfolio ready`
   at script.js:1, standards mode `CSS1Compat` at script.js:2, parent-page access blocked at
   script.js:5, the deliberate `missingFunction` error at script.js:7, and blocked fetch at
   script.js:6. Errors in this fixture are deliberate checks, not failed feature runs.
3. Fixture HTML referenced a separate local HTTP server for an image, stylesheet, and script;
   its JavaScript also attempted fetch. The new teacher preview produced no requests at that
   server, whose health endpoint was checked separately. The later student run proved the
   counter was reachable and exposed CKB-022. No internet destination was contacted by the probe.
4. Student edited the Portfolio HTML without saving; teacher **Refresh** still loaded the old
   saved HTML. Student **Save work** persisted version 3; teacher Refresh then loaded the
   correction. Refresh removed old preview/output and required a new Run preview. The existing
   named-copy prompt reported unsupported in the browser after the file save; no named copy
   is claimed. Final rerun showed the corrected heading with the same correct console locations.
5. With a preview open, removed only the disposable student's class membership. Teacher Refresh
   showed **Student is not in this classroom**, removed all source fields/iframes, and disabled
   Run preview. Restored membership and the rebuilt app could read the project again. No stale
   preview remained after the failed refresh.
6. Back to projects cleared the preview and opened Click counter independently. Removed its
   disposable files; Refresh showed **This project has no saved files yet**, Run preview disabled.
   Blair's separate list showed **No web projects saved for this student in this class yet**.
7. Closed the dialog and opened class B: the same Alex had only Class B page, not class A's
   projects. Escape closed the dialog. Returned to class A and repeated opening/running the
   corrected Portfolio on the final build; screenshot saved as
   `/tmp/codeshare-teacher-web-review-final.jpg` and shown in the final chat.
8. CKB-020 keyboard proof: before fix Tab remained on TEXTAREA; after fix focus left the textarea
   on Tab/Shift+Tab. Editable student HTML still gained four spaces on Tab. Switched to
   **My Practice Code**, ran laptop Java, and saw **Hello, CodeShare!**.

The list's load-error rendering was inspected in code, not separately forced in the browser;
the detail refresh's real access-error/recovery path was exercised. Automated tests cover
unknown/missing/non-web/activity/wrong-student/wrong-class/missing-member requests separately.
No frontend component-test harness exists; these interactive checks are through the real app.

## Offline path

Ran `sg docker -c 'npm run classroom:offline'`: local configuration and build succeeded, then
the launcher reused the pre-existing development server on port 3000. Left it untouched.
Browser checks used a separate production `next start` on 3001 with the same local Supabase
settings and laptop Java enabled. This proves the local production path, not a fresh
launcher-owned instance, another Wi-Fi device, or a physically disconnected network.

## Deliberate failure proof

- Removed the student-team restriction from the new list/detail queries. The test **teacher web
  projects: lists every personal web project for the selected student and class, and reads saved
  files on demand** failed: actual list contained three ids rather than two, including another
  student's project. Restored the restriction.
- Removed `teacherClassroom` from the shared teacher/student lookup. **teacher web projects: only
  the owning teacher reads a current class member's projects; guesses and write methods are
  refused** failed: another teacher got 200 instead of 403. Restored the ownership check.
- Removed the teacher preview policy. **teacher web preview: blocks network resources before
  student code while preserving the doctype and console line map** failed its policy-prefix
  assertion. Restored the policy. An initial sandbox invocation failed at the runner level;
  it was rerun outside that restriction and the actual assertion failure was verified.
- Commands: `sg docker -c 'node --test --test-name-pattern="lists every" tests/teacher-web-projects.test.mjs'`,
  then the same command with patterns `only the owning` and `blocks network resources`.
- Restored source: `sg docker -c 'node --test tests/teacher-web-projects.test.mjs'`, **5/5 pass**.
  Full suite **51/51 pass** on the fixed implementation. Final build and browser checks use the
  restored protections. No deliberate mutation remains. Not every denial/edge case was mutated.
- CKB-020 uses an actual failing-before/passing-after browser key interaction, rather than a
  fabricated source-text unit test. CKB-021/022 remain unresolved and have no passing fix proof.

## Test levels

- New API tests run real handlers and local Supabase: ownership/membership/scoping, metadata vs
  file loads, non-web/activity exclusion, refused write methods on new routes, missing data,
  repeated-read preservation and student save/refresh. They do not fix older file-write APIs.
- Two new pure-rule tests check teacher preview policy placement, unchanged doctype/line map,
  headless pages and missing HTML. Browser/request-counter checks verify actual enforcement.
- Existing schema, renderer, invitation, router, progress, and local Realtime tests remain in
  the full suite. UI rendering, source read-only behavior, keyboard navigation, and preview
  interaction were checked manually in the production app; there is no UI unit harness.

## Full runner names and marks by file

Command: `sg docker -c 'npm test'`. Runner marks/names retained; durations omitted.

### `tests/api-router.test.mjs`

```text
✔ router: path parameters, query, cookies, and JSON body reach the handler
✔ router: middleware passes on with next(), stops by responding, and next(error) reaches the error handler
✔ router: cookies, 204, unknown routes, bad JSON, and size limits
✔ router: the larger JSON body cap is scoped to the module-upload route, not every route
✔ routes: register, stay signed in with the cookie, get a live pass, sign out
✔ routes: a chat message's live signal finishes sending before the reply (CKB-006)
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
```

### `tests/course-modules.test.mjs`

```text
✔ course modules: teacher uploads, class members read, only the teacher may upload or delete
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

### `tests/module-availability.test.mjs`

```text
✔ module availability: unknown modules and step ids cannot create progress (CKB-018)
✔ module availability migration: preserves existing content and work, opens existing modules, defaults new uploads closed, and safely reruns
✔ module availability: new modules withhold closed content and reject direct progress writes; only the class teacher can open them
✔ module availability: closing and reopening preserves work and the full-module meter; reupload preserves settings and new lessons start closed
✔ module availability: the same module in two classes has independent switches, and concurrent teacher edits keep both changes
✔ module availability: modules without a performance task reject its switch and submission
```

### `tests/module-progress.test.mjs`

```text
✔ module progress: step checklist, exit slip, and both performance-task versions (new feature, no prior CKB)
✔ module progress: two simultaneous first touches of a module don't 500 (write race)
✔ module progress: a module in two classrooms doesn't share one student's progress (classroom scoping)
✔ module progress: two simultaneous performance-task submissions don't lose one (write race)
```

### `tests/realtime.test.mjs`

```text
✔ offline: classroom devices reach local Supabase through the laptop's address
✔ throttle sends at most once per interval and never drops the newest value
✔ channel rules: members join, outsiders are refused, only the teacher broadcasts to the class
✔ browser pass cannot read tables directly
```

### `tests/teacher-web-projects.test.mjs`

```text
✔ teacher web projects: lists every personal web project for the selected student and class, and reads saved files on demand
✔ teacher web projects: only the owning teacher reads a current class member's projects; guesses and write methods are refused
✔ teacher web projects: empty lists and files are readable, repeated reads never save, and a student's save appears on refresh
✔ teacher web preview: blocks network resources before student code while preserving the doctype and console line map
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

```text
ℹ tests 51
ℹ suites 0
ℹ pass 51
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Node's frontend-helper imports also print MODULE_TYPELESS_PACKAGE_JSON warnings, including the
new teacher helper under the same existing package convention. No package-type change was made.
