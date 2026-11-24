# Resume Week 6 verification

.NET 1 · Week 6 · Box model, list and link styling · built 2026-11-09 for Ireneo D. Seraspe Jr., Cielito Zamora Senior High
School. Dates, grade and sections stay blank. This checks the files on the teacher's laptop and CodeShare run locally (local
Supabase, local R2 on Cloudflare's runtime); it is not the hosted site or classroom devices.

## Decisions used

- Rolling weekly prompt (Week 6) and the teacher's answers of 2026-11-09 ("Keep them (Recommended)", "Yes, a list
  (Recommended)", "Yes, add it (Recommended)", then "Approved"): Juan's Week 2 picture, sound and video stay on index.html,
  so only the steps that run index.html (1, 5 and 9) are media steps (offline the teacher presses Mark done on those three);
  the other six run projects.html or contact.html and are checked automatically online and offline. Juan's navigation becomes
  a list of links on all three pages (the course map's "navigation bar"). A Week 6 personal-project subtest is added to
  CodeShare's browser test.
- Guide Quarter 2, competencies 3 and 4 (course map, Week 06), with the guide Quarter 2 content and performance standards in
  the DLL. Friday: one step, Juan's finished site, no new HTML or CSS. Both Thursday repairs change the page text.
- Juan Dela Cruz and every detail about him are made up. Week 6 adds no new media: project_end/ holds Week 2's drawn picture,
  generated tune and recorded video (made on this laptop by `revision_tools/resume_w02/make_media.py`).
- Only fonts and colours already on the computer; nothing named in CSS `url()`. Every attribute value is in quotes (CKB-094);
  every page and styles.css stay in the top folder, no `media` on a link line (CKB-095); no broken quote before an iframe
  (CKB-093); no `src` page check (CKB-086, CKB-092).

## What was built

| File | What it is |
| --- | --- |
| `DotNet1_Week_06.codeshare.json` | Module `dotnet-1-r06`, `"sampleFirst": true`, `previousModuleId` `dotnet-1-r05`, starter = Juan's four Week 5 files, 5 lessons, 9 steps (Steps 1, 5 and 9 media steps, `includeMediaOutput`), each with page checks and one task (`<step id>-alter-v1`), 5 exit slips (15/20/15/15/20), performance task (50 points) with starter pages (nav as a list) and a starter styles.css. |
| `DotNet1_Box_Model_Lists_Links_Module.pdf` | 12 pages of 612 × 936 pt: lessons pp. 1–6, strips pp. 7–8, task pages pp. 9–12 (p. 10: "before you style" list and a box sketch; p. 12: self-check, presentation notes, Week 7 note, link-colour chart, starter stylesheet). |
| `DotNet1_ILAW_Week_06.docx` | DLL from Resume Week 5's DLL; 7 pages when rendered; guide Quarter 2 standards. |
| `source/` | p1–p8 (`revision_tools/resume_w01/build.py r06`), p9–p12 (`revision_tools/build_tasks.py r06`), `style.css`, `tasks.css`. |
| `solutions/<step id>/` | The answer to each task, as the files that step lists (never in the JSON). |
| `project_start/` | = `Resume/Week_05/project_end/` (Juan's three pages, styles.css and media). |
| `project_end/` | Juan's finished Week 6 site (index.html as in Step 5, projects.html as in Step 6, contact.html as in Step 2, styles.css as in Step 6) and the same three media files as Weeks 2–5. `Resume/project/` is the same. |
| `check_codeshare.py`, `check_web_steps.cjs` | Copied unchanged from `Resume/Week_05/`. |
| `test_checker.py` | Week 6 checker tests (27). |

Teacher's tools changed (originals in `revision_tools/before_revision/before_r06/`): `resume_w01/build.py` (usage line; the
"same as" output line takes `SAME_NOTE` from the content file, Weeks 1–5 keep their wording), `tasks.py` (loads r06),
`build_tasks.py` (r06 task pages: the "before you style" list, a box sketch, presentation notes, the Week 7 note; the chart
and the starter stylesheet print in two columns from Week 6 on), `render_r01.sh` (`WEEK=06`), `run_checks.sh` (Resume Week 6
section). New: `resume_w06/content.py` (the one source; it computes every contrast ratio). `consistency.py`, `answers_json.py`
and `unchanged_json.py` were backed up but not changed. Course map: Week 06 "CodeShare readiness" line and the CodeShare
bullet of "Checks and decisions to retain" (original in `before_revision/DotNet1_Course_Map_before-r06.md`). Handover:
original in `before_revision/DotNet1_Handover_2026-11-09_before-r06.md`.

Weeks 1–5 rebuilt with the changed tools into their real folders (after a full backup of `Resume/`): every JSON, page, answer,
project file and DLL part came out identical, except Resume Week 1's `source/tasks.css`, which already differed in the Week 4
and Week 5 checks. The backup was then restored, so no Week 1–5 file changed.

## Steps and tasks

| Step | Run page · files | Sample | Task | Why it exercises the lesson |
| --- | --- | --- | --- | --- |
| 1 (Mon, media) | index · index, styles.css | h2: `border-bottom: 2px solid #8a1c55; padding-bottom: 0.25em; margin-top: 1.5em` | a Volunteer work heading and paragraph | one box rule spaces every section |
| 2 (Mon) | projects · projects, contact, index, styles.css | the nav becomes a ul of links on all three pages; `nav ul { list-style-type: none; margin: 0; padding: 0; }` → HOME, PROJECTS, CONTACT on three lines | `nav li { display: inline; }` → HOME PROJECTS CONTACT | a list becomes a nav bar |
| 3 (Tue) | projects · projects, contact, styles.css | nav li inline-block, `margin-right: 0.5em`; badges `padding: 0.25em 0.5em`, `border: 1px solid #b45309`; iframe `border: 2px solid #13305c`, `margin-top: 0.5em` | `<p class="note">` + `.note` (border, padding, margin) | the student writes all four layers |
| 4 (Tue) | contact · contact, styles.css | `input, select, textarea`: border-box, 300px, 4px padding, grey border | a Your school label and box | one rule sizes the new box too |
| 5 (Wed, media) | index · index, styles.css | `.skills` square bullets inside, no indent; `.next` upper-roman (III, II, I) | a third skill | the class reaches the new item |
| 6 (Wed) | projects · projects, contact, styles.css | link states in order; nav links white on navy, maroon under the mouse or keyboard; a body link to the full contact page | `.more` button-like link "Back to my resume", white on maroon | link states, colour and padding together |
| 7 (Thu) | projects · projects, contact, styles.css | no `;` after `margin-right: 0.5em` → `display` skipped too, nav on three lines | put it back → one line | a missing ; skips the next value |
| 8 (Thu) | contact · contact, styles.css | no `}` after the h2 rule → every later rule stops (nav in small letters on three lines, plain labels and boxes) | put it back → HOME PROJECTS CONTACT | one brace in a rule this page does not use |
| 9 (Fri, media) | index · all four files | Juan's finished site (output = Step 5) | `<p>Questions? <a href="contact.html">Send me a message</a>.</p>` | the link rules reach any new link |

## How it came out (real runs, Chromium, no internet; CodeShare's `buildTeacherPreview` in a sandboxed frame 800 px wide with its no-internet policy, and the teacher's checker at 1000 × 900: the same page text and the same page-check values in all 27 cases)

- Box values read in px: `padding-bottom: 0.25em` on a 24px h2 → `6px`; `margin-top: 1.5em` → `36px`; `0.25em 0.5em` on the 12px
  badges → `3px 6px`; `margin: 1em 0` on 16px text → `16px`, `0px`. `border-bottom` reads `2px solid rgb(138, 28, 85)` and its
  longhands `2px`, `solid`, `rgb(138, 28, 85)`; `border` reads `""` when the four sides differ (`2px solid rgb(19, 48, 92)` when
  they are the same); `padding` reads `0px 0px 6px`. A border with no style (`2px #8a1c55`) reads width `0px` and does not show;
  `border: solid` alone reads `3px` in the text colour. The browser's own iframe border reads `2px`, `inset`.
- Border widths in the real page window (found on Cloudflare's runtime, CKB-097): CodeShare zooms its screen by the text-size
  setting (`body { zoom: var(--ui-scale) }`, 1.15 at first, 1 to 1.45), and Chromium draws a border in whole screen dots, so
  in the page window a 2px border reads `1.73913px` (1px `0.869565px`; at zoom 1.25 `1.6px`, at 1.45 `1.37931px`; the same on
  a 1× and a 2× screen), while padding (`6px`), margins (`36px`) and widths stay as written. The first browser run, with a
  `border-bottom-width` `2px` check on Step 1, failed (`dotnet-1-r06-d1-s1: sample NOT verified — ✗ h2 has
  border-bottom-width: 2px — found 1.73913px`; the Week 6 personal subtest read `1.73913px` too). So no Week 6 page check
  reads a border width; borders are checked by style and colour, and the module says why (p. 3).
- `width: 300px` reads `300px` with and without `box-sizing: border-box`; measured on screen, the boxes are 300px wide with it
  and 310px without it (the select stays 300px: it is `border-box` by default). So the page checks read `box-sizing` itself.
- Values that follow the window: `width: 50%` read 392px in CodeShare's 800 px frame and 492px in the checker; `margin: 0 auto`
  read 196px against 246px; an h2 with no width 784px against 984px. None is page-checked; a guard test refuses width checks
  that the stylesheet does not set in px.
- Margins between two blocks: a list with `margin-bottom: 20px` above an h2 with `margin-top: 30px` leaves a 30px gap
  (measured in both), each still reporting its own margin.
- Nav made from a list: list items alone give three lines (`HOME`, `PROJECTS`, `CONTACT`); `display: inline` or `inline-block`
  gives `HOME PROJECTS CONTACT`; `display: flex` on the ul gives three lines again; li tags typed with no space between them
  give `HOMEPROJECTSCONTACT` with inline and inline-block alike.
- Lists: `list-style-type` reads `square`, `upper-roman`, `none`, `disc`, `circle` (nested ul), `upper-alpha` (type="A");
  `list-style-position` reads `inside`; a CSS list style beats the `type` attribute (`ol { list-style-type: decimal; }` makes
  type="A" read `decimal`); markers never change the page text.
- Links: a plain link reads `rgb(0, 0, 238)` and `underline`; Juan's nav links read `rgb(255, 255, 255)`, `rgb(19, 48, 92)`,
  padding-left `12px`, `none`; his body link `rgb(19, 48, 92)`, `underline`. `a:link` matches every link; `a:visited`,
  `a:hover` and `a:focus` match nothing in a check; a style check on `a:hover` makes the teacher's checker wait 30 seconds and
  fail (CodeShare reads `null`).
- Spacing mistakes: `padding: 10`, `1.5 em`, `pading`, a negative padding each drop only that declaration (`0px`, or the
  browser's own `19.92px` top margin for an h2); a negative margin works (`-5px`); a missing `;` after `margin-right: 0.5em`
  drops `display` too (the nav falls onto three lines); a missing `}` after the h2 rule stops every later rule (the nav
  loses its capitals and its bullets come back; labels `400`, the form note `rgb(34, 34, 34)`, boxes `content-box`); a missing
  last `}` changes nothing.
- Every claim in the module's tables, practice notes and problem guide, and in the DLL's Predict/Debug lines, came from these
  runs (`test_checker.py` repeats them, except the on-screen widths and gaps, which the checker cannot measure).

## Readable contrast (W3C WCAG 2.2: 4.5:1 normal text, 3:1 large text and borders)

Computed in `revision_tools/resume_w06/content.py`: relative luminance of each sRGB colour, ratio (L1 + 0.05) / (L2 + 0.05).
Text on a gradient is checked at 101 points; opacity is blended with the page first. The build stops if any pair is below
4.5:1 or any border below 3:1.

| Text on background | Colours | Ratio |
| --- | --- | --- |
| Juan's name (h1, large), white on the gradient | #ffffff on #13305c → #8a1c55 | 8.83 (lowest point) |
| Body text and list items | #222222 on #ffffff | 15.91 |
| Paragraphs and labels | #333333 on #ffffff | 12.63 |
| h2 headings (large), maroon | #8a1c55 on #ffffff | 8.83 |
| My motto heading (large), green | #2e7d32 on #ffffff | 5.13 |
| Form note, red | #9b1c1c on #ffffff | 8.15 |
| Badges on their gradient | #222222 on #fff3c4 → #ffe08a | 12.33 (lowest point) |
| Small print at opacity 0.75 | #666666 seen on #ffffff | 5.74 |
| Nav links, white on navy | #ffffff on #13305c | 13.08 |
| Nav links under the mouse or keyboard | #ffffff on #8a1c55 | 8.83 |
| Links, navy | #13305c on #ffffff | 13.08 |
| Visited links, purple | #551a8b on #ffffff | 11.01 |
| Links under the mouse | #13305c on #fff3c4 | 11.76 |
| Visited links under the mouse | #551a8b on #fff3c4 | 9.90 |
| Links being clicked | #8a1c55 on #fff3c4 | 7.94 |

Borders (3:1): h2 line 8.83; badge border on its gradient 3.89 (lowest point), on white 5.02; frame border 13.08; form box
border 7.46. Why both nav link states set white: browser purple on the navy bar would be 1.19, browser blue 1.39 (the build
checks they stay below 3:1). Task page 12 prints a chart of 15 checked link-colour pairs (rounded down) for students to pick from.

## Checks run (2026-11-09, `bash revision_tools/run_checks.sh` from the Net Files folder; every section of every week passed)

**Resume Week 6 samples** (`check_codeshare.py DotNet1_Week_06.codeshare.json --run --media-root project_end`)

```text
PASS dotnet-1-r06-d1-s1
PASS dotnet-1-r06-d1-s2
PASS dotnet-1-r06-d2-s3
PASS dotnet-1-r06-d2-s4
PASS dotnet-1-r06-d3-s5
PASS dotnet-1-r06-d3-s6
PASS dotnet-1-r06-d4-s7
PASS dotnet-1-r06-d4-s8
PASS dotnet-1-r06-d5-s9
OK: 5 lessons, 9 steps, 21 ids, no problems found.
```

**Resume Week 6 task answers (solutions/)**: the same 9 PASS lines and `OK: 5 lessons, 9 steps, 21 ids, no problems found.`

**Unchanged samples against task outputs (every step must fail)**: `9 problem(s)`, one `Output differs` line per step.

**test_checker.py** (`python3 test_checker.py -v`)

```text
test_a_missing_brace_stops_every_later_rule ... ok
test_a_missing_semicolon_skips_display_too ... ok
test_a_step_without_its_stylesheet_fails_on_its_own ... ok
test_all_nine_samples_pass_with_juans_media ... ok
test_both_thursday_repairs_change_the_page_text ... ok
test_box_sizing_is_read_itself_because_the_width_reads_300px_either_way ... ok
test_box_values_read_in_px_and_border_longhands ... ok
test_changed_output_fails_then_restored_output_passes ... ok
test_duplicate_id_rejected ... ok
test_each_nav_li_on_its_own_line_and_nothing_uses_url ... ok
test_every_contrast_pair_and_border_reaches_its_minimum ... ok
test_every_step_runs_from_its_own_files_alone ... ok
test_every_value_in_quotes_ckb_094 ... ok
test_link_styles_plain_state_only ... ok
test_list_styles_are_not_page_text_and_beat_the_type_attribute ... ok
test_nav_list_page_text_blocks_inline_inline_block_and_no_spaces ... ok
test_never_a_page_check_on_link_or_style_elements ... ok
test_no_broken_quote_before_an_iframe_ckb_093 ... ok
test_no_page_check_on_a_border_width_ckb_097 ... ok
test_no_page_check_on_a_link_state ... ok
test_no_page_check_on_a_value_that_follows_the_window ... ok
test_no_src_page_check_on_an_iframe_or_uploaded_media_ckb_086_092 ... ok
test_only_the_index_html_steps_are_media_steps ... ok
test_pages_change_only_by_the_nav_list_two_list_classes_and_one_link ... ok
test_sides_table_and_the_frames_default_border ... ok
test_spacing_mistakes_drop_only_that_declaration ... ok
test_two_margins_that_meet_are_both_kept_in_their_own_checks ... ok
Ran 27 tests ... OK
```

Two tests failed on their first run because the tests themselves were wrong (a link count of 5 instead of 4; a window guard
that also refused an em margin); the tests were corrected, not the module.

Proofs the new guards catch what they guard (each on a changed copy in memory; the real files pass):

- Link states: with a `nav a:hover` check added to Step 6, `test_no_page_check_on_a_link_state` failed (`':hover' … is not
  None`). Restored: ok.
- Window sizes: with an `h2` `width` `984px` check added to Step 1, `test_no_page_check_on_a_value_that_follows_the_window`
  failed (`'width: 984px;' not found`). Restored: ok.
- li on their own lines: with two nav `li` tags joined in Step 2's index.html, `test_each_nav_li_on_its_own_line_and_nothing_uses_url`
  failed (`'</li><li>' unexpectedly found`). Restored: ok.
- Thursday repairs change the page text: with Step 7's task output set to its sample output,
  `test_both_thursday_repairs_change_the_page_text` failed. Restored: ok.
- Border widths (CKB-097): with Step 1's old `border-bottom-width` `2px` check put back,
  `test_no_page_check_on_a_border_width_ckb_097` failed. Restored: ok.

**Printed module vs JSON** (`consistency.py`): all 9 task boxes match; printed sample code and outputs on pp. 1–8 match
(16 code blocks, 8 output parts at their line numbers, 1 "same as" line checked against the step it names). `ALL MATCH`. The
same run still passes every check of Resume Weeks 1–5 and the retired Weeks 1–3.

**Personal project files**: the starter (its placeholder picture expected broken) and the example ran with no error.

**Word search** (DLL text, module PDF text, module source, JSON) for VS Code, Visual Studio, Chrome, Ctrl+O, folder, canteen,
pandesal, ADJUST THIS: 0 hits each. DLL: "(10 mins)" once, AI declaration once, teacher's name twice, 5 "Sample, then your
task:" lines, Reflections blank, guide Quarter 2 standards, 25 reference links (5 per day; 20 different addresses) plus the
curriculum-guide link. The one "Week 5" in the DLL is Monday's demo ("run Juan's Week 5 site"); "Text, font, colour" appears
once in the JSON, in `continues`.

**Rendering**: every module page (12) renders to exactly one 612 × 936 pt page; spare space 0.03–0.74 in (page 10, 0.03 in,
ends with the box sketch just above the footer); every page image inspected. Every DLL page (7) rendered with LibreOffice and
inspected.

## CodeShare browser test (`tests/web-module-steps.browser.mjs`, branch `docs/net-resume-week-06`)

Changed (approved 2026-11-09): a new Week 6 personal-project subtest. It carries the Week 5 submission forward, turns the nav
into a list on every page, adds the h2 box, the nav list rules and the nav link states to styles.css, runs, reads the page
window (nav page text, list, box and link values; no border width, CKB-097), follows the Projects link, submits and runs the
teacher's review.

Cloudflare's runtime (`opennextjs-cloudflare preview`, port 8787, local R2): 12 passed, 5 skipped, 0 failed. Media steps with
the teacher's files: Week 2 Steps 1–9, Week 3 Steps 1 and 9, Week 4 Steps 1, 3 and 9, Week 5 Steps 1, 6 and 9 and Week 6 Steps
1, 5 and 9 pass in the teacher preview (page text, page checks and 3 media lines each). Teacher preview without media: Week 6
Steps 2, 3, 4, 6, 7 and 8 pass (page text and 4–8 page checks each). Student walk, Week 6:

```text
dotnet-1-r06-d1-s1: sample verified, task completed
dotnet-1-r06-d1-s2: sample verified, task completed
dotnet-1-r06-d2-s3: sample verified, task completed
dotnet-1-r06-d2-s4: sample verified, task completed
dotnet-1-r06-d3-s5: sample verified, task completed
dotnet-1-r06-d3-s6: sample verified, task completed
dotnet-1-r06-d4-s7: sample verified, task completed
dotnet-1-r06-d4-s8: sample verified, task completed
dotnet-1-r06-d5-s9: sample verified, task completed
```

(Weeks 1–5: 45 more lines, all "sample verified, task completed".) Week 6 personal project: the page window showed
`HOME PROJECTS CONTACT` on one line, `none`, `0px`, `inline-block`, `8px`, white `rgb(255, 255, 255)` on navy
`rgb(19, 48, 92)`, `12px`, `none`, and the h2 line `solid` `rgb(19, 48, 92)` with `6px` and `36px`, on index.html and, through
the Projects link, on projects.html; Submit gave 100% with the pages and styles.css frozen and the media carried; the teacher's
review showed the same. The first run (with border widths still checked) failed at Step 1 and in this subtest with
`1.73913px` (CKB-097, above).

Offline settings (`next start`, port 3042, laptop Java): 11 passed, 6 skipped, 0 failed. Week 6: Steps 1, 5 and 9 "teacher-checked
(no media storage on this server), marked done"; Steps 2–4 and 6–8 "sample verified, task completed" (Weeks 1–5 as before). Week
6 personal project submitted at 100% (no media offline). `tests/web-sample-first.browser.mjs`: 6/6.

Proofs (offline settings, 3042, one run with two changed copies):

- A copy of the Resume weeks whose Step 7 answer still lacks the `;` stopped the walk at
  `dotnet-1-r06-d4-s7: task NOT completed — ✗ Page text matches; line 3: required "HOME PROJECTS CONTACT", page gave "HOME"`.
- A copy of the test whose Week 6 personal CSS drops `display: inline-block;` failed: the page window showed
  `'HOME\nPROJECTS\nCONTACT'` and `list-item`.

`npm test` 422/422, `npm run lint` 0 errors (8 old warnings), `npm run build:all` OK, Cloudflare build OK.

Visited links in the page window: not shown by a screenshot. A scratch check followed Juan's body link in the teacher's page
window and came back; the link stayed navy. But the control, the same pages over http in a plain headless tab with real
navigation, did not turn the link purple either, so headless Chromium cannot show the difference here. From the code: the page
window cancels every link click (`preventDefault`) and swaps the page itself, so the browser never visits the link's address
and cannot paint it as visited. Juan's nav sets white for both :link and :visited anyway.

## References (all opened 2026-11-09)

MDN: The box model; padding; border; margin; box-sizing; Mastering margin collapsing; Styling lists; list-style-type;
list-style-position; Styling links; :visited; Descendant combinator; Specificity; Introduction to CSS syntax; Debugging CSS.
W3C: CSS Box Model Module Level 3. W3C WAI: Understanding Contrast (Minimum); Understanding Focus Visible; Understanding
Non-text Contrast. Common Sense Education: Privacy & Safety. Each was checked to say what the DLL cites it for (for example
MDN border: "For a border to be displayed, the `<line-style>` component must be set"). MDN's "Privacy and the :visited
selector" address answered 404, so the DLL cites MDN's :visited page, which says the same (getComputedStyle "will lie").

## Not verified

- The hosted site, phones, browsers other than Chromium, the classroom Wi-Fi and printing on paper.
- Whether a visited link changes colour in the page window (above; headless Chromium showed no visited colour even in the
  control).
- How the borders look on screens at other text-size settings (the widths read 0.69–1.0 of the written value; the lines still
  show); classroom projectors.
- Offline media (not built yet); students' own phone media.
