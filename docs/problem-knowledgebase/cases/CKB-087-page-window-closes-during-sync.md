# CKB-087 — Page window could be closed while a completed task was still syncing

- Status: resolved
- First recorded: 2026-10-30
- Last verified: 2026-10-30
- Area: `app/WebStepRun.tsx` (`useWebPageRun`), `app/StudentModuleActivity.tsx`, `app/ModuleViewer.tsx`
- Search terms: Close enabled too early, Esc closes page window during sync, Syncing your completed task, click beside window closes it, page window closes before saved, run not checked yet

## Symptom

Found in code review of PR #76. After **▶ Run code** on a web task, the **YOUR PAGE** window's **Close**,
Esc and a click beside it came on as soon as the page reported its text, while the screen was still
checking the output, saving on the device and showing **Syncing your completed task…**. The agreed rule is
that the window closes only once the run is checked.

## Root cause

`useWebPageRun` kept its own `running` flag and switched it off the moment the page reported back. The
student screen's check (`checkModuleRun`), device save and `/progress/complete` request run after that, so
the guard lifted too early. The browser test only checked Close during the page run itself.

## Durable solution

- `useWebPageRun(busy)` takes the screen's own run flag. Close, Esc and a click beside the window stay off
  while `busy` is true, and Close gets focus only when it ends. The hook no longer has its own flag.
- Both callers (`StudentModuleActivity`, `ModuleViewer` teacher preview) set `busy` before the run starts
  and clear it in `finally`, so the window unlocks after the whole run, on success or failure.

## Regression proof

- `tests/web-sample-first.browser.mjs`: "a page step opens its sample read-only; the unchanged run verifies
  it with its page check; the task completes it" — holds `/progress/complete`, checks Close is disabled and
  Esc and a click beside the window leave it open, then releases it.
- Command: `node --test --test-reporter=spec tests/web-sample-first.browser.mjs` against the offline-settings
  server on 3042.
- Shown failing with the old guard ("Close waits for the completion to sync", `false !== true`); passed
  again once restored.
- Commit: `cf54e6f` on branch `fix/page-window-close-during-sync` ([PR #77](https://github.com/SirNeo-Coder/JavaShare/pull/77)).

## Recurrence triage

- If Close stays off for good after a run, look for a caller path that sets `busy` and never clears it.
- Esc closes the window only when CodeShare has the keyboard (CKB-086); that is separate.

## History

- 2026-10-30 — Review finding on PR #76 checked against the code, teacher approved the fix.
