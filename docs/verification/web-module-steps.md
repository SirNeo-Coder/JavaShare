# Verification — Web module steps, Slice 1 (2026-10-28)

Branch `feature/web-module-steps`, based on main `aadda3a`. Local only: local Supabase in Docker,
offline-settings production build (`LOCAL_JAVA_EXECUTION=true`, `CODESHARE_LAPTOP=true`, no
`JAVA_RUNNER_URL`) served by `next start -p 3042`. No hosted service was used.

## Commands

```sh
npm test            # node --test "tests/*.test.mjs"
npm run lint
npm run build:all
CODESHARE_PLAYWRIGHT_MODULE=<playwright/index.mjs> PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<chrome> \
  node --test --test-reporter=spec tests/web-module-steps.browser.mjs
```

The browser test reads the teacher's files from `DOTNET_WEEKS_DIR` (default
`/home/ireneo/Documents/Java 2026/Net Files`) and skips if they are missing.

## Results

- `npm test`: 386 tests, 386 pass, 0 fail, 0 skipped.
- `npm run lint`: 0 errors, 8 warnings (the same 8 as before this change).
- `npm run build:all`: passes.

### `tests/web-module-steps.test.mjs` (rule checks, screen rendering, real routes with local Supabase)

Rule checks (no app, no database):
- ✔ web check rule: page text is the tab title then the visible text with blank lines removed
- ✔ web check rule: a mismatch fails, and spaces or a missing line break are never ignored
- ✔ web check rule: an uncaught error or a page that never finished makes the run unsuccessful
- ✔ web check rule: a .js run file compares the console lines, joined with line breaks
- ✔ web preview: the sandbox reports page text after drawing, flags uncaught errors, and opens the run file
- ✔ module web steps use the no-internet preview and still open the step's run file
- ✔ web steps: decided by file endings, with no Java-only path handling
- ✔ module upload keeps webChecks, mediaChecks and includeMediaOutput and rejects an unknown media state

Screen rendering (server-side render, no browser):
- ✔ web check list: a tick when it matches; a cross with Required output and Your output side by side when not
- ✔ module editor for a web step: HTML editor on index.html, page preview instead of the Java console, no Program input

Real server routes, offline settings, local Supabase:
- ✔ web steps offline (real routes): web completions are accepted, media steps wait for the teacher, Java is unchanged
  - ✔ upload stores the new fields; the student's web project keeps the .txt reference file
  - ✔ offline, a wrong page or an uncaught error is refused and a matching page completes the step
  - ✔ a media step cannot be completed from the browser; only its own class teacher can mark it done
  - ✔ offline, a .js step completes from its console output
  - ✔ Java steps keep their rules: offline browser results are refused and web files cannot complete them
  - ✔ teacher class progress shows the web percentage and the media step as done

### `tests/web-module-steps.browser.mjs` (real app in Chromium, teacher's Week 1–3 files) — 10/10

- ✔ upload keeps webChecks, mediaChecks and includeMediaOutput
- ✔ teacher preview runs every step's own sample through the web check
- ✔ Week 2 Step 1: mismatch and uncaught error show a cross with Required and Your output, then the sample passes
- ✔ Week 2: each next step opens, passes offline, the next part opens and the percentage moves
- ✔ Week 2: reload resumes at the next unfinished step, from the worksheet and the Module project button
- ✔ a preview that starts below the screen edge still reads the drawn page text, not the raw source
- ✔ teacher dashboard shows the web student's percentage and marks a media step done
- ✔ a .js step compares real console lines: teacher preview ticks a match, crosses an uncaught error; a student completes it
- ✔ a module page loads nothing from outside CodeShare (rule 5): stylesheet, picture and fetch are blocked

### Per-step results, each step's own sample files (teacher preview, Chromium)

| Step | Result |
| --- | --- |
| dotnet-1-w01-d1-s1 … d5-s8 (all 8) | fail — line 2: required `Visible page text: <text>` on one line; the agreed rule puts a line break after `Visible page text:`. That is the only difference in every Week 1 step. |
| dotnet-1-w02-d1-s1 … d5-s7 (all 7) | pass |
| dotnet-1-w03-d1-s1 | pass (`includeMediaOutput: true`, but no pictures/sound/video, so checked automatically) |
| dotnet-1-w03-d1-s2, d2-s3, d3-s4, d4-s5, d4-s6, d5-s7 | teacher-checked (expected output has a `Media checks:` section) |

