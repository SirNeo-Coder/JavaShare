# CKB-062 — Modules required a separate upload for each class

- Status: resolved locally; hosted setup pending
- First recorded: 2026-10-22
- Last verified: 2026-10-22
- Area: module library / class subject / Curriculum
- Search terms: upload once, same module all classes, Java, Net MVC, subject-specific module set

## Symptom

The teacher had to upload the same weekly module to each class and requested a common set per
subject. Each class must use Java or Net MVC, never a mixture. This is a requested workflow
extension, not a recurrence of a prior fixed incident.

## Root cause

All module content was keyed by `(classroom_id, module_id)` in `course_modules`. List, read,
dashboard and progress-summary paths loaded those separate copies. Subject was free text.
CKB-010 is relevant only as the regression guard for retaining class-separated student progress.
Its original four progress tests were run and passed before editing.

## Durable solution

- `subject_modules` holds one whole module per teacher/subject/id; `classrooms.module_subject`
  selects Java or Net MVC. Existing uploads and student progress remain intact.
- All content readers share the teacher/subject resolver in `supabase-repository.ts`. Class
  ownership and student membership remain checked first. Upload/import course-family checks
  and database constraints keep the subjects separate.
- Existing classes choose a subject and explicitly share saved uploads. Replacing a different
  shared copy requires confirmation tied to its current timestamp. Student progress and files
  keep their original class keys. Shared deletion confirms the subject-wide effect.

## Regression proof

- `tests/subject-module-sharing.test.mjs`: subject separation, teacher ownership, later classes,
  all content readers, saved work, explicit imports/stale confirmations, shared deletion, migration
  preservation, row security and direct table privilege checks.
- `node --test tests/subject-module-sharing.test.mjs`: deliberately removing the subject filter
  from the module-list resolver failed four checks (including the parent); restoring it passed 8/8.
- Final full suite 229/229, real browser 7/7, final focused checks 10/10; no skips. Build and
  offline launcher build pass; lint 0 errors/8 existing warnings. The UI also waits for known
  sharing scope before enabling deletion, preventing a misleading class-only warning.
- Browser checks, full named test evidence and final status: `docs/verification/subject-module-sharing.md`.
- Implementation: `6b996e1`, branch `codex/subject-module-sharing`; [PR #37](https://github.com/SirNeo-Coder/JavaShare/pull/37).

## Recurrence triage

If content differs across same-subject classes, check `module_subject`, owner, and shared reader
usage. If content leaks between subjects, check both owner/subject query filters and course-family
validation. If student progress leaks, use CKB-010; content sharing must never remove class keys.

## History

- 2026-10-22 — Teacher approved one Java or Net MVC set per class, shared across own same-subject
  classes. Implementation and local verification; hosted rollout requires teacher action.

- 2026-10-22 — During teacher-requested conflict repair of PRs #35/#36/#37, renamed this
  case from CKB-059 to CKB-062 so main’s Java caret case and the other two feature cases
  stay distinct. Preserved both documentation histories and the feature code. Integrated
  suite 236/236 and actual browser 7/7 pass on main c770731. Teacher reports hosted SQL success;
  app rollout remains unverified.
