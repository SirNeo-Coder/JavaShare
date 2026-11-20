# Week 16 three-part report

File: `docs/modules/week16/Java2_Week_16.threepart.codeshare.json`. First built 2026-11-15; rebuilt 2026-11-20 as five
days, Monday to Friday (November 23–27), with ten steps and a liplet every day (branch `content/week16-five-days`).

## Read this first

- **This is the real Week 16 now (teacher, 2026-11-20).** Upload it to your class. Students who already did Week 16
  redo it: every own task has a new id, so their old passes do not count, and Week 17 stays locked until they finish.
- Monday: Steps 1–2 (new Step 2: thread states, `isAlive()`, `sleep()`, a thread cannot start twice). Tuesday: Steps
  3–4. Wednesday: Steps 5–7. Thursday: Steps 8–9. Friday: new Step 10 (a `Semaphore` and a `CountDownLatch` in one
  program), then the Performance Task. Liplets: Monday 1.x, Tuesday 2.x (new questions), Wednesday 3.x, Thursday 4.x,
  Friday 5.x.
- The eight earlier steps keep their step ids and their guided examples and own tasks; only their numbers and "Step N"
  mentions changed. Every sample, guided example and own task gives its exact output on laptop Java and on the online
  Java (CheerpJ); Steps 1 and 3 print thread names; they pass online with the CKB-125 runner fix (merged in #125).

## What changed so the output does not depend on timing

Threads finish in an order nobody can promise. A slow or busy computer, or the online runner, can change it. So each
program now keeps every thread's result in its own object, and `main` prints the results after `join()` (wait for a
thread to finish) or `await()` (wait for the count or group), in the list's order.

| Step | Before | Now |
|---|---|---|
| 4 | Printed `Finished in under 1 second? true`, a clock check. | The clock lines are gone. The note and Check yourself still say the three run together in about 0.5 s. |
| 6 | Each `ReadyReport` printed "reports: ready" from its own thread, so the order came from the sleep times. | `ReadyReport` saves `status`; `main` prints all four after `latch.await()`, in list order. The latch is printed before any thread starts. |
| 7 | Each `ConvoyLeg` printed "arrived at ..." from its own thread. | Those prints are gone. "All here at ..." is still printed by the last arrival: always once per stop, in stop order. Each leg saves `lastStop`; `main` prints "NXA 123 reached Recto" and the others after the joins. |
| 8 | Every arrival, loading and leaving line came from a thread, so the 13-line output depended on timing. | `LoadingBay` saves `result`; `main` prints "Free bays at the start: 2", the four results after the joins, and "All loaded. Free bays: 2". The note after Step 7 now explains the timeline (who waits, who takes which bay), so Thursday question 4.2 can still be answered. Check yourself: add a print inside the thread and see why we do not check its order. |

Step 9 (old Step 8) already printed in a fixed order; its sample is unchanged. The later steps carry the new `ReadyReport`,
`ConvoyLeg` and `LoadingBay`. Other text changed: the Monday "No internet needed" note no longer warns about lines in a
different order.

## How each step was checked

- **Discussion line numbers:** every "Look at line N" quote is checked by a test against that step's file (Main.java or
  the named class), 82 quotes in all; the test was shown failing with one line number made wrong (2026-11-15). "As you remember
  from ..." is used only for Week 12 (extends, `super`, Vehicle arrays), Week 13 (checked exceptions, `throws`,
  `finally`, `board()` and `OverloadException`) and Week 14 (`List`/`ArrayList`), each found in those modules first.
- **Guided example:** the old `-v1` task with its tested answer (Step 9: your answer key in
  `Week16_Semaphore_Day3/Step8_answer_key`); the new Steps 2 and 10 have new guided examples, adapted to the new samples. Run on laptop Java and online.