Week 2 walk-through: all 7 steps passed offline; percentage 13% → 38% after Step 3 → 88% after
Step 7 (the remaining 1/8 is the personal performance-task submission, Slice 2). Teacher dashboard
showed Week 2 at 88%, overall 38%. Screenshots: `/tmp/codeshare-web-steps-student.png`,
`/tmp/codeshare-web-steps-teacher.png` (not committed).

### Java unchanged

- Full suite above, including every existing Java test (real laptop `javac`).
- `tests/module-resume.browser.mjs` offline on this build: 6/6.
- `tests/module-sample-first.browser.mjs` offline: fails before its first step (worksheet not
  visible after choosing a module). It fails the same way on a fresh build of main (`ac746c2`, same
  code as `aadda3a`), so the test is out of date, not broken by this change. Flagged separately.

## Break-and-restore proofs

| Break | Result broken | Restored |
| --- | --- | --- |
| Repository refuses non-Java steps again | 4 route subtests fail (11/16) | 16/16 |
| Route applies the offline Java refusal to web files | 5 route subtests fail | 16/16 |
| Uncaught errors ignored | 2 rule tests fail | 16/16 |
| Web `src/` merged like Java | 1 rule test fails | 16/16 |
| Module cache refetch after teacher Mark done removed (CKB-076), rebuilt | browser subtest fails 6/6 runs | 9/9 |
| Module runs use the old internet-allowed preview (CKB-022), rebuilt | network subtest fails: counter received `/style.css`, `/picture.png`, `/data` | 10/10, counter empty; Weeks 2–3 results unchanged |
| Page text read on load + timer again (CKB-075), rebuilt | Week 2 steps still passed 6/6 runs: **no test reliably catches this** | — |

## Not tested

- Online mode (Cloudflare/hosted Supabase), the hosted site, and the `classroom:offline` launcher on
  port 3000 itself (same settings were used on port 3042).
- Browsers other than Chromium. Firefox and Safari may produce slightly different `innerText`
  line breaks, which would make a correct page fail.
- Phones, dark theme, a second physical device, real classroom Wi-Fi.
- `sampleFirst` and `activity.id` web steps with real files (none in Weeks 1–3); covered only by the
  shared Java code path and the rule tests.

# Slice 2 — web personal performance-task project (2026-10-29)

Branch `feature/web-personal-project`. Offline-settings production build (local Supabase, laptop
Java, no online runner) on ports 3042 (web, live help) and 3032 (Java personal, live help), started
from `.claude/launch.json`. `npm run classroom:offline` itself was not launched.

## Commands

- `npm run build:all` — passes.
- `npx eslint . --ignore-pattern .next --ignore-pattern backend/dist --ignore-pattern .claude` —
  0 errors, 8 warnings (all existing).
- `npm test` — 391 tests, 391 pass, 0 fail, 0 skipped.
- `node --test --test-reporter=spec tests/web-module-steps.test.mjs` — 22/22.
- `node --test --test-reporter=spec tests/<name>.browser.mjs` for `web-module-steps` (11/11),
  `teacher-live-help` (7/7), `personal-performance` (6/6, offline).

## New checks

`tests/web-module-steps.test.mjs` (rule tests and real server routes, offline settings):

- ✔ personal project: web when the performance task starts from web files, otherwise Java
- ✔ personal web project editor: HTML editor and page preview, web file names, no Program input or Java console
- ✔ web personal project opens from its index.html starter, keeps web and .txt files, refuses Java files
- ✔ offline, a web page run counts only for the exact saved files with page text; then Submit this version reaches 100%
- ✔ Java personal projects keep their rules: web files and web page results are refused

