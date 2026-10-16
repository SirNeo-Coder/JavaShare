# CodeShare — Stage One Progress

Keep this file current. After every finished step: update it, commit, and push the branch.
Anyone (or any coding assistant) continuing this work should be able to start from this file alone.
The working rules are in `AGENTS.md`; the knowledge base starts at `docs/knowledgebase/README.md`; past bugs are in `docs/problem-knowledgebase/`.

Last updated: 2026-10-16 (PR c2 built and tested)

## The job

Turn JavaShare into CodeShare, in three separate pull requests, in this order:

- **(a)** Rename JavaShare to CodeShare everywhere a person sees the name.
- **(b)** Student workspace for HTML, CSS and JavaScript, running in the student's own browser.
- **(c)** Move the pages to Cloudflare and the live features from Socket.IO to Supabase Realtime, keeping offline mode working.

Also: add `docs/course-format.md` unchanged (done, in PR b).

The teacher's full instructions are in their file `CodeShare_Stage_One_Prompt.md` (not in this repo). The key rules:

- Explain things in plain English.
- Ask before any decision that could go either way, with one recommendation at a time.
- Never push to `main`, never merge; deliver pull requests for the teacher to review.
- Never run `supabase db push`, and never change settings in the hosted Supabase, Cloudflare, Vercel or Render. Prepare the files and write step-by-step instructions instead.
- Never claim something works unless it was actually run. Say plainly what could not be tested.
- Before each pull request, run `npm run build:all`, `npm run lint` and `npm test`, and test the feature yourself.
- Never edit or delete existing migrations; add new ones only.
- Keep `vercel.json` and `render.yaml` in this stage.

## Decisions the teacher approved

1. **Plan approved** (2026-10-16): the three PRs as described above.
2. **Students create web projects with a "New web project" button** in their workspace sidebar. It makes a personal project with `index.html`, `style.css` and `script.js`. A later stage may let the teacher pick "Web" when handing out an activity.
3. **Knowledge base** (2026-10-16): copy Project VMAS's structure with bug ids `CKB-NNN`. `AGENTS.md` is the one rule file, and `CLAUDE.md` only points to it. Every bug found or fixed gets a record, and every agreed rule goes into `AGENTS.md`. This progress file moved to `docs/handoffs/stage-one.md`.
4. **PR (c) approach approved** (2026-10-16): move the server's `/api` routes into the Next.js app (Cloudflare online, `next start` offline, Java runner offline only), and replace Socket.IO with Supabase Realtime: private Broadcast channels `team:<id>` and `class:<id>`, plus Presence for who's online. Details: `docs/handoffs/stage-one-pr-c-proposal.md`. All four decisions made.
5. **No sign-out on restart** (2026-10-16): drop the `serverSessionId` check everywhere. Sign-in lasts 7 days online and offline; restarting the laptop no longer signs students out. This is a workflow change; update `docs/knowledgebase/workflow-state.md` and `security-and-scoping.md` when it is built.
6. **Live update caps** (2026-10-16), the same online and offline: typing at most 3 updates a second per student (about 1/4 second delay); cursors only when they move, at most 4 a second; teacher live share at most 2 updates a second (about 1/2 second delay, about 82 messages a second for a class of 40).
7. **Split PR (c) into two pull requests** (2026-10-16), each tested offline before review.
8. **Order swapped** (2026-10-16), so no temporary bridge code is needed:
   - **c1 (Realtime):** live features move to Supabase Realtime inside today's Express server, Socket.IO is removed, and hosting stays Vercel and Render.
   - **c2 (Cloudflare):** the `/api` routes move into Next.js, Next.js is upgraded to 16.4.2, the OpenNext adapter is added, sign-out on restart is dropped, and `docs/cloudflare-setup.md` is written.

## Facts found while reading the code (affect PR c)

- **Cloudflare's adapter needs a newer Next.js.** OpenNext for Cloudflare 1.20.12 requires Next.js 16.4.1 or newer; the repo uses 16.2.6, so PR (c) must upgrade to 16.4.2 first.
- **Logins use the backend's own cookie,** `javashare_session` (a JWT signed with `JWT_SECRET`). Restarting the backend signs everyone out on purpose (`serverSessionId`).
- **The backend keeps live state in its own memory:** who is online, unsaved live drafts, and each team's active file. Cloudflare Workers don't keep memory between requests.
- **The browser has no Supabase login.** All Supabase access goes through the backend with the service-role key.
- **This machine is Linux Mint, but the teacher's classroom launcher targets Windows** (`npx.cmd`, Windows Firewall).

## Status

### PR (a) Rename: DONE, waiting for teacher review

