# CKB-006 — Chat (and other server live signals) don't arrive on Cloudflare

- Status: resolved locally; waiting for the teacher's re-test on the Cloudflare preview
- First recorded: 2026-10-17
- Last verified: 2026-10-17
- Area: `backend/src/realtime.ts` (`broadcast`), `backend/src/routes.ts` (15 callers), `app/api/[...path]/route.ts`
- Search terms: chat not arriving, classroom chat missing, message not delivered, activity not appearing live, live share not starting, Cloudflare live signals, works offline not online

## Symptom

On the `cloudflare-c2` preview, the teacher and a student (John) were signed in on two devices. The student showed Online, and the student's typing and cursor reached the teacher live, but classroom chat messages did not arrive.

## Root cause

Verified on 2026-10-17. Chat goes browser to server (`POST /api/teams/:id/messages`), and the server then calls `broadcast()`. That function started its `fetch` to Supabase Realtime without waiting (`void fetch`). Cloudflare Workers stop unfinished work once the reply is sent, so the signal was dropped. Node (offline mode, Render) keeps running it, so offline worked. Typing and presence worked because they go browser to Supabase directly. All 15 server signals in `routes.ts` were affected: chat, file updates, activity deployed/ended, live share start/update, groups, profiles, permissions, chat mute, submissions.

Evidence: a throwaway script signed up a test student, joined JAVA101, listened on the team channel, and sent a chat message through the server.
- Local Cloudflare runtime (`npm run cf:preview`): saved, received live 0.
- The same `broadcast()` from plain Node: received 1.
- The teacher's preview: the message appeared only after a reload.

c2's local Cloudflare test checked routes one at a time and never had a second listener for a server signal, which is why it was missed.

## Durable solution

- `broadcast()` (`backend/src/realtime.ts`) is `async`, gives up after 3 seconds (`AbortSignal.timeout(3000)`), and still never throws.
- Every caller in `backend/src/routes.ts` uses `await broadcast(...)` before replying.
- Never go back to fire-and-forget on Cloudflare. If the delay (about 0.1 s per request) ever matters, use the Worker's `waitUntil` instead.

## Regression proof

- `tests/api-router.test.mjs`, test "routes: a chat message's live signal finishes sending before the reply (CKB-006)". It replaces the signal send with a slow fake and checks that the send has finished when the route replies. Needs local Supabase.
- Command: `sg docker -c "npm test"` (18 of 18 pass).
- Shown failing with the chat route's `await` removed ("the chat signal must have finished sending when the route replies"), and passing once restored.
- Re-run on the local Cloudflare runtime after the fix: received live 1. Offline (`classroom:offline`, port 3000): received live 1.
- Only the chat route has its own automated check; the other 14 got the same one-word change.

## Recurrence triage

If the message appears after a reload, saving worked and only the live signal was lost (this case). If it's missing even after a reload, the save failed: a different problem. If typing is also missing, look at the browser's channel connection instead.

## History

- 2026-10-17 — Seen during the teacher's Cloudflare preview test (chat arrived only after a refresh). Cause reproduced locally; the teacher approved the fix as an adjustment; fixed on `cloudflare-c2`.
