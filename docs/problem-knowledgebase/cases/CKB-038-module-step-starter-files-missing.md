# CKB-038 — Module step runs without its supporting starter classes

- Status: investigating
- First recorded: 2026-10-20
- Last verified: 2026-10-20
- Area: existing module execution / student module response and `app/ModuleViewer.tsx`
- Search terms: cannot find symbol Vehicle, Jeepney missing, module starter files missing, Collections step 1 fails, Main.java dependencies

## Symptom

The supplied Week 14 JSON's Step 1 provides Main.java and relies on Vehicle, Jeepney, Tricycle,
Bus and exception classes from module-level starterFiles. Step 2 is standalone and runs normally.

## Root cause

The existing viewer initializes each step from its own files only. The student module response
also omits module-level starterFiles, although the uploaded file contains them. The laptop Java
runner therefore does not receive the supporting classes. This predates the printed UI change;
standalone synthetic steps did not exercise it.

## Proposed durable solution — awaiting teacher approval

Return module starter files through the existing module route, with availability/redaction checks
preserved, and merge supporting files by path with step files before running (step files win).
Keep source ids unchanged. Check both offline javac and existing execution limits. No new route,
migration, runner or shared-project workflow is proposed by this narrow compatibility fix.

The asynchronous approval question explains that this extends the approved UI scope into the
server response. Do not implement the backend change without the teacher's reply.

## Regression evidence

- Exact-file inspection: seven module starter files, Step 1 supplies Main.java only.
- Real browser: the same JSON's standalone LinkedList Step 2 ran, matched output and saved 6%.
  Step 1 was run separately to expose missing supporting classes; see the verification report.
- No fix or automated regression for this issue is claimed yet.
- Tracking branch: `codex/printed-module-worksheet`.

## Recurrence triage

Distinguish missing source files from an incorrect student edit or a Java runner outage. Never
change the teacher's supplied sample code merely to hide missing supporting project files.

## History

- 2026-10-20 — Found while verifying the teacher's exact JSON. Reader work continues; compatibility fix awaits explicit scope approval.
