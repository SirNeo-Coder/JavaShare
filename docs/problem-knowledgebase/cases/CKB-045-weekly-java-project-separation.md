# CKB-045 — Weekly personal Java work lacks a separate rolling project

- Status: resolved (local build, tests and browser verified)
- First recorded: 2026-10-20
- Last verified: 2026-10-20
- Area: student weekly module and performance-task Java projects
- Search terms: Java project HTML CSS JavaScript, OOP multiple files, rolling weekly project, personal performance task, exact sample output

## Symptom

Projects offered New web project only, and a project titled Java Project was a web project.
The teacher clarified two weekly Java tracks: module sample work and an independent personal
performance-task application, each continuing from its own previous week.

## Root cause

The initial module slice provided a saved module project only. The personal task still had
inline editors/submission snapshots without a persistent working project or previous-week copy.
Legacy separate challenge output also differed from the now-approved sample-output progression.

## Durable solution

Reuse the main editor for both projects. Keep module sources in project_files and personal
drafts in performance_task.project.files; leave sample/own submitted snapshots unchanged.
Scope weekly copies by student/class/module and copy only the corresponding preceding track.
Check module sample output after successful execution, with exact spaces/blank lines. Preserve
legacy JSON and saved challenge results. No migration or hosted setting change.

## Regression proof

- `tests/module-activities.test.mjs`: weekly Java projects: personal drafts roll forward separately, preserve submissions and never advance module progress.
- Real sample progression and real two-file packaged Java exercise use actual routes/local Supabase/javac.
- `tests/weekly-java-project-ui.test.mjs`: separate sources and module-only output target/personal-only explicit submission.
- Mutations: wrong challenge output, trimming spaces, omitted personal carry-forward each caused a failing regression, then restored.
- Final commands, browser checks and complete names: `docs/verification/weekly-java-projects.md` (101/101, no skipped tests).

## Recurrence triage

A web project name does not set its language. Distinguish personal drafts from submission snapshots,
and missing online execution from incorrect project initialization. Prior CKB-038 covers missing
supporting Java files; it is not proof that a personal project exists.

## History

- 2026-10-20 — Teacher approved the two separate rolling projects and sample-output progression; online multi-file Java requested next.
