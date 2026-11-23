# Module editor — rolling handoff

Teacher request (2026-11-23): edit a module inside CodeShare instead of changing the week's `.codeshare.json` and
uploading it again. Three stages, one pull request each; the teacher tests each before the next starts. Rules: see
AGENTS.md, "Module editor (agreed 2026-11-23)".

## Decisions the teacher approved

- Saving never writes `docs/modules`. **Download module file** gives the saved module so the teacher replaces the
  week's file (2026-11-23).
- The PDF and Word lesson plan are never changed by CodeShare; the save warning carries a reminder line (2026-11-23).
- Restore can bring back any earlier version, with the same checks as an upload (stated in the plan, not objected to).

## Stage 1 — wording (branch `feature/module-editor-wording`)

Status: built, tested, pull request opened for the teacher to test. Not merged.

- **Curriculum → Edit module** (classes with a subject) with wording text boxes, **Preview as student** (no answer key),
  **Save changes** (warning names every class in the subject, student work unchanged, PDF/Word reminder),
  **Download module file**, **Earlier versions** with **Restore**.
- Server: `backend/src/module-wording.ts` lists wording fields and checks only wording changed (field order ignored,
  CKB-134). Routes `GET .../editor`, `PUT .../wording`, `POST .../versions/:id/restore`. Uploads, edits and restores
  keep the replaced content in the new table `subject_module_versions` (migration `20261123000100`).
- Evidence: `npm test` 517/517 pass; `tests/module-editor.test.mjs` 5/5 (wording check broken on purpose shown
  failing, then restored). Lint 0 errors, `npm run build:all` passes. Offline-mode server (local Supabase, laptop Java)
  in the browser: edit, preview, save (warning text checked), download, restore all worked.
- Not tested: the Cloudflare (online) build in the browser; the edited worksheet as seen by a real student account in
  the browser (Week 17 needs Week 16 first) — the automated test covers the student read through the server instead.
- Live site: the teacher applies the migration in the Supabase SQL Editor before deploying (steps in the PR).

## Next

- Stage 2 (sample code and supplied files, answer must pass the checker before saving) starts only after the teacher
  tests Stage 1 and asks for it. Open question then: how the teacher answer is run, since `activity.solution` holds
  changed lines, not complete files.
- Stage 3: add/remove/reorder steps and tasks, edit checks, automatic new question ids.
