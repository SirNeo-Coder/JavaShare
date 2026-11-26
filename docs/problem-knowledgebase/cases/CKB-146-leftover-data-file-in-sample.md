# CKB-146 — Week 15 Step 1 sample fails: a leftover fleet.txt from older work

- Status: resolved on `fix/sample-lock-leftovers`
- First recorded: 2026-11-25
- Last verified: 2026-11-25
- Area: sample-first module steps — `backend/src/module-activities.ts` (`sampleProject`),
  `backend/src/supabase-repository.ts` (`prepareSupabaseModuleActivity`), `app/moduleDeviceStore.ts`
  (`restoreModuleDraft`), `app/StudentModuleActivity.tsx`
- Search terms: Sample not verified, Exists before? true, Size in bytes: 162, Week 15 Step 1, three-part Week 15,
  fleet.txt already exists, every student fails the unchanged sample, Work saved before lesson changes

## Symptom

Every student in a Java class ran Week 15 (three-part) Step 1's unchanged sample online and got **Sample not
verified**: `Exists before? true` (expected `false`) and `Size in bytes: 162` (expected `0`). The editor stayed locked.

## Root cause

The students had done the older Week 15, so their saved module project held `fleet.txt` (162 bytes: Step 3's own data
file). The three-part file has new task ids, so Step 1 opened as a fresh step, and its files were built from the starter
files, **the saved project** and the step's sample. The old `fleet.txt` came along, and the sample found it.
With real Java the same folder gives `Exists before? true`, `Created now? false`, `Size in bytes: 162`; CheerpJ answers
`Created now? true` (CKB-123). The samples themselves are correct: each passes alone from its own files (CKB-088 test).

## Durable solution

While a step's sample is not verified, the editor is locked, so its draft holds no edits. Such a step is now always
rebuilt (server and device draft alike) by `sampleProject`: the project without any `.txt` file, then the step's own
files, so a step that supplies `fleet.txt` still gets its own copy. Java classes, backups and verified/completed steps
are unchanged. Students who already opened Step 1 are fixed on their next opening.

## Regression proof

- `tests/java-data-files.test.mjs`: `data files: a step whose sample is not verified opens without a leftover fleet.txt
  from older work (CKB-146)` — real routes on local Supabase, GET and POST opening.
- `tests/module-activities.test.mjs`: `sample project: a leftover .txt is dropped and the step's own data file kept (CKB-146)`.
- `tests/module-device-store.test.mjs`: `module drafts: a still-locked sample drops a leftover .txt saved on the device;
  a verified one keeps its files (CKB-146)`.
- Shown failing with the filter, the server rebuild and the device rule removed; passing restored.

## History

- 2026-11-25 — Teacher's screenshot: all students stuck on Week 15 Step 1. Diagnosed, fixed on `fix/sample-lock-leftovers`.
