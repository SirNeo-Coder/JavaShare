# Stage four handoff (module viewer redesign)

> Current student activity work (2026-10-20): approved and implemented on `codex/student-module-activities`. See [student-module-activities.md](student-module-activities.md) for main-editor projects, automatic progression, CKB-038 resolution and verification. Earlier pending starter-file proposals below are superseded for the student activity path.

> Teacher-side follow-up approved 2026-10-20: the new [teacher progress dashboard](teacher-progress-dashboard.md) supplies Overview, student cards/details, and Curriculum module management. Its handoff records implementation and review status; earlier teacher-side mock questions below are superseded for this scope.
**Status: classroom Figma UI is on main; drawer-animation PR #15 is open. The approved printed-worksheet workflow change is implemented on `codex/printed-module-worksheet` (based on PR #15), reader verified with the exact supplied JSON; [PR #16](https://github.com/SirNeo-Coder/JavaShare/pull/16) open for review (implementation `9b538d5`). Starter-file execution fix awaits separate approval (CKB-038).** Last updated: 2026-10-20.

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

## Classroom Figma UI — approved and implemented 2026-10-19

Teacher clarified the reference in the current chat: retain CodeShare's existing top bar, put the
module browser on the left, and use the Figma right-hand chat appearance for the messaging system
already implemented. Explicitly classified **workflow change**. No second chat or AI assistant.

