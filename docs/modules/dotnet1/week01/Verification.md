# Resume Week 1 verification

.NET 1 · Week 1 · HTML fundamentals, paragraphs and lists · built 2026-11-06 for Ireneo D. Seraspe Jr., Cielito Zamora
Senior High School. Dates, grade and sections stay blank. This checks the files on the teacher's laptop and CodeShare run
locally (local Supabase); it is not the hosted site or classroom devices.

## Decisions used

- Rolling weekly prompt (approved 2026-10-30) and the teacher's answers of 2026-11-06: module id `dotnet-1-r01` (the
  `dotnet-1-resume-w01` names recorded earlier that day are not used); this chat builds Week 1; Friday is performance task
  day, with one Friday step that shows Juan's finished page for the presentation.
- Guide Quarter 1, competencies 1–3 (course map, Week 01). No media this week. Everything happens inside CodeShare (CKB-085).
- Juan Dela Cruz and every detail about him are made up (Grade 11, ICT strand, skills, interests, clubs). No school name,
  address, phone number, birth date, ID numbers or social-media accounts.

## What was built

| File | What it is |
| --- | --- |
| `DotNet1_Week_01.codeshare.json` | Module `dotnet-1-r01`, `"sampleFirst": true`, no `previousModuleId`, no starter files (first week), 5 lessons, 9 steps, each with page checks and one task (`<step id>-alter-v1`), 5 exit slips (15/20/15/15/20), performance task (50 points). |
| `DotNet1_HTML_Fundamentals_Lists_Module.pdf` | 11 pages of 612 × 936 pt: lessons pp. 1–6, strips pp. 7–8, task pages pp. 9–11. |
| `DotNet1_ILAW_Week_01.docx` | DLL from Week 3's DLL as a format template; 7 pages when rendered. |
| `source/` | p1–p8 (from `revision_tools/resume_w01/build.py`), p9–p11 (from `revision_tools/build_tasks.py r01`), `style.css`, `tasks.css`. |
| `solutions/<step id>/index.html` | The answer to each task (never in the JSON). |
| `project_start/` | Empty (first week). |
| `project_end/index.html` | Juan's finished Week 1 page (= Step 6 and Step 9 samples); `Resume/project/index.html` is the same file. |
| `check_codeshare.py`, `check_web_steps.cjs` | Copied unchanged from `Week_03/`. |
| `test_checker.py` | Week 1 checker tests (adapted from `Week_03/test_checker_week02.py`). |

Teacher's tools changed (originals in `revision_tools/before_revision/`): `tasks.py` (adds the `r01` week),
`build_tasks.py` (builds only the weeks named, `r01` split 4 + 3 + 2, extra boxes, VS Code/Chrome sentence and "folder"
wording removed), `answers_json.py` and `unchanged_json.py` (accept `r01`), `consistency.py` (task pages up to p. 11 and a
check of the printed sample code and outputs), `run_checks.sh` (Resume Week 1 section). New: `resume_w01/content.py` (the
one source), `resume_w01/build.py`, `render_r01.sh`. `DotNet1_Handover.md` rewritten (backups in `before_revision/`).

## Steps and tasks

| Step | Sample | Task | Why it exercises the lesson |
| --- | --- | --- | --- |
| 1 (Mon) | page skeleton, h1, one p | add `<p>I like making simple web pages.</p>` | a paragraph shows only inside body |
| 2 (Mon) | comment, strong, em, Skills ul, Goals ol type="1" start="1" | add a third skill li | a new item goes inside its list |
| 3 (Tue) | sup, sub, b, i, mark, small | add `<p>I can type <strong>35 words per minute</strong>.</p>` | strong marks importance; the page text shows only the words |
| 4 (Tue) | motto with br, hr, club schedule in pre | add the line `Friday     Basketball` inside pre | pre keeps every space |
| 5 (Wed) | Interests ul; Goals type="A" | add the interest Playing the guitar | list items; markers are checked by page checks, not page text |
| 6 (Wed) | Sports list inside Interests; ol start="3" reversed | add Volleyball under Sports | nested list |
| 7 (Thu) | comment ends with `->`: only the heading shows | repair it to `-->` | structure repair |
| 8 (Thu) | Skills without li: one line | wrap each skill in li | list repair |
| 9 (Fri) | Juan's finished page (same as Step 6) | add `<p><em>Thank you for reading my resume.</em></p>` | closing line before the presentation |

## How the page text came out (real runs, Chromium, no internet)

- b, strong, i, em, mark, small: only their words. `1<sup>st</sup>` → `1st`; `H<sub>2</sub>O` → `H2O`
  (`10<sup>2</sup>` would read `102`, so it is not used).
- br → a new line; hr → nothing; pre → every space kept; a line break inside a paragraph's code → one space.
- List markers (numbers, letters, bullets, type, start, reversed) → never in the page text.
- Comment ending in `->` → everything after it hidden. Missing closing title tag → whole page in the Tab title, page blank.
  A paragraph typed between head and body → still shown (the browser moves it into body). Every row of the p. 5 problem
  guide and every claim in the DLL's Predict/Debug lines was produced this way.

## Checks run (2026-11-06, `bash revision_tools/run_checks.sh` from the Net Files folder)

