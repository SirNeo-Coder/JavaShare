> Copy code on each step (2026-10-27): the teacher felt the Console's **Code from this module** list
> was the wrong place and approved putting copy buttons on the steps, with the recommended option:
> hide the Console list for modules that have steps, keep it for modules without. Branch
> `feature/step-copy-code`, based on origin/main `2f91227`, worktree `../JavaShare-task-steps`.
> Changes: `moduleCode`/`copyText` moved from `app/StudentModuleActivity.tsx` to `app/ModuleViewer.tsx`
> (a shared home avoids a circular import); new `stepCode` and a **Copy <label>** button at the end
> of each step naming a sample, in Projects, the Console and the module page; Console fold-out hidden
> when `performanceTask.steps` exists. Week 12 step 4 reworded (it pointed at the hidden list), so
> Week 12 needs one re-upload; other weeks unchanged. No server, schema or data change.
> Verification: see the PR. Next: teacher review, merge, online deploy, re-upload Week 12.

> Performance task steps in the Console (2026-10-27): the teacher looked for the steps in the
> personal project's Console box **Your performance task** and approved also showing them there,
> keeping them in Projects and on the module page. (PR #54 had merged into its stacked base branch,
> not main; the same change reached main as PR #55.) Branch `feature/console-task-steps`, based on
> origin/main `8a3f078`, worktree `../JavaShare-task-steps`. Change: one line in
> `app/StudentModuleActivity.tsx` reusing `PerformanceTaskSteps`, student personal project only
> (not module project or teacher review). No server, schema or data change. Verification: see the
> PR; new render test in `tests/weekly-java-project-ui.test.mjs` shown failing with the list removed
> and with it shown in review, passing restored; `tests/personal-performance.browser.mjs` checks
> the Console list. PR #56 merged into main. Teacher re-uploaded Weeks 12–19 and 21 on the online
> site (a first attempt used the old pre-steps files from a folder still on the old branch) and confirmed
> the steps now show. Done.

> Performance task steps (2026-10-27): teacher asked for a step-by-step procedure students can
> follow to meet the performance-task requirements, including when to use the new Copy code, and
> approved: an optional `performanceTask.steps` list in each weekly JSON, shown as a numbered
> **How to build it, step by step** guide above the Performance task checklist in Projects and on
> the module's Performance task page. First delivered as PR #54 stacked on
> `feature/personal-copy-module-code`; the copy-code PR #52 reached main first, so #54 merged into
> that feature branch, not main. Re-delivered on branch `feature/personal-task-steps-main` (the same
> commit cherry-picked onto origin/main `06b6400`, worktree `../JavaShare-task-steps`). Changes: schema field (`backend/src/course-module-schema.ts`),
> `PerformanceTaskSteps` in `app/ModuleViewer.tsx`, one line in `app/page.tsx`; steps drafted for
> Weeks 12–19 and 21 from each week's own task text and checklist (Week 20 stays paper). No server
> route, database, progress or grading change. Teacher must re-upload the updated weekly JSON files
> for steps to appear (same ids, progress kept); assistants never upload to hosted services.
> Verification: full suite 363/363; new `tests/performance-task-steps.test.mjs` (12 tests: schema keeps
> steps, list renders, every named sample matches a real Copy code label in each week) caught three
> wrong labels while drafting; schema, render and label breaks each shown failing, passing restored;
> offline production browser test 6/6 (local Supabase, laptop Java) with new steps checks in Projects
> and the worksheet, shown failing with the Projects list removed and passing restored; real Week 12
> content checked in Projects on screen; `build:all` passes; lint 0 errors, 8 existing warnings.
> Not checked: online CheerpJ mode, hosted site, phones, dark theme. Open choice: teacher was asked
> whether to also show the steps in the Console's **Your performance task** box. Next: teacher merges
> the re-delivered PR into main and re-uploads the weekly JSON files.

> Teacher live help (2026-10-27): teacher approved seeing and editing what a selected student is
> working on. Selecting a student in **Students / projects** shows their open Module project or
> Personal performance-task project live (heading "Live: <name> · Module project/Personal project
> · <module>", student name cursor); the teacher can type and the student sees it with a "Teacher"
> cursor. Only the student's Save work / device draft / successful run keeps it. Students send only
> while the teacher has their card selected (teacher tracks Presence `{ teacher: true }` on the
> student's own team channel), never on group or Teacher Demo channels. Selecting a group lets the
> teacher type in its shared code while a member is online; teacher never auto-saves group files.
> Branch `feature/teacher-live-help`, based on main `f2fbdd2`. Changes: new `app/liveText.ts`
> (existing typing helpers moved out of `page.tsx` + mirror/guard helpers), `app/page.tsx`,
> `app/StudentModuleActivity.tsx`; no server, schema, migration or policy change. AGENTS.md rule
> "Teacher live help" added. Verification: 352/352 full suite (4 new rule tests); offline
> production browser test `tests/teacher-live-help.browser.mjs` 7/7; existing
> `personal-performance.browser.mjs` 6/6; four deliberate breaks each shown failing then restored;
> `build:all` passes; lint 0 errors, 8 existing warnings. Not checked: online/hosted Realtime,
> launcher-owned `classroom:offline` on port 3000 (tests used a separate production server on 3032
> with the same local Supabase and laptop Java settings), second physical device, dark theme.
> Pushed; [PR #53](https://github.com/SirNeo-Coder/JavaShare/pull/53) is open against main.
> Next: teacher review.

> Copy module code into the personal project (2026-10-27): teacher approved letting students copy
> module code into their personal project, code only (personal filenames differ from the module's),
> with the recommended scope: unlocked lesson step samples plus the performance task's Sample code.
> Branch `feature/personal-copy-module-code`, based on origin/main `f2fbdd2`, in its own worktree
> (`../JavaShare-module-code-copy`) because another session was editing `feature/teacher-live-help`
> in the main checkout. Changes: `moduleCode`, `copyText` and the **Code from this module** fold-out
> in `app/StudentModuleActivity.tsx` (personal project only; not module project or teacher review).
> Copy code copies text only; it never adds, renames or saves files. Offline classroom pages are
> plain http, where browsers turn off `navigator.clipboard`, so it falls back to
> `document.execCommand("copy")`. No server, schema or data change. Verification: 351/351 full suite;
> three new unit/render tests each shown failing when broken and passing restored; new
> `tests/personal-copy-module-code.browser.mjs` passed on an offline-settings production build over
> the laptop's network address (plain http, real Ctrl+V paste) and on localhost, and failed with the
> fallback removed; `build:all` passes; lint 0 errors, 8 existing warnings. Not checked: online
> CheerpJ mode, hosted HTTPS site, phones/tablets, dark theme. PR #52 was merged into main by the
> teacher (merge commit `f1a6217`, 2026-10-27). Done.

> Personal project Save work colours (2026-10-27): teacher declined auto-save (Run code already
> saves personal files to the server) and approved: fix the personal Run code message to "Saving
> your project…", and colour the personal project's Save work button blue (saved), green (a few
> unsaved edits) or red (10+ changed lines since the last save/run). Branch
> `feature/save-work-colours`, based on origin/main `1db24df`. Changes: `changedLines` and the
> colour class in `app/StudentModuleActivity.tsx`, three colour rules in `app/globals.css`. Module
> project and teacher review unchanged; no server, schema or data change. Verification: 348/348
> full suite; offline production browser test 6/6 including the new colour/wording step; unit
> line-count test and browser wording step each shown failing when broken and passing restored;
> `build:all` passes; lint 0 errors, 8 existing warnings. Online browser mode and dark theme were
> not checked on screen. Pushed; [PR #51](https://github.com/SirNeo-Coder/JavaShare/pull/51) was
> merged into main by the teacher (merge commit `f2fbdd2`, 2026-10-27). Done.

> Student performance-task checklist in Projects (2026-10-27): teacher approved showing each
> module's performance-task checklist to students in the Projects panel, read-only, with boxes the
> student may tick for what their project already does. Branch `feature/personal-task-checklist`,
> based on origin/main `3b662d7`. `PersonalTaskChecklist` (in `app/PersonalSubmissionChecklist.tsx`)
> renders under Personal performance-task project once a module is chosen (`app/page.tsx`). Ticks
> are saved in that browser only (`codeshare-task-checklist:<student>:<class>:<module>`); no server,
> schema, progress, submission or teacher-review change. Teacher review ticks stay teacher-only.
> Verification: 346/346 full suite; offline production browser test 5/5 (local Supabase, laptop
> Java) including the new tick-survives-reload step; unit test shown failing with tick restore
> broken, passing restored; `build:all` passes; lint 0 errors, 8 existing warnings. Online browser
> mode not run (no runner on 3033/3034; the panel code is the same online). Pushed;
> [PR #50](https://github.com/SirNeo-Coder/JavaShare/pull/50) was merged into main by the teacher
> (merge commit `1db24df`, 2026-10-27). Done.

> Java member suggestions (2026-10-27): teacher approved extending the existing Java code
> suggestions (merged PR #34, 2026-10-21) to also suggest a variable's declared class's own
> public methods and public fields after typing `.` — the gap that work's own shortcut comment
> named ("use a language server if typed member completion is needed"). Branch
> `feature/java-member-completion`, based on current main `04187ef`. `app/javaSuggestions.ts`
> gained a regex-based (not type-checking) class-member lookup reused by the existing suggestion
> UI in `app/CodeEditor.tsx`, unchanged; `files` threading in `app/page.tsx` and
> `app/StudentModuleActivity.tsx` lets the lookup resolve a class defined in a different project
> file. `System.` keeps its existing snippet behavior untouched. Verification: full suite 340/340
> including all 12 `tests/java-suggestions.test.mjs` cases (4 new); `build:all` and `lint` (0
> errors, 8 pre-existing warnings) pass; real-app check in the classroom Code editor confirms
> cross-file resolution (`Tricycle` declared in a second file), prefix filtering, arrow/Enter
> insertion placing the caret correctly immediately after insertion (no CKB-059 regression), and a
> real `javac` run of the inserted call. Implementation and verification complete; branch pushed
> and [PR #46](https://github.com/SirNeo-Coder/JavaShare/pull/46) is open against main. Teacher
> review and rollout are next. No schema, server, or hosted-settings changes.
>
> Module-loading repair recovered (2026-10-23), branch `codex/module-summary-repair`
> based on saved origin/main fc0972c. CKB-067: module lists failed with 500 because
> required `codeshare_module_summaries(uuid)` was absent, despite existing tables
> and read grants. Teacher approved existing unchanged migration 20261022000200,
> confirmed all four prerequisites and applied the transactional SQL package.
> Teacher reports SQL succeeded and Module now loads. Assistant changed no hosted
> services. Done: setup/prerequisite/transaction/readiness instructions; incident,
> index, prompt map, operations and this handoff updated. Build:all passes; lint
> passes with 0 errors/8 existing warnings; full suite 325/325, no skips; diff clean.
> Sandbox/dependency failures and named final checks are recorded in
> docs/verification/module-summary-repair.md. Repair documentation e1a5a16 is
> committed/pushed; [PR #43](https://github.com/SirNeo-Coder/JavaShare/pull/43)
> is open against main for review. No local implementation work remains.
> Teacher confirms all five function/permission readiness values true. Next:
> confirm both roles can open Module and a student's successful activity survives
> reload; the teacher's all-true reply is recorded only as readiness evidence.
> Hosted CPU recovery is separate and unverified. No app/test/config/migration
> changes. Existing migration untouched; no new dependency or offline runtime change.

> Active approved completion-only module saving (2026-10-22): teacher explicitly
> Current module draft recovery (2026-10-23): teacher approved fixing the three review findings.
> Branch `codex/module-draft-recovery`, isolated managed worktree, based on main `fc0972c`
> after PR #41 merged. Expected-error sample verification survives reopening; changed/legacy
> drafts retain readable code backups and lose obsolete evidence; pending sync no longer claims
> completion. The module picker and editor refresh stale content before restoring current work.
> CKB-067/068/069 record the defects. No schema or backend changes; personal projects remain separate.
> Verification: 329/329 full suite, 7/7 actual production browser checks, 9/9 focused rule/render
> checks after three deliberately failing mutations. Online runner/503 responses are controlled;
> offline uses real laptop javac. Build:all passes; lint has 0 errors and 8 existing warnings;
> offline launcher configuration check passes. Every named result, initial failures, and limits:
> [module draft recovery verification](../verification/module-draft-recovery.md).
> Implementation and verification are complete. Delivery: commit/push this branch and open its PR
> against main, then record that PR here. Teacher review/rollout remain next. No assistant merge,
> deployment or hosted settings/SQL. Hosted CPU, real CheerpJ and physical Wi-Fi are unverified.

> Earlier completion-only module saving (2026-10-22): teacher explicitly
> approved the combined plan: cache downloaded lessons/local unfinished drafts,
> save online Module project code only after task success, and lighten server checks.
> Branch codex/module-completion-saves starts at current main 23053f1; isolated
> checkout /tmp/codeshare-api-errors reuses dependencies. Original checkout untouched.
> Server step done: service-role-only lightweight metadata, selected-module read reuse,
> read-only step preparation and one guarded/idempotent completion checkpoint. New
> migration 20261022000200 applied locally only; teacher rollout/rollback guide is
> docs/module-completion-setup.md. Old endpoints/teacher response shapes preserved.
> Checks: build:all passes; focused existing module integration checks 67/67, extended
> completion checks 7/7, no skips. Deliberate opening-write mutation fails the regression;
> restored checks pass. CKB-065, backend KB and approved AGENTS rule updated.
> In progress/next: device content/draft storage, local sample/task checking and
> completion-only editor/caller integration, request-count/conflict/browser/offline
> checks, full build/lint/suite, repeated Worker profile, final PR. No hosted CPU
> recovery claim. Personal/submission/laptop paths must remain compatible. No merge,
> deploy, hosted settings or hosted SQL. PR #39's error-message repair remains separate.

> Latest clarified requirement (2026-10-22): teacher wants student Module project
> code saved to the server only when the task completes successfully. Earlier
> "local activities; sync later" direction is narrowed: task completion is the sync
> point, rather than a generic later whole-module Sync progress workflow.
> [Revised concrete proposal](../verification/local-module-practice-proposal.md)
> is ready for explicit implementation approval. Online module drafts, sample
> verification and unsuccessful runs stay local; one guarded completion checkpoint
> saves exact successful code/progress, then unlocks the next step. Earlier completed
> status must not make a later failed run overwrite successful code. Keep retry
> evidence locally on failed sync and do not silently overwrite newer remote work.
> Later locked steps remain server-withheld; downloading hidden future tasks is no
> longer proposed. Essential sign-in/read requests remain. Include lightweight server
> metadata/read reuse so the completion save does not reproduce CKB-065's CPU failure.
> Expected scope: module browser/editor/callers/local draft helper, guarded server
> checkpoint and one new migration; personal submissions/offline runner preserved.
> CKB-065 and CKB-035 apply. No new app/schema/config/tests changed or run for this
> proposal. Next: teacher approves/revises this plan under AGENTS.md. Branch
> codex/api-service-errors / PR #39 still contains only the tested error-message repair
> and investigation/proposal records; earlier error-message approval does not cover
> this changed implementation. Original checkout/unrelated files remain untouched.

> Approved service-error mitigation (2026-10-22): `codex/api-service-errors`, isolated
> checkout `/tmp/codeshare-api-errors`, based on main `21766ba`. Teacher approved the
> response-handling repair, regression proof, required checks and evidence-based 503
> investigation after screenshots showed Module worksheet JSON parsing errors.
> Done: the shared helper reports unreadable error responses with their HTTP status,
> retains JSON/prerequisite details and normal session events, rejects malformed success
> and does not retry writes. Protected HTML 401s now reach existing sign-in recovery.
> Only app/apiClient.ts changes application behavior; callers needed no changes or cleanup.
> Checks: offline launcher build (including build:all) passes; lint 0 errors/8 existing
> warnings; full suite 311/311 with no skips; local production browser 4/4 including
> unsaved-code preservation, retry, real laptop Java/sample completion and HTML 401 sign-out.
> Original-helper regression proof: 6 fail/3 pass; restored helper 9/9. All names,
> commands and limits: [verification](../verification/api-service-errors.md). CKB-064,
> prompt map and frontend/workflow pages updated. Approval covers normal branch/PR delivery.
> Diagnosis updated from teacher log: the module-project save was terminated by
> Cloudflare for exceededCpu at 10 ms CPU / 404 ms total time (CKB-065). Earlier
> health lookup used a misread hostname; corrected public health returns 200/connected.
> This is not proof of module-save recovery. Account plan/effective CPU limit unknown;
> teacher explicitly requires Free and requested CPU-reduction investigation.
> Delivered: implementation `f256834` committed/pushed; [PR #39](https://github.com/SirNeo-Coder/JavaShare/pull/39)
> is open against main and attached to the chat. GitHub connector PR creation returned
> 403; existing gh login successfully created it. No merge or deployment.
> Stay-free CPU investigation is complete: unchanged local Worker and direct-handler
> control each ran 20-request phases with real Week 12–21 data. Full-library parsing
> is a major measured cost; bypassing Next alone leaves most module cost. Candidate
> metadata is 2,934 bytes versus 885,998 bytes full content, not a speed guarantee.
> [Profile evidence and proposed next plan](../verification/free-worker-cpu-investigation.md).
> Next: teacher review of #39 and explicit approval of metadata-only database reads
> plus request-local module reuse. This requires one new migration and guarded server
> changes; none is implemented/approved yet. Preserve access/version/progression rules.
> No hosted CPU recovery claim. Temporary Worker/control/data/credentials are cleaned.
> Physical Wi-Fi/disconnected operation and online CheerpJ were not rerun; local Java passed.
> Original checkout and unrelated files remain untouched; temporary app/fixtures are cleaned.
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
> No code work remains in progress. Teacher reports uploading corrected Weeks 18–21 with no
> apparent problem (2026-10-22). This is teacher confirmation, not an independent hosted/student
> check. Next: teacher reviews the PR; retain the existing ids and prerequisite requirements.
> Teacher guide: `docs/curriculum-prerequisite-reupload.md`. Student drafts, completions and
> submitted snapshots stay saved; unfinished earlier tasks still block later weeks.
>
> Open: independent hosted/student recovery checks, physical offline devices, online/visible GUI behavior and
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

## Course modules order — 2026-10-22

- Teacher approved: unfinished weeks increase from Week 12 through Week 21; completed
  modules move below them so the next unfinished week is first.
- Branch: `codex/module-catalog-order`, isolated checkout `/tmp/codeshare-module-order`,
  based on main `21766ba`. Original checkout and its existing changes are preserved.
- Done: drawer uses existing saved 100% completion, then increasing week; weekly badges
  remain visible. No saved-work, lock, execution, schema or configuration changes.
- Verified: production build passes; lint 0 errors/8 existing warnings; full suite 306/306,
  0 skips; local real-browser checks 4/4 including laptop Java completion and reload.
  Restoring the old comparator failed three regressions; restoring the fix passed all four.
- Initial build dependency-link failure and browser timing failures are recorded alongside
  final named results in `docs/verification/module-catalog-order.md`. CKB-066 records the bug.
- Delivered: implementation `9d17fe1` committed and pushed; [PR #40](https://github.com/SirNeo-Coder/JavaShare/pull/40)
  is open against main. No implementation work remains in progress.
- Next: teacher reviews/merges #40 and rolls out the app. Hosted ordering and real
  classroom Wi-Fi remain unverified. No assistant merge, deployment or hosted setting changes.

- PR #40 conflict update (2026-10-22): updated branch with main `ce73db0`, preserving
  the completed CKB-063 curriculum correction and all module-ordering notes. Only three
  documentation files conflicted; module-ordering code/tests and corrected JSON/tests
  were verified unchanged. Build passed; lint 0 errors/8 existing warnings; 307/307 full
  tests with no skips; real local browser 4/4. Resolution is committed and pushed on the
  same branch for review. No implementation work remains; teacher review/merge/rollout
  remain next. Named evidence is updated in `docs/verification/module-catalog-order.md`.

## Module CPU reduction — 2026-10-22

- Teacher approved keeping CodeShare on the free plan by caching module content and
  unfinished module work on each student's device, then saving module code only after
  a successful task. Personal performance-task saves remain unchanged.
- Branch: `codex/module-completion-saves`, based on the guarded completion checkpoint
  groundwork in `20dfbd9`. Work is isolated in `/tmp/codeshare-api-errors-recovery`.
- Done: read-only module preparation, student/class-scoped device cache, local module
  drafts and sample evidence, one validated online completion checkpoint, same-id retry
  after sync failure, and updated filtered cache content in the successful response.
  Offline still uses classroom-laptop Java; only successful module results are saved.
- Verified: full suite 316/316 with no skips; lint 0 errors/8 existing warnings;
  Next.js/backend and offline launcher builds pass; online production browser 9/9.
  Regression mutation of the old pre-run save fails as expected and passes after restore.
  Offline browser attempt was interrupted before reporting cases; see
  `docs/verification/module-completion-saves.md` for exact evidence and limits.
- Delivered: implementation `869333e` is committed and pushed; [PR #41](https://github.com/SirNeo-Coder/JavaShare/pull/41)
  is open against main. Next: teacher reviews the branch and decides whether to deploy.
  No hosted settings, database, or deployment were changed; free-plan CPU recovery and
  physical classroom Wi-Fi remain unverified.

## Personal performance-task workflow — 2026-10-23

- Teacher approved the implementation plan in this chat: successful-run submission, frozen
  per-module copies, submission progress independent of review, and teacher checklist review.
- Branch: `codex/personal-performance-workflow`, based on main `7946f0b`. Preserves prerequisite
  checks, shared subject modules, completion-only module saves and device draft recovery.
- Done: Projects exposes personal Java work; current drafts remain intact; linked modules prefer
  prior submitted personal files. Exact saved files must run successfully before submission.
  Teacher Students → student → module → Review personal submission opens read-only frozen files
  in the main editor with ordinary Java execution and the complete frozen checklist in Projects.
  Resubmission resets that copy's review. Java 2 Week 20 remains paper work and is skipped during
  personal carry-forward. No new migration or dependency.
- Verified: 335/335 automated tests with actual local Supabase and Java; no skips. Offline
  production browser 4/4; online production browser 5/5, including input, Stop and teacher runs.
  Production and offline-launcher builds passed; lint zero errors/eight
  existing warnings. Three deliberate-break regressions failed, then passed when restored.
- Delivered: implementation `3a18c3e` and verification `24bd381` committed and pushed.
  [PR #44](https://github.com/SirNeo-Coder/JavaShare/pull/44) is open against main. Named results,
  earlier failures and limits are in `docs/verification/personal-performance-workflow.md`.
- Problem record: CKB-070. Rules, workflow, route/storage/permission maps and prior case links updated.
- Next: teacher reviews the PR and decides rollout. No merge, deploy, hosted settings or hosted
  database changes. Windows and physical disconnected classroom Wi-Fi remain unverified.
