# Operations

## Commands

| Command | Does |
| --- | --- |
| `npm install` | Install everything (root and `backend` workspace) |
| `npm run classroom:online` (alias `npm run classroom`) | Build and serve with hosted Supabase |
| `npm run classroom:offline` | Start local Supabase in Docker, build, serve; no internet needed |
| `npm run dev` | Development mode with hot reload (`scripts/dev.mjs`) |
| `npm run build:all` | Build pages and server |
| `npm run lint` | ESLint |
| `npm test` | Automated checks in `tests/*.test.mjs` (Node's test runner) |
| `npm run kb:search -- "words"` | Search past bug records |
| `npx supabase start` / `stop` / `status` | Local Supabase (Docker) |

## Running offline mode on Linux

- Docker must be installed and running. On 2026-10-16 the teacher's Linux Mint laptop had Docker 29.1.3.
- If "permission denied" appears for `/var/run/docker.sock`, the user is in the `docker` group but the session predates it: log out and back in, or prefix with `sg docker -c "..."`.
- On the first start, Supabase downloads its Docker images (several minutes). Later starts are quick.
- Students open the printed LAN address, e.g. `http://192.168.0.113:3000`. On Windows, allow Node.js and ports 3000 and 4000 through the firewall on private networks.
- Restarting the server signs everyone out (see security-and-scoping.md).

## Settings (environment variables)

Server (`backend/.env.online`, `backend/.env.offline`, or `backend/.env`; examples in `backend/.env.*.example`): `PORT`, `DATABASE_MODE` (`supabase-online` or `supabase-local`), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (secret), `JWT_SECRET` (secret), `FRONTEND_URL`, `LOCAL_JAVA_EXECUTION`, `JUDGE0_URL`, `JUDGE0_API_KEY`.

Pages: `NEXT_PUBLIC_API_URL` (blank for the local classroom, so Next.js forwards `/api`), `NEXT_PUBLIC_SITE_URL`, `INTERNAL_API_URL`.

Never commit filled-in env files or keys.

## Migrations

- New files only, in `supabase/migrations/`, named `YYYYMMDDHHMMSS_description.sql`. Never edit or delete existing ones.
- Offline: `npx supabase start` applies them to the local database. `npx supabase db reset` rebuilds the local database (this erases local data).
- Online: the **teacher** applies them to the hosted project. Assistants never run `supabase db push`.
- Pending for the hosted project, as of 2026-10-16: `20261016000100_project_language.sql` (needed before web projects work online).

## Known repository clutter (not yet cleaned up)

`logs/classroom.log`, `test.txt` and `supabase/.temp/` are committed. `logs/classroom.log` changes whenever the classroom runs; don't commit those changes.
