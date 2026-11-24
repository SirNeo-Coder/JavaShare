# Resume Week 5 verification

.NET 1 · Week 5 · Text, font, colour, gradient and opacity · built 2026-11-09 for Ireneo D. Seraspe Jr., Cielito Zamora
Senior High School. Dates, grade and sections stay blank. This checks the files on the teacher's laptop and CodeShare run
locally (local Supabase, local R2 on Cloudflare's runtime); it is not the hosted site or classroom devices.

## Decisions used

- Rolling weekly prompt (Week 5) and the teacher's answers of 2026-11-09 ("Keep them (Recommended)", "Repairs that change
  text (Recommended)", "Yes, add it (Recommended)", then "approve"): Juan's Week 2 picture, sound and video stay on
  index.html, so only the steps that run index.html (1, 6 and 9) are media steps (offline the teacher presses Mark done on
  those three); the other six run projects.html or contact.html and are checked automatically online and offline. Both
  Thursday repairs change the page text, because a task is checked by its page text only (CodeRabbit, second review on
  PR #87). A Week 5 personal-project subtest is added to CodeShare's browser test.
- Later the same day the teacher approved fixing five stale browser-test lines (CKB-096, below) in the Week 5 pull request.
- Guide Quarter 2, competencies 1 and 2 (course map, Week 05), with the guide Quarter 2 content and performance standards
  in the DLL. Friday: one step, Juan's finished site, no new HTML or CSS.
- Juan Dela Cruz and every detail about him are made up. Week 5 adds no new media: project_end/ holds Week 2's drawn
  picture, generated tune and recorded video (made on this laptop by `revision_tools/resume_w02/make_media.py`).
- Only fonts and colours already on the computer; nothing named in CSS `url()`, no `@font-face`. Every attribute value is in
  quotes (CKB-094); every page and styles.css stay in the top folder (CKB-095). Juan's pages do not change this week; only
  styles.css does.

## What was built

| File | What it is |
| --- | --- |
| `DotNet1_Week_05.codeshare.json` | Module `dotnet-1-r05`, `"sampleFirst": true`, `previousModuleId` `dotnet-1-r04`, starter = Juan's four Week 4 files, 5 lessons, 9 steps (Steps 1, 6 and 9 media steps, `includeMediaOutput`), each with page checks and one task (`<step id>-alter-v1`), 5 exit slips (15/20/15/15/20), performance task (50 points) with starter pages and a starter styles.css. Thursday's lesson also holds Juan's contrast table and the students' contrast chart. |
| `DotNet1_Text_Font_Colour_Gradient_Opacity_Module.pdf` | 12 pages of 612 × 936 pt: lessons pp. 1–6, strips pp. 7–8, task pages pp. 9–12 (p. 12: self-check, Week 6 note, contrast chart, starter stylesheet). |
| `DotNet1_ILAW_Week_05.docx` | DLL from Resume Week 4's DLL; 7 pages when rendered; guide Quarter 2 standards. |
| `source/` | p1–p8 (`revision_tools/resume_w01/build.py r05`), p9–p12 (`revision_tools/build_tasks.py r05`), `style.css`, `tasks.css`. |
| `solutions/<step id>/` | The answer to each task, as the files that step lists (never in the JSON). |
| `project_start/` | = `Resume/Week_04/project_end/` (Juan's three pages, styles.css and media). |
| `project_end/` | Juan's finished Week 5 site (the Week 4 pages and Step 6's styles.css) and the same three media files as Weeks 2–4 (`images/juan_profile.svg`, `audio/greeting.wav`, `video/juan_intro.webm`; 1 KB, 53 KB, 25 KB). `Resume/project/` is the same. |
| `check_codeshare.py`, `check_web_steps.cjs` | Copied unchanged from `Resume/Week_04/`. |
| `test_checker.py` | Week 5 checker tests (21). |

Teacher's tools changed (originals in `revision_tools/before_revision/before_r05/`): `resume_w01/build.py` (fills the DLL's
content and performance standards when the content file has `STANDARDS`, Week 5 on), `tasks.py` (loads r05 and keeps each
content module for `build_tasks.py`), `build_tasks.py` (r05 task pages; a task page with no task boxes; the contrast chart
from the content file; the starter stylesheet for Week 4 on), `render_r01.sh` (`WEEK=05`), `run_checks.sh` (Resume Week 5
section). New: `resume_w05/content.py` (the one source; it computes every contrast ratio). `consistency.py`,
`answers_json.py` and `unchanged_json.py` were backed up but not changed. Course map: Week 05 "CodeShare readiness" line and
the CodeShare bullet of "Checks and decisions to retain" (original in `before_revision/DotNet1_Course_Map_before-r05.md`).
Handover: original in `before_revision/DotNet1_Handover_2026-11-09_before-r05.md`.

Weeks 1–4 rebuilt with the changed tools into their real folders (after a full backup of `Resume/`): every JSON, page,
answer, project file and DLL part came out identical, except Resume Week 1's `source/tasks.css`, which already differed in
the Week 4 check (it was made before later task-page styles were added). The backup was then restored, so no Week 1–4 file
changed.

## Steps and tasks

| Step | Run page · files | Sample (styles.css) | Task | Why it exercises the lesson |
| --- | --- | --- | --- | --- |
| 1 (Mon, media) | index · index, styles.css | body `Verdana, Tahoma, sans-serif`; h1, h2 `Georgia, "Times New Roman", serif` | h2 `text-transform: capitalize;` → Goals This Term | a text property that changes letters |
| 2 (Mon) | projects · projects, contact, styles.css | h1 white on `linear-gradient(to right, #13305c, #8a1c55)` | `<p class="banner">` + `.banner` (white, maroon-to-navy gradient, uppercase) | writes a gradient; capitals prove the rule matched |
| 3 (Tue) | projects · projects, contact, styles.css | body `line-height: 1.5`; h1 uppercase, centred, `letter-spacing: 2px`, `line-height: 2` | `<p class="subtitle">` + `.subtitle` (centre, 1px, uppercase) | alignment and spacing on a new element |
| 4 (Tue) | contact · contact, styles.css | label bold, `1.1em` (17.6px); `#form-note` italic | label `text-transform: uppercase;` → YOUR NAME… | one rule reaches every label |
| 5 (Wed) | projects · projects, contact, styles.css | body `rgb(34, 34, 34)`; badges `linear-gradient(#fff3c4, #ffe08a)` | second badge: BEST POSTER | the gradient class reaches the new badge |
| 6 (Wed, media) | index · index, styles.css | `small { opacity: 0.75; }` | `<p><small>Updated every Friday.</small></p>` | faded words are still page text |
| 7 (Thu) | projects · projects, contact, styles.css | the h1 gradient without its `)` | put it back → HOME \| PROJECTS \| CONTACT, SOLO WORK | a missing bracket stops every later rule |
| 8 (Thu) | contact · contact, styles.css | no `;` after `color: #ffffff` (dark on dark, 1.2:1, small letters) | put it back → CONTACT JUAN | contrast repair the run can prove |
| 9 (Fri, media) | index · all four files | Juan's finished site (output = Step 6) | `<p class="badge">Thank you for reading my resume.</p>` | a shared class works on any page |

## How it came out (real runs, Chromium, no internet; CodeShare's `buildTeacherPreview` in its sandboxed frame with its no-internet policy, and the teacher's checker: the same in both)

- Fonts, sizes, spacing, colours, gradients and opacity are not page text. Computed values: `Verdana, Tahoma, sans-serif`;
  `"Trebuchet MS", Arial, sans-serif` and `'Courier New'` read with double quotes; `2em` → `32px`, `1.1em` of 16px →
  `17.6px`, `1.4rem` → `22.4px`, `0.05em` letter-spacing → `1.12px`; unitless `line-height: 1.5` → `24px`, `2` on a 32px h1
  → `64px`, not set → `normal`; `white` and `#ffffff` → `rgb(255, 255, 255)`; `rgba(255, 255, 255, 0.9)` kept as written;
  `text-decoration` → `underline` or `none`; `text-align` → `center`, or `start` when not set; `bold` → `700`.
- Gradients: `background-image` reads `linear-gradient(to right, rgb(19, 48, 92), rgb(138, 28, 85))`; `to bottom` is left out
  (`linear-gradient(rgb(255, 243, 196), rgb(255, 224, 138))`); `radial-gradient(circle, …)` as written. The `background`
  shorthand reads a long string (`rgba(0, 0, 0, 0) linear-gradient(…) repeat scroll 0% 0% / auto padding-box border-box`),
  so no page check uses it. Linear and radial gradients show in CodeShare's sandboxed page frame (screenshots taken).
- `opacity` reads `0.75`, `0`, `0.5`. Text at `opacity: 0`, at `opacity: 0.3`, or in `color: transparent` stays in the page
  text; `font-variant: small-caps` does not change it. `capitalize` changes labels and the button, not the select's options.
- A missing comma between gradient colours, `to rigth`, or `13305c` without `#` gives `background-image: none` and leaves
  every other rule working; `color: ffffff` drops only that colour. A missing `)` in the h1 gradient makes the rest of the
  file part of that value: the h1's later declarations and every later rule (h2, nav, .badge, p, label, small, #form-note)
  stop, so the navigation and badges lose their capitals. A missing `;` after `color: #ffffff` skips that declaration and
  the next one (`text-transform`), so the heading is dark grey and in small letters.
- Every claim in the module's tables, practice notes and problem guide, and in the DLL's Predict/Debug lines, came from these
  runs (`test_checker.py` repeats them).

## Readable contrast (W3C WCAG 2.2: 4.5:1 normal text, 3:1 large text)

Computed in `revision_tools/resume_w05/content.py`: relative luminance of each sRGB colour, ratio (L1 + 0.05) / (L2 + 0.05).
Text on a gradient is checked at 101 points along it (a gradient blends in sRGB) and the lowest ratio is kept; text under
`opacity` is blended with the white page first. The build stops if any pair is below 4.5:1.

| Text on background | Colours | Ratio |
| --- | --- | --- |
| Juan's name (h1, large), white on the gradient | #ffffff on #13305c → #8a1c55 | 8.83 (lowest point) |
| Body text and list items | #222222 on #ffffff | 15.91 |
| Paragraphs and labels | #333333 on #ffffff | 12.63 |
| h2 headings (large), maroon | #8a1c55 on #ffffff | 8.83 |
| My motto heading (large), green | #2e7d32 on #ffffff | 5.13 |
| Form note, red | #9b1c1c on #ffffff | 8.15 |
| Badges on their gradient | #222222 on #fff3c4 → #ffe08a | 12.33 (lowest point) |
| Small print at opacity 0.75 | #333333 → seen as #666666 on #ffffff | 5.74 |
| Navigation links (browser blue) | #0000ee on #ffffff | 9.40 |
| Visited links (browser purple) | #551a8b on #ffffff | 11.01 |

Broken on purpose (the build checks they stay below 3:1): Step 7, white h1 with no gradient on white, 1.00; Step 8, #222222
h1 on the gradient, 1.21. Colour never carries meaning alone: the red form note says "prototype" in words, the badges say
solo work / group work. Task page 12 prints a chart of 14 checked pairs (rounded down) for students to pick from.

## Checks run (2026-11-09, `bash revision_tools/run_checks.sh` from the Net Files folder; every section of every week passed)

**Resume Week 5 samples** (`check_codeshare.py DotNet1_Week_05.codeshare.json --run --media-root project_end`)

```text
PASS dotnet-1-r05-d1-s1
PASS dotnet-1-r05-d1-s2
PASS dotnet-1-r05-d2-s3
PASS dotnet-1-r05-d2-s4
PASS dotnet-1-r05-d3-s5
PASS dotnet-1-r05-d3-s6
PASS dotnet-1-r05-d4-s7
PASS dotnet-1-r05-d4-s8
PASS dotnet-1-r05-d5-s9
OK: 5 lessons, 9 steps, 21 ids, no problems found.
```

**Resume Week 5 task answers (solutions/)**: the same 9 PASS lines and `OK: 5 lessons, 9 steps, 21 ids, no problems found.`

**Unchanged samples against task outputs (every step must fail)**: `9 problem(s)`, one `Output differs` line per step.

**test_checker.py** (`python3 test_checker.py -v`)

```text
test_a_missing_bracket_stops_every_later_rule ... ok
test_a_missing_semicolon_after_the_colour_skips_the_capitals_too ... ok
test_a_step_without_its_stylesheet_fails_on_its_own ... ok
test_all_nine_samples_pass_with_juans_media ... ok
test_an_invalid_gradient_or_colour_drops_only_that_declaration ... ok
test_both_thursday_repairs_change_the_page_text ... ok
test_changed_output_fails_then_restored_output_passes ... ok
test_computed_values_named_colours_em_and_unitless_sizes ... ok
test_duplicate_id_rejected ... ok
test_every_contrast_pair_reaches_4_5_and_the_broken_samples_do_not ... ok
test_every_step_runs_from_its_own_files_alone ... ok
test_every_value_in_quotes_ckb_094 ... ok
test_font_lists_end_in_a_generic_family_and_nothing_uses_url ... ok
test_fonts_colours_and_gradients_are_not_page_text_but_the_page_check_sees_them ... ok
test_never_a_page_check_on_link_or_style_elements ... ok
test_no_broken_quote_before_an_iframe_ckb_093 ... ok
test_no_src_page_check_on_an_iframe_or_uploaded_media_ckb_086_092 ... ok
test_only_the_index_html_steps_are_media_steps ... ok
test_opacity_zero_and_transparent_text_stay_in_the_page_text ... ok
test_text_transform_changes_page_text_capitalize_also_on_a_button_not_on_options ... ok
test_week_5_changes_only_styles_css ... ok
Ran 21 tests ... OK
```

One test failed on its first run because the test itself restored the wrong line (it also changed the Tab title); the test
was corrected, not the module.

Proofs the new guards catch what they guard (each on a changed copy in memory; the real files pass):

- Thursday repairs change the page text: with Step 8's task output set equal to its sample output,
  `test_both_thursday_repairs_change_the_page_text` failed (`AssertionError: '…Contact Juan…' == '…Contact Juan…' :
  dotnet-1-r05-d4-s8`). Restored: ok.
- Font lists end in a generic family: with Step 1's body list cut to `Verdana, Tahoma`,
  `test_font_lists_end_in_a_generic_family_and_nothing_uses_url` failed (`'(serif|sans-serif|monospace)$' not found in
  'Verdana, Tahoma'`). Restored: ok.
- Contrast: with a #888888-on-white pair added to the computed pairs,
  `test_every_contrast_pair_reaches_4_5_and_the_broken_samples_do_not` failed. Restored: ok.

**Printed module vs JSON** (`consistency.py`): all 9 task boxes match; printed sample code and outputs on pp. 1–8 match
(11 code blocks, 6 output parts at their line numbers, 3 "same as" lines checked against the step they name; Step 9 printed
as the same files as Step 6). `ALL MATCH`. The same run still passes every check of Resume Weeks 1–4 and the retired Weeks 1–3.

**Personal project files**: the starter (its placeholder picture expected broken) and the example ran with no error.

**Word search** (DLL text, module PDF text, module source, JSON) for VS Code, Visual Studio, Chrome, Ctrl+O, folder, canteen,
pandesal, ADJUST THIS: 0 hits each. DLL: "(10 mins)" once, AI declaration once, teacher's name twice, 5 "Sample, then your
task:" lines, Reflections blank, no Week 4 lesson title, guide Quarter 2 standards, 25 reference links (5 per day; 20
different addresses) plus the curriculum-guide link. The one "Week 4" in the DLL is Monday's demo ("run Juan's Week 4 site").

