# Rolling handoff — Net MVC web module steps (HTML, CSS, JavaScript)

One file for this feature, updated in place after every finished step (AGENTS.md, "Progress
notes"). Another coding assistant must be able to continue from this file alone. Read
`AGENTS.md` first; its "Web module steps (agreed 2026-10-28)" rule is the short version of the
decisions below.

Last updated: 2026-11-11 (Week 9).

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
| This rolling handoff | **Merged** (PR #61, then kept current through each later PR) | `docs/handoffs/web-module-steps.md` on main |
| Slice 2 — personal performance-task project for web | **Done, merged** 2026-10-29 | [PR #62](https://github.com/SirNeo-Coder/JavaShare/pull/62), merge `744cbb5` on main; see "How Slice 2 works" |
| Online check of Slices 1–2 | **Done**: laptop 11/11 (online settings, Cloudflare runtime); teacher reports the hosted check done 2026-10-29 | [PR #63](https://github.com/SirNeo-Coder/JavaShare/pull/63), merge `d0ee2cf` on main |
| Slice 3a — page-element checks (`webChecks`) | **Done, merged** 2026-10-29 | [PR #64](https://github.com/SirNeo-Coder/JavaShare/pull/64), merge `0dcdd6a` on main; see "How Slice 3a works" |
| Slice 3b — pictures, sound, video (`mediaChecks`) | **Done, merged** 2026-10-29 (R2, one shared copy, 5 MB per file, device cache, teacher-checked until upload). Hosted check passed (teacher, 2026-10-29: bucket created before merging, no card asked, Week 3 Steps 2–7 tick every line, no `exceededCpu`) | [PR #65](https://github.com/SirNeo-Coder/JavaShare/pull/65), merge `26875dc` on main; see "How Slice 3b works" |
| Students' own pictures, sound and video in personal web projects | **Done, merged** 2026-10-29 (online; 5 MB each, at most 10, carries forward). Cloudflare build check passed; hosted check not yet done | [PR #68](https://github.com/SirNeo-Coder/JavaShare/pull/68), merge `fc9a946` on main; see "How student media works" |
| CKB-080 — Run on a media step before the media load shows a cross (teacher and student) | **Fixed, merged** 2026-10-29: **Run** waits (**Loading media…**) | [PR #75](https://github.com/SirNeo-Coder/JavaShare/pull/75), branch `fix/media-run-before-loaded`; `docs/problem-knowledgebase/cases/CKB-080-teacher-media-run-before-loaded.md` |
| Offline work for web steps, including offline media (offline has no Cloudflare R2) | **Deferred** to a separate task (teacher, 2026-10-29) | — |
| Teacher's module revision, Weeks 1–3 (JSON, DLL, printed module) | **Retired** 2026-10-30: the teacher replaced the 20-week canteen map with a 10-week resume map; the old Weeks 1–3 materials are not used (CKB-085) | teacher's files |
| App task — sample-first and alteration tasks for web steps (Java workflow) | **Done, merged** 2026-10-29: works online and offline; fixed CKB-083 | [PR #72](https://github.com/SirNeo-Coder/JavaShare/pull/72), branch `feature/web-sample-first`; `tests/web-sample-first.browser.mjs`, `tests/web-module-steps.*` |
| Page window: **Run code** shows the page in a floating window with its checks; links and frames open the project's own pages (CKB-086) | **Built** 2026-10-30, PR open; unit 411/411, browser tests pass offline (3042) and on Cloudflare's runtime (8787) | [PR #76](https://github.com/SirNeo-Coder/JavaShare/pull/76), branch `feature/web-page-window`, commit `f2bb36f` |
| Page window stays until a completed task is synced (CKB-087, review finding on PR #76) | **Built** 2026-10-30, PR open; unit 411/411, web browser tests pass offline (3042); Cloudflare runtime not run | [PR #77](https://github.com/SirNeo-Coder/JavaShare/pull/77), branch `fix/page-window-close-during-sync`, commit `cf54e6f` |
| Weeks 1–10 of the 10-week resume map (JSON, DLL, printed module) | **Week 1 built** 2026-11-06 (`Resume/Week_01/`, module `dotnet-1-r01`): teacher's checkers pass, CodeShare browser test 9/9 steps "sample verified, task completed" on Cloudflare's runtime (8787) and offline settings (3042). PR #83 merged. **Week 2 built** 2026-11-06 (`Resume/Week_02/`, module `dotnet-1-r02`, 9 media steps): teacher's checkers pass; browser test 18/18 steps "sample verified, task completed" on Cloudflare's runtime (8787, Week 2 media uploaded); offline settings (3042) Week 1 completed, Week 2 media steps marked done. Found CKB-092 (worked around). PR #84 merged. **Week 3 built** 2026-11-08 (`Resume/Week_03/`, module `dotnet-1-r03`, three pages, media on Steps 1 and 9 only): teacher's checkers pass; browser test 27/27 steps "sample verified, task completed" on Cloudflare's runtime (8787, Weeks 2–3 media uploaded); offline settings (3042) Week 3 Steps 2–8 completed, Steps 1 and 9 marked done. Found CKB-093 (worked around). **Week 4 built** 2026-11-08 (`Resume/Week_04/`, module `dotnet-1-r04`, shared `styles.css`, media on Steps 1, 3 and 9 only): teacher's checkers pass (`test_checker.py` 20/20); browser test 36/36 steps "sample verified, task completed" on Cloudflare's runtime (8787, Weeks 2–4 media uploaded); offline settings (3042) Week 4 Steps 2 and 4–8 completed, Steps 1, 3 and 9 marked done; new Week 4 personal subtest passes on both. Found CKB-094 (worked around). **Week 5 built** 2026-11-09 (`Resume/Week_05/`, module `dotnet-1-r05`, only styles.css changes, media on Steps 1, 6 and 9 only, both Thursday repairs change the page text): teacher's checkers pass (`test_checker.py` 21/21); browser test 45/45 steps "sample verified, task completed" on Cloudflare's runtime (8787, Weeks 2–5 media uploaded); offline settings (3042) Week 5 Steps 2–5, 7, 8 completed, Steps 1, 6, 9 marked done; new Week 5 personal subtest passes on both; found CKB-096 (stale browser-test locator, fixed). **Week 6 built** 2026-11-09 (`Resume/Week_06/`, module `dotnet-1-r06`, Juan's nav becomes a list on all three pages, media on Steps 1, 5 and 9 only): teacher's checkers pass (`test_checker.py` 27/27); browser test 54/54 steps "sample verified, task completed" on Cloudflare's runtime (8787, Weeks 2–6 media uploaded); offline settings (3042) Week 6 Steps 2–4, 6–8 completed, Steps 1, 5, 9 marked done; new Week 6 personal subtest passes on both; found CKB-097 (border widths follow the page window's zoom; worked around). **Week 7 built** 2026-11-10 (`Resume/Week_07/`, module `dotnet-1-r07`, Juan's gallery and Week 2 media on index.html, media on Steps 2, 4, 5, 6 and 9): teacher's checkers pass (`test_checker.py` 23/23); browser test 63/63 steps "sample verified, task completed" on Cloudflare's runtime (8787, Weeks 2–7 media uploaded); offline settings (3042) Week 7 Steps 1, 3, 7, 8 completed, Steps 2, 4, 5, 6, 9 marked done; new Week 7 personal subtest passes on both; no new CodeShare bug; [PR #92](https://github.com/SirNeo-Coder/JavaShare/pull/92) (merged). **Week 8 built** 2026-11-11 (`Resume/Week_08/`, module `dotnet-1-r08`, pseudo-classes and pseudo-elements, only styles.css and two classes on index.html change, media on Steps 1, 4, 5, 8 and 9): teacher's checkers pass (`test_checker.py` 23/23); browser test 72/72 steps "sample verified, task completed" on Cloudflare's runtime (8787, Weeks 2–8 media uploaded); offline settings (3042) Week 8 Steps 2, 3, 6, 7 completed, Steps 1, 4, 5, 8, 9 marked done; new Week 8 personal subtest passes on both; found CKB-107 (stale browser-test click after PR #93, fixed); [PR #96](https://github.com/SirNeo-Coder/JavaShare/pull/96), branch `docs/net-resume-week-08`. **Week 9 built** 2026-11-11 (`Resume/Week_09/`, module `dotnet-1-r09`, flexbox and media queries, only `styles.css` and one class on `projects.html` change, media on Steps 1, 3, 4, 5, 8 and 9, no new media file): teacher's checkers pass (`test_checker.py` 22/22, every sample and task answer byte-identical at 696–1000 px); browser test on offline settings (3072): Week 9 Steps 2, 6 and 7 completed, Steps 1, 3, 4, 5, 8 and 9 marked done (offline has no media storage), 14 pass / 6 skipped / 0 fail; new Week 9 personal subtest passes; found CKB-112 (the page runs at three widths, so a `max-width: 900px` query is on for module steps and off in a personal project; module text corrected, no app change); not run on Cloudflare's runtime this week; [PR #102](https://github.com/SirNeo-Coder/JavaShare/pull/102), branch `docs/net-resume-week-09`. Week 10 not started | teacher's `Resume/Week_0N/Verification.md`; [PR #83](https://github.com/SirNeo-Coder/JavaShare/pull/83) (merged); [PR #84](https://github.com/SirNeo-Coder/JavaShare/pull/84) (merged); [PR #86](https://github.com/SirNeo-Coder/JavaShare/pull/86), branch `docs/net-resume-week-03`; [PR #87](https://github.com/SirNeo-Coder/JavaShare/pull/87) (merged); [PR #88](https://github.com/SirNeo-Coder/JavaShare/pull/88) (merged); [PR #89](https://github.com/SirNeo-Coder/JavaShare/pull/89), branch `docs/net-resume-week-06` |
| Page window stays until a completed task is synced (CKB-087) | **Merged** 2026-10-30 | [PR #77](https://github.com/SirNeo-Coder/JavaShare/pull/77) |

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

- **Module media files live in Cloudflare R2, one shared copy per module** (teacher, 2026-10-29).
  The teacher uploads them once per module (shared by their classes in that subject); students'
  projects read that copy. Assistants prepare `wrangler.jsonc` and instructions; the teacher
  creates the bucket. Offline has no Cloudflare, so offline media waits for the offline task.
- **Students' own pictures, sound and video in personal projects are a separate later task**
  (teacher, 2026-10-29), like the offline work. Slice 3b covers only the teacher's module media.
- **Student media plan approved with the recommended choices** (teacher, 2026-10-29): online only,
  same R2 bucket, the student's own folder; 5 MB per file, **at most 10 per personal project**; media
  **carries forward** to the next week with the personal files.
- **Slice 3a approved with the recommended choice:** `webChecks` apply to the step's own sample
  (and legacy steps whose sample is the task), never to alteration tasks (`activity.id`). The page
  reports what each check found; the server compares with its stored checks.
- **Focus on the online version for now; offline work is a separate later task** (teacher,
  2026-10-29), like the module file revision. Offline-only building and offline testing beyond
  the existing tests wait for that task. AGENTS.md rule 1 still holds: offline must not break, so
  the existing offline tests keep running as a safety net.
- **Slice 2 plan approved with the recommended choices:** a web personal project is decided by the
  performance task's starter file endings; browser run evidence (files, success, page text) is
  accepted online and offline for the exact saved files; **Projects** says **Weekly web projects**
  with **W** icons for web modules (Java wording unchanged); **Add file** / **Rename file** in a web
  personal project also allow `.txt` backups. Teacher live help label/colouring fixed (CKB-078).
- **Revise Weeks 1–3 now, in a separate chat, before any new week** (teacher, 2026-10-29, after
  Slices 1–3 and student media were merged). Weeks 4–20 then follow the format section below.
- **Net MVC weeks follow the Java student workflow** (teacher, 2026-10-29, recommended option):
  `sampleFirst`, one meaningful alteration task (`activity.id`) per step, `previousModuleId` linking
  each week to the one before. First an app task proves (and fixes if needed) sample-first and
  alteration tasks for web steps in a real browser; Weeks 1–3 are then revised to this format.
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

## How Slice 3a works (map)

- `backend/src/module-activities.ts` — `WebCheck`, `WebCheckSeen`, `webCheckLines(checks, seen)`
  (one line per check; count / first match's attribute / computed style; `value` required),
  `webChecksPass`; `checkModuleRun` applies them to the step's own sample only.
- `app/webPreview.ts` — `buildPreview(files, entry, checks)`: the one-line capture script embeds
  the checks (`<` escaped) and adds `checks: checks.map(probe)` to the page message; `webRunResult`
  returns `checks`. `app/teacherWebPreview.ts` passes `checks` through.
- `app/WebStepRun.tsx` — `useWebPageRun().run(files, runPath, checks)`; `WebCheckList` takes
  `webChecks`, adds a line per check with "— found …" on a cross; Required/Your output only when
  the output line fails.
- `app/StudentModuleActivity.tsx` / `app/ModuleViewer.tsx` — pass `step.webChecks`; completion
  evidence and saved sample carry `checks`. `app/moduleDeviceStore.ts` — a restored sample must
  also pass its checks.
- `backend/src/routes.ts` — `progress/complete` evidence accepts optional `checks`;
  `backend/src/supabase-repository.ts` — refuses "This page does not pass its page checks yet".
- Evidence: `docs/verification/web-module-steps.md`, section "Slice 3a". No migration.

## How Slice 3b works (map)

- `wrangler.jsonc` — R2 binding `MODULE_MEDIA` → bucket `codeshare-module-media` (teacher creates it;
  `docs/cloudflare-setup.md`, "Module media files").
- `backend/src/file-paths.ts` — `mediaPathType` (images/|audio/|video/ + safe name + ending → type),
  `MEDIA_LIMIT` 5 MB. `backend/src/router.ts` — raw media body on the media upload route, `res.send`.
- `backend/src/supabase-repository.ts` — `mediaBucket()` (`getCloudflareContext`, null offline),
  key `<teacher>/<subject>/<module>/<path>`, list/read/put/delete, `moduleHasMedia`; completion of a
  media step needs uploaded media and `mediaLinesPass`. `backend/src/routes.ts` — the four routes.
- `backend/src/module-activities.ts` — `mediaCheckLines`, `mediaLinesPass`; `checkModuleRun`
  applies them to media steps (`teacherCheckedStep` = `Media checks:` in the expected output).
- `app/webPreview.ts` — `embedMedia` (data: URLs, `data-codeshare-src`), in-frame media test
  (decode; muted play), `webRunResult(…, includeMedia)`. `app/teacherWebPreview.ts` —
  `media-src data:`. `app/WebStepRun.tsx` — media lines; frame `allow="autoplay"` (CKB-079).
- `app/moduleMedia.ts` — `listModuleMedia`, `loadModuleMedia` (device cache by etag).
- `app/StudentModuleActivity.tsx` — loads media for media steps; teacher-checked until loaded.
  `app/ModuleViewer.tsx` — **Media files** section (`ModuleMediaFiles`), teacher Run with media.
- Evidence: `docs/verification/web-module-steps.md`, section "Slice 3b". No Supabase migration.

## How student media works (map)

- `backend/src/personal-performance.ts` — `PersonalMedia { path, id, size }`; `own.media`;
  `personalProjectFiles` returns `{ files, media }` from the same source (carry-forward).
- `backend/src/supabase-repository.ts` — `performance_task.project.media`; `putSupabasePersonalMedia`
  (new copy `students/<class>/<student>/<id>`, at most 10, refused upload deletes its copy),
  `deleteSupabasePersonalMedia`, `readSupabasePersonalMedia` (the student or their class teacher),
  `dropUnusedStudentMedia` (deletes a replaced/removed/resubmitted copy only when no project or
  submission of that student in that class names it). Each media change drops `successfulRun`;
  `saveSupabasePerformanceProject` and `recordSupabasePersonalRun` keep the list; submission copies it
  into `own.media`. Offline message: "Pictures, sound and video files are only available online".
- `backend/src/routes.ts` — `PUT`/`DELETE .../progress/performance-project/media/:folder/:name`,
  `GET /api/classrooms/:classroomId/students/:studentId/personal-media/:id`. `backend/src/router.ts` —
  raw body for the new upload path; every `send` adds `nosniff` and `Content-Security-Policy: sandbox`.
- `app/ModuleViewer.tsx` — `ModuleMediaFiles` now shared (`base`, `note`, `onChange` gets the reply).
- `app/moduleMedia.ts` — `loadPersonalMedia`: kept in the open tab only, never on the device.
- `app/StudentModuleActivity.tsx` — **Media files** box in a web personal project (not in review);
  student and review runs embed the media like module media. No migration.
- Evidence: `docs/verification/web-module-steps.md`, section "Students' own pictures, sound and video".

## Slice 3 notes (webChecks and mediaChecks)

- The teacher's checker defines the semantics (`check_web_steps.cjs`): `count` on a selector,
  `attribute` + `value`, `style` + `value` (computed style); media `loaded`/`broken` by decoding
  images and playing audio/video; with `includeMediaOutput` it appends
  `\nMedia checks:\n<src>: image decoded|image failed to decode|playback advanced|playback failed`.
- Media files are binaries kept outside the JSON. The preview is a `srcdoc` frame, so relative
  URLs like `images/snack.svg` cannot load, and the no-internet policy allows only `data:`/`blob:`
  pictures. Decided in Slice 3b: Cloudflare R2, one shared copy per module, embedded in the
  preview as `data:` URLs.
- `webChecks` are done (Slice 3a). Week 3 Steps 2–7 also have 6 `webChecks` each; since Slice 3b
  they apply once the module's media files are uploaded (until then the steps stay teacher-checked).
- Week 3 needs four media files shared by Steps 2–7: `images/snacks.svg`, `images/counter.svg`,
  `audio/chime.wav`, `video/canteen.webm` (about 190 KB, in the teacher's `Week_03/project_end`).
  Step 5 points at missing files on purpose (`images/snack.svg`, `audio/chime-missing.wav`,
  `video/canteen-missing.webm`) and expects them to fail. The JSON names the files but does not
  contain them.
- 3b: add each media result as a line in `WebCheckList` (the checker's media rule: every
  `img`/`audio`/`video` must load unless `mediaChecks` lists it `broken`), and decide where media
  files live first. Done in 3b; the preview policy now allows `media-src data:`.

## Weeks 1–3 revision (done 2026-10-29)

Teacher's files only; no app code changed. Approved by the teacher (2026-10-29), besides the format section:

- **Task pages after page 8** instead of squeezing Your task boxes into 8 pages (Week 3's full outputs need
  about two more pages). Pages 1–8 stay as they were (Week 1 pages 1–6 patched for the line break); task
  pages print double-sided, long edge. Week 1 has 9 pages, Weeks 2–3 have 10.
- Week 1 Step 2's task changes both the title and the body; Week 2 Step 5's task (Water into its own `li`
  plus Rice cake) is accepted although only Rice cake shows in the output; Week 3 Step 1's task has no
  media (stays checked automatically offline); Week 3 Step 5's task **diagnoses** instead of repairing (CKB-084).
- No student takes .NET yet (offered next year), so new task ids reset nobody; the teacher uploads Weeks 1–3
  only after every slice of the workflow is finished.

What changed in the teacher's folder:

- JSON (all three weeks): `"sampleFirst": true`; `activity` on every step (`<step id>-alter-v1`, instruction,
  `"files": []`, expected output from a real run); `previousModuleId` Week 2 → `dotnet-1-w01`, Week 3 →
  `dotnet-1-w02`. Week 1's 8 sample outputs got the line break (CKB-074). Week 3's personal task text has the
  student media rules. CodeShare's upload schema (`course-module-schema.ts`) accepts all three.
- Printed modules: practice-task pages built from the JSON (`source/p9.html`, `p10.html`, `tasks.css`) by
  `revision_tools/build_tasks.py`; Week 1 pp. 1–6 patched by `revision_tools/patch_week1.py` (Weeks 1–2 module
  page HTML no longer exists; the patch is pixel-identical outside the changed lines).
- DLLs: one **Sample, then your task:** paragraph per day in Student Activity; the red "ADJUST THIS…" line
  removed from Learning Resources and moved into the playbook (teacher, 2026-10-29); still 6 pages.
- Answers in `<week folder>/solutions/<step id>/`; originals in `before_revision/`; handover and course map
  updated; `bash revision_tools/run_checks.sh` re-runs every check.

Evidence: the teacher's `check_codeshare.py --run` passes all samples and all 22 answers; each unchanged
sample fails its task output (22/22), and the old one-line Week 1 outputs fail (8/8); checker suites 7 + 10 + 7
pass; printed boxes match the JSON. Not done here: `tests/web-module-steps.browser.mjs` (needs PR #72 merged).

## Revision notes (for the deferred module revision)

Done in the Weeks 1–3 revision (above), except the CodeShare re-run (needs PR #72) and the teacher's re-upload.

Collect here anything the module JSON, DLL or printed module must change because of this
feature. Add to it during Slices 2–3; the revision prompt is written from this list at the end.

- Weeks 1–3 to the Java student workflow (see the format section): `sampleFirst`, one meaningful
  task per step with its answer files in `solutions/`, `previousModuleId` (Week 2 → 1, Week 3 → 2);
  each printed step gets a **Your task** box with its expected output, like the Java modules.
- Week 1: all 8 expected outputs need a line break after `Visible page text:` (JSON and the
  printed PDF `DotNet1_HTML_Foundations_Module.pdf`).
- Weeks 2–3: re-upload after deploying so `webChecks`/`mediaChecks` are kept (see "Status").
- Weeks 1–3 have no `previousModuleId`, so each week's personal project starts from that week's
  own starter instead of carrying the student's previous week forward (and no week requires the
  one before). Add the links if carry-forward is wanted.
- Week 3's personal checklist asks students to store pictures, sound and video in the project;
  online they now can (**Media files** in the personal project); offline still text only.
- Week 3 module text and JSON (personal task): tell students their own media file names may use
  only letters, numbers, `-` and `_` (no spaces), at most 5 MB each and 10 per project, added under
  **Media files**, online only for now. Media steps are checked automatically online once the teacher
  has added the module's media files; offline the teacher presses **Mark done**.
- `DotNet1_Handover.md` and the course map's "Checks and decisions to retain" still say CodeShare
  import, offline preview and binary media are unverified; update them to what is now verified
  (web steps online and offline; media online only) and what is not (offline media).
- After the revision, remove the "Week 1 note" from `docs/course-format.md` ("Web module steps").
- After the revision, re-run every step's sample through `tests/web-module-steps.browser.mjs`
  and report one line per step.

## Net MVC weekly modules: required format and workflow

Every Net MVC week (Weeks 1–10 of the teacher's 10-week resume map, 2026-10-30) follows this. The detailed JSON rules
are in `docs/course-format.md` ("Web module steps"); if this list and that page disagree, the code
wins, then fix both.

**Authorities, in the teacher's folder** `/home/ireneo/Documents/Java 2026/Net Files/` (not in git;
never edit without the teacher's approval):

- `Computer-Programming-.NET-Technology.pdf` — the only source of competencies and standards.
- `DotNet1_Course_Map.md` — each week's topic, competencies, day-by-day plan, project addition and
  Friday task. The day split and hours are already approved there; do not ask again.
- `ILAW_DLL_and_Module_Playbook.md` — DLL and 8-page module format (§3, §4), references rule (§2.1),
  final checklist (§7), CodeShare copy (§8). Its Java content and commands do not apply.
- `DotNet1_Handover.md` — state of the course, IDs, teacher facts; update it after each week.

**Fixed facts:** Ireneo D. Seraspe Jr., Cielito Zamora Senior High School, .NET 1, Term 3,
SY 2026–2027; dates, grade and sections stay blank. Two hours Monday–Friday. Monday opens the whole
topic; Friday is performance task and presentation only. Ten weeks, all about resumes (teacher,
2026-10-30): module samples build a resume for the made-up Juan Dela Cruz; each student builds their
own resume as the personal performance task (safe details only). All student work is done inside
CodeShare: never VS Code, Chrome file opening or local folders (CKB-085). No internet, CDN, account or
download in class. No C#, ASP.NET or databases.

**Files per week** (resume course, teacher 2026-10-30: every week in `Resume/Week_NN/` inside the teacher's
folder; the old canteen files in the folder root and `Week_02/`–`Week_04/` are retired and left untouched):
`DotNet1_ILAW_Week_NN.docx` (DLL), `DotNet1_<Topic>_Module.pdf` (8 lesson pages plus practice-task pages after
page 8, 8.5 × 13 in = 612 × 936 pt; print pp. 1–6 double-sided long-edge, pp. 7–8 single-sided, task pages
double-sided long-edge; build the task pages with `revision_tools/build_tasks.py`), `DotNet1_Week_NN.codeshare.json` (made
last, from the final module), `project_start/` (= last week's `project_end/`), `project_end/`,
`source/` (module page HTML), the checkers, `Verification.md`. `Resume/project/` matches the latest
`project_end/`. Before changing an existing file, copy it to `<week folder>/before_revision/`.

**IDs** (never change one already used): course `dotnet-1`; module `dotnet-1-rNN`; lessons
`dotnet-1-rNN-dD`; steps `dotnet-1-rNN-dD-sS` (S counts across the week); slips `dotnet-1-rNN-dD-slip`;
task `dotnet-1-rNN-pt`. The retired canteen weeks used `dotnet-1-w01`…`w03`; never reuse them (teacher,
2026-10-30). Before the first upload, the teacher removes the old Weeks 1–3 under **Curriculum**.

**CodeShare JSON rules for a web week:**

- A step's `files` include its run page and every file that page needs (linked `.css`/`.js`, a framed page), even when
  unchanged (CodeRabbit on PR #86): **View module details** runs only the step's own files, and a student's project keeps
  files from the previous task, so a sample that leaves out its run page could never be verified.
- Every step's `files` are `.html`, `.css` or `.js` (folders allowed; names use letters, numbers, `-`,
  `_`). Module `.txt` starter files are reference only. `run` is `index.html` (page text) or a `.js`
  file (console lines).
- Page-text `expectedOutput` is exactly `Tab title: <title>`, a line break, `Visible page text:`, a
  line break, then the page's visible text with blank lines removed. Spaces count. Take it from a real
  run (the teacher's `check_web_steps.cjs` or CodeShare), never type it by hand: CSS changes visible
  text (`display: none` hides it, `text-transform` changes its letters).
- A `.js` step's `expectedOutput` is its `console.log` lines. Any uncaught error fails a run;
  `expectedError` and Program input do not apply to web steps.
- `webChecks` (`count`, `attribute` + `value`, `style` + `value`) check the step's own sample. Use them
  for what page text cannot show (structure, attributes, computed styles).
- Media steps: the expected output has a `Media checks:` section; `includeMediaOutput: true`;
  `mediaChecks` lists files that are meant to be broken. The JSON names the files but does not contain
  them; the teacher adds them under **View module details → Media files** (`images/`, `audio/`,
  `video/`, at most 5 MB each). Offline, media steps need the teacher's **Mark done**.
- Performance task: `starterFiles` all web files gives a web personal project. Students may add their
  own pictures, sound and video there online (5 MB each, at most 10, safe names); not offline yet.
- **Student workflow, like Java** (teacher, 2026-10-29): the module has `"sampleFirst": true`; every
  step has an `activity` with a new stable `id` (pattern `dotnet-1-rNN-dD-sS-alter-v1`, as in the Java weeks; a changed task gets `-v2`), an `instruction`
  (one small change that exercises the lesson: add a list item, a table row, a heading, a media
  description, a console line — never only renaming a label), and the complete changed
  `expectedOutput`. The student runs the unchanged sample first (**Sample verified**), then makes the
  change; a matching run gives **Completed** and opens the next step. Task runs are checked by output
  only (page checks apply to the sample), so the change must show in the page text or console lines.
  On a media step the task output keeps its `Media checks:` lines, and a task must not repair or remove a
  file listed in its step's `mediaChecks` (they apply to the task too; CKB-084).
- **Task answers**: keep each task's answer files in `<week folder>/solutions/<step id>/` (never in the
  JSON; students must not see them). Every task `expectedOutput` comes from running those files.
- **`previousModuleId`**: every week except Week 1 names the week before (`dotnet-1-r01` …). The module
  and personal projects carry forward, and a student must finish every task of the previous week
  before the next week opens.
- The printed module and the JSON must say the same thing, with identical code and outputs.
- A repair task must change the page text (teacher, 2026-11-09; CodeRabbit on PR #87): tasks are checked by page text
  only, so a repair whose only effect is a colour, font or gradient could be skipped while added words still pass. Pick a
  mistake whose repair also brings back visible words (a missing `)` that stops a later `text-transform`, a missing `;`
  that also skips one).

**What the page preview can and cannot do** (check before writing a week; if a week needs something
it cannot do, stop and propose an app change for approval first):

- Can: one page with its local `.css` and `.js` files (linked with `<link rel="stylesheet">` and
  `<script src>`), console output, uploaded pictures, sound and video in `img`/`audio`/`video`/`source`;
  since 2026-10-30 (CKB-086) links to the project's other `.html` pages (shown in the same page window)
  and `<iframe src="page.html">` of a project page. Checks still read the step's run file only.
- Cannot yet: page-check (`webChecks`) the `src` of a media file the teacher uploads (it is embedded as `data:`; CKB-092,
  app fix proposed; its media line names the `src` instead), load pictures or fonts named in CSS `url()` (backgrounds, `@font-face`), send a form
  anywhere (a form can be shown and typed in; Week 3's contact form "sends nowhere"), a frame inside a
  framed page, anything from the internet. Only Chromium was tested.
- Checked for Resume Week 3 (2026-11-06; `docs/course-format.md`, "Links, frames and forms in page text"): a
  framed page's text is not page text; an iframe `src` page check reads nothing in CodeShare (`srcdoc`); typed
  values, placeholders and `textarea` text are not page text, labels, button words and `option`s are. A missing
  quote before an iframe pastes the framed page into the page in CodeShare (CKB-093, open): samples avoid it. Not
  checked: same-page links (`href="#id"`) inside the page window.
- Checked for Resume Week 4 (2026-11-08; `docs/course-format.md`, "CSS in page text and page checks"): computed colours,
  fonts and sizes are the same in CodeShare and the teacher's checker; `text-transform`, `display: none` and
  `visibility: hidden` change page text (`text-transform` on `option`s does not). CodeShare turns the link line into a
  `style` element, so `link`/`style` counts differ: never page-check them. A wrong or missing stylesheet leaves the page
  plain in both. An `href` without quotes is not inlined in CodeShare (CKB-094, open): samples quote every value. Which
  rule wins and how a missing semicolon, colon or brace or a misspelt class or id come out are the same in both (a missing
  `}` after an `@media` block keeps later rules inside it). CodeShare finds a linked stylesheet from the project's top
  folder, not the page's folder, and drops a `media` condition on the link (CKB-095, open, latent): keep pages and
  stylesheets in the top folder, no `media` on a link line.
- Checked for Resume Week 5 (2026-11-09; `docs/course-format.md`, "Text, font, colour, gradient and opacity"): font
  lists, sizes (em, rem and unitless line-height read in px), colours (read as `rgb()`), `background-image` gradients and
  `opacity` read the same computed values in both; linear and radial gradients show in the page window. Text at
  `opacity: 0` or in a `transparent` colour stays in the page text. A missing comma, `to rigth` or a colour without `#`
  drops one declaration; a missing `)` in a gradient stops every later rule.
- Checked for Resume Week 6 (2026-11-09; `docs/course-format.md`, "Box model, lists and links"): padding, borders, margins,
  `box-sizing`, list markers and link colours read the same computed values in CodeShare's page window and the teacher's
  checker, in px, except border widths: the page window follows the app's text-size zoom (1.15 at first), so a 2px border
  reads 1.73913px in CodeShare (CKB-097, open): check a border's style and colour, never its width. `width` reads the set value
  with or without `border-box`, so check `box-sizing`. `%` widths and `auto` margins follow the window (the page window is
  not 1000 px wide): never page-check them. A list nav shows one link per line until `display: inline`/`inline-block`;
  `li` tags with no space between them run the words together. Link states (`:visited`, `:hover`, `:focus`, `:active`)
  are never page-checked (`:visited` is hidden, a check has no mouse, and `a:hover` makes the teacher's checker wait 30 s).
- Checked for Resume Week 7 (2026-11-10; `docs/course-format.md`, "Position, z-index, float and galleries"): position, px offsets,
  z-index, float and clear read the same computed values in CodeShare's zoomed page window and the teacher's checker; offsets and
  z-index read as written even on a static box. `position: absolute`, `fixed` and `float` put a box's words on their own line in the
  page text; `relative` and `sticky` do not. Unset sides, `fixed` offsets and `sticky` places follow the window: never page-check
  them. `figcaption` is page text, `alt` is not; `inline-block` figures leave a line holding only a space, so galleries float. In
  today's Chromium a missing `}` nests the later rules inside the broken one. `position: sticky` works in the page window (it scrolls
  inside its frame); a later positioned box slides over a sticky nav without a `z-index`.
- Checked for Resume Week 8 (2026-11-11; `docs/course-format.md`, "Pseudo-classes and pseudo-elements"): structural pseudo-classes
  (`:first-child`, `:last-child`, `:nth-child()`, `:not()`, `:first-of-type`) and form states (`:required`, `:invalid`,
  `:placeholder-shown`, `option:checked`) read the same counts and computed styles in CodeShare's zoomed page window and the teacher's
  checker; `:hover`, `:focus` and `:focus-visible` match nothing in a check, and a check cannot pick a pseudo-element. Text from
  `::before`/`::after` is not page text; `text-transform` on `::first-letter` is; text from `::before` becomes the first letter.
  `::first-line` gives different page text in the two (the first line wraps at a different width): never use it. A misspelt
  pseudo-class or pseudo-element, one bad selector in a comma list or a space before the colon drops or empties the rule; one colon
  (`:before`) still works. In a personal run the pseudo-element is drawn online and offline.

**Each week, in order:**

1. Read the authorities, the previous week's `Verification.md` and this section. Ask only questions
   whose answers change the files (playbook §0.2), then propose and wait for the teacher's approval.
2. Build `project_start/` from the previous `project_end/`, then the week's project changes.
3. DLL from the previous week's DLL (playbook §3): five verified references per day (open every
   link), reflections blank, no previous-week text left, and no red "ADJUST THIS ACCORDING TO YOUR
   AVAILABLE MATERIALS" line (teacher, 2026-10-29: the reminder lives in the playbook, §1, not in the DLL).
4. Module (playbook §4): run every printed example; render and inspect all 8 pages.
5. JSON last. Check it with the teacher's `check_codeshare.py --run --media-root project_end` and
   `check_web_steps.cjs`, then with CodeShare's `tests/web-module-steps.browser.mjs` on Cloudflare's
   runtime (8787) and offline settings (3042), one line per step. It reads every built `Resume/Week_NN/` week; its media
   subtest uploads each built week's media before the student walk; personal-project subtests cover Weeks 2–8
   (2026-11-11). A new week's own subtest is a test change that needs approval.
6. Write `Verification.md`; update `DotNet1_Handover.md`, the root `project/`, this handoff;
   commit and push the repository docs on a new branch with a PR.
7. Teacher: upload the JSON under **Curriculum** (same ids keep student progress); for a media
   week, add its files under **Media files**.

- Checked for Resume Week 9 (2026-11-11; `docs/course-format.md`, "Flexbox and media queries"; CKB-112): computed `display`,
  `flex-direction`, `flex-wrap`, `row-gap` and `column-gap` agree in CodeShare's page window and the teacher's checker.
  Flexbox changes the page text only where it changes whether a child is a box of its own: a column of block-level items
  (`li`, `p`) reads exactly as before, `display: flex` on a `nav ul` whose `li` were `inline-block` turns one line of links
  into one per link, and `display: inline` on list items with no flex container runs them onto one line. `gap` is never page
  text and does nothing without `display: flex`; `float` on a flex item still computes to `left` but has no effect, so a flex
  row needs no `clear: both`. **The page runs at three widths:** a module step's page sits beside its web-checks panel and is
  narrower than 900 px, a personal project's page fills the page window and is wider, and the checker is 1000 px — so a
  `max-width: 900px` query is on for the module steps and off in a personal project until the browser window is made narrower
  (the page window cannot be dragged, but follows the browser window). A checked page must keep its page text and every
  checked value identical at every width, so nothing inside a query may add, remove or re-letter a word and no check may read
  a property a query changes. `(max-width: 900)` without its unit drops the whole query at every width.
## Hosted check after deploy (teacher)

Assistants never deploy or change hosted settings. PR #62 is merged into `main`; once Cloudflare has
built `main` (see `docs/cloudflare-setup.md`):

1. Sign in on the hosted site as the teacher. Open the Net MVC class → **Curriculum** and upload
   `DotNet1_Week_02.codeshare.json` and `DotNet1_Week_03.codeshare.json` again (same ids, student
   progress kept; this keeps their `webChecks`/`mediaChecks`).
2. **View module details** on Week 2 and press **Run** on each step: every step shows
   **✓ Page text matches**. Week 1 still shows crosses; that is expected until the deferred module
   revision.
3. With a test student account (not a real student): Week 2 Step 1 → **Work in code editor** →
   **▶ Run code** → **Completed**. Optional, longer: finish all 7 steps, then **Projects** shows
   **Weekly web projects** → **Personal performance-task project** → **▶ Run code** → **Run succeeded —
   ready to submit this version.** → **Submit this version** → **Submitted**, 100%.
4. As the teacher: **Students** → the test student → Week 2 shows the same percentage; if submitted,
   **Review personal submission** → **▶ Run code** shows the page.
5. In Cloudflare, **codeshare** → **Logs** (**Observability**): look for `exceededCpu` or 503 on
   `progress/complete`, `progress/performance-project`, `progress/personal-result` or
   `progress/performance-task`. If any appear, keep one cleaned example per route (status, outcome,
   CPU and total time; no cookies, keys or student information) and give it to the assistant
   (CKB-065 steps).

## Testing recipe (local only)

- Local Supabase in Docker must be running (`npx supabase status`).
- Offline-settings production server: build with `npm run build:all`, then run `next start -p
  <port>` with `NODE_ENV=production`, `DATABASE_MODE=supabase-local`, `SUPABASE_URL`,
  `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` from
  `npx supabase status -o env` (`API_URL`, `ANON_KEY`, `SERVICE_ROLE_KEY`, `JWT_SECRET`), any local
  `JWT_SECRET`, `LOCAL_JAVA_EXECUTION=true`, `CODESHARE_LAPTOP=true`, empty `JAVA_RUNNER_URL`.
  In Claude Code start it through `.claude/launch.json` (`preview_start`), not a shell command.
- Online settings: same server with `LOCAL_JAVA_EXECUTION=false`, no `CODESHARE_LAPTOP`,
  `JAVA_RUNNER_URL=http://localhost:3034` (port 3043 used). Cloudflare's runtime: `npx
  opennextjs-cloudflare build`, then `npx opennextjs-cloudflare preview` (port 8787; settings from
  the git-ignored `.dev.vars`, which points at local Supabase and has `JAVA_RUNNER_URL`). The
  Cloudflare build rewrites `.next`; stop other local servers first and rebuild before reusing them.
- Ports the browser tests expect: `tests/web-module-steps.browser.mjs` → `WEB_STEPS_BASE_URL`
  (default `http://localhost:3042`; works with 3043 and 8787 too); `module-resume` / `module-sample-first` offline → 3022.
- Browser tests need `CODESHARE_PLAYWRIGHT_MODULE` (on this laptop
  `/home/ireneo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`)
  and `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
  (`/home/ireneo/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome`). The web steps test
  reads the teacher's Resume weeks from `DOTNET_WEEKS_DIR` (default `.../Net Files/Resume`, every
  `Week_NN/DotNet1_Week_NN.codeshare.json` from Week 1 until the first missing week) and skips if there are none.
- Sample-first weeks: `tests/web-sample-first.browser.mjs` (two linked practice weeks; no teacher files
  needed) and the sample-first branch of `tests/web-module-steps.browser.mjs`, which walks every step of
  every built Resume week with the answers in each week's `solutions/<step id>/` (skips, naming the
  steps, if an answer is missing). Old-format-only subtests skip when the weeks are sample-first.
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

- The browser pane allows 5 preview servers per folder; another chat's leftover servers block new ones
  (ask the teacher to have them stopped).
- After the teacher presses **Mark done**, the student's open page shows the next step only after
  reopening the module (tests reload the module there).
- Since CKB-080's fix, **Run** on a media step stays off (**Loading media…**) until the media are loaded;
  tests just wait for **Run** to come on.
- The worksheet drawer can cover the editor's file tabs; tests click the tab directly.
- The open editor may be a CSS editor (a Week 4 task ends in `styles.css`), so test helpers find the editor by
  `.student-module-project .editor-card textarea`, not by the "HTML source code editor" name.
- Since PR #93 the worksheet's step tabs fold away while the worksheet scrolls down; tests click them with
  `dispatchEvent("click")` (CKB-107).
- Run `revision_tools/build_tasks.py` with the week's key only (`build_tasks.py r04`): with no key it rebuilds every
  week's task pages, including the retired canteen weeks, whose sources then no longer match their printed PDFs
  (happened 2026-11-08; restored with the original generator from `revision_tools/before_revision/`).

## Known limits and open questions

- CKB-084 (open, design limit): a step's `mediaChecks` also apply to its task, so a task cannot repair a
  file its sample shows broken. Worked around in Week 3 Step 5's content.

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
- Slices 1–2 passed in online settings on `next start` and on Cloudflare's runtime on this laptop
  (each 11/11, 2026-10-29); the teacher reports the hosted checks done, with no `exceededCpu`
  in Cloudflare Logs after the Slice 3b check (2026-10-29).
- CKB-022 remains open for the student's own **New web project** preview.
- CKB-097 (open): the page window is drawn inside the app's text-size zoom (`--ui-scale`, 1.15 at first), so a border's
  computed width reads less than written (2px → 1.73913px) and differs from the teacher's checker. Worked around in Week 6's
  content (no border-width page checks). Tests that click inside the page window should use `dispatchEvent("click")` for
  elements far from its top-left corner: Playwright's click position is off inside the zoomed screen.
- CKB-094 (open): a link line whose `href` has no quotes gets no stylesheet in CodeShare, although a browser loads it.
  Worked around in Week 4's content and module text (keep the quotes).
- CKB-080 (fixed on `fix/media-run-before-loaded`): the teacher's **Run** on a media step pressed before the media finish loading showed a
  cross; the Week 3 media browser subtest fails about 1 run in 2 because of it (also on `main`).
- Student media: a phone photo name with spaces is refused (letters, numbers, `-`, `_` only); the
  student must rename it. Not checked on screen offline. Hosted CPU of the upload route unproven.
- PR #60's (merged) open question (a second device may show the next part locked for up to five minutes)
  is probably covered by CKB-076's refetch rule; not tested with two devices.

## Next step

1. **Weeks 1–9 of the resume course are built** (Weeks 1–2 2026-11-06; Weeks 3–4 2026-11-08; Weeks 5–6 2026-11-09; Week 7 2026-11-10;
   Weeks 8–9 2026-11-11). Teacher: print them; in CodeShare **Curriculum** remove the old Weeks 1–3 (`dotnet-1-w01`…`w03`) the first time,
   upload `Resume/Week_01/…` to `Resume/Week_09/DotNet1_Week_09.codeshare.json`, then for Weeks 2–6 → **View module details → Media
   files** → add the three files in that week's `project_end/` (`images/`, `audio/`, `video/`; each module keeps its own copy), and for
   Weeks 7, 8 and 9 the seven files in that week's `project_end/` (Juan's picture, sound, video and four gallery pictures;
   Week 9 adds no new media file).
2. **CKB-092 app fix (needs approval)**: page checks read `data-codeshare-src` for `src` on embedded media, so a `src` check
   works online too. Until then, weeks avoid `src` page checks on uploaded files.
3. **CKB-093 app fix (needs approval)**: rewrite iframes only where the browser sees a real iframe. Until then, samples keep
   no broken quote before an iframe.
3a. **CKB-094 app fix (needs approval)**: accept an unquoted `href`/`src` when inlining project files. Until then, every
   value in a sample is quoted and the module tells students to keep the quotes.
3b. **CKB-095 app fix (needs approval)**: resolve a linked stylesheet from the page's own folder and keep its `media`
   condition. Until then, pages and stylesheets stay in the top folder and no link line has `media`.
3c. **CKB-097 app fix (needs approval, teacher chooses)**: draw the page window at 100% whatever the text size, or compare border
   widths with a tolerance. Until then, weeks never page-check a border width.
4. **Week 10**, the last week: the teacher pastes the "Rolling weekly prompt" (below, now Week 10) into a new chat. That chat
   writes no new prompt; it records that the course is complete.
   Week 10 is built as planned; the teacher checks it in CodeShare when reached.
6. **Hosted check of student media (teacher)**, PR #68 (see "Hosted check after deploy").
7. **Offline web steps/media** stays a separate task (needed before media weeks are taught offline).

## Rolling weekly prompt

The teacher pastes this into a new chat for the next week. Each week's chat replaces it with the next week's
prompt as its last step (teacher, 2026-10-29). Rewritten for the 10-week resume map and approved by the
teacher on 2026-10-30. Current: **Week 10**, the last week (written by the Week 9 chat, 2026-11-11).

```text
Use caveman mode and ponytail (minimal, laziest working solution) for this whole chat.

You are working in the CodeShare repository (formerly JavaShare) at /home/ireneo/Documents/GitHub/JavaShare.

Task: build .NET 1 Week 10, "Responsive resume (RWD layouts)" (DLL, printed module, CodeShare JSON), in my
folder /home/ireneo/Documents/Java 2026/Net Files/Resume/Week_10/. Only this week.

Before anything:
1. Read AGENTS.md and follow it exactly (knowledge-first workflow, approval before changes, plain English,
   test reporting rules, CodeRabbit review comments). Its "Net MVC course (agreed 2026-10-30)", "Page window" and
   "Module media" rules apply.
2. Read docs/handoffs/web-module-steps.md in full. Follow "Net MVC weekly modules: required format and
   workflow". Its teacher decisions are approved; do not ask about them again. The old canteen weeks (folder
   root, Week_02/, Week_03/, Week_04/) are retired: use them as format examples only, never their content.
3. Read in my folder: DotNet1_Course_Map.md (Week 10 section, "Running project and performance task",
   "Delivery inside CodeShare"), DotNet1_Handover.md, ILAW_DLL_and_Module_Playbook.md (sections 1, 2.1, 3, 4,
   7, 8; its Java content does not apply), Resume/Week_09/Verification.md (format only), and revision_tools/ (reuse
   resume_w01/build.py (it builds any Resume week: build.py r10; a step may list several files and name its run page;
   an output a style leaves unchanged prints as "the same as Step N's output"; STANDARDS in content.py fills the DLL's
   guide Quarter 2 standards; SAME_NOTE sets the "same as" wording), resume_w09/content.py as the template for resume_w10/
   (it also computes contrast for text, outlines and borders), resume_w02/make_media.py and resume_w07/make_gallery.py (how Juan's media and
   gallery pictures were made), build_tasks.py (always run it with the week key: build_tasks.py r10; without a key it rebuilds every
   week, including the retired weeks; a task page may hold no task boxes; Weeks 7–9 needed five task pages, p9–p13, and a smaller
   output font (body class r7, and r9 again for Week 9, whose nav splits into three lines) because the long index.html
   outputs did not fit; the chart and starter stylesheet print in two
   columns; Week 8's EXTRA_CSS keeps a code label with its code across a column break; watch each page's reported spare
   room and trim prose until every page clears its footer), tasks.py, consistency.py,
   render_r01.sh (WEEK=10), run_checks.sh and the Resume/Week_09 checkers; extend them
   instead of writing new ones).
4. Another session may be working in the main repository folder with uncommitted changes. Never commit, stash,
   discard or build on them. Use a separate git worktree from origin/main for any repository change. Pick free
   ports.
5. I merge pull requests quickly. Before every push to a PR branch, check the PR is still open
   (gh pr view N --json state). If it is already merged, put the new commits on a new branch and open a new PR
   against main.

Week rules (check each against the real files first):
- Resume theme: module samples build the resume of Juan Dela Cruz, a made-up student (every detail
  invented). The personal performance task is the student's own resume; Week 10 finishes it as a complete, responsive site and
  presents it. No home address,
  phone number, birth date, ID numbers or personal social-media accounts; no other people in any picture.
- Everything happens inside CodeShare (CKB-085): never tell students to use VS Code, Chrome, Ctrl+O,
  File > Open Folder, local folders or folder copies. Before handing over, search the DLL, module and JSON for
  "VS Code", "Visual Studio", "Chrome", "Ctrl+O" and "folder", and fix every hit.
- Pictures, sound and video for Juan are made-up files created on this laptop (drawn SVG, generated sound and
  video); never a real person's photo, never downloaded. Week 2's are in Resume/Week_02/project_end/ (Weeks 3–9 reused
  them); Juan's four gallery pictures (Week 7, index.html) are in Resume/Week_07/project_end/images/ (Weeks 8–9 reused
  them, and Week 9 added no new media file of its own).
- Week_10/project_start/ = Week_09/project_end/; Resume/project/ matches Week_10/project_end/ at the end.
- JSON: "sampleFirst": true, "previousModuleId": "dotnet-1-r09". IDs: course dotnet-1, module dotnet-1-r10,
  lessons dotnet-1-r10-dD, steps dotnet-1-r10-dD-sS (S counts across the week), slips dotnet-1-r10-dD-slip,
  task dotnet-1-r10-pt. Every step has one meaningful task (activity id "<step id>-alter-v1", instruction,
  "files": [], complete expectedOutput) that changes the visible page text or console lines. Answers in
  Week_10/solutions/<step id>/, never in the JSON. Every expected output from a real run. A task never repairs
  a file listed in its step's mediaChecks (CKB-084).
- Juan's site has three pages and one stylesheet (index.html, projects.html, contact.html, styles.css; projects.html
  shows contact.html in an iframe; the contact form sends nowhere; since Week 6 the nav on every page is a ul of links,
  each li on its own line; since Week 7 the nav is sticky with z-index 2, projects.html's h1 holds an absolute ribbon, and
  index.html has Juan's floated picture and a floated gallery of four captioned pictures, one with a positioned tag; since Week 8 skills get hover and a ✓ from ::before, the first skill is bold capitals,
  badges get a capital first letter from ::first-letter, the form has :required and :focus styles, links a :focus-visible
  outline, the goals list (class="goals") odd items maroon, the motto (class="motto") quotation marks and projects.html a
  drop cap from h1 + p::first-letter; since Week 9 the skills, the project cards (class="project-list" on projects.html), the
  gallery, the nav bar and the contact form are flex containers with gap, the gallery's float is gone, and two
  @media (max-width: 900px) queries stack the nav and turn the card column into a wrapping row). Each step lists its run page and every file that
  page needs (its linked styles.css, a framed page), even when unchanged, plus any file it adds or changes, and names its
  run page ("run"); checks read the run page only (teacher, 2026-11-06 and 2026-11-08; CodeRabbit on PR #86). The
  printed module still shows only new or changed lines. Every attribute value is in quotes: CodeShare does not apply a
  stylesheet whose href has no quotes (CKB-094). Keep every page and styles.css in the project's top folder and put no
  media attribute on a link line: CodeShare finds a stylesheet from the top folder and drops its media condition
  (CKB-095).
- Printed module: 8 lesson pages, then task pages after page 8 built with revision_tools/build_tasks.py r10.
  Printed module and JSON identical in code and outputs (revision_tools/consistency.py checks it). Once a file is
  long, print it whole once and only the new or changed lines for later steps, each block labelled with the file and
  where it goes (as in Weeks 1–9). When the outputs no longer fit (teacher, 2026-11-06, as in Weeks 2–9), the lesson
  pages print only the output lines a step changes, with their line numbers (OUTPUT_BASE in content.py), and the task
  pages keep every complete task output. A tab between table cells prints as → (the JSON keeps the tab).
- DLL: Resume/Week_09's DLL is the format template (no Week 9 text left): five opened references per day, a
  "Sample, then your task:" line in each Student Activity, no red ADJUST THIS line, the guide Quarter 2 standards.
- Friday is performance task day (teacher, 2026-11-06): at most one Friday step, Juan's finished page for the
  presentation, no new HTML or CSS.
- A repair task must change the page text (teacher, 2026-11-09; CodeRabbit on PR #87): tasks are checked by page text
  only, so pick mistakes whose repair also brings back visible words (for example a missing ; or ) that also stops a
  later text-transform).
- If the week needs something the CodeShare preview cannot do (handoff, "What the page preview can and cannot
  do"), stop and propose an app change first.
- Never change an ID that is already used. Never reuse the old dotnet-1-w01…w03 IDs.


This week's checks:
- Media: ask me first whether the step samples keep Week 2's pictures, sound and video and Juan's Week 7 gallery (all on
  index.html; then every step that runs index.html is a media step: expectedOutput ends with a Media checks: section (the
  heading, then one result line per picture, sound and video), "includeMediaOutput": true, the media files go in
  Week_10/project_end and I add them under View module details → Media files; offline I press Mark done) or leave them out
  (then the steps are checked automatically online and offline). Weeks 4–9 kept them; Week 9 ran index.html on six steps.
  Put src on img, audio and video themselves, and never page-check (webChecks) the src of an uploaded file (online it becomes
  data:, CKB-092) or of an iframe (srcdoc, CKB-086).
- Real runs in the real page window (Weeks 6–8, keep): CodeShare draws the page window inside its text-size zoom (1.15 at
  first, 1 to 1.45) and it is not my checker's 1000 × 900 window, so check every computed value both in my checker and in
  CodeShare's buildTeacherPreview inside a body with zoom 1.15 in a frame about 800 px wide, before using it. Never
  page-check a border or outline width (CKB-097), a % width, an auto margin, a side that is not set, a fixed offset or a
  sticky place. Inside the zoomed page window Playwright clicks land in the wrong place; tests use dispatchEvent("click").
- Widths (Week 9 settled this; read CKB-112 first): the page runs at three different widths, so never assume one. A module
  step's page sits beside its web-checks panel and is narrower than 900 px; a personal project has no checks panel, so its
  page fills the page window (width: min(1180px, 100%)) and is wider; my checker is 1000 px. A max-width: 900px query is
  therefore on for the module steps and off in a personal project until the browser window is made narrower. The page window
  cannot be dragged, but it follows the browser window. This matters more in Week 10 than in any other week, because every
  layout is width-dependent. Keep every sample's and task's page text and every page-checked value identical at every width
  (Week 9's test_checker.py runs every output at 760, 800, 899 and 1000 px: do the same), never put anything inside a media
  query that adds, removes or re-letters a word, and never page-check a property a query changes (Week 9 checks display and
  flex-wrap, never flex-direction, on the queried nav ul and .project-list). A length in a media feature needs its unit:
  (max-width: 900) drops the whole query at every width, with no error shown.
- Grid (new this week; check with real runs before writing anything): display: grid, grid-template-columns,
  grid-template-areas, gap and the fr unit. Check how a grid item's words come out in the page text (as with flexbox a
  blockified item should keep its own line, but confirm it), which computed values a page check reads the same at every width
  (display grid and gap in px should; a track size in fr, %, auto or minmax resolves to used pixels that follow the window, so
  never page-check a track size or a column width), and what repeat(auto-fit, minmax(...)) does to the page text when the
  number of columns changes with the width. If the page text changes with the column count, that layout cannot be used in a
  checked sample.
- Responsive pictures and video (new this week): check with real runs what the page window does with max-width: 100%,
  height: auto, the width and height attributes, srcset and sizes on an img, and a video with max-width: 100%. Uploaded media
  is embedded as data: online, so never page-check a src (CKB-092), and % and auto values follow the window and must never be
  page-checked. Juan's gallery pictures are 160 x 110 px drawings: check they still look right when they resize, and what the
  page text is offline, where they show only their alt text.
- Local templates and frameworks (Wednesday; AGENTS.md rule 5): nothing may be loaded from the internet, so a template or
  framework must be a local copy inside the project (a .css file the student can read), never a CDN link. Ask me which copy to
  use before writing Wednesday, and never tell students to download one.
- Flexbox (Week 9, keep): display: flex, flex-direction, flex-wrap, justify-content, align-items and gap are not page text,
  and their computed values agree in both checkers. Flexbox changes the page text only where it changes whether a child is a
  box of its own: a column of block-level items (li, p) reads exactly as before, display: flex on a nav ul whose li were
  inline-block turns one line of links into one per link, and display: inline on list items with no flex container runs them
  together onto one line. gap is never page text and does nothing without display: flex. float on a flex item still computes
  to left but has no effect, and a flex row needs no clear: both after it.
- Pseudo-classes and pseudo-elements (Week 8, keep): :hover, :focus, :focus-visible and :active are never page-checked (no
  mouse or keyboard); structural pseudo-classes and form states are. Text from ::before/::after is not page text;
  text-transform on ::first-letter is; text from ::before becomes the first letter; never use ::first-line (it follows the
  window).
- Position, float and gallery (Week 7, keep): absolute, fixed and floated boxes put their words on their own line in the page
  text; relative and sticky do not; offsets and z-index read as written in px, even on a static box; captions are page
  text, alt is not; a missing } nests the later rules inside the broken one in today's Chromium. Floats and flexbox both lay
  out Juan's gallery and cards: Week 9 moved the gallery from float to flexbox with no change to the page text.
- Box model, lists and links (Week 6, keep): sizes read in px; check a border by its style and colour; li tags each on
  their own line.
- Text, font and colour (Week 5, keep): sizes read in px, colours as rgb(), font lists with double quotes, gradients
  through background-image; text at opacity 0 or in a transparent colour stays in the page text.
- External stylesheet (checked in Week 4, keep): CodeShare inlines the link line into a style element, so never
  page-check link or style elements; a wrong or missing stylesheet leaves the page plain with no error. A media attribute on
  the link line is dropped (CKB-095): write media queries inside styles.css with @media.
- Thursday (check the whole site at different widths, then repair the hardest problem): check with real runs how the hardest
  mistakes (display: gird or another invalid value, a grid or flex property on the items instead of the container, a missing }
  after an @media block, a media query with no space after "and" or a missing unit, a picture with a fixed width that
  overflows a narrow page) come out in both checkers; an invalid value drops only its declaration, a broken
  @media condition drops the whole block. Each repair must change the page text (rule above), so pick one that, for example,
  also stops a later text-transform. A missing quote before an iframe gives different page text in CodeShare (CKB-093): no
  broken quote before an iframe in any sample.
- Personal project: the complete responsive resume. This is the last week, so the task is the finished site rather than a new
  trick: a grid or flex layout that reflows, pictures and video that resize with the page, their own media queries, and
  colours from the chart (4.5:1). Friday is the final presentation and Submit this version. Check what a personal run shows
  online and offline before writing the instructions, and remember a personal project's page window is wider than a module
  step's (CKB-112).

First, ask me only the questions whose answers change the files, each with your recommendation first, marked
"(Recommended)". Then show me the day plan, every step with its task (one line each: step, change, why it
exercises the lesson) and the AGENTS.md proposal (findings, files likely to change, steps, tests, risks, open
choices), and stop for my approval.

Testing (after approval):
- My checkers in Week_10 (check_codeshare.py <json> --run --media-root project_end, check_web_steps.cjs,
  test_checker.py) on the samples and every solutions/ answer; each unchanged sample must fail its task output.
  Add Week 10 to revision_tools/run_checks.sh.
- Render and inspect every DLL page and every module page (8.5 × 13 in = 612 × 936 pt; each source page renders
  to exactly one page).
- CodeShare: tests/web-module-steps.browser.mjs reads every built Resume week; its media subtest uploads the media of
  every built week with media steps before the student walk, so on Cloudflare's runtime every media step is checked
  automatically, never marked done. Its personal-project subtests cover Weeks 2–9; propose a Week 10 one (online, the
  student makes their layout responsive (a grid or flex layout and a picture that resizes), runs, and the test reads the page
  text and, in the page window at its real width and again with the browser window narrowed, the computed display and gap and
  which side of each query the page is on; personal runs show no Media checks lines, so pictures are read from the page) if it is worth
  it (needs my approval). The student walk clicks worksheet step tabs with dispatchEvent("click"): the tabs fold away while
  the worksheet scrolls (CKB-107), and a page-window wait must also wait for the elements it reads, not just readyState
  (CKB-111). Week 9's subtest measures the preview's own width and narrows the browser window with page.setViewportSize:
  reuse that for anything width-dependent. Then run it on Cloudflare's runtime on this laptop (npx
  opennextjs-cloudflare build, then preview on port 8787 with the git-ignored .dev.vars pointing at local Supabase) and
  on the offline-settings server (port 3042, where media steps are marked done because offline has no media), following
  the handoff's "Testing recipe". Report one line per step: sample verified, task completed (offline media steps:
  teacher-checked, marked done).
- Report tests as AGENTS.md "Reporting tests after a build" requires, including what could not be verified.

While working: keep docs/handoffs/web-module-steps.md, Week_10/Verification.md and DotNet1_Handover.md updated
after every finished step, add a dated line to the handoff's "Update log", and commit and push the repository docs
each time. If you find a bug, give it a CKB record; check problem-index.md and open PRs for the next free number
first.

Last step: Week 10 is the last week of the course, so write no new weekly prompt. In
docs/handoffs/web-module-steps.md, section "Rolling weekly prompt", replace this prompt with a short note that the ten-week
resume course is complete, listing the ten weeks and their module ids, and say what is left for me to do (print, upload, the
hosted check, and the deferred offline web steps and media). Update "Next step" the same way. Commit and push it.

When done, tell me in plain English: what each day covers, the print instructions (pages 1–6 double-sided, flip
on long edge; pages 7–8 single-sided; task pages double-sided, flip on long edge), the upload steps (Curriculum →
upload Week 10; View module details → Media files → add Juan's media and gallery pictures from Week_10/project_end),
anything I must check, and a Sources list of every reference as clickable links. Then say the course is complete and list
what is left for me to do.
```

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
- 2026-10-29 — Approved: Cloudflare-runtime check. `.dev.vars` got `JAVA_RUNNER_URL` (local, not
  committed); `cf:preview` on 8787 with local Supabase, browser mode confirmed; web steps browser
  test 11/11, runtime log clean. Test names made mode-neutral. "Hosted check after deploy"
  checklist written. CPU limit on the hosted free plan still unproven.
- 2026-10-29 — PR #62 was merged (`744cbb5`) before the online-check commits; those three commits
  moved to branch `docs/web-steps-online-check` for their own PR.
- 2026-10-29 — Online check delivered as [PR #63](https://github.com/SirNeo-Coder/JavaShare/pull/63); build, lint (0 errors) and suite 391/391 on that branch.
- 2026-10-29 — PR #63 merged (`d0ee2cf`); teacher reports the hosted check done. Slice 3 split into
  3a (`webChecks`, no media needed) and 3b (media, needs a storage decision); 3a proposed.
- 2026-10-29 — Slice 3a built on `feature/web-checks`: page-element checks in the page report,
  checklist lines, server comparison. Rule/route 25/25; browser 11/11 online, Cloudflare runtime and
  offline; suite 394/394; five break-and-restore proofs. Week 2 and Week 3 Step 1 samples pass.
- 2026-10-29 — Slice 3a delivered as [PR #64](https://github.com/SirNeo-Coder/JavaShare/pull/64) against main.
- 2026-10-29 — PR #64 merged (`0dcdd6a`). Slice 3b started on `feature/web-media`: asked the teacher
  where media files live.
- 2026-10-29 — Teacher: student media in personal projects is a separate later task. On module media
  the teacher recalled an earlier decision ("auto duplicated for each student and in Cloudflare"); no
  record of it was found in the repository, AGENTS.md, the handoffs or the teacher's course files
  (`DotNet1_Handover.md` lists binary-media support as not done). Asked the teacher to confirm.
- 2026-10-29 — Teacher chose Cloudflare R2 and one shared copy per module. Slice 3b plan proposed.
- 2026-10-29 — Slice 3b approved (5 MB per file, media cached on each device, media steps teacher-checked
  until uploaded). Work in progress committed on `feature/web-media` (usage limit reached):
  done — `wrangler.jsonc` R2 binding `MODULE_MEDIA`/`codeshare-module-media`; `file-paths.ts`
  `mediaPathType`/`MEDIA_LIMIT`; `router.ts` binary upload/`res.send`; repository R2 functions
  (`mediaBucket` via `getCloudflareContext`, list/read/put/delete, `moduleHasMedia`) and media rule in
  `completeSupabaseModuleActivity`; routes `GET/PUT/DELETE .../media/:folder/:name`, `GET .../media`;
  `module-activities.ts` `mediaCheckLines`/`mediaLinesPass` in `checkModuleRun`; `webPreview.ts`
  `embedMedia` + in-frame media test + `Media checks:` output; CSP `media-src data:`; `WebStepRun`
  media lines; `app/moduleMedia.ts` loader with device cache; student screen and teacher **Media files**
  section in `ModuleViewer`. `tests/web-module-steps.test.mjs` 31/31 (stand-in bucket on the OpenNext
  global). Typecheck and lint clean. A Week 3 media browser subtest is written but NOT run.
  LEFT: `npm run build:all`; Cloudflare build + `opennextjs-cloudflare preview` and the browser test on
  8787 (real local R2); offline safety-net browser run on 3042; full `npm test`; break-and-restore
  proofs; docs (`docs/cloudflare-setup.md`: create bucket `codeshare-module-media` BEFORE merging, or
  the deploy fails; course format, workflow page, AGENTS line, verification, CKB if a bug is found);
  then PR. Not deployable until the teacher creates the bucket.
- 2026-10-29 — Slice 3b finished on `feature/web-media`: browser 12/12 on Cloudflare runtime with
  local R2 (Week 3 Steps 2–7 pass with the teacher's files; student completes Step 3); offline 11 +
  media skipped; rule/route 31/31; suite 400/400; four break-and-restore proofs. Found and fixed
  CKB-079 (sound blocked in the sandboxed frame) and a teacher-view stale-media race. Bucket setup
  steps written; R2's checkout may ask for a card (teacher decides before merging).
- 2026-10-29 — Slice 3b delivered as [PR #65](https://github.com/SirNeo-Coder/JavaShare/pull/65); bucket must exist before merging.
- 2026-10-29 — PR #65 merged (`26875dc`). Slices 1–3 are on main. Hosted check of Slice 3b and the R2
  bucket not yet confirmed. Next: confirm, then the deferred tasks (see "Next step").
- 2026-10-29 — Status re-checked against GitHub: PRs #59–#65 merged, #66 (docs) open. Stale Slice 3
  notes, revision note and hosted-check limit line corrected. Asked the teacher for the Slice 3b hosted check.
- 2026-10-29 — Teacher confirmed the Slice 3b hosted check: bucket created before merging, no card asked,
  Week 3 Steps 2–7 tick every line after **Add media files**, no `exceededCpu`. PR #66 merged. Student media
  investigated and proposed on `feature/web-student-media`; waiting for approval.
- 2026-10-29 — Student media approved (recommended choices) and built on `feature/web-student-media`:
  rule/route 35/35, Cloudflare runtime browser 13/13 (new Week 3 personal subtest), offline 11 + 2
  skipped, Java personal offline 6/6 (one small change before final), suite 403/403, lint 0 errors;
  eight break-and-restore proofs. Found CKB-080 (existing on `main`, flaky Week 3 media subtest);
  recorded, fix proposed, not built.
- 2026-10-29 — Student media delivered as [PR #68](https://github.com/SirNeo-Coder/JavaShare/pull/68) against main.
- 2026-10-29 — PR #68 merged (`fc9a946`); Cloudflare's "Workers Builds: codeshare" check passed.
  Still open: the teacher's hosted check (Next step 1), the CKB-080 decision, and a re-run of
  `tests/personal-performance.browser.mjs` on the final code (port 3032 was busy). Another session
  has an uncommitted, different `CKB-080-save-submit-run-no-feedback.md`; CKB-080 is already taken on
  main, so that one needs the next free number.
- 2026-10-29 — Teacher asked to revise Weeks 1–3 in a separate chat, then build the remaining weeks in
  the same format. Added "Net MVC weekly modules: required format and workflow" (authorities, fixed
  facts, files, IDs, JSON rules, preview limits, per-week steps) and three revision notes. Prompt for
  the revision chat written.
- 2026-10-29 — Teacher chose the Java student workflow for Net MVC weeks (sample first, one meaningful
  task per step, weeks linked). AGENTS.md rule added; format section and revision notes updated; task
  answers live in `solutions/`. App task for sample-first web steps proposed; revision prompt rewritten.

- 2026-10-29 — App task approved (fix small bugs inside it, each with a CKB record; ask before anything that
  changes how students work). On `feature/web-sample-first`: route subtest "sample first (Java workflow)
  for web steps…" passes (rule/route 33/33, suite 404/404): a task needs its unchanged sample (with its
  page checks), tasks are checked by output only, the next step and the next week wait, the module project
  carries forward. New `tests/web-sample-first.browser.mjs` (fixture weeks) and a sample-first branch in
  `tests/web-module-steps.browser.mjs` (walks every step of Weeks 1–3 with answers from `solutions/`;
  legacy-only subtests skip for sample-first weeks) are written but NOT run yet: no free browser-pane
  server slot. A scratch sample-first copy of Weeks 1–3 is ready to exercise the new branch.
- 2026-10-29 — App task built on `feature/web-sample-first` (merged main with PR #70's run box). Found and
  fixed CKB-083 (result list re-judged a verified sample against the task); break-and-restore shown on
  Cloudflare's runtime. `tests/web-sample-first.browser.mjs` 5/5 online (8787) and offline (3042). The
  teacher's Weeks 1–3 were revised by the other chat meanwhile (21:27); `tests/web-module-steps.browser.mjs`
  on those real files: online 9 pass, 5 skipped (old format), 0 fail, twice — all 22 steps "sample
  verified, task completed"; offline 7 pass, 7 skipped, 0 fail — Weeks 1–2 and Week 3 Step 1 completed,
  Week 3 media steps teacher-checked and marked done. Before the revision, the same test on the old files
  passed 13 + 1 skipped, and on a scratch sample-first copy 9 + 5 skipped. Suite 409/409, lint 0 errors.
- 2026-10-29 — App task delivered as [PR #72](https://github.com/SirNeo-Coder/JavaShare/pull/72) against main.
- 2026-10-29 — PR #72 merged (`cedeb99`), after PR #71 (`e876f59`). Removed a stale duplicate CKB-080 row
  from `problem-index.md` (the run-box case, renumbered CKB-081 in PR #70, came back through a merge with a
  dead link). Both lists conflict whenever two open PRs each add a row at the bottom: merge main in and
  keep both rows.
- 2026-10-29 — CKB-080 fix approved and built on `fix/media-run-before-loaded`: **Run** on a media step waits
  until this device has the media (student and teacher). Cloudflare runtime: unfixed 3/3 failed, fixed 6/6
  passed (+1 after restore); practice weeks 5/5; offline 7 + 7 skipped and 5/5; suite 409/409, lint 0 errors.
- 2026-10-29 — CKB-080 fix delivered as [PR #75](https://github.com/SirNeo-Coder/JavaShare/pull/75) against main.
- 2026-10-29 — Weeks 1–3 revised in the teacher's folder (approved; see "Weeks 1–3 revision (done)"): JSON
  sample-first with 22 tasks and linked weeks, task pages after page 8, Week 1 line break, DLL lines. Teacher's
  checkers: samples and all 22 answers pass, unchanged samples fail 22/22. Found CKB-084. CodeShare browser
  check waits for PR #72. Week 1 note removed from `docs/course-format.md`. Delivered as [PR #74](https://github.com/SirNeo-Coder/JavaShare/pull/74).
- 2026-10-29 — Teacher: remove the red "ADJUST THIS ACCORDING TO YOUR AVAILABLE MATERIALS" line from the DLL and
  keep it in the playbook instead. Done for Weeks 1–3 (only that line removed; still 6 pages); playbook §1–§3
  updated (backup in `before_revision/`); format section updated.
- 2026-10-29 — PR #72 merged; main merged into this branch (conflicts resolved, both entries kept). Teacher: make
  the weekly prompt rolling. Added "Rolling weekly prompt" with the Week 4 prompt; each week's chat replaces it
  with the next week's as its last step.
- 2026-10-30 — Teacher: Net MVC work is done inside CodeShare only (CKB-085); the course is now 10 weeks about
  resumes (`DotNet1_Course_Map.md` rewritten, 20-week map kept in `before_revision/`); the old Weeks 1–3
  materials are retired. Approved and built the page window (CKB-086) on `feature/web-page-window`: Run shows
  the page in a floating window with its checks; links and project frames open the project's own pages; same
  window in the teacher's previews. Rolling weekly prompt marked outdated.
- 2026-10-30 — Rolling weekly prompt rewritten for the 10-week resume map, starting at Week 1 (teacher approved):
  new weeks in `Resume/Week_NN/`, IDs `dotnet-1-rNN` (old `dotnet-1-w01`…`w03` never reused), CodeShare-only
  wording check, made-up media for Juan. Format section (files, IDs) updated to match.
- 2026-10-30 — PR #76 merged. Review finding approved and fixed (CKB-087) on `fix/page-window-close-during-sync`: the
  page window's Close, Esc and click-beside stay off until the screen's whole run finishes, including the check and
  the completion sync. Next: teacher reviews the PR.
- 2026-11-06 — Resume Week 1 built in the teacher's `Resume/Week_01/` (teacher: ids `dotnet-1-r01`, not the
  `dotnet-1-resume-w01` names another chat recorded that morning; Friday is performance task day with one Friday step
  showing the finished page): 9 steps, DLL (7 pages), module (11 pages: 8 + task pages 9–11), JSON from real runs.
  Teacher's checkers: samples 9/9, answers 9/9, unchanged samples fail 9/9, `test_checker.py` 6/6, printed = JSON.
  `tests/web-module-steps.browser.mjs` now reads the Resume weeks (approved); 9/9 "sample verified, task completed" on
  Cloudflare's runtime (8787) and offline settings (3042), 6 pass, 8 skipped, 0 fail; a copy with one wrong answer fails
  at that step. `npm test` 421/421, lint 0 errors. `DotNet1_Handover.md` rewritten. Branch `docs/net-resume-week-01`.
- 2026-11-06 — Rolling weekly prompt replaced with Week 2 (Multimedia and tables): `dotnet-1-r02`, previousModuleId
  `dotnet-1-r01`, Week 1's DLL and tools as templates, media and table checks, Friday rule, test subtests to adapt.
- 2026-11-06 — Delivered as [PR #83](https://github.com/SirNeo-Coder/JavaShare/pull/83); CodeRabbit review not in yet when opened.
- 2026-11-06 — CodeRabbit on PR #83 (both valid, fixed in the Week 2 prompt): the Week 2 test adaptation must upload
  Juan's Week 2 media before the student walk so media steps are checked online, not marked done; the Week 3 prompt
  must take its topic, personal-task addition and upload steps from the Week 03 section.
- 2026-11-06 — Resume Week 2 (Multimedia and tables) approved with the four recommended choices: every step keeps
  Juan's picture, sound and video (all 9 steps are media steps; offline the teacher presses Mark done); printed outputs
  show the tab between table cells as →, the JSON keeps the real tab; three made-up avatar pictures in
  `Week_02/teacher_pictures/` for students without a photo (uploaded under Media files, online only); branch from main
  after PR #83 merged. Found: a table's page text puts each row on its own line with a tab between cells; `video` with
  `source` reports `null` as its file name, so samples put `src` on `img`, `audio` and `video`. Branch `docs/net-resume-week-02`.
- 2026-11-06 — Resume Week 2 built in the teacher's `Resume/Week_02/` (9 media steps; Juan's drawn picture, generated tune and
  recorded video in `project_end/`; DLL 7 pages; module 11 pages). Teacher's checkers: samples 9/9, answers 9/9, unchanged
  samples fail 9/9, `test_checker.py` 8/8, printed = JSON. `revision_tools/resume_w01/build.py` now builds any Resume week
  (`build.py r02`; Week 1 rebuilds byte-identical). `tests/web-module-steps.browser.mjs`: the retired Week 3 media subtest now
  uploads Resume Week 2's media before the student walk; the Week 2 personal subtest uses the resume starter and, online, a
  teacher picture under Media files. Offline settings (3042): 7 pass, 7 skipped, 0 fail. Cloudflare runtime next.
- 2026-11-06 — Cloudflare's runtime (8787, local R2): with `src` page checks on Week 2 Steps 1, 3, 4 the Week 2 media subtest
  and the student walk failed at Step 1 (`img has src=… found data:image/svg+xml;base64,…`): CodeShare embeds uploaded media
  as `data:` (CKB-092). Removed those checks (the Media checks lines name the src): 8 pass, 6 skipped, 0 fail; 18/18 steps
  "sample verified, task completed"; Week 2 personal project with a teacher picture under Media files submitted at 100%; a
  copy with one wrong answer failed at that step. Offline settings (3042) again: 7 pass, 7 skipped, 0 fail. `npm test`
  421/421, lint 0 errors, build OK. CKB-092 recorded (open, app fix proposed); `docs/course-format.md` notes how tables come
  out in page text and the src rule.
- 2026-11-06 — Rolling weekly prompt replaced with Week 3 (Links, frames and forms): `dotnet-1-r03`, previousModuleId
  `dotnet-1-r02`, Week 2's tools and DLL as templates, the media question, link/frame/form checks (CodeShare rewrites iframe
  src and inlines CSS/JS: real CodeShare run first), printed changed-output lines and → tabs, test subtest to adapt.
- 2026-11-06 — Delivered as [PR #84](https://github.com/SirNeo-Coder/JavaShare/pull/84); CodeRabbit review not in yet when opened.
- 2026-11-06 — Resume Week 3 (Links, frames and forms) approved with both recommended choices: Juan's Week 2 picture, sound
  and video stay on `index.html`, and Juan gets three pages (`index.html`, `projects.html`, `contact.html`; `projects.html`
  shows `contact.html` in an iframe). Only Steps 1 and 9 run `index.html`, so only they are media steps (offline the
  teacher presses Mark done on those two); Steps 2–8 run `projects.html` or `contact.html` and are checked automatically.
  Found with real runs in the teacher's checker and CodeShare's `buildTeacherPreview` (same results): link text is page
  text, `href` is not, `a[href]` page checks agree; a framed page's text is not page text; an iframe `src` page check reads
  null in CodeShare (srcdoc), so frames are checked by count, title, width, height; labels, button text and every select
  option are page text, typed values, placeholders, textarea text and `input type="submit"` values are not; a label and
  its input on one line leave a trailing space. New problem: a broken quote before an iframe makes CodeShare paste the
  framed page into the swallowed text (CKB-093, to be recorded). Branch `docs/net-resume-week-03`.
- 2026-11-08 — Resume Week 3 built in the teacher's `Resume/Week_03/` (three pages; Steps 1 and 9 run `index.html` and are the
  only media steps; DLL 7 pages; module 11 pages). `revision_tools/resume_w01/build.py r03`: a step may list several pages and
  name its run page (Weeks 1–2 rebuild byte-identical). Teacher's checkers: samples 9/9, answers 9/9, unchanged samples fail 9/9,
  `test_checker.py` 12/12, printed = JSON. CKB-093 recorded (missing quote before an iframe; worked around). Browser test
  adapted: the media subtest uploads every built media week (Weeks 2 and 3); the retired Week 3 subtest is now Resume Week 3's
  personal project (Week 2 resume carried forward, projects.html and contact.html added with ＋, online own sound and video).
  Cloudflare's runtime (8787): 9 pass, 5 skipped, 0 fail, 27/27 steps "sample verified, task completed"; a copy with a wrong
  Step 6 answer failed at that step. Offline settings (3042): 8 pass, 6 skipped, 0 fail (Week 3 Steps 1 and 9 marked done).
  `npm test` 421/421, lint 0 errors, build OK. Course map Week 03 readiness line updated.
- 2026-11-08 — Rolling weekly prompt replaced with Week 4 (CSS fundamentals and selectors): `dotnet-1-r04`, previousModuleId
  `dotnet-1-r03`, Week 3's tools and DLL as templates, multi-page steps with a run page, style page checks and inlined CSS to
  check with real runs, the media question, Thursday CSS repairs, optional Week 4 personal subtest to propose.
- 2026-11-08 — Delivered as [PR #86](https://github.com/SirNeo-Coder/JavaShare/pull/86); CodeRabbit review not in yet when opened. PR #84's CodeRabbit run reported "Review failed: the pull request is closed" (merged first), so it has no findings.
- 2026-11-08 — CodeRabbit on PR #86 (both valid, fixed; teacher approved): (1) the Week 4 prompt let a step list only the files
  it changes, so a CSS-only step could leave out its run page (the teacher preview runs only the step's files; the student's
  project keeps the previous task's run page, so the sample could never be verified). The rule now lists the run page and every
  file it needs; Week 3 already did. The Week 4 chat had already started: the correction was sent to it at the teacher's
  request (no Week_04 files existed yet). (2) The browser test treated any media-list answer but 503 as "media available";
  it now accepts only 200 or 503 and fails at once with the status otherwise.
- 2026-11-08 — Resume Week 4 (CSS fundamentals and selectors) approved with both recommended choices: Juan's Week 2 picture,
  sound and video stay on index.html (Steps 1, 3 and 9 run it and are the only media steps; offline the teacher presses Mark
  done on those three), and a Week 4 personal-project subtest is added. Teacher's correction (CodeRabbit on PR #86): each step
  lists its run page and every file that page needs (styles.css, a framed contact.html), even when unchanged; the printed
  module shows only new or changed lines. Found with real runs (teacher's checker and CodeShare's `buildTeacherPreview`, same
  results): computed styles agree; CodeShare inlines the link line, so `link`/`style` counts differ; an unquoted href is not
  inlined in CodeShare (CKB-094); which rule wins and how broken rules come out agree. Branch `docs/net-resume-week-04`
  (from PR #86's tip; PR #86 still open).
- 2026-11-08 — Resume Week 4 built in the teacher's `Resume/Week_04/` (shared styles.css; DLL 7 pages; module 11 pages).
  `build.py r04` (an output equal to an earlier one prints "the same as …"; `css` code blocks in the DLL; Weeks 1–3 rebuild
  byte-identical). Teacher's checkers: samples 9/9, answers 9/9, unchanged samples fail 9/9, `test_checker.py` 20/20, printed =
  JSON; break-and-restore shown for the listing rule, the quote guard and the printed check. Browser test: Cloudflare's runtime
  (8787) 10 pass, 5 skipped, 0 fail, 36/36 steps "sample verified, task completed", 14 media steps pass in the teacher preview;
  a copy with a misspelt class in Step 5's answer failed at that step. Offline settings (3042) 9 pass, 6 skipped, 0 fail
  (Week 4 Steps 1, 3, 9 marked done). The walk's `openStep` now finds whichever editor is open (a task can end in styles.css).
  New Week 4 personal subtest passes on both; a copy with an unquoted href failed (CKB-094 shown in the real app).
  `npm test` 421/421, lint 0 errors, build OK.
- 2026-11-08 — Rolling weekly prompt replaced with Week 5 (Text, font, colour, gradient and opacity): `dotnet-1-r05`,
  previousModuleId `dotnet-1-r04`, Week 4's tools and DLL as templates, the corrected listing rule and quotes (CKB-094),
  `build_tasks.py` with the week key only, text/font/colour/gradient/opacity checks with real runs, contrast computed for
  every colour pair, the media question, optional Week 5 personal subtest to propose.
- 2026-11-08 — Delivered as [PR #87](https://github.com/SirNeo-Coder/JavaShare/pull/87) against main (contains PR #86's commits while #86 is open); CodeRabbit review not in yet when opened. PRs #85 and #86 CodeRabbit checked at the start: #85 no findings (generic docstring check, not valid here); #86's two findings valid and already fixed on #86.
- 2026-11-09 — PR #86 merged. CodeRabbit on PR #87: three Minor findings on `docs/course-format.md`, all valid (checked with
  real runs in CodeShare's `buildTeacherPreview` and the page opened as a file): a stylesheet linked from a page in a subfolder
  is looked up from the top folder, and a `media` condition on a link line is dropped (bugs, latent, CKB-095, app fix needs
  approval); the missing-brace sentence now says a missing `}` after an `@media` block keeps later rules inside it. Teacher
  approved the document fixes; the Week 5 prompt now says to keep pages and styles.css in the top folder, no `media` on a link.
- 2026-11-09 — CodeRabbit's second review on PR #87 (22:04, after the first fixes; not checked before): (1) a repair whose
  only effect is a style can be skipped while the task's added words pass: valid; the teacher chose repairs that change the
  page text (rule added to the JSON rules above). (2) The Week 4 personal subtest checks styles on index.html only: valid,
  minor; covered by the new Week 5 personal subtest, which follows the Projects link in the page window. Open PRs: none.
- 2026-11-09 — Resume Week 5 (Text, font, colour, gradient and opacity) approved with the three recommended choices: Juan's
  Week 2 picture, sound and video stay on index.html (Steps 1, 6 and 9 are media steps); both Thursday repairs change the page
  text (Step 7 a missing `)` in the h1 gradient, Step 8 a missing `;` after the h1's white colour); a Week 5 personal subtest.
  Found with real runs in CodeShare's `buildTeacherPreview` (sandboxed frame with its no-internet policy) and the teacher's
  checker, the same in both: computed fonts, sizes, colours, gradients and opacity (see "What the page preview can and cannot
  do"). Branch `docs/net-resume-week-05` (from main after PR #87 merged).
- 2026-11-09 — Resume Week 5 built in the teacher's `Resume/Week_05/` (only styles.css changes; DLL 7 pages with the guide
  Quarter 2 standards; module 12 pages: 8 lesson pages and task pages 9–12, page 12 holds the contrast chart, starter stylesheet
  and self-check). `build.py` fills the DLL's standards from `STANDARDS` (Week 5 on); `build_tasks.py r05` adds a task page with
  no task boxes; Weeks 1–4 rebuild identical. Teacher's checkers: samples 9/9, answers 9/9, unchanged samples fail 9/9,
  `test_checker.py` 21/21 (three break-and-restore proofs), printed = JSON. New Week 5 personal subtest in
  `tests/web-module-steps.browser.mjs`. `npm test` 422/422, lint 0 errors, build OK. Browser runs next.
- 2026-11-09 — Browser test on the offline-settings server (3042), first run: the Week 1–5 walk passed (Week 5 Steps 1, 6, 9
  marked done), but the Week 2–5 personal subtests failed at Submit: PR #85's "Last submitted: …" line is a second
  `.actionbar .sync`, so `hasText: "Submitted"` matched two elements (CKB-096, test only). The teacher approved fixing the five
  lines (`/^Submitted$/`) in this PR. Cloudflare's runtime (8787): web steps 11 passed, 5 skipped, 0 failed; 45/45 steps
  "sample verified, task completed"; Week 5 media steps pass with uploaded media; the Week 5 personal subtest shows the gradient
  h1 on index.html and on projects.html through the Projects link; web-sample-first 6/6, and 4 pass / 2 fail with the old
  line ("strict mode violation … resolved to 2 elements"). No runtime errors. Delivered as
  [PR #88](https://github.com/SirNeo-Coder/JavaShare/pull/88); rolling prompt now Week 6.
- 2026-11-09 — Offline settings (3042) after the CKB-096 fix: web steps 10 passed, 6 skipped, 0 failed (Week 5 Steps 2–5, 7, 8
  "sample verified, task completed", Steps 1, 6, 9 marked done; the Week 2–5 personal subtests pass, Week 5 submitted at 100%);
  web-sample-first 6/6. Proofs on 3042: a copy of the weeks whose Step 7 answer still lacks the `)` stopped the walk at that
  step ("line 3: required HOME | PROJECTS | CONTACT, page gave Home | Projects | Contact"); a copy of the Week 5 personal
  subtest whose CSS drops the `)` failed with `background-image` `none`. The teacher's `run_checks.sh`: every week passes.
  Plain `npm run lint` 0 errors.
- 2026-11-09 — CodeRabbit on PR #88 (first review): one Minor finding, valid: the new prompt-map row had six cells in a
  five-column table; the branch name is now inside the Outcome cell. No outside-diff or nitpick comments.
- 2026-11-09 — Resume Week 6 (Box model, list and link styling) approved with the three recommended choices: Juan's Week 2
  picture, sound and video stay on index.html (Steps 1, 5 and 9 are media steps); Juan's nav becomes a list of links on all
  three pages; a Week 6 personal subtest. Found with 27 real runs in CodeShare's `buildTeacherPreview` (sandboxed frame,
  800 px wide) and the teacher's checker, the same in both: see "What the page preview can and cannot do". Built in the
  teacher's `Resume/Week_06/` (DLL 7 pages; module 12 pages; `build.py` takes `SAME_NOTE`; `build_tasks.py r06` prints the
  chart and starter stylesheet in two columns; Weeks 1–5 rebuild identical). Teacher's checkers: samples 9/9, answers 9/9,
  unchanged samples fail 9/9, `test_checker.py` 26/26 (four break-and-restore proofs), printed = JSON; `run_checks.sh` passes
  every week. New Week 6 personal subtest written; browser runs next. Branch `docs/net-resume-week-06`.
- 2026-11-09 — Cloudflare's runtime (8787), first run: Week 6 Step 1's `border-bottom-width` `2px` check failed in the media
  subtest and the student walk (`found 1.73913px`), and the Week 6 personal subtest read `1.73913px` too: CodeShare's
  `body { zoom: var(--ui-scale) }` (1.15) also zooms the page window, and Chromium draws borders in whole screen dots
  (measured: 1px → 0.87px, 2px → 1.74px at 1.15; 1.6px at 1.25; 1.38px at 1.45; padding and margins unchanged). Recorded as
  CKB-097 (open; app fix needs the teacher's choice); Week 6 now checks borders by style and colour only, the module says why,
  and `test_checker.py` guards it (27/27, guard shown failing). Second run: 12 passed, 5 skipped, 0 failed; 54/54 steps "sample
  verified, task completed"; Week 6 personal subtest passes. Offline settings (3042): 11 passed, 6 skipped, 0 failed (Week 6
  Steps 1, 5, 9 marked done); web-sample-first 6/6. Proofs on 3042: a Step 7 answer still missing its `;` stopped the walk
  ("page gave HOME"); a Week 6 personal CSS without `display: inline-block` failed (`HOME\nPROJECTS\nCONTACT`, `list-item`).
  Visited link colour in the page window: not shown (headless Chromium painted no visited colour even in a plain tab); from the
  code the page window never navigates, so links cannot become visited. `npm test` 422/422, lint 0 errors, build OK.
- 2026-11-09 — Rolling weekly prompt replaced with Week 7 (Position, z-index, float and an image gallery): `dotnet-1-r07`,
  previousModuleId `dotnet-1-r06`, Week 6's tools and DLL as templates, the media question plus Juan's made-up gallery pictures,
  position/z-index/float/gallery checks with real runs in the zoomed page window, CKB-097, optional Week 7 personal subtest.
- 2026-11-09 — Delivered as [PR #89](https://github.com/SirNeo-Coder/JavaShare/pull/89) against main; CodeRabbit review not in yet when opened. PR #88's CodeRabbit review: one finding, already fixed on #88.
- 2026-11-10 — CodeRabbit on PR #89 (merged, checked at the start of Week 7): two Minor findings, both valid. (1) The Week 6
  prompt-map row said box values agree "except border widths"; % widths and auto margins also follow the window: row reworded.
  (2) Pages opened through a link in the page window are built without media lines (`app/WebStepRun.tsx`, `openLink`), and
  personal runs never show them (`include: false`): the Week 7 gallery sits on the run page, and the Week 7 personal subtest reads
  each picture from the page instead. No app change.
- 2026-11-10 — Resume Week 7 (Position, z-index, float and an image gallery) approved with the four recommended choices: Juan's
  gallery on index.html with Week 2's media (Steps 2, 4, 5, 6, 9 are media steps; Steps 1, 3, 7, 8 run projects.html), three drawn
  teacher gallery pictures, a Week 7 personal subtest. Found with real runs (teacher's checker and CodeShare's `buildTeacherPreview` at
  zoom 1.15 in an 800 px frame, the same in both): see "What the page preview can and cannot do". Built in the teacher's
  `Resume/Week_07/` (DLL 7 pages; module 13 pages, task pages 9–13; `build_tasks.py r07`; Weeks 1–6 rebuild identical apart from an
  unused `.r7` rule in their `tasks.css`, then restored). Teacher's checkers: samples 9/9, answers 9/9, unchanged samples fail 9/9,
  `test_checker.py` 23/23 (guard and answer break-and-restore shown), printed = JSON. Browser test: Cloudflare's runtime (8787) 13 pass,
  5 skipped, 0 fail, 63/63 steps "sample verified, task completed"; offline settings (3042) 12 pass, 6 skipped, 0 fail (Week 7 Steps 2,
  4, 5, 6, 9 marked done); the Week 7 personal subtest passes on both (offline the pictures are not found, the run still succeeds).
  Proofs on 3042: a Step 7 answer still missing its `;` stopped the walk; a personal stylesheet without `position: absolute` failed
  the subtest. web-sample-first 6/6 (8787). `npm test` 422/422, lint 0 errors, build OK. No new CodeShare bug. Rolling prompt now Week 8.
  Branch `docs/net-resume-week-07`.
- 2026-11-10 — Delivered as [PR #92](https://github.com/SirNeo-Coder/JavaShare/pull/92) against main; CodeRabbit review not in yet when opened.
- 2026-11-10 — CodeRabbit on PR #92 (merged, checked at the start of Week 8): two Minor findings on the Week 8 prompt, both valid. (1) A
  media step's expected output ends with a whole Media checks section (the heading and one result line per file), not the heading
  alone: the Week 9 prompt says so. (2) One colon (`:before`) is valid legacy syntax, not a broken selector: confirmed by real runs
  (`h2:before`, `.badge:first-letter` work); it is not a Week 8 repair, and the module says one colon still works.
- 2026-11-10 — Resume Week 8 (Pseudo-classes and pseudo-elements) approved with the three recommended choices: Week 2 media and Juan's
  gallery stay on index.html (Steps 1, 4, 5, 8, 9 are media steps; Steps 2, 3, 6, 7 run projects.html or contact.html); skill items get
  hover only (no tabindex), links, the button and form boxes get focus; a Week 8 personal subtest. Found with 32 real runs (teacher's checker
  and CodeShare's `buildTeacherPreview` at zoom 1.15 in an 800 px frame): see "What the page preview can and cannot do".
- 2026-11-11 — Resume Week 8 built in the teacher's `Resume/Week_08/` (DLL 7 pages; module 13 pages, task pages 9–13; `build.py r08`,
  `build_tasks.py r08`; Weeks 5–7 task pages rebuild identical apart from the known unused `.r7` rule, then restored). Teacher's checkers:
  samples 9/9, answers 9/9, unchanged samples fail 9/9, `test_checker.py` 23/23 (guard and answer break-and-restore shown; it presses the
  real Tab key and reads `::before` styles), printed = JSON, `run_checks.sh` passes every week. Browser test, first run on Cloudflare's
  runtime: the student walk stopped at Week 1 Step 4 (the step tab folded under the worksheet header since PR #93): CKB-107, test only;
  the teacher approved the one-line fix. Then Cloudflare's runtime (8787) 14 pass, 5 skipped, 0 fail, 72/72 steps "sample verified, task
  completed", no server errors; offline settings (3042) 13 pass, 6 skipped, 0 fail (Week 8 Steps 1, 4, 5, 8, 9 marked done); the new Week 8
  personal subtest passes on both (its first expectation was wrong: a focused nav link takes the student's nav hover colour). Proofs on
  3042: a Step 7 answer with the star still in `::before` stopped the walk; a personal stylesheet with `h2::befor` failed the subtest.
  `npm test` 448/448, lint 0 errors, build OK. Rolling prompt now Week 9 (asks to check first whether a narrow-screen media query can be
  seen in the page window at all). Branch `docs/net-resume-week-08`.
- 2026-11-11 — Delivered as [PR #96](https://github.com/SirNeo-Coder/JavaShare/pull/96) against main; CodeRabbit review not in yet when opened.
- 2026-11-11 — CodeRabbit on PR #96: one Minor outside-diff finding, valid: the Week 8 personal subtest focused a nav link, whose Week 6 `nav a:focus`
  colour overrides the new `a:focus` rule, so the subtest passed without that rule. Approved fix: the student also adds an ordinary link and the
  subtest expects its focused light yellow (student run and teacher review). Shown failing with the yellow rule removed (`rgba(0, 0, 0, 0)`,
  3042). After the teacher merged main into the branch: 3042 13 pass, 6 skipped, 0 fail; 8787 14 pass, 5 skipped, 0 fail, 72/72 steps; `npm test`
  first 454/457 (three `subject-module-sharing` database tests failed; alone 10/10; all migrations applied locally; probably another
  run on the shared local database), then 457/457. Test only; no CKB record (a weak check, not a CodeShare bug).
- 2026-11-11 — Resume Week 9 (Flexbox and media queries) built in the teacher's `Resume/Week_09/` (DLL; module 13 pages, task
  pages 9–13; `build.py r09`, `build_tasks.py r09`, `WEEK=09 render_r01.sh`; module `dotnet-1-r09`, `previousModuleId`
  `dotnet-1-r08`, 9 steps, each one task `-alter-v1`). Teacher's choices: Juan's Week 2 media and Week 7 gallery stay on
  `index.html`, so Steps 1, 3, 4, 5, 8 and 9 are the media steps; breakpoint `max-width: 900px`; Step 3's task reuses
  `tree_planting.svg`, so **no new media file** this week. Only Steps 4 and 8 change the page text by themselves (the nav
  splits into three lines; the broken `display: inline` runs the skills onto one line). Week 9 checks: 9/9 samples, 9/9 task
  answers from `solutions/`, all 9 unchanged samples correctly failing their task output, `test_checker.py` 22/22,
  `consistency.py` ALL MATCH, printed module 13 pages all clearing their footer. Every sample and task answer was verified
  **byte-identical at 696, 760, 800, 899, 901 and 1000 px**, with every page check returning the same value, so no media query
  changes the page text or a checked value; the invariant test was shown failing first by hiding the motto inside a query.
  Repository: `docs/course-format.md` ("Flexbox and media queries"), this handoff, a Week 9 personal subtest in
  `tests/web-module-steps.browser.mjs`, and `revision_tools` registrations (`tasks.py`, `build_tasks.py` SPLIT/CLS/EXTRA and
  the new `r9` output size, `render_r01.sh`, `run_checks.sh`). `npm run build:all` OK, `npm run lint` 0 errors (8 pre-existing
  warnings), `npm test` 459/459, browser test on the offline-settings server (port 3072) 14 pass, 6 skipped, 0 fail: Week 9
  Steps 2, 6 and 7 "sample verified, task completed", and its six media steps marked done, which is what offline does (not run
  on Cloudflare's runtime this week, so the media steps were not checked automatically by CodeShare; the teacher's own checker
  checks their `Media checks:` output).
- 2026-11-11 — **CKB-112**: the Week 9 personal subtest failed on its first run and showed that the page runs at three
  different widths — a module step's page sits beside its web-checks panel (narrower than 900 px), a personal project's page
  fills the page window (`width:min(1180px,100%)`, wider than 900 px, because
  `.page-window .module-web-preview:last-child` spans both grid columns), and the teacher's checker is 1000 px. So a
  `max-width: 900px` query is on for the module steps and off in a personal project. The 900 px breakpoint was pre-approved on
  the premise that the page window is always about 800 px, which holds for module steps only. No app change: the module text,
  the printed module, the task pages and the DLL no longer say "drag the page window" (it cannot be dragged) but tell students
  the module step's page is already narrow and that in their own project they make the **browser** window narrower, which the
  page window follows. The subtest now asserts all three widths and that narrowing the browser window turns the query on with
  no change to the page text or any other computed value. Recorded with its index and prompt-map rows and in
  `docs/course-format.md`. Also fixed before delivery, caught by Week 9's own `test_checker.py`: Step 9 said "four flex
  containers" when the stylesheet has five, and Step 6 claimed its output was "the same as Step 2's" when the nav bar differs.
- 2026-11-11 — Rolling weekly prompt replaced with **Week 10** (Responsive resume, RWD layouts), the last week of the course.
  It leads with CKB-112 (never assume one width), asks about grid, responsive pictures and video and which **local** template
  or framework copy Wednesday should compare (AGENTS.md rule 5: nothing from the internet), and tells that chat to write no
  new prompt but to record that the course is complete.
