# Week 15 step additions

File exercises run online in CodeShare (2026-10-30, CKB-088): each step that reads a file supplies it in its own files (see "Data files" below). Offline, the laptop runner still blocks file access, so Week 15 is online only for now. Step 8's append sample still fails online because of a CheerpJ bug (CKB-089).

The JSON preserves all original lesson text, code, sample outputs, ids, liplets and rubrics,
with two later exceptions: Step 2's sample Java no longer deletes the (non-empty) `records`
folder — see "Running these steps" below — and Steps 3a and 5a no longer ask for Notepad. It adds 10 separately identified alteration tasks, sample-first verification,
the preceding-module link and missing upload fields. The original non-code Week 20 work stays intact.
Complete per-step supporting sources restore a sample after an earlier console check; a minimal
Main.java forwards to each existing named demo when needed by the classroom runner.
Text assets removed from Java-only project arrays remain byte-identical in supporting-files; original
Notepad/setup instructions and source files are preserved. Do not mistake those assets for
implemented classroom file persistence. Missing afterStep on reading/presentation lessons uses
the existing lesson id as a descriptive anchor, never a fabricated code step or paper gate.

The PDF retains every original page and appends task instructions and complete expected output.
The Word lesson plan retains its original content and appends teacher activity notes.
Original files in /home/ireneo/Documents/Java 2026 are unchanged. No runner, schema, migration,
hosted service or submitted student work changes. The personal project remains separate.

Reference edits used only by tests: tests/fixtures/week15-week21-task-edits.json.
Verification and limitations: docs/verification/week15-week21-step-additions.md.

## Running these steps (2026-10-27)

Two CheerpJ (online Java) issues surfaced in Step 2, "Folders, listing, and deleting":

- `mkdir()` could return `false` on a second online run because CheerpJ reused a prior
  run's leftover files instead of starting clean. Fixed (CKB-072); every run now gets a
  clean CheerpJ filesystem.
- `File.delete()` incorrectly reports success on a non-empty directory instead of
  refusing it, unlike a real JVM (CKB-073, no fix available from CodeShare — this is a
  CheerpJ bug). The sample no longer exercises this: the step's
  `System.out.println("Delete the folder? " + folder.delete());` line (called while
  `records/` still had `trips.txt` inside it) was removed, along with its matching
  `expectedOutput` line and the note explaining it. The step's own task still deletes the
  folder, but only after the student has made it genuinely empty, which CheerpJ handles
  correctly either way. No other step in weeks 12–21 calls `.delete()` on a directory.

Both issues are resolved for this module; no step needs to run offline for this reason
anymore.

## Data files (2026-10-30)

CodeShare runs each step alone in an empty folder, so a file made by an earlier step is not there.
Each step supplies the `.txt` files its program reads, with the contents a desktop run of the
earlier steps leaves:

| Step | Supplied file | Contents |
| --- | --- | --- |
| 3, 4, 6, 9 | `fleet.txt` | `supporting-files/fleet.txt` (four vehicles) |
| 5 | `fares.txt` | `supporting-files/fares.txt` |
| 8 | `trip_log.txt` | Step 7's log: `TRC 456 left Bagong Silang` |
| 10 | `fleet_backup.txt` | Step 9's backup: the four vehicles plus `Tricycle,TRC 654,Mang Lito,Bagong Silang TODA` |

Steps 3a and 5a now tell students to open the supplied tab and leave it unchanged. Task
instructions, expected outputs and activity ids are unchanged. Checked by
`tests/week15-week21-modules.test.mjs` (each step alone, through the browser bridge) and live on
real CheerpJ: 9 of 10 samples match; Step 8 is blocked by CKB-089. The personal performance task's
append example (`FileWriter(name, true)`) is affected by CKB-089 too.
