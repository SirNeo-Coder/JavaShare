# Resume Week 10 verification

Responsive resume (RWD layouts), built as module `dotnet-1-r10` from `revision_tools/resume_w10/content.py`
(`revision_tools/resume_w01/build.py r10` and `revision_tools/build_tasks.py r10`). Nine steps, five days,
`sampleFirst: true`, one `activity.id` per step (`dotnet-1-r10-dD-sS-alter-v1`, all new), `previousModuleId: dotnet-1-r09`.
**This is the last week of .NET 1.** Everything below was run on this laptop; nothing is assumed.

## Decisions used (teacher, 2026-11-12)

- Juan's Week 2 picture, sound and video and his Week 7 gallery stay on `index.html`, so the six steps that run `index.html`
  (1, 3, 4, 7, 8 and 9) are media steps. Steps 2, 5 and 6 run `projects.html` and are checked automatically.
- **One new media file:** `images/juan_banner.svg`, 900 × 240, drawn on this laptop by `revision_tools/resume_w10/make_banner.py`
  (no people, nothing downloaded). Juan's other pictures are 160 × 110 and never need to shrink inside the page window, so
  without a picture that is really too wide the class would never see `max-width: 100%` do anything. Week 10 therefore has
  **eight** media files to upload.
- **One breakpoint only, `max-width: 900px`**, as in Week 9.
- Wednesday's template is `resume-template.css`, a ~20-line local stylesheet written for this course and kept in Juan's
  project (AGENTS.md rule 5: nothing may be loaded from the internet, so no framework link and no CDN).
- `srcset` and `sizes` are taught in a printed table only: every extra size would be another upload.
- Friday is one step (Step 9) with no new HTML or CSS. Answers live in `Week_10/solutions/<step id>/`, never in the JSON.

## What was built

- `DotNet1_Week_10.codeshare.json` — the CodeShare module (5 lessons, 9 steps, 21 ids).
- `DotNet1_Responsive_RWD_Module.pdf` — the printed module, 13 pages (pp. 1–8 from `source/`, task pages 9–13).
- `DotNet1_ILAW_Week_10.docx` — the DLL.
- `project_start/` (Week 9's finished files, byte-identical), `project_end/` (Juan's finished Week 10 site, the five project
  files and the eight media files), `solutions/` (9 task answers), `source/p1–p13.html`, `check_codeshare.py`,
  `check_web_steps.cjs`, `test_checker.py`.

## Steps and tasks

| Step | Day | Runs | Teaches | Task (changes the page text) |
|---|---|---|---|---|
| 1 | Mon | index.html | `display: grid`, `grid-template-columns: repeat(2, 1fr)`, `fr`, `gap` on the gallery | a fifth figure, which starts a new row |
| 2 | Mon | projects.html | `repeat(auto-fit, minmax(220px, 1fr))` replaces the flex column and its query | a third project card |
| 3 | Tue | index.html | Juan's 900px banner; `max-width: 100%` + `height: auto` on it and the gallery pictures | a `figure` and `figcaption` for the banner |
| 4 | Tue | index.html | the same two lines for the video and Juan's own picture | a description paragraph under the video |
| 5 | Wed | projects.html | the local template linked **before** `styles.css`; `.t-grid`, `.t-card` | the template's `.t-caps` on a heading (SEND ME A MESSAGE) |
| 6 | Wed | projects.html | Juan's own columns and gap win, because `styles.css` is linked later | a third card, laid out by his own rule |
| 7 | Thu | index.html | the two tables in one grid, with his own `max-width: 900px` query | a row in the education table |
| 8 | Thu | index.html | **broken on purpose:** `repeat(2, 1fr;` — the bracket is never closed | the repair, which brings the capitals back |
| 9 | Fri | index.html | Juan's finished responsive site: three grids, two queries, no new HTML or CSS | this week's skill |

Only **Step 8** changes the page text by itself (the first skill loses its capitals, the gallery's **New** tag joins its
caption's line, and Juan's picture stops floating, leaving a line holding one space). Every other step's grid, picture rule or
query moves boxes only, so its output is identical to an earlier step's.

