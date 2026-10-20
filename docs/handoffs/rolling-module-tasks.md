# Rolling module tasks handoff

Updated 2026-10-21. Current branch: `codex/week12-week13-modules`.

## Current approved continuation: Weeks 12 and 13 JSON

The teacher approved authoring the missing Week 12 OOP and Week 13 exception-handling JSON
from the supplied original PDF modules and ILAW lesson plans. This includes complete runnable
samples, small alterations with separate outputs, and an approved in-memory substitute for the
Week 13 disk example. No application, schema or configuration change was proposed or made.

Finished: `docs/modules/week12/Java2_Week_12.codeshare.json` (nine activities) and
`docs/modules/week13/Java2_Week_13.codeshare.json` (thirteen). Both opt into sample-first checks.
The chain is `java-2-w12` → `java-2-w13` → existing `java-2-w14`. Week 13's final supporting classes
match Week 14 exactly. Personal starters contain Main.java guidance only and receive no Vehicle
family. Complete per-step sources, original teaching material, separate paper liplets, performance
instructions/rubrics and stable alteration identities are included. The READMEs map printed steps
and explain the catch-up schedule, added review checks and disk substitution. Original PDF/DOCX
files and the generation prompt remain unchanged.

Evidence: `npm run build:all` passed; lint zero errors/eight existing warnings; full suite
208/208 without skips. Focused module checks 27/27. All 22 samples and 22 alterations actually
run on laptop Java and browser CheerpJ Java 8. Both personal starters/reference examples compile
and run. The rolling project also runs Week 14's first ArrayList example without replacing its
supporting classes. Actual offline production browser checks both uploads, sample/task distinction,
unchanged-output feedback, immediate saved completion, next-step gating and draft restoration.
Removing one final supporting class failed the compatibility regression; restoration passed.
Full named checks, commands and limits: `docs/verification/week12-week13-modules.md`.
No new app defect was found; CKB-052 history and the prompt map record this curriculum continuation.

