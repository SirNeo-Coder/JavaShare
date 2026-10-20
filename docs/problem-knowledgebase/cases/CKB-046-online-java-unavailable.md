# CKB-046 — Hosted Java could not run multiple files

- Status: resolved
- First recorded: 2026-10-20
- Last verified: 2026-10-20
- Area: online Java / javaExecution.ts, java-runtime, Java bridge, module result route
- Search terms: online multi-file Java, CheerpJ, demo, startup timeout, source not found, packages

## Symptom

Online Java returned demo text or single-file-only error instead of running the project.

## Root cause

All Run code callers used /api/execute; the hosted path had only demo/Judge0, while multi-file javac was laptop-only. No browser integration existed.

## Durable solution

Keep shared javaExecution.ts in all Java callers, authenticated mode selection, the separate public runtime, and scoped browser-result comparison against saved versions.

## Regression proof

- tests/browser-java-progress.test.mjs: online Java progress: browser evidence obeys membership, exact output, successful exit, saved version and part access
- Command: `node --test tests/browser-java-*.test.mjs` (under `sg docker` for local database checks).
- Removed saved-version guard: check failed, restored: passed. Existing direct pass refusal remains. Real app module OOP sample passed online, next part unlocked; personal five-file input run passed.
- Branch `codex/online-multifile-java`; complete evidence in `docs/verification/online-multifile-java.md`.

## Recurrence triage

If mode is unavailable, check JAVA_RUNNER_URL; if Java starts but cannot compile, inspect CKB-047/048 instead.

## History

- 2026-10-20 — Online multi-file Java approved, including browser practice evidence and separate public address. Diagnosed/fixed before delivery. No hosted changes.
