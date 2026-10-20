# Two weekly Java projects

Updated 2026-10-20. Approved workflow change in this chat. Branch `codex/weekly-java-projects`
was rebased onto `main` at `74ed3e3` after PR #19 merged. Isolated worktree:
`/home/ireneo/.codex/worktrees/weekly-java-projects/JavaShare`. The original checkout had an
unfinished merge; do not abort or change it for this feature. No merge/deploy or hosted changes.

## Approved behavior

Each student has a module Java project and a separate personal performance-task Java project.
Both continue from their own previous week, preserving earlier work. Module samples and exact
expected output complete steps/unlock parts. The personal task uses the student's own application;
saving/running is not submission or grading and never completes module steps. Online multi-file
Java execution is requested next, using the previously agreed CheerpJ online/laptop javac offline.

## Implemented

Both projects reuse the main editor, Java tabs, add-file checks and save-before-transition behavior.
The selected module appears with both project choices in Projects; worksheet opens either track.
Module checks use sample files/instructions/output/input. Spaces and extra blank lines must match;
CRLF and one final println newline are normalized. Legacy challenge JSON/results are retained.
Personal drafts use `performance_task.project.files` in existing JSON storage; no migration. Existing
sample/own submission records and completion accounting are preserved. New saves and submissions
reject stale versions. All access remains scoped by student/class/module and live-week rules.
`previousModuleId` must link weekly JSON. Module copies module files; personal copies personal draft
or legacy own snapshot. Existing current files win and missing starter classes are added.

## Verification complete

Full suite 101/101 passed, 0 skipped; build passed; lint 0 errors/8 existing warnings. Focused local suite 11/11 passed. Real laptop javac ran two files with `package app` and returned
Personal OOP. Deliberately restored wrong challenge checking, whitespace trimming and omitted
personal carry-forward: all three regression checks failed, then fixes restored. Full commands,
runner names and browser results are recorded in `docs/verification/weekly-java-projects.md`.

## Next

Implementation `033c17b` and complete test report `f3d40dc` are committed and pushed.
[PR #20](https://github.com/SirNeo-Coder/JavaShare/pull/20) targets main for teacher review.
The original checkout and its unfinished merge remain untouched.

Next: implement online multi-file Java in a separate branch/change. The teacher explicitly approved
using CheerpJ browser-reported results for practice progress on 2026-10-20, acknowledging these can
be falsified in developer tools. This is not grading. Keep server-side student/class/module access,
expected-output comparison and saved-version checks. Keep laptop javac offline and show CheerpJ's
logo for online Java. Existing direct pass flags remain refused; add a scoped online result path.
No permission to merge, deploy, or modify hosted services.
