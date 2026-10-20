# Student module activities handoff

Updated: 2026-10-20. Branch: `codex/student-module-activities`, based on
`codex/student-classroom-entry` (PR #18, still open). This is the teacher-approved workflow change
from this chat: implement student activities first. On 2026-10-20 the teacher explicitly
requested pushing this completed work to main, authorizing this merge and its existing
teacher-dashboard/student-entry prerequisites. No hosted settings or database changes.

Implementation committed and pushed as `13e68a0`. [PR #19](https://github.com/SirNeo-Coder/JavaShare/pull/19)
was originally opened against `codex/student-classroom-entry` (PR #18); it is now being
retargeted to main for the teacher-authorized delivery. Final full suite: 98/98, build passed,
lint 0 errors/8 existing warnings. Disposable local fixtures and the isolated port-3001 test
server have been removed/stopped; the pre-existing port-3000 classroom was left running.

## Done

- JSON supports a separate `activity` on a step (instruction, optional starter files, required
  output and optional fixed input). Printed samples remain unchanged. Optional `previousModuleId`
  copies this student's saved preceding module project within the class. Existing JSON still
  reads and uses its original steps until distinct challenges are authored.
- Selecting a module opens its saved Java project in the main editor and its worksheet beside it.
  Work in code editor closes the worksheet. The student edits tabs for Main and supporting
  classes, can add files, Save work, and Run code. Every module/class/student has separate files.
- Project initialization preserves current files, adds missing starter classes, and normalizes
  src aliases. It does not overwrite the preceding module. Switches, class navigation and
  sign-out save the current module first; failure stops the transition. Reload still requires
  the student to have saved, as with the existing classroom workflow.
- The server runs and checks actual Java execution. It refuses forged pass flags, locked parts,
  invalid/duplicate paths, stale project saves and stale run results. Compilation errors,
  runtime errors, timeouts, output limits and demo execution cannot pass. Earlier successful
  activity passes are retained during later exploratory runs.
- Each part opens automatically when the preceding required activities pass. It is per student,
  not a teacher availability tick. Future content is withheld server-side. The existing weekly
  live-class module restriction remains enforced. Teacher preview remains unrestricted.
- Paper liplets are handed to the teacher; they neither gate progression nor enter the percentage.
  Existing stored paper flags remain. The performance task unlocks after lesson activities;
  its prior submission UI and assessment remain unchanged (student activities are this scope).
- Existing project/progress storage is reused; no migration, new dependency, CDN, hosted setting
  or hosted deployment. Existing teacher availability values/API are retained for compatibility
  but no longer gate students. New challenges use a separate saved key so old sample passes
  do not falsely finish them. Module source ids and all old saved work remain intact.
- Housekeeping removed obsolete student inline step editing, paper checkbox handlers and teacher
  availability controls from the viewer before adapting the tests.

## Verification

Final full suite: **98 passed, 0 failed, 0 skipped**. Production build passes. Lint: 0 errors, 8 existing warnings. Complete test names, rule-only vs
integration coverage, intentional regression failures and limits are in
[student-module-activities verification](../verification/student-module-activities.md).
Real local browser: sample failed the different challenge; edited Jeepney passed at 25%; next
part opened without paper/teacher ticks; Helper.java and edited classes survived save/reload.
Missing starter files, false runtime success and empty startup guards were each removed
briefly; regression tests failed, then the guards were restored before the passing final suite.

CKB-038 is resolved for student projects. New CKB-043 records false completion protections;
CKB-044 records the startup null-state bug caught in the browser and fixed before release.

## Next / limits

- Teacher-authorized main delivery: PR #19 includes the existing tested prerequisite commits
  from PRs #17/#18. Current main history was merged into this branch; only handoff notes needed
  resolution. Application/configuration/test files are identical to tested commit `2430478`, so
  its 98-test, build and browser evidence remains current. No product changes or migrations were added.
- Existing course JSON needs authored activities for genuinely different practice outcomes. A
  complete example is `tests/fixtures/student-activity.codeshare.json`; format is documented in
  `docs/course-format.md`. No private course source was rewritten or committed.
- Java offline runs on laptop javac. Hosted execution remains the existing demo/single-file
  configuration; online multi-file Java, physical classroom Wi-Fi devices, Windows and another
  browser were not verified. Non-Java automatic activity checks are not implemented.
- Teacher inline sample-preview dependencies were not moved into the student's saved-project
  workflow. Performance-task editing/assessment is the prior workflow, outside this first slice.
- Disposable local browser fixtures are cleaned after verification; no real class was changed.