**Rendering**: every module page (12) renders to exactly one 612 × 936 pt page; spare space 0.28–1.51 in; every page image
inspected. Every DLL page (7) rendered with LibreOffice and inspected.

## CodeShare browser test (`tests/web-module-steps.browser.mjs`, branch `docs/net-resume-week-05`)

Changed (approved 2026-11-09): a new Week 5 personal-project subtest; five lines that waited for "Submitted" now wait for
exactly that word (CKB-096, approved the same day; see below).

Cloudflare's runtime (`opennextjs-cloudflare preview`, port 8787, local R2): 11 passed, 5 skipped, 0 failed. Media steps
with the teacher's files: Week 2 Steps 1–9, Week 3 Steps 1 and 9, Week 4 Steps 1, 3 and 9 and Week 5 Steps 1, 6 and 9 pass in
the teacher preview (page text, page checks and 3 media lines each). Teacher preview without media: Week 5 Steps 2–5, 7 and 8
pass (page text and 4–5 page checks each). Student walk, Week 5:

```text
dotnet-1-r05-d1-s1: sample verified, task completed
dotnet-1-r05-d1-s2: sample verified, task completed
dotnet-1-r05-d2-s3: sample verified, task completed
dotnet-1-r05-d2-s4: sample verified, task completed
dotnet-1-r05-d3-s5: sample verified, task completed
dotnet-1-r05-d3-s6: sample verified, task completed
dotnet-1-r05-d4-s7: sample verified, task completed
dotnet-1-r05-d4-s8: sample verified, task completed
dotnet-1-r05-d5-s9: sample verified, task completed
```

