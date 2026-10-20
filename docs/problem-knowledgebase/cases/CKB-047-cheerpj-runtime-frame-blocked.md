# CKB-047 — Browser Java stalled during library startup

- Status: resolved
- First recorded: 2026-10-20
- Last verified: 2026-10-20
- Area: online Java / javaExecution.ts, java-runtime, Java bridge, module result route
- Search terms: online multi-file Java, CheerpJ, demo, startup timeout, source not found, packages

## Symptom

Runtime initialized, then Java library startup stalled until parent timeout. No compiler assets were requested.

## Root cause

CheerpJ uses its own nested c.html frame for runtime resource loading (verified in vendor cheerpOS.js ipfCreateIFrame). The first public runtime CSP used frame-src none.

## Durable solution

Permit frame-src https://cjrtnc.leaningtech.com in java-runtime/public/_headers. Keep all other destinations refused; the outer student frame stays on a separate public origin.

## Regression proof

- tests/browser-java-runtime.test.mjs: browser runtime: public asset policy permits CheerpJ's required nested runtime frame only (CKB-047)
- Command: `node --test tests/browser-java-*.test.mjs` (under `sg docker` for local database checks).
- Restored frame-src none: regression failed. Restored vendor-only frame permission: passed. Real integrated browser startup and Run code then returned Hello CodeShare.
- Branch `codex/online-multifile-java`; complete evidence in `docs/verification/online-multifile-java.md`.

## Recurrence triage

If runtime never initializes, check loader internet access. If it initializes but library stalls, verify the public response CSP and that it permits CheerpJ c.html.

## History

- 2026-10-20 — Online multi-file Java approved, including browser practice evidence and separate public address. Diagnosed/fixed before delivery. No hosted changes.
