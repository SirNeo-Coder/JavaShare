# Week 16 three-part report

File: `docs/modules/week16/Java2_Week_16.threepart.codeshare.json` (built 2026-11-15, branch `content/week16-three-part`),
built from the approved Week 16 of 2026-11-08 (Day 3 is Semaphore only), which now replaces the older copy in this folder.

## Read this first

- **Steps 7 and 8 (your observation on Wednesday, 18 November) are ready.** Sample, guided example and own task each
  gave the exact expected output on laptop Java (5 of 5 runs, the first four with every processor core kept busy) and
  on the online Java (CheerpJ, 3 of 3 runs).
- **Steps 1 and 2 online (CKB-125):** online, CodeShare ran the student's `main()` on a thread named `Thread-0`, not
  `main`, so their samples never matched (the current Week 16 file too). Fixed on `fix/online-main-thread-name`
  (approved 2026-11-15); with it, all 24 online runs pass. Until that fix is merged and the runner redeployed, Steps
  1 and 2 still fail online. Laptop Java (offline mode) was always fine.
- **Upload this file only to a separate test class, never to your current class.** Every own task has a new `-v2` id,
  so your current students' Week 16 completions would no longer count, and Week 17 would lock for them.
- Upload it only after the guided-example app change is live. An older server does not know `guided`.

## What changed so the output does not depend on timing

Threads finish in an order nobody can promise. A slow or busy computer, or the online runner, can change it. So each
program now keeps every thread's result in its own object, and `main` prints the results after `join()` (wait for a
thread to finish) or `await()` (wait for the count or group), in the list's order.

| Step | Before | Now |
|---|---|---|
| 3 | Printed `Finished in under 1 second? true`, a clock check. | The clock lines are gone. The note and Check yourself still say the three run together in about 0.5 s. |
| 5 | Each `ReadyReport` printed "reports: ready" from its own thread, so the order came from the sleep times. | `ReadyReport` saves `status`; `main` prints all four after `latch.await()`, in list order. The latch is printed before any thread starts. |
| 6 | Each `ConvoyLeg` printed "arrived at ..." from its own thread. | Those prints are gone. "All here at ..." is still printed by the last arrival: always once per stop, in stop order. Each leg saves `lastStop`; `main` prints "NXA 123 reached Recto" and the others after the joins. |
| 7 | Every arrival, loading and leaving line came from a thread, so the 13-line output depended on timing. | `LoadingBay` saves `result`; `main` prints "Free bays at the start: 2", the four results after the joins, and "All loaded. Free bays: 2". The note after Step 7 now explains the timeline (who waits, who takes which bay), so Thursday question 3.2 can still be answered. Check yourself: add a print inside the thread and see why we do not check its order. |

Step 8 already printed in a fixed order; its sample is unchanged. The later steps carry the new `ReadyReport`,
`ConvoyLeg` and `LoadingBay`. Other text changed: the Tuesday "No internet needed" note no longer warns about lines in a
different order.

## How each step was checked

- **Discussion line numbers:** every "Look at line N" quote is checked by a test against that step's file (Main.java or
  the named class), 63 quotes in all; the test was shown failing with one line number made wrong. "As you remember
  from ..." is used only for Week 12 (extends, `super`, Vehicle arrays), Week 13 (checked exceptions, `throws`,
  `finally`, `board()` and `OverloadException`) and Week 14 (`List`/`ArrayList`), each found in those modules first.
- **Guided example:** the old `-v1` task with its tested answer (Step 8: your answer key in
  `Week16_Semaphore_Day3/Step8_answer_key`), adapted to the new samples. Run on laptop Java and online.
- **Own task:** the same edit as the guided example with one thing different, with a new `-v2` id. Its answer was run
  the same two ways; its output differs from the guided output on every step. Every answer-key line is checked by a
  test to sit at the line number it names (shown failing with one wrong number).
