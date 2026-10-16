# CodeShare

CodeShare (formerly JavaShare) is a collaborative coding classroom with a Next.js frontend, a Node/Express backend, Supabase Auth/Postgres storage, Socket.IO collaboration, and optional Judge0 execution.

## Architecture

- `app/` — Next.js classroom UI for local LAN use and Vercel
- `backend/` — Express API, sessions, Socket.IO, Supabase repository, and Java execution gateway
- `supabase/` — Postgres schema, Row Level Security, grants, and local Docker configuration
- Supabase — users, classes, teams, projects, files, versions, chat, saved work, and submissions

Students connect only to the CodeShare frontend and backend. The backend is the only component that uses the secret Supabase service-role key; never expose that key in a browser or a `NEXT_PUBLIC_` variable.

## Install and verify

```powershell
npm install
npm run build:all
npm run lint
```

## Hosted Supabase classroom (recommended)

Create `backend/.env.online` from `backend/.env.online.example`, or use the existing ignored `backend/.env`, and provide the hosted project URL and keys. Then run:

```powershell
npm run classroom
```

`npm run classroom` is an alias for `npm run classroom:online`. Docker is not required for online mode.

The launcher builds and starts the frontend on port `3000` and backend on port `4000`. Students open the LAN frontend address printed in the terminal. Next.js forwards API requests to the backend, while Socket.IO connects directly to port `4000` for realtime events. Keep the teacher computer awake and allow Node.js/ports `3000` and `4000` through Windows Firewall on private networks.

## Local Supabase classroom (offline)

Offline mode requires Docker Desktop. Start it, then run:

```powershell
npm run classroom:offline
```

The launcher starts the local Supabase stack and automatically obtains its URL and API keys. `backend/.env.offline` is optional; copy `backend/.env.offline.example` only when custom settings are needed.

To reset the local database manually:

```powershell
npx.cmd supabase start
npx.cmd supabase db reset
```

## Database migrations

Apply pending migrations to the linked hosted Supabase project with:

```powershell
npx.cmd supabase db push
```

The schema and API role grants live in `supabase/migrations`.

## Web projects (HTML, CSS, JavaScript)

Students press **New web project** to get `index.html`, `style.css`, and `script.js`. **Run** builds the page in the student's own browser inside a sandboxed frame (`sandbox="allow-scripts"`, no `allow-same-origin`), so the page cannot read the student's login or CodeShare data. `console.log` output and errors appear under the preview with file and line numbers. Nothing is loaded from the internet. The code lives in `app/webPreview.ts`; run its checks with `npm test`.

Projects record their kind in `projects.language` (`java` or `web`; migration `20261016000100_project_language.sql`). In-browser Java (CheerpJ) and C# (.NET WebAssembly) runners will plug in next to `app/webPreview.ts` and be chosen in `runCode()` in `app/page.tsx`; the server Java runner below stays.

## Knowledge base and working rules

- `AGENTS.md`: the working rules for every coding assistant (`CLAUDE.md` points to it).
- `docs/knowledgebase/README.md`: a map of the app.
- `docs/problem-knowledgebase/`: past bugs as numbered `CKB-NNN` records. Search them with `npm run kb:search -- "words"`.
- `docs/handoffs/stage-one.md`: where the current stage stands.

## Course modules

The module file format for stage two is in [docs/course-format.md](docs/course-format.md).

## Java execution

For classroom use, `LOCAL_JAVA_EXECUTION=true` lets the backend use the teacher computer's JDK. It blocks common file, network, process, and system-control APIs and enforces time, memory, output, rate, and concurrency limits. It is still not a complete security sandbox and is forcibly disabled when `NODE_ENV=production`.

For an internet deployment, configure Judge0 instead:

```text
JUDGE0_URL
JUDGE0_API_KEY
```

## Internet deployment

For the frontend, set:

```text
NEXT_PUBLIC_API_URL=https://your-backend.example.com
```

For the backend, configure:

```text
DATABASE_MODE=supabase-online
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
JWT_SECRET
FRONTEND_URL=https://your-frontend.example.com
JUDGE0_URL
JUDGE0_API_KEY
```

`render.yaml` contains the Render service definition. Never commit populated environment files, Supabase service-role keys, session secrets, or Judge0 keys.

## Data model

Current file content is stored as plain text in Postgres. Every accepted save records the previous content in `file_versions`, and every submission stores an immutable file snapshot. Supabase Auth owns credentials while `profiles` stores CodeShare roles and classroom identity.

## Names kept from JavaShare

These internal names still say `javashare` on purpose. Renaming them would sign everyone out, reset saved settings, or start an empty database, and nobody sees them:

- the sign-in cookie `javashare_session` and browser settings `javashare-theme` / `javashare-font-scale`
- the local Supabase `project_id = "javashare"` in `supabase/config.toml` (offline database data is stored under this name)
- the Render service name `javashare-backend` in `render.yaml`
- database tables, columns, and existing migrations