- **Branch:** `rename-to-codeshare`
- **Pull request:** https://github.com/SirNeo-Coder/JavaShare/pull/1
- **Changed:** visible names, the logo letter "C", README, package names, launcher messages.
- **Kept on purpose** (listed in the README): the cookie `javashare_session`, the browser settings `javashare-theme` and `javashare-font-scale`, the Supabase `project_id = "javashare"`, the Render service `javashare-backend`, and all tables and migrations.
- **Teacher must do:**
  1. Rename the GitHub repository.
  2. Optionally rename the projects in the Supabase, Vercel and Render dashboards.
  3. Replace `public/og.png` (it still shows "JavaShare").
- **Tested:** build passes, lint shows 0 errors, and the built login, teacher summary and student accounts pages show CodeShare in a browser.
- **Not tested:** signing in (no Supabase on this machine).

### PR (b) Web workspace: DONE, waiting for teacher review

- **Pull request:** https://github.com/SirNeo-Coder/JavaShare/pull/2
- **Branch:** `web-workspace` (built on top of `rename-to-codeshare`). The pull request targets `rename-to-codeshare`, so it shows only its own changes. Once PR (a) is merged, GitHub moves it onto `main`.
- **What it adds:**
  - A new migration, `supabase/migrations/20261016000100_project_language.sql`, adds `projects.language` (`java` by default, `web` for web projects).
  - Backend:
    - `POST /api/classes/:classroomId/web-projects` creates a web project (students only, at most 20 personal projects).
    - `backend/src/file-paths.ts` checks file names against the project's language.
    - A file's language is saved from its name.
  - Bootstrap:
    - Students see every personal project.
    - The teacher's student view keeps showing each student's original practice project.
  - `app/webPreview.ts`:
    - Runs the page in `<iframe sandbox="allow-scripts">` without `allow-same-origin`.
    - Inlines the linked CSS and JS.
    - Sends console output, `alert` and errors back with `postMessage`, mapped to file and line.
    - The comment at the top is where in-browser Java (CheerpJ) and C# (.NET WebAssembly) runners will plug in. They are chosen in `runCode()` in `app/page.tsx`.
  - `app/CodeEditor.tsx` highlights HTML, CSS and JavaScript.
  - `docs/course-format.md` is added unchanged.
  - `npm test` runs `tests/web-workspace.test.mjs`.
- **Tested on 2026-10-16, offline mode, local Supabase in Docker:**
  - `npm run classroom:offline` started, and the backend reported that local Supabase was connected.
  - Every migration applied, including the new one.
  - Registered a test teacher and a test student, and the student joined with code JAVA101.
  - The Java practice project still runs on the laptop's `javac`.
  - **New web project** created the 3 starter files.
  - Run showed the styled page and `Hello from script.js`, with `script.js:1`.
  - After editing `script.js`, Run saved it (version 2, with the old copy in `file_versions`). It showed `Total: 5` at `script.js:3` and `showTotal is not defined` at `script.js:4`, in red.
  - Adding `about.html` worked, and so did renaming it to `pages/contact.html`.
  - The server refuses `Main.java` in a web project, `index.html` in a Java project, `../x.html`, and a teacher creating a web project.
  - The web project survives signing out and back in.
  - The teacher still sees the student's "My Practice Code".
  - Build passes, lint shows 0 errors, and `npm test` passes 7 of 7.
- **Bugs found and fixed during testing.** These become CKB records when the knowledge base is built:
  - The sidebar said "3 Java file(s)" for a web project. It now says "web file(s)".
  - The "Press Run to see your page here" hint broke onto 3 lines. It now fits on one.
- **Not tested:**
  - Other browsers (only Chromium was used).
  - A second device on the classroom Wi-Fi.
  - The Windows launcher.
  - Online mode, because the hosted database doesn't have the new migration yet.
- **Known limits:**
  - Teachers can't yet see students' web projects.
  - Teacher live share stays Java-only.
  - An endless loop in student JavaScript can freeze that student's tab.
  - The hosted database needs the new migration applied (the teacher does this; never run `supabase db push`).
  - Ctrl+Enter only runs from the Java input box (existing behaviour).

### PR (c1) Live features on Supabase Realtime: DONE, waiting for teacher review

