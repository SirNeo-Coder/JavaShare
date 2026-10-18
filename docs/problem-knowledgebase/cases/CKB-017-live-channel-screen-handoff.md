# CKB-017 — A screen could reuse the live channel its previous screen was closing

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: app/realtime.ts, app/liveClasses.ts, app/page.tsx
- Search terms: live-class invitation join disconnects, live channel reused across screens, subscribe called twice, channel closed after entering classroom, live connection lost returning to class home

## Symptom

Caught before release while building stage-three item 3, rather than reported by a teacher.
The new class-list listener and the existing live workspace need the same private class topic.
A focused test using the installed SDK showed that requesting that topic while the previous
screen was still leaving returned the previous screen's very same channel object.
No prior case matched this lifecycle collision; CKB-006 concerns server delivery, and CKB-016
concerns classroom data scoping.

## Root cause

The installed Supabase Realtime client's `channel(topic)` returns an existing channel with
that topic. `removeChannel()` finishes asynchronously. React screen cleanup cannot itself
block the next screen's effects, so requesting the topic before removal finishes reuses the
channel being removed. Merely starting cleanup is insufficient.

## Durable solution

- `releaseRealtimeChannels(client, channels)` in `app/realtime.ts` records pending channel
  removals. `realtimeClient()` waits for those removals before returning the shared client to
  a new subscriber.
- Both `listenForLiveClasses` and the workspace effect release only the channels they own.
  Cancelled listeners ignore late callbacks.
- Workspace effects run only when a classroom has actually been entered and the loaded
  classroom matches it. Landing refreshes stay local to `Landing`, so an in-flight class-list
  reply cannot overwrite workspace data after joining.

## Regression proof

- File: `tests/live-classes.test.mjs`.
- Exact test: "live invitations: entering or leaving the workspace waits for old channels to close before reusing their topics".
- Command: `sg docker -c 'node --test tests/live-classes.test.mjs'`.
- Uses the installed SDK's real topic reuse, delays channel removal, and verifies the new screen
  waits and then receives a fresh channel object. No browser socket is opened by this unit test.
- **Shown failing:** temporarily removed `await channelCleanup` and ran the test with
  `--test-name-pattern="waits for old channels"`. It failed at "a new screen must wait for the old
  subscription to leave", `true !== false`. Restored the wait: all four invitation tests passed.
- Real browser: joined class B from the two-class invitation, saw **Live classroom connected**,
  ran Java successfully, returned to class home, and repeated the round trip without channel
  errors. This checks both directions through the app; it does not simulate every network race.
- Commit: implementation on `codex/live-class-invitation`; see the stage-three handoff.

## Recurrence triage

If announcements fail while remaining on one screen, investigate the live connection or
CKB-006 first. If they fail specifically after entering or leaving the workspace, inspect
channel ownership and whether the new subscriber awaited the old removal. Do not solve this
by removing all channels: unrelated class listeners may still need theirs.

## History

- 2026-10-18 — The teacher approved item 3 as a workflow change. Identified the shared-topic
  lifecycle risk in the installed SDK, added serialized cleanup and mutation proof, and
  verified the real invitation-to-workspace transition locally.
