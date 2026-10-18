# CKB-020 — Tab could not leave a read-only source editor

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: app/CodeEditor.tsx, teacher web-project viewer
- Search terms: read-only editor traps Tab, keyboard cannot leave code, teacher source keyboard focus stuck, Tab indents read-only file

## Symptom

Found in the new teacher web-project viewer before release. With focus in the read-only HTML
source field, pressing Tab left focus in that same field. No prior case matched this keyboard
problem. The teacher could use the mouse or Escape, but not normal forward keyboard navigation.

## Root cause

`CodeEditor` always connected `handleTab` to the textarea. That handler prevented the browser's
normal Tab behavior and attempted indentation even when the textarea was marked `readOnly`.
The read-only flag stopped text edits, but did not stop the custom key handler.

## Durable solution

Return from `handleTab` before preventing the default event when `readOnly` is true. Editable
student files retain their existing indentation handling; read-only views use normal keyboard
focus movement. No editor extraction or other keyboard behavior changed.

## Regression proof

- Real-app check: "read-only source Tab leaves the editor" in the production teacher web viewer.
- **Failed before the fix:** focused the HTML source field and pressed Tab; the accessibility
  state and DOM `document.activeElement` still identified `TEXTAREA`, `HTML source code editor`.
- **Passed after fix:** in the rebuilt production app, Tab moved focus out of the textarea; Shift+Tab also left the field. Typing a character did not change its read-only value. In the student's editable field, Tab still inserted four spaces. See the stage-three verification report.
- No frontend component-test harness exists. Build, lint, automated preview/API tests, and real
  keyboard interaction cover this change; no synthetic source-text assertion was added.
- Commit: pending implementation commit on `codex/teacher-web-projects`.

## Recurrence triage

If editable code inserts spaces on Tab, that is intended. If a read-only source view keeps
focus on Tab, check that the flag reaches `CodeEditor` and that `handleTab` returns before
`preventDefault`. The dialog should contain focus overall, but not trap it in its source field.

## History

- 2026-10-18 — Teacher approved the web-project viewer as a workflow change. Browser testing
  exposed the reused editor's keyboard trap; added the narrow read-only guard.
