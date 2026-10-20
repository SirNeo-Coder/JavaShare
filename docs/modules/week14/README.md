# Week 14 rolling practice example

First approved on 2026-10-20; sample-first update approved on 2026-10-21 on
`codex/module-sample-first`. This is the first revised example; the other weeks and generation
prompt/playbook await their separate work.

- `Java2_Week_14.codeshare.json`: eleven small alterations with separate stable task ids and
  `sampleFirst: true`. Published module/lesson/step/task identities stay unchanged. Apply the
  new migration and reviewed app before re-uploading this JSON to the intended class. Existing
  completions are retained; sample passes never complete a new task.
- `Java_Collections_Framework_Module.pdf`: original eight pages plus three updated practice
  pages. Print pages 1-6 double-sided, long-edge; pages 7-8 single-sided for the original liplets.
  Pages 9-11 are the practice appendix and may be printed separately. Every page is 8.5 by 13
  inches. The appendix describes the automatic sample-first flow and explicitly updates the
  original Step 1 sample catch message to the fixed string already loaded by the JSON.
- `Java_ILAW_Week_14.docx`: original lesson plan plus one updated task-mapping appendix.
  The school grid, references, signatures and blank Reflections cells remain unchanged.

**Work in code editor** loads a step's sample on first opening. Run it unchanged to save
**Sample verified** before alteration editing opens. Then apply **Your task** and run again.
Successful execution matching **Expected task output** saves **Completed** immediately and opens
the next activity. A prominent banner also identifies unchanged sample output and mismatches.
A failed later run retains the earlier completion while reporting the current mismatch.

The preceding module id is `java-2-w13`; its JSON is not part of this stage. Available preceding
work rolls forward with supporting Vehicle classes. Each new step overlays its supplied sample
files; earlier step drafts stay saved independently. Reopening a started step restores its edits.
Pre-update work without recorded step identity remains readable in **Work saved before sample
loading**. No solved task files are uploaded. Test-only reference edits are in
`tests/fixtures/week14-task-edits.json`.

Step 1 uses a fixed friendly sample message instead of platform-specific exception wording.
Step 4's alteration displays a sorted HashSet copy. Step 8 declares its intentional runtime
exception; **Expected error observed** verifies that demonstration only. Its successful
alteration lists empty vehicles, and Step 9 practices safe Iterator removal. Eleven sample
checks and eleven successful alterations run with real laptop Java. A declared error never
passes an alteration. The JSON and both appendices use the same task instructions and targets.

The personal project and submitted versions remain separate. Paper liplets do not gate progress.
Older JSON omitting sampleFirst retains its previous workflow. File persistence and Swing
execution were not added. Hosted migration/deployment instructions: `docs/module-sample-first-setup.md`.
