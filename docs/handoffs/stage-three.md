# Stage three handoff (Google-Classroom-style navigation)

**Status: all five planned items built and tested. Items 1–4 are PRs #8–11; item 5 on `codex/teacher-web-projects` is preparing its stacked PR.** Last updated: 2026-10-18.

## What the teacher asked for

A Google-Classroom-inspired interface: on login, a teacher sees their classes; opening one shows
the roster and each student's module progress, and is where the teacher uploads modules. A
student, on login, sees their classes; opening one shows its modules and their progress. Also
asked for, in the same round: teacher control over which lessons are open per module, and a way
for teachers to see a student's web project.

A feature-level plan (no code) was written and approved first - see the five numbered items
below. Build order agreed: class list + creation, then class home, then the live-class join
popup, then lesson-open controls, then teacher web-project visibility.

## Item 1: class list + teacher class creation — DONE, waiting for teacher review

**Before-code proposal approved 2026-10-18.**

- **Pull request:** https://github.com/SirNeo-Coder/JavaShare/pull/8
- **Branch:** `landing-pages` (into `module-viewer`, since it's built on that still-unmerged
  stack - see "Where the work is" below).

### What shipped

- **The database already supported many classrooms per teacher/student** (`classrooms.teacher_id`,
  `classroom_members`) - only the app ever showed just one. This item makes that real:
  - `backend/src/supabase-repository.ts`: `createSupabaseClassroom(teacherId, {name, subject})` -
    generates a unique join code and reuses the starter class's workspace setup (extracted into
    `createClassroomWorkspace`, used by both the signup-time starter class and this new path, so
    the hardcoded `"CS 101 · Period 3"` / `"JAVA101"` starter path is untouched).
  - `backend/src/routes.ts`: `POST /api/classes` (teacher-only, zod-validated name/subject).
  - `GET /api/bootstrap` gained an optional `?classroomId=` query param (see CKB-016 below for
    why this needed care, not just a parameter).
- `app/page.tsx`: `enteredClassroomId` state replaces the old `enteredWorkspace` boolean. `null`
  shows the class list; a non-null id re-fetches bootstrap scoped to that one class and enters
  today's live workspace unchanged. A "Dashboard" button in the workspace header sets it back to
  `null`.
- `app/Landing.tsx`: teacher gets "Create a class" (inline form); student's view now maps over
  *all* their classes (was hardcoded to `classrooms[0]`), each with its own module-list fetch,
  plus "Join another class" (reuses the existing join-code route, not the full-page `JoinClass`
  flow). Every class card gets an explicit "Enter classroom" button.
- Removed the half-built "auto-skip the landing page if a class is already live" heuristic from
  the uncommitted draft - it only ever checked `classrooms[0]`, which is wrong once there can be
  more than one class, and a correct version of it is item 3 (the live-class join popup) on its
  own.

### Bug found and fixed during this work

[CKB-016](../problem-knowledgebase/cases/CKB-016-bootstrap-mixed-multiple-classrooms.md): the
bootstrap endpoint aggregated teams/activities/projects across *every* classroom a user belonged
to, not just the one being entered - invisible until a user could have more than one classroom,
which this item is what first made possible. Fixed by scoping `bootstrapFromSupabase` to exactly
one classroom whenever `classroomId` is given, and to a lightweight class-list-only response
(no workspace data) when it isn't. Caught and fixed before release, same bug class as CKB-010
one level up (that one was module progress leaking across classrooms; this one was the whole
workspace).

### Tested (2026-10-18)

- `npm test`: **35/35 pass**, including 2 new tests in `tests/landing-pages.test.mjs`:
  - class creation (teacher-only, unique join codes, a student can join the new class).
  - the CKB-016 regression: gives class A a running activity, enters A (sees it, sees exactly one
    teacher-demo team), enters B (sees no activity, still exactly one teacher-demo team) - proven
    to fail before the fix (reverted the one-classroom-row line, got `2 !== 1` on the
    teacher-demo-team-count assertion), then shown passing again after restoring it.
