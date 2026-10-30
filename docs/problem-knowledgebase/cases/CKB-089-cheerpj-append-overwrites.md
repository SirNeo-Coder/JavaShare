# CKB-089 — CheerpJ's append mode writes over the start of the file

- Status: investigating, not fixed (needs a teacher decision)
- First recorded: 2026-10-30
- Last verified: 2026-10-30
- Area: online Java / CheerpJ 4.3 browser runtime (`java.io.FileWriter`, `FileOutputStream` append)
- Search terms: append mode not working online, FileWriter true overwrites, log loses first line, trip_log.txt missing Tricycle line, Week 15 Step 8 sample not verified, logbook does not grow, sales_log.txt

## Symptom

Found while verifying CKB-088 with the real runner page and real CheerpJ. Week 15 Step 8's sample
appends two lines to the supplied `trip_log.txt` (`TRC 456 left Bagong Silang`). Real Java prints all
three lines. CheerpJ printed only `BUS 789 left Caloocan` and `NYB 321 left Sangandaan`.

## Root cause

CheerpJ ignores append mode: `new FileWriter(name, true)` and `new FileOutputStream(name, true)`
start writing at position 0, overwriting the beginning of the file without shortening it. Probe on
real CheerpJ 4.3 with `trip_log.txt` = `TRC 456 left Bagong Silang\n` (27 bytes):

```
supplied: TRC 456 left Bagong Silang| length=27
after FileWriter append: A|C 456 left Bagong Silang| length=27
after FileOutputStream append: B|C 456 left Bagong Silang| length=27
made.txt: two|null          (written "one", then appended "two" in the same run)
```

The file the program reads is correct (CKB-088 supplies it); the write is wrong. It happens inside
CheerpJ's own Java library, while the student's program runs. Neither `CodeShareJava.java` nor
`runner.js` can change how the student's `FileWriter` behaves.

## Durable solution

None yet. Affected content: Week 15 Step 8 sample (`java-2-w15-d4-s8`; its task switches to
overwrite mode and is unaffected), and the Week 15 personal performance task (example files,
step 8 and checklist item use `FileWriter(name, true)`). The laptop runner gives the right result
but blocks `java.io` (offline Week 15 is online only for now). Options to put to the teacher: a
content change like CKB-073, trying a newer CheerpJ version, or running these parts offline once
file access is allowed there.

## Regression proof

- None yet: no CodeShare code to test. Reproduced live on demand with the probe above (real
  runner page, CheerpJ 4.3 from `cjrtnc.leaningtech.com`).

## Recurrence triage

If written file content is wrong online but right with real Java, check whether the program opens
the file in append mode. Distinguish from CKB-088 (file missing: `No such file or directory`) and
CKB-073 (`delete()` on a non-empty folder).

## History

- 2026-10-30 — Found during CKB-088's live check; reported to the teacher with options.
