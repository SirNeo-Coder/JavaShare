# CKB-112 — a media query fires on a module step but not in a personal project (the preview runs at different widths)

- Status: resolved (no app change; a module-content and documentation fix)
- First recorded: 2026-11-11
- Last verified: 2026-11-11
- Area: `app/globals.css` (`.page-window`, `.page-window .module-web-preview:last-child`), Resume Week 9 module content,
  `tests/web-module-steps.browser.mjs` (Week 9 personal subtest)
- Search terms: media query does not fire, max-width 900px ignored, page window width, preview width differs, flex-direction row
  instead of column, breakpoint not firing in personal project, responsive layout looks wrong in my own project, RWD week

## Symptom

Resume Week 9 (flexbox and media queries) was written on the assumption that CodeShare's page window is about 800 px wide
everywhere, so a `@media (max-width: 900px)` query would always be on and the class would see the narrow layout. The Week 9
personal subtest then failed in the real app: in the student's **personal performance-task project** the query was off
(`nav ul` computed `flex-direction: row`, and the preview's `window.innerWidth` was above 900), although the same query was on
for the module steps. A student following the module would add a media query to their own resume and see nothing change.

## Root cause

The page window is `width:min(1180px,100%)` and lays its preview out in a two-column grid, with the web-checks panel in the
second column (`minmax(240px,380px)`). A **module step** has checks, so the preview takes only the first column and ends up
narrower than 900 px — the query is on. A **personal project** has no checks panel, so
`.page-window .module-web-preview:last-child { grid-column:1/-1 }` makes the preview span both columns and fill the page
window, which is wider than 900 px — the query is off. The teacher's checker is a third width again (1000 px). So the width a
page runs at depends on *where* it runs, and no single width can be assumed.

## Durable solution

Width is place-dependent; module content must never depend on a particular one:

- Keep the page text and every page-checked value identical at every width. Never put anything inside a media query that adds,
  removes or re-letters a word, and never page-check a property a query changes (Week 9 checks `display` and `flex-wrap`, never
  `flex-direction`, on the queried `nav ul` and `.project-list`). Otherwise a step that passes in the page window fails in the
  checker, or the other way round, and the student can never complete it.
- Tell students the truth about the two places: on a module step the page sits beside its checks and is already narrower than
  900 px, so the query is on; in their own project the page fills the page window, so the query is off until the **browser**
  window is made narrower. The page window itself cannot be dragged, but it follows the browser window. A personal project in an
  already narrow browser window can start below the breakpoint, so the window is widened first and then narrowed again
  (CodeRabbit on PR #102); Resume Week 10's module text and its task pages say so.
- `docs/course-format.md` records all three widths under "Flexbox and media queries".

## Regression proof

- `tests/web-module-steps.browser.mjs`, Week 9 personal subtest (offline settings, port 3072): asserts a module step's preview is
  `<= 900` px, the personal project's is `> 900` px with `nav ul` in a row, and that narrowing the browser window to 820 px puts
  the preview below the breakpoint, turns the query on (`column`) and leaves the page text and every other computed value
  identical. 14 passed, 6 skipped (the usual), 0 failed.
- Shown failing first: the subtest's original form asserted the query was on in the personal project and failed with
  `actual: [..., 'row', false]` against `expected: [..., 'column', true]`, which is what uncovered this.
- `Resume/Week_09/test_checker.py::test_every_sample_and_task_output_is_the_same_at_every_width` runs every sample and task
  answer at 760, 800, 899 and 1000 px. Proved to have teeth: adding `.motto { display: none }` inside the Step 5 query made it
  fail at all three narrow widths; removing it passed again.

## Also seen in

- 2026-11-12 (Resume Week 10): the same three widths with a grid. A track size in `fr`, `%`, `auto` or `minmax()` resolves to
  used pixels, and `repeat(auto-fit, minmax(...))` even changes the number of columns with the width, so Week 10 page-checks
  `display`, `gap` and `max-width` and never a track. Its `test_checker.py` runs every sample and task answer at 696, 760, 800,
  899, 901 and 1000 px, and the Week 10 personal subtest asserts the module step's preview is `<= 900` px, the personal
  project's is `> 900` px with more than one column, and that narrowing the browser window to 820 px drops it to one column
  with the whole page text and every other computed value unchanged.

## History

- 2026-11-11 — found while building Resume Week 9; the teacher had pre-approved the 900 px breakpoint on the stated premise that
  the page window is about 800 px. The premise holds for module steps only. No app change: the module text, the printed module,
  the task pages and `docs/course-format.md` were corrected instead, and the breakpoint was kept.
