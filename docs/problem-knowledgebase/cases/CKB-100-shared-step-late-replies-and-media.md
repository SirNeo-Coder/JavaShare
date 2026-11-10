# CKB-100 — A stopped shared step could reopen; its media stayed readable after the step was gone

- Status: resolved (before PR #91 merged)
- First recorded: 2026-11-10
- Last verified: 2026-11-10
- Area: Share with class — `app/page.tsx` (`refreshSharedStep`, `followSharedStep`), `app/moduleActivityState.ts`, `enforceModuleMediaAccess` in `backend/src/supabase-repository.ts`
- Search terms: class step reopens after Stop sharing, stopped share comes back, student pulled back into class step, shared media after module deleted, CodeRabbit PR #91

## Symptom

Found by CodeRabbit on PR #91 (CKB-099), checked against the code, then reproduced in the browser test:

- An older "shared" reply arriving after the "stopped" one reopened the stopped class step.
- Pressing **Stop sharing** while a student's personal project was still saving: when the save
  finished, the student's screen opened the stopped class step anyway.
- After the teacher deleted the shared module, or re-uploaded it with the step renamed, the share
  showed as stopped but class members could still fetch that module's pictures, sound and video.
- A student could open any preview, not only a shared class step (latent: nothing created one).

## Root cause

The client acted on every shared-step reply in arrival order, and checked the share only before
the save, not after it. The media gate trusted the stored `shared_module_id` alone, which a module
delete or step rename leaves behind, while the step reader correctly reported nothing shared.

## Durable solution

- `refreshSharedStep` numbers each check (`sharedRequestRef`) and ignores replies older than the
  newest; it records the share it accepted (`sharedKeyRef`). `followSharedStep` checks that key
  before and after saving, so a stopped or replaced share never opens.
- `enforceModuleMediaAccess` opens a module's media only while `supabaseSharedStepPayload` itself
  returns that module's step (it also checks class membership).
- `moduleProjectForClass` lets a student open a preview only when `shared` is set.

## Regression proof

- `tests/class-shared-step.browser.mjs` — "Share with class: students behind, ahead and in a personal project get the same fresh step; Stop sharing returns their own work; late replies never reopen it"
  (holds one student's "shared" reply until after the "stopped" reply; holds another's personal save until after Stop sharing). Shown failing separately with
  each client guard removed (rebuilt each time): "an older shared reply never reopens the stopped share" and "a save that ends after Stop sharing never opens the stopped share".
- `tests/class-shared-step.test.mjs` — "a removed step or deleted module closes the shared media at once, though the share was never stopped (CKB-100)" (real routes)
  and the rule test's non-shared student preview check; both failed with the old media gate and rule, pass now.
- `npm test` 431/431. Branch `feature/class-shared-step` (PR #91).

## Recurrence triage

If a stopped share reappears, check that every shared-step read goes through `refreshSharedStep`'s counter.
If media opens for a later module, check `enforceModuleMediaAccess` still asks the step reader.

## History

- 2026-11-10 — CodeRabbit review of PR #91; teacher approved the four fixes; built and tested before merge.
