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
5. **Nothing loaded from the internet** (no CDN links) in the app or in the student web preview. One agreed exception (2026-10-17): online only, the in-browser Java runner CheerpJ may be loaded from CheerpJ's own site when Java is run, with the CheerpJ logo shown where Java runs (their free Community Licence requires it). Offline mode never loads it; it uses the laptop's `javac`.
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
