# CodeShare working rules

This is the one rule file for every coding assistant (Codex, Claude Code, or any other). `CLAUDE.md` only points here. When the teacher agrees a new rule, add it to this file in the same change.

The developer is a senior high school programming teacher, not a full-time developer.

## Knowledge-first workflow

Before broad repository searches, read `docs/knowledgebase/README.md` and open only the pages relevant to the task.

For every bug report or code-affecting prompt, search `docs/problem-knowledgebase/problem-index.md` (or run `npm run kb:search -- "<symptom keywords>"`) before diagnosing.

Before editing any application code, tell the teacher one of these:

- **Match found:** name the `CKB-NNN` case and summarize its symptom, verified root cause, durable solution, and regression test. Explain that the current report will be checked against that evidence before reusing it.
- **No match found:** say no prior case matched and that this will be treated as a new diagnosis.

Then do only the targeted read-only investigation needed for a credible proposal, and present:

- Current understanding of the problem and the desired outcome
- Prior case match and whether its cause is likely relevant
- Suspected cause or findings
- Files likely to change
- Proposed steps
- Tests and checks to run
- Risks, migrations, compatibility effects, open choices

Stop and ask for explicit approval. Do not change application code, schemas, configuration, or tests until the teacher approves in a later message. Approval of an earlier, different plan does not cover a changed plan.

Read-only inspection, narrow searches, status checks, and reading tests are allowed before approval. A similar symptom is not proof of the same cause.

Use the knowledge base as a map, not a substitute for the code:

- Code wins when the knowledge base disagrees. Fix the knowledge base.
- Check the snapshot commit in `docs/knowledgebase/README.md`; for later changes use `git diff <snapshot>..HEAD -- <paths>`.
- If a change alters architecture, tables, routes, permissions, settings, live events, or a documented workflow, update the relevant knowledge-base page in the same change.
- **Every bug found or fixed gets a numbered record:** add or update `docs/problem-knowledgebase/cases/CKB-NNN-short-name.md` (copy `case-template.md`), add its row to `problem-index.md`, and append a short, cleaned-up row to the current `prompt-map/YYYY-MM.md`. Never store secrets, keys, passwords, or student data.
- Reuse the prior regression test first; diagnose again if it passes while the symptom remains.

Lookup order: problem index -> matched case -> feature index -> relevant page -> cited source files -> narrow `rg` search.

## Branches and pull requests

- Work on a new branch per piece of work. Never push to `main`, never merge. Deliver pull requests for the teacher to review.
- Pushing the working branch is allowed and expected (see "Progress notes").
- Each pull request has a plain-English summary: what changed, step-by-step test instructions, and what could not be verified.

## CodeShare rules that must never be broken

1. **Offline mode must keep working.** `npm run classroom:offline` serves CodeShare from the teacher's laptop over the classroom Wi-Fi, with local Supabase in Docker, live features with no internet, and Java running on the laptop's `javac`. Test it after any change that could affect it.
2. **The secret Supabase service-role key stays on the server only.** Never put it in browser code or in a `NEXT_PUBLIC_` variable. On Cloudflare it is a Cloudflare secret.
3. **New migrations only.** Never edit or delete an existing file in `supabase/migrations/`.
4. **Never touch live services.** Never run `supabase db push`. Never change settings in the hosted Supabase project, Cloudflare, Vercel, or Render. Prepare the files and give the teacher step-by-step instructions.
5. **Nothing loaded from the internet** (no CDN links) in the app or in the student web preview. Why (teacher, 2026-10-28): offline classroom mode has no internet, so anything fetched from the internet would fail in class. One agreed exception (2026-10-17): online only, the in-browser Java runner CheerpJ may be loaded from CheerpJ's own site when Java is run, with the CheerpJ logo shown where Java runs (their free Community Licence requires it). Offline mode never loads it; it uses the laptop's `javac`.
6. **Don't rename existing data.** Tables, columns, the `javashare_session` cookie, `javashare-*` browser settings, and the Supabase `project_id` keep their old names (see README, "Names kept from JavaShare").
7. **Never claim something works unless it was run.** Say plainly what could not be tested.
8. Before each pull request, run `npm run build:all`, `npm run lint`, and `npm test`, and test the feature yourself.

## Operational constraints

