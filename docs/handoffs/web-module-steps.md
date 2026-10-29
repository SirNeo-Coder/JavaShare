# Rolling handoff — Net MVC web module steps (HTML, CSS, JavaScript)

One file for this feature, updated in place after every finished step (AGENTS.md, "Progress
notes"). Another coding assistant must be able to continue from this file alone. Read
`AGENTS.md` first; its "Web module steps (agreed 2026-10-28)" rule is the short version of the
decisions below.

Last updated: 2026-10-29.

## Goal

Net MVC classes use weekly modules whose steps are web pages (HTML, CSS, JavaScript) instead of
Java. Students must be able to work through them like Java modules: open a step, run it, pass,
unlock the next part, see the percentage move, and resume where they stopped. The work is split
into three slices, then the teacher's own revision of the module files.

## Status

| Item | State | Where |
| --- | --- | --- |
| Slice 1 — daily module steps pass | **Done, merged** | [PR #59](https://github.com/SirNeo-Coder/JavaShare/pull/59), merge `93ab62f` on main |
| Side fix — stale Java sample-first browser test (CKB-077) | **Done, merged** 2026-10-28 | [PR #60](https://github.com/SirNeo-Coder/JavaShare/pull/60), merge `79c14b5` on main |
| This rolling handoff | PR open; main merged in by the teacher 2026-10-29 (`d41f819`, both `stage-one.md` entries kept) | [PR #61](https://github.com/SirNeo-Coder/JavaShare/pull/61), branch `docs/web-steps-handoff` |
| Slice 2 — personal performance-task project for web | **Built, PR open** (approved 2026-10-29) | [PR #62](https://github.com/SirNeo-Coder/JavaShare/pull/62), branch `feature/web-personal-project`; see "How Slice 2 works" |
| Slice 3 — page-element and media checks | **Next** — not started | see "Slice 3 notes" |
| Offline work for web steps (beyond keeping existing offline tests passing) | **Deferred** to a separate task (teacher, 2026-10-29) | — |
| Teacher's module revision (JSON, DLL, printed module) | **Deferred** until Slices 2–3 are done (teacher, 2026-10-29) | teacher's files (see "Teacher's files") |

Nothing is deployed by assistants. After merging, the teacher deploys the app and re-uploads
Weeks 2–3 so their `webChecks`/`mediaChecks` are kept (uploads before PR #59 dropped them; same
ids, student progress kept). No database migration was needed for Slice 1.

## Teacher decisions (all approved; follow exactly)

From the Slice 1 prompt (2026-10-28):

1. **Correct output for an html/css step:** `"Tab title: " + document.title + "\nVisible page text:\n"
   + body.innerText` trimmed, every run of 2+ line breaks replaced by one. Same rule as the
   teacher's course-building checker. Compare like `matchesActivityOutput`: normalize Windows line
   endings, ignore one final line break, never ignore spaces.
   **For a javascript step:** console lines joined with line breaks. A run is successful only if the
   page raised no uncaught error. Show a checklist, one line per check, tick or cross; on failure
   show **Required output** and **Your output** side by side. Built so later slices add lines.
2. `webChecks` (`[{ selector, count?, attribute?, value?, style? }]`), `mediaChecks`
   (`[{ src, state: "loaded" | "broken" }]`) and step `includeMediaOutput` (boolean): optional schema
   fields, stored and documented, **not checked** until Slice 3.
3. **Offline:** web pages always run in the student's browser, so the browser's result is accepted
   offline too, as practice evidence checked against server-owned expected output and the saved
   version; never a bare "passed" flag. Replaces "offline always uses the laptop runner" for web
   steps only. Java unchanged.
4. **Web vs Java is decided by file endings** (`.html`, `.css`, `.js` vs `.java`). No new module field.
5. **New web project** stays separate from modules. Do not link them.
6. Steps whose expected output depends on pictures, sound or video cannot be auto-checked yet.

Answers approved on 2026-10-28 (the teacher replied "Approve" to the recommended options):

- Walk the student test through **Week 2**; report Week 1 as failing with the reason.
- **Media steps pass when the teacher presses Mark done** on the student's module card.
- **Teacher-checked = expected output contains a `Media checks:` section** (Week 3 Steps 2–7).
  `includeMediaOutput: true` without that section (Week 3 Step 1) is checked automatically.
- **Keep module `.txt` starter files** in the student's module project as reference files only.
- **Console lines only when `run` is a `.js` file**; any other run file compares page text
  (matches the teacher's checker).

Approved later the same day:

- **Module web steps run in the no-internet preview** (`buildTeacherPreview`, the same policy as
  the teacher's **View web projects** viewer). CKB-022 is resolved for module steps only; the
  student's own **New web project** preview is unchanged.
- **Rule 5's reason** is written in AGENTS.md: offline classroom mode has no internet.

Approved 2026-10-29:

- **Focus on the online version for now; offline work is a separate later task** (teacher,
  2026-10-29), like the module file revision. Offline-only building and offline testing beyond
  the existing tests wait for that task. AGENTS.md rule 1 still holds: offline must not break, so
  the existing offline tests keep running as a safety net.
- **Slice 2 plan approved with the recommended choices:** a web personal project is decided by the
  performance task's starter file endings; browser run evidence (files, success, page text) is
  accepted online and offline for the exact saved files; **Projects** says **Weekly web projects**
  with **W** icons for web modules (Java wording unchanged); **Add file** / **Rename file** in a web
  personal project also allow `.txt` backups. Teacher live help label/colouring fixed (CKB-078).
- **The weekly module file revision is done separately, after this feature is fully built**
  (Slices 1–3). Why (teacher): so everything learned while building it, including things not
  yet seen, goes into one revision of the module JSON, the DLL (daily lesson log) and the
  printed module, instead of revising them now and again later. Until then, do not edit the
  teacher's files; Week 1 keeps failing for the known reason below, and that is expected.

## How Slice 1 works (map)

- `backend/src/module-activities.ts` — `webStep` (all files `.html/.css/.js`), `checkableStep`
  (Java or web), `teacherCheckedStep` (`Media checks:` in expected output), `sourcePath` keeps
  `src/` for web files, `matchesSample` ignores Java's `expectedError` for web steps.
- `backend/src/file-paths.ts` — `moduleWebPathError`: web names plus module `.txt` files.
- `backend/src/course-module-schema.ts` — the three optional step fields.
- `backend/src/routes.ts` — `POST .../progress/complete` accepts web files and skips the Java
  runner refusals only when every file is a web/`.txt` file; `PUT /api/classes/:classroomId/
  students/:studentId/modules/:moduleId/teacher-check` `{ stepId }` (teacher **Mark done**).
  `.../progress/run` and `.../progress/browser-result` stay Java-only on purpose.
- `backend/src/supabase-repository.ts` — `completeSupabaseModuleActivity` (web gate, media
  refusal, files must match the step's kind), `markSupabaseTeacherCheckedStep`, `teacherChecks`
  in `getSupabaseTeacherClassProgress`.
- `app/webPreview.ts` — capture script posts `{ codeshare: "page", title, text }` two animation
  frames after `load`, marks uncaught errors `uncaught: true`; `buildPreview(files, entryPath)`;
  `webPageOutput`, `webRunResult` (the rule, testable without a browser).
- `app/WebStepRun.tsx` — `useWebPageRun` (sandboxed frame, no `allow-same-origin`, accepts
  messages only from its own frame, 5-second limit, scrolls the frame into view) and
  `WebCheckList`.
- `app/StudentModuleActivity.tsx` — web branch: highlighting by file name, `index.html` first,
  preview instead of the Java console, web names in Add file, always the browser path to
  `/complete`.
- `app/ModuleViewer.tsx` — worksheet **Work in code editor** and teacher **Run** for web steps;
  "Checked by your teacher for now" note.
- `app/page.tsx`, `app/ModuleWorkspace.tsx` — Module project opens web steps; `ModuleWorkspace`
  refetches the module when the device copy is older than server progress (CKB-076).
- `app/TeacherClassDashboard.tsx` — **Checked by you** list with **Mark done**.
- Problem records: CKB-074 (web steps never passed), CKB-075 (page text read before drawing,
  mitigated, no test catches it), CKB-076 (locked after Mark done), CKB-022 (internet access).
- Evidence: `docs/verification/web-module-steps.md`. Format: `docs/course-format.md`, section
  "Web module steps".

## Teacher's files

Not in the repository; never edit them unless the teacher asks.

- `/home/ireneo/Documents/Java 2026/Net Files/DotNet1_Week_01.codeshare.json`
- `/home/ireneo/Documents/Java 2026/Net Files/Week_02/DotNet1_Week_02.codeshare.json`
- `/home/ireneo/Documents/Java 2026/Net Files/Week_03/DotNet1_Week_03.codeshare.json`
- Teacher's course-building checker (Playwright): `.../Net Files/Week_03/check_web_steps.cjs`
  (blocks the internet, copies `images/`, `audio/`, `video/` from a `mediaRoot` for media checks).

Results with each step's own sample files (Slice 1, Chromium, no-internet preview):

- **Week 1, all 8 steps: fail.** Every step writes `Visible page text: <text>` on one line; the
  agreed rule puts a line break after `Visible page text:`. That is the only difference; with it
  added, every step passes. The printed Week 1 module PDF uses the same one-line form. Fix both
  in the deferred revision (see "Revision notes").
- **Week 2, all 7 steps: pass.**
- **Week 3 Step 1: pass.** Steps 2–7: teacher-checked (`Media checks:`).
- Weeks 1–3 have no `sampleFirst`, no `activity.id`, no `previousModuleId` and no JavaScript steps.

## How Slice 2 works (map)

- `backend/src/module-activities.ts` — `webPerformanceTask(module)`: web when every performance task
  starter file is `.html/.css/.js` (Weeks 1–3: `index.html`).
- `backend/src/routes.ts` — `allWebFiles` (shared with `/complete`); `PUT .../performance-project`
  takes `webModuleFiles` for web; `POST .../personal-result` takes optional `files` + `output` (web
  evidence) online and offline; without files it keeps the online-only Java rule.
- `backend/src/supabase-repository.ts` — `personalPathError(web, path)` in open/save (web + `.txt`
  vs Java); `beginSupabasePersonalRun` refuses web ("Web pages run in your browser");
  `recordSupabasePersonalRun(…, page?)` needs page evidence for web (and refuses it for Java), files
  must hash-equal the saved project, a success must report `Tab title: …`. Submission
  (`setSupabaseModulePerformanceTask`) unchanged: needs `successfulRun` of the exact saved files.
- `app/StudentModuleActivity.tsx` — `web` for personal projects; run = save → `useWebPageRun` →
  `personal-result`; review run shows the frozen page; no Program input; web names in Add/Rename
  (`moduleWebPathError`, `.txt` allowed for personal); uncaught error shown as an alert, no checklist
  (no target output).
- `app/page.tsx` — **Weekly web projects** / **W** icons, "Your own web project…", "Web files are in
  the editor tabs."; teacher live help label and editor language from `fileLanguage(path)` (CKB-078).
- Evidence: `docs/verification/web-module-steps.md`, section "Slice 2". No migration.

## Slice 3 notes (webChecks and mediaChecks)

- The teacher's checker defines the semantics (`check_web_steps.cjs`): `count` on a selector,
  `attribute` + `value`, `style` + `value` (computed style); media `loaded`/`broken` by decoding
  images and playing audio/video; with `includeMediaOutput` it appends
  `\nMedia checks:\n<src>: image decoded|image failed to decode|playback advanced|playback failed`.
- Media files are binaries kept outside the JSON. The preview is a `srcdoc` frame, so relative
  URLs like `images/snack.svg` cannot load, and the no-internet policy allows only `data:`/`blob:`
  pictures. Slice 3 needs a decision on where media files live and how the preview gets them;
  ask the teacher before building.
- Add each check as one more line in `WebCheckList`; teacher-checked steps could then become
  automatic.

## Revision notes (for the deferred module revision)

Collect here anything the module JSON, DLL or printed module must change because of this
feature. Add to it during Slices 2–3; the revision prompt is written from this list at the end.

- Week 1: all 8 expected outputs need a line break after `Visible page text:` (JSON and the
  printed PDF `DotNet1_HTML_Foundations_Module.pdf`).
- Weeks 2–3: re-upload after deploying so `webChecks`/`mediaChecks` are kept (see "Status").
- Weeks 1–3 have no `previousModuleId`, so each week's personal project starts from that week's
  own starter instead of carrying the student's previous week forward (and no week requires the
  one before). Add the links if carry-forward is wanted.
- Week 3's personal checklist asks students to store pictures, sound and video in the project;
  projects hold text files only until Slice 3 decides where media files live.
- After the revision, re-run every step's sample through `tests/web-module-steps.browser.mjs`
  and report one line per step.

## Testing recipe (local only)

- Local Supabase in Docker must be running (`npx supabase status`).
- Offline-settings production server: build with `npm run build:all`, then run `next start -p
  <port>` with `NODE_ENV=production`, `DATABASE_MODE=supabase-local`, `SUPABASE_URL`,
  `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` from
  `npx supabase status -o env` (`API_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `JWT_SECRET`), any local
  `JWT_SECRET`, `LOCAL_JAVA_EXECUTION=true`, `CODESHARE_LAPTOP=true`, empty `JAVA_RUNNER_URL`.
  In Claude Code start it through `.claude/launch.json` (`preview_start`), not a shell command.
- Ports the browser tests expect: `tests/web-module-steps.browser.mjs` → `WEB_STEPS_BASE_URL`
  (default `http://localhost:3042`); `module-resume` / `module-sample-first` offline → 3022.
- Browser tests need `CODESHARE_PLAYWRIGHT_MODULE` (on this laptop
  `/home/ireneo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`)
  and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
  (`/home/ireneo/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome`). The web steps test
  reads the teacher's files from `DOTNET_WEEKS_DIR` and skips if they are missing.
- Commands: `npm test`, `npm run lint`, `npm run build:all`,
  `node --test --test-reporter=spec tests/web-module-steps.browser.mjs`.
- Rebuild and restart the server after every app change; `next start` serves the old build.

## Things learned the hard way

- Choosing a module in the **Module** browser already opens its next unfinished step in the
  editor; clicking **Work in code editor** for that same step does not remount the editor.
- A Net MVC class's own workspace also has an HTML editor; scope test locators to
  `.student-module-project`.
- The editor remounts per step; wait for the old editor element to detach before typing.
- `innerText` of a frame that has not been laid out returns raw source text (CKB-075).
- The student's device keeps module content for 5 minutes (`moduleDeviceStore.ts`); any
  progress written by someone else needs the CKB-076 refetch rule.
- Another session's worktree under `.claude/worktrees/` makes plain `npm run lint` report its
  files; check this project with `npx eslint . --ignore-pattern .next --ignore-pattern backend/dist
  --ignore-pattern .claude`.

## Known limits and open questions

- Only Chromium was tested; Firefox/Safari may split `innerText` lines differently.
- Online/hosted mode, phones, dark theme, two devices and real classroom Wi-Fi are untested.
- **Mark done** has no undo (teacher chose to leave it out for Slice 1).
- `.txt` reference files are highlighted as Java in the editor and live help.
- Teacher's worksheet **Personal performance-task project** slot (`ModuleViewer` `PerformanceTaskSlot`)
  shows **Run** only for `.java` files, so web example/starter files have no Run there (unchanged).
- The Net MVC student **Projects** text before choosing a module still says "open its Java projects"
  (no module chosen yet, so the subject is not known there).
- The class workspace note "Java files are in the editor tabs." still says Java for web **module
  steps** (Slice 1 screen; Slice 2 changed it only for personal/review web projects).
- Slices 1–2 passed in online settings on `next start` (11/11, 2026-10-29); not yet on Cloudflare's
  runtime (`cf:preview`) or the hosted site.
- CKB-022 remains open for the student's own **New web project** preview.
- PR #60's (merged) open question (a second device may show the next part locked for up to five minutes)
  is probably covered by CKB-076's refetch rule; not tested with two devices.

## Next step

1. Teacher reviews and merges [PR #62](https://github.com/SirNeo-Coder/JavaShare/pull/62) (Slice 2, branch `feature/web-personal-project`).
2. Slice 3 (`webChecks`, `mediaChecks`; see "Slice 3 notes"): first ask the teacher where media
   files live and how the no-internet preview gets them, then propose following AGENTS.md.
3. Last: the module file revision, written from "Revision notes".

## Update log

- 2026-10-28 — Slice 1 built and verified (386/386 suite, offline browser 10/10); no-internet
  preview and rule 5 reason approved and added. PR #59.
- 2026-10-29 — PR #59 merged (`93ab62f`). PR #60 conflicts with main resolved (both document
  entries kept); its refreshed test passed 5/5 offline on the combined code, suite 386/386. This
  rolling handoff created.
- 2026-10-29 — Status checked against GitHub: PR #60 merged (`79c14b5`); PR #61's
  `stage-one.md` conflict with main was resolved by the teacher's merge `d41f819` (both entries kept). Week 1
  re-checked: all 8 expected outputs still use `Visible page text: <text>` on one line. Weeks 1–3
  revision proposed to the teacher; waiting for approval.
- 2026-10-29 — Teacher decided the module file revision (JSON, DLL, printed module) waits
  until Slices 2–3 are built, so it covers everything learned. Week 1 fix moved to "Revision
  notes"; Slice 2 is next.
- 2026-10-29 — Slice 2 investigated and proposed (see the chat proposal; files: routes,
  repository, `StudentModuleActivity`, `page.tsx`, tests). Two module-file findings added to
  "Revision notes". Waiting for approval.
- 2026-10-29 — Slice 2 built on `feature/web-personal-project` (approved with recommended choices):
  web personal project opens, saves, runs in the browser preview online and offline, submits to
  100%; teacher review runs the frozen page; live help label fixed (CKB-078). Real-route 22/22,
  offline browser 11/11, Java personal 6/6, live help 7/7, suite 391/391, lint 0 errors; four
  break-and-restore proofs. Not run in online settings.
- 2026-10-29 — Slice 2 delivered as [PR #62](https://github.com/SirNeo-Coder/JavaShare/pull/62) against main.
- 2026-10-29 — Teacher: focus on the online version; offline work becomes a separate later task
  (rule 1 still holds). Checking Slices 1–2 in online settings next.
- 2026-10-29 — Online settings check (port 3043, browser mode confirmed): web steps browser test
  11/11. Next: propose a Cloudflare-runtime check and the teacher's hosted checklist.
