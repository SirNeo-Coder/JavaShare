# CKB-125 — Online, main() runs on a thread named Thread-0, not main

- Status: open; one-line runner fix proposed, waiting for the teacher's approval
- First recorded: 2026-11-15
- Last verified: 2026-11-15
- Area: online Java bridge (`vendor/java/CodeShareJava.java`, `java-runtime/public/codeshare-runner.jar`); Week 16 Steps 1 and 2
- Search terms: Thread-0, main() runs on thread, ran on thread: main, Thread.currentThread().getName(), Week 16 Step 1
  never verifies online, Week 16 Step 2 sample mismatch online, thread name differs online and offline

## Symptom

Found while running every Week 16 three-part answer online (branch `content/week16-three-part`). In the real online
runner, Week 16 Step 1 prints `main() runs on thread: Thread-0` and Step 2 prints `TRC 456 ran on thread: Thread-0`.
Laptop Java prints `main`, which is what the module expects. So the Step 1 and Step 2 samples (and Step 2's own task)
can never match online, in the current Week 16 file too. No student report yet (Week 16 not taught yet).

## Root cause

Online, CheerpJ calls the bridge (`CodeShareJava.runSources`) from one of its own worker threads, named `Thread-0`.
The bridge then calls the student's `main()` by reflection on that same thread (`CodeShareJava.java`, the
`entry.getMethod("main", ...).invoke(...)` line). Real Java, and the laptop runner, start `main()` on the thread
named `main`.

## Durable solution (proposed, not applied)

In the bridge, name the calling thread `main` just for the student's `main()` call, then give it back its old name:
`Thread.currentThread().setName("main")` before the `invoke`, restored in `finally`. Then rebuild the jar with
`node scripts/build-java-bridge.mjs`. The hosted runner (Cloudflare) must then be redeployed by the teacher.
Tried in a scratch copy of the runner only: all 24 Week 16 three-part runs pass online (Steps 1 and 2 included).

## Regression proof

- `tests/week16-three-part.browser.mjs` runs every Week 16 three-part sample, guided example and own task online.
- With today's runner: Steps 3–8 pass 3 of 3 runs; Step 1 (sample, guided, own) and Step 2 (sample, own) fail with
  `Thread-0`. With the scratch fix: 24 of 24 pass.

## Recurrence triage

If a thread lesson prints a thread name and passes on the laptop but not online, check this case first.

## History

- 2026-11-15 — Seen while building the Week 16 three-part file; fix proposed to the teacher.
