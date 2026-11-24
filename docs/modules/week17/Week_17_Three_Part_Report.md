# Week 17 three-part report

File: `docs/modules/week17/Java2_Week_17.threepart.codeshare.json` (built 2026-11-20, branch `content/week17-three-part`),
built from the repo copy of `Java2_Week_17.codeshare.json` (the teacher chose it over the older copy in
`Java 2026`, which lacks the performance-task step guide). It is the real Week 17: Monday 30 November to Friday
4 December, 10 steps, two a day, a liplet every day.

## Read this first

- **This replaces Week 17 for your current class.** Every own task has a new id (`-alter-v2` for the six old steps,
  `-alter-v1` for the four new ones), so earlier Week 17 completions no longer count. Students who already did Week 17
  redo it, and Week 18 stays locked for them until they finish the new Week 17.
- **Upload it only after the guided-example app change is live.** An older server does not know `guided` and could send
  the answer key to students.
- **The GUI programs now print real results.** CodeShare has no screen. Before, every GUI sample printed only
  `No display: GUI not opened.`, and in fact failed in both runners (CKB-127): on this laptop (which has a screen) the
  window opened and the run stopped after 5 seconds; online, making any Swing control crashed.
- Nothing was uploaded. `Java 2026`, `COT 2`, Week 15 and Week 16 are unchanged.

## How the GUI steps print real output

Every GUI `Main.java` starts with two lines:

```java
System.setProperty("java.awt.headless", "true");      // CodeShare has no screen
System.setProperty("awt.toolkit", "sun.awt.HToolkit"); // build controls without one
```

With them, Java builds the real Swing controls without a screen, on the laptop and online. `main` then works on the
event dispatch thread (EDT, the one thread that may touch Swing controls) with `SwingUtilities.invokeAndWait`: it types
with `setText`, clicks with `doClick()` (Swing runs the same `actionPerformed` a mouse click runs) and prints what the
labels and fields show, e.g. `After the click: Plate: TRC 456`. Step 1 still has the window code: on a computer with a
screen, outside CodeShare, deleting the two lines opens the window. The `java.awt.headless` line alone was not enough
online; the second line was needed (tested). The runners could set these themselves so students need no lines, but
that is an app change and was not done.

## What changed so the output does not depend on timing

| Step | Before | Now |
|---|---|---|
| 7 (was 5) | Worker waited 1.5 s and changed the label later; the sample printed only "No display". The old task stopped the worker with `interrupt()`. | `main` prints right after the click (always `Checking...`, button off, because the worker's update waits for the EDT), then waits with `join()` and reads the label in a new EDT job (always `Ready: NXA 123`, button on). Wait cut to 1 second. Online, `interrupt()` right after `start()` was lost (the worker still said Ready), so no task uses it now. |
| 8 (new) | — | `SwingWorker`: `main` waits on a `CountDownLatch` (Week 16) that `done()` counts down, then reads the label. A first draft used `cancel(true)`; on Java 21 a job cancelled before it starts never calls `done()`, so the program hung. Replaced by a result-versus-error pair. |

No other step uses threads.

## How each step was checked

- **Discussion line numbers:** every "Look at line N" is checked by a test against that step's file (Main.java or the
  named class): 86 quotes. Shown failing with one number made wrong (line 26 instead of 27). "As you remember from
  ..." is used only for Week 12 (extends, interfaces, each vehicle's own fare), Week 13 (checked exceptions) and
  Week 16 (Runnable, `join()`, `CountDownLatch`).
- **Guided example:** a meaningful edit (labels, listener result, validation, worker thread, list contents), run on
  laptop Java and online.
- **Own task:** the same edit as the guided example with one thing different; output differs from the guided output on
  every step. Every answer-key line is checked by a test to sit at the line number it names (shown failing with one
  wrong number).
- **Laptop:** `tests/week17-three-part.test.mjs`, 30 programs; 5 of 5 runs passed with all 12 processor cores kept busy.
- **Online:** `tests/week17-three-part.browser.mjs` (needs a page on port 3020 and `java-runtime/public` on 3021):
  30 programs × 3 runs = 90 of 90 passed. Laptop and online output were compared line by line: identical.