## How it came out (real runs, Chromium, no internet)

Width is the whole risk of this week (CKB-112), so every output was produced at six widths with the teacher's checker —
696, 760, 800, 899 (the queries **on**) and 901, 1000 (**off**):

- All 18 outputs (9 samples + 9 task answers) are **byte-identical at every width**, and every page check returns the same
  value at every width. So no grid, no resized picture and no media query in this module changes the page text or a checked
  value, and a step passes wherever it runs.
- Verified behaviours behind the step texts: `display: grid` on a box whose children are already boxes leaves the page text
  exactly as it was, in HTML order (a box holding **inline** children is the exception: grid blockifies them, so
  `<span>A</span><span>B</span>` reads `AB` before and `A`, `B` after — measured after CodeRabbit raised it on PR #104;
  no sample in this week holds inline children in a grid); a track in `fr`/`minmax()`/`auto-fit` resolves to used pixels that follow the window (the
  gallery has 2 columns, the cards 2–4 depending on the width), so **no check reads a track**; `max-width` reads back as the
  literal `100%` at every width, so it is page-checkable, while `width`/`height` are not; without `max-width: 100%` the
  900px banner makes the page scroll sideways (`scrollWidth > clientWidth`) although the page text never changes;
  `display: gird` drops only its own declaration (the gap survives); a grid property written on the items does nothing;
  `@media (max-width: 900)` without its unit drops the whole query at every width; and a value whose bracket is never closed
  swallows **every later rule in the file** (W3C CSS Syntax), which is what Step 8 shows.
- **Two linked stylesheets** both apply in CodeShare's page window and in the checker, in the order written: the template's
  16px gap in Step 5, Juan's own 12px in Step 6, with the template's card border untouched in both.
- The printed module and the JSON agree: `revision_tools/consistency.py` → **ALL MATCH** (15 codes, 4 output parts,
  6 same-as lines, and all 9 task boxes).
- The printed module is **13 pages**, every page clearing its footer (lowest spare 0.06 in on p5, 0.07 in on p4).

## Readable contrast

Week 10 adds no colour of its own; it moves boxes and resizes pictures (the banner uses the same navy-to-maroon gradient as
Juan's `h1`). The colour chart carries Week 9's checked pairs forward and `content.py` re-asserts them on every build
(W3C WCAG 2.2 relative luminance): all 10 text pairs ≥ 4.5:1 and all 4 outline/border pairs ≥ 3:1, or the build fails.

## References (each opened 2026-11-12 with a web fetch; each says what the DLL cites it for)

MDN CSS grid layout (key concepts), `grid-template-columns`, `gap`, Sizing items in CSS, `max-width`, Responsive images,
Handling conflicts (the cascade), `@media`; W3C CSS Grid Layout Module Level 2, W3C CSS Syntax Module Level 3 (error
handling), W3C WAI Understanding Reflow; Common Sense Education Privacy & Safety. The URLs in `content.py` are the canonical
ones those pages reported, and each `REFS` entry quotes what that page itself states.

## Checks run

In `Resume/Week_10` (Python 3, `NODE_BINARY` set):

- `check_codeshare.py DotNet1_Week_10.codeshare.json --run --media-root project_end` → **PASS × 9**,
  "OK: 5 lessons, 9 steps, 21 ids, no problems found."
- `check_codeshare.py <answers_r10.json> --run --media-root project_end` (the answers in `solutions/`) → **PASS × 9**, OK.
- `check_codeshare.py <unchanged_r10.json> --run --media-root project_end` (each sample left unchanged against its *task*
  output) → **9 problem(s)**, every step failing, as it must: no task can be passed without making its change.
- `test_checker.py` → **Ran 29 tests, OK**. It runs every claim in the module's tables, practice notes, problem guide and the
  DLL's Predict/Debug lines that the page text or a page check can show.
- `revision_tools/consistency.py` → **ALL MATCH**. `bash revision_tools/run_checks.sh` now also runs Week 10, and a full
  run of it (every retired week and Resume Weeks 1–10) finished with **exit 0, no failures and ALL MATCH**, so the
  `build.py` and `build_tasks.py` changes this week broke no earlier week.
- The nine samples and the nine answers were also run through **CodeShare's own `buildTeacherPreview`**, inside a body with
  `zoom: 1.15`, in frames of 760, 820 and 1100 px: page text and every page check identical to the JSON and to each other at
  every width.

### The width invariant was shown to have teeth

`test_checker.py::test_a_query_that_changed_the_page_text_would_be_caught` adds
`@media (max-width: 900px) { .motto { display: none } }` to Step 7's files and asserts the narrow text then differs from the
wide one; it does. The same style of break was run by hand against
`test_every_sample_and_task_output_is_the_same_at_every_width`, which failed at 696, 760, 800 and 899 px and passed again
when the rule was removed. The deliberate break was made on a copy; the real files were re-verified afterwards.

## CodeShare (the real app, local)

Offline settings (laptop Java), local Supabase in Docker, production build, port 3052;
`node --test --test-reporter=spec tests/web-module-steps.browser.mjs` → **15 passed, 6 skipped (the usual), 0 failed**.

- "sample-first weeks (Java workflow)" walks **every step of every built week**. On this offline server Week 10's Steps 2, 5
  and 6 reported "sample verified, task completed" with the answers from `solutions/<step id>/`; its six media steps (1, 3, 4,
  7, 8 and 9) reported "teacher-checked (no media storage on this server), marked done", which is what offline does. The media
  output of all nine steps is checked by the teacher's own checker instead (the `--media-root project_end` runs above, which
  include every `Media checks:` line).
