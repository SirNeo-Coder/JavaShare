# Operations

## Commands

| Command | Does |
| --- | --- |
| `npm install` | Install everything (root and `backend` workspace) |
| `npm run classroom:online` (alias `npm run classroom`) | Build and serve with hosted Supabase |
| `npm run classroom:offline` | Start local Supabase in Docker, build, serve; no internet needed |
| `npm run dev` | Development mode with hot reload: one Next.js dev server; settings from `backend/.env` (`scripts/dev.mjs`) |
| `npm run cf:preview` | Build for Cloudflare and run it locally on Cloudflare's own runtime (port 8787); settings from a git-ignored `.dev.vars` |
| `npm run cf:build` / `cf:deploy` | Cloudflare build / deploy (normally Cloudflare runs these itself; see `docs/cloudflare-setup.md`) |
| `npm run build:all` | Build pages and server |
| `npm run lint` | ESLint |
| `npm test` | Automated checks in `tests/*.test.mjs` (Node's test runner). The live-channel rule checks need local Supabase running; on Linux before re-login, run `sg docker -c "npm test"` |
| `npm run kb:search -- "words"` | Search past bug records |
| `npx supabase start` / `stop` / `status` | Local Supabase (Docker) |

## Running offline mode on Linux

- Docker must be installed and running. On 2026-10-16 the teacher's Linux Mint laptop had Docker 29.1.3.
- If "permission denied" appears for `/var/run/docker.sock`, the user is in the `docker` group but the session predates it: log out and back in, or prefix with `sg docker -c "..."`.
- On the first start, Supabase downloads its Docker images (several minutes). Later starts are quick.
- Students open the printed LAN address, e.g. `http://192.168.0.113:3000`. Their live channels connect to the same address on port 54321 (local Supabase; Docker publishes it on all network interfaces). On Windows, allow Node.js and ports 3000 and **54321** through the firewall on private networks (port 4000 is no longer used offline).
- Testing note: the Claude desktop app's in-app browser refused a page on `192.168.0.113:3000` from reaching `192.168.0.113:54321`, although opening that address directly worked. The same path worked from a Node test client. Use `localhost:3000` and `127.0.0.1:3000` (two separate sign-ins) for two-browser tests on the laptop, and a real device for the network path.
- Restarting the server no longer signs anyone out (since PR c2).
- Two copies of the Cloudflare runtime can linger: if `cf:preview` serves an old build, stop the leftover `workerd` process listening on port 8787.

## Settings (environment variables)

Server (`backend/.env.online`, `backend/.env.offline`, or `backend/.env`; examples in `backend/.env.*.example`): `PORT`, `DATABASE_MODE` (`supabase-online` or `supabase-local`), `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (secret), `SUPABASE_JWT_SECRET` (secret: signs live-channel passes; offline the launcher reads it from `supabase status`; hosted: Supabase dashboard > Project Settings > JWT Keys > Legacy JWT secret), `JWT_SECRET` (secret), `FRONTEND_URL`, `LOCAL_JAVA_EXECUTION`, `JUDGE0_URL`, `JUDGE0_API_KEY`.

Pages: `NEXT_PUBLIC_API_URL` (only for Vercel pages calling the Render server; unset offline and on Cloudflare), `NEXT_PUBLIC_SITE_URL`. Launcher-only: `CODESHARE_LAPTOP=true`.

Cloudflare: the same server settings as dashboard secrets (`docs/cloudflare-setup.md`); `DATABASE_MODE` is in `wrangler.jsonc`.

Never commit filled-in env files or keys.

## Migrations

- New files only, in `supabase/migrations/`, named `YYYYMMDDHHMMSS_description.sql`. Never edit or delete existing ones.
- Offline: `npx supabase start` applies them to the local database. `npx supabase db reset` rebuilds the local database (this erases local data).
- Online: the **teacher** applies them to the hosted project. Assistants never run `supabase db push`.
- Pending for the hosted project, as of 2026-10-16: `20261016000100_project_language.sql` (needed before web projects work online) and `20261016000200_realtime_private_channels.sql` (needed before live features work online).
- `npx supabase migration up --local` applies new migrations to the local database without erasing it.

## Known repository clutter (not yet cleaned up)

`logs/classroom.log`, `test.txt` and `supabase/.temp/` are committed. `logs/classroom.log` changes whenever the classroom runs; don't commit those changes.
