# CKB-049 — Java cannot wait for an answer after Run

- Status: resolved locally; hosted interactive test pending
- First recorded: 2026-10-20
- Last verified: 2026-10-20
- Area: Java Console / javaExecution.ts, useJavaConsole.ts, public runtime and Java helper
- Search terms: Scanner, nextLine, NoSuchElementException, No line found, interactive input, prompt then answer, input before run, live output

## Symptom

The program printed a question and immediately failed at Scanner.nextLine instead
of waiting. Supplying all input before Run worked. The hosted screenshot contained
CheerpJ's Java stack trace; this was not a deployment or student syntax failure.

## Root cause

The bridge supplied System.in through ByteArrayInputStream: only pre-entered text
existed and an empty stream ended immediately. The main Console disabled its input
while running. Output reached the UI only when the final result returned.
Previous input tests supplied all input before invoking Java, so they did not test conversation.

## Durable solution

Keep batch mode for module sample checks. The editable online consoles use shared
useJavaConsole.ts, authenticated per-run/per-question input requests in javaExecution.ts
and runner.js, and a waiting InputStream in vendor/java/CodeShareJava.java. Flush
captured output while running. Enter supplies another line, including a blank line;
Stop tears down the frame. Separate the cumulative five-second execution allowance
from each two-minute input wait. Rebuild/commit the helper JAR whenever its source changes.
Offline still uses laptop javac with the existing batch input; no offline feature added.

## Regression proof

- tests/browser-java-client.test.mjs:
  interactive Java: streams prompts, waits for blank and Unicode answers, and rejects stale or foreign input requests (CKB-049)
- tests/browser-java-runtime.test.mjs:
  browser runtime: live input waits for authenticated matching answers and streams output before completion (CKB-049)
- Command: node --test --test-reporter=spec tests/browser-java-client.test.mjs tests/browser-java-runtime.test.mjs
- Disabled input-request handling: new regression failed. Restored handling: passed.
- Real browser actual CheerpJ, production app and local Supabase: three prompts,
  Unicode/blank input, Stop, timeout/recovery, personal project and unchanged module input.
- Full evidence and test names: docs/verification/online-java-interactive-input.md.
- Branch codex/online-java-interactive-input; delivery commit recorded in the handoff.

## Recurrence triage

If Java has not started, check runner address/startup rather than assuming this case.
If a prompt prints then No line found occurs, check the interactive capability and
message path; module checks intentionally consume fixed JSON input and can end at EOF.
An input wait timeout is separate from an execution timeout.

## History

- 2026-10-20 — Teacher reported input must be entered before running; approved online
  workflow change, preserving offline batch execution and module-check rules.
