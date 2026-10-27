# CKB-071 — Module editor stayed non-editable after a stalled save/run

- Status: resolved
- First recorded: 2026-10-27
- Last verified: 2026-10-27
- Area: shared API client / student module editor lock
- Search terms: can't edit code editor, editor non-editable, editor locked after running sample, student can't type after Run, stuck on Working, week 15 module, File Handling module editor frozen

## Symptom

A student reported they could no longer edit the code in the module editor
(self-paced "Java File Handling" module). The sample ran and produced output,
but the editor would not accept typing afterward — only a page reload
recovered it. No error was shown.

## Root cause

`app/StudentModuleActivity.tsx` sets `readOnly={busy}` on the editor, and
`busy` is only cleared in the `finally` block of `save()`/`run()` once their
`await` settles. Both call the shared `api()` helper
(`app/apiClient.ts`), which called plain `fetch()` with no timeout. On a
stalled connection (classroom Wi-Fi dropping mid-request), that `fetch()`
promise never settles, so `busy` never returns to `false` and the editor
stays locked indefinitely with no error surfaced.

The browser Java-execution path (`app/javaExecution.ts`) already had its own
120-second watchdog for this reason (see CKB-056); the plain save/check API
calls had no equivalent.

## Durable solution

`api()` now races its `fetch()` against an internal `AbortController` timer
(20s) so a stalled request always rejects with a clear "Request timed out"
error instead of hanging. A caller-supplied `signal` (e.g.
`app/sessionActivity.ts`) is still honored and still produces its own abort
error, not the timeout message. Because `api()` now always settles, the
`finally` blocks in `StudentModuleActivity.save()`/`run()` always run, so
`busy` returns to `false` and the editor reopens for editing, with the error
shown in the module's error banner.

## Regression proof

- Test file: `tests/api-client.test.mjs`
  - `api(): a stalled fetch rejects after the timeout instead of hanging forever`
  - `api(): a caller's own abort signal still rejects with the original error, not a timeout message`
  - `api(): a normal response still resolves and parses JSON as before`
- Command: `node --test tests/api-client.test.mjs`
- Shown failing before the fix: yes — stashing the `app/apiClient.ts` change
  and re-running made the first test fail (`fetch()` received no
  `options.signal`, so nothing could ever time it out); restoring the change
  made all three pass again.
- Full suite: `npm test` — 158/158 passing after the fix.
- Not independently reproduced in a live browser over an actually-stalled
  classroom connection; the server-side cause (a fetch with no timeout) and
  the guarded, restorable unit proof are what this case rests on.

## Recurrence triage

If a student reports the editor won't accept typing, first check whether
`readOnly` is `true` for a different reason before assuming this case:
group "Lock edit" by a team leader (`app/page.tsx`, `editingLocked`) is a
deliberate, working-as-designed lock on the regular (non-module) editor, not
a bug. This case is specifically the **module** editor (`StudentModuleActivity`)
getting stuck non-editable after a Run or Save that never resolves.

## History

- 2026-10-27 — Reported by a student in a Period 12 class during the
  self-paced "Java File Handling" module (week 15). Diagnosed as no match in
  the existing knowledge base; traced to a missing timeout in the shared
  `api()` helper. Fixed on `fix/module-editor-stuck-on-save-stall`.
