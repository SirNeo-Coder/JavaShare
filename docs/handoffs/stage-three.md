# Stage three handoff (Google-Classroom-style navigation)

**Status: item 1 built and tested, not yet committed as its own PR.** Last updated: 2026-10-18.

## What the teacher asked for

A Google-Classroom-inspired interface: on login, a teacher sees their classes; opening one shows
the roster and each student's module progress, and is where the teacher uploads modules. A
student, on login, sees their classes; opening one shows its modules and their progress. Also
asked for, in the same round: teacher control over which lessons are open per module, and a way
for teachers to see a student's web project.

A feature-level plan (no code) was written and approved first - see the five numbered items
below. Build order agreed: class list + creation, then class home, then the live-class join
popup, then lesson-open controls, then teacher web-project visibility.

## Item 1: class list + teacher class creation — built and tested

**Before-code proposal approved 2026-10-18.** Branch: `landing-pages` (uncommitted so far).

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

## Not done yet (items 2-5 of the agreed plan)

- **Item 2 - class home.** Right now "class home" content (roster, per-student module progress)
  still lives inline on the class-list screen itself (expand a class card), not as its own
  screen, and module upload still lives in the in-workspace "Modules" button, not moved here yet.
- **Item 3 - live-class join popup.** No notification yet when a class the user belongs to is
  live; they have to open the class list and look for the "Live now" badge themselves.
- **Item 4 - lesson-open controls.** Not started.
- **Item 5 - teacher sees student web projects.** Not started.

Each of these needs its own before-code proposal before work starts, per `AGENTS.md`.

## Where the work is

- **Branch:** `landing-pages`, uncommitted. Built directly on top of the tip of `main`'s current
  branch state (same base as stage two's stack - see `docs/handoffs/stage-two.md`).
- Local checkout and GitHub remote: same as `docs/handoffs/stage-one.md`.
- `docs/knowledgebase/workflow-state.md`, `backend.md`, and `frontend.md` are updated in this
  change (workflow change - new login landing screen, new teacher action).
