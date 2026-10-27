# Week 15 step additions

File exercises retain real disk access and the original file setup. CodeShare classroom file access/persistence is not supported by this update. Verify these exercises in a separate desktop Java folder; do not treat this JSON as classroom-ready.

The JSON preserves all original lesson text, code, sample outputs, ids, liplets and rubrics,
with one later exception: Step 2's sample Java no longer deletes the (non-empty) `records`
folder — see "Running these steps" below. It adds 10 separately identified alteration tasks, sample-first verification,
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