- **Pull request:** https://github.com/SirNeo-Coder/JavaShare/pull/4
- **Branch:** `realtime-c1` (built on top of `codeshare-knowledge-base`).
- **What it changes:**
  - **Socket.IO is removed** (both packages, and the `/socket.io` rewrite).
  - The server sends its "this changed" signals with `broadcast()` (`backend/src/realtime.ts`, the Supabase Realtime REST API, service role).
  - New routes: `GET /api/realtime/pass` (one-hour pass signed with `SUPABASE_JWT_SECRET`) and `POST /api/classes/:id/arrive` (late group assignment, which used to happen when a browser joined the class).
  - `GET /api/teacher/students` returns `classroomIds`, and "online" comes from Presence.
  - Removed: server-memory live state, and the repository functions only Socket.IO used.
  - Browser:
    - `app/realtime.ts` holds the client, pass renewal, private channels, `throttle` and `LIVE_CAPS`.
    - The live effect in `app/page.tsx` keeps every old message handler, now attached to Realtime channels. Newcomers ask with `team:sync-request` instead of reading server memory.
    - Typing is coalesced: one operation from the last sent text.
    - Typing from a member the leader locked is ignored.
    - `/teacher/accounts` gets "Online" from Presence.
  - Migration `20261016000200_realtime_private_channels.sql`: channel policies (only the teacher broadcasts on the class channel), and **revokes all table privileges from `anon`/`authenticated`**.
  - The launcher passes `SUPABASE_JWT_SECRET` offline, and warns if it is missing online. The env examples and `render.yaml` list it.
- **Tested on 2026-10-16:**
  - `npm test` passes 13 of 13 (`sg docker -c "npm test"`), including `tests/realtime.test.mjs`:
    - laptop-address swap
    - throttle
    - channel rules against local Supabase
    - the pass cannot read tables
  - The two rule checks were each **shown failing** with the rule weakened (table grant re-added; class broadcast opened to students), then passing once restored.
  - Build passes; lint shows 0 errors.
  - **Two-browser offline test** (teacher on `127.0.0.1:3000`, student on `localhost:3000`):
    - the student shows Online in the teacher's sidebar;
    - the teacher opening the student's workspace shows "Following Test Student";
    - student typing appears for the teacher, with the cursor and "Test Student is typing…";
    - classroom chat is delivered;
    - Present opens the student's live-share window;
    - the teacher's typing reaches the student within a second;
    - Stop presenting closes it;
    - deploying an activity adds it to the student's sidebar live;
    - `/teacher/accounts` shows Online 1, then Offline after the student's tab closed.
  - **Cap measured:** 60 key presses produced 16 live-share updates (1.98 a second, smallest gap 499 ms), and the final text arrived complete.
  - **Network path:** a Node client signed in through `192.168.0.113:3000`, got the pass, used `192.168.0.113:54321`, and joined the team channel. The in-app browser refused that cross-address connection (an app limitation; see operations.md), so a **real device on the Wi-Fi is still untested**.
- **Teacher must do before using it online:**
  1. Apply both new migrations to the hosted project.
  2. Add `SUPABASE_JWT_SECRET` to `backend/.env.online` and to Render's environment (Supabase dashboard > Project Settings > JWT Keys > Legacy JWT secret).
  - Without them, the app works but live features are off.
- **Not tested:** online mode (hosted project not migrated); a real classroom device over Wi-Fi; Windows; browsers other than Chromium.
- **Known limits:**
  - Sender names in typing messages come from the sender's browser.
  - Group members' typing isn't checked per keystroke, but saving is.
- **For c2:** every open page asks the server for live-share state every 2 seconds (existing code). On Cloudflare's free plan (100,000 requests a day) that is too many for a class of 40, so it needs changing in c2.

### PR (c2) CodeShare on Cloudflare: DONE, waiting for teacher review

- **Branch:** `cloudflare-c2` (built on top of `realtime-c1`).
- **What it changes:**
  - Next.js upgraded to **16.4.2**. Added `@opennextjs/cloudflare` 1.20.12, `wrangler`, `wrangler.jsonc` (Worker `codeshare`, `nodejs_compat`, `keep_vars`), `open-next.config.ts`, and the scripts `cf:build`, `cf:preview`, `cf:deploy`.
  - **All `/api` routes are shared:** `backend/src/routes.ts` (the old `server.ts`) runs on a tiny Express-style router (`backend/src/router.ts`) over web Request/Response.
    - Next.js serves them through `app/api/[...path]/route.ts`, offline and on Cloudflare.
    - `backend/src/server.ts` is now a thin Express wrapper, so **Render keeps working** for Vercel's pages.
    - The Java runner moved to `java-runner.ts` and is loaded only when allowed (`CODESHARE_LAPTOP=true` from the launcher).
  - **Sign-in:** `jose` replaces `jsonwebtoken`, and there's no more sign-out on restart. The cookie is Secure only over https, or for Vercel to Render (`SameSite=None`). Old cookies stay valid.
  - **Launcher:** offline runs one program (`next start`) on port 3000; port 4000 is no longer used. `npm run dev` is one Next.js dev server.
  - **Live-share safety net:** no 2-second timer. The page checks on open, on returning to the tab, and when the class channel (re)connects. Teacher decision, 2026-10-16.
  - **Smaller items:** `next.config.ts` rewrites removed; `.env.example` cleared (`NEXT_PUBLIC_API_URL` only for Vercel); `cookie-parser` and `jsonwebtoken` removed; backend imports use `.ts`, rewritten to `.js` by `tsc`.
  - **New guide:** `docs/cloudflare-setup.md`, step by step for the teacher.
