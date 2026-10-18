# CKB-023 — Session expiry left the previous user's classroom choice and dismissals behind

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: app/page.tsx
- Search terms: shared computer wrong class after sign-in, 403 entering classroom after sign-in,
  live invitation missing after signing in, session expired then stuck on wrong class, next student
  sees previous student's classroom

## Symptom

Found by a second-opinion code review (Claude Code) of items 1-3's combined diff, not reported by
a teacher. `loadWorkspace`'s catch branch for `"Sign in required"`/`"Session expired"` reset only
`user`/`data`, unlike the explicit `logout()` function a few hundred lines away, which also resets
`enteredClassroomId`, `homeClassroomId`, `dismissedLiveSessions`, and `modulesOpen`.

## Root cause

Two separate code paths return the app to a signed-out state - the explicit **Sign out** button
and the automatic recovery when a request discovers the session already expired - and only one of
them was kept in sync with the full list of per-user state to clear. On a shared classroom
computer, a session expiring mid-use left the next student's sign-in still carrying the previous
student's `enteredClassroomId` (so the first bootstrap request after sign-in was scoped to a class
the new student might not be in, a 403) and `dismissedLiveSessions` (so a live invitation the new
student should see could stay silently suppressed, inherited from the previous student).

## Durable solution

The session-expiry catch branch in `loadWorkspace` (`app/page.tsx`) now resets the same four
pieces of state `logout()` resets: `enteredClassroomId`, `homeClassroomId`,
`dismissedLiveSessions`, `modulesOpen`. Any future per-user state added to one reset path belongs
in the other too - both are "this browser tab no longer belongs to that user."

## Regression proof

- No frontend unit-test harness exists in this project; this is pure in-memory React state with no
  isolated test entry point.
- Verified by code reading: the catch branch's reset list now matches `logout()`'s line for line.
- **Not reproduced in a real browser.** Simulating session expiry requires either waiting out a
  real token expiry or forging an invalid session server-side mid-session; neither was done this
  round. The fix is a direct, mechanical copy of an already-shipped and already-tested reset list.

## Recurrence triage

If a shared-computer user sees a wrong classroom or a missing live invitation right after signing
in, check both `logout()` and the session-expiry catch branch for state they clear - a new field
added to one and not the other reproduces this exact bug.

## History

- 2026-10-18 — Second-opinion review found the gap (`docs/handoffs/stage-three-review-findings.md`,
  finding 1); fixed on `codex/stage-three-review-fixes` after teacher approval.
