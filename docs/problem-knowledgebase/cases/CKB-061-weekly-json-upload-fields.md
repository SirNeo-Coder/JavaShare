# CKB-061 — Later weekly JSON uploads lack required fields or contain text assets in Java steps

- Status: resolved for upload shape; runtime limitations remain explicitly open
- First recorded: 2026-10-22
- Last verified: 2026-10-22
- Area: Week 15–21 curriculum JSON, printed appendices and lesson-plan notes
- Search terms: weekly JSON upload rejected, afterStep missing, performanceTask starterFiles missing, text backup in Java files, later weeks new format

## Symptom

The teacher supplied Weeks 15–21 and requested the new sample-first alteration format while
preserving the existing files. Direct validation rejected six original uploads; Week 18 already
validated. None of these originals had explicit alteration identities or sampleFirst.

## Root cause

Weeks 15/16/20/21 omit required exitSlip.afterStep values on reading or presentation lessons.
Week 17 lacks performanceTask.starterFiles; Weeks 20/21 lack both required file arrays.
Week 19 places a .txt backup in a Java step; the existing validator permits Java paths only.
Week 15 also contains text data in step files, exposed after its missing field is filled.
The real project-preparation route also rejects text files in module/personal starter arrays,
even though the upload schema accepts them there. Preserve those files as companion assets.
These are source-format mismatches, not a reason to weaken the validator or rename existing ids.

Separate runtime limits are unchanged: classroom file APIs are blocked; original thread samples
have timing/order assumptions; visible Swing and browser Java compatibility need independent
verification. CKB-052 already identified those later curriculum concerns.

## Durable solution

Add required fields to copies under docs/modules/week15 through week21. Reading/presentation
lessons use their existing lesson id as a descriptive afterStep anchor; no code step or paper gate
is invented. Preserve text assets byte-for-byte in supporting-files, outside Java-only project arrays.
Add separate task ids, sample-first settings, predecessor links, complete supporting sample
sources and tiny Main forwarders for named demos. Preserve every original lesson value and
add matching PDF/Word appendices. Week 20 stays written work. No application or schema change.

## Regression proof

- tests/week15-week21-modules.test.mjs: Week 15: upload accepts additions and every original lesson value survives
- The corresponding named upload/preservation check exists for each Week 16–21.
- Weeks 15–21: old samples and headless messages cannot pass new tasks or bypass their sample gate
- Week 15: classroom file access stays blocked while desktop exercises remain explicitly separate
- Real Java checks execute every sample and alteration; the local browser uploads all seven files
  and exercises sample verification, completion and saved edits.
- Deliberately removed the new Week 15 Friday field: its upload regression failed. Restored the
  exact JSON bytes: the same check passed. Reconstructing original content reproduces all six
  old validation failures and retains the already-valid Week 18 original.
- Commands and every named result: docs/verification/week15-week21-step-additions.md.
- Implementation: `614ae27`; review: [draft PR #36](https://github.com/SirNeo-Coder/JavaShare/pull/36).

## Recurrence triage

Run the existing upload schema first. Do not rewrite sample code, loosen Java path validation,
add fake executable work to a proposal week, or present headless component checks as visible
GUI verification. Upload acceptance is separate from file persistence, thread timing and GUI
runtime readiness. Revised copies and limitations: docs/modules/week15-week21.md.

## History

- 2026-10-22 — Teacher approved additive changes for Weeks 15–21, retaining existing lessons
  and samples and appending only task material. Original supplied files remain unchanged.

- 2026-10-22 — Preserved this case during PR #36 conflict repair on main c770731; all 276 integrated tests pass. Distinct case ids reserved across the three open PRs.
