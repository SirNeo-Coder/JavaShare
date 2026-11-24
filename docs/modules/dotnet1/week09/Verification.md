# Resume Week 9 verification

Flexbox and media queries, built as module `dotnet-1-r09` from `revision_tools/resume_w09/content.py`
(`revision_tools/resume_w01/build.py r09` and `revision_tools/build_tasks.py r09`). Nine steps, five days,
`sampleFirst: true`, one `activity.id` per step (`dotnet-1-r09-dD-sS-alter-v1`, all new), `previousModuleId: dotnet-1-r08`.
Everything below was run on this laptop; nothing is assumed.

## Decisions used

- Juan's Week 2 picture, sound and video and his Week 7 gallery stay on `index.html` (teacher, 2026-11-11), so the six steps
  that run `index.html` (1, 3, 4, 5, 8 and 9) are media steps. Steps 2, 6 and 7 run `projects.html` or `contact.html` and are
  checked automatically.
- The breakpoint is `max-width: 900px` (teacher, 2026-11-11). Kept after CKB-112 (below) showed the premise behind it was only
  half true: it is on for the module steps, and off in a personal project until the browser window is made narrower.
- Step 3's task reuses a picture Juan already has (`images/tree_planting.svg` with a new caption), so the teacher uploads **no
  new media file** for Week 9.
- Friday is one step (Step 9) with no new HTML or CSS. Answers live in `Week_09/solutions/<step id>/`, never in the JSON.

## What was built

- `DotNet1_Week_09.codeshare.json` — the CodeShare module (5 lessons, 9 steps, 21 ids).
- `DotNet1_Flexbox_Media_Queries_Module.pdf` — the printed module, 13 pages (pp. 1–8 from `source/`, task pages 9–13).
- `DotNet1_ILAW_Week_09.docx` — the DLL.
- `project_start/` (Week 8's finished files), `project_end/` (Juan's finished Week 9 site), `solutions/` (9 task answers),
  `source/p1–p13.html`, `check_codeshare.py`, `check_web_steps.cjs`, `test_checker.py`.

## Steps and tasks

| Step | Day | Runs | Teaches | Task (changes the page text) |
|---|---|---|---|---|
| 1 | Mon | index.html | `display: flex`, `flex-direction: column`, `gap` on the skills | a third skill |
| 2 | Mon | projects.html | a second flex container: the project cards | a third project card |
| 3 | Tue | index.html | flexbox replaces float in the gallery; `flex-wrap: wrap` | a fifth figure (reuses a picture), which wraps |
| 4 | Tue | index.html | a flex row for the nav bar | a fourth nav item |
| 5 | Wed | index.html | a media query stacks the nav on a narrow page | one more interest |
| 6 | Wed | projects.html | a media query turns the card column into a wrapping row | a third project card |
| 7 | Thu | contact.html | a flex column for the contact form | a "Your class" field |
| 8 | Thu | index.html | **broken on purpose:** the flex container is gone and the items are `display: inline` | the repair, which changes the page text |
| 9 | Fri | index.html | Juan's finished site: five flex containers, two media queries | this week's skill |

Only **Step 4** and **Step 8** change the page text by themselves (Step 4 turns one line of nav links into three, because each
flex item becomes a box of its own; Step 8 runs the two skills together onto one line). Every other step's flexbox or media
query moves boxes only, so its output is identical to an earlier step's.

## How it came out (real runs, Chromium, no internet)

Width is the whole risk of this week, so every output was produced at five widths with the teacher's checker
(`check_web_steps.cjs`, viewport patched per run) — 696, 760, 800, 899 (the query **on**) and 901, 1000 (the query **off**):

- All 18 outputs (9 samples + 9 task answers) are **byte-identical at every width**, and every page check returns the same
  value at every width. So no media query in this module changes the page text or a checked value, and a step passes wherever
  it runs.
