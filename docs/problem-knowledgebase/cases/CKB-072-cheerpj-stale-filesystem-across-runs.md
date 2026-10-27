# CKB-072 — CheerpJ's filesystem survived across separate Java runs

- Status: mitigated locally
- First recorded: 2026-10-27
- Last verified: 2026-10-27
- Area: online Java / CheerpJ browser runtime (`java-runtime/public/runner.js`)
- Search terms: sample not verified, Folder made false, mkdir returns false on second run, File Handling module fails online, records folder already exists, Week 15 Activity Two, java.io.File runtime behaves differently online than offline

## Symptom

A teacher live-tested Week 15 Activity Two ("Folders, listing, and deleting") online.
The unedited supplied sample failed verification. The Console's actual output showed
`Folder made? false` (expected `true`) and `Delete the folder? true` (expected `false`),
while every other line matched exactly.

## Root cause

The sample's `Main.java` creates a `records/` folder and leaves `trips.txt` inside it by
design. Verified independently with a real JVM (`javac`/`java` against the exact JSON
sample in `docs/modules/week15/Java2_Week_15.codeshare.json`): the code is correct and
matches `expectedOutput` exactly.

CheerpJ's `java.io.File` runtime is not actually isolated per run. `app/javaExecution.ts`
creates a brand-new iframe for every Run click, which looks like a fresh environment, but
CheerpJ's filesystem is backed by one IndexedDB database (`cjFS_/files/`) scoped to the
runner's origin, not to the iframe instance. Confirmed by loading the real CheerpJ 4.3
runtime directly (same CDN `runner.js` already uses) in an isolated test page:
a file created in one run still existed after a full page reload. A file created by any
earlier attempt — by any student, since this storage is per-origin, not per-session —
is still there on the next "fresh" run, so `folder.mkdir()` on an already-existing
`records/` correctly returns `false` per real Java semantics; the sample just never gets
a truly empty starting point online.

Ruled out: redirecting `System.setProperty("user.dir", perRunDirectory)` in
`vendor/java/CodeShareJava.java` before invoking the student's `main()`. Tested directly
against live CheerpJ: `getAbsolutePath()` reflects the new directory string, but
`File.exists()`/`createNewFile()` keep hitting the same shared storage regardless of the
path prefix — confirmed with three different directory values, including a cryptographically
unique one, all reporting a pre-existing marker file. This is a CheerpJ-side limitation,
not something `CodeShareJava.java` can route around.

The separate `Delete the folder? true` (should be `false`, since `trips.txt` is still
inside) looks like an independent CheerpJ semantic gap — `File.delete()` not refusing a
non-empty directory — but it was not isolated in direct testing; it may simply stop
appearing once runs stop accumulating state, since the reported run was not a true first
run.

## Durable solution

`java-runtime/public/runner.js` now deletes the `cjFS_/files/` IndexedDB database before
calling `cheerpjInit()` on every run, with a 2-second fallback timer so a blocked/stuck
delete can never hang a run. Verified live: after clearing that database, a fresh probe
run correctly reports no pre-existing file. `vendor/java/CodeShareJava.java` is untouched —
the fix lives entirely in the one place CodeShare controls before Java starts.

## Regression proof

- tests/browser-java-runtime.test.mjs:
  - `browser runtime: clears CheerpJ's persistent filesystem before every run, including a stuck delete (CKB-072)`
  - `browser runtime: a delete that never fires any event cannot hang the run past its own fallback (CKB-072)`
- Command: `node --test tests/browser-java-runtime.test.mjs`
- Shown failing before the fix: yes — reverting just `java-runtime/public/runner.js` made
  both new tests fail (`dbDeletes` empty; the "hang" case's run completed before the 2s
  timeout should have let it, meaning nothing was ever gating it). Restoring the change
  made all 10 tests in that file pass again.
- Full suite: `npm test` — 345/345 passing after the fix.
- Live verification: reproduced the persistence directly against the real CheerpJ 4.3
  runtime (loaded from `cjrtnc.leaningtech.com`, same as production) in an isolated probe
  page — confirmed the bug, confirmed the `user.dir` approach does not fix it, confirmed
  clearing `cjFS_/files/` does.
- Not yet re-verified against the actual hosted CodeShare Week 15 module with a live Run
  click — the unit tests exercise `runner.js`'s logic directly via a scripted mock
  (`node:vm`), not a real browser loading the real CheerpJ CDN end to end. Ask the teacher
  to re-run Week 15 Activity Two online after this ships.

## Recurrence triage

If a module step's *unedited, supplied* sample fails verification online but passes with
a real JVM (check with `javac`/`java` against the module JSON directly), suspect CheerpJ
filesystem/runtime behavior before suspecting the module content or CodeShare's output
comparison (`matchesActivityOutput` in `backend/src/module-activities.ts`, which already
normalizes line endings and one trailing newline). This case is specific to steps that use
real `java.io.File` operations; steps with no file I/O are unaffected. The offline/laptop
runner (`backend/src/java-runner.ts`) already gets a fresh OS temp directory per run via
`mkdtemp`/`rm` and was never affected.

## History

- 2026-10-27 — Teacher reported Week 15 Activity Two's unedited sample failing online
  verification. Diagnosed via a direct, live CheerpJ probe (not just code reading) after
  confirming the sample is correct against a real JVM. Fixed by clearing CheerpJ's
  IndexedDB filesystem before each run in `runner.js`. Branch
  `fix/cheerpj-stale-filesystem`.