- **Minimal viable solution first.** The least code that does the job. No unrequested architecture, abstractions, configuration, or optimizations.
- **Don't assume; ask.** When a decision could reasonably go either way, ask the teacher, one recommendation at a time. For read-only questions, proceed on the most reasonable reading and say what you assumed.
- **Strict scope.** Change only what was asked. No drive-by refactors, renames, or restyling.
- **Check before delivering.** Re-read the request point by point and check the work against it.

## Keep the workflow description current

When a change affects how teachers or students use CodeShare, update
`docs/knowledgebase/workflow-state.md` in the same change. CodeShare does not require
the teacher to classify changes as a workflow change or an adjustment.

## Inactivity sign-out (agreed 2026-10-20)

- Teachers sign out after two hours without interaction; students after fifteen minutes,
  including on public computers. Time with the browser closed or laptop off counts.
- Background requests and live classroom updates never extend sign-in. Enforce expiry
  on the server online and offline, and return expired/restored pages to sign-in.

## Refactor and housekeeping discipline

- **Commit every successful change** once it is built and its tests pass.
- **Tidy up before testing:** remove what a change orphaned (unused imports, dead variables, functions with no callers) before writing its tests.
- **Test every new code path** at whatever levels genuinely apply. Aim for tests that would catch the bug coming back.

## Progress notes

Keep the rolling handoff for the current stage current: `docs/handoffs/stage-one.md`. After every finished step, write in plain English what is done, what is in progress, what is next, which branch the work is on, and any decision the teacher approved. Then commit and push the branch, so nothing lives only on the laptop. Another coding assistant must be able to continue from that file alone. One handoff per stage or feature, updated in place.

## Explaining work to the teacher

- **Plain English.** If a technical term is unavoidable, define it in the same sentence.
- **CodeShare's own words:** class, team, project, file, student, teacher, live share. Not code-structure jargon.
- **Lead with what appears on screen,** using the exact labels of buttons and pages.
- **A second attempt must change form,** for example a worked example with real values, not the same explanation reworded.

## Reporting tests after a build

- List each test by its name, with its pass or fail mark as the runner printed it, grouped by file, with the command used.
- Say which checks test a rule on its own and which go through the real app, and say plainly when one kind does not exist.
- Prove a regression test catches the bug: break the fix, show the test failing, restore it, show it passing. Say so if this was not done.
- Report failures, skips, and untested areas as prominently as passes.

## Student module activities (agreed 2026-10-20)

- Each student has two separate Java projects per module per class: the module project and the
  personal performance-task project. Each rolls forward from its own preceding week's work;
  never mix the tracks or overwrite earlier weeks, current edits, or submitted snapshots.
- Modules with explicit `activity.id` show sample code/output separately from a small alteration
  task and its expected output. Successful task runs earn Completed and unlock the next step.
  Modules without explicit task ids retain sample-output checks and part unlocking. Legacy
  separate challenge JSON remains readable. Never reuse old sample/challenge passes for new tasks.
- Both projects use the main code editor. Saving or running the personal project is not submission
  or grading, and never completes a module step. Submit the personal version explicitly.
- Successful code execution with the required output completes a task. Explicit alteration tasks
  unlock one step at a time; older sample modules unlock by part. Teacher availability switches
  do not gate progress.
- Handwritten liplets are submitted to the teacher and assessed separately; they do not block
  student progression. Output completion is not a grade or proof of conceptual understanding.

## Online Java practice (agreed 2026-10-20)

- Online multi-file Java runs with CheerpJ in the student's browser on a separate
  public runner origin. Preparing its Cloudflare files/instructions is approved;
  assistants still never deploy or change hosted settings. No secrets or login
  routes belong on that public origin. Keep the CheerpJ logo visible where Java runs.
- Browser-reported success/output may complete online practice samples. The teacher
  accepts that developer tools can falsify this evidence: it is not grading. Keep
  server-owned expected output, identity/class/part/live-week checks and saved-version
  checks. Direct pass flags remain refused. Offline always uses the laptop runner.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Interactive online Java (agreed 2026-10-20)

- Online teacher/classroom practice and personal performance-task Java projects display
  output while running and wait for answers in Program input. Enter sends an answer;
  Stop cancels the run. Keep the five-second execution budget separate from the
  two-minute input wait. A stopped or timed-out run is unsuccessful.
- Module practice checks keep their JSON-supplied input and existing server-owned sample/task output
  and saved-version checks. Personal runs do not submit or complete module steps.
- Offline keeps laptop javac and its existing input-before-Run behavior for this slice.

## Sample verification before alterations (agreed 2026-10-21)

