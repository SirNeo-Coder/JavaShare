# Module project saves only on task completion — revised proposal, 2026-10-22

Latest teacher requirement: **Save student code in the module project only after
successful task completion, not on every practice attempt.** This narrows the
preceding choice of local activities with later sync: successful task completion
is now the sync point. No implementation/schema/config/test changes are approved
or made for this revised plan yet.

## Evidence and outcome

CKB-065 confirms a save exceeded hosted CPU time; local profiling identifies
full-library parsing as a major cost. CKB-035 warns that old module content can
hide teacher changes. The current online Run code path in StudentModuleActivity
saves project files before every run, asks for runner configuration, posts every
result and triggers module/progress refreshes. Opening/changing activities also
calls server preparation that writes project files. Therefore skipping one PUT
alone would not achieve the teacher's requested saving rule.

Desired example: three unsuccessful attempts followed by a successful alteration
produce one completion save. Failed runs and unchanged sample output do not save
code or fail states to the server. An earlier saved completion must not cause a
later unsuccessful attempt to overwrite the last successful code.

## Proposed scope

Online student **Module project** practice only. Preserve the personal project,
explicit submission and existing laptop/offline runner paths. Modules without
explicit alteration tasks keep their current successful-sample completion rule.

1. Keep downloaded, currently authorized module content, per-step Java drafts,
   sample verification and unsuccessful practice results on the device. Reopening
   the same step on that browser restores its local draft. Cache runner configuration
   for the practice session. Manual Save work and step switches keep online module
   drafts locally instead of writing unfinished code to the server; label this clearly.
2. Run sample/task checks locally with existing shared checking rules. Expected
   runtime-error samples verify only their demonstration; unchanged samples never
   complete alterations. Do not refresh server progress after unsuccessful runs
   or local sample verification, because no server completion changed.
3. On a successful task, send one completion checkpoint containing that exact code,
   observed output, module/activity identity and version, plus the verified-sample
   evidence if the server has not recorded it. The server validates its own current
   sample/task requirements and expected output, identity/class/live-week/prerequisite
   access, earlier-step completion and the saved version. Client pass flags remain
   insufficient. Save project files, verification and completion together under a
   concurrency guard. Preserve previous projects, drafts/backups and submitted snapshots.
4. Show server-confirmed Completed and unlock the next step after acceptance. Return
   updated progress and reuse it where possible. Keep later locked content withheld
   until server acceptance: the broader idea of downloading hidden future tasks is
   no longer required or proposed for this version.
5. If that checkpoint fails, keep the successful code/evidence on the device and
   show task-passed-but-not-synced with a deliberate retry. Resolve changed modules,
   duplicate retries and newer remote edits without silent overwrites or lost drafts.
   Do not resave identical already-accepted code or save a later failed run merely
   because the step had a previous completion.
6. Include the earlier lightweight server prerequisite/progress read and selected
   module reuse. Otherwise the one remaining completion request can still hit the
   same 10 ms CPU limit. One new migration with server-only grants is expected;
   never edit existing migrations. The teacher applies hosted SQL before rollout.

## Contacts and limitations

Initial module/progress/access reads, successful checkpoints and essential sign-in
activity still contact the server. Opening the next newly unlocked step can read
its content. This reduces module requests; it does not eliminate all Cloudflare
traffic or guarantee that remaining requests fit the free CPU budget.

Unfinished code/sample verification stays on that browser until task completion;
other devices and teacher progress only receive accepted checkpoints. Shared-PC
account changes/idle expiry must not show another student's local work or silently
discard unsynced drafts. Handle browser storage failure and conflicts visibly.
Clearing/evicting browser storage can remove unsynced drafts. Fully disconnected
CheerpJ/runtime asset support is not promised by this change.

## Likely files and validation

Browser: StudentModuleActivity.tsx, ModuleWorkspace.tsx, ModuleViewer.tsx, affected
module callers in page.tsx, javaExecution.ts configuration reuse, session/account
integration and one small IndexedDB draft/content helper. Server: routes.ts,
supabase-repository.ts, module-prerequisites.ts and existing module-activities.ts
checks as needed; one new migration for the lightweight server read. No new
package, hosted setting or deployment. Update AGENTS.md with the newly approved
saving rule and update workflow, knowledge, case and handoff records in the change.

Tests: request-count checks proving no project-save/result writes on opening an
online practice step, sample verification, failed run, stop/timeout, later failure
after an earlier completion or local draft save; one guarded save on successful
completion; duplicate success/retry; correct server-owned sample/task validation;
changed module/task ids; exact unchanged sample/error demonstrations; per-step
reload restoration; class/account/shared-PC isolation; idle expiry; lost sync and
storage failure; stale tab conflicts; next-step access and live gates; independent
personal/submission behavior and legacy modules. Preserve offline laptop checks.

Show a focused regression failing without the fix and passing after restoration.
Run build:all, lint, full suite, real browser request counting and laptop/offline
checks, then repeat local Worker profiling with actual module data. Hosted CPU
recovery remains the teacher's post-rollout check. No new-mode tests have run yet.

## Approval boundary

The teacher supplied the saving requirement, but AGENTS.md requires explicit
approval after the concrete implementation proposal. The earlier error-message
approval and earlier metadata-only proposal do not authorize this changed workflow,
server checkpoint path or migration. Await approval before application edits.
