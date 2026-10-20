# Rolling module tasks handoff

Updated 2026-10-20. Branch: `codex/rolling-module-tasks`.

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

Commit and push this branch, then open a pull request for teacher review; do not merge.
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
