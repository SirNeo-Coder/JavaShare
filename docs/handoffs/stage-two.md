# Stage two handoff (course modules)

Last updated: 2026-10-18 (the two write races and the classroom-scoping gap are fixed; 6 other
`/code-review` findings still open)

Read `docs/course-format.md` first — it defines the weekly module JSON file.

## Done: module progress not scoped to classroom (CKB-010)

Branch: `module-viewer`. Teacher approved as an adjustment (invisible to students/teachers, no
new screen or step). `module_progress` was unique only on `(student_id, module_id)`, but
`module_id` is free text from a module's own file — the same id can exist in two classrooms
(`course_modules` is correctly scoped). A student in both classrooms would share one module's
progress between them. Fixed: new migration
`20261018000400_module_progress_scope_to_classroom.sql` adds `classroom_id` to the unique
constraint; `loadOrCreateModuleProgress`/`updateModuleProgressWithMerge` in
`backend/src/supabase-repository.ts` now filter every query by it too. 1 new regression test
(two classrooms, one module id, one student in both), shown failing before the fix. `npm test`:
27/27 pass. `npm run build:all` / `npm run lint`: clean. Full record:
`docs/problem-knowledgebase/cases/CKB-010-module-progress-not-scoped-to-classroom.md`.

## Done: the two write races (CKB-009)

Branch: `module-viewer`. File: `backend/src/supabase-repository.ts`. Full record:
`docs/problem-knowledgebase/cases/CKB-009-module-progress-write-races.md`.