- Modules opting into `sampleFirst` load the selected step's sample on first opening in the main
  editor, including its supplied Java files and rolling supporting classes. Save each step's
  working files separately before switching; reopening a started step restores its saved edits.
  Preserve a readable backup of work that existed before sample loading and all existing completions.
- Run the unchanged sample before editing its alteration. Save sample verification separately;
  it never completes the task or opens the next step. Declared intentional runtime errors show
  Expected error observed and verify only the demonstration. A failed alteration never completes.
- Show a prominent result banner above Actual output: sample verified, unchanged sample output,
  mismatch, or Completed. Keep the latest run result separate from an earlier saved completion.
- Existing JSON without `sampleFirst` retains its prior progression. Module/personal tracks,
  submitted snapshots, class/student scope, stale-write checks and offline laptop Java stay intact.

## Module resume and meaningful alterations (agreed 2026-10-21)

- Reopening a module resumes its next unfinished step from server-saved completion, including
  after reload or sign-in on another browser. Completed sample steps lead to the performance task.
- Small alterations must exercise the lesson's behavior: object state, inherited methods, collection
  operations, calculations, conditions or exception paths. Show the complete expected changed output.
  Renaming printed labels alone is insufficient. Keep the displayed sample unsolved.
- Changed task requirements need new stable activity ids; retain old results without crediting
  them toward a different exercise. Keep module and personal work separate.

## Rolling module prerequisites (agreed 2026-10-21)

- Students must finish every required activity in the full `previousModuleId` chain before
  starting a later module. Use the current activity identities and saved passes for that
  student and class. Sample verification alone, performance submissions and paper liplets
  do not satisfy or add to this prerequisite requirement.
- Explain the earliest unfinished prerequisite prominently and provide Continue Week N to
  resume its next unfinished step. Missing prerequisite uploads and circular links require
  a clear teacher-repair message. Never silently skip a missing linked module.
- Enforce access on the server across module content, progress, both project tracks, runs,
  result recording and submissions, online and offline. During live class allow the weekly
  module's prerequisite chain; unrelated modules retain the live restriction.
- Teacher previews remain available. Preserve existing files, drafts, completion history,
  earlier weeks, personal projects and submitted snapshots. Project naming/identity changes
  are separate work and were not approved in this slice.

## Subject-specific shared modules (agreed 2026-10-22)

- Each class has one module subject: Java or Net MVC. One teacher-owned module set is shared
  across that teacher’s classes in the same subject, including classes created later.
- Upload or correct a module once per subject. Java and Net MVC never share module content.
  Student projects, completions, submissions and the weekly live-class module stay class-specific.
- Preserve existing class uploads and student work. The teacher selects an existing class’s
  subject, then explicitly shares saved uploads; a differing shared copy requires confirmation.
- Shared deletion warns that it affects every class in that subject and keeps student work.

## Completion-only online module saving (agreed 2026-10-22)

- Online Module project practice keeps downloaded authorized lessons, unfinished
  per-step code, sample verification and unsuccessful runs on the student's device.
  Save code/progress to the server only on successful task completion. A later
  unsuccessful run must not replace an earlier successful project or completion.
- Send one guarded completion checkpoint; the server validates current sample/task
  output, identity/class/access, stable activity ids and module/project versions.
  Save code and progress together. Retry without duplicate saves and preserve local
  work on failed sync or conflicts. Server acceptance unlocks the next step.
- Keep local-only status explicit. Other devices/teacher progress receive accepted
  completions, not unfinished drafts. Later locked content stays server-withheld.
  Preserve account/idle-expiry safety, personal/submission separation, backups and
  the existing laptop/offline runner path. Initial reads/sign-in requests remain.
- Keep hosted prerequisite/catalog reads small using server-only summaries derived
  from current content. No stored duplicate curriculum or removal of access checks.

## Personal performance-task submissions and review (agreed 2026-10-23)

- Keep personal files separate from module samples. Initialize from personal starters or the
  preceding personal submission, falling back to its draft only when no submission exists.
  Preserve current work exactly. Carry personal work across the written Week 20 proposal.
- Submit this version requires successful execution of the exact saved personal files, checked
  on the server too. Edits, additions, deletions, renames and unsuccessful runs invalidate it.
  Use approved browser evidence online and laptop Java offline; personal output has no sample target.
- Submission earns its personal-task progress credit and shows Submitted, not a grade or teacher
  approval. Review never gates progression. Preserve lesson and predecessor checks and live locks.
