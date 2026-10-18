# Stage three handoff (Google-Classroom-style navigation)

**Status: items 1–3 built and tested; item 1 is PR #8, item 2 is PR #9, item 3 is on `codex/live-class-invitation` preparing its review PR.** Last updated: 2026-10-18.

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

## Item 3: live-class join popup — DONE, preparing review PR

**Proposal and workflow-change classification approved 2026-10-18** ("go ahead").

- **Branch:** `codex/live-class-invitation`, based on `codex/class-home` (PR #9). The new PR targets `codex/class-home`, so it contains only item 3. Do not merge the branch stack automatically.
- **What shipped:** student-only **Your class is live** popup on Classes/class home for an activity or presentation already running at sign-in, or starting later. **Join live class** enters the chosen workspace; **Not now** / Escape dismisses the offered sessions. Several classes are listed as choices. An open module keeps its draft and defers the invitation until it closes. Joining/dismissal survives workspace round trips during this open page; reloading/sign-out resets it. Teachers get no popup.
- **Live behavior:** receive-only listeners on existing private class channels, without Presence or team channels. Existing server broadcasts stay awaited (CKB-006). Refresh on start/stop, reconnect, and focus/visibility; no repeating status timer. A failed pass/connection displays an error and **Reconnect**, with manual classroom entry still available. Background status stays inside Landing, never replacing workspace teams/files.
- **Class/session isolation:** existing class membership checks apply; server summaries provide `liveSessionId` from existing activity/project ids. No route, migration, dependency, or new secret setting. Stop observations clear dismissal; new activity ids invite again. **Known limit:** if a previously dismissed same-id activity/presentation stops and restarts entirely while disconnected, it cannot be distinguished without a persisted start marker, so it may remain dismissed.
- **CKB-017:** the installed SDK reuses a channel object by topic. New `releaseRealtimeChannels` waits for old removals before subscribers get the shared client, covering both screen directions. Workspace subscriptions run only for the classroom actually entered. Full record: [CKB-017](../problem-knowledgebase/cases/CKB-017-live-channel-screen-handoff.md).
- **Checks:** 39/39 automated tests pass, no skips; 4 new invitation tests and expanded bootstrap summary checks. Build passes. Lint: 0 errors, same 9 existing warnings. The handoff regression was deliberately broken by removing its wait, failed, then passed after restoration. Full runner names/marks and manual checks: [verification report](../verification/stage-three-live-class-invitation.md).
- **Real browser, local production build:** teacher Present triggers the popup without reloading; Not now survives repeated same-session announcements; live stops remove the popup/badge; editing a module defers two invitations and preserves the draft; both A and B can be chosen correctly; returning home offers only the other session, then dismissal survives more round trips. Java ran after joining. Fresh sign-in during two live activities offered both. Missing live passes showed Reconnect, restoring them and clicking it recovered the popup on a subsequent announcement. Core join/deferral/dismissal and recovery checks were repeated after the final build. Disposable local test data was removed afterward.
- **Offline:** actual launcher config/build ran, then reused the existing dev server on 3000; it was left untouched. Real-browser checks instead used production `next start` on 3001 with the same local Supabase settings and laptop Java enabled. Recovery checks used a disposable port-3002 server. These were not fresh launcher-owned instances on port 3000.
- **Not verified:** Cloudflare/online, Windows, mobile layout, another physical device, other browser engines, or physically cutting the network. Socket reconnect callback behavior is unit-tested; browser recovery used a deliberately unavailable pass endpoint, not a forced socket/network outage. UI clicks were checked in the real app; no frontend unit-test harness was added.

## Not done yet (items 4–5 of the agreed plan)

- **Item 4 - lesson-open controls.** Not started.
- **Item 5 - teacher sees student web projects.** Not started.

Each of these needs its own before-code proposal before work starts, per `AGENTS.md`.

## Where the work is

- **Branches:** `landing-pages` (item 1, committed and pushed; PR #8 into `module-viewer`) → `codex/class-home` (item 2, committed and pushed; PR #9 into `landing-pages`) → `codex/live-class-invitation` (item 3, this change, PR targeting `codex/class-home`). Keep this stack order when the teacher reviews it; do not merge automatically.
- Local checkout and GitHub remote: same as `docs/handoffs/stage-one.md`.
- `docs/knowledgebase/workflow-state.md`, `frontend.md`, and `feature-index.md` describe class home. Next: item 4, lesson-open controls, with its own before-code proposal and approval. Item 3 is finished; no implementation for item 4 has started.