- `npm run build:all`: passes. `npm run lint`: 0 errors (same 9 pre-existing warnings).
- **Tested live in a real browser** against local Supabase (`npm run dev`, same code path as
  `classroom:offline`): a teacher created a second class ("Period 5 - Intro to Java"), got a
  distinct join code, entered it and got a fresh, empty "Teacher Demo Workspace" - separate from
  the first class's real roster and students, confirmed by switching between the two via
  "Dashboard" → "Enter classroom" each way. A student joined both classes and saw two separate
  cards, each with its own (independently fetched) module list; entering the second class gave
  them a fresh personal "My Practice Code" workspace scoped to that class.
- **Not separately run:** the interactive `npm run classroom:offline` launcher itself (used
  `npm run dev` against the same local Supabase instead, same `DATABASE_MODE=supabase-local` code
  path - same precedent as stage two's handoff).
- **Not tested:** a second real device; Windows; the Cloudflare preview (this work doesn't touch
  anything Cloudflare-specific); online mode.

## Item 2: class home — DONE, waiting for teacher review

**Proposal and workflow-change classification approved 2026-10-18** ("go ahead").

- **Pull request:** https://github.com/SirNeo-Coder/JavaShare/pull/9
- **Branch:** `codex/class-home`, based on `landing-pages` (PR #8), targeting `landing-pages` so the PR contains only item 2. Implementation and evidence committed as `cbfc518`, pushed.
- **Current state:** item 2 is finished and awaiting teacher review. Item 3 is implemented below.
- **What shipped:** sign-in → **Classes** → **Open class** → class home. Teacher class home has module upload, preview, deletion, and the class roster with **View module progress**. Student class home has module cards and personal progress; modules open there without entering the live workspace. **Close** refreshes student progress on the cards. **Enter classroom** opens the live workspace; **Class home** returns to the same class, and **Classes** returns to the class list. Students keep their workspace **Modules** shortcut; teacher module management has moved to class home.
- **Implementation:** reused the existing roster, module, and progress routes. `Landing.tsx` owns class home; `ModuleViewer.tsx` can render inside the teacher's home or as the existing student modal. `page.tsx` remembers the class to return to and clears navigation on sign-out. No new table, route, dependency, or migration.
- **Housekeeping:** removed the old expandable class-card roster, the per-class roster caches, and the pending-module handoff into the workspace. The teacher and student class lists now share their common layout.
- **Prior cases checked first:** CKB-016 (workspace scoping) and CKB-010 (progress scoping); all six existing landing/progress tests passed before editing. This is feature work; no new defect diagnosed or CKB record added.
- **Checks:** `npm test` via the Docker group: **35/35 pass, no skips**. `npm run lint`: **0 errors, 9 existing warnings**. `npm run build:all` passed through the offline launcher. Full test names, runner marks, limits, and browser steps: [verification evidence](../verification/stage-three-class-home.md).
- **Real browser, production build + local Supabase:** teacher upload/preview/delete, Java preview (actual output `1/2/3`), student Run & check, card progress updated to 17% after close, the same module in class B stayed at 0%, distinct rosters, teacher saw the saved 17%, workspace round-trips for both roles, student workspace module shortcut, malformed-upload and removed-module errors, empty module lists, and sign-out/sign-in with a different role all checked. Disposable local test data was removed afterward.
- **Offline launcher:** ran `sg docker -c 'npm run classroom:offline'`; configuration and build succeeded, then it reused the existing development server on port 3000. Left that server untouched. Browser checks instead used a separate `next start` on port 3001 with the launcher's local Supabase settings and laptop Java enabled. This proves the production app's local path; it was not a fresh launcher-owned server on port 3000.
- **Not verified:** Cloudflare/online, Windows, a second physical device, other browsers. No frontend unit-test harness exists; interactive paths were checked in the real app. No fail-before/pass-after mutation proof was performed for this new screen; earlier CKB-010/016 proof remains in their case files.

## Item 3: live-class join popup — DONE, waiting for teacher review

**Proposal and workflow-change classification approved 2026-10-18** ("go ahead").

- **Pull request:** https://github.com/SirNeo-Coder/JavaShare/pull/10
- **Branch:** `codex/live-class-invitation`, based on `codex/class-home` (PR #9), targeting `codex/class-home` so it contains only item 3. Implementation/evidence committed as `abd287e`, pushed. Do not merge the branch stack automatically.
- **Current state:** item 3 is finished and awaiting teacher review. Item 4 is implemented below.
- **What shipped:** student-only **Your class is live** popup on Classes/class home for an activity or presentation already running at sign-in, or starting later. **Join live class** enters the chosen workspace; **Not now** / Escape dismisses the offered sessions. Several classes are listed as choices. An open module keeps its draft and defers the invitation until it closes. Joining/dismissal survives workspace round trips during this open page; reloading/sign-out resets it. Teachers get no popup.
- **Live behavior:** receive-only listeners on existing private class channels, without Presence or team channels. Existing server broadcasts stay awaited (CKB-006). Refresh on start/stop, reconnect, and focus/visibility; no repeating status timer. A failed pass/connection displays an error and **Reconnect**, with manual classroom entry still available. Background status stays inside Landing, never replacing workspace teams/files.
- **Class/session isolation:** existing class membership checks apply; server summaries provide `liveSessionId` from existing activity/project ids. No route, migration, dependency, or new secret setting. Stop observations clear dismissal; new activity ids invite again. **Known limit:** if a previously dismissed same-id activity/presentation stops and restarts entirely while disconnected, it cannot be distinguished without a persisted start marker, so it may remain dismissed.
- **CKB-017:** the installed SDK reuses a channel object by topic. New `releaseRealtimeChannels` waits for old removals before subscribers get the shared client, covering both screen directions. Workspace subscriptions run only for the classroom actually entered. Full record: [CKB-017](../problem-knowledgebase/cases/CKB-017-live-channel-screen-handoff.md).
- **Checks:** 39/39 automated tests pass, no skips; 4 new invitation tests and expanded bootstrap summary checks. Build passes. Lint: 0 errors, same 9 existing warnings. The handoff regression was deliberately broken by removing its wait, failed, then passed after restoration. Full runner names/marks and manual checks: [verification report](../verification/stage-three-live-class-invitation.md).
- **Real browser, local production build:** teacher Present triggers the popup without reloading; Not now survives repeated same-session announcements; live stops remove the popup/badge; editing a module defers two invitations and preserves the draft; both A and B can be chosen correctly; returning home offers only the other session, then dismissal survives more round trips. Java ran after joining. Fresh sign-in during two live activities offered both. Missing live passes showed Reconnect, restoring them and clicking it recovered the popup on a subsequent announcement. Core join/deferral/dismissal and recovery checks were repeated after the final build. Disposable local test data and temporary servers/tabs were cleaned up afterward; the pre-existing app and Docker services were left running.
- **Offline:** actual launcher config/build ran, then reused the existing dev server on 3000; it was left untouched. Real-browser checks instead used production `next start` on 3001 with the same local Supabase settings and laptop Java enabled. Recovery checks used a disposable port-3002 server. These were not fresh launcher-owned instances on port 3000.
- **Not verified:** Cloudflare/online, Windows, mobile layout, another physical device, other browser engines, or physically cutting the network. Socket reconnect callback behavior is unit-tested; browser recovery used a deliberately unavailable pass endpoint, not a forced socket/network outage. UI clicks were checked in the real app; no frontend unit-test harness was added.

## Item 4: lesson and performance-task opening controls — DONE, waiting for teacher review

**Detailed proposal and workflow-change classification approved 2026-10-18** ("go ahead").

- **Pull request:** https://github.com/SirNeo-Coder/JavaShare/pull/11
- **Branch:** `codex/lesson-availability`, based on `2311fab` (`codex/live-class-invitation`, PR #10), targeting `codex/live-class-invitation` so only item 4 is shown. Implementation/evidence committed as `0b0a76b`, pushed. Do not merge the stack automatically.
- **Current state:** implementation and verification finished; PR #11 awaits teacher review. Item 5 is now implemented below.
- **Approved decisions:** teacher controls each lesson and the performance task independently in the module preview; existing modules stay open, new uploads start closed. Students see closed titles with **Not open yet**, and refresh by closing/reopening. The meter counts the whole module. Closing preserves prior work. Corrections retain ids/settings/progress; newly added lessons start closed.
- **What shipped:** **Open to students** checkboxes per lesson/task, saved per class/module. Server student responses withhold closed content and reject direct progress writes for closed content. Teacher preview stays complete and independent of student progress (CKB-008). The viewer gets the server's whole-module percentage rather than calculating from filtered content, and ignores older save responses. Concurrent teacher-tab switch changes retry without dropping each other.
- **Database:** new additive migration `20261018000500_module_availability.sql` adds `open_lesson_ids` and `performance_task_open` outside original JSON. Applied **locally only**. Existing backfill, new defaults, safe rerun, and content/saved-work preservation verified with seeded isolated-schema SQL execution. Previous repository reader/writer also tested with the new columns. No new dependency, secret, schedule or availability live event.
- **Bugs found before release:** [CKB-018](../problem-knowledgebase/cases/CKB-018-progress-unknown-module-or-step.md), arbitrary module/step ids accepted progress, now require an actual uploaded module/known step; [CKB-019](../problem-knowledgebase/cases/CKB-019-duplicate-lesson-ids.md), duplicate lesson ids accepted, now included in upload uniqueness validation. Both tests failed before the fix, then passed. Existing CKB-010 class scoping and CKB-009 save races remain tested.
- **Housekeeping:** removed the duplicate browser meter calculation and its optimistic per-field updates; all saves use the authoritative response. Updated fixtures to upload/open actual modules instead of testing phantom ids. Swept touched imports/callers before testing.
- **Checks:** **46/46 tests pass, no skips**; build passes through the actual offline launcher; lint 0 errors / 9 existing warnings; type check passes. Closed-content filtering and closed-save guards were deliberately removed one at a time, their test failed, and all six availability tests passed after restoration. [Full runner names, marks, and evidence](../verification/stage-three-lesson-availability.md).
- **Real browser, local production app:** new upload closed; teacher opens Monday only; student laptop Java prints `1/2/3`, Passed, 17%; closing preserves 17% and rejects a cached save without replacing run output; reopening restores Passed. Task opens independently; sample submission gives 33%; closing rejects another cached submission. Corrected reupload preserves switches/Passed/Submitted/33%. Same module uploaded in another class stays fully closed at 0%. Temporary tabs/server/users/classes cleaned up; existing app/Docker services left running.
- **Offline limit:** launcher configuration/build succeeded, then reused the existing dev server on 3000. Browser checks used a separate production server on 3001 with local Supabase/laptop Java; this was not a fresh launcher-owned server or physical internet-disconnection check.
- **Teacher action before hosted use:** apply the new SQL after prior module migrations and before deploying this app. [Setup and rollback guide](../lesson-availability-setup.md). Assistant changed no hosted service. Rollback to the older app keeps stored data but shows all content again because the older app ignores availability.
- **Not verified:** hosted/Cloudflare/online Java, Windows, mobile/other browsers, another physical device. Teacher-switch failure display was inspected but not forced in the browser. No frontend unit harness. Already-loaded content cannot be revoked; further saves are refused. No persistent draft storage was added. Historical duplicate lesson ids require a corrected upload; ids are never automatically renamed.

## Item 5: teacher sees saved student web projects — DONE, preparing teacher review

**Detailed proposal and workflow-change classification approved 2026-10-18** ("go ahead").

- **Branch:** `codex/teacher-web-projects`, based on `ae234a6` (`codex/lesson-availability`, PR #11). PR will target that branch. Implementation commit/PR link will be recorded after creation. Never merge the stack automatically.
- **Current state:** feature implementation and verification finished; committing/pushing and preparing its PR. All five originally agreed stage-three items are implemented. Further fixes require their own proposal and teacher approval.
- **Approved behavior:** class home → **Students** → **View web projects**; choose one of that student's personal web projects in this class. Read-only saved HTML/CSS/JavaScript file tabs, **Run preview**, console file/line output, **Refresh**, **Back to projects**, and **Close**/Escape. The student saves work, then the teacher refreshes. Unsaved typing, named saved copies and group/activity projects are outside this saved-file review.
- **Implementation:** two teacher-only GET routes under `/api/classes/:classroomId/students/:studentId/web-projects` (metadata list and one project's saved files). Shared lookup verifies class ownership, current student membership and personal workspace owner; project reads also filter by class, web language and no activity. Lists do not download source. Reused CodeEditor and buildPreview; `teacherWebPreview.ts` adds a policy before student code, on the same line, keeping console line numbers and doctype intact. No migration, dependency, secret setting, new live event or live team subscription.
- **Housekeeping:** no code was moved/replaced except the narrow key-handler condition below; touched imports/callers are used. Kept the existing workspace and student renderer separate from this feature. No abstraction or editor extraction added.
- **CKB-020 fixed:** existing read-only editor intercepted Tab. One-line guard lets normal Tab navigation work for read-only source while student editing still indents. Real app failed before fix and passed after rebuild; no frontend unit harness exists.
- **Checks:** **51/51 tests pass, no skips** (5 new tests); all 5 new tests also pass after restored protection mutations. Required build passes; lint 0 errors / 9 existing warnings; type check and diff whitespace checks pass. Existing class/preview baseline 9/9; KB search 2/2 after case additions. Removing student-team scope, teacher ownership and teacher preview policy each caused the appropriate test to fail; restored afterward. [Full runner names, marks, browser evidence and limits](../verification/stage-three-teacher-web-projects.md).
- **Real browser:** two personal projects, file switching/read-only typing, interactive rendered page and CSS, correct console/error lines, parent access blocked, zero requests to a separate local counter from teacher preview; unsaved changes excluded, student **Save work** then teacher Refresh loads correction; failed access refresh removes old source/frame; empty project/list; independent class-B projects; Escape; fixed read-only Tab and preserved editable Tab; laptop Java prints **Hello, CodeShare!**. Final preview/keyboard checks repeated on rebuilt production app. Temporary users/classes/projects/tabs/servers cleaned up; existing app/Docker left running.
- **Offline limit:** actual launcher config/build ran, then reused the existing dev instance on 3000. Browser checks used production on 3001 with local Supabase/laptop Java. No fresh launcher-owned server or physical internet-disconnection check. A direct sandbox build failed to parse TypeScript child output; rerunning the same build outside that restriction passed, without source/config workaround.
- **Not verified:** hosted/Cloudflare/online deployment, Windows, mobile layout, other browser engines or another physical device. The existing named-copy prompt is unsupported by the in-app browser: saving the actual source succeeded, named-copy creation was not tested. Infinite JavaScript loops retain the prior tab-freeze limit. List-load error rendering inspected only; detail access-error/recovery exercised.

## Existing issues found while checking item 5 — not fixed here

- **[CKB-021](../problem-knowledgebase/cases/CKB-021-teacher-direct-file-write.md): teacher direct file write.** The older `PUT /api/files/:fileId` accepts a class teacher's save over a student file. Reproduced with one disposable local file and restored its content. New viewer has read-only fields and GET routes, but existing API write permissions remain unchanged. Needs a separate permission proposal/approval and regression test.
- **[CKB-022](../problem-knowledgebase/cases/CKB-022-student-preview-network-requests.md): student preview allows network requests.** A local counter stayed empty for the new teacher preview, then received `/fetch` from the old student renderer running the same saved script. Teacher policy blocks it; student path unchanged. Needs a separate proposal/approval before changing that workflow. No internet endpoint or real student data was used in the probe.
- Claude's separate `docs/handoffs/stage-three-review-findings.md` appeared locally during this work and remains untracked/unmodified by Codex. It concerns earlier items 1–3, is outside item 5, and has not been independently verified here. Do not treat its suggested fixes as already authorized. This feature's implementation/evidence do not depend on that local file being pushed.

## Where the work is

- **Branches:** `landing-pages` (item 1, committed and pushed; PR #8 into `module-viewer`) → `codex/class-home` (item 2, committed and pushed; PR #9 into `landing-pages`) → `codex/live-class-invitation` (item 3, committed and pushed; PR #10 into `codex/class-home`) → `codex/lesson-availability` (item 4, committed and pushed; PR #11 into `codex/live-class-invitation`) → `codex/teacher-web-projects` (item 5, PR preparation; targets `codex/lesson-availability`). Keep this stack order when the teacher reviews it; do not merge automatically.
- Local checkout and GitHub remote: same as `docs/handoffs/stage-one.md`.
- Knowledge-base workflow/frontend/backend/security pages describe the completed teacher web-project view. All five feature items are implemented; reviews and separately approved fixes remain. Item 5 PR metadata will be recorded after creation. Item 4 still requires the teacher to apply its hosted migration before deploying that stack; item 5 adds no migration.