1. **Lost-update race** (`setSupabaseModuleStepState`/`setSupabaseModulePerformanceTask`
   read-merge-overwrote the whole `step_states`/`performance_task` jsonb column) — fixed with a
   new `updateModuleProgressWithMerge` helper that writes back conditioned on
   `.eq("updated_at", row.updated_at)` (trigger-managed, changes on every write with no client
   input, so it's a free optimistic lock) and retries up to 5 times on conflict. No migration.
2. **Unhandled 500 on first-write race** (`loadOrCreateModuleProgress` did select-then-insert) —
   fixed with `.upsert(..., { onConflict: "student_id,module_id", ignoreDuplicates: true })` then
   a select of the winner's row when the upsert was ignored. No migration.

Two new regression tests in `tests/module-progress.test.mjs`, both shown failing against the old
code (a raw 500 on the first-touch race, a dropped `sample` submission on the merge race) before
the fix, passing after. `npm test`: 26/26 pass. `npm run build:all` / `npm run lint`: clean (0
errors, same 8 pre-existing warnings as before). Not yet re-tested live in a browser — the fix is
a pure backend query-shape change with no UI touched, and route-level behavior is what the two
new tests exercise directly.

Full finding text (both findings, plus the other 7 still-open findings from the
`/code-review` of PR #6 and PR #7) is in "Other findings from the `/code-review`, not yet
fixed" below.

## What the teacher asked for

A per-module goal meter showing where a student is in the week's module; each activity/step
checked off automatically by whether the student's code ran and matched the expected output
(reusing the existing `expectedOutput` field already in a module's step); and the performance
task tracked as two separate submissions — the student running the sample/example code, and
the student's own version — both required to finish the module.

## Done: module-progress backend (branch `module-progress`, PR #6, stacked on `cloudflare-c2`)

- Migration `supabase/migrations/20261018000100_module_progress.sql` — table `module_progress`
  (one row per student per module).
- `backend/src/supabase-repository.ts` / `routes.ts` — progress read/write routes.
- No execution code added: a step's pass/fail check reuses the existing `POST /api/execute`
  route (Java) or the browser's own web preview; the caller runs the code and reports the
  verdict.

## Done: the module viewer (branch `module-viewer`, stacked on `module-progress`)

- **Teacher:** upload a `.codeshare.json` file (new `course_modules` table, validated against
  `docs/course-format.md` by `backend/src/course-module-schema.ts` — a malformed file is
  rejected with a plain-English error, not a 500), list and delete modules for their class.
- **Student:** `app/ModuleViewer.tsx`, opened from the new **Modules** button in the header.
  Shows the goal meter, each lesson's steps (run & auto-check for Java against
  `expectedOutput`; other languages get a manual "mark done" button — no server-side runner
  exists for them), the exit slip (manual "mark done", keyed per lesson), and the performance
  task's two submission slots (Sample code / Your own version), each independently run and
  submitted.
- v1 renders `text`/`definition`/`note` blocks as plain text and `step` blocks fully;
  `table`/`error`/`errorGuide` block types fall back to plain text (scoped out on purpose, per
  the teacher's approval 2026-10-18).
- Raised the shared JSON request-body cap from 300KB to 2MB (`backend/src/router.ts`) so an
  upload with several lessons' worth of embedded Java fits — teacher approved; affects every
  route, but nothing else sends anywhere near that size.
- Code editing inside the viewer uses a plain `<textarea>`, not the full `CodeEditor` component.
  `CodeEditor` is built for one full-height instance; nested many times inside this scrollable
  modal its text rendered invisibly (confirmed in a real browser — correct DOM, correct computed
  styles, never painted). Not worth chasing further; a plain textarea has no syntax highlighting
  but is simple and reliably renders. If that's worth revisiting later, the symptom to search for
  is "code editor box empty, scrollbar but no text, DOM/computed-style look correct".

### CKB-007, found and fixed during this work

A module has several lessons, each with its own exit slip, but the first backend design
(PR #6) stored exit-slip completion as a single `exit_slip_done` boolean for the whole module.
Caught before release, while wiring the real multi-lesson viewer. Fixed by folding exit-slip
completion into the same `step_states` map steps already used, keyed by the exit slip's own
`id`. New migration `20261018000300_module_progress_exit_slip_fix.sql` drops the column (the
earlier migration file itself was never touched, per rule 3). See
`docs/problem-knowledgebase/cases/CKB-007-module-progress-exit-slip-one-flag.md` for the full
record, including the regression test shown failing against the bug and passing after the fix.

### Tested 2026-10-18

- `npm test`: 24 of 24 pass (`tests/module-progress.test.mjs`, `tests/course-modules.test.mjs`,
  `tests/course-module-schema.test.mjs`, plus everything from before). The CKB-007 regression
  test uses a two-lesson fixture so it actually proves lessons are tracked independently.
- `npm run build:all`: passes. `npm run lint`: 0 errors (8 pre-existing warnings, unrelated).
- **Tested as both roles in a real browser**, against local Supabase (`npm run dev`, not the
  full `classroom:offline` launcher — see below): registered a teacher and student directly via
  the Supabase admin client (to avoid colliding with the "first account becomes teacher" rule),
  joined a class, uploaded `tests/fixtures/sample-module.codeshare.json` as the teacher, then as
  the student: opened the module, ran step 1 (real `javac`, real output, matched
  `expectedOutput`, step marked PASSED), marked Monday's exit slip done and confirmed Tuesday's
  stayed unchecked (CKB-007's fix holding live, not just in the test), submitted both
  performance-task slots, watched the goal meter move 0% → 17% → 50% → 67% correctly as each
  piece completed. **A teacher opening a module originally saw only "Only students have module
  progress" and nothing else** — this was CKB-008 (see below), found by code review and fixed the
  same day; a teacher now sees the full module (lessons, steps, performance task), can press
  **Run** on Java steps/files to check they work, and sees no progress-only UI (goal meter,
  checkboxes, submit buttons, status chips) since none of that is theirs to have.
- **Not run:** the full `npm run classroom:offline` interactive launcher (used `npm run dev`
  instead, which exercises the same `DATABASE_MODE=supabase-local` code path, against the
  already-running local Supabase). Left `backend/.env` and `.claude/launch.json` in place
  (both already git-ignored / untracked) for whoever picks this up next to repeat the check
  quickly.
- **Not tested:** the Cloudflare preview (this PR doesn't touch anything Cloudflare-specific).

### CKB-008, found and fixed during this work

`/code-review` (high effort) on both PR #6 and PR #7 found that a teacher opening any module saw
only an error — `ModuleContent` fetched student-only progress data unconditionally, and that one
403 blanked the whole screen instead of just the progress-dependent pieces. Fixed in
`app/ModuleViewer.tsx`: `ModuleContent`/`StepView`/`PerformanceTaskSlot` now take a `role` prop; a
teacher's view never fetches progress at all (a static empty stub keeps rendering code uniform),
and the goal meter / exit-slip checkbox / submit buttons / status chips only render for students.
A teacher can still press **Run** on a Java step to check it works (same `/api/execute` call, no
progress write). Full record, including before/after screenshots-equivalent (checked live in a
browser both ways):
`docs/problem-knowledgebase/cases/CKB-008-teacher-cannot-preview-module.md`.

### Other findings from the `/code-review`, not yet fixed

The review (10 findings each on PR #6 and PR #7, all confirmed against the code) surfaced several
real issues beyond CKB-008 that are **not yet fixed** — flagging here so they aren't lost. (The
two write-race findings and the classroom-scoping finding that were here are done — see CKB-009
and CKB-010 above.)

- **No id-uniqueness check:** nothing stops a module's step ids and exit-slip ids from colliding
  with each other (course-module-schema.ts has zero `.refine()` calls) — this is CKB-007's exact
  bug class, reachable again one layer up.
- **Upload schema vs. `/api/execute` path rules disagree:** a module can pass upload validation
  with a file path (e.g. with a space, or length 161-200 chars) that `/api/execute`'s stricter
  regex will always reject — the step becomes permanently unrunnable for students with no warning
  at upload time.
- **Several handlers swallow errors silently** (`markExitSlip`, `removeModule`,
  `PerformanceTaskSlot.submit`) — a failed request gives the student/teacher no feedback at all.
- **A correct run's output can be overwritten:** in `StepView.run`, the real program output and
  the progress-save PUT share one `try`; if the PUT fails, the catch replaces the correct output
  on screen with a generic error message.
- **The global JSON body cap (300KB → 2MB) isn't scoped** to the module-upload route — it applies
  to every route in the app.
- Two cleanup items: `StepView`/`PerformanceTaskSlot` duplicate their run/output logic almost
  verbatim, and the new classroom-membership check duplicates an existing helper
  (`canAccessSupabaseClass`).

None of these have shipped to a student yet (both PRs are still open, unmerged). Ask the teacher
which of these to fix before merging vs. track as follow-up work.

## Not done yet (deliberately out of scope for this PR)

- `table`, `error`, and `errorGuide` block types render as plain text, not their intended
  layout.
- The exit slip's actual questions aren't collected or graded — just a manual "mark done".
- No teacher control over which lessons are open yet (course-format.md mentions this); the
  whole module is visible at once, per the teacher's 2026-10-18 approval.
- Teachers don't yet see student module progress anywhere (no dashboard for it).

## Where the work is

- **Branches:** `module-progress` (PR #6) → `module-viewer` (this work), stacked on
  `cloudflare-c2` (itself unmerged — pending the teacher's Cloudflare preview review per
  `docs/handoffs/stage-one.md`).
- Local checkout and GitHub remote: same as `docs/handoffs/stage-one.md`.
