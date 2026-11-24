# Resume Week 7 verification

.NET 1 · Week 7 · Position, z-index, float and an image gallery · built 2026-11-10 for Ireneo D. Seraspe Jr., Cielito Zamora
Senior High School. Dates, grade and sections stay blank. This checks the files on the teacher's laptop and CodeShare run locally
(local Supabase, local R2 on Cloudflare's runtime); it is not the hosted site or classroom devices.

## Decisions used

- Rolling weekly prompt (Week 7) and the teacher's answers of 2026-11-10 ("index.html (Recommended)", "Keep them (Recommended)",
  "Yes, 3 drawn pictures (Recommended)", "Yes, add it (Recommended)", then "approved"): Juan's Week 2 picture, sound and video stay
  on index.html and his gallery is on index.html too, so only the steps that run index.html (2, 4, 5, 6 and 9) are media steps
  (offline the teacher presses Mark done on those five); Steps 1, 3, 7 and 8 run projects.html and are checked automatically
  online and offline. Three drawn gallery pictures in `teacher_pictures/` for students with none. A Week 7 personal-project
  subtest is added to CodeShare's browser test.
- Guide Quarter 2, competencies 5 and 6 (course map, Week 07), with the guide Quarter 2 content and performance standards in the
  DLL. Friday: one step, Juan's finished site, no new HTML or CSS. Both Thursday repairs change the page text.
- Juan Dela Cruz and every detail about him are made up. Week 7's new media are four drawn SVG gallery pictures (his made-up
  science poster, comic strip, honours certificate and tree planting; no people) and three drawn teacher pictures, made on this
  laptop by `revision_tools/resume_w07/make_gallery.py`; nothing downloaded. Week 2's picture, sound and video are reused.
- Only fonts and colours already on the computer; nothing named in CSS `url()`. Every attribute value is in quotes (CKB-094);
  pages and styles.css in the top folder, no `media` on a link line (CKB-095); no broken quote before an iframe (CKB-093); no
  `src` page check (CKB-086, CKB-092); no border width, unset side, fixed or sticky offset page-checked (CKB-097, the window).

## What was built

