# Week 15 step additions

File exercises retain real disk access and the original file setup. CodeShare classroom file access/persistence is not supported by this update. Verify these exercises in a separate desktop Java folder; do not treat this JSON as classroom-ready.

The JSON preserves all original lesson text, code, sample outputs, ids, liplets and rubrics.
It adds 10 separately identified alteration tasks, sample-first verification,
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

Steps that delete a non-empty folder (for example Activity Two, "Folders, listing, and
deleting") can fail online verification even with the unedited sample, because CheerpJ's
`File.delete()` incorrectly reports success on a non-empty directory instead of refusing
it (CKB-073, no fix available from CodeShare). The teacher has directed running this
module's file-handling steps on the classroom laptop's offline Java (`npm run
classroom:offline`) for now, where a real JVM gives the correct result. A separate,
already-fixed issue (CKB-072) made `mkdir()` return `false` on a second online run by
reusing a prior run's leftover files; that part is resolved.