**Resume Week 1 samples** (`check_codeshare.py DotNet1_Week_01.codeshare.json --run --media-root project_end`; page checks included)

```text
PASS dotnet-1-r01-d1-s1
PASS dotnet-1-r01-d1-s2
PASS dotnet-1-r01-d2-s3
PASS dotnet-1-r01-d2-s4
PASS dotnet-1-r01-d3-s5
PASS dotnet-1-r01-d3-s6
PASS dotnet-1-r01-d4-s7
PASS dotnet-1-r01-d4-s8
PASS dotnet-1-r01-d5-s9
OK: 5 lessons, 9 steps, 21 ids, no problems found.
```

**Resume Week 1 task answers (solutions/)**: the same 9 PASS lines and `OK: 5 lessons, 9 steps, 21 ids, no problems found.`

**Resume Week 1 unchanged samples against task outputs (every step must fail)**: `9 problem(s)`, one `Output differs` line
for each of the 9 steps.

**test_checker.py** (`python3 test_checker.py -v`)

```text
test_all_nine_samples_pass ... ok
test_changed_output_fails_then_restored_output_passes ... ok
test_duplicate_id_rejected ... ok
test_list_marker_change_keeps_page_text_but_fails_the_page_check ... ok
test_removed_space_in_pre_changes_the_output ... ok
test_repaired_comment_fails_the_broken_samples_page_check ... ok
Ran 6 tests ... OK
```

**Printed module vs JSON** (`consistency.py`): all 9 task boxes match the JSON instruction and expected output; printed
sample code and outputs on pp. 1–8 match the JSON (13 code blocks, 8 outputs; Step 9 is printed as "the same as Step 6",
which the check confirms). `ALL MATCH`.

The same run still passes every check of the retired Weeks 1–3 (their files were not changed).

**Personal project files** (run in `check_web_steps.cjs`): the starter and the example (Juan's finished page) both run with
no error.

**CodeShare's upload schema** (`backend/src/course-module-schema.ts` on `main`): accepts the file; all 9 steps keep their
page checks and task ids.

**Word search** (DLL text, module PDF text, module source, JSON) for VS Code, Visual Studio, Chrome, Ctrl+O, folder,
canteen, ADJUST THIS, Week 3, pandesal, Order Calculator: no hits. DLL: "(10 mins)" once, AI declaration once, teacher's
name twice (header and signature), 5 "Sample, then your task:" lines, Reflections blank, 26 links (25 references + guide).

**Rendering**: every module page (11) renders to exactly one 612 × 936 pt page; spare space per page 0.03–1.31 in; every
page image inspected. The p. 7 answer lines are as tight as the old Week 3 p. 7 (same layout). Every DLL page (7) rendered
with LibreOffice and inspected.

## CodeShare browser test (`tests/web-module-steps.browser.mjs`, changed to read the Resume weeks)

Offline settings (`next start`, port 3042, local Supabase, laptop Java) and Cloudflare's runtime (`opennextjs-cloudflare
preview`, port 8787): the same result on both, 6 passed, 8 skipped, 0 failed.

```text
teacher preview: dotnet-1-r01-d1-s1 … d5-s9: pass (page text + 5/6/7/3/3/5/3/2/6 page checks)
dotnet-1-r01-d1-s1: sample verified, task completed
dotnet-1-r01-d1-s2: sample verified, task completed
dotnet-1-r01-d2-s3: sample verified, task completed
dotnet-1-r01-d2-s4: sample verified, task completed
dotnet-1-r01-d3-s5: sample verified, task completed
dotnet-1-r01-d3-s6: sample verified, task completed
dotnet-1-r01-d4-s7: sample verified, task completed
dotnet-1-r01-d4-s8: sample verified, task completed
dotnet-1-r01-d5-s9: sample verified, task completed
```

Skipped: 5 old-format subtests (the weeks are sample-first) and 3 subtests that need Resume Weeks 2–3. Proof the test
catches a wrong answer: with a copy of this week whose Step 4 answer has 4 spaces instead of 5, the test failed on Cloudflare's
runtime: `dotnet-1-r01-d2-s4: task NOT completed — ✗ Page text matches; line 22: required "Friday     Basketball", page
gave "Friday    Basketball"`; the real files pass (above). Cloudflare log: no errors.

## References (all opened 2026-11-06)

WHATWG HTML Standard (Introduction: History; Text-level semantics; Grouping content; Comments), MDN (HTML; Basic HTML
syntax; Web page metadata; Lists; Emphasis and importance; br; hr; pre; ol; ul; li; Debugging HTML; title), W3C WAI
Headings tutorial, Common Sense Education Privacy and Security. Dropped: privacy.gov.ph (Data Privacy Act) and
officialgazette.gov.ph (RA 10173) both answered 403 Forbidden to the checking tool.

## Not verified

- The personal performance-task project for Week 1 inside CodeShare (Run, Submit this version): its subtest is written for
  Week 2 and skips; the starter and example ran in the teacher's checker only.
- The hosted site, phones, other browsers than Chromium, the classroom Wi-Fi and printing on paper.
- The DLL has 7 pages (Week 3's had 6); nothing was cut to force 6.

**Print:** pages 1–6 double-sided, flip on long edge; pages 7–8 single-sided; pages 9–11 double-sided, flip on long edge.
