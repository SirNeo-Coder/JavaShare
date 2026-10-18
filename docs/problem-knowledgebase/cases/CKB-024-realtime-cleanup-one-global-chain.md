# CKB-024 — One global realtime cleanup chain made every screen wait on every other screen's teardown

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: app/realtime.ts, app/liveClasses.ts, app/page.tsx, app/teacher/accounts/page.tsx
- Search terms: live classroom slow to connect, joining live classroom stuck, realtime subscribe
  delayed by unrelated screen, shared computer sign-in slow to connect live, CKB-017 follow-up

## Symptom

Found by a second-opinion code review (Claude Code), not reported by a teacher. CKB-017 added a
single module-global `channelCleanup` promise that every `realtimeClient()` caller awaited before
getting the shared client, so that a screen's new subscription would never reuse a channel object
the previous screen was still removing. That fix was correct for the one lifecycle it targeted but
coarser than necessary: it made *every* subscriber wait on *any* pending removal anywhere in the
app, and `forgetRealtimeClient()` (sign-out) never reset it, so a fast sign-out-then-sign-in on a
shared computer could make the new user's first live connection wait on a teardown chain that
belonged to the previous, already-discarded client.

## Root cause

The lock was keyed by nothing - one chain, module-wide - when the actual hazard (the installed
SDK's `channel(topic)` returning an existing, still-being-removed channel for that exact topic)
is scoped to a single topic string. Nothing distinguished "this removal belongs to my topic" from
"this removal belongs to a completely different screen, or a completely different signed-out
user's client."

## Durable solution

- `app/realtime.ts`: `channelCleanup` is now a `Map<topic, Promise<void>>`, keyed by the SDK's own
  prefixed topic string. `releaseRealtimeChannels` records each channel's removal under its own
  topic. `privateChannel` awaits only the entry for the topic it's about to (re)subscribe -
  unrelated topics never wait on each other.
- `forgetRealtimeClient()` clears the map on sign-out: the outgoing client's pending removals are
  irrelevant to whichever client a next sign-in creates.
- `privateChannel` became `async` to do this wait at the one place the topic is actually known;
  its three call sites (`app/liveClasses.ts`, `app/page.tsx`, `app/teacher/accounts/page.tsx`) were
  updated to await it instead of using it synchronously.

## Regression proof

- File: `tests/realtime.test.mjs`.
- Exact tests: "realtime: an unrelated topic's subscriber never waits on another topic's pending
  removal", "realtime: resubscribing the same topic waits for its own pending removal to finish
  first (CKB-017)", "realtime: signing out clears pending cleanup so the next sign-in's subscriber
  never waits on the discarded client's teardown".
- File: `tests/live-classes.test.mjs` (CKB-017's existing regression test, updated for
  `privateChannel`'s new async signature, otherwise unchanged in intent) - "live invitations:
  entering or leaving the workspace waits for old channels to close before reusing their topics".
- Command: `node --test tests/realtime.test.mjs tests/live-classes.test.mjs`.
- **Shown failing:** stashed the `app/realtime.ts`/`app/liveClasses.ts`/`app/page.tsx`/
  `app/teacher/accounts/page.tsx` changes (keeping the new tests in place) and reran; the three new
  `tests/realtime.test.mjs` assertions failed (the old synchronous `privateChannel` broke
  `promise.then`, since the test awaits it). Restored the changes: all tests passed, including the
  pre-existing CKB-017 test (updated only for the signature change, not its assertions).
- Full suite: `npm test` - 55/55 pass, no skips.
- Commit: see this fix's commit on `codex/stage-three-review-fixes`.

## Recurrence triage

If one live feature feels slow to connect right after another live feature's screen closed,
check whether `channelCleanup` is still scoped correctly before assuming a network issue. If a
fresh sign-in on a shared computer is slow to connect, check that `forgetRealtimeClient()` is
still clearing the map - this is the earlier symptom this case specifically fixed.

## History

- 2026-10-18 — Second-opinion review found the gap (`docs/handoffs/stage-three-review-findings.md`,
  finding 2); fixed on `codex/stage-three-review-fixes` after teacher approval.
