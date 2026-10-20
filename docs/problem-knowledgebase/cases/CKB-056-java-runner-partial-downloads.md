# CKB-056 — Online Java loading timeout and unsupported partial downloads

- Status: mitigated locally; hosted rollout and affected-browser retest pending
- First recorded: 2026-10-21
- Last verified: 2026-10-21
- Area: online Java / runner.js, javaExecution.ts, useJavaConsole.ts
- Search terms: CheerpJ, sheerpj stopped working, online Java, 120 seconds, loading timeout, compilation timeout, Range header, compiler download

## Symptom

The teacher's screenshots show a simple Hello CodeShare program waiting at Stop,
then "Java loading or compilation stopped after 120 seconds". That message did not
identify which startup stage had stalled.

## Root cause

Verified hosting defect: the public runner answered `Range: bytes=0-31` requests
for both javac.jar and codeshare-runner.jar with HTTP 200 and whole files, rather
than partial responses. Actual CheerpJ logged that the server did not support Range.
The original runner passed `/app/` URLs directly to CheerpJ's range-based loader.
Earlier browser verification recorded similar warnings but successful runs, and
the existing automated runtime mock never tested downloading real JAR bytes.

This is a credible startup failure mechanism, not proof of the teacher's exact
timeout cause: the isolated public Hello CodeShare run succeeded in 5.5 seconds
despite those warnings. CKB-047's required nested frame permission was present in
the public response, so that earlier cause was not reused.

## Durable solution

`java-runtime/public/runner.js` downloads the two committed JARs normally, checks
HTTP success, preserves their bytes with Uint8Array, and starts the compiler from
`/str/javac.jar:/str/codeshare-runner.jar`. The host no longer needs Range support.
No vendor runtime, helper JAR, security policy, setting or dependency changes.

Runner stages travel through authenticated per-run messages. `javaExecution.ts`
names the last stage on the unchanged 120-second startup deadline; optional
`JavaInteraction.onStatus` lets `useJavaConsole.ts` display progress without adding
it to returned Java output. Execution and input budgets remain separate.

## Regression proof

- `tests/browser-java-runtime.test.mjs`: **browser runtime: whole-file downloads preserve binary compiler JARs without Range support (CKB-056)**; HTTP and network failures also covered.
- `tests/browser-java-client.test.mjs`: **browser Java: startup stages authenticate messages and identify the stalled stage without extending the deadline (CKB-056)**; result separation also covered.
- Command: `node --test --test-isolation=none --test-reporter=spec tests/browser-java-client.test.mjs tests/browser-java-runtime.test.mjs` — 21 passed.
- Restored `/app/` classpath: regression failed. Removed saved-stage update: regression failed. Restored fixes: 21 passed.
- Full suite: 145 passed, no failures/skips. Build passed; lint zero errors/eight existing warnings.
- Actual production app/local Supabase/actual CheerpJ on a local server with no
  Range support: Hello CodeShare, repeated multi-file interactive input, blank and
  Unicode answers, Stop and offline laptop Java passed. Complete evidence and
  remaining browser checks: `docs/verification/java-runner-startup.md`.
- Branch: `codex/java-runner-startup`; final commit recorded in the rolling handoff.

## Recurrence triage

Report the Last stage text. Loading Java 8 points to the vendor loader; Starting
Java 8 to runtime startup; Downloading names the compiler/helper asset; Starting
Java compiler or Compiling project narrows the next investigation. Compare public
runner.js with the reviewed code after rollout. A successful local or isolated run
does not prove recovery in the affected browser. Do not add keys to this public
origin or weaken its security policy.

## History

- 2026-10-21 — Teacher reported online startup timeout and approved complete binary
  downloads, stage feedback, focused regressions, real browser/offline verification
  and normal branch/PR delivery. No hosted changes authorized or performed.
