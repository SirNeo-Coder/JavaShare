# Rolling handoff — Net MVC web module steps (HTML, CSS, JavaScript)

One file for this feature, updated in place after every finished step (AGENTS.md, "Progress
notes"). Another coding assistant must be able to continue from this file alone. Read
`AGENTS.md` first; its "Web module steps (agreed 2026-10-28)" rule is the short version of the
decisions below.

Last updated: 2026-10-30.

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
| Weeks 1–10 of the 10-week resume map (JSON, DLL, printed module) | **Not started**; the rolling weekly prompt must be rewritten for the new map first | same section |

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

**What the page preview can and cannot do** (check before writing a week; if a week needs something
it cannot do, stop and propose an app change for approval first):

- Can: one page with its local `.css` and `.js` files (linked with `<link rel="stylesheet">` and
  `<script src>`), console output, uploaded pictures, sound and video in `img`/`audio`/`video`/`source`;
  since 2026-10-30 (CKB-086) links to the project's other `.html` pages (shown in the same page window)
  and `<iframe src="page.html">` of a project page. Checks still read the step's run file only.
- Cannot yet: load pictures or fonts named in CSS `url()` (backgrounds, `@font-face`), send a form
  anywhere (a form can be shown and typed in; Week 3's contact form "sends nowhere"), a frame inside a
  framed page, anything from the internet. Only Chromium was tested.

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
   runtime (8787) and offline settings (3042), one line per step. That test reads only Weeks 1–3
   today; extending it to a new week is a test change that needs approval.
6. Write `Verification.md`; update `DotNet1_Handover.md`, the root `project/`, this handoff;
   commit and push the repository docs on a new branch with a PR.
7. Teacher: upload the JSON under **Curriculum** (same ids keep student progress); for a media
   week, add its files under **Media files**.

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
  reads the teacher's files from `DOTNET_WEEKS_DIR` and skips if they are missing.
- Sample-first weeks: `tests/web-sample-first.browser.mjs` (two linked practice weeks; no teacher files
  needed) and the sample-first branch of `tests/web-module-steps.browser.mjs`, which walks every step of
  the teacher's Weeks 1–3 with the answers in each week's `solutions/<step id>/` (skips, naming the
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
- CKB-080 (fixed on `fix/media-run-before-loaded`): the teacher's **Run** on a media step pressed before the media finish loading showed a
  cross; the Week 3 media browser subtest fails about 1 run in 2 because of it (also on `main`).
- Student media: a phone photo name with spaces is refused (letters, numbers, `-`, `_` only); the
  student must rename it. Not checked on screen offline. Hosted CPU of the upload route unproven.
- PR #60's (merged) open question (a second device may show the next part locked for up to five minutes)
  is probably covered by CKB-076's refetch rule; not tested with two devices.

## Next step

1. **Teacher reviews and merges the page-window PR** (`feature/web-page-window`), then deploys and
   follows its pull request's test steps on the hosted site.
2. **Week 1 of the resume course**: the teacher pastes the "Rolling weekly prompt" (below, rewritten
   and approved 2026-10-30) into a new chat. That chat rewrites `DotNet1_Handover.md`, which still
   describes the old 20-week plan.
3. Then **Weeks 2–10**, one week per chat. Week 3 (links, frames, forms) can use the page window.
   Weeks 9–10 are built as planned; the teacher checks them in CodeShare when reached.
4. **Hosted check of student media (teacher)**, PR #68 (see "Hosted check after deploy").
5. **Offline web steps/media** stays a separate task (needed before media weeks are taught offline).

## Rolling weekly prompt

The teacher pastes this into a new chat for the next week. Each week's chat replaces it with the next week's
prompt as its last step (teacher, 2026-10-29). Rewritten for the 10-week resume map and approved by the
teacher on 2026-10-30. Current: **Week 1**.

```text
Use caveman mode and ponytail (minimal, laziest working solution) for this whole chat.

You are working in the CodeShare repository (formerly JavaShare) at /home/ireneo/Documents/GitHub/JavaShare.

Task: build .NET 1 Week 1, "HTML fundamentals, paragraphs and lists" (DLL, printed module, CodeShare JSON), in
my folder /home/ireneo/Documents/Java 2026/Net Files/Resume/Week_01/. Only this week.

Before anything:
1. Read AGENTS.md and follow it exactly (knowledge-first workflow, approval before changes, plain English,
   test reporting rules). Its "Net MVC course (agreed 2026-10-30)" and "Page window" rules apply.
2. Read docs/handoffs/web-module-steps.md in full. Follow "Net MVC weekly modules: required format and
   workflow". Its teacher decisions are approved; do not ask about them again. The old canteen weeks (folder
   root, Week_02/, Week_03/, Week_04/) are retired: use them as format examples only, never their content.
3. Read in my folder: DotNet1_Course_Map.md (Week 01 section, "Running project and performance task",
   "Delivery inside CodeShare"), DotNet1_Handover.md, ILAW_DLL_and_Module_Playbook.md (sections 1, 2.1, 3, 4,
   7, 8; its Java content does not apply), Week_03/Verification.md (format only), and revision_tools/ (reuse
   build_tasks.py, run_checks.sh and the Week_03 checkers; extend them instead of writing new ones, and remove
   their VS Code and Chrome wording).
4. Another session may be working in the main repository folder with uncommitted changes. Never commit, stash,
   discard or build on them. Use a separate git worktree from origin/main for any repository change. Pick free
   ports.
5. I merge pull requests quickly. Before every push to a PR branch, check the PR is still open
   (gh pr view N --json state). If it is already merged, put the new commits on a new branch and open a new PR
   against main.

Week rules (check each against the real files first):
- Resume theme: module samples build the resume of Juan Dela Cruz, a made-up student (every detail
  invented). The personal performance task is the student's own resume; Week 1 is a simple personal info page
  (name, short introduction, lists of skills and interests). No home address, phone number, birth date, ID
  numbers or personal social-media accounts.
- Everything happens inside CodeShare (CKB-085): never tell students to use VS Code, Chrome, Ctrl+O,
  File > Open Folder, local folders or folder copies. Before handing over, search the DLL, module and JSON for
  "VS Code", "Visual Studio", "Chrome", "Ctrl+O" and "folder", and fix every hit.
- Pictures, sound and video for Juan are made-up files created on this laptop (drawn SVG, generated sound and
  video); never a real person's photo, never downloaded.
- Week_01/project_start/ is empty (first week); Resume/project/ matches Week_01/project_end/ at the end.
- JSON: "sampleFirst": true, no previousModuleId (first week). IDs: course dotnet-1, module dotnet-1-r01,
  lessons dotnet-1-r01-dD, steps dotnet-1-r01-dD-sS (S counts across the week), slips dotnet-1-r01-dD-slip,
  task dotnet-1-r01-pt. Every step has one meaningful task (activity id "<step id>-alter-v1", instruction,
  "files": [], complete expectedOutput) that changes the visible page text or console lines. Answers in
  Week_01/solutions/<step id>/, never in the JSON. Every expected output from a real run. A task never repairs
  a file listed in its step's mediaChecks (CKB-084).
- Printed module: 8 lesson pages, then task pages after page 8 built with revision_tools/build_tasks.py.
  Printed module and JSON identical in code and outputs.
- DLL: Week_03's DLL is the format template only (no canteen or earlier-week text left): five opened
  references per day, a "Sample, then your task:" line in each Student Activity, no red ADJUST THIS line.
- If the week needs something the CodeShare preview cannot do (handoff, "What the page preview can and cannot
  do"), stop and propose an app change first.
- Never change an ID that is already used. Never reuse the old dotnet-1-w01…w03 IDs.

This week's checks:
- List markers are not page text: the numbers and bullets of <ol>/<ul> (and type, start, reversed) never
  appear in the expected output. A task that only changes a list attribute cannot be checked, so every task
  changes visible text; check list attributes on the sample with webChecks (attribute + value).
- Paragraph formatting (<b>, <strong>, <i>, <em>, <mark>, <small>, <sub>, <sup>, <br>, <hr>, <pre>): check
  with a real run how each comes out in the page text (<br> breaks the line, <pre> keeps spaces, <hr> adds
  nothing) before writing any expected output, and how the printed module will show it.
- "Web editors" in the fundamentals means CodeShare's code editor. Versions and the role of HTML are
  discussion, checked by the liplet, not by a run.
- No media this week; pictures, sound and video start in Week 2.

First, ask me only the questions whose answers change the files, each with your recommendation first, marked
"(Recommended)". Then show me the day plan, every step with its task (one line each: step, change, why it
exercises the lesson) and the AGENTS.md proposal (findings, files likely to change, steps, tests, risks, open
choices), and stop for my approval.

Testing (after approval):
- My checkers in Week_01 (check_codeshare.py <json> --run --media-root project_end, check_web_steps.cjs,
  test_checker.py) on the samples and every solutions/ answer; each unchanged sample must fail its task output.
- Render and inspect every DLL page and every module page (8.5 × 13 in = 612 × 936 pt; each source page renders
  to exactly one page).
- CodeShare: tests/web-module-steps.browser.mjs still reads the retired Weeks 1–3. Propose changing it to read
  the Resume weeks (needs my approval), then run it on Cloudflare's runtime on this laptop
  (npx opennextjs-cloudflare build, then preview on port 8787 with the git-ignored .dev.vars pointing at local
  Supabase) and on the offline-settings server (port 3042), following the handoff's "Testing recipe". Report
  one line per step: sample verified, task completed.
- Report tests as AGENTS.md "Reporting tests after a build" requires, including what could not be verified.

While working: keep docs/handoffs/web-module-steps.md, Week_01/Verification.md and DotNet1_Handover.md updated
after every finished step (this week, rewrite DotNet1_Handover.md for the resume course; keep the old one in
before_revision/), add a dated line to the handoff's "Update log", and commit and push the repository docs
each time. If you find a bug, give it a CKB record; check problem-index.md and open PRs for the next free
number first.

Last step (rolling prompt): in docs/handoffs/web-module-steps.md, section "Rolling weekly prompt", replace this
prompt with the one for Week 2. Change every week number (Week 1 → 2, Week_01 → Week_02, dotnet-1-r01 →
dotnet-1-r02, Week 01 section → Week 02 section); add "previousModuleId": "dotnet-1-r01" and
"Week_02/project_start/ = Week_01/project_end/"; write "This week's checks" for Week 2 from the course map and
the handoff's preview limits; add any rule I approved this week; keep everything else. From Week 3 on, the
prompt also asks whether the step samples keep Week 2's pictures, sound and video (then every step is a media
step and offline I press Mark done) or leave them out. Commit and push it, and paste it at the end of your
final reply. The Week 10 chat writes no new prompt; it says the course is complete.

When done, tell me in plain English: what each day covers, the print instructions (pages 1–6 double-sided, flip
on long edge; pages 7–8 single-sided; task pages double-sided, flip on long edge), the upload steps (Curriculum →
remove the old Weeks 1–3 the first time → upload Week 1; View module details → Media files if needed), anything
I must check, and a Sources list of every reference as clickable links. Then the Week 2 prompt.
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
