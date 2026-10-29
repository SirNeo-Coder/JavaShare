# CKB-080 — Save work, Submit this version and Run code seemed to do nothing

- Status: resolved locally (rule checks and real-browser checks; see Regression proof)
- First recorded: 2026-10-29
- Last verified: 2026-10-29
- Area: `app/StudentModuleActivity.tsx` (module and personal project footer), `app/page.tsx` regular
  Code editor Run code, `app/useJavaConsole.ts`, `app/globals.css`
- Search terms: Submit this version does nothing, Save work does nothing, no confirmation, saved or not,
  submitted or not, compiling modal, wait for Java, cancel compile, click outside to cancel

## Symptom

The teacher's screenshot of the Personal project footer (**Submit this version**, **Run code**,
**Save work**): clicking the buttons did not seem to do anything. The teacher asked for a box
confirming the save or submission, and a floating box while code compiles and runs. Clicking outside
should cancel it if a compile can be cancelled; otherwise it should stay until the code has run.

## Root cause

- **Submit this version** is switched off until the current files run successfully, but the yellow
  `.classroom-workspace .actionbar .run-button:first-child` style had no disabled look, so it seemed
  clickable and silently ignored clicks.
- **Save work** returns straight away when nothing changed (blue = already saved), with no message.
  When it did save, the only sign was a small status line changing.
- Run feedback was the small Console strip from CKB-055, easy to miss.

## Durable solution

- `NoticeBox` confirms Save work (**Work saved** / **Already saved** / **Could not save**) and
  Submit this version (**Version submitted** / **Could not submit**). It closes with OK, Esc or a click outside.
- A disabled first footer button (Submit this version) is greyed out (`opacity:.5`).
- `RunBox` floats over the screen during a run. Cancelling depends on where Java runs:
  - Online Java running in this browser (personal project and regular Code editor) can be cancelled.
    Clicking outside or pressing Esc calls `useJavaConsole().stop()`, which gives **Execution stopped.**
  - Online module checks, offline laptop `javac` and web steps cannot be cancelled. The box stays until the result.
  - `useJavaConsole` exposes `running` (set at the runner's "Running Java" stage). The box closes then,
    so Program input and Stop remain usable.
- Teacher decisions (2026-10-29): the regular Code editor gets the run box too; module project checks
  stay uncancellable for now.

## Regression proof

- `tests/run-box.test.mjs`: these render and source checks cover:
  - the box is hidden when idle;
  - the wording for wait and for cancel;
  - the notice icons and text;
  - both editors render the run box.
- `tests/java-run-progress.browser.mjs`: real production apps on local Supabase, laptop `javac`
  offline and real CheerpJ online. They check:
  - the module run box ignores clicks outside;
  - the offline personal and offline regular boxes stay until the result;
  - online, clicking outside (personal) and Esc (regular) stop the run;
  - the box is gone while Java waits for input;
  - the Save work notice appears.
- `tests/personal-performance.browser.mjs`: Work saved / Already saved / Version submitted, and that
  the switched-off Submit is greyed out. Other browser tests now close the notice before their next click.
- Results (2026-10-29, local production builds on local Supabase):
  - `java-run-progress.browser.mjs`: 9/9 offline, 10/10 online.
  - `personal-performance.browser.mjs`: 6/6 offline, 7/7 online.
  - `teacher-live-help.browser.mjs`: 7/7. `personal-copy-module-code.browser.mjs`: 2/2.
  - `module-draft-recovery.browser.mjs`: 7/7. `web-module-steps.browser.mjs`: 11 pass, 1 skipped (no R2 storage).
  - `npm test`: 406/406.
- Mutation proof:
  - Rule check: with the cancel wording forced off, 1 of 5 fails; restored, 5/5 pass.
  - Real app: with the Work saved box and the greyed-out Submit removed and rebuilt,
    `personal-performance` offline fails 4 (2 pass); restored and rebuilt, 6/6 pass.
- Not from this change: `java-suggestions.browser.mjs` "module and personal projects both accept
  suggestions" still waits for a server save of the module project, which module Save work no
  longer makes (completion-only saving, 2026-10-22). It fails before the line this change adds.
- Found while testing: the offline personal check in `java-run-progress.browser.mjs` waited on
  `/api/execute`, but offline personal runs use `/progress/personal-run`. The test was corrected.

## Recurrence triage

- If the box never closes during an online interactive run, check that the runner still sends the
  "Running Java" stage.
- If clicking outside does nothing online, check that `useJavaConsole().active` is set. Only
  in-browser runs can be stopped.
