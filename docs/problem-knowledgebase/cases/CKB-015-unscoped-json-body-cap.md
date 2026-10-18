# CKB-015 — The 2MB JSON body cap applied to every route, not just module upload

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: `backend/src/router.ts`
- Search terms: body limit too large for every route, module upload cap scoped wrong, request
  size limit applies everywhere, JSON_LIMIT global

## Symptom

Not a live incident — an open finding from `/code-review` on PR #6/#7, tracked in
`docs/handoffs/stage-two.md`, before either PR shipped to a student. The module-viewer work
raised the shared JSON body cap from 300KB to 2MB (`router.ts`'s `JSON_LIMIT`) so an uploaded
module with several lessons of embedded Java could fit. That cap was a single global constant
applied in `readBody` to every route in the app, not just the one module-upload route that
actually needed the larger size - every other JSON endpoint (chat, file saves, activity creation,
etc.) was also exposed to accepting bodies up to 2MB, an unintended, unreviewed widening of their
own limits.

## Root cause

`readBody` had no way to know which route it was serving when the raise was made - the simplest
change at the time was a single shared constant, and the route is in fact already matched (and
known) before the body is read in `router.ts`'s `handle()`, so scoping it per-route required no
new abstraction, just passing that already-known route through.

## Durable solution

`JSON_LIMIT` is back to the original 300KB default. A second constant, `MODULE_UPLOAD_JSON_LIMIT`
(2MB), and a pattern matching the one route that needs it
(`/^\/api\/classrooms\/[^/]+\/modules$/`), are checked in `handle()` - already matched against
`url.pathname` before `readBody` runs - to pick which limit to pass into `readBody`. Every other
route keeps the 300KB default.

## Regression proof

- Test file: `tests/api-router.test.mjs`, test "router: the larger JSON body cap is scoped to the
  module-upload route, not every route" - posts a body between 300KB and 2MB to both
  `POST /api/classrooms/:classroomId/modules` (must succeed) and an arbitrary other route (must
  413).
- Command: `node --test tests/api-router.test.mjs` (also covered by `npm test`). No local
  Supabase needed - pure router-level test.
- **Shown failing before the fix:** temporarily reverted `router.ts` to the single global 2MB
  constant; the test failed (`200 !== 413` - the arbitrary other route wrongly accepted the
  mid-size body). Restored the fix; the test passes.
- Commit: this change, branch `module-viewer`.

## Recurrence triage

If a future symptom is "a route accepts a request body larger than expected," check `router.ts`'s
`handle()` for which pattern selects the larger `MODULE_UPLOAD_JSON_LIMIT` before assuming a new
cap needs to be added elsewhere - a second route that legitimately needs a larger body should
extend that same per-route selection, not raise the shared default again.

## History

- 2026-10-18 — Found by `/code-review` on PR #6/#7, tracked as an open finding in
  `docs/handoffs/stage-two.md`. Fixed in this change: the global default restored to 300KB, a
  per-route limit added for the one route that needs 2MB, regression test shown failing against
  the old global-cap code, then passing with the fix.
