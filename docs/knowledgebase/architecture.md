# Architecture

## What CodeShare is

A classroom web app (formerly JavaShare) where a teacher and senior high school students write code together: classes, teams (personal or group), projects and files, live code sharing with cursors, chat, teacher live share, saved work, and submissions. Students write Java, and since stage one PR (b), HTML, CSS, and JavaScript web projects.

## Parts

| Part | Folder | Hosted on (online) | Job |
| --- | --- | --- | --- |
| Pages | `app/` (Next.js 16.2.6, React 19) | Vercel (`vercel.json`) | Everything students and teachers see |
| Server | `backend/` (Express 5 + Socket.IO 4) | Render (`render.yaml`) | Sign-in and sessions, all database access, live sharing, cursors, chat, running Java |
| Database | `supabase/` (migrations, `config.toml`) | Hosted Supabase | Users, classes, teams, projects, files, versions, chat, saved work, submissions, photos (Storage bucket `student-photos`) |

The server is the only part that uses the secret Supabase service-role key. The browser never talks to Supabase directly.

## Two modes

| | Online: `npm run classroom:online` | Offline: `npm run classroom:offline` |
| --- | --- | --- |
| Database | Hosted Supabase (`backend/.env.online` or `backend/.env`) | Local Supabase in Docker on the teacher's laptop; the launcher reads its URL and keys from `supabase status` |
| Internet | Needed | Not needed. Students connect over the classroom Wi-Fi to the laptop's address on port 3000 |
| Java | Judge0 if `JUDGE0_URL` is set; it is empty today, so "demo mode" | `javac`/`java` on the laptop (`LOCAL_JAVA_EXECUTION=true`; never in production) |
| Web projects | Run in the student's browser | Same |

Both launch through `scripts/classroom-mode.mjs`, which then runs `scripts/classroom.mjs`: it builds, starts the server on port 4000 and the pages on port 3000, health-checks every 10 seconds, and logs to `logs/classroom.log`. Next.js forwards `/api` and `/socket.io` to port 4000 (`next.config.ts`) when `NEXT_PUBLIC_API_URL` is unset. The browser's Socket.IO connects straight to port 4000 (`getSocketUrl` in `app/page.tsx`).

## Running code

- **Java:** `POST /api/execute` in `backend/src/server.ts`: local `javac` runner (blocked APIs, time, memory and output limits), else Judge0 (single file), else demo message.
- **Web (HTML/CSS/JS):** `app/webPreview.ts` builds a sandboxed page in the browser. See security-and-scoping.md.
- **Future:** in-browser Java (CheerpJ) and C# (.NET WebAssembly) plug in next to `app/webPreview.ts` and are chosen in `runCode()` in `app/page.tsx`. Not built yet.

## Planned (stage one PR c, not decided)

Pages on Cloudflare (OpenNext needs Next.js 16.4.1 or newer), live features replaced (the teacher expects Supabase Realtime), Vercel and Render kept until Cloudflare is confirmed, offline mode unchanged. See `docs/handoffs/stage-one.md`.
