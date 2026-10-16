# PR (c) proposal: CodeShare on Cloudflare, live features on Supabase Realtime

Status: **approach approved by the teacher on 2026-10-16** (decision 1). All four decisions made. Nothing is built yet. Written 2026-10-16.

## What has to change, and why

Today CodeShare has three parts: the **pages** (Next.js, on Vercel), the **server** (Express and Socket.IO, on Render), and **Supabase**. The server does two jobs:

1. **Ordinary requests:** sign-in, saving files, creating activities, chat messages, running Java.
2. **Live features through Socket.IO:** a permanently open connection to every browser that relays typing, cursors, each student's active file, teacher live share, who is online, and "something changed, reload" signals.

Cloudflare runs code as short-lived "Workers". They are fine for job 1, but they can't keep a Socket.IO server with its memory running. They also can't run `javac`, so online Java stays in demo mode as it is today.

## My recommendation (one combined approach)

### A. Move the server's ordinary requests into the Next.js app

Every `/api/...` route becomes a Next.js route in the same app, reusing today's database code (`supabase-repository.ts`) almost unchanged.

- **Online:** the pages and the routes run together on Cloudflare. The service-role key is a **Cloudflare secret**, used only by the routes, never in the browser.
- **Offline:** the same app runs on the laptop with `next start`. The Java-running route still uses the laptop's `javac` there. The launcher starts one program on port 3000 instead of two.
- Sign-in stays the same idea (the `javashare_session` cookie). Its signing library changes to one that works on Cloudflare (`jose`).

### B. Replace Socket.IO with Supabase Realtime

Supabase Realtime is a live-message service already inside Supabase, and inside the local Supabase that runs in Docker on the laptop. So **one version of the code works online and offline**.

| Today (Socket.IO) | After (Supabase Realtime) |
| --- | --- |
| Team room `team:<id>`: typing, cursors, active file | Private channel `team:<id>`, using **Broadcast** (messages passed between browsers, not stored) |
| Class room `class:<id>`: live share typing, activity started/ended, groups changed, chat muted | Private channel `class:<id>`, using Broadcast |
| Who is online (server memory) | **Presence** on the class channel (each browser announces itself; Supabase tracks who is there) |
| Server says "file saved", "chat message", "submitted" | The route that did the save sends the same Broadcast message through Supabase |
| Newcomer gets teammates' unsaved typing (server memory) | Newcomer asks on the team channel, and teammates' browsers answer with their unsaved text |

- **Who may join a channel.** Channels are **private**: Supabase checks a rule (a database "policy", added in a **new migration**) that you are a member of that team or class. For that check, the browser needs a short-lived pass (a token, valid for one hour) that our server signs with the Supabase project's JWT secret, then renews.
- **Closing a side door.** That same pass could also be used to read tables directly. A new migration will remove those old direct-table permissions, which the app has never used, so the pass works for live channels only.

## Trade-offs to know before choosing

1. **Free-plan limits online (the big one).** Supabase's free plan allows 200 connections at once, 100 live messages per second, and 2 million messages per month. One message sent to 40 students counts as 41.
   - Teacher live share at 2 updates a second to 40 students is about 82 messages a second: just under the limit.
   - A rough guess for a busy one-hour class is 200,000–400,000 messages, so about **5–10 busy class-hours a month** before the free quota runs out. Then Supabase sends a warning and a grace period.
   - To stay under, I'd send typing at most about 3 times a second per student, cursors only when they move, and live share at most 2 times a second. Typing would look slightly less instant (about a quarter of a second).
   - **Offline mode has no limits:** local Supabase isn't metered.
   - If the free plan proves too small, Supabase Pro (about USD 25/month) raises the limits.
2. **Permission checks get coarser for typing.**
   - Today the server checks every keystroke against "is this member's editing locked by the group leader?".
   - With Realtime, Supabase only checks that you belong to the team. A locked member's browser already stops them typing, and other browsers would ignore their typing messages. **Saving** is still fully checked by the server.
3. **Simultaneous typing.** Two people typing in the same file at the same moment behaves about as it does today: each message carries the full text, so everyone settles on the latest version. It's not perfect merging, today or after.
4. **Being signed out when the server restarts goes away online.**
   - Cloudflare runs many short-lived copies of the server, so "sign everyone out on restart" can't work there.
   - I propose keeping sign-in valid for its 7 days everywhere. Separate question for you: keep "restart signs everyone out" in offline mode only?