- Upload rules (CodeShare's own checker): passed. Lesson ids, step ids, exit slips, starter files and the performance
  task are unchanged from the approved source.
- Tests: `tests/week16-three-part.test.mjs` (laptop) and `tests/week16-three-part.browser.mjs` (online, needs a page on
  port 3020 and `java-runtime/public` on 3021).

| Step | New task id | Discussion lines checked | Guided result | Own task answer | Own task result | Status |
|---|---|---|---|---|---|---|
| 7 | `java-2-w16-d4-s7-alter-v2` | 7, 8, 10, 19 (LoadingBay), 21 (LoadingBay), 24 (LoadingBay), 30, 32 | PASSED (laptop and online) | Main.java, line 7 — three bays:<br>        Semaphore bays = new Semaphore(3);                 // 3 bays | PASSED (laptop and online) | OK; sample changed (no timing) |
| 8 | `java-2-w16-d4-s8-alter-v2` | 7, 8, 14, 18, 18 (BayBoarding), 20 (BayBoarding), 26 (BayBoarding), 32, 34 | PASSED (laptop and online) | Main.java, line 7 — two bays, as in the guided example:<br>        Semaphore bays = new Semaphore(2);        // 2 boarding bays<br><br>Main.java, line 14 — BUS 789 back to 30, NYB 321 tries 25:<br>        int[] riders = {12, 6, 30, 25}; | PASSED (laptop and online) | OK |
| 1 | `java-2-w16-d2-s1-alter-v2` | 3, 1 (DispatchThread), 8 (DispatchThread), 14 (DispatchThread), 5, 7, 8, 10, 14, 16 | Laptop PASSED; online PASSED with the CKB-125 fix | Main.java, line 5 — four trips:<br>        DispatchThread t = new DispatchThread(jeep, 4);<br><br>Main.java, line 16 — the label:<br>        System.out.println("Collected after 4 trips: P" + t.getCollected()); | Laptop PASSED; online PASSED with the CKB-125 fix | OK once the CKB-125 fix is live |
| 2 | `java-2-w16-d2-s2-alter-v2` | 6, 7, 8, 11, 13, 17 | PASSED (laptop and online) | Main.java, lines 7-12 — the tricycle stays fixed, as in the guided example:<br>        wrong.start();                     // now a real new thread<br>        try {<br>            wrong.join();<br>        } catch (InterruptedException e) {<br>            System.out.println("main was interrupted");<br>        }<br><br>Main.java, line 16 — replace right.start() and its try and catch (lines 16-21 after the guided example) with:<br>        right.run();                       // now just a normal method call | Laptop PASSED; online PASSED with the CKB-125 fix | OK once the CKB-125 fix is live |
| 3 | `java-2-w16-d2-s3-alter-v2` | 6, 7, 12, 16, 24, 27 | PASSED (laptop and online) | Main.java, lines 7-9 — three trips for each worker:<br>        crew.add(new DispatchThread(new Jeepney("NXA 123", "Mang Ramon", "Monumento-Divisoria"), 3));<br>        crew.add(new DispatchThread(new Tricycle("TRC 456", "Kuya Ben", "Bagong Silang TODA"), 3));<br>        crew.add(new DispatchThread(new Bus("BUS 789", "Aling Rosa", 50), 3)); | PASSED (laptop and online) | OK; sample changed (no timing) |
| 4 | `java-2-w16-d3-s4-alter-v2` | 1 (BoardingTask), 15 (BoardingTask), 19 (BoardingTask), 6, 7, 9, 19, 21 | PASSED (laptop and online) | Main.java, line 7 — groups of 2, 1 and 1:<br>        BoardingTask trikeJob = new BoardingTask(trike, new int[] {2, 1, 1}); | PASSED (laptop and online) | OK |
| 5 | `java-2-w16-d3-s5-alter-v2` | 7, 9, 16, 19 (ReadyReport), 23 (ReadyReport), 19, 24, 26 | PASSED (laptop and online) | Main.java, line 7 — wait for 3 reports, as in the guided example:<br>        CountDownLatch latch = new CountDownLatch(3);      // wait for 3 reports<br><br>Main.java, lines 9-11 — the three vehicles left, with BUS 789 back and NXA 123 gone:<br>        reports.add(new ReadyReport("TRC 456", 100, latch));<br>        reports.add(new ReadyReport("BUS 789", 300, latch));<br>        reports.add(new ReadyReport("NYB 321", 200, latch)); | PASSED (laptop and online) | OK; sample changed (no timing) |
| 6 | `java-2-w16-d4-s6-alter-v2` | 7, 9, 15, 18 (ConvoyLeg), 19 (ConvoyLeg), 21 (ConvoyLeg), 30 (ConvoyLeg), 17 (ConvoyLeg), 28 | PASSED (laptop and online) | Main.java, line 7 — a barrier of 2, as in the guided example:<br>        CyclicBarrier barrier = new CyclicBarrier(2);  // 2 in the convoy<br><br>Main.java, lines 9-10 — the two vehicles in the convoy, with NYB 321 back and BUS 789 gone:<br>        legs.add(new ConvoyLeg("NXA 123", 300, barrier));<br>        legs.add(new ConvoyLeg("NYB 321", 100, barrier)); | PASSED (laptop and online) | OK; sample changed (no timing) |

## Upload check

A real upload into a throwaway local class (local app in offline mode on this branch, local Supabase): accepted.
The teacher received all 8 guided examples and all 8 answer keys. A student with Steps 1–7 passed received all 8
guided examples and no answer key. The class and both test accounts were deleted afterwards. For this check only,
`previousModuleId` was removed, because the throwaway class had no Week 15.

## Printed module and lesson plan

- PDF: pages 1–9 are your module; yellow stamps on Steps 3, 5, 6 and 7 point to the appendix (pages A-1 to A-9),
  which prints each step's discussion, guided example and own task, and the new code for Steps 3, 5, 6 and 7. No
  answer key is printed. Page 6's challenge 2 (change the delays to get a new order) no longer works with the fixed
  order, so it now asks students to predict that the output stays the same. Page 7's time plan says Thursday is
  Steps 7 and 8. The "Page n of 8" labels are kept: your module still has 8 numbered pages (with page 3B); the
  appendix pages are numbered A-1 to A-9.
- Word plan: Wednesday is Runnable, CountDownLatch and CyclicBarrier (Steps 4–6, slip /20 with 2.4); Thursday is
  Semaphore only (Steps 7–8, slip /15); every Student Activity row lists the three-part order. Check the rewritten
  Step 5 and Step 7 homework/enrichment ideas, and the commit messages `week16-day3-runnable-latch-barrier` and
  `week16-day4-semaphore`.

## Not checked

- The hosted site and its online runner. The online runs used this branch's runner files served on the laptop.
- The Word file was viewed after LibreOffice converted it to PDF, not in Microsoft Word.
