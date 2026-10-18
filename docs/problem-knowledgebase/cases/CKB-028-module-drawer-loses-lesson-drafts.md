# CKB-028 — Switching module lessons discards unsaved code

- Status: resolved
- First recorded: 2026-10-19
- Last verified: 2026-10-19
- Area: module drawer / `app/ModuleViewer.tsx`
- Search terms: switching lesson loses code, module drawer unsaved draft, lesson tabs reset textarea

## Symptom

Caught during implementation of the approved classroom layout, before release. Type a comment in
one lesson's code, select another lesson, then return: the comment disappears. Reproduced in the
built app against local Supabase; the browser reported `draftRetainedBeforeFix: false`.

## Root cause

The first drawer implementation filtered the lessons before rendering them. Leaving a lesson
unmounted its editor, discarding that editor's local file state. The former all-lessons viewer
had kept every editor mounted.

## Durable solution

`app/ModuleViewer.tsx` keeps every lesson and both performance-task editors mounted. Inactive
sections use `hidden`; `app/globals.css` ensures their grid styling cannot override that attribute.
This preserves drafts during lesson navigation without changing saving, progress or submission
routes. It does not add draft persistence across a reload or a return to the catalog.

## Regression proof

- `tests/classroom-ui.test.mjs`: `module pages: inactive lessons and task editors stay mounted so navigation cannot discard drafts`.
- Command: `node tests/classroom-ui.test.mjs`.
- Restored the filtering implementation: this test failed. Restored the fix: all five focused checks passed.
- Browser before-fix proof recorded above; final browser round trip recorded in `docs/verification/classroom-figma-ui.md`.
- Commit: the classroom UI change on `codex/classroom-figma-ui`.

## Recurrence triage

Distinguish switching lesson pages from closing the module, returning to the catalog, or reloading.
This case protects already-mounted editors during lesson navigation. Shared module-project storage
is a separate stage-four feature, not added by this presentation change.

## History

- 2026-10-19 — Teacher approved the Figma classroom layout as a workflow change, retained the
  current top bar, requested modules on the left and the existing messaging system on the right.
  Draft loss was caught and fixed while checking that layout.
