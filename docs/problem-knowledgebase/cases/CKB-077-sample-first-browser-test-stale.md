# CKB-077 — Sample-first browser test stuck before its first step

- Status: resolved
- First recorded: 2026-10-28
- Last verified: 2026-10-28
- Area: `tests/module-sample-first.browser.mjs` (test only; no app change)
- Search terms: module-sample-first browser test fails, worksheet-paper not visible, openModule timeout 12000ms, waitForResponse progress/activity timeout, Step 1 button not found after reload, Work in code editor not found, Complete the previous part first, sample state undefined online

## Symptom

On main `aadda3a`, `tests/module-sample-first.browser.mjs` failed in offline mode before any
test step ran: after choosing the Week 14 module card, waiting for
`#classroom-worksheet .worksheet-paper:not([hidden])` timed out after 12 s. Online mode failed
the same way. `tests/module-resume.browser.mjs` passed on the same server.

## Root cause

The app was right; the test had gone stale in five places, each hidden behind the previous one:

1. Week 14 now names `java-2-w13` as its `previousModuleId` (added in `ad7efe6`), and rolling
   prerequisites are enforced. The test uploads only Week 14, so the student sees "Your teacher
   needs to upload prerequisite module java-2-w13 before you can start Week 14." and no worksheet
   opens. `module-resume` uses Week 12, which has no prerequisite.
2. Completion-only saving opens a step with `GET …/progress/activity?stepId=…`; the test waited
   for a `POST …/progress/activity`.
3. After a reload the worksheet resumes at the next unfinished part (CKB-058), Tuesday Step 3, so
   the Monday "Step 1" tab is not on screen until the Monday part is chosen.
4. The test marks Steps 1–7 passed by writing the database directly. The browser keeps its
   five-minute lesson copy (`app/moduleDeviceStore.ts`), in which Wednesday/Thursday are still
   locked, because only app-accepted completions refresh that copy.
5. Online, "Sample verified" stays on the student's device (agreed completion-only rule); only the
   laptop runner path records the sample state on the server. The test expected it on the server
   in both modes.

## Durable solution

Test-only changes in `tests/module-sample-first.browser.mjs`: remove the Week 13 link from the
uploaded copy (prerequisites keep their own `tests/module-prerequisites.browser.mjs`); wait for
the `GET` step-opening request; choose the "Beyond Arrays" part before reopening Step 1; delete
the device's cached lesson record after the direct database write; expect the server sample
state as `"pass"` offline and absent online.

## Regression proof

- `tests/module-sample-first.browser.mjs`, all four steps, offline and online (local production
  servers 3022/3020, runner 3021, local Supabase).
- Command: `SAMPLE_BROWSER_MODE=offline|online CODESHARE_PLAYWRIGHT_MODULE=… PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=… node --test --test-reporter=spec tests/module-sample-first.browser.mjs`
- Shown failing before: the unchanged test failed in both modes with the reported timeout; each
  later stale point was shown failing in turn as the earlier one was fixed.
- No deliberate app break was possible: no app code changed. The online `undefined` sample check
  would catch the app starting to save unfinished sample checks to the server.
- Commit: see branch `claude/sample-first-test-refresh`.

## Recurrence triage

If a module browser test stops before its first step, check what the student sees first (an
access/prerequisite notice, the drawer, the worksheet). A prerequisite notice means the uploaded
fixture needs its predecessors or its link removed. If parts stay "Complete the previous part
first" after a direct database write, the device lesson copy is stale, not the progress rule.

## History

- 2026-10-28 — Teacher reported the offline failure and approved the test-only refresh; both modes
  now pass 5/5 (four steps plus the parent).
