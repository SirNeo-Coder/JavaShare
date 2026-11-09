# CKB-098 — Teacher's module worksheet has no Work in code editor

- Status: resolved
- First recorded: 2026-11-09
- Last verified: 2026-11-09
- Area: classroom module worksheet, main editor — `app/ModuleViewer.tsx` (`StepView`), `app/page.tsx` (`startModuleActivity`), `app/moduleActivityState.ts`, `app/StudentModuleActivity.tsx`
- Search terms: teacher viewing module has no code editor, discuss module in class, sample not in main editor, Work in code editor missing for teacher, teacher can't show sample code big, Net MVC lesson teacher editor, Preview sample code only small boxes

## Symptom

Reported by the teacher while discussing a module in class: the classroom **Module** worksheet shows
the teacher each step's sample only as small code boxes under **Preview sample code**, with a small
**Run**. Students get **Work in code editor**, which opens the step in the main editor; the teacher
did not, so the sample could not be shown and run in the big editor. Java and Net MVC (web) steps alike.

## Root cause

Not a regression: the teacher's worksheet never had the button. `StepView` drew **Work in code
editor** only for `role === "student"`, and `startModuleActivity` in `app/page.tsx` returned early
for anyone not a student. The main editor's module mode (`StudentModuleActivity`) opened for a
teacher only for **Review personal submission** (`kind: "review"`, read-only).

## Durable solution

- `StepView` shows the teacher **Work in code editor** on Java and web steps, only when an
  `onStartActivity` is supplied (the classroom worksheet). The Curriculum dashboard preview, which
  has no main editor, shows no button.
- For a teacher, `startModuleActivity` opens a new `kind: "preview"`: the module's starter files
  merged with the step's sample (`mergeProjectFiles`, the same order students get), the step's
  instruction, expected output and input. No server request.
- `moduleProjectForClass` lets only a teacher open `preview`.
- In `StudentModuleActivity`, `preview` is editable even in sample-first modules, never loads or
  writes device drafts, never saves (`save()` returns), has no **Save work** or result banner, and
  runs like a review: Java through the normal console (laptop `javac` offline), web steps in the page
  window with the step's run page, checks and module media. No live-share link: students never see it.
- Headed **Module preview · <module>**, status **Preview only — nothing is saved**.
  **Return to class project** or any card in **Students / projects** closes it.

## Regression proof

- `tests/student-module-activity-ui.test.mjs` — "teacher module preview: only a teacher opens it, and its main editor never offers Save work"
- `tests/classroom-ui.test.mjs` — "teacher worksheet: Work in code editor appears only where the main editor can open the step"
- `tests/teacher-module-preview.browser.mjs` — "teacher Work in code editor: Java and Net MVC samples open in the main editor, run, and are never saved"
  (real app, offline settings with laptop Java, port 3052; Java step edited and run prints the edit; resume page edited and shown in the page window;
  no progress/file/project write requests; no `module_progress` rows)
- Commands: `node --test tests/student-module-activity-ui.test.mjs tests/classroom-ui.test.mjs`; the browser test with
  `CODESHARE_PLAYWRIGHT_MODULE`, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` and `PREVIEW_BASE_URL` (default `http://localhost:3052`)
- Shown failing: both unit tests failed with the teacher rule and the button removed; the browser test failed
  (main editor never opened) with the teacher branch in `startModuleActivity` disabled and the app rebuilt; all passed after restoring.
- Commit: branch `feature/teacher-module-preview`

## Recurrence triage

If the button shows but nothing opens, check the worksheet receives `onStartActivity` and that
`moduleProjectForClass` still allows `preview` for teachers. If a teacher's preview ever saves or
appears to students, look for a `preview` guard missing from `save`, the device-draft effects, or the `live` prop.

## History

- 2026-11-09 — Teacher reported no code editor when viewing a module as teacher; approved a
  preview-only main-editor view (only on the teacher's screen, never saved). Built and tested.
