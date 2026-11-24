# Resume Week 2 verification

.NET 1 · Week 2 · Multimedia and tables · built 2026-11-06 for Ireneo D. Seraspe Jr., Cielito Zamora Senior High School.
Dates, grade and sections stay blank. This checks the files on the teacher's laptop and CodeShare run locally (local
Supabase, local R2 on Cloudflare's runtime); it is not the hosted site or classroom devices.

## Decisions used

- Rolling weekly prompt (Week 2) and the teacher's answers of 2026-11-06 ("do all your recommendation"): every step keeps
  Juan's picture, sound and video (all 9 steps are media steps; offline the teacher presses Mark done); printed outputs show
  the tab between table cells as →, the JSON keeps the real tab; three drawn teacher pictures in `teacher_pictures/` for
  students without a photo (online, under Media files); repository branch from main after PR #83 merged.
- Guide Quarter 1, competencies 4–5 (course map, Week 02). Friday: one step, Juan's finished page, no new HTML.
- Juan Dela Cruz and every detail about him are made up (schools are "Sample … School"). His picture is a drawing (SVG), his
  greeting a generated three-note tune (WAV), his video three title cards drawn and recorded in the test browser (WebM), all
  made on this laptop by `revision_tools/resume_w02/make_media.py`. No real person, nothing downloaded.
- Lesson pages print only the output lines a step changes (with their line numbers; Step 1 prints its whole output in two
  columns); the task pages print every complete task output. Without this the 8 lesson pages overflowed by up to 6 in.

## What was built

