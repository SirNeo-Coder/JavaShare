# Student module activities — verification, 2026-10-20

Branch: `codex/student-module-activities`. Approved workflow change: JSON-defined challenges in
the main editor, a saved multi-file project per student/module/class, and automatic progression.

## Final results

- `npm run build:all`: passed (Next.js production build and backend TypeScript).
- `npm run lint`: 0 errors; the same 8 existing warnings (images and existing effect dependencies).
- `npm test`: **98 passed, 0 failed, 0 skipped**. Exact runner names follow, grouped by file.
- `npm run classroom:offline`: completed its local Docker startup/build and reused the existing
  classroom server on port 3000. To avoid interrupting that server, current-source browser checks
  used an isolated local Next server on port 3001 with local Supabase and laptop Java enabled.

## Real app checks

Disposable local student/teacher accounts and one synthetic class/module only; no real student
or hosted service was modified. Browser checks used the existing narrow app pane.

1. Student signed in, joined the test class, opened Modules and selected the activity module.
2. Main editor received Main.java, Vehicle.java and Jeepney.java together; worksheet showed the
   printed output Capacity: 20 and the different activity target Capacity: 25. No student inline
   step editor or teacher availability checkbox was shown.
3. Before completion, the next part showed Complete the previous part first.
4. Running the unchanged project displayed Try again and Capacity: 20.
5. Editing Jeepney.java in the main editor to return 25 and pressing Run code displayed Passed
   and Capacity: 25. Worksheet refreshed to 25%, 1 of 3 parts complete; the next part opened.
6. Added Helper.java, saved, reloaded, reopened the module and verified all four files and the
   edited capacity survived. The class's unrelated practice project stayed separate.
7. Handwritten liplet instructions stayed visible without a completion checkbox. No paper mark
   was needed to unlock the next part.

The browser exposed CKB-044 during implementation; fixed and verified by reload. All test-created
users/class are removed after verification. Screenshot: `/tmp/codeshare-student-activity.png`.

## Regression failure proof

Temporary source mutations were restored in `finally` before the final suite:

- Omit module-level starter files: the real multi-file Java regression failed (one file instead
  of three), proving CKB-038 is caught.
- Ignore execution success when comparing output: the failed-process output check failed,
  proving CKB-043 is caught.
- Remove the absent-class/project guard: the signed-in empty-state test failed, proving CKB-044
  is caught. This supplements the actual browser failure/reload check.

Commands used the existing Node runner with `--test-reporter=spec --test-name-pattern`, targeting
`tests/module-activities.test.mjs` and `tests/student-module-activity-ui.test.mjs` respectively.
Logs remain in `/tmp/codeshare-mutation-{starter-files,failed-process,startup}.log`.

## Levels and limits

- Rule-only checks cover JSON validation, per-part prerequisites, source-file precedence,
  successful-process/output matching and safe loading states. Rendered-component checks cover
  the real editor's controls and absence of the old completion controls.
- Integration checks call actual API routes against local Supabase and run laptop javac. They
  cover independent students, missing dependencies, incorrect output, crashes, fixed inputs,
  file persistence, preceding project ownership, stale writes and invalid file paths.
- Browser checks go through the real sign-in, classroom, module drawer, main editor, Console,
  save/reload and unlock flow. No hosted or online multi-file Java run, physical second LAN
  device, Windows launcher or other browser was verified. Hosted execution support is unchanged.
- Non-Java activities remain readable; automatic checking currently supports Java only.
- Existing JSON steps without activity remain their original exercise. The app does not author
  new challenges automatically. Adding activity intentionally requires a fresh challenge pass.
- Performance-task submission UI and teacher grading remain the previous workflow; this change
  implements lesson activities first. Teacher inline sample-preview dependency handling was not
  moved into the student's saved project workflow.

## Full suite, command: `npm test`

### tests/api-router.test.mjs

```text
✔ router: path parameters, query, cookies, and JSON body reach the handler (27.966852ms)
✔ router: middleware passes on with next(), stops by responding, and next(error) reaches the error handler (1.262979ms)
✔ router: cookies, 204, unknown routes, bad JSON, and size limits (17.517826ms)
✔ router: the larger JSON body cap is scoped to the module-upload route, not every route (10.307005ms)
✔ routes: register, stay signed in with the cookie, get a live pass, sign out (361.0759ms)
✔ routes: a chat message's live signal finishes sending before the reply (CKB-006) (565.255747ms)
```

### tests/classroom-ui.test.mjs

