# CKB-089 — CheerpJ's append mode writes over the start of the file

- Status: mitigated in Week 15 content (CheerpJ's own bug remains)
- First recorded: 2026-10-30
- Last verified: 2026-11-05
- Area: online Java / CheerpJ 4.3 browser runtime (`java.io.FileWriter`, `FileOutputStream` append); Week 15 content
- Search terms: append mode not working online, FileWriter true overwrites, log loses first line, trip_log.txt missing Tricycle line, Week 15 Step 7 task not completed, Week 15 Step 8 sample not verified, logbook does not grow, sales_log.txt, StandardOpenOption.APPEND

## Symptom

Found while verifying CKB-088 with the real runner page and real CheerpJ. Week 15 Step 8's sample
appends two lines to the supplied `trip_log.txt` (`TRC 456 left Bagong Silang`). Real Java prints all
three lines. CheerpJ printed only `BUS 789 left Caloocan` and `NYB 321 left Sangandaan`. A later code
review raised the same Step 8 problem; checking it showed Step 7's task ("change the second
FileWriter to append mode") fails the same way, so students could not get past Step 7 online.

## Root cause

CheerpJ ignores append mode: writing starts at position 0 and overwrites the beginning of the file
without shortening it. Probe on real CheerpJ 4.3 (each file starts as `one\n`, then `two\n` is appended):

```
FileWriter(name,true): two|
FileOutputStream(name,true): two|
Files.write APPEND: two|
Files.newBufferedWriter APPEND: two|
RandomAccessFile seek end: one|two|
FileOutputStream + channel position: one|two|
```

Every append option fails; only moving to the end by hand works. It happens inside CheerpJ's own Java
library while the student's program runs; neither `CodeShareJava.java` nor `runner.js` can change how
the student's `FileWriter` behaves. CheerpJ 5.0 exists but did not start with the current runner page
(stalled at "Starting Java compiler"), so upgrading is separate work. 4.4–4.6 and 5.1 do not exist.

## Durable solution

Teacher decision (2026-11-05): no `RandomAccessFile`/`seek`. Week 15 adds to the end by reading the
old lines first, then writing them back followed by the new ones with an overwrite `FileWriter`:

- Step 8 sample (`java-2-w15-d4-s8`) uses read-then-write-back; same expected output.
  Its task becomes `java-2-w15-d4-s8-alter-v2`: stop writing the old lines back (overwrite).
- Step 7 task becomes `java-2-w15-d4-s7-alter-v2`: write both trips through the first FileWriter.
- The "Writer" definition keeps `FileWriter(name, true)` and adds why this week reads and writes
  back. The exit slip question is unchanged (paper work; true on a desktop).
- The personal performance task's step 8, checklist item 6 and example use read-then-write-back.
- `tests/week15-week21-modules.test.mjs` refuses append mode in any Week 15 sample, task or personal
  example, because no automated test can run CheerpJ.

## Regression proof

- `tests/week15-week21-modules.test.mjs`: `Week 15: no sample, task or personal example uses append
  mode (CKB-089)` — failed with `main`'s Week 15 file and task fixture, passed restored.
- Same file: `Week 15: each sample and alteration runs alone from its own step files, as CodeShare
  runs it (CKB-088)` — Steps 7 and 8 sample and task pass on a real JVM through the bridge.
- Command: `node --test tests/week15-week21-modules.test.mjs`
- Live: real runner page, CheerpJ 4.3 from `cjrtnc.leaningtech.com`: all 10 samples, Steps 7–8
  tasks and the personal example (with `stock.txt`) matched, 13/13.
- Not live-checked: the hosted site; the PDF and Word appendices still show the old append wording.

## Recurrence triage

If written file content is wrong online but right with real Java, check whether the program opens
the file in append mode. Distinguish from CKB-088 (file missing: `No such file or directory`) and
CKB-073 (`delete()` on a non-empty folder).

## History

- 2026-10-30 — Found during CKB-088's live check; reported to the teacher with options.
- 2026-11-05 — Review comment on Step 8; Step 7 task also affected. Teacher approved
  read-then-write-back (not `RandomAccessFile`) for Steps 7–8 and the personal task. Branch
  `fix/week15-append-mode`.
