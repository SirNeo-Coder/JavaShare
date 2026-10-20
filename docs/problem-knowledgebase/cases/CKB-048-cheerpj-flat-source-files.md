# CKB-048 — Browser compiler could not find a saved Java source

- Status: resolved
- First recorded: 2026-10-20
- Last verified: 2026-10-20
- Area: online Java / javaExecution.ts, java-runtime, Java bridge, module result route
- Search terms: online multi-file Java, CheerpJ, demo, startup timeout, source not found, packages

## Symptom

Compiler returned file not found for /str/<run-id>/Main.java even though the source had been added.

## Root cause

CheerpJ string-file storage is flat. Nested string paths did not become readable directories. Preserving normal source paths there made javac unable to read them.

## Durable solution

Transfer flat /str/codeshare-N files, then CodeShareJava.runSources copies them into real virtual source folders, preserving exact filenames and packages. Compile all files together; cleanup after the run.

## Regression proof

- tests/browser-java-runtime.test.mjs: browser runtime: only the parent starts Java; flat strings preserve duplicate filenames for the bridge; tests/browser-java-bridge.test.mjs: browser bridge: flat browser strings become distinct source folders, including duplicate class names
- Command: `node --test tests/browser-java-*.test.mjs` (under `sg docker` for local database checks).
- Restored nested /str paths: regression failed. Restored flat transfer: passed. Real browser three-file module and five-file personal projects ran. Local JDK bridge check runs left.Helper and right.Helper together.
- Branch `codex/online-multifile-java`; complete evidence in `docs/verification/online-multifile-java.md`.

## Recurrence triage

If only one supporting class is missing, check uploaded starter files (CKB-038). If every source path is unreadable under /str/subfolder, inspect the flat transfer and bridge copy.

## History

- 2026-10-20 — Online multi-file Java approved, including browser practice evidence and separate public address. Diagnosed/fixed before delivery. No hosted changes.
