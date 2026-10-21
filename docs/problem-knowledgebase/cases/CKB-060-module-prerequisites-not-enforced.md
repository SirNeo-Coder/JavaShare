# CKB-060 — Later modules open before prerequisite activities are complete

- Status: resolved locally; hosted rollout pending
- First recorded: 2026-10-21
- Last verified: 2026-10-21
- Area: rolling module access, live weekly restriction, module/project opening
- Search terms: prerequisites, skip week, Week 12 Week 13 Week 14, earliest unfinished module, missing upload, live class catch-up

## Symptom

A student could open Week 13 or Week 14 without completing the earlier linked module.
During live class, the weekly restriction could also prevent access to required earlier work.

## Root cause

`previousModuleId` supplied rolling project files only. Access checked activities within the
selected module and the live weekly pick, but never completion of predecessor modules.
CKB-045 covers project separation and CKB-058 covers within-module resume; neither enforces
cross-module prerequisites. The progress percentage includes performance submissions and is
not the approved prerequisite-completion rule.

## Durable solution

Walk all declared links, oldest first, and require current activity passes scoped to student
and class. Reuse `activityAccess`; keep performance submissions and handwritten liplets separate.
The repository's shared student access guard protects content, progress, both projects, runs,
result recording and submissions before progress creation or mutation. Live access includes the
weekly module's ancestors. Missing uploads/cycles give repair messages; teachers keep previews.
Catalog and denied requests carry the same reason. Module/project opening shows a prominent
banner and Continue Week N reuses the saved next-step selection. Existing files/history survive.

## Regression proof

Implementation: `20d5931`; [PR #35](https://github.com/SirNeo-Coder/JavaShare/pull/35).

- `tests/module-prerequisites.test.mjs`: pure chain/identity/live rules, rendered notice, real
  local-Supabase routes for every entry point, student/class isolation and saved-work preservation.
- Removed the server access guard temporarily: the content regression returned 200 instead of
  required 403 and failed. Restored in a finally block; all 17 prerequisite checks then passed.
- `tests/module-prerequisites.browser.mjs`: real production UI, live catch-up, saved-step resume,
  ordered unlocking, missing uploads and actual offline/browser Java. Final evidence and limits:
  `docs/verification/module-prerequisites.md`.

## Recurrence triage

Check uploaded predecessor ids and current activity identities, then the student's saved passes
in the same class. A missing module is not an empty project. A saved completion for an older
alteration id cannot satisfy changed requirements. Progress percentages include submissions.

## History

- 2026-10-21 — Teacher approved prerequisites first, with required activities as the completion
  rule and personal submissions/liplets separate. Project naming/identity redesign deferred.

- 2026-10-22 — Preserved this case during PR #35 conflict repair on main c770731; all 245 integrated tests pass. Distinct case ids reserved across the three open PRs.
