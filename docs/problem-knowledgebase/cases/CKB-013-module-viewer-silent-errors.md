# CKB-013 — Module viewer swallowed failed requests with no feedback

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: `app/ModuleViewer.tsx`
- Search terms: exit slip checkbox does nothing, delete module silently fails, submit performance
  task does nothing, no error shown, request fails with no feedback, module viewer silent failure

## Symptom

Not a live incident — an open finding from `/code-review` on PR #6/#7, tracked in
`docs/handoffs/stage-two.md`, before either PR shipped to a student. Three handlers in
`app/ModuleViewer.tsx` called `api(...)` with no try/catch at all: `markExitSlip` (the exit-slip
checkbox), `removeModule` (the teacher's Delete button), and `PerformanceTaskSlot.submit` (Submit
this version). A failed request (network blip, expired session, server error) would throw with
nothing catching it - the checkbox would just silently stay unchecked, Delete would silently do
nothing, Submit would silently not submit, and the student or teacher would have no idea why.

## Root cause

These three handlers were written assuming the request always succeeds; no error path was ever
added for them, unlike other handlers in the same file (`upload`, `openModule`, `refreshList`)
which already catch and surface their own errors.

## Durable solution

- `markExitSlip` (in `ModuleContent`) now has its own try/catch, surfacing a failure through a new
  `actionError` state rendered at the top of the module content - separate from the full-page
  `error` state, so a transient failure doesn't blank the whole module.
- `removeModule` (in `ModuleViewer`) now has a try/catch, surfacing a failure through the
  component's existing `error` state (same one `upload`/`openModule` already use).
- `PerformanceTaskSlot.submit` now has a try/catch, surfacing a failure through the slot's
  existing `output` state (same place a failed `Run` already shows its error).

## Regression proof

- No frontend test harness exists in this repo (`npm test` covers only backend `.mjs` files via
  `node --test`); verified live in a real browser instead, the same method used for CKB-008.
- With `window.fetch` patched to reject only requests to `/progress/step` (and separately only
  `/progress/performance-task`), against a live local-Supabase-backed dev server
  (`npm run dev`): clicking the exit-slip checkbox showed "Simulated network failure" at the top
  of the module instead of doing nothing; clicking "Submit this version" showed "Simulated submit
  failure" in that slot's output instead of doing nothing. Restored `fetch` and repeated the
  submission for real - it showed "SUBMITTED", and a real Delete on the teacher side correctly
  removed the module from the list, confirming the fix didn't break the working path.
- Commit: this change, branch `module-viewer`.

## Recurrence triage

If a future symptom is "clicking X does nothing, no error" anywhere in `ModuleViewer.tsx`, check
whether the handler's `api(...)` call is inside a try/catch before assuming the bug is new - grep
this file for `api(` calls with no enclosing `try`.

## History

- 2026-10-18 — Found by `/code-review` on PR #6/#7, tracked as an open finding in
  `docs/handoffs/stage-two.md`. Fixed in this change: try/catch added to all three handlers,
  verified live by simulating each failure and confirming the error now surfaces, then confirming
  the real (non-simulated) path still works.