| File | What it is |
| --- | --- |
| `DotNet1_Week_02.codeshare.json` | Module `dotnet-1-r02`, `"sampleFirst": true`, `previousModuleId` `dotnet-1-r01`, starter = Juan's Week 1 page, 5 lessons, 9 media steps (`includeMediaOutput`; Step 7 `mediaChecks` 3 broken files), each with page checks and one task (`<step id>-alter-v1`), 5 exit slips (15/20/15/15/20), performance task (50 points). |
| `DotNet1_Multimedia_Tables_Module.pdf` | 11 pages of 612 × 936 pt: lessons pp. 1–6, strips pp. 7–8, task pages pp. 9–11. |
| `DotNet1_ILAW_Week_02.docx` | DLL from Resume Week 1's DLL; 7 pages when rendered. |
| `source/` | p1–p8 (`revision_tools/resume_w01/build.py r02`), p9–p11 (`revision_tools/build_tasks.py r02`), `style.css`, `tasks.css`. |
| `solutions/<step id>/index.html` | The answer to each task (never in the JSON). |
| `project_start/` | = `Resume/Week_01/project_end/` (Juan's Week 1 page). |
| `project_end/` | Juan's finished Week 2 page (= Steps 6 and 9) and `images/juan_profile.svg`, `audio/greeting.wav`, `video/juan_intro.webm` (1 KB, 53 KB, 25 KB). `Resume/project/` is the same. |
| `teacher_pictures/` | `resume_picture_1.svg` (head and shoulders shape), `_2` (laptop with code), `_3` (book and star): drawings for students without a photo. |
| `check_codeshare.py`, `check_web_steps.cjs` | Copied unchanged from `Resume/Week_01/`. |
| `test_checker.py` | Week 2 checker tests (adapted from Week 1's). |

Teacher's tools changed (originals in `revision_tools/before_revision/`: `resume_w01/`, `*_r01.*`, `render_r01.sh`):
`resume_w01/build.py` builds any Resume week (`build.py r02`; Week 1's layout moved into `resume_w01/content.py`; Week 1
rebuilt byte-identical: JSON, pages, answers and every DLL part), media steps, printed → tabs and changed-output lines;
`tasks.py` (loads r01 and r02), `build_tasks.py` (r02: three task boxes per row, → tabs, Week 2 extras), `consistency.py`
(→ tabs, output lines by line number, three-column code), `render_r01.sh` (`WEEK=02`), `run_checks.sh` (Resume Week 2
section). New: `resume_w02/content.py` (the one source), `resume_w02/make_media.py`.

## Steps and tasks

| Step | Sample | Task | Why it exercises the lesson |
| --- | --- | --- | --- |
| 1 (Mon) | img (src, alt, width, height) replaces Week 1's photo comment | add `<p>My profile picture is a drawing, not a photo.</p>` | alt is not page text; describe a picture visibly |
| 2 (Mon) | Education table: caption, thead with 3 `th scope="col"`, tbody with 2 rows | add an Elementary row | each tr is one line |
| 3 (Tue) | audio with src and controls | play it, add `<p>I heard three rising notes.</p>` | check and describe sound |
| 4 (Tue) | video with src, controls, width="320" | play it, add the 4-second description | check playback; describe video |
| 5 (Wed) | award row, one `td colspan="3"` | add a second award row | colspan |
| 6 (Wed) | Skill levels table: two tbody row groups, `th scope="rowgroup" rowspan="2"` (finished page) | rowspan 2→3 and a third Computer skill | rowspan |
| 7 (Thu) | three wrong src (capital letters, .mp3, videos/) | diagnose: add a "Broken: … should be …" line (CKB-084) | exact media names |
| 8 (Thu) | media repaired; Junior high row without td (its words jump above the caption) | put each value in td | table structure repair |
| 9 (Fri) | Juan's finished page (= Step 6) | add a media credit line | honest credit before presenting |

## How it came out (real runs, Chromium, no internet)

- Table page text: caption on its own line; each tr one line; a tab between cells; a colspan/rowspan cell leaves fewer
  cells on that line (`Making slide presentations→Very good`); an empty cell would leave a stray tab (none used).
- Words inside a tr without td move above the table (Step 8); a tr after `</tbody>` still shows in the table; `rowspan="3"`
  in a two-row tbody stops at the end of its tbody (same output).
- alt, controls, loop, muted, width and colspan changes leave the output the same; a wrong src ending keeps the page
  text and turns its Media checks line into `image failed to decode` / `playback failed`.
- `<video><source src=…>` reports `null` as the file name in both checkers, so every sample puts src on the element.
- Every claim in the DLL's Predict/Debug lines and the module's Check yourself, "Try this" and practice notes came from
  these runs.

## Checks run (2026-11-06, `bash revision_tools/run_checks.sh` from the Net Files folder)

**Resume Week 2 samples** (`check_codeshare.py DotNet1_Week_02.codeshare.json --run --media-root project_end`)

```text
PASS dotnet-1-r02-d1-s1
PASS dotnet-1-r02-d1-s2
PASS dotnet-1-r02-d2-s3
PASS dotnet-1-r02-d2-s4
PASS dotnet-1-r02-d3-s5
PASS dotnet-1-r02-d3-s6
PASS dotnet-1-r02-d4-s7
PASS dotnet-1-r02-d4-s8
PASS dotnet-1-r02-d5-s9
OK: 5 lessons, 9 steps, 21 ids, no problems found.
```

**Resume Week 2 task answers (solutions/)**: the same 9 PASS lines and `OK: 5 lessons, 9 steps, 21 ids, no problems found.`

**Unchanged samples against task outputs (every step must fail)**: `9 problem(s)`, one `Output differs` line per step.

**test_checker.py** (`python3 test_checker.py -v`)

```text
test_a_wrong_file_name_not_listed_as_broken_fails ... ok
test_all_nine_samples_pass_with_juans_media ... ok
test_changed_output_fails_then_restored_output_passes ... ok
test_colspan_change_keeps_page_text_but_fails_the_page_check ... ok
test_duplicate_id_rejected ... ok
test_repairing_a_file_listed_as_broken_fails_ckb_084 ... ok
test_row_without_td_moves_its_words_out_of_the_table ... ok
test_without_the_media_files_a_media_step_fails ... ok
Ran 8 tests ... OK
```

**Printed module vs JSON** (`consistency.py`): all 9 task boxes match; printed sample code and outputs on pp. 1–8 match
(14 code blocks, 10 output parts at their line numbers; Step 9 printed as "the same as Step 6"). `ALL MATCH`. Proof it
catches a mismatch: one printed output word changed on p. 4 → `MISMATCH`; restored → `ALL MATCH`. The same run still
passes every check of Resume Week 1 and the retired Weeks 1–3.

**Personal project files**: the starter (its placeholder picture expected broken) and the example ran with no error.

**Word search** (DLL text, module PDF text, module source, JSON) for VS Code, Visual Studio, Chrome, Ctrl+O, folder, canteen,
ADJUST THIS, Week 01, pandesal: 0 hits each. "Week 1 page" appears on purpose (Juan's carried-forward page). DLL: "(10 mins)"
once, AI declaration once, teacher's name twice, 5 "Sample, then your task:" lines, Reflections blank, 26 links in the text (25 references + the
guide; 20 different addresses).

**Rendering**: every module page (11) renders to exactly one 612 × 936 pt page; spare space 0.02–0.96 in (p. 5: 0.71 in);
every page image inspected. Every DLL page (7) rendered with LibreOffice and inspected.

## CodeShare browser test (`tests/web-module-steps.browser.mjs`, Week 2 subtests adapted, branch `docs/net-resume-week-02`)

Cloudflare's runtime (`opennextjs-cloudflare preview`, port 8787, local R2): 8 passed, 6 skipped, 0 failed. The teacher adds
Juan's 3 files under Media files; each Week 2 sample then passes in the teacher preview with its media lines (1, 1, 2, 3, 3,
3, 3, 3, 3); the student walk:

```text
dotnet-1-r01-d1-s1 … dotnet-1-r01-d5-s9: sample verified, task completed (9 lines)
dotnet-1-r02-d1-s1: sample verified, task completed
dotnet-1-r02-d1-s2: sample verified, task completed
dotnet-1-r02-d2-s3: sample verified, task completed
dotnet-1-r02-d2-s4: sample verified, task completed
dotnet-1-r02-d3-s5: sample verified, task completed
dotnet-1-r02-d3-s6: sample verified, task completed
dotnet-1-r02-d4-s7: sample verified, task completed
dotnet-1-r02-d4-s8: sample verified, task completed
dotnet-1-r02-d5-s9: sample verified, task completed
```

Week 2 personal project: run with an error refused, run and submit, a teacher picture added under Media files shows in the
page window and is frozen with the submission, 100%, teacher review. Cloudflare log: no errors.

Offline settings (`next start`, port 3042, laptop Java): 7 passed, 7 skipped, 0 failed. Week 1: 9 × "sample verified, task
completed"; Week 2: 9 × "teacher-checked (no media storage on this server), marked done"; personal project text only (the
picture is not there), submitted, 100%.

