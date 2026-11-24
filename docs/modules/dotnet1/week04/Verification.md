# Resume Week 4 verification

.NET 1 · Week 4 · CSS fundamentals and selectors · built 2026-11-08 for Ireneo D. Seraspe Jr., Cielito Zamora Senior High
School. Dates, grade and sections stay blank. This checks the files on the teacher's laptop and CodeShare run locally
(local Supabase, local R2 on Cloudflare's runtime); it is not the hosted site or classroom devices.

## Decisions used

- Rolling weekly prompt (Week 4) and the teacher's answers of 2026-11-08 ("Keep them (Recommended)", "Yes, add it
  (Recommended)", then "approve"): Juan's Week 2 picture, sound and video stay on index.html, so only the steps that run
  index.html (1, 3 and 9) are media steps (offline the teacher presses Mark done on those three); Steps 2 and 4–8 run
  projects.html or contact.html and are checked automatically online and offline. A Week 4 personal-project subtest is added
  to CodeShare's browser test.
- Teacher's correction of 2026-11-08 (CodeRabbit on PR #86): each step lists its run page and every file that page needs
  (its linked styles.css, and contact.html when projects.html frames it), even when unchanged, plus any file it adds or
  changes; the printed module still shows only new or changed lines. Why: View module details runs only the step's own
  files, and the student's project keeps files from the previous task.
- Guide Quarter 1, competencies 10 and 11 (course map, Week 04). Friday: one step, Juan's finished site, no new CSS.
- Juan Dela Cruz and every detail about him are made up. Week 4 adds no new media: project_end/ holds Week 2's drawn
  picture, generated tune and recorded video (made on this laptop by `revision_tools/resume_w02/make_media.py`).
- Only colours and fonts already on the computer; nothing named in CSS `url()`. Every attribute value is in quotes (CKB-094).

## What was built

| File | What it is |
| --- | --- |
| `DotNet1_Week_04.codeshare.json` | Module `dotnet-1-r04`, `"sampleFirst": true`, `previousModuleId` `dotnet-1-r03`, starter = Juan's Week 3 pages, 5 lessons, 9 steps (Steps 1, 3 and 9 media steps, `includeMediaOutput`), each with page checks and one task (`<step id>-alter-v1`), 5 exit slips (15/20/15/15/20), performance task (50 points) with starter pages and a starter styles.css. |
| `DotNet1_CSS_Fundamentals_Selectors_Module.pdf` | 11 pages of 612 × 936 pt: lessons pp. 1–6, strips pp. 7–8, task pages pp. 9–11. |
| `DotNet1_ILAW_Week_04.docx` | DLL from Resume Week 3's DLL; 7 pages when rendered. |
| `source/` | p1–p8 (`revision_tools/resume_w01/build.py r04`), p9–p11 (`revision_tools/build_tasks.py r04`), `style.css`, `tasks.css`. |
| `solutions/<step id>/` | The answer to each task, as the files that step lists (never in the JSON). |
| `project_start/` | = `Resume/Week_03/project_end/` (Juan's three pages and media). |
| `project_end/` | Juan's finished Week 4 site (index.html = Step 4, projects.html = Step 5, contact.html and styles.css = Step 6) and the same three media files as Weeks 2–3 (`images/juan_profile.svg`, `audio/greeting.wav`, `video/juan_intro.webm`; 1 KB, 53 KB, 25 KB). `Resume/project/` is the same. |
| `check_codeshare.py`, `check_web_steps.cjs` | Copied unchanged from `Resume/Week_03/`. |
| `test_checker.py` | Week 4 checker tests (20). |

Teacher's tools changed (originals in `revision_tools/before_revision/before_r04/`): `resume_w01/build.py` (an output base may
carry a step id; an output equal to its base prints "the same as …'s output"; a DLL code block may start with `css`, also
right after another block; Weeks 1–3 rebuilt byte-identical: JSON, pages, answers, project files and every DLL part),
`tasks.py` (loads r04), `build_tasks.py` (r04 task pages, a starter-stylesheet box), `consistency.py` (checks the "same as"
lines against the step they name, in any week), `render_r01.sh` (`WEEK=04`), `run_checks.sh` (Resume Week 4 section). New:
`resume_w04/content.py` (the one source). `answers_json.py` and `unchanged_json.py` were backed up but not changed. Course
map: Week 04 "CodeShare readiness" line and the CodeShare bullet of "Checks and decisions to retain" (original in
`before_revision/DotNet1_Course_Map_before-r04.md`). Handover: original in `before_revision/DotNet1_Handover_2026-11-08_before-r04.md`.

Mistake made and undone: `build_tasks.py` was once run with no week key, which rebuilt every week's task pages. Resume
Weeks 2–3 came out identical; Resume Week 1's `tasks.css` and the retired canteen weeks' task-page sources (`source/`,
`Week_02/source/`, `Week_03/source/`: p9, p10, tasks.css) changed. All were restored: Resume Week 1's `tasks.css` from a copy
taken before the build, the retired weeks by re-running the original generator
(`revision_tools/before_revision/build_tasks.py`); their sources again say "in CodeShare or VS Code", like their printed PDFs.
No PDF was changed.

## Steps and tasks

| Step | Run page · files | Sample | Task | Why it exercises the lesson |
| --- | --- | --- | --- | --- |
| 1 (Mon, media) | index · index | internal style element: body font, h1 navy, h2 maroon | rule `small { text-transform: uppercase; }` | a rule's syntax; some CSS changes letters |
| 2 (Mon) | contact · contact | inline style on the prototype sentence (red, bold) | inline uppercase on the h1: CONTACT JUAN | inline CSS styles one element |
| 3 (Tue, media) | index · index | nav rule (bold, capitals); inline green on My motto | `style="text-transform: none;"` on nav | inline beats internal |
| 4 (Tue) | projects · projects, contact, index, styles.css | rules moved to styles.css, linked from all three pages | uppercase the h1 rule: PROJECTS OF JUAN DELA CRUZ | one stylesheet styles every page |
| 5 (Wed) | projects · projects, contact, styles.css | `.badge` class on two spans: SOLO WORK, GROUP WORK | a third project with the badge class | a class is reused; capitals prove it matched |
| 6 (Wed) | contact · contact, styles.css | `#form-note` replaces the inline style; `p` dark grey | `id="send"` and `#send` uppercase: SEND MESSAGE | an id names one element |
| 7 (Thu) | contact · contact, styles.css | nav rule without the semicolon after bold | put the semicolon back | one missing `;` skips two declarations |
| 8 (Thu) | projects · projects, contact, styles.css | second badge's class misspelt `bagde` | spell it badge | a misspelt class matches nothing |
| 9 (Fri, media) | index · all four files | Juan's finished site (output = Step 3) | `<p>This resume is styled by <span class="badge">styles.css</span>.</p>` | a shared class works on any page |

## How it came out (real runs, Chromium, no internet; the teacher's checker and CodeShare's preview agree unless said)

- Colours, fonts, sizes and backgrounds are not page text; computed values are the same in both (`rgb(19, 48, 92)`,
  `Georgia, serif`, `12px`, `700`, `italic`, `rgb(255, 243, 196)`).
- `text-transform` changes the page text (uppercase, capitalize, none), also on a `button`, but not on a select's `option`s;
  `display: none` and `visibility: hidden` remove the text.
- CodeShare puts the link line's stylesheet into the page as a `style` element: `link` counts 0 and `style` 1 in CodeShare,
  1 and 0 in the checker. No page check names `link` or `style`.
- A wrong href (`style.css`), a wrong capital (`Styles.css`) or a missing styles.css leaves the page unstyled in both, with
  no error.
- CKB-094 (CodeShare, open): `href=styles.css` without quotes is applied by a browser but not inlined by CodeShare, so the
  page stays plain there. Every Week 4 value is quoted; the module, the problem guide, task page 10 and the DLL say to keep
  the quotes.
- Which rule wins: inline beats an ID, an ID beats a class, a class beats an element; between equal rules the later one
  wins, also between a style element and the link line (whichever is later in head).
- A missing semicolon skips that declaration and the next one (Step 7: the nav is neither bold nor in capitals); a missing
  colon skips only that declaration; a missing `}` after a style rule (Week 4: the `h2` rule) stops every later rule, while
  after an `@media` block the later rules stay inside it and still apply (checked 2026-11-09, CodeRabbit on PR #87); a missing
  last `}` changes nothing;
  a misspelt or wrongly capitalised class or id, or a missing dot, matches nothing.
- Every claim in the DLL's Predict/Debug lines and the module's tables, practice notes and problem guide came from these
  runs (`test_checker.py` repeats them).

## Checks run (2026-11-08, `bash revision_tools/run_checks.sh` from the Net Files folder)

**Resume Week 4 samples** (`check_codeshare.py DotNet1_Week_04.codeshare.json --run --media-root project_end`)

```text
PASS dotnet-1-r04-d1-s1
PASS dotnet-1-r04-d1-s2
PASS dotnet-1-r04-d2-s3
PASS dotnet-1-r04-d2-s4
PASS dotnet-1-r04-d3-s5
PASS dotnet-1-r04-d3-s6
PASS dotnet-1-r04-d4-s7
PASS dotnet-1-r04-d4-s8
PASS dotnet-1-r04-d5-s9
OK: 5 lessons, 9 steps, 21 ids, no problems found.
```

**Resume Week 4 task answers (solutions/)**: the same 9 PASS lines and `OK: 5 lessons, 9 steps, 21 ids, no problems found.`

**Unchanged samples against task outputs (every step must fail)**: `9 problem(s)`, one `Output differs` line per step.

**test_checker.py** (`python3 test_checker.py -v`)

```text
test_a_deleted_colon_loses_that_declaration_only ... ok
test_a_missing_brace_stops_every_later_rule ... ok
test_a_missing_semicolon_skips_two_declarations ... ok
test_a_step_without_its_stylesheet_fails_on_its_own ... ok
test_a_wrong_or_missing_stylesheet_leaves_the_page_plain_with_no_error ... ok
test_all_nine_samples_pass_with_juans_media ... ok
test_button_text_transform_is_page_text_option_text_is_not ... ok
test_changed_output_fails_then_restored_output_passes ... ok
test_colours_are_not_page_text_but_the_page_check_sees_them ... ok
test_duplicate_id_rejected ... ok
test_every_step_runs_from_its_own_files_alone ... ok
test_every_value_in_quotes_ckb_094 ... ok
test_id_beats_class_and_class_beats_element ... ok
test_inline_beats_internal_and_a_later_rule_wins ... ok
test_misspelt_or_capitalised_class_or_id_matches_nothing ... ok
test_never_a_page_check_on_link_or_style_elements ... ok
test_no_broken_quote_before_an_iframe_ckb_093 ... ok
test_no_src_page_check_on_an_iframe_or_uploaded_media_ckb_086_092 ... ok
test_only_the_index_html_steps_are_media_steps ... ok
test_text_transform_and_display_none_change_page_text ... ok
Ran 20 tests ... OK
```

Proofs the new guards catch what they guard (each on a copy of the week; the real files pass):

- Listing rule: with Step 7 listing only styles.css, `test_every_step_runs_from_its_own_files_alone` failed
  (`AssertionError: 'styles.css' != 'contact.html'`). Restored: OK.
- Quotes (CKB-094): with Step 4's projects.html link line unquoted, `test_every_value_in_quotes_ckb_094` failed
  (`('dotnet-1-r04-d2-s4', 'projects.html')`). Restored: OK.

**Printed module vs JSON** (`consistency.py`): all 9 task boxes match; printed sample code and outputs on pp. 1–8 match
(14 code blocks, 6 output parts at their line numbers, 3 "same as" lines checked against the step they name; Step 9 printed
as the same files as Steps 4–6). `ALL MATCH`. Proofs it catches a mismatch: one printed output word on p. 4 changed →
`MISMATCH`; restored, then Step 2's "same as" line pointed at the wrong Week 3 step → `MISMATCH`; restored → `ALL MATCH`. The
same run still passes every check of Resume Weeks 1–3 and the retired Weeks 1–3.

**Personal project files**: the starter (its placeholder picture expected broken) and the example ran with no error.

**Word search** (DLL text, module PDF text, module source, JSON) for VS Code, Visual Studio, Chrome, Ctrl+O, folder, canteen,
ADJUST THIS, pandesal: 0 hits each. DLL: "(10 mins)" once, AI declaration once, teacher's name twice, 5 "Sample, then your
task:" lines, Reflections blank, 25 reference links (5 per day; 21 different addresses) plus the curriculum-guide link.

**Rendering**: every module page (11) renders to exactly one 612 × 936 pt page; spare space 0.13–1.12 in; every page image
inspected. Every DLL page (7) rendered with LibreOffice and inspected.

## CodeShare browser test (`tests/web-module-steps.browser.mjs`, branch `docs/net-resume-week-04`)

Changed (approved 2026-11-08): a new Week 4 personal-project subtest; the walk's step opener finds whichever editor is open
(a Week 4 task ends in styles.css, which opens a CSS editor).

Cloudflare's runtime (`opennextjs-cloudflare preview`, port 8787, local R2): 10 passed, 5 skipped, 0 failed. Media steps
with the teacher's files: Week 2 Steps 1–9, Week 3 Steps 1 and 9 and Week 4 Steps 1, 3 and 9 pass in the teacher preview
(page text, page checks and 3 media lines each). Teacher preview without media: Week 4 Steps 2 and 4–8 pass (page text and
3–5 page checks each). Student walk, Week 4:

```text
dotnet-1-r04-d1-s1: sample verified, task completed
dotnet-1-r04-d1-s2: sample verified, task completed
dotnet-1-r04-d2-s3: sample verified, task completed
dotnet-1-r04-d2-s4: sample verified, task completed
dotnet-1-r04-d3-s5: sample verified, task completed
dotnet-1-r04-d3-s6: sample verified, task completed
dotnet-1-r04-d4-s7: sample verified, task completed
dotnet-1-r04-d4-s8: sample verified, task completed
dotnet-1-r04-d5-s9: sample verified, task completed
```

(Weeks 1–3: 27 more lines, all "sample verified, task completed".) Week 4 personal project: the Week 3 submission (three
pages and its media) carries forward; the student adds styles.css with ＋ and the link line on every page, runs (the page
window shows `HOME | PROJECTS | CONTACT`, a navy h1, the yellow class and the italic id), submits (100%, four files frozen,
media carried); the teacher's review runs the frozen files with the same styles.

Offline settings (`next start`, port 3042, laptop Java): 9 passed, 6 skipped, 0 failed. Week 4: Steps 1, 3 and 9
"teacher-checked (no media storage on this server), marked done"; Steps 2 and 4–8 "sample verified, task completed"; Week 4
personal project submitted at 100% with styles.css (no media offline).

Proofs:

- A copy of the Resume weeks with Step 5's answer badge misspelt `bagde` failed at
  `dotnet-1-r04-d3-s5: task NOT completed — ✗ Page text matches; line 8: required "Slide deck for Oral Communication: My dream
  job SOLO WORK", page gave "… solo work"` (8787).
- A copy of the test whose Week 4 personal subtest writes `href=styles.css` (no quotes) failed: the page window showed no
  styles (`Home | Projects | Contact`, `rgb(0, 0, 0)`) — CKB-094 in the real app (3042).

`npm test` 421/421, `npm run lint` 0 errors (8 old warnings), `npm run build:all` OK; Cloudflare runtime log had no errors.

## References (all opened 2026-11-08)

W3C: Cascading Style Sheets home page; CSS Cascading and Inheritance Level 4; Selectors Level 4. W3C WAI: Understanding
Contrast (Minimum); Understanding Use of Color. MDN: What is CSS?; CSS syntax; Getting started with CSS; Basic CSS selectors;
Handling conflicts; Introduction to the CSS cascade; Specificity; Debugging CSS; CSS comments; text-transform; the style and
link elements; the style, class and id global attributes. Common Sense Education: Privacy and security. W3C "HTML & CSS"
(webdesign/htmlcss) was opened and dropped: it does not say what CSS is for.

## Not verified

- The hosted site, phones, browsers other than Chromium, the classroom Wi-Fi and printing on paper.
- Fonts on classroom computers: Georgia may be missing there; the page then shows another serif font, and the page checks
  still pass (they read the declared `Georgia, serif`).
- An unquoted `script src` (CKB-094 suggests the same problem; not checked, no week uses scripts yet).
- Offline media (not built yet); students' own phone media.
- CKB-095 (found 2026-11-09, CodeRabbit on PR #87): CodeShare finds a linked stylesheet from the project's top folder and
  ignores a `media` condition on the link. Week 4 is not affected (all files in the top folder, no `media`).
