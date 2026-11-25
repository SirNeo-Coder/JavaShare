# .NET 1 Week 2 three-part report

File: `docs/modules/dotnet1/week02/DotNet1_Week_02.threepart.codeshare.json` (built 2026-11-25, branch
`content/dotnet1-week02-three-part`), made from `DotNet1_Week_02.codeshare.json`, which stays unchanged. Same module id
(`dotnet-1-r02`), 9 steps over five days, the same lessons, exit slips, starter file, performance task and link to
Week 1 (`previousModuleId: dotnet-1-r01`). Built the way Week 1 was, with its corrections (CKB-139, CKB-141, CKB-142);
the steps are in `docs/modules/dotnet1/three_part_prompt.md`.

## Read this first

- **Every Week 2 step is a media step** (its outputs end with Media checks). **Online, after you add Week 2's media
  files** (Curriculum → View module details → Media files → Add media files), each run is checked automatically:
  sample, guided example, then Your task, as in Week 1. **Offline, or before the media is added,** every step shows
  "Checked by your teacher for now": nothing is checked, and you mark the step done from the student's module card. The
  discussion and guided example still show. You chose three parts anyway (2026-11-25).
- **New question ids** end in `-alter-v2`. No class uses the .NET subject yet, so nobody's work resets.
- **Upload it only on a site that has the web guided-example change (#136); it is live.**
- **The PDF module and the Word DLL are updated** (2026-11-25): see Printed module and lesson plan.
- Nothing was uploaded. Week 1, Weeks 3–10, the Java weeks and `Documents/Java 2026` are unchanged.

## How each step works

1. **Sample and discussion:** run the sample unchanged; the discussion reads the numbered `index.html` ("Look at line N").
2. **Guided example:** the old Week 2 task, whose output was already verified, with its exact code and lines.
3. **Your task:** starts from the guided code still in the editor and says what to do with it; one thing different; no
   code given. Its page text differs from the guided example's on every step.

| Step | Own-task id | Discussion lines | Guided example | Your task | Answer key (teacher only) |
|---|---|---|---|---|---|
| 1 | `dotnet-1-r02-d1-s1-alter-v2` | 8, 9, 9, 9, 9, 10 | `<p>My profile picture is a drawing, not a photo.</p>` after the picture | Change the sentence you added in the guided example so it starts with a label, like a caption: Picture: a drawing of me, not a photo. | index.html, line 10:<br>  <p>Picture: a drawing of me, not a photo.</p> |
| 2 | `dotnet-1-r02-d1-s2-alter-v2` | 56, 57, 58, 60, 65, 66, 67 | Third row: Elementary, Sample Elementary School, 1 to 6 | Change the row you added in the guided example into a kindergarten row: Kindergarten, Sample Kindergarten School and K. | index.html, lines 76-80:<br>      <tr><br>        <td>Kindergarten</td><br>        <td>Sample Kindergarten School</td><br>        <td>K</td><br>      </tr> |
| 3 | `dotnet-1-r02-d2-s3-alter-v2` | 77, 78, 79 | `<p>I heard three rising notes.</p>` after the sound | Change the sentence you added in the guided example so it starts with a label: Sound: three rising notes. | index.html, line 80:<br>  <p>Sound: three rising notes.</p> |
| 4 | `dotnet-1-r02-d2-s4-alter-v2` | 79, 80, 81, 81 | `<p>The video runs about 4 seconds and ends with my name.</p>` | Change the sentence you added in the guided example so it starts with a label: Video: about 4 seconds, ending with my name. | index.html, line 82:<br>  <p>Video: about 4 seconds, ending with my name.</p> |
| 5 | `dotnet-1-r02-d3-s5-alter-v2` | 60, 76, 77, 78, 79 | Second award row, one cell covering 3 columns | Change the award row you added in the guided example into two cells: Award: Best science poster in a cell that covers two columns, then Grade 11 in its own cell. | index.html, lines 79-82:<br>      <tr><br>        <td colspan="2">Award: Best science poster</td><br>        <td>Grade 11</td><br>      </tr> |
| 6 | `dotnet-1-r02-d3-s6-alter-v2` | 91, 93, 97, 101, 104, 109 | Third Computer skill (rowspan 2 → 3) | Undo the guided example: Computer goes back to two rows. Add a third skill to Art instead: Making clay models, at level Learning. Change Art's rowspan to match. | index.html, line 104:<br>        <th scope="rowgroup" rowspan="3">Art</th><br><br>index.html, lines 111-114:<br>      </tr><br>      <tr><br>        <td>Making clay models</td><br>        <td>Learning</td> |
| 7 | `dotnet-1-r02-d4-s7-alter-v2` | 9, 115, 117 | Note naming the broken picture file | Change the note you added in the guided example so it diagnoses the broken sound file instead of the picture. Keep it in the same place and leave the src values broken. | index.html, line 10:<br>  <p>Broken: audio/greeting.mp3 should be audio/greeting.wav.</p> |
| 8 | `dotnet-1-r02-d4-s8-alter-v2` | 66, 71, 72, 74 | Repair the Junior high row's three `td` cells | Keep the cells you repaired in the guided example, but put the rows in time order: move the whole Junior high row above the Senior high row. | index.html, lines 66-75:<br>      <tr><br>        <td>Junior high</td><br>        <td>Sample Junior High School</td><br>        <td>7 to 10</td><br>      </tr><br>      <tr><br>        <td>Senior high</td><br>        <td>Sample Senior High School</td><br>        <td>11 to 12</td><br>      </tr> |
| 9 | `dotnet-1-r02-d5-s9-alter-v2` | 9, 57, 77, 93, 115, 117 | `<p><small>Picture, sound and video: made for this module.</small></p>` | Change the credit you added in the guided example to: Media: all made for this module. Keep it small. | index.html, line 118:<br>  <p><small>Media: all made for this module.</small></p> |

## Changes from the plan

- **Step 2:** Your task makes a **Kindergarten** row. The planned Senior high row is already in the table.
- **Step 8:** Your task moves the repaired Junior high row **above** Senior high (time order). A plain repair gives the
  same page text whatever cell you change, so the move is what CodeShare can check.
- **Step 6:** Your task first undoes the guided Computer row (rowspan back to 2), then adds an Art skill. A student who
  keeps the Computer row gets an extra line and does not pass.

## Things to know

- Steps 1, 3, 4 and 9 change only the words of the guided line (a labelled caption), keeping every fact the old task
  verified about the picture, sound and video.
- Step 7 keeps the three src values broken, so Media checks still shows three failures in Your task's output.

## Checks run

- Teacher's checker with Week 2's media (`check_codeshare.py --run --media-root project_end`): all 9 samples PASS.
- `test_threepart_checker.py`: 9 samples, 9 guided pages and 9 own-task answers pass with the real media; the guided
  pages fail against their own tasks.
- `tests/dotnet1-week02-three-part.test.mjs`: upload, ids, unchanged samples, 44 discussion quotes, guided and
  answer-key lines, continuity (the edits Your task describes turn the guided page into the answer page), Your task's
  line numbers, and CodeShare's sample → guided → task rule with media lines. Shown failing with one wrong discussion
  line, one wrong answer-key line, and Step 6 keeping the guided Computer row.
- `tests/dotnet1-week02-three-part.browser.mjs`, real CodeShare: **on Cloudflare's runtime on this laptop with the media
  files added** (local media storage), a student did all 9 steps (sample verified; own-task page refused as the guided
  example; guided verified, not Completed; then changed the guided code as Your task says → Completed). **Offline
  settings**: Step 1 shows "Checked by your teacher for now" and the worksheet shows the discussion and guided example.

## Not checked

- The hosted site and its real media storage.
- The teacher's Module preview and class step with this file.

## Printed module and lesson plan

- **PDF (`DotNet1_Multimedia_Tables_Module.pdf`), now 17 pages of 612 × 936 pt.** Pages 1–8 are unchanged except page 1's
  "How to use this module", each step's "Next: step guide, page N" and the footers ("of 17"). The old task pages 9–11
  are now the **step guide, pages 9–17, one step per page**. Week 2's samples run to 119 lines, so (your option A,
  2026-11-25) each page prints only the sample lines the discussion and guided example name, one line either side, with
  their **real line numbers** and "…" between parts; CodeShare's editor numbers the whole file. Then the discussion, the
  guided example, Your task, and the two expected outputs side by side. The check-yourself table is on page 9. **No
  answer is printed.** Week 2's output boxes are 7 pt (Week 1: 7.4 pt) so every page fits one sheet.