| File | What it is |
| --- | --- |
| `DotNet1_Week_07.codeshare.json` | Module `dotnet-1-r07`, `"sampleFirst": true`, `previousModuleId` `dotnet-1-r06`, starter = Juan's four Week 6 files, 5 lessons, 9 steps (Steps 2, 4, 5, 6, 9 media steps, `includeMediaOutput`), each with page checks and one task (`<step id>-alter-v1`), 5 exit slips (15/20/15/15/20), performance task (50 points) with starter pages (a gallery and a ribbon) and a starter styles.css. |
| `DotNet1_Position_Float_Gallery_Module.pdf` | 13 pages of 612 × 936 pt: lessons pp. 1–6, strips pp. 7–8, task pages pp. 9–13 (p. 10: gallery sketch; p. 12: "before you build your gallery", self-check, presentation notes, Week 8 note, Check yourself table; p. 13: Juan's colour pairs, colour chart, starter stylesheet). |
| `DotNet1_ILAW_Week_07.docx` | DLL from Resume Week 6's DLL; 7 pages when rendered; guide Quarter 2 standards. |
| `source/` | p1–p8 (`revision_tools/resume_w01/build.py r07`), p9–p13 (`revision_tools/build_tasks.py r07`), `style.css`, `tasks.css`. |
| `solutions/<step id>/` | The answer to each task, as the files that step lists (never in the JSON). |
| `project_start/` | = `Resume/Week_06/project_end/`. |
| `project_end/` | Juan's finished Week 7 site (index.html as in Step 6, projects.html as in Step 1, contact.html unchanged, styles.css as in Step 6), Week 2's three media files and the four gallery pictures. `Resume/project/` is the same. |
| `teacher_pictures/` | `gallery_project.svg`, `gallery_certificate.svg`, `gallery_activity.svg` (drawn; no people). |
| `check_codeshare.py`, `check_web_steps.cjs` | Copied unchanged from `Resume/Week_06/`. |
| `test_checker.py` | Week 7 checker tests (23). |

Teacher's tools changed (originals in `revision_tools/before_revision/before_r07/`): `resume_w01/build.py` (usage line only),
`tasks.py` (loads r07), `build_tasks.py` (r07 task pages: five pages, body class `r7` with 6.7pt outputs, gallery sketch,
"before you build your gallery", self-check, notes, Week 8 note, Juan's colour pairs; progress table on page 12), `render_r01.sh`
(`WEEK=07`), `run_checks.sh` (Resume Week 7 section). New: `resume_w07/content.py` (the one source; it computes every contrast
ratio) and `resume_w07/make_gallery.py`. Course map: Week 07 "CodeShare readiness" line and the CodeShare bullet of "Checks and
decisions to retain" (original in `before_revision/DotNet1_Course_Map_before-r07.md`). Handover: original in
`before_revision/DotNet1_Handover_2026-11-10_before-r07.md`.

Weeks 1–6 rebuilt with the changed tools into their real folders (after a full backup of `Resume/`): every JSON, page, answer,
project file and DLL part came out identical, except each week's `source/tasks.css`, which gains the unused `.r7` rule (and
Resume Week 1's, which already differed). The backup was then restored, so no Week 1–6 file changed.

## Steps and tasks

| Step | Run page · files | Sample | Task | Why it exercises the lesson |
| --- | --- | --- | --- | --- |
| 1 (Mon) | projects · projects, contact, styles.css | h1 `position: relative`; `<span class="ribbon">ICT strand</span>` absolute, `top: 8px; right: 8px; z-index: 1` | a second ribbon "Grade 11" with `.left { right: auto; left: 8px; }` | offsets choose the corner; the later rule wins |
| 2 (Mon, media) | index · index, styles.css | gallery: two figures (science poster, comic strip) `float: left; width: 170px`, captions; h2 `clear: both` | a third figure (honours certificate) | float lays out a gallery |
| 3 (Tue) | projects · projects, contact, styles.css | nav `position: sticky; top: 0; z-index: 2`, white background; badges `float: right` | a third project with a "club work" badge | stacking order; a floated badge gets its own line |
| 4 (Tue, media) | index · index, styles.css | Juan's picture `class="profile"` floats left, introduction wraps | `float: right` on `small` | float on a word element |
| 5 (Wed, media) | index · index, styles.css | pictures 160 × 110 px with a grey border; captions 13px centred; the certificate | a fourth figure (tree planting) | a gallery with captions |
| 6 (Wed, media) | index · index, styles.css | figures `position: relative`; "New" tag absolute 4px from the corner, `z-index: 1` | an "Award" tag on the certificate | position inside the gallery |
| 7 (Thu) | projects · projects, contact, styles.css | no `;` after `position: absolute` → position and top skipped, ribbon in the title's line | put it back → ribbon on its own line | overlap repair, changes page text |
| 8 (Thu) | projects · projects, contact, styles.css | `float: rigth` → badges in their projects' lines | spell `right` → own lines | float repair, changes page text |
| 9 (Fri, media) | index · all four files | Juan's finished site (output = Step 6) | `<p class="credits">` after the gallery + `.credits { clear: both; }` | clear below floats |

## How it came out (real runs, Chromium, no internet; CodeShare's `buildTeacherPreview` in a sandboxed frame 800 px wide inside `body { zoom: 1.15 }` with its no-internet policy and the module's media embedded, and the teacher's checker at 1000 × 900: the same page text in all 50 cases, and the same page-check values except values that follow the window or the zoom)

- Page text: `position: absolute`, `fixed` and `float` make a box a block, so its words get their own line (`PROJECTS OF JUAN DELA
  CRUZ` then `ICT STRAND`; `Science poster: Saving water at home` then `SOLO WORK`; the floated small print on its own line);
  `relative`, `sticky` and static keep them in their line. A missing `;` after `position: absolute` (it also skips `top`) and
  `absolute` changed to `relative` put the ribbon back in the title's line. `float: rigth` and `float: center` are skipped (float
  reads `none`).
- Page checks: `top`/`right` read as written (`8px`), also on a relative or static box (`top: 1em` in the 32px h1 reads `32px`;
  `top: 8px` on a static span reads `8px` and does nothing); `z-index` reads as written on a static box too (`2`, `3`; the h1 with
  none reads `auto`). A side not set reads a px value that follows the window: `left` of the ribbon 850.672px in the checker
  against 650.707px in CodeShare, `bottom` -8px against -7.98913px; `fixed` offsets differ the same way. `sticky` `top` reads `0px`
  but its place follows scrolling. None of these is page-checked; a guard test refuses an offset or size check that the
  stylesheet does not set in px.
- On screen (measured with `getBoundingClientRect` and `elementFromPoint` in both): the ribbon sits 8px inside the h1's top-right
  corner and is on top; without `position: relative` on the h1 it sits 8px from the top of the page, over the nav; `bottom: 8px`
  moves it to the h1's bottom-right corner; `z-index: -1` hides it behind the h1's gradient; `left: 8px` puts it in the top-left
  corner. In CodeShare's page window, scrolled 45px, the nav's links are on top with `z-index: 2` and the h1 covers them without
  it (the checker's window was too tall to scroll). The "New" tag is on top of its picture; with `z-index: -1` the picture covers
  it. Without `clear: both` on h2, "Sound greeting" moves up beside the gallery (top 2152 against the figures' 2136–2301); a
  paragraph after the gallery with no clear starts beside the pictures. Juan's Skills heading starts below his floated picture
  with or without `clear` (his introduction is taller than the picture), so the module does not claim it moves.
- Gallery: `figcaption` is page text, `alt` is not (changing alt leaves the output; changing a caption fails it). Floated figures
  give one caption per line; `inline-block` figures leave a line holding only a space between captions (`Science poster\n \nComic
  strip`), so the gallery floats. A tag that is not positioned leaves a trailing space (`New \n`), so it is not used as a repair.
  A picture that is not loaded reads a tiny width (27.5625px), so no page check reads a picture's size.
- A missing `}`: in today's Chromium the later rules become rules nested inside the broken one (CSS nesting), so `.tag` after a
  broken `.gallery figure {` still matched the tag inside a figure while `h2 { clear }` matched nothing. Not used as a repair.
- Personal project offline (offline-settings server, no media files): Run code succeeds; each gallery picture shows only its alt
  text and a small broken-picture icon; captions show. The module and JSON say so.
- Every claim in the module's tables, practice notes and problem guide, and in the DLL's Predict/Debug lines, came from these
  runs (`test_checker.py` repeats those the page text or a page check can show; on-screen places cannot be measured by it).

## Readable contrast (W3C WCAG 2.2: 4.5:1 normal text, 3:1 large text and borders)

Computed in `revision_tools/resume_w07/content.py` (relative luminance; a gradient checked at 101 points); the build stops if any
pair is below its minimum. Printed values are rounded down.

| Text on background | Colours | Ratio |
| --- | --- | --- |
| Juan's name (h1, large), white on the gradient | #ffffff on #13305c → #8a1c55 | 8.8 (lowest point) |
| Ribbon, dark on light yellow | #222222 on #fff3c4 | 14.2 |
| Gallery tag, white on maroon | #ffffff on #8a1c55 | 8.8 |
| Captions and body text | #222222 on #ffffff | 15.9 |
| Paragraphs and labels | #333333 on #ffffff | 12.6 |
| h2 headings (large), maroon | #8a1c55 on #ffffff | 8.8 |
| Badges on their gradient | #222222 on #fff3c4 → #ffe08a | 12.3 (lowest point) |
| Nav links, white on navy | #ffffff on #13305c | 13.0 |
| Links, navy | #13305c on #ffffff | 13.0 |

Borders (3:1): picture border #555555 on white 7.4; badge border 5.0. Task page 13 prints a chart of 12 checked colour pairs.

## References (each opened 2026-11-10 with a web fetch; each says what the DLL cites it for)

MDN Positioning; MDN Floats; MDN position; MDN z-index; MDN `<figure>`; MDN top; MDN Stacking context (now at
`/Web/CSS/Guides/Positioned_layout/Stacking_context`); MDN float; MDN clear; MDN `<figcaption>`; MDN `<img>`; W3C WAI Images
Tutorial; MDN CSS syntax (now at `/Web/CSS/Guides/Syntax/Introduction`); MDN Debugging CSS; W3C CSS Positioned Layout Level 3; W3C
WAI Understanding Contrast (Minimum); Common Sense Education Privacy & Safety (no login).

## Checks run

2026-11-10, `bash revision_tools/run_checks.sh` from the Net Files folder: every section of every week passed (old Weeks 1–3,
Resume Weeks 1–7, printed module vs JSON `ALL MATCH`).

**Resume Week 7 samples** (`check_codeshare.py DotNet1_Week_07.codeshare.json --run --media-root project_end`)

```text
PASS dotnet-1-r07-d1-s1
PASS dotnet-1-r07-d1-s2
PASS dotnet-1-r07-d2-s3
PASS dotnet-1-r07-d2-s4
PASS dotnet-1-r07-d3-s5
PASS dotnet-1-r07-d3-s6
PASS dotnet-1-r07-d4-s7
PASS dotnet-1-r07-d4-s8
PASS dotnet-1-r07-d5-s9
OK: 5 lessons, 9 steps, 21 ids, no problems found.
```

**Resume Week 7 task answers (solutions/)**: the same 9 PASS lines and `OK: 5 lessons, 9 steps, 21 ids, no problems found.`

**Unchanged samples against task outputs (every step must fail)**

```text
9 problem(s):
- dotnet-1-r07-d1-s1: Output differs: 'Tab title: Projects of Juan Dela Cruz\nVisible page
- dotnet-1-r07-d1-s2: Output differs: 'Tab title: Resume of Juan Dela Cruz\nVisible page t
- dotnet-1-r07-d2-s3: Output differs: 'Tab title: Projects of Juan Dela Cruz\nVisible page
- dotnet-1-r07-d2-s4: Output differs: 'Tab title: Resume of Juan Dela Cruz\nVisible page t
- dotnet-1-r07-d3-s5: Output differs: 'Tab title: Resume of Juan Dela Cruz\nVisible page t
- dotnet-1-r07-d3-s6: Output differs: 'Tab title: Resume of Juan Dela Cruz\nVisible page t
- dotnet-1-r07-d4-s7: Output differs: 'Tab title: Projects of Juan Dela Cruz\nVisible page
- dotnet-1-r07-d4-s8: Output differs: 'Tab title: Projects of Juan Dela Cruz\nVisible page
- dotnet-1-r07-d5-s9: Output differs: 'Tab title: Resume of Juan Dela Cruz\nVisible page t
```

**`test_checker.py`** (`python3 test_checker.py -v`; checks rules on their own through the teacher's checker, not the real app)

```text
test_a_missing_semicolon_skips_position_and_top ... ok
test_a_misspelt_float_value_is_skipped ... ok
test_a_step_without_its_stylesheet_fails_on_its_own ... ok
test_a_tag_that_is_not_positioned_leaves_a_space ... ok
test_absolute_and_float_put_words_on_their_own_line ... ok
test_all_nine_samples_pass_with_juans_media ... ok
test_both_thursday_repairs_change_the_page_text ... ok
test_captions_are_page_text_and_alt_is_not ... ok
test_changed_output_fails_then_restored_output_passes ... ok
test_duplicate_id_rejected ... ok
test_every_contrast_pair_and_border_reaches_its_minimum ... ok
test_every_gallery_picture_has_its_media_line ... ok
test_every_step_runs_from_its_own_files_alone ... ok
test_every_value_in_quotes_each_li_on_its_own_line_no_url ... ok
test_float_and_clear_change_no_page_text_on_pictures ... ok
test_monday_try_table_rows_change_no_page_text ... ok
test_no_page_check_on_a_link_state_link_style_or_src ... ok
test_no_page_check_on_a_value_that_follows_the_window_or_the_zoom ... ok
test_offsets_read_as_written_and_z_index_reads_even_when_static ... ok
test_only_the_index_html_steps_are_media_steps ... ok
test_pages_change_only_by_the_ribbon_the_gallery_and_the_picture_class ... ok
test_personal_starter_has_a_gallery_and_a_ribbon_and_names_pictures_to_add ... ok
test_relative_sticky_and_static_keep_words_in_their_line ... ok
Ran 23 tests in 34.917s
OK
```

Break-and-restore proofs (2026-11-10): a sticky-offset page check (`nav` `top` `0px`) added to Step 3 made
`test_no_page_check_on_a_value_that_follows_the_window_or_the_zoom` fail (`'nav' unexpectedly found`), and it passed again once
removed; the Step 8 answer with `float: rigth` made the answers check report `dotnet-1-r07-d4-s8: Output differs`, and `OK` again
once restored.

**Printed module vs JSON** (`consistency.py`): `week r07 … printed task box matches JSON: True` for all 9 tasks; `week r07 printed
sample code and outputs (pp. 1-8) match JSON: True (18 codes, 0 whole outputs, 7 output parts, 1 same-as lines)`; `ALL MATCH`.

**Pages**: module 13 pages, each source page one page of 612 × 936 pt (`WEEK=07 bash render_r01.sh`); every page looked at. DLL 7 pages
(LibreOffice), every page looked at; no Week 6 text left apart from the deliberate recall of Week 6 on Monday. Search for "VS Code",
"Visual Studio", "Chrome", "Ctrl+O" and "folder" in the DLL, module and JSON: no hits.

## CodeShare (the real app, local)

`tests/web-module-steps.browser.mjs` (branch `docs/net-resume-week-07`, PR #92), `node --test --test-reporter=spec`:

- Cloudflare's runtime on this laptop (`npx opennextjs-cloudflare build`, preview on 8787, local Supabase and local R2): 13 passed,
  5 skipped (old-format subtests), 0 failed. Every built week's media uploaded first; 63/63 steps "sample verified, task completed".
  Week 7:

```text
dotnet-1-r07-d1-s1: sample verified, task completed
dotnet-1-r07-d1-s2: sample verified, task completed
dotnet-1-r07-d2-s3: sample verified, task completed
dotnet-1-r07-d2-s4: sample verified, task completed
dotnet-1-r07-d3-s5: sample verified, task completed
dotnet-1-r07-d3-s6: sample verified, task completed
dotnet-1-r07-d4-s7: sample verified, task completed
dotnet-1-r07-d4-s8: sample verified, task completed
dotnet-1-r07-d5-s9: sample verified, task completed
```

- Offline settings (`next start` on 3042, laptop mode, no R2): 12 passed, 6 skipped, 0 failed. Week 7:

```text
dotnet-1-r07-d1-s1: sample verified, task completed
dotnet-1-r07-d1-s2: teacher-checked (no media storage on this server), marked done
dotnet-1-r07-d2-s3: sample verified, task completed
dotnet-1-r07-d2-s4: teacher-checked (no media storage on this server), marked done
dotnet-1-r07-d3-s5: teacher-checked (no media storage on this server), marked done
dotnet-1-r07-d3-s6: teacher-checked (no media storage on this server), marked done
dotnet-1-r07-d4-s7: sample verified, task completed
dotnet-1-r07-d4-s8: sample verified, task completed
dotnet-1-r07-d5-s9: teacher-checked (no media storage on this server), marked done
```

- New Week 7 personal subtest: passed on both. Online the three teacher pictures are drawn from the page; offline they are not found
  and the run still succeeds (the offline wording in the module and JSON comes from this run). Proof on 3042: a copy of the subtest whose
  stylesheet drops `position: absolute` failed (`ICT STRAND` not on its own line); a copy of the weeks whose Step 7 answer still lacks its
  `;` stopped the walk (`dotnet-1-r07-d4-s7: task NOT completed — … page gave "PROJECTS OF JUAN DELA CRUZ ICT STRAND"`).
- `tests/web-sample-first.browser.mjs` on 8787: 6/6. `npm test` 422/422; `npm run lint` 0 errors (8 old warnings in app files);
  `npm run build:all` OK.

## Not verified

- The hosted site, classroom laptops and Wi-Fi, phones, Firefox and Safari (only Chromium was run).
- The real upload of Week 7 and its seven media files under Media files (the teacher does this).
- The visited colour of links (headless Chromium paints none) and how a hover or sticky nav feels on a touch screen.
