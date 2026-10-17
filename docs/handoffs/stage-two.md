# Stage two handoff (course modules)

**Status: ready for merge.** Last updated: 2026-10-18.

All work for stage two (the module viewer and its backend) is built, tested, and every finding
from the `/code-review` of PR #6 and PR #7 is fixed. Nothing known is left broken. The only
remaining blocker to actually merging is the branch stack this sits on (see "Where the work is"
below) — `module-viewer` itself has nothing outstanding.

Read `docs/course-format.md` first — it defines the weekly module JSON file.

## What the teacher asked for

A per-module goal meter showing where a student is in the week's module; each activity/step
checked off automatically by whether the student's code ran and matched the expected output
(reusing the existing `expectedOutput` field already in a module's step); and the performance
task tracked as two separate submissions — the student running the sample/example code, and
the student's own version — both required to finish the module.

## What shipped

**Module-progress backend** (branch `module-progress`, PR #6, stacked on `cloudflare-c2`):
- Migration `supabase/migrations/20261018000100_module_progress.sql` — table `module_progress`
  (one row per student per module per classroom — see CKB-010 below).
- `backend/src/supabase-repository.ts` / `routes.ts` — progress read/write routes.
- No execution code added: a step's pass/fail check reuses the existing `POST /api/execute`
  route (Java); the caller runs the code and reports the verdict.

**The module viewer** (branch `module-viewer`, stacked on `module-progress`):
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
- A module upload gets a 2MB JSON body cap, scoped to that one route
  (`backend/src/router.ts`) so a multi-lesson module with embedded Java fits; every other route
  kept its original 300KB default (this was briefly global — see CKB-015).
- Code editing inside the viewer uses a plain `<textarea>`, not the full `CodeEditor` component.
  `CodeEditor` is built for one full-height instance; nested many times inside this scrollable
  modal its text rendered invisibly (confirmed in a real browser — correct DOM, correct computed
  styles, never painted). Not worth chasing further; a plain textarea has no syntax highlighting
  but is simple and reliably renders. If that's worth revisiting later, the symptom to search for
  is "code editor box empty, scrollbar but no text, DOM/computed-style look correct".

## Bugs found and fixed during this work (all resolved)

`/code-review` (high effort) on PR #6 and PR #7 reported 20 findings total (10 each); combined
with one found earlier during manual testing, that's 9 distinct bug-class issues plus 2
cleanup-only items, all now fixed. One line each, full record in the linked case file:

| Case | What it was | Where it's fixed |
| --- | --- | --- |
| [CKB-007](../problem-knowledgebase/cases/CKB-007-module-progress-exit-slip-one-flag.md) | Exit slip was one flag for the whole module, not per lesson | `step_states`, folded in like a step |
| [CKB-008](../problem-knowledgebase/cases/CKB-008-teacher-cannot-preview-module.md) | A teacher opening any module saw only an error | `app/ModuleViewer.tsx`, `role` prop |
| [CKB-009](../problem-knowledgebase/cases/CKB-009-module-progress-write-races.md) | Lost-update race on step/performance-task saves; 500 on a concurrent first touch | `supabase-repository.ts`, upsert + `updated_at`-conditioned retry |
| [CKB-010](../problem-knowledgebase/cases/CKB-010-module-progress-not-scoped-to-classroom.md) | Progress could leak between two classrooms sharing a module id | unique constraint + queries scoped by `classroom_id` |
| [CKB-011](../problem-knowledgebase/cases/CKB-011-module-upload-id-collision.md) | Nothing stopped a module's step/exit-slip ids from colliding | `course-module-schema.ts`, `.refine()` |
| [CKB-012](../problem-knowledgebase/cases/CKB-012-module-upload-java-path-mismatch.md) | A java file path could pass upload but never run via `/api/execute` | shared `JAVA_PATH`/`JAVA_PATH_MAX_LENGTH`, `.refine()` |
| [CKB-013](../problem-knowledgebase/cases/CKB-013-module-viewer-silent-errors.md) | 3 handlers swallowed a failed request with no feedback | try/catch added in `app/ModuleViewer.tsx` |
| [CKB-014](../problem-knowledgebase/cases/CKB-014-step-output-overwritten-on-save-failure.md) | A failed progress-save could overwrite a step's correct output | save moved to its own try/catch |
| [CKB-015](../problem-knowledgebase/cases/CKB-015-unscoped-json-body-cap.md) | The 2MB body cap applied to every route, not just module upload | per-route limit in `router.ts` |
| *(no CKB — not a bug)* | `requireClassroomMember` duplicated `canAccessSupabaseClass` | now calls the existing helper |
| *(no CKB — not a bug)* | `StepView`/`PerformanceTaskSlot` duplicated run/output logic | shared `runFiles()` + `ModuleFileEditors` |

Every regression test that could be automated was shown failing against the old code before the
fix (see each case file). CKB-013, CKB-014, and the two cleanup items touch `app/ModuleViewer.tsx`
only, and this repo has no frontend test harness yet, so those were verified live in a browser
instead — see "Tested" below.

## Tested (most recent pass, 2026-10-18)

- `npm test`: **33/33 pass** (`tests/module-progress.test.mjs`, `tests/course-modules.test.mjs`,
  `tests/course-module-schema.test.mjs`, `tests/api-router.test.mjs`, plus everything from before).
- `npm run build:all`: passes. `npm run lint`: 0 errors (8 pre-existing warnings, unrelated to
  this work).
- **Tested live in a real browser** against local Supabase (`npm run dev`, not the full
  `classroom:offline` launcher): registered a teacher and student directly via the Supabase admin
  client, joined a class, uploaded `tests/fixtures/sample-module.codeshare.json` as the teacher,
  then as the student: ran a step (real `javac`, real output, matched `expectedOutput`, marked
  PASSED), marked an exit slip done and confirmed a different lesson's stayed unchecked, submitted
  both performance-task slots, watched the goal meter move correctly. Opened the same module as
  the teacher: full content visible, no progress-only UI, **Run** works with nothing saved.
  Confirmed CKB-013/CKB-014's fixes by patching `window.fetch` to simulate a failed save/submit in
  turn (exit-slip checkbox, step-result save, performance-task submit) — each surfaced its error
  without losing the real output — then restored `fetch` and repeated for real to confirm the
  normal path still works, including a teacher deleting a module.
- **Not run:** the full `npm run classroom:offline` interactive launcher (used `npm run dev`
  instead, same `DATABASE_MODE=supabase-local` code path, against the already-running local
  Supabase). Left `backend/.env` and `.claude/launch.json` in place (both already git-ignored /
  untracked) for whoever picks this up next to repeat the check quickly.
- **Not tested:** the Cloudflare preview (this work doesn't touch anything Cloudflare-specific).

## Not done yet (deliberately out of scope for this PR)

- `table`, `error`, and `errorGuide` block types render as plain text, not their intended
  layout.
- The exit slip's actual questions aren't collected or graded — just a manual "mark done".
- No teacher control over which lessons are open yet (course-format.md mentions this); the
  whole module is visible at once, per the teacher's 2026-10-18 approval.
- Teachers don't yet see student module progress anywhere (no dashboard for it).

None of the above are bugs or `/code-review` findings — they're features never asked for in this
pass. Worth asking the teacher about as follow-up work, not blockers to merging this PR.

## Where the work is

- **Branches:** `module-progress` (PR #6) → `module-viewer` (PR #7, this work), stacked on
  `cloudflare-c2` (itself unmerged — pending the teacher's Cloudflare preview review per
  `docs/handoffs/stage-one.md`).
- Because of that stack, merging PR #7 to `main` means merging `cloudflare-c2` → `module-progress`
  → `module-viewer` in that order first (or rebasing this work onto `main` once `cloudflare-c2` is
  in). `module-viewer` itself has no open findings or failing checks blocking it.
- Local checkout and GitHub remote: same as `docs/handoffs/stage-one.md`.
