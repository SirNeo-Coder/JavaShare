# CodeShare — Stage One Progress

Keep this file current. After every finished step: update it, commit, and push the branch.
Anyone (or any coding assistant) continuing this work should be able to start from this file alone.
The working rules are in `AGENTS.md`; the knowledge base starts at `docs/knowledgebase/README.md`; past bugs are in `docs/problem-knowledgebase/`.

Last updated: 2026-10-16 (knowledge base built)

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
4. **Pull request (c) is not decided yet.** Before building it, propose how to replace Socket.IO (live code sharing, cursors, active file, chat, teacher live share). The teacher expects Supabase Realtime. Explain the trade-offs and **wait for the teacher's answer**.

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

### PR (c) Cloudflare and Supabase Realtime: NOT STARTED

Waiting for PR (b). First step: write the Socket.IO replacement proposal and get the teacher's answer.

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

1. The teacher reviews PR (a), PR (b), and the knowledge-base PR.
2. Start PR (c): write the Socket.IO replacement proposal, then wait for the teacher's decision. Follow `AGENTS.md`: search the bug records first and get approval before changing code.

## Running offline mode on this laptop

- Run `sg docker -c "npm run classroom:offline"`. Use plain `npm run classroom:offline` once the teacher has logged out and back in.
- Test accounts live only in the local database: `test.teacher@example.test` and `test.student@example.test`. Their password is not stored in this repo.

## Where the work is

- **Local checkout:** `~/Documents/GitHub/JavaShare`
- **GitHub:** `SirNeo-Coder/JavaShare`
- **Branches:**
  - `rename-to-codeshare`: PR (a)
  - `web-workspace`: PR (b), stacked on (a)
  - `codeshare-knowledge-base`: knowledge base, stacked on (b)
