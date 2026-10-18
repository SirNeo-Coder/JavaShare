# Stage four handoff (module viewer redesign)

**Status: PR 1 of 4 (schema + backend storage) built and tested, preparing its PR.** Last updated: 2026-10-19.

## What the teacher asked for

Make a student's module screen feel like the printed worksheet and like CodeShare's own live
classroom workspace, instead of today's one long scrolling popup (`app/ModuleViewer.tsx`):

- A progress bar and a part-by-part gated chain (locked/current/done), shown part by part instead
  of the whole module at once.
- The same editor + console layout as the live classroom. The center panel switches to a reading
  view for a discussion part and back to the real code editor for a part the student edits.
- One evolving project per module that the student keeps editing lesson to lesson (the same
  `Main.java` replaced step by step, matching the printed worksheet), not a disposable code box
  per step.
- A clear, separate Performance Task section (the student's own original program), gated after the
  lesson parts.
- The teacher picks one uploaded module as "this week's" for a class. Outside a live class a
  student can browse their whole module catalog (done/in-progress/locked cards); the moment a live
  class session is running, the catalog locks to just that week's module.
- On the teacher side: class home's student roster becomes cards; opening one shows the same
  catalog-grid component, scoped read-only to that student's progress.
- "Parts" follow the discussion, not the calendar day - a part can span more than one lesson (e.g.
  a "Reading files" part covering both a Tuesday and a Wednesday lesson), decided by whoever
  authors the module, not computed automatically from `dayLabel`.

Reference: a Figma mock the teacher built (`Student Coding Web App`) showing the drawer/catalog/part-chain UI for the student side. No teacher-side mock yet (figma credits ran out); the teacher described it instead: class → student cards → opening one shows the same card grid the student's own drawer shows, scoped to that student.

**Before-code plan approved 2026-10-19** (same conversation as this doc). Build order: PR 1 schema
+ backend storage, PR 2 student drawer/catalog, PR 3 shared editor + live-class lock in the UI, PR
4 teacher card view.

## PR 1: schema + backend storage — DONE, preparing PR

**Branch:** `feat/module-redesign-schema`, based on `codex/stage-three-review-fixes` (PR #12,
still open — this branch is stacked on it, not on `main`).

What shipped:

- `docs/course-format.md`, `backend/src/course-module-schema.ts`: a step block may carry an
  optional `part` title. Steps (and the text/definition/analogy/table/note blocks leading into
  them) sharing a `part` value group into one gated chain entry, even across different lessons. No
  `part` on a step (every module uploaded so far) falls back to one part per lesson - fully
  backward compatible, no re-upload needed.
- `classrooms.active_module_id` (new column, migration `20261018000600_...sql`): the teacher's
  weekly pick, free text matching `course_modules.module_id` (not a foreign key, for the same
  reason `module_progress.module_id` isn't one - module ids are only unique per classroom).
  `setSupabaseClassroomActiveModule` (teacher-only, validates the module belongs to this
  classroom); `deleteSupabaseModule` clears the pick if the deleted module was it, since there's no
  FK to do that automatically.
- `enforceModuleLiveLock` in `supabase-repository.ts`: while `classrooms.current_activity_id` is
  set (a live activity is running) a student may only read/write the active module - every other
  module's content, progress, step-result and performance-task routes are refused with 403, not
  just hidden client-side. Teachers previewing are never locked. No live activity running means no
  lock at all. `listSupabaseModules`' summaries now carry `isActive`/`locked` so the future catalog
  UI can grey out locked cards before a student even taps one.
- `module_progress.project_files` (same migration): the student's one shared project for a module
  (array of `{path, content}`), separate from the two performance-task submissions already
  tracked. New route `PUT /api/classrooms/:id/modules/:moduleId/progress/project` and repository
  function `setSupabaseModuleProjectFiles` - a full replace each save (the student's one working
  copy, not a merge), no open-lesson check (saving mid-edit work shouldn't depend on which lesson
  happens to be open).
- New route `PATCH /api/classrooms/:id/active-module`.

No frontend changes in this PR - `app/ModuleViewer.tsx` still renders the stage-two layout
unchanged, and nothing in the UI calls the new routes yet. `docs/knowledgebase/workflow-state.md`
is deliberately **not** updated yet, since nothing a teacher or student can see or do actually
changed - it will be updated once PR 2-4 land UI that uses this.

**Tested:**

- `tests/course-module-schema.test.mjs`: 3 new cases - a module with no `part` field still
  validates unchanged; a `part` shared across two lessons is accepted; an empty `part` string is
  rejected. All existing cases still pass.
- `tests/module-weekly-active.test.mjs` (new file, against local Supabase): a student can't pick
  the week's module (403); an unknown module id is rejected (404) rather than silently accepted; a
  picked module shows `isActive: true` in the catalog; with no live activity running nothing is
  locked; once a live activity starts, the non-active module is locked in the catalog listing
  *and* hard-blocked (403) on GET module content, GET progress, PUT step, and PUT project, while
  the active pick and the teacher's own preview stay fully reachable; the shared project round-trips
  a save and a second save replaces rather than merges; deleting the active module clears the
  classroom's pick.
- `tests/course-modules.test.mjs`, `tests/module-progress.test.mjs`: updated for the two new
  response fields (`isActive`/`locked` on a module summary, `projectFiles` on a progress read) so
  they keep passing instead of silently going stale.
- Full suite: **59/59 pass**, `npm run build:all` and `npm run lint` both pass (0 errors, the same
  9 pre-existing warnings, none from this change).
- Not run: a browser check. This PR has no UI surface to click through - every change is
  schema/backend, exercised end-to-end through the real HTTP routes against local Supabase in the
  tests above, which is the applicable level of testing for this PR.

## Next steps

1. Teacher reviews PR 1 (stacked on #12).
2. PR 2: student drawer/catalog UI (`app/ModuleViewer.tsx` rebuilt) using `isActive`/`locked` from
   `listSupabaseModules` and the part grouping from the schema.
3. PR 3: the shared per-module project becomes the actual code editor in `app/page.tsx` (seeded
   from each step's sample files, editable from then on, saved through the new `/progress/project`
   route), plus the live-class lock reflected in the UI (not just enforced server-side).
4. PR 4: teacher class-home roster becomes cards; opening one reuses PR 2's catalog-grid component
   read-only, scoped to that student. Needs the teacher-side Figma (or a verbal walkthrough) for
   where the "Open to students" per-lesson toggle lives in the new layout - still open.
5. `docs/knowledgebase/workflow-state.md` gets its update once PR 2 (or whichever PR first exposes
   this in the UI) lands.

## Where the work is

- **Local checkout:** `~/Documents/GitHub/JavaShare`
- **GitHub:** `SirNeo-Coder/JavaShare`
- **Branch:** `feat/module-redesign-schema`, stacked on `codex/stage-three-review-fixes` (PR #12,
  open). Keep this stack order when the teacher reviews; do not merge automatically.