- **Own task:** the same edit as the guided example with one thing different, with a new id (`-v2`; `-v1` for the new Steps 2 and 10). Its answer was run
  the same two ways; its output differs from the guided output on every step. Every answer-key line is checked by a
  test to sit at the line number it names (shown failing with one wrong number, 2026-11-15).
- Upload rules (CodeShare's own checker): passed. The eight earlier step ids, the starter files and the module's link to
  Week 15 are unchanged. New: the Monday lesson, Steps 2 and 10, the Monday liplet and Tuesday's liplet questions; the
  Performance Task text only has its step numbers changed.
- Tests: `tests/week16-three-part.test.mjs` (laptop) and `tests/week16-three-part.browser.mjs` (online, needs a page on
  port 3020 and `java-runtime/public` on 3021).

| Step | New task id | Discussion lines checked | Guided result | Own task answer | Own task result | Status |
|---|---|---|---|---|---|---|
| 1 (Mon) | `java-2-w16-d2-s1-alter-v2` | 3, 1 (DispatchThread), 8 (DispatchThread), 14 (DispatchThread), 5, 7, 8, 10, 14, 16 | PASSED | Main.java, line 5 — four trips:<br>        DispatchThread t = new DispatchThread(jeep, 4);<br><br>Main.java, line 16 — the label:<br>        System.out.println("Collected after 4 trips: P" + t.getCollected()); | PASSED | OK |
| 2 (Mon) | `java-2-w16-d1-s2-alter-v1` | 1 (StateWatcher), 5 (StateWatcher), 10 (StateWatcher), 12 (StateWatcher), 4, 6, 8, 13, 16 | PASSED | StateWatcher.java, line 10 — the name of the thread running run():<br>        seenInside = getState() + ", on thread " + Thread.currentThread().getName(); | PASSED | New step |
| 3 (Tue) | `java-2-w16-d2-s2-alter-v2` | 6, 7, 8, 11, 13, 17 | PASSED | Main.java, lines 7-12 — the tricycle stays fixed, as in the guided example:<br>        wrong.start();                     // now a real new thread<br>        try {<br>            wrong.join();<br>        } catch (InterruptedException e) {<br>            System.out.println("main was interrupted");<br>        }<br><br>Main.java, line 16 — replace right.start() and its try and catch (lines 16-21 after the guided example) with:<br>        right.run();                       // now just a normal method call | PASSED | OK |
| 4 (Tue) | `java-2-w16-d2-s3-alter-v2` | 6, 7, 12, 16, 24, 27 | PASSED | Main.java, lines 7-9 — three trips for each worker:<br>        crew.add(new DispatchThread(new Jeepney("NXA 123", "Mang Ramon", "Monumento-Divisoria"), 3));<br>        crew.add(new DispatchThread(new Tricycle("TRC 456", "Kuya Ben", "Bagong Silang TODA"), 3));<br>        crew.add(new DispatchThread(new Bus("BUS 789", "Aling Rosa", 50), 3)); | PASSED | OK |
| 5 (Wed) | `java-2-w16-d3-s4-alter-v2` | 1 (BoardingTask), 15 (BoardingTask), 19 (BoardingTask), 6, 7, 9, 19, 21 | PASSED | Main.java, line 7 — groups of 2, 1 and 1:<br>        BoardingTask trikeJob = new BoardingTask(trike, new int[] {2, 1, 1}); | PASSED | OK |
| 6 (Wed) | `java-2-w16-d3-s5-alter-v2` | 7, 9, 16, 19 (ReadyReport), 23 (ReadyReport), 19, 24, 26 | PASSED | Main.java, line 7 — wait for 3 reports, as in the guided example:<br>        CountDownLatch latch = new CountDownLatch(3);      // wait for 3 reports<br><br>Main.java, lines 9-11 — the three vehicles left, with BUS 789 back and NXA 123 gone:<br>        reports.add(new ReadyReport("TRC 456", 100, latch));<br>        reports.add(new ReadyReport("BUS 789", 300, latch));<br>        reports.add(new ReadyReport("NYB 321", 200, latch)); | PASSED | OK |
| 7 (Wed) | `java-2-w16-d4-s6-alter-v2` | 7, 9, 15, 18 (ConvoyLeg), 19 (ConvoyLeg), 21 (ConvoyLeg), 30 (ConvoyLeg), 17 (ConvoyLeg), 28 | PASSED | Main.java, line 7 — a barrier of 2, as in the guided example:<br>        CyclicBarrier barrier = new CyclicBarrier(2);  // 2 in the convoy<br><br>Main.java, lines 9-10 — the two vehicles in the convoy, with NYB 321 back and BUS 789 gone:<br>        legs.add(new ConvoyLeg("NXA 123", 300, barrier));<br>        legs.add(new ConvoyLeg("NYB 321", 100, barrier)); | PASSED | OK |
| 8 (Thu) | `java-2-w16-d4-s7-alter-v2` | 7, 8, 10, 19 (LoadingBay), 21 (LoadingBay), 24 (LoadingBay), 30, 32 | PASSED | Main.java, line 7 — three bays:<br>        Semaphore bays = new Semaphore(3);                 // 3 bays | PASSED | OK |
| 9 (Thu) | `java-2-w16-d4-s8-alter-v2` | 7, 8, 14, 18, 18 (BayBoarding), 20 (BayBoarding), 26 (BayBoarding), 32, 34 | PASSED | Main.java, line 7 — two bays, as in the guided example:<br>        Semaphore bays = new Semaphore(2);        // 2 boarding bays<br><br>Main.java, line 14 — BUS 789 back to 30, NYB 321 tries 25:<br>        int[] riders = {12, 6, 30, 25}; | PASSED | OK |
| 10 (Fri) | `java-2-w16-d5-s10-alter-v1` | 8, 16, 15, 20, 21 (TripJob), 23 (TripJob), 29 (TripJob), 34 (TripJob), 23, 30 | PASSED | Main.java, line 15 — the tricycle stays at 4, the jeepney tries 22:<br>        int[] riders = {22, 4, 30, 15}; | PASSED | New step |

Results: laptop Java 3 of 3 runs with every processor core kept busy; online Java (CheerpJ, with the CKB-125 fix) 2 of 2 runs, 60 of 60.

## Upload check

A real upload into a throwaway local class (local app in offline mode on this branch, local Supabase): accepted.
The teacher received all 8 guided examples and all 8 answer keys. A student with Steps 1–7 passed received all 8
guided examples (checked 2026-11-15 on the 8-step file; not repeated for the 10-step file) and no answer key. The class and both test accounts were deleted afterwards. For this check only,
`previousModuleId` was removed, because the throwaway class had no Week 15.

## Printed module and lesson plan

- PDF (`Java_Threads_Module.pdf`, 19 pages, rebuilt from the JSON 2026-11-20): schedule Mon–Fri, Nov 23–27; every
  step with its code (line numbers), sample output, discussion, guided example, own task and Check yourself; error
  guide; Performance Task; five liplet strips. No answer key is printed. Challenge 3 now says 150 ms (at 200 ms, BUS
  789 arrives at the same moment NXA 123 leaves, so the answer depended on timing).
- Word plan (`Java_ILAW_Week_16.docx`): dates Nov 23–27; Monday filled in every row (Steps 1–2, slip /20); Tuesday
  Steps 3–4; Wednesday–Friday renumbered; Friday adds Step 10 and slip 5.x. Page numbers in it follow the new PDF.
- Both were written by a lower-cost model and checked by eye (PDF pages 1, 2, 18; Word page 6). Please read the new
  Monday and Tuesday cells of the Word plan.

## Not checked

- The hosted site and its online runner. The online runs used this branch's runner files served on the laptop.
- The Word file was viewed after LibreOffice converted it to PDF, not in Microsoft Word.
