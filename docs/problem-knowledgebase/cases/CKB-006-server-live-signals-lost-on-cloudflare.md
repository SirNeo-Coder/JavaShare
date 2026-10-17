# CKB-006 — Chat (and other server live signals) don't arrive on Cloudflare

- Status: investigating (cause suspected, not yet confirmed or fixed)
- First recorded: 2026-10-17
- Last verified: 2026-10-17
- Area: `backend/src/realtime.ts` (`broadcast`), `backend/src/routes.ts` (15 callers), `app/api/[...path]/route.ts`
- Search terms: chat not arriving, classroom chat missing, message not delivered, activity not appearing live, live share not starting, Cloudflare live signals, works offline not online

## Symptom

On the `cloudflare-c2` preview, the teacher and a student (John) were signed in on two devices. The student showed Online, and the student's typing and cursor reached the teacher live, but classroom chat messages did not arrive.

## Root cause

Suspected, not confirmed. Typing and presence go browser to Supabase Realtime directly, and they worked. Chat goes browser to server (`POST /api/teams/:id/messages`), and the server then calls `broadcast()`. That function starts its `fetch` to Supabase without waiting for it (`void fetch`). Cloudflare Workers may cancel unfinished work once the response is sent, unless it's awaited or passed to `waitUntil`. Node (offline, Render) keeps running it, which would explain why offline worked. If this is right, all 15 server signals are affected: chat, file updates, activity deployed/ended, live share start, groups, permissions, submissions.

Not yet checked: whether the message was saved (reload shows it), and Cloudflare's Logs for that request.

## Durable solution

Not fixed. Candidate: let `broadcast()` be awaited, or hand it to the Worker's `waitUntil`, so the signal finishes before the Worker stops. Needs teacher approval first.

## Regression proof

- None yet. Plan: reproduce on `npm run cf:preview` with a Node client listening on the team channel, show it failing, fix, show it passing.

## Recurrence triage

If the message appears after a reload, saving worked and only the live signal was lost (this case). If it's missing even after a reload, the save failed: a different problem.

## History

- 2026-10-17 — Seen during the teacher's Cloudflare preview test; recorded, investigation paused at the teacher's request.
