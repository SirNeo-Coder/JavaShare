# CKB-005 — "Java execution enabled" shown while Java is in demo mode

- Status: investigating (recorded, not fixed; waiting for the teacher's decision)
- First recorded: 2026-10-17
- Last verified: 2026-10-17
- Area: workspace side panel, Group status; `app/page.tsx` (around line 2654)
- Search terms: Java execution enabled, Teacher computer, demo execution mode, Java not configured, online Java, Group status wrong, misleading label

## Symptom

On the Cloudflare preview (online), the teacher's workspace panel under **Group status** said "Java execution enabled", with "Teacher computer" underneath. Meanwhile **Run code** printed "Java execution is not configured ... [Demo execution mode]". Found in the teacher's screenshot during the Cloudflare preview test.

## Root cause

The label is fixed text. It shows "Java execution enabled / Teacher computer" for every Java project, whether or not Java can actually run. `main` has the same text, so this predates stage one; the c2 change didn't cause it. It is only wrong online (or anywhere Java falls back to demo mode).

## Durable solution

Not fixed yet. Options: show the real state from the server's run result or health, or replace the label when the online Java runner (CheerpJ, decision 9 in `docs/handoffs/stage-one.md`) is built.

## Regression proof

- None yet (not fixed).

## Recurrence triage

If **Run code** actually runs Java and prints output, the label is correct. This case is only the label disagreeing with demo mode.

## History

- 2026-10-17 — Seen while testing the `cloudflare-c2` preview; recorded, not changed.
