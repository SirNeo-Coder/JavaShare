# Student classroom entry

Updated 2026-10-20. Branch: `codex/student-classroom-entry`, based on teacher dashboard commit `33a3822`. Review is stacked on `codex/teacher-progress-dashboard` (PR #17); this feature does not merge that separate work. PR: being prepared.

## Approved decision

The teacher approved this as a workflow change and requested removal of code orphaned by it. Students should open CodeShare in the classroom: one membership opens it, several reopen their last successful class if still a member, otherwise choose; none use **Join your class**. **Classes** remains for switching/joining, required reset still comes first, and the teacher dashboard remains.

## Done

- Reused existing light class-list bootstrap followed by an explicitly scoped classroom request; server permissions unchanged.
- Per-account browser preference under the existing `javashare-` prefix; safe fallback if storage is blocked.
- **Classes** keeps the chooser open deliberately. Student **Open class** enters immediately. Entry failures offer **Retry** and **Classes**.
- Removed student module home, viewer selection, unused types/status/progress helpers and six CSS selectors with no remaining caller. Shared module/progress APIs and styles remain in use.
- Added eight focused policy/rendering tests; old Landing implementation fails the removed-screen regression, restored implementation passes.
- Full offline build, lint (0 errors / 8 existing warnings), 88 tests and local offline browser checks pass. Exact names, evidence and limitations: [verification](../verification/student-classroom-entry.md).
- Six generated test accounts and three isolated QA classes were validated and removed after checks. Local port 3000 remains running with the new build.

## In progress / next

Commit and push this feature, then open the stacked review PR. No migration, hosted service setting or new dependency is needed. Teacher dashboard review/merge is a separate dependency. CKB-038 module starter-file compatibility and the earlier main-rail hover report are separate work and were not changed here.

Unrelated existing `logs/classroom.log`, `supabase/.temp/cli-latest`, `.claude/` and `supabase/snippets/` are not part of this change.
