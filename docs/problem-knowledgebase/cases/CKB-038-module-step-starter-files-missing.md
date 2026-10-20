# CKB-038 — Module step runs without its supporting starter classes

- Status: resolved (student activity project)
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

## Durable solution — approved 2026-10-20

The teacher approved the student activity workflow in this chat: use one saved module project in
CodeShare's main editor. `prepareSupabaseModuleActivity` combines module supporting starter files,
activity files and the student's optional preceding module project. Current student files win;
`Main.java` and `src/Main.java` cannot become duplicate compilation units. All project files go
to the laptop runner together. Student module responses now include supporting starter files.
The original printed sample code and ids are unchanged. This resolves the student activity path;
the teacher's separate inline sample-preview runner is not part of this saved-project workflow.

## Regression evidence

- `tests/module-activities.test.mjs`: "module activities: real multi-file Java result unlocks only
  that student, without teacher switches or liplets (CKB-038)" runs Main, Vehicle and Jeepney
  through the actual routes and laptop javac. The changed capacity passes; the printed example
  does not satisfy the different challenge.
- Omitting module starter files from project preparation made that regression fail (expected
  three files, received one); restored before the passing final suite.
- "module activities: supporting classes survive and src aliases cannot duplicate Main.java
  (CKB-038)" checks supporting-source retention and filename precedence.
- The real local browser ran the project, displayed Passed and 25%, unlocked the next part,
  added Helper.java, and reopened all saved files after reload.
- Command: `node --test --test-reporter=spec tests/module-activities.test.mjs`.
- Branch: `codex/student-module-activities`; final commands and all names are in
  `docs/verification/student-module-activities.md`.

## Recurrence triage

Distinguish missing source files from an incorrect student edit or a Java runner outage. Never
change the teacher's supplied sample code merely to hide missing supporting project files.

## History

- 2026-10-20 — Found while verifying the teacher's exact JSON. Reader work continues; compatibility fix awaits explicit scope approval.

- 2026-10-20 — Teacher approved the main-editor activity flow; student project fix implemented and verified.
