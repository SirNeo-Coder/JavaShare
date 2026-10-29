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
