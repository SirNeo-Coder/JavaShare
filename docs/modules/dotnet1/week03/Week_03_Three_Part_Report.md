# .NET 1 Week 3 three-part report

File: `docs/modules/dotnet1/week03/DotNet1_Week_03.threepart.codeshare.json` (built 2026-11-25, branch
`content/dotnet1-week03-three-part`), made from `DotNet1_Week_03.codeshare.json`, which stays unchanged. Same module id
(`dotnet-1-r03`), 9 steps over five days, the same lessons, exit slips, starter file, performance task and link to
Week 2 (`previousModuleId: dotnet-1-r02`). Built with `docs/modules/dotnet1/three_part_prompt.md` (CKB-141, CKB-142),
now with its "Several files" section.

## Read this first

- **Week 3 has three pages:** index.html, projects.html and contact.html. A step loads only its own pages; the others keep
  the student's earlier saved work. Every discussion line, guided line and answer key names its page ("Look at line 8 of
  contact.html").
- **Only Steps 1 and 9 are media steps** (they run index.html with Juan's picture, sound and video). Online, after you add
  Week 3's media files, they are checked automatically. Offline they show "Checked by your teacher for now": you mark them
  done from the student's module card. **Steps 2–8 are checked automatically everywhere, online and offline.**
- **New question ids** end in `-alter-v2`. No class uses the .NET subject yet, so nobody's work resets.
- Nothing was uploaded. Weeks 1–2, Weeks 4–10, the Java weeks and `Documents/Java 2026` are unchanged.
- **The PDF module and the Word DLL are updated** (2026-11-25): see Printed module and lesson plan.

## How each step works

1. **Sample and discussion:** run the sample unchanged; the discussion reads the numbered page ("Look at line N of …").
2. **Guided example:** the old Week 3 task, whose output was already verified, with its exact code and line.
3. **Your task:** starts from the guided code still in the editor and says what to do with it; one thing different; no
   code given. Its page text differs from the guided example's on every step (proved with your checker).

| Step | Run page | Own-task id | Discussion lines | Guided example | Your task | Answer key (teacher only) |
|---|---|---|---|---|---|---|
| 1 | index.html | `dotnet-1-r03-d1-s1-alter-v2` | index.html 8 ×5, 9, 12; projects.html 5, 8 | line 13 of index.html: Read about my school work on my projects page. | Change the guided sentence: See my best school work on my **projects list**. Keep the href. | index.html, line 13 |
| 2 | contact.html | `dotnet-1-r03-d1-s2-alter-v2` | contact.html 5, 10, 12, 13, 13, 15 | lines 15 to 18 of contact.html: the Your school box | Change the guided box into a Your section box: label words, for, id and name all section. | contact.html, lines 15-18 |
| 3 | projects.html | `dotnet-1-r03-d2-s3-alter-v2` | projects.html 8 ×4, 14 | line 15 of projects.html: Back to my resume | Change the link words to Return to my resume. Keep the href. | projects.html, line 15 |
| 4 | contact.html | `dotnet-1-r03-d2-s4-alter-v2` | contact.html 8 ×3, 10, 11 | line 11 of contact.html: …read my resume and my projects. | Swap the two links: …read my projects and my resume. Each keeps its href. | contact.html, line 11 |
| 5 | projects.html | `dotnet-1-r03-d3-s5-alter-v2` | projects.html 15, 16 ×4 | line 17 of projects.html: Open the contact form on its own page | Change the link words to See the contact form on a page of its own. | projects.html, line 17 |
| 6 | contact.html | `dotnet-1-r03-d3-s6-alter-v2` | contact.html 14, 14, 18, 22, 23, 24, 29, 31 | line 25 of contact.html: Science fair | Change the guided option to Math quiz bee and move it to the top, above School project. | contact.html, lines 23-25 |
| 7 | contact.html | `dotnet-1-r03-d4-s7-alter-v2` | contact.html 8, 8, 9, 10, 13 | change line 8 of contact.html: put the quote back | Keep the repair; change that link's words to Contact me. | contact.html, line 8 |
| 8 | contact.html | `dotnet-1-r03-d4-s8-alter-v2` | contact.html 8, 28, 29, 31 | change line 29 of contact.html: close the textarea | Keep the repair; change the button's words on line 31 to Send to Juan. | contact.html, lines 29 and 31 |
| 9 | index.html | `dotnet-1-r03-d5-s9-alter-v2` | index.html 8, 10, 116, 118, 119; projects.html 16; contact.html 11 | line 119 of index.html: the honest note | Change the note to: Honest note: my contact form is only a prototype. It sends nowhere and saves nothing. | index.html, line 119 |

## Things to know

- **Step 2:** only the label words are page text, so CodeShare checks Your section. for, id and name (your choice,
  2026-11-25: change all four) are not page text; the answer key reminds you to check them by eye.
- **Steps 7 and 8:** a student who skips the repair does not pass: the broken quote (Step 7) or the open textarea (Step 8)
  swallows the new words.
- **Step 5:** the frame shows contact.html, but the framed page's text is never page text, so Step 5 passes whatever the
  student's contact.html holds.
- **Offline, Steps 1 and 9 save no code.** CodeShare saves a step's pages only when its task completes. When you mark
  Step 1 done, the student's index.html stays the Week 2 page (no navigation bar) and projects.html appears only at Step 3,
  until Step 9 loads all three pages. No check of Steps 2–8 depends on index.html, so nothing fails. This is CodeShare's
  existing completion-only saving, not a Week 3 change; the original Week 3 file was not re-run to compare.
- Step 9's note stays true: the form has no action, so it sends nowhere and saves nothing.

## Checks run

- Teacher's checker with Week 3's media (`check_codeshare.py --run --media-root project_end`): all 9 samples PASS.
- `test_threepart_checker.py` (5 tests, OK): 9 samples, 9 guided pages and 9 own-task answers pass with the real media;
  the own answers also pass when only the run page is put each time, so every other page is what the previous steps' own
  tasks left; the guided pages fail against their own tasks. Shown failing (2 tests) with Step 2's guided page put back
  as its own answer, then passing.
- `tests/dotnet1-week03-three-part.test.mjs` (5 tests, pass): upload, ids, unchanged samples; 54 discussion quotes, each
  in the page it names; guided and answer-key lines per page; continuity (the edits Your task describes turn the guided
  page into the answer page); Your task's line numbers per page; each step's output, frame and own-task change use only
  the pages it loads; CodeShare's sample → guided → task rule (media lines on Steps 1 and 9). Shown failing, one at a
  time, then restored and passing: a wrong discussion line; a discussion naming a page the step does not load; a wrong
  answer-key line; an answer key naming the wrong page; the old wording without "guided example"; a Your-task line
  counted in the sample; a Your-task line in the wrong page; a Your-task change to a page the step does not load; the
  framed page's text in Step 5's output.
- `tests/dotnet1-week03-three-part.browser.mjs`, real CodeShare, local Supabase, this branch's build. A student opens each
  step; every page the step does not load must still hold the student's latest saved work (earlier own-task changes
  included); then sample verified, own-task page refused as the guided example, guided verified (not Completed), the code
  left in the editor changed as Your task says → Completed.
  - **Cloudflare's runtime on this laptop (port 8787) with Week 3's media added:** 11/11 pass, all 9 steps Completed.
  - **Offline settings (port 3081):** 10/10 pass: Steps 2–8 Completed; Steps 1 and 9 "Checked by your teacher for now",
    worksheet shows the discussion and guided code and no answer key, teacher marks them done.
  - **Online settings without media storage (port 3082):** 10/10 pass, the same as offline.