- Verified behaviours behind the step texts: `display: flex` + `flex-direction: column` on block-level `li` leaves the page text
  exactly as it was; `display: flex` on `nav ul` (whose `li` were `inline-block`) splits `HOME PROJECTS CONTACT` into three
  lines; `display: inline` on `li` with no flex container runs them onto one line
  (`TYPING DOCUMENTS Making slide presentations`); `gap` is never page text and does nothing without `display: flex`;
  `float: left` on a flex item still computes to `left` but changes neither layout nor page text; `(max-width: 900)` without its
  unit drops the whole query at every width.
- The printed module and the JSON agree: `revision_tools/consistency.py` → **ALL MATCH** (11 codes, 6 output parts, 4 same-as
  lines, and all 9 task boxes).
- The printed module is **13 pages**, every page clearing its footer (lowest spare 0.02 in on p6).

## Readable contrast

Week 9 adds no colour of its own; it moves boxes. The colour chart carries Week 8's checked pairs forward and
`content.py` re-asserts them on every build (W3C WCAG 2.2 relative luminance): all 10 text pairs ≥ 4.5:1 and all 4
outline/border pairs ≥ 3:1, or the build fails.

## References (each opened 2026-11-11 with a web fetch; each says what the DLL cites it for)

MDN Flexbox (learn), `flex-direction`, `gap`, `flex-wrap`, `@media`, Using media queries, the `width` media feature;
W3C CSS Flexible Box Layout Module Level 1 (float and clear do not float a flex item or take it out-of-flow);
W3C WAI Understanding Reflow; Common Sense Education Privacy & Safety. The URLs in `content.py` are the canonical ones those
pages reported, and each `REFS` entry quotes what that page itself states.

## Checks run

In `Resume/Week_09` (Python 3, `NODE_BINARY` set):

- `check_codeshare.py DotNet1_Week_09.codeshare.json --run --media-root project_end` → **PASS × 9**,
  "OK: 5 lessons, 9 steps, 21 ids, no problems found."
- `check_codeshare.py <answers_r09.json> --run --media-root project_end` (the answers in `solutions/`) → **PASS × 9**, OK.
- `check_codeshare.py <unchanged_r09.json> --run --media-root project_end` (each sample left unchanged against its *task*
  output) → **9 problem(s)**, every step failing, as it must: no task can be passed without making its change.
- `test_checker.py` → **Ran 22 tests, OK**. It runs every claim in the module's tables, practice notes, problem guide and the
  DLL's Predict/Debug lines that the page text or a page check can show.
- `revision_tools/consistency.py` → **ALL MATCH**.

Two authoring errors were caught by `test_checker.py` before delivery and fixed: Step 9 said "four flex containers" when the
stylesheet has five (the nav bar was forgotten), and Step 6 claimed its output was "the same as Step 2's" when the nav bar
differs there (Step 4 had made it a flex row).

### The width invariant was shown to have teeth

`test_checker.py::test_every_sample_and_task_output_is_the_same_at_every_width` was proved to catch a violation: adding
`@media (max-width: 900px) { .motto { display: none } }` to Step 5 made it fail at 760, 800 and 899 px
(`'…tto\nWeekly clubs…' != '…tto\nLearn a little every day,…'`); removing it again passed. The deliberate break was made on a
copy of the JSON, which was then restored and re-verified.

## CodeShare (the real app, local)

Offline settings (laptop Java), local Supabase in Docker, production build, port 3072;
`node --test --test-reporter=spec tests/web-module-steps.browser.mjs` → **14 passed, 6 skipped (the usual), 0 failed**.

- "sample-first weeks (Java workflow)" walks **every step of every built week**. On this offline server Week 9's Steps 2, 6
  and 7 reported "sample verified, task completed" with the answers from `solutions/<step id>/`; its six media steps (1, 3, 4,
  5, 8 and 9) reported "teacher-checked (no media storage on this server), marked done", which is what offline does. The
  media output of all nine steps is checked by the teacher's own checker instead (the `--media-root project_end` runs above,
  which include every `Media checks:` line).
