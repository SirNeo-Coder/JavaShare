# CKB-066 — Course modules show later weeks before the next unfinished module

- Status: resolved locally; hosted rollout unverified
- First recorded: 2026-10-22
- Last verified: 2026-10-22
- Area: classroom Course modules drawer / app/ModuleViewer.tsx
- Search terms: Week 21 above Week 12, module order, ascending week, finished module at bottom, next unfinished week

## Symptom

The teacher's screenshot showed Week 21, Week 20 and Week 19 above Week 12. The teacher
requested Week 12 through Week 21, with completed modules below all unfinished modules.

## Root cause

The drawer's comparator put the weekly pick first, then sorted by descending week. It
never consulted the saved progress summaries already loaded for each student's cards.
The ordinary teacher Curriculum page has its own sorting and is outside this change.

## Durable solution

`sortModuleCatalog` in `app/ModuleViewer.tsx` orders unfinished modules before modules
whose saved percentage is 100, then by increasing week within both groups. The drawer
uses that result without mutating the fetched list. Missing progress is unfinished;
equal weeks keep their existing relative order. Weekly/lock badges remain display flags.
No changes to saved data, prerequisites, Java execution or the meaning of completion.

## Regression proof

- `tests/module-catalog-order.test.mjs` checks ascending weeks despite active/locked flags,
  Week 12 moving to the bottom, incomplete/all-complete groups and stable/empty lists.
- `node tests/module-catalog-order.test.mjs`: restoring the original comparator caused
  three failures; restoring the fix passed all four checks.
- Full named results, browser evidence and commands: [verification](../../verification/module-catalog-order.md).
- Commit: `9d17fe1` on `codex/module-catalog-order`; [PR #40](https://github.com/SirNeo-Coder/JavaShare/pull/40).

## Recurrence triage

Check drawer order against each module's saved percentage and week. A locked module is
not necessarily completed. If progress itself is wrong, investigate its server response
instead of changing the sorting rule. Do not assume the weekly pick must appear first.

## History

- 2026-10-22 — Teacher approved the read-only diagnosis and explicit increasing-week,
  unfinished-first proposal. Implemented the display change with no migrations.
