# CKB-126 — Week 16 samples depend on thread timing, so they may not verify

- Status: resolved in the Week 16 three-part file (`Java2_Week_16.threepart.codeshare.json`); the current Week 16 file is unchanged
- First recorded: 2026-11-15 (known since 2026-10-22, see `docs/modules/week16/README.md`)
- Last verified: 2026-11-15
- Area: Week 16 module content, Steps 3, 5, 6 and 7
- Search terms: Week 16 sample mismatch, thread order, Finished in under 1 second false, reports out of order,
  arrived at Monumento order, Free bays order, sample never verified, slow computer

## Symptom

Week 16 Step 3 printed `Finished in under 1 second?` (a clock check), and Steps 5, 6 and 7 printed from inside the
worker threads, so the line order depended on how fast each thread ran. On a slow or busy computer, or online, the
sample output could differ and the sample would not verify.

## Root cause

The expected output relied on sleep times (0.1–0.4 s) to fix the order of prints from different threads. Threads
give no such promise.

## Durable solution

In the three-part file (teacher's request, 2026-11-15): Step 3 drops the clock lines. Steps 5, 6 and 7 save each
worker's result in its own object (`ReadyReport.getStatus()`, `ConvoyLeg.getLastStop()`, `LoadingBay.getResult()`)
and `main` prints them after `await()` or `join()`, in the list's order. Step 6 still prints "All here" from the last
arrival, which is always once per stop and in stop order. The later steps carry the new helper classes.

## Regression proof

- `tests/week16-three-part.test.mjs`, "sample, guided example and own task give their exact output on laptop Java":
  5 of 5 runs passed with every processor core kept busy.
- `tests/week16-three-part.browser.mjs`: Steps 3–8 pass 3 of 3 runs online.

## History

- 2026-11-15 — Fixed in the three-part file on `content/week16-three-part`.