- Built with `build_step_pages.py` and `render_pdf.cjs` in this folder. Rendering the unchanged pages first gave exactly
  the text of your old PDF.
- **Word DLL (`DotNet1_ILAW_Week_02.docx`), still 7 pages:** the five Student Activity lines read "Sample, guided example,
  then your task" with the step-guide pages (9–10, 11–12, 13–14, 15–16, 17) and "starting from the guided code"; Friday's
  scaffolding line names the guided example and Your task. Nothing else changed. Checked through a LibreOffice PDF, not
  in Microsoft Word.
- `tests/dotnet1-week02-three-part.test.mjs` checks every printed step page: each printed line matches the sample at
  its number, every line the discussion or guided example names is printed, both outputs and Your task's wording match,
  and no answer is printed (shown failing with one wrong number and with an answer put on page 9).

## Upload steps (after this pull request is merged)

1. Sign in as the teacher and open a class whose subject is Net MVC.
2. **Curriculum** → **+ Add module** → choose `DotNet1_Week_02.threepart.codeshare.json` from `docs/modules/dotnet1/week02`.
3. If CodeShare says a different copy is already shared, confirm replacing it.
4. If Week 2's media files are not there yet: **View module details** → **Media files** → **Add media files**, and add
   every file in `docs/modules/dotnet1/week02/project_end` (`images/`, `audio/`, `video/`).
5. Open Week 2, Step 1 as a student test account: Run code should show **Sample verified**, not "Checked by your teacher".
