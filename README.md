# CodeShare

CodeShare (formerly JavaShare) is a collaborative coding classroom: a Next.js app (pages plus its own `/api` server routes), Supabase Auth/Postgres storage, Supabase Realtime collaboration, online Java 8 execution in the browser, and laptop Java execution offline.

## Architecture

- `app/` — Next.js pages; `app/api/[...path]/route.ts` serves every `/api` request
- `backend/src/` — the server code those routes run: sessions, Supabase repository, live signals to Supabase Realtime, and the laptop Java runner. `backend/src/server.ts` is a thin Express wrapper kept only so the existing Render deployment keeps working.
- `supabase/` — Postgres schema, Row Level Security, grants, and local Docker configuration
- Supabase — users, classes, teams, projects, files, versions, chat, saved work, and submissions

Students connect to the CodeShare app (and, for live features, Supabase Realtime). Only the server routes use the secret Supabase service-role key; never expose that key in a browser or a `NEXT_PUBLIC_` variable.

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

The launcher builds and starts CodeShare (pages and server routes together) on port `3000`. Students open the LAN address printed in the terminal. Live features (typing, cursors, chat updates, live share) connect to Supabase Realtime: online to the hosted project, offline to port `54321` on the teacher computer. Keep the teacher computer awake and allow Node.js and ports `3000` and `54321` through Windows Firewall on private networks.

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

Projects record their kind in `projects.language` (`java` or `web`; migration `20261016000100_project_language.sql`). Online Java uses `app/javaExecution.ts` and the separate public runner in `java-runtime/`; see [online Java setup](docs/online-java-setup.md). C# is not implemented. The laptop Java runner stays for offline use.

## Knowledge base and working rules

- `AGENTS.md`: the working rules for every coding assistant (`CLAUDE.md` points to it).
- `docs/knowledgebase/README.md`: a map of the app.
- `docs/problem-knowledgebase/`: past bugs as numbered `CKB-NNN` records. Search them with `npm run kb:search -- "words"`.
- `docs/handoffs/stage-one.md`: where the current stage stands.

## Course modules

The module file format for stage two is in [docs/course-format.md](docs/course-format.md).

## Java execution

Online **Run code** compiles all project files with Java 8 in the student's browser
using CheerpJ. Configure the separate public `JAVA_RUNNER_URL` as described in
[online Java setup](docs/online-java-setup.md). Packages, multiple classes and input
are supported; Java 9+ features are not. No student source is sent to an external
compiler service. Offline continues using the laptop's installed `javac`.

Legacy execution settings:

For classroom use, `LOCAL_JAVA_EXECUTION=true` lets the backend use the teacher computer's JDK. It blocks common file, network, process, and system-control APIs and enforces time, memory, output, rate, and concurrency limits. It is still not a complete security sandbox and is disabled in production unless the classroom launcher explicitly sets `CODESHARE_LAPTOP=true`.

Legacy single-file Judge0 deployments may still use:

```text
JUDGE0_URL
JUDGE0_API_KEY
```

## Internet deployment

**Cloudflare (new):** follow [docs/cloudflare-setup.md](docs/cloudflare-setup.md). The pages and server routes run together on Cloudflare; `wrangler.jsonc` and `open-next.config.ts` hold the settings, and `npm run cf:preview` runs the Cloudflare build locally (put local settings in a git-ignored `.dev.vars`).

**Vercel + Render (current, kept until Cloudflare is confirmed).** For the frontend on Vercel, set:

```text
NEXT_PUBLIC_API_URL=https://your-backend.example.com
```

For the backend on Render, configure:

```text
DATABASE_MODE=supabase-online
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_JWT_SECRET
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