(Weeks 1–4: 36 more lines, all "sample verified, task completed".) Week 5 personal project: the Week 4 submission (pages,
styles.css and media) carries forward; the student adds font lists and a gradient h1 with white capitals to styles.css and
runs; the page window shows the white capital heading on the navy-to-maroon gradient (computed `linear-gradient(to right,
rgb(19, 48, 92), rgb(138, 28, 85))`, `rgb(255, 255, 255)`, `Georgia, "Times New Roman", serif`, body `Verdana, Tahoma,
sans-serif`, line-height `24px`), the Projects link opens projects.html in the same window with the same styles, Submit gives
100% with styles.css frozen and the media carried; the teacher's review runs the frozen files with the same styles. This is
the real CodeShare page window showing a linear gradient (screenshot `/tmp/codeshare-web-student-week5.png`).
`tests/web-sample-first.browser.mjs`: 6/6. Runtime log: no errors.

Offline settings (`next start`, port 3042, laptop Java): 10 passed, 6 skipped, 0 failed. Week 5: Steps 1, 6 and 9
"teacher-checked (no media storage on this server), marked done"; Steps 2–5, 7 and 8 "sample verified, task completed"
(Week 1 9 completed; Week 2 9 marked done; Week 3 7 completed, 2 marked done; Week 4 6 completed, 3 marked done). Week 5
personal project submitted at 100% (no media offline). `tests/web-sample-first.browser.mjs`: 6/6.

