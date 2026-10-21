# CKB-059 — Fast typing after a suggestion starts at the end of the file

- Status: resolved locally; hosted rollout pending
- First recorded: 2026-10-21
- Last verified: 2026-10-21
- Area: app/CodeEditor.tsx; Java suggestions and indentation
- Search terms: code suggestion, autocomplete, caret jumps, typing at end of file, print parentheses, fast typing, Tab selection

## Symptom

Found while implementing teacher-approved Java suggestions. In the production classroom,
clicking System.out.println(…) and immediately typing a string put its first characters at
the end of the file, then the remaining characters inside the parentheses. Both teacher and
student browser checks failed. Isolated rule tests passed because they cannot exercise browser timing.

## Root cause

Changing a controlled textarea's value could move its caret to the end. The first insertion
implementation copied the existing Tab handler's requestAnimationFrame selection restoration.
That left a frame during which keyboard input used the wrong position; the delayed callback
could also move the caret during typing. Rapid Tab/Shift+Tab had the same timing dependency.

## Durable solution

`app/CodeEditor.tsx` records the selection before notifying its caller, restores it during
the existing layout effect before painting, and handles unchanged-value insertions immediately.
Suggestion insertion and indentation no longer schedule delayed selection callbacks. Keep
external-edit selection translation separate and reject stale suggestion lists.

## Regression proof

- `tests/java-suggestions-ui.browser.mjs` — **Java editor: a fast keystroke after pointer insertion stays inside the print parentheses**.
- Also **Java editor: arrows wrap, middle-word completion and indentation preserve surrounding code**.
- Command: `CODESHARE_PLAYWRIGHT_MODULE=<installed Playwright index.mjs> PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=<installed Chromium> node tests/java-suggestions-ui.browser.mjs`.
- Deliberately removed the before-paint restoration and restored delayed suggestion selection:
  both named checks failed (3 passed, 3 failed including the parent). Fixed source restored automatically.
- Real-app checks insert a print statement, type immediately, and run it using laptop Java for
  both roles. Full named results and restored evidence: [verification](../../verification/java-code-suggestions.md).
- Commit: see the current Java suggestions entry in `docs/handoffs/stage-one.md` and branch history.

## Recurrence triage

If text moves to the end only immediately after inserting code or indenting, inspect selection
timing. If only a live edit moves the caret, inspect the existing external-edit translation.
Read-only Tab trapping is CKB-020; the existing read-only guard must remain.

## History

- 2026-10-21 — Teacher approved Java-first local suggestions. Browser verification exposed this
  race before delivery; fixed in the shared editor and proved with a deliberate regression.