- **Tested on 2026-10-16:**
  - `npm test` passes 17 of 17. New `tests/api-router.test.mjs` has 3 router checks, plus 1 route check through `handleApi` against local Supabase: register, cookie, me, pass, forged cookie refused, logout.
  - The route check was **shown failing** when the cookie was forced to always be Secure, and passing once restored.
  - `build:all` passes, and lint shows 0 errors.
  - **Cloudflare runtime locally** (`opennextjs-cloudflare preview`, workerd, port 8787, local Supabase):
    - health, login (cookie `HttpOnly; SameSite=Lax`, no Secure on http), me, bootstrap, live pass, file save, image upload, a student refused on a teacher route, bad JSON gives 400, unknown routes give 404, Java gives demo mode;
    - in the browser: sign-in, "Live classroom connected", and the web project Run console (`script.js:1/3/4`);
    - the teacher on the offline server saw that student Online.
  - **Bundle:** 1,200 KiB compressed (free limit 3 MB), from a `wrangler deploy --dry-run`; nothing was deployed.
  - **Offline (`classroom:offline`):** one program on 3000, nothing on 4000.
    - Teacher and student were still signed in from before the change.
    - Java ran on the laptop.
    - Live share start and stop reached the student within 2 seconds.
    - The student page made no live-share requests while idle.
  - **Render path** (`node backend/dist/server.js`, `NODE_ENV=production`): health, login (`Secure; SameSite=None`, CORS for the pages' origin), the cookie works, the teacher route is refused for a student, and Java gives demo mode.
- **Not tested:**
  - A real Cloudflare deployment. I have no access to the teacher's account; that's what the setup guide's preview step is for.
  - Vercel's build of the new code.
  - Windows.
  - A real device on the Wi-Fi.
- **Teacher must do:** follow `docs/cloudflare-setup.md`: apply both migrations, connect GitHub, add 5 secrets, test the `cloudflare-c2` preview, and only then merge.

### Knowledge base: DONE, waiting for teacher review

- **Pull request:** https://github.com/SirNeo-Coder/JavaShare/pull/3
- **Branch:** `codeshare-knowledge-base` (built on top of `web-workspace`).
- **What it adds:**
  - `AGENTS.md` (all the rules) and `CLAUDE.md` (points to `AGENTS.md`).
  - `docs/knowledgebase/`: README, architecture, feature index, data model, backend, frontend, security and scoping, operations, workflow state.
  - `docs/problem-knowledgebase/`: README, case template, index, CKB-001 to CKB-004, and `prompt-map/2026-10.md`.
  - `docs/verification/`, `scripts/problem-kb-search.mjs` (`npm run kb:search`), and `tests/kb-search.test.mjs`.
- **Left out of the VMAS copy, on purpose:**
  - The User Manual rules (CodeShare has no user manual).
  - A separate Object Relationships folder (`data-model.md` covers it).
  - The old-history import (there's no earlier history).
- **Tested:** `npm test` passes 9 of 9, including the 2 new search checks. `kb:search` finds CKB-002 for "preview line number wrong".

## Next steps

1. The teacher reviews PRs #1–#4 and the c2 PR, then follows `docs/cloudflare-setup.md` to test a Cloudflare preview.
2. After the teacher confirms Cloudflare works:
   - a later step removes Render and Vercel (`backend/src/server.ts`, `render.yaml`, `vercel.json`) — only when the teacher asks;
   - Stage two (course modules) can start.

## Running offline mode on this laptop

- Run `sg docker -c "npm run classroom:offline"` (one program on port 3000 since c2).
- Cloudflare runtime locally: `npm run cf:preview` (port 8787; needs a git-ignored `.dev.vars` with the local Supabase values). Use plain `npm run classroom:offline` once the teacher has logged out and back in.
- Test accounts live only in the local database: `test.teacher@example.test` and `test.student@example.test`. Their password is not stored in this repo.

## Where the work is

- **Local checkout:** `~/Documents/GitHub/JavaShare`
- **GitHub:** `SirNeo-Coder/JavaShare`
- **Branches:**
  - `rename-to-codeshare`: PR (a)
  - `web-workspace`: PR (b), stacked on (a)
  - `codeshare-knowledge-base`: knowledge base, stacked on (b)
  - `realtime-c1`: PR (c1), stacked on the knowledge base
  - `cloudflare-c2`: PR (c2), stacked on c1
