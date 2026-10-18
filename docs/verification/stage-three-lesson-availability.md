# Stage-three item 4: lesson and performance-task opening controls

Verified 2026-10-18 on `codex/lesson-availability`, based on `2311fab` (`codex/live-class-invitation`).
Implementation/evidence commit: `0b0a76b`, [PR #11](https://github.com/SirNeo-Coder/JavaShare/pull/11).
Teacher approved the detailed proposal as a workflow change. No hosted service was changed.

## Results and limits

- **46/46 automated tests pass; 0 failures, 0 skips**, command `sg docker -c 'npm test'`.
- **Build passes**: `npm run build:all` ran inside `sg docker -c 'npm run classroom:offline'`.
  The launcher checked local settings and reused the already-running port-3000 development
  server. That server was left untouched. Browser checks used a separate production
  `next start` on port 3001, with local Supabase and laptop Java enabled. This was not a fresh
  launcher-owned server on port 3000, nor a physical network disconnection test.
- **Lint: 0 errors, 9 existing warnings**, `npm run lint`. Seven image warnings (one in
  CodeEditor, six in page), and existing hook-dependency warnings in ModuleViewer and page.
  An initial lint run caught four new forbidden local `module` variable names; renamed them
  to `courseRow`, then lint passed with only the existing warnings.
- `npx tsc --noEmit` passes. `git diff --check` passes.
- Local migration applied with `npx supabase migration up --local`. The actual local database
  had zero modules/progress rows beforehand, so its unchanged hashes alone do not prove data
  preservation. The automated isolated-schema test seeds real module content, unrelated data,
  and a saved submission before executing the actual migration SQL and checking preservation,
  open backfill, closed defaults, and safe repeat execution.
- The previous app's repository from `2311fab` was also run against the migrated local database:
  upload, full read, and progress save still work; new defaults stay closed for the new app;
  old-writer corrections retain new teacher choices; new app reads old saved progress as 17%.
  This is a repository/database compatibility check, not an old-browser deployment test.
  Its first setup attempt used a lowercase class code and was rejected by the existing database
  constraint; the disposable fixture was corrected to uppercase and the check passed.
- **Not verified:** hosted Supabase/Cloudflare/online Java, Windows, another physical device,
  mobile layout, other browser engines, physically disconnected internet, or every possible
  teacher/student timing race. No hosted migration/deployment was attempted.
- No frontend unit-test harness exists. Browser interactions below exercise the real production
  app; the rule tests listed separately do not replace those checks.

## Real app checks (teacher and student, local production build)

1. Opened the same new module as both roles. Teacher preview showed all content with three
   unchecked **Open to students** controls. Student saw two lesson titles and the task title,
   each **Not open yet**, 0%, no code editors or progress actions.
2. Teacher opened Monday only; student closed/reopened. Monday code and exit slip appeared;
   Tuesday and task stayed closed. **Run & check** used laptop Java, printed `1`, `2`, `3`,
   marked **Passed**, and showed 17% (one of six whole-module requirements).
3. Teacher closed Monday with the student's module still open. Running again kept the actual
   output and appended **Could not save this result: This lesson is not open yet**. Closing and
   reopening hid Monday and retained 17% in both viewer and card. Reopening Monday restored Passed.
4. Opened the performance task separately. Submitting **Sample code** showed **Submitted** and
   33%. Closing the task then attempting the already-loaded own-version submit showed
   **The performance task is not open yet**; the previous submission remained.
5. Reopened the task, reuploaded the same module with a corrected title via **Upload module**.
   Teacher switches remained Monday open / Tuesday closed / task open. Student close/reopen
   showed the corrected title, Passed, Submitted, and 33% on both card and viewer.
6. Uploaded the identical module id into class A through the teacher file picker. All switches
   started unchecked there. The same student saw all three sections closed and 0%, independently
   of class B's 33% and open Monday/task.
7. Temporary tabs, production server, and all disposable classes/users were removed afterward.
   The original app and Docker services were left running.

UI screenshots were saved locally under `/tmp/codeshare-lesson-controls-*.jpg`; the final chat
includes the student closed-module view. Screenshots are review aids, not test assertions.
Browser tests did not inject save failures: the teacher's actual closure produced the save errors.
Teacher-switch failure rendering was inspected in code, not separately forced in the browser.

## Regression failure proof

- Before editing the implementation, ran
  `sg docker -c 'node --test --test-name-pattern="unknown modules|duplicate lesson ids" tests/module-availability.test.mjs tests/course-module-schema.test.mjs'`.
  Both new regressions failed: CKB-018 returned **200 instead of 404** for missing module progress;
  CKB-019 accepted duplicate lesson ids (**true instead of false**).
- Deliberately changed the fixed module reader to return full content to students. The test
  **module availability: new modules withhold closed content and reject direct progress writes; only the class teacher can open them**
  failed its closed-content assertion. Restored the reader.
- Deliberately removed the closed-lesson progress guard. The same test failed **200 instead of
  403**. Restored the guard. Command for each mutation:
  `sg docker -c 'node --test --test-name-pattern="new modules withhold" tests/module-availability.test.mjs'`.
- After restoring both protections, all six availability tests passed, command
  `sg docker -c 'node --test tests/module-availability.test.mjs'`. The complete 46-test suite also passed again after restoration and the documentation updates. No mutation remains in the committed source.
- No mutation proof was performed for every migration branch, concurrent teacher edit retry,
  or React rendering path. Their passing tests/manual checks are identified, not claimed as
  fail-before/pass-after proof.

## Test levels

- Rule checks on their own: schema validation, web preview generation/path rules, invitation
  selection/listener lifecycle, throttle/local URL handling, and isolated migration execution.
  The migration test executes real PostgreSQL SQL against a disposable schema, not live tables.
- Real handler/database checks: module availability/progress/upload, class home/bootstrap,
  authentication, and chat routing use actual API handlers and local Supabase. Realtime policy
  tests connect to real local channels; the browser pass is also tested against table access.
- Real app checks: the production browser steps above cover teacher controls, student display,
  errors, Java, reupload and saved progress. They are manual interactions, not frontend unit tests.

## Full automated runner names and marks, grouped by file

Command for all groups: `sg docker -c 'npm test'` (Node's test runner; durations omitted).

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
ℹ tests 46
ℹ suites 0
ℹ pass 46
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Node also prints the existing MODULE_TYPELESS_PACKAGE_JSON warnings when importing frontend
TypeScript helpers in tests; no package-type change was added for this feature.
