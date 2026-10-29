# CKB-082 — Java suggestions browser test waits for a module save the server never gets

- Status: resolved
- First recorded: 2026-10-29
- Last verified: 2026-10-29
- Area: `tests/java-suggestions.browser.mjs` (test only; no app change)
- Search terms: java-suggestions browser test fails, module and personal projects both accept suggestions without submitting, waitForResponse Timeout 7000ms, PUT progress never seen, module Save work no server save, projectFiles empty, module draft preserved fails, Saved on this device

## Symptom

On the PR #70 branch (`feature/run-box-save-dialogs`, `47e0339`), against a local offline
production server on port 3032, the subtest "student: module and personal projects both accept
suggestions without submitting" failed with `page.waitForResponse: Timeout 7000ms`. It was waiting
for a `PUT …/progress/…` after the student clicked **Save work** in the Module project. The other
9 subtests passed.

## Root cause

The app was right; the test was stale. Since completion-only module saving (agreed 2026-10-22,
commit `869333e`), **Save work** in the Module project writes only to this device
(`saveDeviceDraft` in `app/StudentModuleActivity.tsx`, IndexedDB `codeshare-module-device-v1`),
online and offline, and shows "Saved on this device. Your code is sent to CodeShare when you
complete the task." The suggestions test was written a day earlier (`5a8a3bf`) and still expected
the module code on the server. Its later "module draft preserved" checks after the personal save
expected the same server copy and would have failed next.

## Durable solution

Test-only changes in `tests/java-suggestions.browser.mjs`:

- Module project: click **Save work** without waiting for a request; check the **Work saved**
  box says "Saved on this device" and click **OK** (kept from PR #70); read the device draft for
  step `java-2-w99-test-d1-s1` (same reader as `tests/module-draft-recovery.browser.mjs`); check
  the server progress does **not** hold the unfinished code and `stepStates` is still `{}`.
- Personal project: unchanged server `PUT` wait and checks; "module draft preserved" now reads
  the device draft instead of the server.

## Regression proof

- `tests/java-suggestions.browser.mjs`, all 10 subtests plus the parent, offline production server
  on 3032 (local Supabase).
- Command: `CODESHARE_BROWSER_URL=http://localhost:3032 CODESHARE_PLAYWRIGHT_MODULE=… PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=… node --test --test-reporter=spec tests/java-suggestions.browser.mjs`
- Shown failing before: the unchanged test failed with the reported timeout (9 pass, 2 fail).
- Break and restore: with the test temporarily sending the module code to the server
  (`PUT …/progress/project`, as the old Save work did), the subtest failed with
  "unfinished module code stays off the server"; restored, 11/11 pass.
- Not done: an app-side break (rebuilt server with module Save work skipping the device write).
  The device-draft check would then read nothing and fail, but this was not run.
- Commit: see branch `claude/java-suggestions-device-save`.

## Recurrence triage

If a browser test times out waiting for a `/progress/` request after a Module project **Save
work**, check the **Work saved** box text first. "Saved on this device" means the test expects the
old server save; read the device draft instead. A missing box or "Could not save" is a different
problem (see CKB-080 save/submit feedback).

## History

- 2026-10-29 — Teacher reported the failure and approved the test-only refresh, built on PR #70
  for its **Work saved** box. Offline 11/11.