```text
✔ module catalog: displays saved progress and distinguishes continuing from reviewing (13.23883ms)
✔ module catalog: the server's live lock disables opening and only the weekly pick gets its badge (2.798489ms)
✔ module catalog: teacher browsing never invents student progress (0.606077ms)
✔ workspace drawers: closed panels stay mounted but inaccessible so closing can animate (2.869215ms)
✔ module pages: inactive lessons and task editors stay mounted so navigation cannot discard drafts (7.70179ms)
✔ module parts: author grouping spans days and assigns discussion and exit slips exactly once (1.794852ms)
✔ module parts: older lessons and redacted closed lessons retain their own safe pages (0.666946ms)
✔ module paper: tables, analogies, notes and error guides display their actual supplied content safely (3.090127ms)
✔ module worksheet: named parts, unchanged samples, page controls and teacher-only sample preview coexist (13.355933ms)
✔ module worksheet: inter-step tables and notes retain the uploaded reading order (9.876567ms)
```

### tests/course-module-schema.test.mjs

```text
✔ course module schema: accepts a module matching docs/course-format.md (13.206639ms)
✔ course module schema: rejects a step missing expectedOutput (0.752301ms)
✔ course module schema: rejects an unknown course (0.431258ms)
✔ course module schema: rejects the wrong format tag (0.402404ms)
✔ course module schema: rejects a step id reused by another lesson's step (CKB-007's bug class, reachable at upload) (1.013201ms)
✔ course module schema: rejects a step id that collides with an exit slip's id (0.618468ms)
✔ course module schema: rejects a java step file path that /api/execute could never run (a space) (0.692989ms)
✔ course module schema: rejects a java step file path over /api/execute's 160-character cap (0.646191ms)
✔ course module schema: rejects an unrunnable .java performance-task file path (0.637663ms)
✔ course module schema: rejects duplicate lesson ids before they can share an availability switch (CKB-019) (0.626692ms)
✔ course module schema: accepts a module with no step `part` fields, unchanged (backward compatible) (0.297266ms)
✔ course module schema: accepts a step with a `part` title, including one shared across two lessons (0.340102ms)
✔ course module schema: rejects an empty `part` title (0.455133ms)
```

### tests/course-modules.test.mjs

```text
✔ course modules: teacher uploads, class members read, only the teacher may upload or delete (1302.48247ms)
```

### tests/kb-search.test.mjs

```text
✔ kb:search finds the matching bug record first (68.041682ms)
✔ kb:search says so when nothing matches (47.319316ms)
```

### tests/landing-pages.test.mjs

```text
✔ landing pages: class roster, a student's own module summary, and a teacher's view of a student's progress (1360.887161ms)
✔ class list and creation: a teacher creates classes, a student joins one, and one class's workspace never bleeds into another's (799.418732ms)
```

### tests/live-classes.test.mjs

```text
✔ live invitations: all live classes are offered, dismissal hides only that session, and a new activity invites again (2.040949ms)
✔ live invitations: refresh preserves dismissal, ending a session clears it, and a stopped presentation can invite again (0.638198ms)
✔ live invitations: receive-only listeners refresh on start, stop, and reconnect; cleanup removes their channels and ignores late events (1.173234ms)
✔ live invitations: entering or leaving the workspace waits for old channels to close before reusing their topics (57.372944ms)
```

### tests/module-activities.test.mjs

```text
✔ module activities: JSON keeps the printed sample separate from the student's challenge (10.997322ms)
✔ module activities: parts spanning lessons require every task and never require a paper liplet (0.432029ms)
✔ module activities: matching text cannot pass a failed process; internal whitespace still matters (0.141527ms)
✔ module activities: supporting classes survive and src aliases cannot duplicate Main.java (CKB-038) (0.242672ms)
✔ module activities: real multi-file Java result unlocks only that student, without teacher switches or liplets (CKB-038) (7290.86837ms)
✔ module activities: compile errors and a crash after the right output cannot pass (4527.10582ms)
✔ module activities: prior project is copied only for its owner/class and later saves never replace it (766.377257ms)
✔ module activities: JSON supplies fixed program input and demo execution cannot award a pass (1141.183388ms)
```

### tests/module-availability.test.mjs

```text
✔ module availability: unknown modules and step ids cannot create progress (CKB-018) (1153.224878ms)
✔ module availability migration: preserves existing content and work, opens existing modules, defaults new uploads closed, and safely reruns (546.315379ms)
✔ module availability: first part opens automatically, future content is withheld, and teacher switches cannot bypass student progress (828.625116ms)
✔ module availability: reupload preserves work and new parts require their preceding activities (757.860457ms)
✔ module availability: the same module in two classes has independent switches, and concurrent teacher edits keep both changes (704.865031ms)
✔ module availability: modules without a performance task reject its switch and submission (685.217712ms)
```

### tests/module-progress.test.mjs