CKB-096 (test only; CodeShare's problem record): PR #85 shows "Last submitted: <date>" as a second line in the student's action
bar, so the first offline run (3042) failed the Week 2–5 personal subtests at Submit with `strict mode violation:
locator('.actionbar .sync').filter({ hasText: 'Submitted' }) resolved to 2 elements` (the student walk passed). After the fix
they pass on both servers. A copy of `web-sample-first.browser.mjs` with the old line failed on 8787 (4 passed, 2 failed, the
same message); the fixed file passed 6/6.

Proofs (offline settings, 3042):

- A copy of the Resume weeks whose Step 7 answer still lacks the `)` stopped the walk at
  `dotnet-1-r05-d4-s7: task NOT completed — ✗ Page text matches; line 3: required "HOME | PROJECTS | CONTACT", page gave
  "Home | Projects | Contact"`: the Thursday repair is proven by the page text.
- A copy of the test whose Week 5 personal CSS drops the gradient's `)` failed: `styles.css reaches index.html…`, actual
  `[ 'My Resume', true, 'none', 'rgb(255, 255, 255)', …]` (no gradient).

`npm test` 422/422, `npm run lint` 0 errors (8 old warnings), `npm run build:all` OK, Cloudflare build OK.

## References (all opened 2026-11-09)

MDN: Fundamental text and font styling; font-family; color; Using CSS gradients; opacity; font-size; line-height;
letter-spacing; text-align; the color data type; linear-gradient(); background-image; CSS syntax; Debugging CSS. W3C: CSS Color
Module Level 4; WCAG 2.2 (contrast ratio and relative luminance). W3C WAI: Understanding Text Spacing; Understanding Contrast
(Minimum); Understanding Use of Color. Common Sense Education: Privacy and security. Each was checked to say what the DLL cites
it for (for example MDN line-height: "Use a minimum value of 1.5 for line-height for main paragraph content").

## Not verified

- The hosted site, phones, browsers other than Chromium, the classroom Wi-Fi and printing on paper.
- Fonts on classroom computers: Verdana, Tahoma, Georgia or Times New Roman may be missing there; the page then shows the
  next font in the list, and the page checks still pass (they read the declared list).
- How the gradient and faded text look on a classroom projector (contrast is computed, not measured on screen).
- Offline media (not built yet); students' own phone media.
