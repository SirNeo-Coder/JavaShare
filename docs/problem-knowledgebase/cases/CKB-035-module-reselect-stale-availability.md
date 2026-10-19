# CKB-035 — Reselecting the same worksheet keeps old availability

- Status: resolved
- First recorded: 2026-10-19
- Last verified: 2026-10-19
- Area: module selection / `app/ModuleWorkspace.tsx`
- Search terms: reopen module still closed, availability stale, All modules same card, teacher opened lesson student still sees Not open yet

## Symptom

Caught before release. Open a closed lesson in the isolated test module. Teacher opens it via the
existing route. Return to All modules and choose the same card: Not open yet remained visible.

## Root cause

The separate worksheet correctly stayed mounted when its ear closed, but its React key was only
the module id. Selecting the same card again did not remount or fetch its latest content, unlike
returning to and selecting from the old viewer's catalog.

## Durable solution

Track each explicit catalog selection as a new visit. Key the worksheet content by that visit,
so choosing even the same card fetches current content/progress/availability. Merely closing or
hover-opening the ear keeps the same visit and draft. Returning to the catalog and selecting is
not covered by the in-memory draft promise (same boundary as CKB-028).

## Regression proof

- Real browser before: after the teacher opened the test lesson, All modules → same card still
  displayed Not open yet.
- After: load the final build, open the test lesson, close it through the existing teacher route,
  All modules → same card; it fetches again and shows Not open yet with no exposed code.
- Browser route/UI regression, not an automated React-effects test. The complete 68-test suite
  and rendering checks also pass. Full evidence: `docs/verification/printed-module-worksheet.md`.
- Commit: `9b538d5` on `codex/printed-module-worksheet`; [PR #16](https://github.com/SirNeo-Coder/JavaShare/pull/16).

## Recurrence triage

Ear close/reopen intentionally retains a visit. Use All modules → card to reload the module after
teacher availability changes. Server write guards continue to enforce closed lessons immediately.

## History

- 2026-10-19 — Compatibility issue caught and fixed while testing the separate worksheet browser.
