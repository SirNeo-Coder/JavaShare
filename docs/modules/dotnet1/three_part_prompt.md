# Three-part .NET 1 weeks: the prompt

How Weeks 1–3 were built, with every correction since (CKB-138, CKB-139, CKB-141, CKB-142). Paste the block
below for the next week, changing `NN`. Worked examples: `week01/Week_01_Three_Part_Report.md`,
`week02/Week_02_Three_Part_Report.md`, `week03/Week_03_Three_Part_Report.md` (several pages).

```text
Follow AGENTS.md. Plan first and wait for my approval before changing any code or module file. Explain in
CodeShare's own words (module, week, step, task, question id, class, student, teacher), high school level.
Ask me one question at a time, each with your recommendation.

GOAL
Build .NET 1 Week NN in three parts, like Weeks 1 and 2 (docs/modules/dotnet1/week01 and week02, their
Week_0N_Three_Part_Report.md, and docs/modules/dotnet1/three_part_prompt.md).
Source: docs/modules/dotnet1/weekNN/DotNet1_Week_NN.codeshare.json. Never use or change "Documents/Java 2026".
Output: DotNet1_Week_NN.threepart.codeshare.json in the same folder; the original file stays unchanged.

EACH STEP
1. Sample + discussion: the student runs the sample unchanged. Discussion = bullets "Look at line N. `exact text on
   that line` what it is, which tag/attribute, what it does", tied to an earlier step or week. Line numbers count the
   step's FULL file from line 1. Every quote must sit on that line.
2. Guided example = the old verified task (its expected output stays exactly the same; solutions/<step id>/index.html
   is its page): the exact code and "Put this line on **line N**" / "Put these lines on **lines N to M**" /
   "Replace **lines N to M**" / "Change **line N**", and its expected output.
3. Your task (new id: old id with -alter-v1 -> -alter-v2), NO code given; the guided example is the clue.
   - It STARTS FROM THE GUIDED CODE still in the editor (CKB-141): say what to do with the guided line(s) (change,
     move, take out, undo, swap) while making the new change.
   - Any "line N" in Your task counts in the editor AFTER the guided example (lines below it moved down), or the
     wording says "of the sample" (CKB-142).
   - One thing different; its page text must differ from the guided example's on every step.
   - The difference must be checkable in page text, so CodeShare can tell right from wrong:
     * placement that inner/outer lists would print the same is not checkable (Week 1 Step 6);
     * a plain repair prints the same text whatever cell you change: use an order change (Week 1 and Week 2 Step 8);
     * a value already on the page is not a new answer (Week 2 Step 2: Senior high was already a row);
     * if the difference is only formatting (strong/mark/em/small), say so in the report: page text cannot check it.
   - Keep facts true: for pictures, sound and video only re-word what the old task verified (Week 2 Steps 1, 3, 4).
   - activity.solution: lines = "index.html, line N:" or "index.html, lines N-M:" then the exact lines (several blocks
     separated by a blank line); note = why it answers the task.

KEEP
Lesson ids, exit slips, starter files, previousModuleId, performance task, module id, sampleFirst. Sample files,
expected outputs, webChecks, mediaChecks and includeMediaOutput unchanged. Only the "How to use this module" text
changes, to explain the three parts.

MEDIA STEPS (expected output has "Media checks:")
Checked automatically only online after the week's media files are added (Curriculum -> View module details -> Media
files). Offline every media step is "Checked by your teacher for now". Tell me which steps are media steps, and test
the media case on Cloudflare's runtime on this laptop (port 8787: copy .dev.vars, npx opennextjs-cloudflare build,
then preview), which has local media storage.

SEVERAL FILES (a week whose steps load more than one page, e.g. index.html, projects.html, contact.html)
- A step loads only its own files; the other pages keep the student's latest SAVED work (code is saved only when a task
  completes, so a teacher-checked media step saves nothing). Check that no step's output, frame, link or page check
  depends on a page the step does not load; a framed page's text is never page text.
- Every discussion line, guided line and answer-key heading names its page: "Look at line N of contact.html. `...`",
  "Put this line on **line N of contact.html**", answer key "contact.html, line N:". Line numbers count in that page.
- Your task changes only the step's run page; any "line N" in it counts in that page after the guided example (CKB-142),
  or says "of the sample". Name the page ("line 13 of index.html"); an unnamed "line N" means the run page.
- Forms: typed text, placeholder, required, input types and for/id/name are not page text; labels, button words and
  option words are. Prove every own task changes page text with the teacher's checker before writing its wording.
- Media only on some steps: the others are checked automatically online and offline; say which in the report.
- Tests (copy Week 3's): every line check reads the page it names; a checker test that puts only each step's run page
  (so the other pages are the previous steps' own-task answers); a browser walk that, before each step, checks every
  page the step does not load still holds the latest saved work.

FILES AND TESTS
- solutions/<step id>-alter-v2/index.html: each solved own-task page.
- tests/fixtures/dotnet1-weekNN-three-part-edits.json: per step "fromGuided" edits (guided page -> own page).
- tests/dotnet1-weekNN-three-part.test.mjs (copy Week 2's; Week 3's for several pages): upload, ids, unchanged samples, discussion lines, guided
  and answer-key lines, continuity, Your task's line numbers, sample -> guided -> task rule (with media lines).
- weekNN/test_threepart_checker.py (copy Week 1's; add --media-root project_end for media weeks): the teacher's
  checker passes every sample, guided page and answer; guided pages fail against their own tasks.
- tests/dotnet1-weekNN-three-part.browser.mjs (copy Week 2's; Week 3's for several pages): a student walks every step in real CodeShare (sample;
  own page refused as the guided example; guided verified, not Completed; then the code left in the editor is changed
  as Your task says -> Completed): offline settings, online settings, and port 8787 when there is media.
- Show each kind of check failing once (a wrong line number, the old wording), then passing.
- npm run build:all, npm run lint, npm test before the pull request.

REPORT AND RECORDS
- weekNN/Week_NN_Three_Part_Report.md: read first, per-step table (id, discussion lines, guided, Your task, answer
  key), changes from the plan, limits, checks run, not checked, upload steps.
- A CKB record for every bug found; problem index, prompt map and handoff updated.

AFTER I APPROVE THE MODULE (separate pull request)
- PDF: first list every non-task section on the old task pages (self-check, get ready, starter pages, notes) and keep
  them on a page after the step guide (CKB-146). Copy week01/build_step_pages.py and render_pdf.cjs. Pages after the exit-slip strips become the step guide, one
  step per page (numbered full sample, discussion, guided example, Your task, expected outputs, never an answer);
  page 1's "How to use this module", each step's "Next: step guide, page N", footers "of N". Render the unchanged pages
  first and confirm they match the old PDF's text. Every page must print on one sheet. For long samples copy
  week02/build_step_pages.py instead (option A; several pages: week03's, with the page name above each excerpt; outputs of
  more than 30 lines print only the lines that differ): print only the lines the discussion and guided example name, with
  their real numbers and "…" between parts, and the two outputs side by side.
- DLL: only the lines that name the task pages become "Sample, guided example, then your task" with the new pages.
  Edit the Word file's text in place and check it through a LibreOffice PDF.

DO NOT
Upload to the live site, touch live services, or change other weeks or the Java weeks. After each merge, pull main to
my laptop and give me step-by-step upload instructions (Curriculum -> + Add module -> confirm replacing; media files
if any).
```
