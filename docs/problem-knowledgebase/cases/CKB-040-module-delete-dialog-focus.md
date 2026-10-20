# CKB-040 — Cancelling module deletion lost keyboard focus

- Status: resolved
- First recorded: 2026-10-20
- Last verified: 2026-10-20
- Area: `app/TeacherClassDashboard.tsx`
- Search terms: Cancel delete module loses focus, Escape dialog body focus, keyboard return to module card

## Symptom

During local dashboard verification, opening Delete module focused Cancel correctly. Cancelling
then left focus on the page body instead of the button on the original module card.

## Root cause

Unmounting a native modal did not restore the intended button. An initial attempt to focus the
button before closing the modal also failed: elements outside a modal cannot receive focus.

## Durable solution

Keep the dialog and trigger references. Close the native dialog first, then clear its state and
focus the original button. After a successful deletion, focus the page heading because that card
is being removed. Display deletion errors inside the still-open dialog.

## Regression proof

- Real local browser: Delete module, Cancel, then inspect the focused element. Before: BODY.
  After: the original Delete module BUTTON. Escape uses the same close handler.
- No automated interaction test exists for this dialog. The repository's React checks render HTML
  on the server; they do not implement native dialog focus. See the dashboard verification page
  for the actual final browser result and any remaining limits.
- Commit: dashboard implementation on `codex/teacher-progress-dashboard`.

## Recurrence triage

If focusing an outside control has no effect, check whether the native modal is still open.

## History

- 2026-10-20 — Found in disposable local dashboard checks; fixed within the approved feature.
