# CKB-127 — Week 17 Swing samples cannot pass in CodeShare (window timeout, online crash, lost interrupt)

- Status: resolved in the Week 17 three-part file (`Java2_Week_17.threepart.codeshare.json`); the old Week 17 file is unchanged
- First recorded: 2026-11-20
- Last verified: 2026-11-20
- Area: Week 17 module content (Swing), laptop runner and online runner (CheerpJ)
- Search terms: No display: GUI not opened, Week 17 sample timeout, Execution stopped after 5 seconds, JFrame,
  CheerpJDisplay NullPointerException, ExceptionInInitializerError JTextField, headless, interrupt ignored online

## Symptom

- Laptop Java on a computer with a screen: Week 17 Step 1 opens its window and never ends, so the run stops after
  5 seconds and fails (`Execution stopped after 5 seconds.`).
- Online (CheerpJ): making any Swing control (`new JTextField(...)`) crashes with `ExceptionInInitializerError`
  caused by a `NullPointerException` in `CheerpJDisplay`, because the online runner has no display.
- Online: `worker.interrupt()` right after `worker.start()` was lost; the worker still reported `Ready: NXA 123`
  (the old Step 5 task and a first guided-example draft relied on it).
- The samples printed only `No display: GUI not opened.`, so nothing Swing did could be checked.

## Root cause

The laptop runner passes the teacher's screen through to `java`, so `isHeadless()` is false and the window opens.
CheerpJ reports `isHeadless()` false but has no display for controls. Setting `java.awt.headless` alone is not
enough online; CheerpJ's own toolkit still starts. Interrupt delivery before the thread runs differs online.

## Durable solution

Content only, no runner change: every GUI `Main.java` starts with
`System.setProperty("java.awt.headless", "true");` and `System.setProperty("awt.toolkit", "sun.awt.HToolkit");`.
Swing then builds real controls without a screen on both runners; the programs type with `setText`, click with
`doClick()` on the EDT (`invokeAndWait`) and print what the labels and fields show. Step 1 still opens its window
on a computer with a screen when those two lines are deleted. Steps 7 and 8 never print from a worker: `main`
waits with `join()` or a `CountDownLatch` counted down in `done()`, then reads the controls in a new EDT job.
No step uses `interrupt()` or `cancel()` for its expected output (a cancelled `SwingWorker` that has not started
never calls `done()` on Java 21).

Not done (needs approval): the runners could set these properties themselves, so student programs need no lines.

## Regression proof

- `tests/week17-three-part.test.mjs`: every sample, guided example and own task gives its exact output on laptop
  Java (this laptop has a screen, so a sample that opens a window would time out).
- `tests/week17-three-part.browser.mjs`: the same 30 runs in CheerpJ Java 8.

## History

- 2026-11-20 — Found and fixed while building the Week 17 three-part file on `content/week17-three-part`.
