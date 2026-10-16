# Architecture

## What CodeShare is

A classroom web app (formerly JavaShare) where a teacher and senior high school students write code together: classes, teams (personal or group), projects and files, live code sharing with cursors, chat, teacher live share, saved work, and submissions. Students write Java, and since stage one PR (b), HTML, CSS, and JavaScript web projects.

## Parts

| Part | Folder | Hosted on (online) | Job |
| --- | --- | --- | --- |
| Pages | `app/` (Next.js 16.2.6, React 19) | Vercel (`vercel.json`) | Everything students and teachers see |
| Server | `backend/` (Express 5) | Render (`render.yaml`) | Sign-in and sessions, all database access, running Java, sending "this changed" live signals through Supabase |
| Database and live channels | `supabase/` (migrations, `config.toml`) | Hosted Supabase | Users, classes, teams, projects, files, versions, chat, saved work, submissions, photos (Storage bucket `student-photos`); **Supabase Realtime** carries live typing, cursors, live share, and who's online (since PR c1) |

The server is the only part that uses the secret Supabase service-role key. The browser talks to Supabase only for live channels, using a one-hour pass from the server (`GET /api/realtime/pass`); it cannot read tables.

## Two modes

| | Online: `npm run classroom:online` | Offline: `npm run classroom:offline` |
| --- | --- | --- |
| Database | Hosted Supabase (`backend/.env.online` or `backend/.env`) | Local Supabase in Docker on the teacher's laptop; the launcher reads its URL and keys from `supabase status` |
| Internet | Needed | Not needed. Students connect over the classroom Wi-Fi to the laptop's address on port 3000, and their live channels to the same address on port 54321 (local Supabase) |
| Java | Judge0 if `JUDGE0_URL` is set; it is empty today, so "demo mode" | `javac`/`java` on the laptop (`LOCAL_JAVA_EXECUTION=true`; never in production) |
| Web projects | Run in the student's browser | Same |

Both launch through `scripts/classroom-mode.mjs`, which then runs `scripts/classroom.mjs`: it builds, starts the server on port 4000 and the pages on port 3000, health-checks every 10 seconds, and logs to `logs/classroom.log`. Next.js forwards `/api` to port 4000 (`next.config.ts`) when `NEXT_PUBLIC_API_URL` is unset. Live channels connect straight to Supabase; offline, `browserReachableUrl` in `app/realtime.ts` swaps `127.0.0.1` for the laptop address the page was loaded from.

## Running code

- **Java:** `POST /api/execute` in `backend/src/server.ts`: local `javac` runner (blocked APIs, time, memory and output limits), else Judge0 (single file), else demo message.
- **Web (HTML/CSS/JS):** `app/webPreview.ts` builds a sandboxed page in the browser. See security-and-scoping.md.
- **Future:** in-browser Java (CheerpJ) and C# (.NET WebAssembly) plug in next to `app/webPreview.ts` and are chosen in `runCode()` in `app/page.tsx`. Not built yet.

## Live features (PR c1)

See backend.md, "Live events", and security-and-scoping.md, "Live channels". Approved update caps: typing 3 a second, cursors 4 a second (only when moved), live share 2 a second (`LIVE_CAPS` in `app/realtime.ts`).

## Planned (PR c2)

Move the `/api` routes into Next.js and host on Cloudflare (OpenNext needs Next.js 16.4.1 or newer). Vercel and Render are kept until Cloudflare is confirmed; offline mode is unchanged. See `docs/handoffs/stage-one.md`.
