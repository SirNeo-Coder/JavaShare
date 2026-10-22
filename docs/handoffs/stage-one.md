> Current CKB-063 repair — 2026-10-22
>
> Teacher approved correcting only the Week 18–21 predecessor references and preserving all
> module/activity ids, lessons, code, outputs and student history. Branch:
> `codex/curriculum-prerequisite-links`, based on main `21766ba` (shared-library PR #37 merged),
> isolated checkout `/tmp/codeshare-curriculum-links`. The original checkout is untouched.
>
> Done: four `previousModuleId` corrections, actual Week 12–21 chain/access regression,
> disposable browser uploads/completion setup, real ordered-unlock and exact saved-record
> re-upload checks, teacher upload guide and CKB/index/workflow updates. App/server, prerequisite
> rules, Java/Net MVC separation, schemas and migrations are unchanged. Every other JSON byte
> and every other curriculum asset matches main.
>
> Verified: build and offline launcher build pass; lint 0 errors/8 existing warnings; full suite
> 303/303, focused shared/prerequisite 26/26; real local curriculum browser 8/8, offline
> prerequisites 5/5, subject sharing 7/7, no skips. Regression fails before correction and for
> each independently restored bad link; corrected files pass again. Named checks and setup
> failures: `docs/verification/curriculum-prerequisite-links.md`.
>
> Delivered: implementation `e162e87`, committed and pushed;
> [PR #38](https://github.com/SirNeo-Coder/JavaShare/pull/38) targets main and is open for review.
> No code work remains in progress. Next: teacher reviews the PR and uploads
> only corrected Weeks 18–21 through **Java class → Curriculum → Add module**, keeping existing
> ids. Earlier weeks must exist in that teacher's Java library. Refresh/reopen after saving edits.
> Teacher guide: `docs/curriculum-prerequisite-reupload.md`. Student drafts, completions and
> submitted snapshots stay saved; unfinished earlier tasks still block later weeks.
>
> Open: hosted re-upload/recovery, physical offline devices, online/visible GUI behavior and
> existing curriculum runtime limits. Week 17 feedback timeout did not recur locally; its cause
> remains unknown and feedback code was not changed. No merge, deployment or hosted change.
> Earlier PR #37 notes below are historical; its CKB-063 repair proposal is superseded here.

> PR #37 integration refresh (2026-10-22): branch `codex/subject-module-sharing`, based on
> main `82cd333` after PRs #35/#36 merged. Resolved documentation/UI/server conflicts while
> retaining subject sharing and prerequisite gates. The prerequisite lookup now uses the same
> teacher/subject library as the catalog; student completion remains separate per class.
> Build, backend build, offline launcher build pass; lint 0 errors/8 existing warnings; full
> suite 302/302; focused 26/26; real local subject browser 7/7 and prerequisite browser 5/5.
> Shared-chain regression failed before the fix and passed after. All curriculum assets match main.
> EXTRA CURRICULUM BROWSER FAILED: preserved Week 18–21 links omit predecessor -module suffixes
> (CKB-063); temporary diagnostic run 3 pass/3 fail, also an undiagnosed Week 17 feedback timeout.
> No lesson rewrite or bypass. Evidence and every additional named check:
> `docs/verification/subject-module-sharing.md`. This repair and record are committed/pushed to
> existing PR #37. Teacher reports hosted SQL success; hosted app rollout remains unverified.
> Next: verify GitHub conflicts/checks and teacher review/merge; separately approve a plan for
> CKB-063 if desired. No assistant merge, deployment or hosted action. Older draft-PR notes below
> are history; #35 and #36 have since been merged by the teacher.

> PR #36 refresh after #35 merged (2026-10-22): six documentation conflicts repaired on
> main `3a59e99`. Both prerequisite and curriculum notes are retained. CKB-060 remains
> prerequisites; CKB-061 remains curriculum. All 51 curriculum/fixture/test files are unchanged
> from the previous pushed PR. Application/config/package files exactly match current main.
> Production build passed; lint 0 errors/8 existing warnings; full suite 293/293, no failures
> or skips. Named checks and limits: `docs/verification/week15-week21-step-additions.md`.
> Browser, offline launcher, document renders and deliberate-break proof were not repeated
> for this refresh. PR #36 stays draft for teacher curriculum review; Ready for review is
> a separate human decision. Repair and evidence are committed/pushed to the same PR; no
> merge, deployment, hosted action or curriculum rewrite. Next: check GitHub’s conflict
> status, then continue curriculum review and its documented runtime limits.

> PR #35 conflict repair (2026-10-22): updated on main `c770731`; replayed feature head
> `20a26fd`. The teacher requested repair of #35/#36/#37. Both sets of progress/problem/prompt
> notes and the independent styles are preserved. Feature code/tests and curriculum files
> were compared with the original PR and preserved byte-for-byte except inherited main editor
> additions. Case ids are distinct: Java suggestions 059, prerequisites 060, curriculum 061,
> subject sharing 062. Build passes; lint 0 errors/8 existing warnings; full suite 245/245,
> no skips. All named checks and limits: `docs/verification/module-prerequisites.md`.

> PR #36 conflict repair (2026-10-22): updated on main `c770731`; replayed feature head
> `5959716`. The teacher requested repair of #35/#36/#37. Both sets of progress/problem/prompt
> notes and the independent styles are preserved. Feature code/tests and curriculum files
> were compared with the original PR and preserved byte-for-byte except inherited main editor
> additions. Case ids are distinct: Java suggestions 059, prerequisites 060, curriculum 061,
> subject sharing 062. Build passes; lint 0 errors/8 existing warnings; full suite 276/276,
> no skips. All named checks and limits: `docs/verification/week15-week21-step-additions.md`.
> Resolution is complete; this record is committed and pushed to the same PR with a lease
> protecting its previously fetched head. No merge or deployment. #36 remains draft. Next:
> teacher review; merging another PR may require another refresh of the remaining branches.

> Three-PR conflict repair (2026-10-22): subject sharing PR #37 updated on main `c770731`;
> replayed implementation `200065c`. Teacher requested fixing #35/#36/#37. Both note sets
> are preserved. Case numbers are unique: main caret issue 059, prerequisites 060, curriculum
> 061, subject sharing 062. The original feature code/config/tests were preserved; current
> main’s editor changes and both sets of independent styles are retained.
> Verified: production build, lint 0 errors/8 existing warnings, full suite 236/236 and actual
> local production browser 7/7 with laptop Java; no failures/skips. Named results and limits:
> `docs/verification/subject-module-sharing.md`. Other branches separately pass 245 (#35) and
> 276 (#36) tests. #36 remains draft. The teacher reports the hosted library SQL succeeded;
> hosted app rollout is still pending and has not been independently verified.
> Resolution and this note are committed/pushed to the existing feature branch with a lease
> against its previously fetched head. No merge/deployment. Next: verify GitHub’s conflict-free
> status, teacher review/merge and app build, then choose class subjects/share saved uploads.
> Merging another PR can require refreshing the remaining branches again.

> Current approved subject sharing (2026-10-22): `codex/subject-module-sharing`, based on main
> `9fba8a7`, isolated worktree `/home/ireneo/.codex/worktrees/subject-module-sharing/JavaShare`.
> Approved: each class uses exactly one Java or Net MVC module set; upload/correct once per
> teacher/subject, include later classes, retain class-separated student projects/progress/submissions.
> Implemented: shared library and additive migration, required subject for new classes, existing
> class subject selection, explicit sharing/replacement of backed-up uploads, subject-wide delete
> warning, shared catalog/reader/dashboard/summary paths and per-class legacy availability.
> Existing old uploads stay readable until subject choice; original rows and all student work
> remain stored afterward. Subject choice is permanent through the app to protect work scope.
> Local migration applied; hosted services unchanged. Setup: `docs/subject-module-sharing-setup.md`.
> Verification complete: full suite 229/229, browser 7/7 (actual local production app and offline
> laptop Java), final focused checks 10/10; no skips. Baseline CKB-010 progress 4/4; deliberately
> removing the subject filter failed 4 checks, restoring it passed 8/8. Production and offline
> launcher builds pass; lint 0 errors/8 existing warnings. Named results, corrected initial
> fixture/browser-test failures and unverified areas: `docs/verification/subject-module-sharing.md`.
> Delivered: implementation `6b996e1` is committed and pushed; [PR #37](https://github.com/SirNeo-Coder/JavaShare/pull/37)
> targets main and is attached to this chat. No app work remains. This documentation update
> records delivery and is committed/pushed separately. The temporary local test server is stopped;
> disposable test users/classes were cleaned. Existing classroom processes were preserved.
> Next: teacher reviews the PR, manually applies the hosted migration, rolls out the app and
> selects subjects/shares old uploads. Hosted rollout, physical devices and disconnected Wi-Fi
> remain unverified. Preserve the primary checkout’s ongoing Week 15–21 files, logs, CLI cache
> and other unrelated work.

> Java code suggestions (2026-10-21): branch `codex/java-code-suggestions`, based on current
> main `9fba8a7` (merged drawer/module work retained). Teacher approved Java-first local
> keywords, common statements and current-file names in classroom, module and personal editors.
> Done: two typed characters open Java code suggestions; arrows select, Enter/click/tap insert,
> Escape closes, Tab still indents and Ctrl+Enter still runs. Print/main caret positions and
> indentation retained. Read-only, other languages, comments/strings, composing text and selected
> text stay quiet; changed external code closes stale suggestions. No AI, type service, dependency,
> server, schema, migration or hosted settings change. Plain teacher worksheet textareas unchanged.
> Browser checks found and fixed a fast-typing caret race (CKB-059) in the shared selection timing.
> Final evidence: 228/228 automated tests, 11/11 actual offline production browser checks,
> 6/6 focused shared-editor browser checks; production frontend/backend/offline launcher builds
> pass; lint 0 errors/8 existing warnings. Deliberately restoring delayed caret selection caused
> the fast-typing and indentation checks to fail (3 pass/3 fail including parent); restored
> source passes all 6. Both roles ran an accepted suggestion with actual laptop Java; module and
> personal saves retain separate drafts and do not submit. Personal test access uses explicitly
> seeded local fixture completion, and tests verify that suggestion editing never changes it.
> [Every named test, commands, regression proof and limits](../verification/java-code-suggestions.md).
> Implementation `5a8a3bf` is committed and pushed; [PR #34](https://github.com/SirNeo-Coder/JavaShare/pull/34)
> is open against main and attached to this chat. No implementation work remains. Next: teacher
> review and hosted rollout. Do not merge or deploy. Hosted online execution, physical
> phones/input methods, screen-reader speech and two-device live editing were not retested.
> No disposable suggestion accounts remain; our temporary verification server is stopped.
> Unrelated logs, Supabase CLI cache, .claude and snippets are preserved.

> Current approved drawer repair (2026-10-21): branch `codex/classroom-drawer-controls`, directly
> based on main `9257ea7` (merged PR #31). Teacher approved one Module/Projects rail, reopening
> the selected worksheet, hover opening and animated outside closing for Module, Projects and
> Chat. The earlier CKB-053 repair was only on open PR #26 targeting the unmerged rolling-tasks
> branch; it was never in main. This branch brings only the relevant repair onto current main.
> Done: one fixed Module tab beside Projects (Students / projects for teachers), no moving
> worksheet duplicate; hover does not steal focus or close on leaving; outside presses close
> even pinned panels. Both slide directions, keyboard/Escape, touch taps, worksheet page and
> unsaved editor/chat text are retained. Projects explicitly remains visible on phones. Opening
> Projects closes the worksheet; Module reopens its retained visit. All modules/top-bar Modules
> opens the catalog. Java execution/status/startup code is preserved. No server, schema, route,
> dependency, hosted settings or migration changes.
> Verification: final full suite 149/149; final actual offline production browser 17/17, both
> roles, phone/desktop/enlarged UI, measured opening/closing motion and real laptop Java. Build,
> offline launcher build and diff check pass; lint 0 errors/8 existing warnings. Deliberately
> removing outside closing and restoring the duplicate Module tab caused 15 expected failures
> (2 pass); restored build passes all 17. [All named tests, commands and limits](../verification/classroom-drawer-controls.md).
> CKB-053, frontend/workflow pages and the prompt map are updated. Implementation `ed16d50`
> is committed and pushed; [PR #32](https://github.com/SirNeo-Coder/JavaShare/pull/32) is open
> against main and attached to this chat. No implementation work remains. Do not merge unrelated
> PR #25/#26 or curriculum work. The current approval authorizes this repair and the
> project's normal branch/PR delivery, not a merge. Next: teacher review and hosted rollout test.
> Hosted rollout, physical devices and disconnected Wi-Fi remain unverified. Clicks inside the
> separate web-preview frame do not reach the document outside-dismiss handler. Disposable local
> fixtures are cleaned; only our temporary server is stopped. Existing servers and unrelated
> logs, Supabase CLI cache, .claude and snippets are preserved.

> Delivered regular Console correction (2026-10-21): `codex/classroom-java-progress`, implementation
> `8ae4f1a`, integrated latest main `b3c74e0` (startup repair PR #30) in `398aa8c`. Teacher reported no animation in the regular Code editor; earlier coverage
> only entered module/personal editors. Teacher approved reusing the existing status strip in
> the regular teacher/student Console. Its Java-only running flag keeps the strip visible when
> online startup clears output; input waiting changes its text, output/error/Stop clears it.
> Implemented and verified: final integrated full suite 148/148, actual online/offline production browser 20/20,
> build and offline launcher build pass; lint 0 errors/8 existing warnings. Browser checks measure
> rotation in the reported regular Console for both roles, preserving the new startup-stage text. Hiding only the regular strip caused
> the new checks to fail in both modes/roles (10 pass/10 fail counting parents); restored fix passes.
> [All named tests, proof and limits](../verification/java-console-progress.md); CKB-055 updated.
> Implementation and integrated checks are complete and pushed. Main delivery is tracked by
> [PR #31](https://github.com/SirNeo-Coder/JavaShare/pull/31) under the existing explicit merge/push
> request; the PR records its merge state. Next: verify the automatic main deployment and hosted re-test.
> No other feature PRs, server/protocol/dependency/migration/hosted setting changes. Physical devices
> and hosted rollout remain unverified. Existing classroom processes and unrelated files preserved.

> Delivered Java loading repair (2026-10-21): [PR #30](https://github.com/SirNeo-Coder/JavaShare/pull/30)
> merged into main as `f3daa64` under the teacher's explicit "merge and push to main"
> request. Implementation branch: `codex/java-runner-startup`,
> based on main `8fb41ff`, integrated main `7089377` in `87041d9`; isolated checkout `/tmp/codeshare-java-runner-startup`.
> Teacher approved complete compiler downloads, stage feedback, tests and branch/PR
> delivery. Done: both JARs load as binary memory files without HTTP Range; editable
> Consoles show loading stages and startup errors name the last stage. No dependency,
> migration, Java helper, security policy or hosted configuration change.
> Build passed; lint zero errors/eight existing warnings; full suite 148/148 with no
> skips; 21 focused checks pass after two deliberate regressions failed and were restored.
> Actual CheerpJ with no-Range host: Hello CodeShare, two-file Unicode/blank input,
> Stop and fixed-input module pass; offline laptop Java passed with no Java frame/logo.
> Static Worker dry-run and offline launcher readiness passed. [Every test name and limits](../verification/java-runner-startup.md).
> CKB-056 is a local mitigation: the original affected-browser timeout was not
> reproduced, so hosted recovery is unconfirmed. CKB-057 separately records an
> unresponsive same-site tight-loop trial and later startup failure on its hostname;
> a different-site parent displayed its five-second timeout, and a fresh runner
> hostname allowed normal execution again. No execution change is approved or included.
> Implementation `90937ce` is complete; final integrated checks passed (148 tests).
> Final evidence `df1619a` and implementation are committed and pushed. [PR #30](https://github.com/SirNeo-Coder/JavaShare/pull/30)
> is merged and attached to this chat. No approved work remains in progress.
> Next: verify the normal automatic builds of both Workers, then affected-browser
> retest using the named Last stage. Hosted rollout remains unverified.
> Temporary local servers and disposable fixtures were cleaned up; existing servers
> and the other checkout's work were preserved. No manual deploy, hosted settings,
> SQL or database push. This explicit merge request does not authorize merging other PRs.

> Current approved UI delivery (2026-10-21): branch `codex/java-console-progress`, directly
> based on main at `8fb41ff`. Teacher approved a Console loading/running indicator and explicitly
> requested merge/push. Implemented a prominent accessible strip above Actual output for module
> and personal runs: saving, Java startup/running, checking, or waiting for input. It clears after
> success/error/Stop; Save work alone does not claim execution. Reduced motion disables spinning.
> Build and actual offline launcher build pass; lint zero errors/eight existing warnings; full
> suite 143/143; real online CheerpJ/offline javac production browser checks 12/12. Hiding the strip
> deliberately failed two render regressions; restored implementation passes. Initial browser
> throttle issue was resolved in the harness. [All named tests, commands and limits](../verification/java-console-progress.md); CKB-055.
> Implementation `8198348` is committed and pushed. Main delivery is tracked by
> [PR #29](https://github.com/SirNeo-Coder/JavaShare/pull/29), under the teacher's explicit merge/push
> instruction. No code work remains. Next: verify the automatic main deployment and re-test
> the hosted Console; the PR records merge status. No other open PRs are part of this delivery.
> No schema, dependency or hosted setting change. Hosted rollout/physical devices remain unverified.

> Delivered session work (2026-10-20), now on `main`:
> [PR #24](https://github.com/SirNeo-Coder/JavaShare/pull/24), merge `34b83bb`, implementation
> `b24c89c`: implemented the teacher's two-hour
> and student's fifteen-minute inactivity sign-out. Server checks, trusted browser interaction,
> one-minute warning, restored-tab refusal, shared-tab logout and live-pass deadlines are complete.
> The teacher also removed the VMAS workflow/adjustment classification question; removal
> committed/pushed as `50cc01e`. Normal proposal approval and workflow documentation remain.
> Final build passed; full suite 140/140, no failures/skips; lint 0 errors/8 existing warnings.
> Actual local production browser checked both roles, warning/sign-out, teacher accounts in
> another tab, expired restored-session refusal and offline javac. See
> [session verification](../verification/session-inactivity.md) for every test and limits,
> and CKB-051 for diagnosis. Unsaved edits can be lost after the warning; old cookies need a
> fresh sign-in on rollout. No migration or hosted change. Implementation and rule removal
> committed and pushed; PR attached and merged into `origin/main` under the teacher's explicit
> merge/push request. Preserved main's newer SQL-repair status while resolving the two overlapping
> problem-index/prompt-map rows; application code is unchanged from the verified implementation.
> Local `main` was fast-forwarded; unrelated local files were preserved. Nothing remains in
> progress. Next: verify the automatic main deployment and re-test hosted CodeShare in Brave.
> No hosted setting or manual deployment was changed; hosted behavior is not yet verified.

> Current approved work (2026-10-20): [interactive online Java](online-java-interactive-input.md),
> branch codex/online-java-interactive-input, implementation 7930d79, [PR #22](https://github.com/SirNeo-Coder/JavaShare/pull/22).
> Teacher approved live online answers and explicitly requested push/merge. Feature complete:
> production build passed, 125/125 tests, lint zero errors/eight existing warnings; actual
> CheerpJ teacher/personal flows, fixed module checks and isolated offline Java verified.
> Next: both automatic main deployments and the teacher's hosted interactive re-test.
> No hosted settings changed; original checkout/port 3000 preserved.

> Current approved work (2026-10-20): [online multi-file Java](online-multifile-java.md),
> branch `codex/online-multifile-java`, stacked on weekly-projects PR #20. Browser
> results and a separate public Java runner address were explicitly approved for
> practice progress. Implementation and real browser/isolated offline checks passed; build and 115/115
> tests passed, lint 0 errors/8 existing warnings. Commit `8af5b90` is pushed;
> [PR #21](https://github.com/SirNeo-Coder/JavaShare/pull/21) targets PR #20's branch.
> Teacher deployment/setup is separate. No merge or hosted changes.

> Current approved work (2026-10-20): [two weekly Java projects](weekly-java-projects.md),
> branch `codex/weekly-java-projects`, [PR #20](https://github.com/SirNeo-Coder/JavaShare/pull/20),
> isolated from the other checkout's unfinished merge. Build and 101/101 tests passed; lint has
> 0 errors/8 existing warnings. Main-editor module/personal projects were checked locally.
> Module progression uses printed sample output; a separate personal performance project rolls
> forward independently. Online multi-file Java is the next step. See the feature handoff for
> exact verification and remaining decisions. No hosted changes or deployment authorized.

# CodeShare — Stage One Progress

> Delivered to main: [PR #19](https://github.com/SirNeo-Coder/JavaShare/pull/19), merge `b81b5db`, 2026-10-20, under the teacher’s explicit push-to-main request. Includes the tested dashboard/student-entry prerequisites; 98 tests passed.

> Current student activity work (2026-10-20): approved, committed as `13e68a0` and pushed on `codex/student-module-activities`; [PR #19](https://github.com/SirNeo-Coder/JavaShare/pull/19) is open against PR #18. See [student-module-activities.md](student-module-activities.md) for main-editor projects, automatic progression, CKB-038 resolution and verification. Earlier pending starter-file proposals below are superseded for the student activity path.

> Current student entry work (2026-10-20): see [student classroom entry](student-classroom-entry.md) for the approved direct-entry workflow, orphan cleanup, branch and verification. Teacher dashboard work remains in [its own handoff](teacher-progress-dashboard.md).

Keep this file current. After every finished step: update it, commit, and push the branch.
Anyone continuing this work should be able to start from this file alone.
The working rules are in `AGENTS.md`; the knowledge base starts at `docs/knowledgebase/README.md`; past bugs are in `docs/problem-knowledgebase/`.

Last updated: 2026-10-20. The teacher explicitly requested pushing the completed student activity
workflow to main. PR #19 includes its tested teacher-dashboard and student-entry prerequisites
(PRs #17/#18), plus saved multi-file module projects and automatic per-student progression.
Implementation `13e68a0`; final verification: 98 tests passed, 0 failed/skipped, production build
passed, lint 0 errors/8 existing warnings. See [student module activities](student-module-activities.md).

The earlier classroom UI, drawer animation and printed worksheet were already delivered on main
through PRs #14–16 (including main commits `8464d73` and `704565a`). Their history is preserved.
CKB-038 is now resolved for the approved student activity project path. No hosted setting or
hosted database change was made. This explicit main delivery is not standing permission to merge
future work.

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

9. **Online is the everyday mode; Java online will use CheerpJ** (2026-10-17, for a later stage, nothing built yet). CodeShare runs online day to day, in class too. Offline mode is only the backup when there's no internet, and it keeps running Java on the laptop's `javac`. Online, Java will run in each student's browser with CheerpJ (it never uses a JDK on the student's own computer). CheerpJ granted a free Community Licence (non-commercial education, no ads, no paid content), on condition that the CheerpJ logo shows on pages where Java runs. The free version loads from CheerpJ's site, so the teacher agreed an exception to rule 5, written into `AGENTS.md`. Hosting CheerpJ ourselves would cost money (offered at a discount); not chosen. The plug-in point is the comment at the top of `app/webPreview.ts` and `runCode()` in `app/page.tsx`.

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

- **Pull request:** https://github.com/SirNeo-Coder/JavaShare/pull/5
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
   - **Done 2026-10-17:** the teacher applied both new migrations (`20261016000100_project_language.sql`, `20261016000200_realtime_private_channels.sql`) to the hosted Supabase project in the SQL Editor. Both reported "Success. No rows returned". Applied by hand, so the hosted migration history doesn't list them; never run `supabase db push`.
   - **Done 2026-10-17, Part 1:** Cloudflare Worker `codeshare` connected to `SirNeo-Coder/JavaShare`. Cloudflare's form now shows a "Preview command" box (set to `npx opennextjs-cloudflare upload`) with "Enable Preview builds" on, instead of a separate non-production deploy command. Its first build, of `main`, failed as expected ("could not determine executable to run"), because `main` doesn't have the Cloudflare tools yet.
   - **Done 2026-10-17, Part 2:** the teacher added the 5 secrets, using the legacy anon and service_role keys to match Render. The first attempt put them in the **Build** section's variables, which the running app can't see (health said the keys were missing). They were redone under **Runtime variables and secrets**, as Secret, for **both Production and Previews**. Preview addresses also had to be switched on (Settings > Domains & Routes > Preview), because before that every address gave "error code: 1042". `docs/cloudflare-setup.md` was updated for all three points. Production's `workers.dev` address is still off, as it should be until merging.
   - **Preview:** `https://cloudflare-c2-codeshare.ireneojrseraspe.workers.dev`. `/api/health` answered `connected: true` (checked with curl, 2026-10-17).
   - **Part 3 results so far (2026-10-17, the teacher on two devices):** pass: sign-in with the real class, Live classroom connected, teacher autosave survives reload and sign-out, student typing and cursor seen live by the teacher, student shown Online. **Fail: classroom chat arrived only after a refresh.** CKB-006: Cloudflare dropped the server's unawaited `broadcast()`. **Fixed 2026-10-17** (teacher approved, adjustment): every `broadcast()` is awaited, with a 3-second limit. 18/18 tests pass; the new regression test was shown failing first; checked on the local Cloudflare runtime and offline. CKB-005 (a misleading Java label) was also recorded.
   - **Still to test on the preview:** the chat fix; student Save work with a name; New web project + Run code; activity deploy and live share reaching students.
   - **Chat re-test on the preview passed** (2026-10-17): it arrives live, about 2 seconds after sending. Typing is faster because it doesn't go through the server.
2. After the teacher confirms Cloudflare works:
   - a later step removes Render and Vercel (`backend/src/server.ts`, `render.yaml`, `vercel.json`) — only when the teacher asks;
   - Stage two (course modules) can start.

## Production module repair — 2026-10-20

- Branch: `codex/production-module-setup`. Teacher approved an **adjustment** to
  apply the six existing `20261018` migrations to the hosted project.
- Done: identified CKB-050. Teacher SQL screenshot returned NULL for both
  `public.module_progress` and `public.course_modules`; production dashboard GETs
  fail. Confirm the selected Supabase project matches the Worker's SUPABASE_URL.
- Prepared [teacher repair steps](../production-module-setup.md), updated the
  operations page, problem index and prompt map. Existing migrations and app
  behavior are unchanged. A convenience SQL file in `/tmp` contains unchanged
  copies of the six originals in order; the originals are the durable source.
- Verified: the exact six-file SQL bundle passed in a new disposable local
  PostgreSQL database. The guide's readiness query showed seven false values
  before and seven true values after; existing test teacher/class rows survived,
  both new tables were empty and protected by row-level security. The temporary
  database was removed. Build passed, lint had 0 errors/8 existing warnings, full
  suite passed 125/125 with no skips, and CKB-050 is the first matching search result.
  [Named tests, commands and limits](../verification/production-module-setup.md).
  The SQL-success/merge handoff update also passed both named tests in
  `node --test tests/kb-search.test.mjs` and `git diff --check`.
- Preparation is complete, committed and pushed as `edf4a6b` / `4f3a154`; final
  checks were repeated on current main. [PR #23](https://github.com/SirNeo-Coder/JavaShare/pull/23)
  targets main. The teacher explicitly requested merging it into main on 2026-10-20;
  its GitHub merge status records delivery.
- Teacher supplied a **Success. No rows returned** screenshot after the prepared
  SQL instructions. Hosted SQL success is teacher-reported; the assistant did not
  execute it or independently query the hosted database.
- Next: verify all readiness fields are true, refresh Students/Curriculum, upload
  the intended module, and check student save/reload and refreshed progress.
  Production browser recovery and readiness-query results remain unconfirmed.
- No assistant hosted SQL, database reset, `supabase db push` or deploy command.
  Creating storage does not transfer local modules/progress online.

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

## Module resume and meaningful exercises — 2026-10-21

- Approved by the teacher: reopen the next unfinished step, auto-load each complete sample,
  restore previous step edits, keep personal work separate, and make Week 12/13 alterations
  exercise lesson logic through changed output, using Week 14 as the reference.
- Branch: `codex/module-resume-and-logic-tasks`, based on `codex/classroom-drawer-controls`.
  Work is isolated in `/tmp/codeshare-module-resume`; primary checkout is preserved.
- Done: prepared task/sample-first/Week 12–13 changes integrated with current Console/drawer
  fixes; shared saved-progress resume; seven improved exercise requirements with new ids.
  CKB-052/054 updated and CKB-058 added. Required history migration is the unchanged prepared
  additive file. Hosted actions remain teacher-only.
- Verified: production build, offline launcher and whitespace checks passed; lint zero errors/eight
  existing warnings; full suite 221/221, actual offline/online resume browser 11/11, revised exercises
  on browser Java 8 8/8. Both deliberate-break regressions failed and passed after restoration.
  Final named checks and limits: `docs/verification/module-resume-and-logic-tasks.md`.
- Delivered: implementation `ad7efe6`, pushed on `codex/module-resume-and-logic-tasks`;
  [PR #33](https://github.com/SirNeo-Coder/JavaShare/pull/33) now targets main after PR #32 merged.
  No code work remains in progress. Next: teacher review and documented migration/app/JSON rollout.
  Do not merge or change hosted services. Temporary verification servers were stopped; the original
  classroom and primary checkout remain intact. Continue from `docs/handoffs/rolling-module-tasks.md`.

- History migration update (2026-10-21): teacher screenshots show **Success. No rows returned**
  and the verification row `activity_projects | jsonb | NO` in the selected Supabase project.
  No assistant hosted SQL was run; project identity was not independently verified.
- Prerequisite update: teacher merged PR #32 as `e421fe0`; confirmed through GitHub metadata.
  Retargeted PR #33 from the drawer branch to main; verified open/unmerged/mergeable.
  Next: teacher reviews/merges #33 into main, completes app rollout, and uploads revised
  Week 12/13/14 JSON. Hosted feature verification remains pending. No assistant merge/deploy.

## Rolling module prerequisites — 2026-10-21

- Teacher approved prerequisites first: every required module activity must pass across the
  existing predecessor chain. Personal performance submissions and handwritten liplets remain
  separate; project naming/identity changes remain deferred.
- Branch `codex/module-prerequisites`, based on merged main `9fba8a7`. Work is isolated in the
  attached managed worktree; original checkout and other-chat work are preserved.
- Done: server enforcement at every module/project entry point; earliest-unfinished banner and
  Continue action; live-class catch-up; missing/cyclic prerequisite messages; teacher previews;
  preserved module/personal/earlier-week work, histories and submitted snapshots. No migration.
- Evidence: production build and offline launcher build pass; lint zero errors/eight existing
  warnings; full suite 238/238; real offline/online browser checks 10/10. Server-bypass regression
  failed with the guard removed and passed after restoration. Full named checks and limits:
  `docs/verification/module-prerequisites.md`.
- Delivered: `20d5931` committed and pushed; [PR #35](https://github.com/SirNeo-Coder/JavaShare/pull/35)
  targets main and is attached. Nothing remains in progress. Next: teacher review and rollout,
  including confirming Week 13/14 uploads. Teacher reports PR #33 merged, history migration
  verified, Cloudflare Ready and Week 12 uploaded. The old temporary resume checkout is gone.
  Temporary verification servers were stopped and disposable browser classrooms removed.
- Continue from `docs/handoffs/rolling-module-tasks.md`. Hosted services, physical disconnected
  Wi-Fi devices, Windows and other browsers remain unverified. No assistant merge or hosted action.

## Week 15 to 21 additive curriculum package 2026-10-22

- Approved: add only required sample-first/task material and appendices; preserve original
  lessons, code, outputs, ids, assessment and written Week 20. No runner changes or substitutions.
- Branch: `codex/week15-week21-step-additions`, based on main `9fba8a7`.
- Prepared: seven JSON/PDF/Word review packages, 33 tasks, required upload fields and weekly links.
  Original supplied files and all original document pages remain unchanged.
- Checked: build and offline build passed; lint zero errors/eight existing warnings; full suite
  269/269; every sample/task ran on real Java; deliberately broken upload regression failed and
  passed after restoration. Real local browser passed 6/6, including every code week opening. Delivery is tracked in
  [the active rolling handoff](rolling-module-tasks.md).
- Open: classroom file persistence, original thread-sample timing and visible/browser GUI support
  remain separate decisions. Review copies are not a blanket classroom rollout approval.
- Delivered implementation `614ae27`, committed and pushed; [draft PR #36](https://github.com/SirNeo-Coder/JavaShare/pull/36) targets main.
  Next: teacher reviews the package and runtime limits; never merge or deploy as an assistant.
  Files and limitations: [package index](../modules/week15-week21.md).