- Keep one frozen personal submission per student/class/module. Explicit resubmission replaces
  only that module's copy and clears its review. Existing submissions and drafts remain separate.
- Teacher dashboard → Students → student → module → Review personal submission opens the frozen
  files read-only in the main editor. Teacher runs never modify student files or progress.
  Projects shows the complete frozen checklist with teacher-only ticks and Save review.
  Check class ownership, student membership and submission identity on the server.
- Preserve the checklist used for each submission. Older copies without one retain their files
  and clearly identify the current checklist captured when first opened for review.
- Week 20 remains a paper proposal with no Java run or online submission requirement.

## Teacher live help (agreed 2026-10-27)

- Selecting a student in **Students / projects** shows the Module project or Personal
  performance-task project that student has open, live with their name cursor, and the teacher
  may edit it. This is help, not grading or submission: the teacher never saves into student files;
  the student's Save work or a successful run keeps the teacher's changes.
- Unfinished work travels only while the teacher has that student selected, and only on the
  student's own one-person workspace channel, never a group or Teacher Demo channel. This is the
  one exception to "teacher progress receives completions, not unfinished drafts"; drafts are still
  never saved to the server by this feature.
- Selecting a group lets the teacher type in the group's shared code while a member is online;
  members' Save work keeps it. The teacher never auto-saves into group files.

## Web module steps (agreed 2026-10-28)

- A step whose files are all `.html`, `.css` or `.js` is a web step; no new module field. Its page
  runs in the no-internet preview (`buildTeacherPreview`), as rule 5 and the course checker require.
  Correct output: `.html` run file → tab title plus visible page text (blank lines removed);
  `.js` run file → console lines. Same comparison as Java; an uncaught error fails the run.
- Web steps always run in the student's browser, online and offline. Their result is accepted
  as practice evidence offline too, checked against server-owned expected output and the saved
  version; never a bare pass flag. Java offline still uses the laptop runner.
- Steps whose expected output has `Media checks:` show "Checked by your teacher for now"; the
  teacher marks them done from the student's module card. `webChecks` are checked (agreed
  2026-10-29): the page reports what each check found, the server compares with its own checks,
  and they apply to the step's own sample only, not alteration tasks. New web project stays
  separate from modules.
- Module media (agreed 2026-10-29): pictures, sound and video live in Cloudflare R2, one shared
  copy per teacher, subject and module, 5 MB per file, uploaded by the teacher; devices keep them
  after the first download. Media steps are checked automatically (checker's media rule,
  `mediaChecks`, `includeMediaOutput`) only once the module has media files; otherwise, and
  offline, the teacher marks them done. Assistants never create the bucket.
- A performance task whose starter files are all web files gives a web personal project (agreed
  2026-10-29): browser preview online and offline, web and `.txt` files, no Program input. Submit
  still needs a successful run of the exact saved files; success means no uncaught error.
- Net MVC weeks follow the Java student workflow (agreed 2026-10-29): `sampleFirst`, one meaningful
  alteration task (`activity.id`) per step, and `previousModuleId` linking each week to the one
  before (projects carry forward; the previous week must be finished first). Task runs are checked
  by their output only, so every task must change the visible page text or console lines. Task
  answer files stay in the teacher's week folder, never in the JSON.
- Net MVC course (agreed 2026-10-30): ten weeks from the teacher's `DotNet1_Course_Map.md`, all about
  resumes. Module samples build a resume for a made-up student, Juan Dela Cruz; each student builds
  their own resume as the personal performance task (no home address, phone, birth date or ID
  numbers). All student work is done inside CodeShare, like Java: never tell students to use VS
  Code, open files in Chrome, or keep local folders. The old Weeks 1–3 materials are not used.
- Page window (agreed 2026-10-30): **Run code** on a web step or web personal project shows the page in
  a floating window with its checks; it closes (Close, Esc, a click beside it) only after the run is
  checked, and **Show page** reopens it. Links and frames open the project's own `.html` pages there,
  never the internet; checks still use the step's run file only. Teacher previews use the same window.
- Students' own pictures, sound and video in a web personal project (agreed 2026-10-29): online only,
  same R2 bucket, the student's own folder, 5 MB each, at most 10 per project. Each upload is a new
  copy, so a frozen submission keeps its media; adding or removing media needs a new run before
  submitting. Only the student and their class teacher read them; they are not kept on the device.
  Media carries forward to the next week with the personal files. Unused copies are deleted.
