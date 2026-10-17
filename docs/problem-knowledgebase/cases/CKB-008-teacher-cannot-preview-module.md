# CKB-008 — A teacher could never preview an uploaded module

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: `app/ModuleViewer.tsx`
- Search terms: teacher sees only an error opening a module, "Only students have module progress", teacher can't preview module, module viewer blank for teacher, can't check uploaded module before class

## Symptom

Found by code review (`/code-review` on PR #7), then reproduced live. A teacher uploads a
`.codeshare.json` module and clicks it to open it (the same **Modules** screen students use). The
whole content area shows one line: "Only students have module progress." No lessons, no steps, no
performance task — nothing. The teacher has no way to read or test what they just uploaded short
of opening the raw JSON file by hand.

## Root cause

`ModuleContent` unconditionally fetched `GET .../progress` for whichever role opened it.
`getSupabaseModuleProgress` (backend, correctly) throws 403 for a teacher — `module_progress` is
student-only. The frontend then rendered `if (error) return <p>{error}</p>` before any of the
lesson/step/performance-task JSX, so that one 403 blanked the entire screen instead of just
whatever small piece of UI actually needed progress data (the goal meter, status chips,
checkboxes, submit buttons).

## Durable solution

`ModuleContent`, `StepView`, and `PerformanceTaskSlot` now take a `role` prop:

- A teacher's `ModuleContent` never calls the progress route at all — it renders with a static
  empty `Progress` stub, so the lesson content, steps, and performance task show unconditionally.
- Anything that reads or writes `module_progress` (the goal meter, exit-slip checkbox, performance
  task "Submit this version" button, a step's pass/fail status chip) only renders for
  `role === "student"`.
- A teacher can still press **Run** on a Java step or performance-task file to check it actually
  works — it calls the same `/api/execute` route, just without the follow-up progress PUT.
- A small note ("Previewing as teacher — nothing here is graded or saved.") makes the mode clear.

The fix is in `app/ModuleViewer.tsx` only — no backend change was needed; the 403 was already
correct, the frontend just needed to stop depending on student-only data for a teacher's view.

## Regression proof

- **Shown failing before the fix:** checked live in a browser (`npm run dev` against local
  Supabase) before the change — uploading a module as a teacher and opening it showed only the
  error banner.
- **Shown passing after the fix:** same steps, same module, same browser session — the teacher now
  sees both lessons, every step (with a working **Run** button; confirmed real `javac` output),
  the exit slip questions (no checkbox), and the performance task (no submit button), with the
  preview note at the top.
- No automated test exists for `app/ModuleViewer.tsx` (no React component tests in this project
  yet) — this was checked by hand, display-only. `npm test` (24/24) and `npm run build:all` /
  `npm run lint` (0 errors) confirm nothing else broke.

## Recurrence triage

If a future symptom is "a teacher sees a student-only error" anywhere in the module viewer, check
whether a new piece of UI was added without threading the `role` prop into it the way `StepView`/
`PerformanceTaskSlot`/`ModuleContent` already do.

## History

- 2026-10-18 — Found during a full-diff review of PR #6 and PR #7 (`/code-review`, high effort).
  Fixed the same day in `app/ModuleViewer.tsx`; no backend change.
