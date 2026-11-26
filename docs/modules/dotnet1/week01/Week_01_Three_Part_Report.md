# .NET 1 Week 1 three-part report

File: `docs/modules/dotnet1/week01/DotNet1_Week_01.threepart.codeshare.json` (built 2026-11-24, branch
`content/dotnet1-week01-three-part`), made from `DotNet1_Week_01.codeshare.json` in the same folder, which stays
unchanged. Same module id (`dotnet-1-r01`), 9 steps over five days, the same lessons, exit slips, starter files (none),
performance task and Week 1 start (no previous module).

## Read this first

- **It replaces Week 1.** Every own task has a new question id ending `-alter-v2`, so earlier Week 1 completions would
  not count. No class uses the .NET subject yet (teacher, 2026-11-24), so nobody's work resets.
- **Upload it only after the web guided-example app change (pull request #136) is live.** An older server refuses a
  guided example on a web step.
- **The PDF module and the Word DLL are updated** (after your approval, 2026-11-24): see Printed module and lesson plan.
- Nothing was uploaded. Weeks 2–10, the Java weeks and `Documents/Java 2026` are unchanged.

## How each step works

1. **Sample and discussion:** run the sample unchanged (Sample verified). The discussion walks through `index.html`
   line by line ("Look at line N"), names the tag or attribute and ties it to an earlier step.
2. **Guided example:** the exact code and the line to put it on. It is the old Week 1 task, whose output was already
   verified. Guided example verified never completes the step.
3. **Your task:** the same kind of change with one thing different and no code given. It starts from the guided code
   still in the editor: the wording says what to do with the guided line (change, move, take out, undo, swap; CKB-141).
   Only this gives Completed.
   Its page text differs from the guided example's on every step.

| Step | Own-task id | Discussion lines | Guided example | Your task (one thing different) | Answer key (teacher only) |
|---|---|---|---|---|---|
| 1 | `dotnet-1-r01-d1-s1-alter-v2` | 1, 2, 4, 5, 7, 8, 9, 10 | Second paragraph: I like making simple web pages. | Second paragraph, own words: My favourite subject is ICT. | index.html, line 11:<br>  <p>My favourite subject is ICT.</p> |
| 2 | `dotnet-1-r01-d1-s2-alter-v2` | 9, 10, 11, 12, 13, 14, 18 | Third skill in Skills (ul): Fixing simple computer problems | Third goal in Goals (ol): Finish every module step. | index.html, line 21:<br>    <li>Finish every module step.</li> |
| 3 | `dotnet-1-r01-d2-s3-alter-v2` | 12, 13, 14, 15, 16, 17 | Paragraph with strong: I can type 35 words per minute. | Paragraph with mark: I finished 12 HTML exercises. | index.html, line 14:<br>  <p>I finished <mark>12 HTML exercises</mark>.</p> |
| 4 | `dotnet-1-r01-d2-s4-alter-v2` | 28, 29, 32, 34, 35, 36 | pre line: Friday + 5 spaces + Basketball | pre line: Saturday + 3 spaces + Volleyball | index.html, lines 36-37:<br>Wednesday  Drawing<br>Saturday   Volleyball</pre> |
| 5 | `dotnet-1-r01-d3-s5-alter-v2` | 23, 24, 25, 28, 30 | Last interest: Playing the guitar | First interest: Taking photos | index.html, line 25:<br>    <li>Taking photos</li> |
| 6 | `dotnet-1-r01-d3-s6-alter-v2` | 28, 29, 30, 32, 33, 34, 41 | Volleyball in the inner Sports list | Gardening in the outer list, before Sports | index.html, line 28:<br>    <li>Gardening</li> |
| 7 | `dotnet-1-r01-d4-s7-alter-v2` | 8, 9, 10, 55 | Line 9 repaired: -> becomes --> | Comment ends after the introduction, hiding it on purpose | index.html, line 11:<br>  a senior high school student in the <em>ICT strand</em>.</p> --> |
| 8 | `dotnet-1-r01-d4-s8-alter-v2` | 19, 20, 21, 25 | Each skill in its own li | Each skill in its own li, Making slide presentations first | index.html, lines 20-21:<br>    <li>Making slide presentations</li><br>    <li>Typing documents</li> |
| 9 | `dotnet-1-r01-d5-s9-alter-v2` | 5, 9, 10, 29, 52, 54 | Closing line with em: Thank you for reading my resume. | Closing line with strong: I am ready to present. | index.html, line 55:<br>  <p><strong>I am ready to present.</strong></p> |

The complete solved pages are in `solutions/<step id>/index.html` (guided example, the old answers) and
`solutions/<step id>-alter-v2/index.html` (own task).

## Things to know

- **Steps 3 and 9:** the "one thing different" includes a formatting element (`mark`, `strong`). Formatting is not
  page text, so CodeShare checks only the new words; a student who used `strong` in Step 3 would still pass. The old
  Week 1 tasks had the same limit.
- **Step 6:** the own task puts Gardening **before** Sports in the outer list. After Chess it would have given the same
  page text whether it was inside or outside the Sports list, so CodeShare could not tell them apart.
- **Step 7:** the own task leaves line 9's broken `->` in place and ends the comment after the introduction, so the
  introduction is hidden on purpose.
- The "How to use this module" text now explains the three parts. No other lesson text changed.

## Checks run

- Teacher's checker (`check_codeshare.py --run`, offline browser): all 9 samples PASS.
- `test_threepart_checker.py` (same checker): 9 samples, 9 guided pages and 9 own-task answers pass; the guided pages
  fail against their own tasks.
- `tests/dotnet1-week01-three-part.test.mjs`: uploads; ids and samples unchanged; every "Look at line N" quote
  (53 quotes), guided line and answer-key line sits at the line it names (shown failing with one wrong number each);
  CodeShare's rule takes sample, guided example, then own task, and the guided page never completes.
- `tests/dotnet1-week01-three-part.browser.mjs`, real CodeShare: a student runs every sample, the own-task page (Guided
  example not verified), the guided page (verified, not Completed), the guided page again, then the own task
  (Completed) for all 9 steps, and never sees the answer key. Passed in offline classroom settings (laptop runner on)
  and online settings (no laptop runner), both on this laptop with local Supabase.

## Not checked

- The hosted site. The online run used this branch's app on the laptop.
- The teacher's Module preview and class step with this file. The general behaviour is covered by
  `tests/web-guided.browser.mjs`.

## Printed module and lesson plan

- **PDF (`DotNet1_HTML_Fundamentals_Lists_Module.pdf`), now 18 pages of 612 × 936 pt.** Pages 1–8 are unchanged except:
  page 1's "How to use this module" explains the three parts; each step's last line points to its step-guide page;
  every footer says "of 18". The old task pages 9–11 are now the **step guide, pages 9–17, one step per page**: the
  step's full sample with line numbers (pages 1–6 print only parts of it, and the discussion counts lines from the top),
  the discussion, the guided example with its code and expected output, and Your task with its expected output.
  The check-yourself table (now with a Guided example verified column) is on page 9. **No answer is printed.**
- Built from `source/` with `build_step_pages.py` (step pages from the module file) and `render_pdf.cjs` (Chromium,
  your page size). Rendering the unchanged pages first gave exactly the text of your old PDF.
- **Word DLL (`DotNet1_ILAW_Week_01.docx`), still 7 pages:** the five Student Activity lines now read "Sample, guided
  example, then your task" with the step-guide pages (9–10, 11–12, 13–14, 15–16, 17), and the Friday scaffolding line
  says the guided example adds a closing line and Your task adds a different one. Nothing else changed. Checked by
  converting it to PDF with LibreOffice, not in Microsoft Word.
- `tests/dotnet1-week01-three-part.test.mjs` checks every printed step page against the module file (numbered sample,
  guided code, both outputs) and that no answer line or note is printed (shown failing with an answer put on page 9).

- **Page 18, "Week 01: before you submit" (restored 2026-11-25, CKB-146):** the step guide had dropped the old task
  pages' other sections; page 18 prints them unchanged: My Resume self-check, My presentation notes (Friday) and Get ready for Week 2. Footers now say "of 18".

## Correction (2026-11-24, CKB-141)

The first version's Your task wording started from the sample, but the guided code stays in the editor, so a student
who followed it failed (Step 2: the guided skill was still there). The wording now starts from the guided code; outputs,
answer keys and `-v2` ids are unchanged. **Upload the corrected file again** over the one on the live site (steps below);
no student work resets. Printed step guide (pages 9–17) rebuilt; the DLL does not quote these lines.

## Correction (2026-11-24, CKB-142)

Step 3's Your task said "the element from line 16"; after the guided line on line 14 that is line 17 in the student's
editor. It now says "the element on line 16 of the sample in the discussion". A test checks every line number in Your
task against the editor after the guided example. Upload the file again (wording only); step guide page 11 rebuilt.

## Upload steps (after #136 and this pull request are merged and the site is updated)

1. Sign in to CodeShare as the teacher and open a class whose subject is Net MVC.
2. Go to **Curriculum** and press **+ Add module**.
3. Choose `DotNet1_Week_01.threepart.codeshare.json` from `docs/modules/dotnet1/week01`.
4. If CodeShare says a different copy of this module is already shared, confirm that you want to replace it.
5. Open Week 1, Step 1: check that **Answer key (teacher only)** shows under **Your task**.
