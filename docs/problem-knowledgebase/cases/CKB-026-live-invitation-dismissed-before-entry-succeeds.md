# CKB-026 — A live-class invitation was marked dismissed before the join it triggered had succeeded

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: app/page.tsx
- Search terms: live class invitation disappeared after failed join, flaky connection join live
  class stuck, invitation lost without reload, join live class then stuck preparing classroom

## Symptom

Found by a second-opinion code review (Claude Code), not reported by a teacher. `enterClassroom()`
in `Landing.tsx` called `onDismissLiveClasses([item])` synchronously, before the classroom-scoped
workspace load that `onEnter` triggers had actually succeeded. On a flaky connection, a student
clicking **Join live class** would have the invitation marked dismissed immediately; if the scoped
bootstrap fetch then failed, they were left on "Preparing your classroom..." (there is no back
button on that screen in either role, a pre-existing, broader gap not introduced by this feature
and not fixed here) with the invitation now incorrectly marked as seen.

## Root cause

The dismissal and the entry attempt were not ordered by actual success - dismissal happened at
click time, success or failure was only known later, in a separately-triggered effect
(`loadWorkspace`), with no link back to "was this entry for a dismissed invitation."

## Durable solution

`loadWorkspace`'s error branch in `app/page.tsx` (the one that sets `workspaceError`, not the
session-expiry one) now reverts that classroom's entry in `dismissedLiveSessions` whenever a
scoped classroom load fails, regardless of what triggered the entry. Reverting a classroom id that
was never dismissed is a no-op (object-entries filter over a key that isn't present), so this is
safe to apply unconditionally rather than threading "was this an invitation join" through `onEnter`.
`enterClassroom()` itself is unchanged - the dismissal still happens immediately on click, which is
correct for the success path (the invitation should disappear right away when the student really
is joining); only a failed load now undoes it.

## Regression proof

- No frontend unit-test harness exists in this project for this effect's interaction with
  `dismissedLiveSessions` state.
- Verified by code reading: the revert runs in the same catch branch that already sets
  `workspaceError` for a failed scoped load, keyed off the same `enteredClassroomId` the load was
  for.
- **Not reproduced in a real browser** (forcing the scoped bootstrap fetch to fail after clicking
  **Join live class**) - this session avoided interactive browser testing of this feature to not
  disturb another concurrently running dev-server session sharing the same browser profile's
  session cookie and local Supabase instance. Said plainly rather than silently skipped.
- The broader gap this symptom also depends on - no way back to class home from a failed/stuck
  classroom entry, for any role, not just invitations - was noticed but is out of this fix's
  approved scope; flag separately if the teacher wants it addressed.

## Recurrence triage

If an invitation reappears after a failed join when it shouldn't (e.g. the student actually did
join successfully), check this revert logic isn't firing on a load that actually succeeded for a
*different* classroom while `enteredClassroomId` briefly pointed elsewhere.

## History

- 2026-10-18 — Second-opinion review found the gap (`docs/handoffs/stage-three-review-findings.md`,
  finding 4); fixed on `codex/stage-three-review-fixes` after teacher approval.