In progress: commit/push and PR delivery, based on `b027634` / `codex/module-sample-first` (PR #27).
Next: teacher reviews the stacked PR, uses the sample-first app/history migration already prepared
in PR #27, then uploads Week 12, Week 13 and Week 14 in that order in the intended class. No new
migration is needed. The teacher's real class and hosted data have not been changed. File APIs
remain blocked; the checked-exception list is memory only. Later weeks, printed revisions and
the generation prompt/playbook remain separate work. Hosted, Windows, physical disconnected
classroom devices and every alteration clicked through the full editor remain unverified; every
alteration did run in real laptop and browser Java. Local browser fixtures clean up their own
disposable class/accounts. Existing classroom server 3012 and unrelated local files are preserved.

## Prior delivered sample-first stage

Branch: `codex/module-sample-first`.

The teacher approved the expanded proposal on 2026-10-21: first opening loads a step's sample,
Run code verifies the unchanged sample before alteration editing, and a large banner distinguishes
verification, expected-error demonstration, old sample output, mismatch and task completion.
Successful alterations save completion immediately and unlock the next activity. Completed tasks
remain completed. New steps preserve earlier drafts and revisits restore each step's edits.

Finished: server-owned sample/task stages, unchanged source checks, separate sample evidence,
per-step module drafts and a readable pre-update source backup, step/version conflict guards,
accessible banner, revised Week 14 JSON/PDF/DOCX, migration and teacher rollout guide. No personal
track/submission mixing, old progress reset, runtime change, hosted SQL, deploy, merge or settings.
Opt-in is `sampleFirst: true`; existing JSON remains on its earlier workflow. New column is
`module_progress.activity_projects`; local migration applied additively without a reset.

Evidence: required production build passed; lint 0 errors/8 existing warnings; full suite 181/181,
no skips. Offline launcher build passed. Real production Chromium passed 5/5 offline with laptop
javac and 5/5 online with CheerpJ Java 8. All eleven baselines also ran on actual browser Java 8;
all eleven samples and alterations ran on laptop Java. Declared-error sample verification does
not complete a task. Source/history, old completion and personal snapshots survive. A deliberate
sample-gate bypass failed its regression; restoration passed. Original eight PDF page streams
are unchanged; original eight plan-page renders remain pixel-identical, with revised appendices.
Full names, commands, initial resolved failures and limits: `docs/verification/module-sample-first.md`.
CKB-054 records the diagnosis. Implementation committed as `799519d` and pushed; [PR #27](https://github.com/SirNeo-Coder/JavaShare/pull/27) is open against `codex/earlet-hover-dismiss`.

Nothing remains in progress for the approved implementation. Next: teacher review of PR #27,
stacked on PR #26, itself stacked on PR #25. The teacher applies
`20261021000100_module_activity_projects.sql` before deploying the reviewed app and re-uploading
the revised Week 14 JSON. Follow `docs/module-sample-first-setup.md`; existing app processes need
restart after a rebuild. Existing local classroom server 3012 was left running; isolated test
origins were 3020/3022 and a separate static runner 3021. Browser tests remove disposable local
classes/accounts; temporary verification servers have been stopped. Other weeks,
file persistence, threads, Swing, and generation prompt/playbook remain separate proposals.
Hosted, Windows, physical disconnected Wi-Fi devices and all browser task alterations are unverified.
The GitHub connector returned 403 for PR creation; the authenticated CLI created PR #27, which
was attached to this chat. There is no remaining permission block.

## Prior delivered task-flow stage

## Approved scope

The teacher approved the first stage: CodeShare's small alteration task flow and revised
Week 14 example. A task changes nearby sample behavior and supplies its complete target
output. Students use the main editor; successful execution earns Completed and opens the
next task. Module and personal rolling projects stay separate. Old records stay stored but
cannot satisfy new work. Later file handling, thread timing, Swing, remaining weeks and the
generation prompt/playbook need their next proposals. No hosted action was authorized.

## Finished

- Explicit stable `activity.id` opts into task targets and `task:<id>` completion records.
  Unnamed legacy modules keep sample targets and part access. Upload rejects identity collisions.
- The server enforces one task at a time and withholds future content. The worksheet shows
  sample/task labels; the main editor checks the task and remembers Completed after later
  failed exploratory runs. Part discussion remains available while its next task is locked.
- Saved sources win over templates and missing supporting files are added. Existing weekly
  module/personal copying, class/student scope, stale-write protection and submissions stay
  intact. No migration, runner, route, hosted setting or deployment change.
- `docs/modules/week14/`: same `java-2-w14` identity, eleven alteration tasks, planned
  predecessor `java-2-w13`; revised JSON, PDF and DOCX. Original eight PDF pages plus three
  task pages; original lesson plan plus one appendix. Original supplied files are untouched.
- All eleven tasks ran with real javac. The original PDF page content and lesson-plan text
  are retained, and final documents were rendered and visually inspected.

## Evidence

- `npm run build:all`: passed. `npm run lint`: zero errors/eight existing warnings.
- Full local suite: 160 passed, zero failed/skipped. All names and commands are in
  `docs/verification/rolling-module-tasks.md`.
- Returning the sample instead of task target failed the explicit-id regression, then passed
  after restoration. Initial full-suite label compatibility failure was corrected.
- Actual CheerpJ/Java 8: unchanged Week 14 sample failed, alteration completed, next task
  unlocked, prior edits preserved. Actual offline javac: saved next task completed without
  CheerpJ. Disposable local class/accounts and temporary servers were cleaned up after verification.

## Next

Implementation commit: `f07bb71`. Branch pushed; [PR #25](https://github.com/SirNeo-Coder/JavaShare/pull/25) is open for teacher review. Do not merge.
The initial push review required destination verification. GitHub confirmed the authenticated
account owns `SirNeo-Coder/JavaShare` with admin/push access; the retry succeeded.
No work remains in progress for this approved first stage. Next: teacher review of PR #25.
Deploy the reviewed app change before uploading the revised JSON. No migration is needed.
Week 13 JSON does not yet exist; until available its predecessor link falls back to supplied
Vehicle starter files. Do not overwrite an already started project when earlier work appears.

After review, prepare the next proposal for the remaining weekly documents and the generation
prompt/playbook. Week 15 requires persistent runtime data and safe file support, which the
current offline runner deliberately blocks. Week 16 needs predictable task outputs; Week 17
needs an agreed window-verification approach. Existing provided files also have upload format
issues (Weeks 15/16 missing exitSlip.afterStep; Week 17 missing performanceTask.starterFiles).
Those files were not changed. Earlier Weeks 12/13 have PDF/DOCX but no JSON.

## Workspace care

Unrelated existing changes in logs/classroom.log and supabase/.temp/cli-latest, plus .claude/
and supabase/snippets/, must remain outside this commit. No changes to live services.
