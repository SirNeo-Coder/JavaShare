# CKB-012 — A module upload could contain a java file path /api/execute would always reject

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: `backend/src/course-module-schema.ts`, `backend/src/file-paths.ts`, `backend/src/routes.ts`
- Search terms: step permanently unrunnable, java step never runs, file path rejected by execute,
  upload accepted but run fails, module path validation mismatch

## Symptom

Not a live incident — an open finding from `/code-review` on PR #6/#7, tracked in
`docs/handoffs/stage-two.md`, before either PR shipped to a student. `course-module-schema.ts`'s
`file()` schema accepted any non-empty path up to 200 characters, for every language. `/api/execute`
(`routes.ts`) only runs java files whose path matches a strict identifier-style regex (letters,
digits, `_`, `$`, `/` only; no spaces or other punctuation) and is at most 160 characters. A java
step's file, or a performance-task file ending in `.java` (both always sent to `/api/execute` -
`app/ModuleViewer.tsx`), could pass upload with a path like `"My File.java"` or a 170-character
name, then be permanently unrunnable for every student, with no warning to the teacher at upload
time.

## Root cause

The upload schema and `/api/execute`'s own validation were two independent checks that had never
been reconciled - the upload schema didn't know what `/api/execute` would actually accept.

## Durable solution

`file-paths.ts` now exports its `JAVA_PATH` regex and a `JAVA_PATH_MAX_LENGTH` constant (160,
matching `/api/execute`'s own cap) as the single source of truth; `routes.ts`'s `/api/execute`
handler was updated to import and use them instead of its own inline copy. `course-module-schema.ts`
imports the same two constants and adds a `.refine()` on the top-level `courseModule` schema that
checks every java-language step's files, and any performance-task file ending in `.java`, against
them - rejecting the upload with a plain-English message if any file would be unrunnable.

## Regression proof

- Test file: `tests/course-module-schema.test.mjs`.
  - "course module schema: rejects a java step file path that /api/execute could never run (a
    space)"
  - "course module schema: rejects a java step file path over /api/execute's 160-character cap"
  - "course module schema: rejects an unrunnable .java performance-task file path"
- Command: `node --test tests/course-module-schema.test.mjs` (also covered by `npm test`). No
  local Supabase needed.
- **Shown failing before the fix:** all three failed against the unmodified schema (the mutated
  fixture, with an unrunnable path, still parsed successfully). Added the `.refine()` and the
  shared constants; all three pass.
- Commit: this change, branch `module-viewer`.

## Recurrence triage

If a future symptom is "a step/file the teacher uploaded never runs, with no error," check
whether a new file-accepting field was added to the upload schema without reusing `JAVA_PATH`/
`JAVA_PATH_MAX_LENGTH` from `file-paths.ts` - that drift is exactly what caused this case.

## History

- 2026-10-18 — Found by `/code-review` on PR #6/#7, tracked as an open finding in
  `docs/handoffs/stage-two.md`. Fixed in this change: regression tests shown failing against the
  schema with no cross-check against `/api/execute`'s rules, then the shared constants and
  `.refine()` added, tests passing.