- Upload rules (CodeShare's own checker): passed. Lesson ids, exit-slip ids and question ids, starter files and the
  previous-module link are unchanged; each slip now comes after its day's second step.

| Step | New task id | Discussion lines checked | Guided result | Own task answer | Own task result | Status |
|---|---|---|---|---|---|---|
| 1 | `java-2-w17-d1-s1-alter-v2` | 5, 6, 7, 2 (TerminalPanel), 4 (TerminalPanel), 5 (TerminalPanel), 11, 13, 18, 24, 25 | PASSED (laptop and online) | TerminalPanel.java, line 6 — the sign at position 0:<br>    add(new JLabel("Capacity: 20"), 0); | PASSED (laptop and online) | OK; Was Step 1; new sample code |
| 2 | `java-2-w17-d1-s2-alter-v1` | 3 (TerminalPanel), 5 (TerminalPanel), 8 (TerminalPanel), 11 (TerminalPanel), 12 (TerminalPanel), 14 (TerminalPanel), 5, 10, 12 | PASSED (laptop and online) | TerminalPanel.java, line 12 — the seats on the route sign:<br>    route.setText(jeep.getRoute() + " | seats: " + jeep.getCapacity()); | PASSED (laptop and online) | OK; New step |
| 3 | `java-2-w17-d2-s2-alter-v2` | 3 (TerminalPanel), 4 (TerminalPanel), 8 (TerminalPanel), 10 (TerminalPanel), 17 (TerminalPanel), 9, 13, 14, 15 | PASSED (laptop and online) | TerminalPanel.java, line 17 — count without trim():<br>    result.setText("Characters: " + plate.getText().length()); | PASSED (laptop and online) | OK; Was Step 2; new sample code |
| 4 | `java-2-w17-d2-s4-alter-v1` | 10 (TerminalPanel), 12 (TerminalPanel), 20 (TerminalPanel), 21 (TerminalPanel), 23 (TerminalPanel), 11, 13, 15, 17 | PASSED (laptop and online) | TerminalPanel.java, lines 21-26 — refuse a blank and suggest NXA 123:<br>      if (plate.getText().trim().isEmpty()) {<br>        result.setText("Type a plate first");<br>        plate.setText("NXA 123");<br>      } else {<br>        result.setText("Plate: " + plate.getText().trim());<br>      } | PASSED (laptop and online) | OK; New step |
| 5 | `java-2-w17-d3-s3-alter-v2` | 19 (TerminalPanel), 25 (FareService), 7 (FareService), 34 (FareService), 20 (TerminalPanel), 22 (TerminalPanel), 13, 17, 18 | PASSED (laptop and online) | TerminalPanel.java, line 23 — the unknown-plate message:<br>      result.setText("No vehicle " + plate.getText().trim() + ". Try NXA 123."); | PASSED (laptop and online) | OK; Was Step 3; new sample code |
| 6 | `java-2-w17-d3-s4-alter-v2` | 3 (FareCheck), 4 (FareCheck), 6 (FareCheck), 8 (FareService), 11 (FareCheck), 14 (FareCheck), 3 | PASSED (laptop and online) | FareCheck.java, line 3 — the tricycle goes 3 km:<br>    String[][] cases = {{"NXA 123", "5"}, {"TRC 456", "3"}, | PASSED (laptop and online) | OK; Was Step 4; sample unchanged |
| 7 | `java-2-w17-d4-s5-alter-v2` | 16, 18, 19, 13 (ReadyTask), 14 (ReadyTask), 20 (ReadyTask), 22 (ReadyTask), 24, 27 | PASSED (laptop and online) | ReadyTask.java, line 22 — ask the question inside the queued update:<br>        status.setText(outcome + " | update on the EDT: " + SwingUtilities.isEventDispatchThread()); | PASSED (laptop and online) | OK; Was Step 5; new sample code |
| 8 | `java-2-w17-d4-s8-alter-v1` | 3 (ReadyWorker), 12 (ReadyWorker), 14 (ReadyWorker), 16 (ReadyWorker), 18 (ReadyWorker), 23 (ReadyWorker), 20, 28 | PASSED (laptop and online) | ReadyWorker.java, line 14 — an unknown plate:<br>    return FareService.quote("ZZZ", "4"); | PASSED (laptop and online) | OK; New step |
| 9 | `java-2-w17-d5-s6-alter-v2` | 2 (ThemeCheck), 6 (ThemeCheck), 7 (ThemeCheck), 15 (ThemeCheck), 16 (ThemeCheck), 20 (ThemeCheck), 3 | PASSED (laptop and online) | ThemeCheck.java, lines 15-16 — price P60, quantity 1000:<br>    StoreItem rice = new StoreItem(60);<br>    for (String s : new String[]{"1000","0","abc"}) { | PASSED (laptop and online) | OK; Was Step 6; sample unchanged |
| 10 | `java-2-w17-d5-s10-alter-v1` | 4 (TerminalPanel), 10 (TerminalPanel), 18 (TerminalPanel), 20 (TerminalPanel), 23 (TerminalPanel), 14, 16, 17 | PASSED (laptop and online) | TerminalPanel.java, line 4 — ZZZ 999 first:<br>  private JComboBox<String> plate = new JComboBox<String>(new String[] {"ZZZ 999", "NXA 123", "TRC 456", "BUS 789", "NYB 321"}); | PASSED (laptop and online) | OK; New step |
## The four new steps

- **Step 2 (Monday):** labels filled from a `Jeepney` object; `setText` changes them, `getText` reads them.
- **Step 4 (Tuesday):** Show and Clear buttons share one listener; `getActionCommand()` tells which was clicked.
- **Step 8 (Thursday):** the Step 7 job again with `SwingWorker` (`doInBackground`, `done`, `get`).
- **Step 10 (Friday):** a `JComboBox` drop-down list of plates instead of typing.

## Other text changes

Each day's table row, step headers, observed outputs and Check yourself notes; Monday's "No screen in CodeShare"
note; Thursday's "What was actually verified"; exit-slip prompts now name the new step numbers (same questions and
points). Performance task: step references renumbered (Step 3, 5, 7, 9 files) and "keep Step 1's two no-screen lines
first in `main`", so a student's own Swing program runs (and can be submitted) in CodeShare.

## Printed module and lesson plan

- PDF (25 pages): your 10 original pages with yellow stamps (new dates on page 1, each day's date, each changed
  step pointing to its appendix page, the "No display" outputs, the time plan, each liplet's new "after Step n"),
  then the appendix A-1 to A-15: every step's code with line numbers, sample output, discussion, guided example and
  own task, and the five liplets. No answer key is printed. The "Page n of 8" labels are unchanged.
- Word plan: dates 30 November to 4 December, two steps a day, the three-part order in every Student Activity row,
  five liplets with new step numbers, Thursday/Friday time plan, Thursday's 1-second demo, the ten own-task ids.
  Commit-message names are unchanged.

## Not checked

- Week 17 still carries the older copies of the Week 16 helper classes (`BoardingTask`, `ConvoyLeg`, `DispatchThread`, `LoadingBay`,
  `ReadyReport`) from its source; Week 16's three-part file changed them. This week never calls them, and every Week 17 step
  compiles with the copies it carries. Not changed here (Week 16 and the starter files were out of scope).

- A real upload into a local class (Week 16 had one). The answer-key removal for students is the app's tested
  general rule (`tests/module-activities.test.mjs`), not re-run with this file.
- The hosted site and its online runner. The online runs used this branch's runner files served on the laptop.
- A real window on a screen (look, mouse, keyboard, resizing, closing).
- The Word file was viewed after LibreOffice converted it to PDF, not in Microsoft Word.

## Update 2026-11-25: own tasks start from the guided code (CKB-143)

The guided code stays in the editor, so Steps 1, 5, 6, 7 and 10 now say what to do with it (move the sign or plate you
added; put line 21, the bus's 4 km or line 14 back). Outputs, answer keys and ids are unchanged. The printed module's
pages A-2, A-8, A-9, A-10 and A-14 carry the new wording (pages A-9 and A-10 move the rest of the step down one line).
The PDF's hidden text layer under those pages still holds the old sentences, so a text search can find both; the page
prints only the new one. The Word plan still has the old wording for Steps 1 and 10.
