# Stage two handoff (course modules)

Last updated: 2026-10-18 (module progress backend plumbing built and tested)

Read `docs/course-format.md` first — it defines the weekly module JSON file. This stage builds
CodeShare's support for that file: loading it, showing it to students, and tracking their
progress through it.

## What the teacher asked for

A per-module goal meter showing where a student is in the week's module; each activity/step
checked off automatically by whether the student's code ran and matched the expected output
(reusing the existing `expectedOutput` field already in a module's step); and the performance
task tracked as two separate submissions — the student running the sample/example code, and
the student's own version — both required to finish the module.

## Done: module-progress backend (branch `module-progress`, stacked on `cloudflare-c2`)

- **Migration:** `supabase/migrations/20261018000100_module_progress.sql` — new table
  `module_progress` (one row per student per module). See `docs/knowledgebase/data-model.md`.
- **Backend:** `backend/src/supabase-repository.ts` (`getSupabaseModuleProgress`,
  `setSupabaseModuleStepState`, `setSupabaseModuleExitSlip`, `setSupabaseModulePerformanceTask`)
  and four routes in `backend/src/routes.ts`
  (`GET/PUT /api/classrooms/:classroomId/modules/:moduleId/progress[...]`).
- **No execution code was added.** A step's pass/fail check reuses the existing
  `POST /api/execute` route (Java) or the browser-side web preview (HTML/CSS/JS) — the caller
  runs the code, compares the output to the module's `expectedOutput` itself, and reports the
  pass/fail verdict to these new routes. Keeps CKB-005's online/offline Java distinction in one
  place instead of two.
- **Docs updated in this change:** `docs/knowledgebase/data-model.md`,
  `docs/knowledgebase/feature-index.md`. `docs/knowledgebase/workflow-state.md` was **not**
  touched — nothing a student or teacher can see changed yet (see "Not done" below).

### Tested 2026-10-18, local Supabase (offline-mode database path)

- `npm test`: 19 of 19 pass, including the new `tests/module-progress.test.mjs` (7 checks: a
  non-member is refused, an empty progress row, a step passing then flipping to fail, the exit
  slip, both performance-task variants submitted independently of each other, and a teacher has
  no module progress of their own). Uses `tests/fixtures/sample-module.codeshare.json`, a small
  module matching the `docs/course-format.md` schema, built only for this test.
- `npm run build:all`: passes (Next.js build + backend `tsc`).
- `npm run lint`: 0 errors (8 pre-existing warnings in unrelated files, same as before this
  change).
- Migration applied cleanly with `supabase db reset --local`.
- **Not run:** the full `npm run classroom:offline` interactive launcher. This change adds no
  offline-specific code (no changes to `java-runner.ts`, `database.ts`, or
  `scripts/classroom-mode.mjs`); the route tests above already exercise the same
  `DATABASE_MODE=supabase-local` path offline mode uses. Say so plainly rather than claiming the
  full launcher was started.
- **Not tested:** the Cloudflare preview (this PR doesn't touch anything Cloudflare-specific,
  but hasn't been checked there).

### Bugs found and fixed during this work

- The route test initially tried to register through `/api/auth/register`, racing other test
  files for "the first account ever becomes the teacher with join code JAVA101" (same codepath
  as `createStarterClass`). Fixed by building the test's own classroom and student directly via
  the Supabase admin client, matching `tests/realtime.test.mjs`'s existing pattern — no app code
  changed, this was a test-only fix.

## Not done yet (separate, bigger piece — ask the teacher before starting)

There is still **no module viewer at all**: nothing loads a `.codeshare.json` file into
CodeShare, and no screen renders a lesson, its blocks (`text`, `definition`, `analogy`, `note`,
`table`, `step`, `error`, `errorGuide`), the exit slip, or the performance task. The goal meter,
per-step checklist, and two-submission performance task UI described above all need that viewer
to attach to — none of it is visible to a student yet. This was scoped out of the current PR on
purpose (approved 2026-10-18: ship the backend plumbing first, against a test fixture, rather
than one large PR building the viewer and the progress tracking together).

**Next step:** scope and approve the module viewer as its own piece of work — what loads a
module file (teacher upload? a library like lessons have today?), which block types render for
v1, and where the goal meter/checklist/performance-task UI actually appear on screen — then wire
it to the routes already built here.

## Where the work is

- **Branch:** `module-progress`, stacked on `cloudflare-c2` (itself unmerged — pending the
  teacher's Cloudflare preview review per `docs/handoffs/stage-one.md`).
- Local checkout and GitHub remote: same as `docs/handoffs/stage-one.md`.
