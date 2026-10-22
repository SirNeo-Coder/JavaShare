# Completion-only module saving verification — in progress

Branch: codex/module-completion-saves. Server step verified locally; browser step
and final acceptance checks are still in progress. No hosted recovery claim.

## Server step

- Local migration up passed without reset or hosted changes.
- npm run build:all passed (Next.js and backend TypeScript).
- Existing focused module integration/regression run: 67 pass, 0 fail, 0 skips.
- Extended tests/module-completion.test.mjs: 7 pass, 0 fail, 0 skips.
- Initial test setup used the wrong activity fixture fields; corrected to the
  existing created_by schema. A strict teacher-response regression also failed
  when an unnecessary version field was added there; that field was removed.
  Existing teacher/progress response shapes are preserved. Final checks pass.
- Temporarily forced read-only preparation to persist project files; the new
  opening-write regression failed. Restored source passes all seven checks.
  No broken source was committed. This proof checks the rule at the real local
  API/database layer; actual browser request counts still need validation.

Command for the focused run:

```sh
sg docker -c 'node --test tests/module-completion.test.mjs tests/module-activities.test.mjs tests/module-prerequisites.test.mjs tests/browser-java-progress.test.mjs tests/subject-module-sharing.test.mjs tests/course-modules.test.mjs tests/module-progress.test.mjs tests/teacher-dashboard.test.mjs'
```

Named results from that run, grouped by source file:

### tests/browser-java-progress.test.mjs

```text
✔ online module tasks: browser results check the task target and cannot reuse a sample pass
✔ online Java progress: browser evidence obeys membership, exact output, successful exit, saved version and part access
✔ online Java mode: missing address fails clearly; unsafe addresses are refused; legacy server mode remains available
✔ online sample first: server-owned stages reject edited samples and save verification separately from task completion
```

### tests/course-modules.test.mjs

```text
✔ course modules: teacher uploads, class members read, only the teacher may upload or delete
```

### tests/module-activities.test.mjs

```text
✔ module activities: legacy challenge JSON remains readable while progress follows the sample
✔ module activities: parts spanning lessons require every task and never require a paper liplet
✔ module activities: matching text cannot pass a failed process; internal whitespace still matters
✔ sample first: verification requires the declared result and unchanged sample, never completes an alteration
✔ sample first: upload accepts opt-in and declared errors, rejects sample progress-key collisions
✔ module activities: supporting classes survive and src aliases cannot duplicate Main.java (CKB-038)
✔ module tasks: explicit ids isolate completion and unlock one step at a time inside a part
✔ module tasks: upload rejects duplicate task ids and collisions with stored progress keys
✔ module tasks: real Java checks the alteration, redacts the next step and preserves rolling work
✔ module activities: real multi-file Java result unlocks only that student, without teacher switches or liplets (CKB-038)
✔ module activities: compile errors and a crash after the right output cannot pass
✔ module activities: prior project is copied only for its owner/class and later saves never replace it
✔ module activities: JSON supplies fixed program input and demo execution cannot award a pass
✔ weekly Java projects: personal drafts roll forward separately, preserve submissions and never advance module progress
✔ module activities: offline ignores online runner address and refuses browser progress
✔ sample first: real Java verifies samples, completes alterations, restores step drafts and refuses stale tabs
✔ sample first: a declared runtime error verifies only the demonstration and existing completions survive opt-in
```

### tests/module-completion.test.mjs

```text
✔ summaries contain only required metadata, keep legacy scope and refuse browser roles
✔ opening a step prepares local files without saving project code or draft history
✔ failed output, sample-only evidence, changed samples and direct flags cannot save code or complete
✔ a successful checkpoint saves exact files, sample verification and completion together once
✔ module updates, stale projects and live restrictions keep existing successful work intact
✔ completion-only modules: read-only preparation, small summaries and guarded successful checkpoints
```

### tests/module-prerequisites.test.mjs

```text
✔ module prerequisites: oldest unfinished ancestor blocks later weeks even when the immediate predecessor passed
✔ module prerequisites: sample verification, failed tasks and superseded ids cannot unlock a later module
✔ module prerequisites: missing and cyclic links give teacher repair messages without looping
✔ module prerequisites: live class permits the weekly chain but still blocks unrelated modules
✔ module prerequisites: banner names the earliest week and offers Continue; missing modules offer no dead button
✔ blocks content before prerequisites
✔ blocks progress before prerequisites
✔ blocks module project before prerequisites
✔ blocks paper record before prerequisites
✔ blocks activity before prerequisites
✔ blocks laptop run before prerequisites
✔ blocks browser result before prerequisites
✔ blocks personal open before prerequisites
✔ blocks personal save before prerequisites
✔ blocks submission before prerequisites
✔ live class catch-up, ordered unlock, teacher preview and student/class isolation
✔ module prerequisites: real routes reject every later-module entry, isolate students/classes and preserve saved work
```

### tests/module-progress.test.mjs

```text
✔ module progress: step checklist, exit slip, and both performance-task versions (new feature, no prior CKB)
✔ module progress: two simultaneous first touches of a module don't 500 (write race)
✔ module progress: a module in two classrooms doesn't share one student's progress (classroom scoping)
✔ module progress: two simultaneous performance-task submissions don't lose one (write race)
```

### tests/subject-module-sharing.test.mjs

```text
✔ class creation requires exactly Java or Net MVC and an assigned class cannot switch subjects
✔ upload once reaches same-subject classes, excludes the other subject and another teacher, and includes later classes
✔ members read only their classes; students and another teacher cannot choose subjects, share, upload or delete
✔ shared corrections refresh list, reader, student summary and dashboard without mixing progress, drafts or submissions
✔ shared-only prerequisites unlock per class and never reuse another class's completion
✔ old uploads stay readable before subject selection and remain backed up; conflicting sharing needs the selected current version
✔ shared deletion removes access and weekly picks across that subject while preserving backups, student work and the other subject
✔ subject modules: one subject per class, one upload per teacher/subject, separate student work
✔ subject library migration: preserves old uploads and student work, repeats safely, and restricts subjects and direct access
```

### tests/teacher-dashboard.test.mjs

```text
✔ refuses signed-out users, students, foreign teachers, and invalid class IDs
✔ counts saved completion and both submissions, including closed lessons, without exposing source
✔ keeps the same student's progress separate between classes and excludes former members
✔ returns finite zero totals for empty classes and modules with no students
✔ rounded 100% averages do not label unfinished students or modules Finished (CKB-041)
✔ rounded 0% averages retain In progress when a student has completed an item (CKB-041)
✔ reads every progress page instead of silently truncating a full year
✔ a new read reflects saved results without changing student progress
✔ teacher dashboard
```

## Extended completion run after additional coverage

Command: `sg docker -c 'node --test tests/module-completion.test.mjs'`.

```text
✔ summaries contain only required metadata, keep legacy scope and refuse browser roles
✔ opening a step prepares local files without saving project code or draft history
✔ failed output, sample-only evidence, changed samples and direct flags cannot save code or complete
✔ a successful checkpoint saves exact files, sample verification and completion together once
✔ legacy samples and intentional-error verification keep distinct completion rules
✔ module updates, stale projects and live restrictions keep existing successful work intact
✔ completion-only modules: read-only preparation, small summaries and guarded successful checkpoints
```

## Pending final proof

Device storage/cache, online local runs and completion-only requests, lost-sync and
conflict recovery, account isolation/idle expiry, actual laptop/offline browser,
full suite/build/lint and local Worker profile. Hosted CPU and physical Wi-Fi
remain unverified. No hosted deployment/settings/SQL were changed.
