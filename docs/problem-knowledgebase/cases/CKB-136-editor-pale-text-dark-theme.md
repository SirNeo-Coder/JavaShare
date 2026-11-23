# CKB-136 — Pale text in the module editor and its student preview (dark theme)

- Status: resolved on `feature/module-editor-page-edit`
- First recorded: 2026-11-23
- Last verified: 2026-11-23
- Area: module editor and **Preview as student** — `app/globals.css` (`.module-editor`, `.module-text-block`)
- Search terms: pale text preview, washed out discussion text, grey bars over code names, faded worksheet text,
  Where we left off pale, dark theme worksheet unreadable

## Symptom

In **Preview as student** (teacher screenshot, Week 14 Overview) the discussion paragraphs were very pale and the code
names showed as grey bars; the same happened on the new editing page.

## Root cause

Worksheet text blocks take their colour from `--ink`. In dark theme `--ink` is a light colour (#e8edf7). The classroom
worksheet and the teacher's class module panel reset `--ink` to a dark colour for their white paper; the module editor,
added in Stage 1, did not, so light text was drawn on white paper.

## Durable solution

`.module-editor` sets the same light-paper colours as `.teacher-page .class-module-panel` (`--ink:#17292b` and friends).
Only the editor changes; students' worksheet styles are untouched.

## Regression proof

- `tests/module-editor.test.mjs`: "worksheet text stays dark on its white paper in dark theme (CKB-136)" — failed with the
  reset removed, passed restored.
- Offline-mode browser in dark theme: text colour rgb(23, 41, 43) on both the editing page and the preview.

## History

- 2026-11-23 — Seen in the teacher's screenshot; fixed with the Option A editing page.