```text
✔ module progress: step checklist, exit slip, and both performance-task versions (new feature, no prior CKB) (1086.501765ms)
✔ module progress: two simultaneous first touches of a module don't 500 (write race) (280.473715ms)
✔ module progress: a module in two classrooms doesn't share one student's progress (classroom scoping) (486.000403ms)
✔ module progress: two simultaneous performance-task submissions don't lose one (write race) (378.36428ms)
```

### tests/module-weekly-active.test.mjs

```text
✔ module weekly active + shared project: pick, lock, and project file round-trip (1230.382855ms)
```

### tests/realtime.test.mjs

```text
✔ realtime: an unrelated topic's subscriber never waits on another topic's pending removal (51.902518ms)
✔ realtime: resubscribing the same topic waits for its own pending removal to finish first (CKB-017) (100.020855ms)
✔ realtime: signing out clears pending cleanup so the next sign-in's subscriber never waits on the discarded client's teardown (51.641061ms)
✔ offline: classroom devices reach local Supabase through the laptop's address (0.576657ms)
✔ throttle sends at most once per interval and never drops the newest value (81.729078ms)
✔ channel rules: members join, outsiders are refused, only the teacher broadcasts to the class (15333.771223ms)
✔ browser pass cannot read tables directly (3.349124ms)
```

### tests/student-classroom-entry.test.mjs

```text
✔ student entry: a single membership opens that classroom even with an obsolete saved choice (1.817929ms)
✔ student entry: multiple memberships reopen only a remembered class the student still belongs to (0.217326ms)
✔ student entry: no membership never opens a saved or invented classroom (2.227761ms)
✔ student entry: teachers, required password reset and explicit Classes navigation do not auto-enter (0.208684ms)
✔ student entry: remembered classrooms stay separate for different accounts on a shared browser (0.385924ms)
✔ student entry: unavailable browser storage still permits single-class entry and safe multi-class choice (0.370768ms)
✔ student chooser: a former class-home selection cannot resurrect the removed module landing page (11.4333ms)
✔ teacher chooser: class creation and the teacher dashboard entry remain available (4.625533ms)
```

### tests/student-module-activity-ui.test.mjs

```text
✔ module activity screen: signing in starts safely before a class or project exists (CKB-044) (64.116317ms)
✔ module activity screen: main Java editor has project tabs, challenge target, Console, Run code and Save work (9.987713ms)
```

### tests/teacher-dashboard-ui.test.mjs

```text
✔ teacher dashboard: navigation maps Students and Curriculum and exposes loading instead of fake totals (16.408657ms)
✔ teacher dashboard: avatar styles cannot override the existing classroom avatar (CKB-039) (3.305054ms)
```

### tests/teacher-dashboard.test.mjs

```text
✔ refuses signed-out users, students, foreign teachers, and invalid class IDs (11.983716ms)
✔ counts saved completion and both submissions, including closed lessons, without exposing source (55.848567ms)
✔ keeps the same student's progress separate between classes and excludes former members (26.603019ms)
✔ returns finite zero totals for empty classes and modules with no students (30.566147ms)
✔ rounded 100% averages do not label unfinished students or modules Finished (CKB-041) (38.459073ms)
✔ rounded 0% averages retain In progress when a student has completed an item (CKB-041) (35.058827ms)
✔ reads every progress page instead of silently truncating a full year (50.81211ms)
✔ a new read reflects saved results without changing student progress (43.730105ms)
✔ teacher dashboard (1653.453506ms)
```

### tests/teacher-web-projects.test.mjs

```text
✔ teacher web projects: lists every personal web project for the selected student and class, and reads saved files on demand (1684.875781ms)
✔ teacher web projects: only the owning teacher reads a current class member's projects; guesses and write methods are refused (1168.518343ms)
✔ teacher web projects: empty lists and files are readable, repeated reads never save, and a student's save appears on refresh (1087.447585ms)
✔ teacher web preview: blocks network resources before student code while preserving the doctype and console line map (1.496089ms)
✔ teacher web preview: allows eval/Function so a saved eval()-based calculator behaves the same as it does for the student (0.178818ms)
✔ teacher web preview: headless pages retain console locations and missing HTML keeps its existing warning (0.261977ms)
```

### tests/web-workspace.test.mjs

```text
✔ inlines linked CSS and JavaScript, no external loads (4.088501ms)
✔ maps document lines back to the student's file and line (0.778603ms)
✔ capture script sits on the <head> line and does not shift lines (0.641583ms)
✔ works without <head>, and warns about missing files (0.482582ms)
✔ a </script> inside JavaScript cannot break out of the inlined script (0.442899ms)
✔ no index.html gives a friendly message (0.338335ms)
✔ file names must fit the project language (0.477194ms)
```
