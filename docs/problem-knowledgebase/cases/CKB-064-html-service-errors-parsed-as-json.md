# CKB-064 — Service errors appear as Unexpected token '<'

- Status: mitigated (response handling fixed locally; hosted CPU-limit failure confirmed separately in CKB-065; recovery unverified)
- First recorded: 2026-10-22
- Last verified: 2026-10-22
- Area: shared browser API client, Module worksheet, session expiry
- Search terms: Unexpected token, DOCTYPE, not valid JSON, 503, Service Unavailable, module worksheet, modules summary, live share, auth activity

## Symptom

The teacher's screenshots show **Module worksheet** displaying `Unexpected token '<'`
and `DOCTYPE ... is not valid JSON`. Several module/progress, live-share and sign-in
activity requests have status 503. Previously loaded module titles remain visible.
No student names, classroom ids, cookies or screenshot copies are stored in this case.

## Root cause

`app/apiClient.ts` called `response.json()` before checking the HTTP status. An HTML
503 response therefore threw a parsing error before callers could report service
failure. A simulated HTML 503 reproduced the exact parsing symptom. HTML 401 responses
also bypassed the existing session-expired event because parsing failed first.

The teacher later supplied a Worker invocation with status 503, `outcome: exceededCpu`,
`cpuTimeMs: 10` and `wallTimeMs: 404` for a module-project save. This establishes
CPU exhaustion for that save (CKB-065), independently of this parsing bug. It does
not establish the outcome of every failed screenshot request. CKB-050's missing-table
cause is unproven for this incident. An earlier health lookup used a hostname misread
from the screenshot; after correcting it from the log, the public health request
returned 200 with `ok: true` and `connected: true`. That is not proof that module
saves or all required tables are healthy.

## Durable solution

Keep one response handler in `app/apiClient.ts`. Unreadable error responses must
produce a clear CodeShare message containing their HTTP status, without showing
the raw HTML. Retain server-supplied JSON messages and `ApiError.moduleAccess`
details. Protected 401s must still signal sign-out; refused login/registration
must not. Malformed successful responses must remain failures. Preserve 204,
session events, cookies and request options. Do not automatically retry writes.

No dependency, route, server, schema, migration or hosted-setting change is needed
for this mitigation. Fixing the displayed error does not restore an unavailable service.

## Regression proof

- `tests/api-client.test.mjs`: nine named checks, including **API client: HTML 503
  reports the failed status without exposing the response body** and the protected
  HTML 401 check. Replacing the fix with main's original helper caused six failures
  (three checks still passed); restoring it passed all nine.
- `tests/api-client.browser.mjs`: three child checks and their parent pass against
  the local production build. HTML 503 in Modules preserves unsaved code; retry
  opens the real module and laptop Java completes its sample; a protected HTML 401
  returns the classroom to **Sign in**. Errors are simulated in the browser;
  sign-in, class/module reads, progress saves and Java use the real local app.
- Full suite: 311/311 passed, no skips. Offline launcher built successfully;
  lint passed with eight existing warnings and no errors.
- Commands, every named result and limits: [verification](../../verification/api-service-errors.md).
- Implementation branch: `codex/api-service-errors`, based on main `21766ba`.

## Recurrence triage

For the underlying outage, obtain **Network → failed request → Response**, its
status/response headers/request time, and the matching Cloudflare error log.
Remove keys, cookies and student information. Use that evidence to distinguish a
hosting error, limit or connectivity failure from an application/database error.
Do not infer missing tables, alter hosted settings, rerun migrations or retry
student writes from the parsing message alone. The supplied save invocation identifies CPU exhaustion (CKB-065). Collect matching
logs for any other failures; hosted save recovery remains unverified.

## History

- 2026-10-22 — Teacher reported screenshots, then explicitly approved shared response
  handling, regression proof, required checks and investigation of the 503 from actual
  evidence. Local mitigation verified; later Worker log confirms CPU exhaustion for a module
  save (CKB-065). No hosted changes made.