`tests/web-module-steps.browser.mjs` (real app, Chromium, teacher's Week 2 file):

- ✔ Week 2 personal performance-task project (Slice 2): HTML editor and page preview, run, submit,
  100%; the teacher reviews the frozen page. Covers **Weekly web projects** with **W** icons, no
  Program input, an uncaught error blocking **Submit this version**, an edit after a run blocking it,
  **Submitted** and 100%, teacher live help showing **Web page** (CKB-078), and the teacher's
  read-only **Review personal submission → Run code** leaving progress unchanged.

## Break-and-restore proofs

| Break | Result broken | Restored |
| --- | --- | --- |
| Opening the personal project uses the Java-only file rule again | 2 route subtests fail | 22/22 |
| Run result no longer checks the files equal the saved project | "exact saved files" subtest fails | 22/22 |
| Screen treats the personal project as Java | editor render test fails | 22/22 |
| Live help label and editor fixed to Java (CKB-078), rebuilt | browser subtest fails (`'Java'` vs `'Web page'`) | 11/11 |

## Not tested

- The hosted site (see "Online settings" and "Cloudflare runtime" below for what was run).
- Firefox, Safari, phones, a second device, real classroom Wi-Fi.
- Personal web projects carrying forward through `previousModuleId` (Weeks 1–3 have none); covered
  only by the shared code path and `tests/personal-performance.test.mjs`.
- Pictures, sound or video in a personal project (Slice 3).

## Online settings (2026-10-29)

Same build, production server on port 3043 with online settings: local Supabase, no laptop Java,
`JAVA_RUNNER_URL=http://localhost:3034` (`/api/java-runner` answered `{"mode":"browser"}`; the
offline server on 3042 answered `{"mode":"local"}`).

`WEB_STEPS_BASE_URL=http://localhost:3043 node --test --test-reporter=spec tests/web-module-steps.browser.mjs`
— 11/11, including Week 2 steps, the Slice 2 personal project (run, submit, 100%, live help, teacher
review), the `.js` step and the rule 5 no-internet check. Per-step sample results matched the
offline run.

## Cloudflare runtime (2026-10-29)

`npx opennextjs-cloudflare build`, then `opennextjs-cloudflare preview` (Cloudflare's own runtime on
this laptop, port 8787) with the git-ignored `.dev.vars`: local Supabase (`127.0.0.1:54321`) plus
`JAVA_RUNNER_URL=http://localhost:3034`, added with the teacher's approval. `/api/health` reported
`supabase-local`; `/api/java-runner` answered `{"mode":"browser"}`.

`WEB_STEPS_BASE_URL=http://localhost:8787 node --test --test-reporter=spec tests/web-module-steps.browser.mjs`
— 11/11 (test names now say "web module steps: …", no longer "offline"). The runtime log had no
errors; every web route answered 200 except the intended 400 refusal of a media step
(`progress/complete`, `performance-project`, `personal-result`, `performance-task` included).
Logged times are total request times on this laptop, not CPU time: this does **not** show the hosted
free plan's 10 ms CPU limit (CKB-065) is met. Only the hosted Worker logs can.

# Slice 3a — page-element checks (`webChecks`) (2026-10-29)

Branch `feature/web-checks`. Approved with the recommended choice: checks apply to the step's own
sample only. Online first (teacher, 2026-10-29); offline ran only as the existing safety net.

## Commands and results

- `npm run build:all` — passes. Lint (`npx eslint . --ignore-pattern .next --ignore-pattern
  backend/dist --ignore-pattern .claude --ignore-pattern .open-next`) — 0 errors, 8 existing warnings.
- `npm test` — 394 tests, 394 pass, 0 fail, 0 skipped.
- `node --test --test-reporter=spec tests/web-module-steps.test.mjs` — 25/25. New:
  - ✔ page-element checks: one line per check, read like the teacher's checker
  - ✔ page-element checks apply to the step's own sample, not to an alteration task
  - ✔ the preview carries the step's checks into the page safely and reports them with the page text
  - ✔ offline, a wrong page or an uncaught error is refused and a matching page completes the step
    (now also: a failed page check and a missing page report are refused)
- `tests/web-module-steps.browser.mjs` (real app, Chromium, teacher's Weeks 1–3):
  - online settings (port 3043, browser mode): 11/11
  - Cloudflare runtime (`opennextjs-cloudflare preview`, port 8787, local Supabase): 11/11, log clean
  - offline settings (port 3042, safety net): 11/11
  - ✔ Week 2 Step 1: … a failed page check shows what was found, then the sample passes —
    `lang="fil"` keeps the page text (✓ Page text matches) but shows ✗ html has lang="en" — found fil,
    no output comparison, Not completed, no pass saved.

## Per-step results with each step's own sample (teacher preview, online and Cloudflare runtime)

- Week 1, 8 steps: fail on the page text (known same-line format; deferred revision). No `webChecks`.
- Week 2: Step 1 pass (page text + 1 page check); Steps 2–7 pass (page text + 6 page checks each).
- Week 3: Step 1 pass (page text + 6 page checks); Steps 2–7 teacher-checked (`Media checks:`), so
  their 36 page checks wait for Slice 3b.

## Break-and-restore proofs

| Break | Result broken | Restored |
| --- | --- | --- |
| Server stops comparing page checks | route subtest fails (failed page check accepted) | 25/25 |
| `checkModuleRun` ignores page checks for the step's own sample | rule test fails | 25/25 |
| Attribute check compares nothing | rule test and route subtest fail | 25/25 |
| Page stops reporting its checks (unit) | preview test fails | 25/25 |
| Page stops reporting its checks, rebuilt, online server | every checked step crosses ("found nothing"); 7 browser tests fail | 11/11 |

Found while writing the tests, before delivery: an `attribute`/`style` check without `value` passed
when the report omitted the field; the rule now requires `value` (the checker always fails it).

## Not tested

- The hosted site (teacher's check after deploy).
- Firefox, Safari, phones: computed styles may be reported differently.
- `sampleFirst` + `activity.id` web steps with real files (none exist); covered by rule tests only.

# Slice 3b — module pictures, sound and video in Cloudflare R2 (2026-10-29)

Branch `feature/web-media`. Approved: R2, one shared copy per module, 5 MB per file, media kept on
each device after the first download, media steps teacher-checked until the module has media.

## Commands and results

- `npm run build:all` — passes; `npx opennextjs-cloudflare build` — passes.
- Lint — 0 errors, 8 existing warnings. `npm test` — 400 tests, 400 pass, 0 fail, 0 skipped.
- `node --test --test-reporter=spec tests/web-module-steps.test.mjs` — 31/31. New:
  - ✔ media files: only images/, audio/ or video/ with a picture, sound or video ending, 5 MB each
  - ✔ media rule: like the teacher's checker, every picture, sound or video loads unless mediaChecks says broken
  - ✔ module media goes into the page as data: URLs, keeps the written path, and leaves missing files to fail
  - ✔ offline (no media storage), media files are unavailable and media steps stay teacher-checked
  - ✔ online, only the class's teacher uploads or removes media; the class reads one shared copy
  - ✔ online with media uploaded, a media step completes only with matching media lines
  (route tests use a stand-in bucket on the global OpenNext reads; real R2 is the browser run below)
- `tests/web-module-steps.browser.mjs`:
  - Cloudflare runtime (`opennextjs-cloudflare preview`, port 8787, wrangler's local R2, local
    Supabase): **12/12**, server log clean. ✔ Week 3 media (Slice 3b, Cloudflare R2): the teacher
    uploads the four files from `Week_03/project_end` through **Add media files**; every Week 3 media
    step's own sample passes; the student completes Step 3 with ✓ lines for both pictures, the sound
    and the video.
  - offline settings (3042) and online settings without R2 (3043): 11 pass, media subtest skipped
    ("no media storage"), media steps stay teacher-checked.

## Week 3 media steps with the teacher's media files (teacher preview, Cloudflare runtime)

- Step 2: pass (page text + page checks + 3 media lines)
- Steps 3, 4, 6, 7: pass (page text + page checks + 4 media lines)
- Step 5: pass — `images/snack.svg: image failed to decode`, `audio/chime-missing.wav` and
  `video/canteen-missing.webm: playback failed` as the JSON expects.

## Found and fixed during testing

- CKB-079: sound never played in the sandboxed preview (Chrome autoplay rule); fixed with
  `allow="autoplay"` on the frame. Shown failing before the fix (Steps 2–4, 6, 7 crossed).
- The teacher view used media loaded for an older file list right after uploading (Step 2 ran
  without the sound and video); a Run now uses only media loaded for the current list. Shown failing
  before the fix.

## Break-and-restore proofs

| Break | Result broken | Restored |
| --- | --- | --- |
| Server ignores the reported media lines | route subtest fails | 31/31 |
| Media steps automatic without uploaded media | 5 route subtests fail | 31/31 |
| Media rule ignores `broken` | rule test and route subtest fail | 31/31 |
| Media not put into the page | embedding test fails | 31/31 |
| Preview frame without `allow="autoplay"` (before the fix, Cloudflare runtime) | 5 Week 3 media steps cross | 12/12 |

## Not tested

- The hosted site and a real R2 bucket (the teacher creates it; see `docs/cloudflare-setup.md`).
- The R2 checkout's payment requirement (only Cloudflare's guide was read).
- Firefox, Safari, phones, real classroom speakers. Playback is tested muted.
- Hosted CPU use of the media routes (CKB-065); the files stream from R2 without processing.

# Students' own pictures, sound and video in web personal projects (2026-10-29)

Branch `feature/web-student-media`. Approved with the recommended choices: 5 MB per file, at most 10
per personal project, media carries forward with the personal files. Online only (Cloudflare R2, same
bucket, folder `students/`).

## Commands and results

- `npm run build:all` — passes; `npx opennextjs-cloudflare build` — passes; `npx tsc --noEmit` — passes.
- `npm run lint` — 0 errors, 8 existing warnings. `npm test` — 403 tests, 403 pass, 0 fail, 0 skipped.
- `node --test --test-reporter=spec tests/web-module-steps.test.mjs tests/personal-performance.test.mjs` —
  35/35. New or changed:
  - ✔ personal continuation: a web project's own media carries forward with the files it came with
  - ✔ personal web project editor: … (now also: **Media files** box with the note, a listed file
    `images/photo.png · 2 KB` and **Add media files**; the teacher's review has no **Add media files**)
  - ✔ students' own media in a web personal project: own folder, new copy per upload, run and submit
    cover it, unused copies go (offline 503; Java project, wrong name, over 5 MB and a teacher refused;
    upload clears the earlier run; **Save work** keeps the list; the student and their class teacher
    read a copy, another class's teacher and another student are refused; safety headers; the frozen
    submission keeps its media; a replaced copy is kept while the submission uses it, then deleted;
    at most 10, a refused upload leaves no copy) (route tests use a stand-in bucket)
- `tests/web-module-steps.browser.mjs`:
  - Cloudflare runtime (`opennextjs-cloudflare preview`, port 8787, wrangler's local R2, local
    Supabase): 13/13 on most runs. ✔ Week 3 personal project: the student adds their own pictures,
    sound and video; Run shows them; Submit freezes them; the teacher's review shows them. Week 3's
    starter page already uses the four files: with three uploaded, the preview shows
    `images/counter.svg: not found, broken`; after adding it, all four come with the page and both
    pictures draw; **Submit this version** is disabled until a new run; the review shows the same media.
    The Slice 3b subtest "Week 3 media" fails intermittently (CKB-080, existing on `main`, not caused
    by this change: 3 of 6 runs on unmodified `main` failed the same way).
  - Offline settings (3042): 11 pass, 2 skipped (both need R2), 0 fail.
- `tests/personal-performance.browser.mjs` (Java personal project, offline, 3032): 6/6 — run on the
  code one small change before the final version (the screen then read the media list from a separate
  reply field); not re-run on the final code because port 3032 was taken by another session.

## Break-and-restore proofs

| Break | Result broken | Restored |
| --- | --- | --- |
| An upload keeps the earlier successful run | route subtest fails (`200 !== 409`) | 32/32 |
| The submission does not keep its media | route subtest fails | 32/32 |
| Any class member may read a student's media | route subtest fails (`200 !== 403`) | 32/32 |
| Cleanup deletes a copy the submission still uses | route subtest fails (`1 !== 2`) | 32/32 |
| **Save work** drops the media list | route subtest fails | 32/32 |
| Media does not carry forward with the files | unit test fails | 3/3 |
| Media responses without the sandbox header | route subtest fails | 32/32 |
| **Run code** does not put the student's media into the page (Cloudflare runtime) | Week 3 personal browser subtest fails | 13/13 |

## Not tested

- The hosted site (no deploy by assistants); hosted CPU use of the upload route (CKB-065).
- Firefox, Safari, phones; a real student's phone photos (names with spaces are refused with a message).
- Offline media: offline shows "only available online" (route test only; not checked on screen).
- Carry-forward between real weeks: Weeks 1–3 have no `previousModuleId` (unit test only).

# Web steps in the Java workflow: sample first, alteration tasks, linked weeks (2026-10-29)

Branch `feature/web-sample-first` (main merged in, including PR #70's run box). Approved: prove and fix
sample-first and alteration tasks for web steps; small bugs fixed here with a CKB record each.

## Commands and results

- `npx tsc --noEmit`, `npm run build:all`, `npx opennextjs-cloudflare build` — pass. `npm run lint` — 0 errors.
- `npm test` — 409 tests, 409 pass, 0 fail, 0 skipped.
- `node --test --test-reporter=spec tests/web-module-steps.test.mjs` — new route subtest ✔ "sample first
  (Java workflow) for web steps: a task completes only after its unchanged sample, page checks belong to
  the sample, the next week waits" (task refused without the sample, with a changed sample, with a sample
  failing its page check, or with sample output; the next step and next week locked; tasks pass by output
  only; the module project carries forward).
- `tests/web-sample-first.browser.mjs` (two linked practice weeks) — 5/5 on Cloudflare's runtime (8787,
  local Supabase and R2) and 5/5 offline (3042):
  - ✔ a page step opens its sample read-only; the unchanged run verifies it with its page check; the task completes it
  - ✔ the console step loads its own sample, verifies it, then completes its task
  - ✔ after a reload, a finished step reopens with the student's completed work and keeps its completion
  - ✔ the personal project is submitted; the next week opens and carries both projects forward
- `tests/web-module-steps.browser.mjs` on the teacher's **revised** Weeks 1–3 (sample-first, 22 tasks, answers
  in `solutions/`):
  - Cloudflare runtime: 9 pass, 5 skipped (old-format-only), 0 fail, two runs. ✔ "sample-first weeks (Java
    workflow): every step of Weeks 1–3 verifies its unchanged sample, then completes its task with the
    answer in solutions/" — all 22 steps "sample verified, task completed", media steps included.
  - Offline: 7 pass, 7 skipped (old-format-only, and two that need R2), 0 fail. Weeks 1–2 and Week 3 Step 1
    "sample verified, task completed"; Week 3 Steps 2–7 "teacher-checked (no media storage), marked done".
  - Teacher preview: every step's own sample passes, Week 1 included (its line break is fixed).