Found and worked around: CKB-092. With `src` page checks on Steps 1, 3, 4, the Cloudflare run failed at Week 2 Step 1
(`img has src="images/juan_profile.svg" — found data:image/svg+xml;base64,…`) because CodeShare embeds uploaded media as
`data:`; those checks were removed (the Media checks lines name the src). Proof the test catches a wrong answer: a copy with
Step 5's answer changed to "Grade 12" failed at `dotnet-1-r02-d3-s5: task NOT completed — line 39: required "Award: Best
science poster, Grade 11", page gave "… Grade 12"`.

## References (all opened 2026-11-06)

MDN: Images in HTML; Video and audio content; HTML table basics; HTML table accessibility; img, audio, video, th, td
elements; Image file type and format guide; Debugging HTML. WHATWG HTML Standard: Embedded content (img); Media elements;
Tabular data. W3C WAI: Images tutorial; Tables tutorial; Tables with irregular headers; Making Audio and Video Media
Accessible. Common Sense Education: Privacy and security.

## Not verified

- The hosted site, phones, browsers other than Chromium, the classroom Wi-Fi and printing on paper.
- Students' own phone photos (only the drawn teacher picture was uploaded in the test); offline media (not built yet).
- The sound of `greeting.wav` was not listened to by a person; it played ("playback advanced") in both checkers.