**Branch:** `codex/classroom-figma-ui`, based on `feat/module-redesign-schema` (PR #13). The UI PR was originally stacked on that branch. For the teacher's explicit main-merge request, PR #14 targets `main` and includes its existing CodeShare prerequisites.

**Pull request:** https://github.com/SirNeo-Coder/JavaShare/pull/14
**Implementation commit:** `12945c9`. Local test accounts and the isolated class were removed
after verification; no real class data was touched.

Done:

- Dark editor and Console, yellow Run code, existing top bar, left module drawer, right chat
  drawer. Projects / Students / projects retains the existing sidebar's controls.
- Module cards use the existing list/summary routes for weekly flags, lock and actual progress.
  Lesson pages and separate performance task keep all editors mounted. Teacher class-home
  upload/delete/availability screens retain their existing layout and handlers.
- Messaging is the existing send handler, message state, routes, channels, conversation selection,
  teacher mute and group permissions. Added an explicit Send message button to the same form.
- CKB-028: fixed draft loss introduced by the first lesson-page rendering, caught before release.
  CKB-029: existing phone header overflow fixed with a two-row phone layout. CKB-030: corrected
  old dark-theme selectors overriding the new light conversation backgrounds.

Evidence: `docs/verification/classroom-figma-ui.md` records all test names by file, commands,
regression failures/restoration, real browser scenarios, and limits. Full suite: **64 passed,
0 failed/skipped**. Build passed. Lint: **0 errors, 8 existing warnings**. Offline launcher build
passed against local Docker Supabase; the real local classroom ran Java and two-way messages.

Open / next:

- Teacher explicitly authorized merging PR #14 into `main` in the current chat (2026-10-19).
  `main` was 49 commits behind the tested UI branch, with no divergent commits. The requested
  merge therefore brings the existing CodeShare stack and migration files into main together.
  This is permission for this merge, not a standing change to AGENTS.md.
- Next: check the normal main-branch build and then try the classroom on the hosted app. No
  hosted database migration or service-setting change was performed by the assistant.
- The original stage-four shared central module project and author-defined `part` grouping are
  still separate work. This UI reuses existing per-step editors, availability and progress rather
  than changing those learning rules. The teacher student-card view is also still open.
- Hosted migrations/deployment, a physical phone and a second physical LAN device were not tested.
- The in-app browser does not support `prompt()`, so the Save work naming dialog could not be
  exercised; existing file-save routes still pass integration checks. Wide pin interaction could
  not be completed through the browser's iframe controls; see the verification note.

## Drawer animation follow-up — 2026-10-19

Teacher reported that the panels appeared instantly instead of sliding. The targeted proposal was
approved as an **adjustment**: Modules / Projects slide from the left, Chat from the right,
250 ms opening and closing, existing drafts/messages/keyboard controls retained, reduced-motion
preferences respected. No new teaching step, route, dependency or migration.

**Branch:** `codex/drawer-slide-animation`, based on merged `main` (`667186c`, PR #14).

Done:

- `app/WorkspaceDrawer.tsx` and the Projects aside in `app/page.tsx` use `data-open`, `inert`, and
  `aria-hidden` rather than `hidden`. CSS can animate closing without exposing closed controls.
- `app/globals.css` slides from the proper edge, clips off-screen content, delays `visibility`
  until closing finishes, and disables transitions for `prefers-reduced-motion: reduce`.
- Wide pin selectors now check the explicit open marker. Browser checks proved left/right
  reserved space clears on close and returns on reopening. Focus restoration prevents scrolling.
- CKB-031 records the omission and fix. Regression test shown failing after restoring the old
  hidden behavior, then passing with the fix restored.

Verification: `docs/verification/drawer-slide-animation.md`. Build passed through
`npm run classroom:offline -- --build-only` (runs `npm run build:all`). Lint: 0 errors, 8 existing
warnings. Full suite: 64 passed, 0 failures/skips. Focused React checks: 5/5. Real browser measured
intermediate positions for all panels, six chat reversals, retained chat/lesson drafts, Escape
focus, no horizontal overflow and wide pin spacing. Reduced-motion CSS rule was inspected in the
browser; the tool cannot toggle the operating-system preference, so that mode was not forced.

Local preview: the existing port-3000 offline supervisor restarted its Next.js worker with the
new build, keeping database/sign-in settings. `/api/health` confirmed local Supabase connected.
Implementation committed as `d072aa1` and pushed. [PR #15](https://github.com/SirNeo-Coder/JavaShare/pull/15)
is open against `main`. Generated browser-test sessions were signed out; the isolated test class
and all three generated test accounts were removed. The normal localhost:3000 server remains running.
Another assistant can continue from this branch and this verification document. Next: teacher review
of PR #15; merging this follow-up awaits a specific request. No hosted-service changes were made.

## Printed worksheet follow-up — 2026-10-19

Teacher supplied screenshots of a printed-looking File Handling reader and a local Collections
Framework PDF. Approved the proposal as a **workflow change**: retain the module browser, open a
separate wide worksheet with author-defined parts and Overview/step pages, and add a Module ear
that previews on mouse hover while retaining click, keyboard, Pin and Escape controls.

**Branch:** `codex/printed-module-worksheet`, based on `3990646` from drawer-animation PR #15.
The branch deliberately includes that unmerged animation dependency. The new PR will target #15's
branch; once #15 lands, retarget this follow-up to main. Do not merge automatically.

Implemented:

- `app/ModuleWorkspace.tsx`: coordinates the existing catalog and separate worksheet, retains
  its selected module when closed, supports hover preview/leave, Pin and explicit close focus.
- `app/moduleParts.ts`: author labels group steps/discussion across days; older files fall back
  to lesson grouping. Discussion and exit slips are assigned once, and closed lessons remain safe.
- `app/ModuleViewer.tsx`: worksheet mode with a real part-progress row, Overview and step tabs,
  previous/next digital pages, supplied code/output, practice editors, existing Run & check and
  submission handlers. Editors stay mounted across navigation/closing. Tables, error guides,
  analogies, notes, task presentation/questions/rubric render their existing structured content.
- `app/globals.css`: printed paper, navy headings, dotted desk, responsive reader, sliding ear.
  Reduced motion uses the existing preference rule. `overflow:clip` prevents focus from panning
  a narrowed classroom; the paper remains vertically scrollable.
- CKB-032 records missing structured content; CKB-033 records hover-Escape focus fallback;
  CKB-034 records focus-related horizontal panning caught in responsive checks.

Scope boundaries: the PDF is a visual reference, not an import feature or a converted module.
Class-home upload/preview remains available in its existing form. No new runner, chat, route,
module ids, storage, dependency or migration. The shared central per-module project and teacher
student cards from the original stage-four request remain separate unfinished work.

Checks and exact test names: `docs/verification/printed-module-worksheet.md`. Full build, lint,
68-test suite and nine focused React checks passed. Browser already proved native pointer hover,
inside/leave behavior, Pin, draft retention, real javac output and saved 17% progress. Completing
final narrow-width checks after correcting focus scrolling. Next: finish verification, remove
only generated local fixtures, commit/push and open the review PR. Localhost:3000 stays running.

### Exact JSON continuation — 2026-10-20

Teacher clarified that the module displayed is generated from
`/home/ireneo/Documents/Java 2026/Java2_Week_14.codeshare.json` and asked to continue. It has no
explicit part labels: use its five existing lesson groups, eleven steps, and separate task
(17 digital pages). All supplied files/output were checked unchanged in the actual renderer.
No copy of the full private source file was added to the repository.

CKB-037 fixed discussion order: Overview keeps only the introduction; each step retains its
following tables/notes, and the liplet follows the final step. Mutation proof: 9 pass/1 fail with
old pagination, 10/10 after restoration. Current build/offline build and lint pass (eight existing
warnings); full suite **69/69**. Exact LinkedList Step 2 ran in the real offline browser and saved
6%. Projects suspends/restores the worksheet correctly, completing CKB-036's browser check.

**Open compatibility issue / scope approval pending:** actual Step 1 fails with six missing-class
javac errors. The existing student module response omits module starterFiles; StepView only sends
step.files. CKB-038 contains the proposal: expose the existing starter files safely in the same
module response, merge by path with step files winning, keep availability and execute limits.
An async question was sent requesting this extension of the UI plan into the server response.
Do not assume elapsed time means approval. No backend change has been made yet.

The ordinary offline launcher was stopped when work resumed; started `npm run classroom:offline`
and served the built UI on localhost:3000 again. Exact JSON only went into an isolated local test
class with generated teacher/student accounts. No real classroom or hosted setting was changed.
Next: commit/push the completed reader and open its review PR, with CKB-038 prominently disclosed.
If the teacher approves that separate fix, continue it with a regression before claiming all
JSON samples run. Full evidence and exact test names: `docs/verification/printed-module-worksheet.md`.

October 20 cleanup completed: signed out the exact-JSON browser session, removed only its known
isolated class and two generated accounts, deleted temporary local credentials. Server remains
running. App implementation is ready for review; CKB-038 is still awaiting approval.

Reader implementation committed as `9b538d5` and pushed. [PR #16](https://github.com/SirNeo-Coder/JavaShare/pull/16)
is open against `codex/drawer-slide-animation` (PR #15 is still open). Review/merge #15 first,
then retarget #16 to main. No automatic merge. Only the separate CKB-038 starter-file fix awaits
the teacher's scope approval; the approved reader is complete and available locally.
