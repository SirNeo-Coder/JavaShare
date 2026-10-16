# CodeShare — Stage One Progress

Keep this file current. After every finished step: update it, commit, and push the branch.
Anyone (or any coding assistant) continuing this work should be able to start from this file alone.

Last updated: 2026-10-16

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
3. **Pull request (c) is not decided yet.** Before building it, propose how to replace Socket.IO (live code sharing, cursors, active file, chat, teacher live share). The teacher expects Supabase Realtime. Explain the trade-offs and **wait for the teacher's answer**.

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

### PR (b) Web workspace: BUILT, end-to-end test still to do

- **Branch:** `web-workspace` (built on top of `rename-to-codeshare`). Pushed, but the pull request is **not opened yet**.
- **What it adds:**
  - A new migration, `supabase/migrations/20261016000100_project_language.sql`, adds `projects.language` (`java` by default, `web` for web projects).
  - Backend:
    - `POST /api/classes/:classroomId/web-projects` creates a web project (students only, at most 20 personal projects).
    - `backend/src/file-paths.ts` checks file names against the project's language.
    - A file's language is saved from its name (`html`, `css` or `javascript`).
  - Bootstrap:
    - Students now see every personal project, not just "My Practice Code".
    - The teacher's student view keeps showing each student's original practice project.
  - `app/webPreview.ts` builds the page for Run:
    - Linked CSS and JS files are put inline, and nothing is loaded from the internet.
    - It runs in `<iframe sandbox="allow-scripts">` without `allow-same-origin`.
    - Console output, `alert` and errors are sent back with `postMessage` and mapped to the right file and line.
    - The comment at the top of this file is where in-browser Java (CheerpJ) and C# (.NET WebAssembly) runners will plug in. They are chosen in `runCode()` in `app/page.tsx`.
  - `app/CodeEditor.tsx` highlights HTML, CSS and JavaScript. The bracket and semicolon hints are limited to Java (and brackets to JavaScript).
  - The new-file dialog and rename work for web file names.
  - `docs/course-format.md` is added unchanged, and the README is updated.
  - `npm test` runs `tests/web-workspace.test.mjs` (7 checks).
- **Tested:**
  - Build passes, lint shows 0 errors, and `npm test` passes 7 of 7.
  - In a real Chromium browser, a test page using `buildPreview` showed:
    - the CSS was applied;
    - `console.log`, `warn`, `alert` and async errors appeared with the correct `file:line`;
    - the sandbox blocked `document.cookie`, the parent page and `localStorage`.
- **Not tested yet:** the full app flow (New web project, then edit, save and Run). Docker was installed on 2026-10-16 (Docker 29.1.3). The teacher's account is in the `docker` group, but sessions started before that need `sg docker -c "<command>"` until the next login. Local Supabase is being started for this test.
- **Known limits (to tell the teacher in the PR):**
  - Teachers can't yet see students' web projects.
  - Teacher live share stays Java-only.
  - An endless loop in student JavaScript can freeze that student's tab.
  - The hosted database needs the new migration applied (the teacher does this; never run `supabase db push`).

### PR (c) Cloudflare and Supabase Realtime: NOT STARTED

Waiting for PR (b). First step: write the Socket.IO replacement proposal and get the teacher's answer.

## Parked by the teacher (do later)

- **Knowledge base like Project VMAS's:**
  - `AGENTS.md` as the one rule file, and a `CLAUDE.md` that only says to read it.
  - Bug records `CKB-NNN` under `docs/problem-knowledgebase/`, plus `docs/knowledgebase/` pages.
  - The structure was proposed on 2026-10-16 but **not yet approved or built**. The teacher said to deal with it later; ask for approval after PR (b) testing.
  - Planned first records: CKB-001, the leftover "Collaborative Java classroom" subtitle (fixed in PR a); CKB-002, wrong web preview line numbers after a linked stylesheet (caught by a test and fixed).

## Next steps

1. **Once Docker works** (`docker --version` prints a version):
   1. Run `npm run classroom:offline`, or `npx supabase start` and the app.
   2. Register a teacher, then a student, and join the class.
   3. Test New web project, then edit, save, Run, the console, adding and renaming files, and that Java projects still run.
2. Open PR (b) from `web-workspace`, with a plain-English summary, test steps, and what could not be verified.
3. Start PR (c) with the proposal, then wait for the teacher's decision.

## Where the work is

- **Local checkout:** `~/Documents/GitHub/JavaShare`
- **GitHub:** `SirNeo-Coder/JavaShare`
- **Branches:**
  - `rename-to-codeshare`: PR (a)
  - `web-workspace`: PR (b), stacked on (a)
