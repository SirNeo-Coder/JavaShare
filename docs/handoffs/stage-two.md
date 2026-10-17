# Stage two handoff (course modules)

Last updated: 2026-10-18 (module viewer built, tested as both teacher and student in a real
browser against local Supabase)

Read `docs/course-format.md` first — it defines the weekly module JSON file.

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
  piece completed. A teacher opening a module correctly sees no progress UI ("Only students have
  module progress" — the existing 403 surfaced cleanly instead of crashing).
- **Not run:** the full `npm run classroom:offline` interactive launcher (used `npm run dev`
  instead, which exercises the same `DATABASE_MODE=supabase-local` code path, against the
  already-running local Supabase). Left `backend/.env` and `.claude/launch.json` in place
  (both already git-ignored / untracked) for whoever picks this up next to repeat the check
  quickly.
- **Not tested:** the Cloudflare preview (this PR doesn't touch anything Cloudflare-specific).

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