- Before the revision landed, the same test passed on the teacher's old-format files (13 pass, 1 skipped;
  one later run hit the CKB-080 flake) and on a scratch sample-first copy (9 pass, 5 skipped).

## Found and fixed

- CKB-083: after **Sample verified**, the result list re-judged the sample run against the task (✗ Page
  text matches, page checks gone). Broken: the first fixture subtest fails with exactly that cross;
  restored: 5/5.

## Not tested

- The Java personal-project browser test (`tests/personal-performance.browser.mjs`) was not re-run on this
  branch (this change touches only the web result list); PR #70 ran it.
- Hosted site, Firefox, Safari, phones. The DLL and printed modules (the revision chat checks those).

# CKB-080 fix: Run waits for a media step's media (2026-10-29)

Branch `fix/media-run-before-loaded`. Student **▶ Run code** and the teacher's **Run** on a media step say
**Loading media…** and stay off until this device has the module's media.

- `npm test` 409/409; `npm run lint` 0 errors; `npm run build:all` and the Cloudflare build pass.
- `tests/web-module-steps.browser.mjs` on the teacher's revised Weeks 1–3, Cloudflare runtime (8787, local
  R2); the student walk no longer waits for the media itself:
  - without the fix: 3 runs, 3 failed (student walk stopped at Week 3 Step 2 each time; teacher preview
    `✗ Page text matches` on Step 2 once);
  - with the fix: 6 runs, 6 passed (9 pass, 5 skipped, 0 fail), and 1 more after restoring it.
- `tests/web-sample-first.browser.mjs`: 5/5 on the Cloudflare runtime and 5/5 offline.
- Offline settings (3042): Weeks 1–3 7 pass, 7 skipped, 0 fail; media steps fall back to **Mark done**.
- Not tested: hosted site, slow networks (Run just stays on **Loading media…** longer), Firefox/Safari.