5. **Offline network ports.** Students' browsers will connect to the laptop on port **54321** (local Supabase), as well as 3000. On Windows, the firewall must allow port 54321 on private networks. I'll add this to the instructions.
6. **Next.js upgrade.** Cloudflare's Next.js adapter needs Next.js 16.4.1 or newer. The repository has 16.2.6, so PR (c) upgrades it to 16.4.2. Middleware isn't supported on Cloudflare; CodeShare doesn't use it.
7. **Size limit.** On Cloudflare's free plan the packed app must be under 3 MB (compressed). I'll check this while building; the paid plan allows 10 MB.
8. **The hosted project's JWT secret.** The live-channel pass needs it as a second Cloudflare secret.
   - Some newer Supabase projects use a different key system. I can't see your hosted settings, so I'll give you the steps to check, and a fallback if yours differs.
   - Local Supabase on this laptop does provide a JWT secret (checked by name only, without displaying it). Not yet tested: that its live channels accept a pass signed with it. That's the first thing I'd prove when building.

## Other options I considered

| Option | Why not first choice |
| --- | --- |
| **Keep Socket.IO on Render, move only the pages to Cloudflare** | Least work. But the secret key and live features stay on Render, and Render's free plan sleeps when idle. It doesn't meet "the pages and the secret key on Cloudflare". |
| **Cloudflare Durable Objects** (Cloudflare's own way to hold live connections) | Closest to today's Socket.IO, with full per-keystroke checks and generous free limits. But it **doesn't exist on the laptop offline**, so CodeShare would need two different live systems, one online and one offline. That doubles the code and the testing. |
| **Supabase Realtime "database changes" only** (no Broadcast) | Every keystroke would have to be written to the database first: slow, and it fills the database. |

## Keeping Vercel and Render working

- PR (c) leaves `vercel.json` and `render.yaml` in place.
- Your current site keeps running the **old** code from `main` until you merge PR (c).
- Plan: Cloudflare builds a **preview** from the PR (c) branch. You test it there and confirm. Only then do you merge.
- After merging, Vercel would need the new secret too, or you switch it off. Removing Render and Vercel would be a later step, once you're happy.

## What PR (c) would contain

1. Upgrade Next.js to 16.4.2 and add the Cloudflare adapter and its settings.
2. Move every `/api` route into Next.js routes, keeping the Java runner for offline only.
3. Realtime: new migration (channel rules, plus removing the unused direct-table permissions), a token route, and browser code that replaces Socket.IO.
4. Launcher: offline mode starts local Supabase and one app on port 3000, and tells students' browsers to use the laptop's address for live channels.
5. `docs/cloudflare-setup.md`: step-by-step, for a non-developer: connect Cloudflare to GitHub, add the secrets, test the preview.
6. Knowledge-base and handoff updates. Tests: automated checks for tokens and permission rules where possible, plus a full offline run like PR (b), with two browsers for live typing, cursors, chat and live share.

Because it is large, I may split it into (c1) the Next.js upgrade and route move, and (c2) Realtime. I'll ask before splitting.

## Decisions needed (one at a time)

1. ✅ Approved 2026-10-16: the approach above (move the routes into Next.js, and use Supabase Realtime Broadcast and Presence).
2. ✅ Decided 2026-10-16: drop sign-out on server restart everywhere (7-day sign-in online and offline).
3. ✅ Decided 2026-10-16: caps, the same online and offline. Typing at most 3 updates a second, cursors only on move at most 4 a second, live share at most 2 a second.
4. ✅ Decided 2026-10-16: split into two pull requests.

## Sources checked (2026-10-16)

- Supabase Realtime limits: https://supabase.com/docs/guides/realtime/limits
- How Realtime messages are counted: https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages
- Private channel authorization: https://supabase.com/docs/guides/realtime/authorization
- Supabase pricing (2 million messages a month on Free): https://supabase.com/pricing
- OpenNext for Cloudflare (supported versions, 3 MB / 10 MB limits): https://opennext.js.org/cloudflare
- OpenNext Cloudflare 1.20.12 requires Next.js 16.4.1 or newer (checked with `npm view` on 2026-10-16)