- `npm run build:all`, `npm run lint`, `npm test`: see the pull request.

## Not checked

- The hosted site and its real media storage.
- The teacher's Module preview and class step with this file.

## Printed module and lesson plan

- **PDF (`DotNet1_Links_Frames_Forms_Module.pdf`), now 18 pages of 612 × 936 pt, each one sheet.** Pages 1–8 are
  unchanged except page 1's "How to use this module", each step's "Next: step guide, page N", page 6's "Starter pages …
  are on page 18" and the footers ("of 18"). Rendering the unchanged pages first gave exactly the text of your old PDF.
- **Step guide, pages 9–17, one step per page** (`build_step_pages.py`, your option A): the sample lines the discussion
  and guided example name, one line either side, with their **real line numbers**, **the page name above each excerpt**
  (the run page first; Step 1 also shows projects.html, Step 9 all three pages), then the discussion, the guided example,
  Your task and the two expected outputs side by side. The check-yourself table is on page 9. **No answer is printed.**
- **Steps 1 and 9** (index.html, 56-line outputs) print only the output lines that differ from the sample's output, with
  their line numbers; every other line is the same (your choice, 2026-11-25). Steps 2–8 print both outputs in full.
- **Page 18, "Week 03: before you submit"** (your choice, 2026-11-25): old page 10's four sections, unchanged: Before you
  add your pages, My Resume self-check, Get ready for Week 4, Starter pages; plus the old page 9's two notes (Weeks are
  linked; Run page). Weeks 1 and 2's PDFs lost their similar sections (CKB-146); they are not changed here.
- **Word DLL (`DotNet1_ILAW_Week_03.docx`), still 7 pages:** the five "Sample, then your task" lines now read "Sample,
  guided example, then your task" with the step-guide pages (9–10, 11–12, 13–14, 15–16, 17) and "starting from the guided
  code"; Friday's scaffolding line names the guided example, Your task and the starter pages on p. 18. Nothing else
  changed (6 paragraphs). Checked through a LibreOffice PDF, not in Microsoft Word.
- `tests/dotnet1-week03-three-part.test.mjs` checks every printed step page: each printed line matches its page's sample
  at its number, every named line is printed, outputs (full or differing lines) match, Your task's wording is printed, no
  answer is printed, and page 18 keeps its four sections. Shown failing with a wrong printed number, an answer line
  printed as code, and Step 1's new output line missing.

## Upload steps (after this pull request is merged)

1. Sign in as the teacher and open a class whose subject is Net MVC.
2. **Curriculum** → **+ Add module** → choose `DotNet1_Week_03.threepart.codeshare.json` from `docs/modules/dotnet1/week03`.
3. If CodeShare says a different copy is already shared, confirm replacing it.
4. If Week 3's media files are not there yet: **View module details** → **Media files** → **Add media files**, and add the
   three files in `docs/modules/dotnet1/week03/project_end`: `images/juan_profile.svg`, `audio/greeting.wav`,
   `video/juan_intro.webm`.
5. Open Week 3, Step 2 as a student test account: Run code should show **Sample verified**; Step 1 too once the media is added.
