# CKB-042 — Student opens a redundant module landing page

- Status: resolved (teacher-approved workflow transition)
- First recorded: 2026-10-20
- Last verified: 2026-10-20
- Area: student entry / app/page.tsx, app/Landing.tsx, app/studentClassroomEntry.ts
- Search terms: student landing, automatically open classroom, redundant modules page, last class, Classes button, shared browser

## Symptom

Students had to open a class home and then enter the classroom, although the classroom already contains their module browser. The teacher requested direct classroom entry and approved it as a workflow change, with orphan cleanup.

## Root cause

The previous class-list workflow deliberately initialized every session without an entered classroom. Student class home retained its own module list, viewer selection, progress helpers and styles after modules moved into the classroom. CKB-016 (class scoping) and CKB-023 (session-reset parity) are related protections, not the cause of this request.

## Durable solution

`studentClassroomEntry.ts` chooses a sole membership or a valid remembered membership. Browser preferences are per account and never authorize access. `page.tsx` then requests the existing explicitly scoped workspace; successful entry remembers the class. No class keeps the join screen, required password reset comes first, and an explicit **Classes** action suppresses automatic re-entry. Logout and session-expiry clear the chooser flag and active team. Failed entry offers **Retry** and **Classes**.

`Landing.tsx` directly enters the selected student class. The removed student module screen, its selection state, types, status/progress helpers and six CSS selectors had no remaining caller and were removed. The existing summary API, worksheet, teacher dashboard and shared progress styles still have callers and remain.

## Regression proof

- `tests/student-classroom-entry.test.mjs`, eight exact test names in [verification](../../verification/student-classroom-entry.md): single/multiple/absent memberships, account separation, denied storage, reset/teacher/chooser guards, removed landing screen and retained teacher chooser.
- `node --test tests/student-classroom-entry.test.mjs`: 8 pass. Restoring the previous `Landing.tsx` made **student chooser: a former class-home selection cannot resurrect the removed module landing page** fail (7 pass, 1 fail); restoring the fix returned 8 pass.
- `npm test`: 88 pass, 0 fail, 0 skipped. Offline build and browser checks include actual sign-in, refresh, class switching, first join, removed membership, failure recovery and teacher return path.
- Commit: `60f89b4`; [PR #18](https://github.com/SirNeo-Coder/JavaShare/pull/18).

## Recurrence triage

If the chooser appears, check current membership count and the remembered choice for this account. Intentional **Classes** navigation must stay there. A removed class must never be accepted just because it was remembered. If the wrong class's files load, investigate CKB-016 and explicit bootstrap scoping. If another account's current classroom survives session expiry, inspect CKB-023 reset parity.

## History

- 2026-10-20 — Teacher approved automatic student classroom entry, current-class chooser exceptions and removal of code orphaned by the transition. Implemented and verified locally; no hosted service or migration changed.
