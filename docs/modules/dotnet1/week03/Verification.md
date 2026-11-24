# Resume Week 3 verification

.NET 1 · Week 3 · Links, frames and forms · built 2026-11-06 to 2026-11-08 for Ireneo D. Seraspe Jr., Cielito Zamora Senior
High School. Dates, grade and sections stay blank. This checks the files on the teacher's laptop and CodeShare run locally
(local Supabase, local R2 on Cloudflare's runtime); it is not the hosted site or classroom devices.

## Decisions used

- Rolling weekly prompt (Week 3) and the teacher's answer of 2026-11-06 ("q1 q2 both take recommendation"): Juan's Week 2
  picture, sound and video stay on index.html; Juan gets three pages: index.html (his resume), projects.html (second page,
  shows contact.html in an iframe) and contact.html (the contact form prototype, sends nowhere). Only Steps 1 and 9 run
  index.html, so only they are media steps (offline the teacher presses Mark done on those two); Steps 2–8 run
  projects.html or contact.html and are checked automatically online and offline. The contact form asks for the
  visitor's email (`type="email"`); it sends nowhere and saves nothing.
- Guide Quarter 1, competencies 6, 7 and 8 (course map, Week 03). Friday: one step, Juan's finished site, no new HTML.
- Juan Dela Cruz and every detail about him are made up. Week 3 adds no new media: project_end/ holds Week 2's drawn
  picture, generated tune and recorded video (made on this laptop by `revision_tools/resume_w02/make_media.py`).
- Each step lists only the pages it adds or changes and names its run page; Step 9 lists all three finished pages. Lesson
  pages print each new page whole once (projects.html in Step 1, contact.html in Step 2), then only new or changed lines;
  outputs print only the lines that differ (Step 1 against Juan's Week 2 page). Task pages print every complete task output.

## What was built

| File | What it is |
| --- | --- |
| `DotNet1_Week_03.codeshare.json` | Module `dotnet-1-r03`, `"sampleFirst": true`, `previousModuleId` `dotnet-1-r02`, starter = Juan's Week 2 page, 5 lessons, 9 steps (Steps 1 and 9 media steps, `includeMediaOutput`), each with page checks and one task (`<step id>-alter-v1`), 5 exit slips (15/20/15/15/20), performance task (50 points) with starter pages index.html, projects.html, contact.html. |
| `DotNet1_Links_Frames_Forms_Module.pdf` | 11 pages of 612 × 936 pt: lessons pp. 1–6, strips pp. 7–8, task pages pp. 9–11. |
| `DotNet1_ILAW_Week_03.docx` | DLL from Resume Week 2's DLL; 7 pages when rendered. |
| `source/` | p1–p8 (`revision_tools/resume_w01/build.py r03`), p9–p11 (`revision_tools/build_tasks.py r03`), `style.css`, `tasks.css`. |
| `solutions/<step id>/` | The answer to each task, as the pages that step lists (never in the JSON). |
| `project_start/` | = `Resume/Week_02/project_end/` (Juan's Week 2 page and media). |
| `project_end/` | Juan's finished Week 3 site (index.html = Steps 1 and 9, projects.html = Step 5, contact.html = Step 6) and the same three media files as Week 2 (`images/juan_profile.svg`, `audio/greeting.wav`, `video/juan_intro.webm`; 1 KB, 53 KB, 25 KB). `Resume/project/` is the same. |
| `check_codeshare.py`, `check_web_steps.cjs` | Copied unchanged from `Resume/Week_02/`. |
| `test_checker.py` | Week 3 checker tests (12). |

Teacher's tools changed (originals in `revision_tools/before_revision/before_r03/`): `resume_w01/build.py` (a step may
list several pages and set its run page; page headings name the run page; output lines may be compared with an earlier
week's output; Weeks 1–2 rebuilt byte-identical: JSON, pages, answers and every DLL part), `tasks.py` (loads r03),
`build_tasks.py` (r03 task pages, starter pages from the JSON), `consistency.py` (pages named per printed block),
`render_r01.sh` (`WEEK=03`), `run_checks.sh` (Resume Week 3 section). New: `resume_w03/content.py` (the one source).
`answers_json.py` was backed up but not changed. Course map: Week 03 "CodeShare readiness" line and the CodeShare bullet
of "Checks and decisions to retain" (original in `before_revision/DotNet1_Course_Map_before-r03.md`).

## Steps and tasks

| Step | Run page | Sample | Task | Why it exercises the lesson |
| --- | --- | --- | --- | --- |
| 1 (Mon) | index.html (media) | nav Home \| Projects \| Contact at the top; new projects.html | link inside a sentence to the projects page | link text is page text, href is not |
| 2 (Mon) | contact.html | new contact.html: form, one labelled box, Send message, "sends nowhere" | a second labelled box, Your school | labels are page text, boxes are not |
| 3 (Tue) | projects.html | the same nav on projects.html (linked both ways) | Back to my resume link at the end | a second way back |
| 4 (Tue) | contact.html | the same nav on contact.html | two links in one sentence | several links in text |
| 5 (Wed) | projects.html | h2 and an iframe of contact.html (title, width 420, height 360) | link that opens the framed page on its own | a frame's text is not page text |
| 6 (Wed) | contact.html | placeholder and required on name; email, Topic select (2 options), Message textarea | a third option, Science fair | every option is page text |
| 7 (Thu) | contact.html | Contact's href lost its closing quote: Contact, the heading and the note vanish | put the quote back | a value runs to the next quote |
| 8 (Thu) | contact.html | textarea without its closing tag: Send message vanishes | close the textarea | an open textarea swallows the rest |
| 9 (Fri) | index.html (media) | Juan's finished site (= Steps 1, 5, 6) | an honest note that the form sends nowhere | privacy before presenting |

## How it came out (real runs, Chromium, no internet; the teacher's checker and CodeShare's preview agree)

- Link text is page text; href is not. `a[href="projects.html"]` page checks give the same count in both.
- A framed page's text is never part of the page text. An iframe's `src` page check reads `projects.html` in the teacher's
  checker but nothing in CodeShare (it shows the page through `srcdoc`), so frames are checked by count, title, width and
  height.
- Labels, button words and every option of a select are page text; typed words, placeholders, textarea text and the
  value of `input type="submit"` are not. A label and its box on one line leave a trailing space, so every label ends
  with `<br>`.
- A missing quote swallows text up to the next quote: Step 7 gives `Home | Projects | Your name`; a missing quote on
  Home's href gives `Projects | Contact`. An open textarea holds the rest of the page as its text.
- CKB-093 (CodeShare, open): a missing quote before an iframe makes CodeShare paste the framed page into the page and
  report an uncaught error; the teacher's checker shows only the lost text. No Week 3 sample has a quote missing before an
  iframe (Step 7 breaks contact.html, which has no iframe).
- Every claim in the DLL's Predict/Debug lines and the module's Check yourself, "Try this" table and practice notes came
  from these runs, except "clicking a label puts the cursor in its box" (checked once with a click; also in MDN).

## Checks run (2026-11-08, `bash revision_tools/run_checks.sh` from the Net Files folder)

**Resume Week 3 samples** (`check_codeshare.py DotNet1_Week_03.codeshare.json --run --media-root project_end`)

```text
PASS dotnet-1-r03-d1-s1
PASS dotnet-1-r03-d1-s2
PASS dotnet-1-r03-d2-s3
PASS dotnet-1-r03-d2-s4
PASS dotnet-1-r03-d3-s5
PASS dotnet-1-r03-d3-s6
PASS dotnet-1-r03-d4-s7
PASS dotnet-1-r03-d4-s8
PASS dotnet-1-r03-d5-s9
OK: 5 lessons, 9 steps, 21 ids, no problems found.
```

**Resume Week 3 task answers (solutions/)**: the same 9 PASS lines and `OK: 5 lessons, 9 steps, 21 ids, no problems found.`

**Unchanged samples against task outputs (every step must fail)**: `9 problem(s)`, one `Output differs` line per step.

**test_checker.py** (`python3 test_checker.py -v`)

```text
test_a_missing_quote_swallows_the_heading ... ok
test_all_nine_samples_pass_with_juans_media ... ok
test_an_open_textarea_hides_the_button_and_the_page_check_sees_it ... ok
test_changed_output_fails_then_restored_output_passes ... ok
test_duplicate_id_rejected ... ok
test_every_option_of_a_select_is_page_text ... ok
test_framed_page_text_is_not_page_text ... ok
test_href_is_not_page_text_but_the_page_check_sees_it ... ok
test_no_broken_quote_before_an_iframe_ckb_093 ... ok
test_no_src_page_check_on_an_iframe_or_uploaded_media_ckb_086_092 ... ok
test_only_the_index_html_steps_are_media_steps ... ok
test_typed_values_and_placeholders_are_not_page_text_labels_are ... ok
Ran 12 tests ... OK
```

Proof the CKB-093 guard catches it: in a copy of the JSON with `<h2 title="oops>` added before Step 5's iframe, the guard
test failed (`AssertionError: 1 != 0 : ('dotnet-1-r03-d3-s5', 'projects.html')`); with the real JSON it passed.

**Printed module vs JSON** (`consistency.py`): all 9 task boxes match; printed sample code and outputs on pp. 1–8 match
(11 code blocks, 2 whole outputs, 7 output parts at their line numbers; Step 9 printed as the same pages as Steps 1, 5, 6).
`ALL MATCH`. Proof it catches a mismatch: one printed output word on p. 4 changed → `MISMATCH`; restored → `ALL MATCH`. The
same run still passes every check of Resume Weeks 1–2 and the retired Weeks 1–3.

**Personal project files**: the starter (its placeholder picture expected broken) and the example ran with no error.

**Word search** (DLL text, module PDF text, module source, JSON) for VS Code, Visual Studio, Chrome, Ctrl+O, folder, canteen,
ADJUST THIS, pandesal: 0 hits each. The JSON names "Multimedia and tables" once (the week it continues) and colspan four times
(Juan's carried-forward Week 2 page). DLL: "(10 mins)" once, AI declaration once, teacher's name twice, 5 "Sample, then
your task:" lines, Reflections blank, 25 reference links (5 per day; 20 different addresses).

**Rendering**: every module page (11) renders to exactly one 612 × 936 pt page; spare space 0.14–1.35 in; every page image
inspected. Every DLL page (7) rendered with LibreOffice and inspected.

## CodeShare browser test (`tests/web-module-steps.browser.mjs`, branch `docs/net-resume-week-03`)

Adapted (approved 2026-11-06): the media subtest uploads the media of every built week with media steps (Weeks 2 and 3)
before the student walk; the retired canteen Week 3 subtest is now Resume Week 3's personal project.

Cloudflare's runtime (`opennextjs-cloudflare preview`, port 8787, local R2): 9 passed, 5 skipped, 0 failed. Media steps
with the teacher's files: Week 2 Steps 1–9 and Week 3 Steps 1 and 9 pass in the teacher preview (Week 3: page text, page
checks and 3 media lines each). Student walk, Week 3:

```text
dotnet-1-r03-d1-s1: sample verified, task completed
dotnet-1-r03-d1-s2: sample verified, task completed
dotnet-1-r03-d2-s3: sample verified, task completed
dotnet-1-r03-d2-s4: sample verified, task completed
dotnet-1-r03-d3-s5: sample verified, task completed
dotnet-1-r03-d3-s6: sample verified, task completed
dotnet-1-r03-d4-s7: sample verified, task completed
dotnet-1-r03-d4-s8: sample verified, task completed
dotnet-1-r03-d5-s9: sample verified, task completed
```

(Weeks 1 and 2: 18 more lines, all "sample verified, task completed".) Week 3 personal project: the Week 2 submission and
its picture carry forward; the student adds projects.html and contact.html with ＋ and a sound, runs (the video not added
yet shows not found), adds the video (Submit needs a new run), runs, submits (100%, three pages and three media frozen);
the teacher's review shows the three pages and the media.

Offline settings (`next start`, port 3042, laptop Java): 8 passed, 6 skipped, 0 failed. Week 1: 9 × "sample verified, task
completed"; Week 2: 9 × "teacher-checked (no media storage on this server), marked done"; Week 3: Steps 1 and 9
"teacher-checked …, marked done", Steps 2–8 "sample verified, task completed"; Week 3 personal project with three pages, no
media, submitted at 100%.

Proof the walk catches a wrong answer: a copy of the Resume weeks with Step 6's answer changed to Science club failed at
`dotnet-1-r03-d3-s6: task NOT completed — ✗ Page text matches; line 11: required "Science fair", page gave "Science club"`.

Page window, checked by hand-written script on 8787: Step 1's Contact shows "This project has no page named contact.html."
and Projects opens projects.html; a student on Step 3 who follows Home sees index.html with the picture missing and the
sound and video not loaded (media load only on media steps). In the teacher's View module details preview, a step holds
only its own pages, so Home on Steps 2–8 says "This project has no page named index.html." there (not a fault).

`npm test` 421/421, `npm run lint` 0 errors (8 old warnings), `npm run build:all` OK.

## References (all opened 2026-11-06)

MDN: Creating links; the a element; the iframe element; From object to iframe — general embedding technologies; Your first
form; How to structure a web form; Basic native form controls; Client-side form validation; the label, input, select and
textarea elements; Debugging HTML. WHATWG HTML Standard: Links; The iframe element; Forms. W3C WAI: Forms Tutorial;
Labeling Controls; Understanding Link Purpose (In Context). Common Sense Education: Privacy and security.

## Not verified

- The hosted site, phones, browsers other than Chromium, the classroom Wi-Fi and printing on paper.
- Pressing Send message in the page window (the form sends nowhere; what the browser shows was not checked).
- Same-page links (`href="#id"`) in the page window: not used this week and not checked.
- Students' own phone media (Juan's sound and video were the stand-ins); offline media (not built yet).
