# CKB-091 — A `src/` data file lands in different folders online and on the laptop

- Status: investigating, not fixed (latent: no module or project uses `src/*.txt` yet)
- First recorded: 2026-11-05
- Last verified: 2026-11-05 (read in code, not run)
- Area: Java data files (`sourcePath` in `backend/src/module-activities.ts`, used by `app/javaExecution.ts`; `vendor/java/CodeShareJava.java`; `backend/src/java-runner.ts`)
- Search terms: src/fleet.txt not found, data file in src folder, Cannot read fleet.txt only online, data file path differs online and offline, src/ text file

## Symptom

Not seen by a student. Raised by CodeRabbit on PR #78 (outside-diff comment on
`app/javaExecution.ts`), then checked against the code.

## Root cause

CKB-088 let Java projects carry `.txt` data files. The two runners place a `src/` data file
differently:

- **Online:** `sourcePath` strips `src/` only from `.java` paths, so `src/fleet.txt` is sent as is and
  the bridge writes it to `src/fleet.txt`. `new FileReader("fleet.txt")` would not find it.
- **Laptop:** `executeLocallyResult` strips `src/` from every path, so it is written as `fleet.txt`.

The same step could therefore pass on one runner and fail on the other. Today nothing triggers it:
no module JSON contains a `src/*.txt` file, and the laptop runner blocks `java.io`.

## Durable solution

None yet (teacher to decide). Options: make the laptop runner keep `src/` for `.txt` files (matches
online and a desktop project, where `src/fleet.txt` is not in the working folder), or strip `src/`
from `.txt` paths online as well (must not let `src/fleet.txt` and `fleet.txt` collide).

## Regression proof

- None yet.

## Recurrence triage

If a data file works offline but not online (or the reverse), check whether its path starts with
`src/`. A missing file in every mode is CKB-088 instead.

## History

- 2026-11-05 — CodeRabbit PR #78 finding verified while checking reviews; recorded on PR #81's
  review request. Not fixed.