- "teacher preview runs every step's own sample through the web check" also covers Week 10: Steps 2, 5 and 6 reported
  "pass (page text + 4–5 page checks)" and the six media steps "teacher-checked (expected output has Media checks)".
- New **Week 10 personal subtest**: the Week 9 submission carries forward; the student lays the gallery out as a grid with
  `repeat(auto-fit, minmax(220px, 1fr))` and gives every picture `max-width: 100%`; the test measures that a module step's
  preview is ≤ 900 px while the personal project's is > 900 px with more than one column, then narrows the **browser** window
  to 820 px, which drops the grid to one column while the **whole page text** and every other computed value stay identical.
  Submit freezes the files and the teacher's review runs them without changing the student's progress.
  Screenshot: `/tmp/codeshare-web-student-week10.png`.
- "a module page loads nothing from outside CodeShare (rule 5)" still passes.
- One run in three failed in the middle (a 401 on a media route and `.classroom-workspace` never appearing, from Week 6 on);
  the same suite passed before and after it with no change to the code. Recorded here as a flake, not reproduced.

## Two wording fixes after the app runs

After the browser tests, two pieces of wording were corrected and everything above was re-run: Friday's analogy no longer
uses the word "folder" (CKB-085's sweep), and task page 12's checklist line about guessing the width was garbled. The JSON
difference between the version the browser tests walked and the delivered one is **one line** — the Friday analogy's
`markdown`, a text block — so no step, file, expected output or page check changed; `diff` of the two JSON files shows only
that line. The checkers, `test_checker.py`, `consistency.py`, the 13-page render and the page-window runs were all repeated
on the delivered files.

## Pull request

The repository side (docs, the Week 10 personal subtest, the CKB-112 additions and the four CodeRabbit fixes from PR #102) is
on branch `docs/net-resume-week-10`. The module files themselves (this folder) are not in the repository.

## Not verified

- Nothing was deployed. The hosted Supabase project, Cloudflare, Vercel and Render were not touched, and no migration was run.
- No real class has used this module; no student or teacher other than the test accounts has opened it.
- The module's media files are Juan's seven existing ones plus the new banner. Uploading them to Cloudflare R2 for a real
  class is the teacher's step.
- `srcset` and `sizes` are printed knowledge only: no sample uses them, so CodeShare's handling of them is unproven.
- The exact pixel widths of the previews are not asserted, only their relation to the 900 px breakpoint and the number of
  grid columns, so the test stays correct if the page window's layout is retuned.
