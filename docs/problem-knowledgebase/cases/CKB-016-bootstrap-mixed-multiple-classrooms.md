# CKB-016 — Entering one class could pull in another class's workspace

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: backend/src/supabase-repository.ts (`bootstrapFromSupabase`), the class-list landing page
- Search terms: second class shows the first class's students, wrong teacher-demo workspace, activity from one class appears in another, class list entering class B shows class A's team, multi-class workspace mixing, classroom data leaked between classes

## Symptom

Not a live incident — found while building the class-list landing page (a teacher can now
create more than one class). No prior CKB matched; this was a new design review, not a bug
report.

## Root cause

`bootstrapFromSupabase` always loaded *every* classroom the signed-in user belonged to
(`loadClasses(user)`), then queried teams/activities/projects `.in("classroom_id", classIds)`
across all of them at once, mixing the results into one flat `teams` list with no classroom tag
on each entry. This was invisible before because the app only ever gave anyone one classroom.
Once a teacher could own two, requesting the workspace for class A could return class B's
teacher-demo workspace alongside it, and class A's running activity could appear while class B
was open (same root-cause shape as CKB-010, one level up: that one was module progress leaking
across classrooms, this is the whole workspace).

## Durable solution

`bootstrapFromSupabase(user, teacherView, classroomId?)` now branches on `classroomId`:
- No `classroomId` → returns only the lightweight class list (`listSupabaseClassSummaries`), no
  teams/activities loaded at all — this is what the class-list screen uses.
- `classroomId` given → `canAccessSupabaseClass` must pass, then `classes` is set to exactly
  that **one** classroom row before any of the existing teams/activities/projects logic runs, so
  every downstream query (`classIds`) only ever covers that single class.

`GET /api/bootstrap` passes `req.query.classroomId` through unchanged. `app/page.tsx` keeps an
`enteredClassroomId` state and always includes it on every bootstrap refetch (`loadWorkspace`),
so no code path can silently drop back to aggregating across classes.

## Regression proof

- Test file: `tests/landing-pages.test.mjs`, test "class list and creation: a teacher creates
  classes, a student joins one, and one class's workspace never bleeds into another's" — gives
  class A a running activity, enters A (expects to see it, expects exactly one teacher-demo
  team), then enters B (expects no activity, still exactly one teacher-demo team).
- Command: `npm test` (needs local Supabase running).
- Shown failing before the fix: reverted the single-classroom-row line back to `loadClasses(user)`
  (simulating the old aggregate code) and reran just this test — failed with
  `2 !== 1` on "only class A's own teacher-demo workspace must appear when A is entered". Restored
  the fix and reran the full suite: 35/35 pass.
- Commit: (this change, branch `landing-pages`).

## Recurrence triage

If a teacher or student with more than one class reports seeing another class's roster,
students, activity, or live-share state while a *specific* class is open, check whether the
request path is going through `bootstrapFromSupabase` with a `classroomId` — anything that adds
a new per-classroom query inside that function must filter by the single `classes` array it
builds, not reach for `loadClasses(user)` directly. If the symptom is a student's *module
progress* (not the live workspace) crossing classrooms, that's CKB-010, not this one.

## History

- 2026-10-18 — Found while designing the Google-Classroom-style class list; fixed in the same
  change, before any class ever had two real classrooms in production.