- "teacher preview runs every step's own sample through the web check" also covers Week 9: Steps 2, 6 and 7 reported
  "pass (page text + N page checks)" and the six media steps "teacher-checked (expected output has Media checks)",
  because this server has no media storage.
- New **Week 9 personal subtest**: the Week 8 submission carries forward; the student makes the skills list a flex column and
  adds the `max-width: 900px` query; Submit freezes the files; the teacher's review runs the frozen files and never changes the
  student's progress. It also measures the widths (see below). Screenshot: `/tmp/codeshare-web-student-week9.png`.
- "a module page loads nothing from outside CodeShare (rule 5)" still passes.

### CKB-112 — the preview runs at different widths in different places

The Week 9 personal subtest **failed on first run** and uncovered this: a `max-width: 900px` query is on for a module step but
off in a personal project. The page window is `width:min(1180px,100%)` with the web-checks panel in a second grid column, and
`.page-window .module-web-preview:last-child { grid-column:1/-1 }` makes a preview with no checks panel span the whole window.
So a module step's preview is narrower than 900 px (query on), a personal project's is wider (query off), and the teacher's
checker is a third width again (1000 px). The subtest now asserts all three, and that narrowing the browser window to 820 px
takes the preview below the breakpoint, turns the query on, and leaves the page text and every other computed value identical.

The breakpoint was kept; the module content was corrected instead. The module, the task pages and the DLL no longer say
"drag the page window" (it cannot be dragged): they say the module step's page is already narrow, and that in your own project
you make the **browser** window narrower and the page window follows it. Recorded as CKB-112 with its index and prompt-map rows,
and in `docs/course-format.md`.

## Pull request

The repository side (docs, the Week 9 personal subtest and the CKB-112 record) is
[PR #102](https://github.com/SirNeo-Coder/JavaShare/pull/102) on branch `docs/net-resume-week-09`. The module files themselves
(this folder) are not in the repository.

## CodeRabbit review (PR #102, checked 2026-11-12)

Four findings, all valid and all in this week's own new text; all fixed with the teacher's approval:

1. `flex-direction` had been listed among the values that agree between CodeShare's page window and the checker — but that is
   exactly what a media query changes. The guidance now covers only values that are the same at every width.
2. "`gap` does nothing without `display: flex`" is wrong: `gap` also works on grid and multicolumn containers. Corrected.
3. A personal project's preview is **not** always wider than 900 px. The page window is `min(1180px,100%)`, so a narrow
   browser window takes it back below the breakpoint (776 px at an 820 px viewport). The module now tells students to narrow
   the browser window if their query is off and widen it if it is already on, which is better advice in either case.
4. The Week 9 personal subtest compared only two lines of the page text while claiming the whole text was unchanged. It now
   captures and compares the complete page text at both widths. Shown failing first: a query hiding the `h1` on a narrow page
   (outside the old two-line window) passed before the change and fails after it.

The module was rebuilt for finding 3 and every check above re-run: 9/9 samples, 9/9 task answers, all 9 unchanged samples
failing, `test_checker.py` 22/22, `consistency.py` ALL MATCH, 13 pages all clearing their footers, browser test 14 pass /
6 skipped / 0 fail. None of the four is a CodeShare bug, so none got a CKB record.

## Not verified

- Nothing was deployed. The hosted Supabase project, Cloudflare, Vercel and Render were not touched, and no migration was run.
- Cloudflare's runtime (`npm run cf:preview`, port 8787) was **not** run for this week; the browser test was run on the offline
  production server only. Earlier weeks were checked on 8787 as well.
- No real class has used this module; no student or teacher other than the test accounts has opened it.
- The module's media files are Juan's existing ones. Uploading them to Cloudflare R2 for a real class is the teacher's step, and
  Week 9 adds no new media file to upload.
- The exact pixel widths of the previews are not asserted, only their relation to the 900 px breakpoint (≤ 900 for a module
  step, > 900 for a personal project), so the test stays correct if the page window's layout is retuned.
