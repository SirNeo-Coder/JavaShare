# CKB-119 — End session and Stop sharing looked like plain browser buttons

- Status: resolved (branch `fix/live-classroom-header`)
- First recorded: 2026-11-15
- Last verified: 2026-11-15
- Area: workspace header — `app/page.tsx` (`.presence` boxes for the class session and the shared step)
- Search terms: End session button big grey, Stop sharing button unstyled, header button looks different, plain button, default browser button, Class session box

## Symptom

Noticed while checking CKB-118 (2026-11-15): in the header, **End session** showed large grey text on a grey block,
unlike **Present this code** and **Lesson library** beside it. **Stop sharing** uses the same markup.

## Root cause

Both buttons had no `className`, so they got the browser's default button look. Every other header button uses `secondary`.

## Durable solution

Both buttons use `className="secondary"`, the existing header button style (light and dark). No stylesheet change.

## Regression proof

- `tests/teacher-dashboard-ui.test.mjs` — "End session and Stop sharing use the header button style (CKB-119)" reads
  `app/page.tsx`; failed with the fix undone, passes restored.
- Real app (offline, light and dark): **End session**'s font, weight, colours, corners and height equal **Lesson library**'s,
  and clicking it ends the session. **Stop sharing** was not opened in the real app; the source check covers its markup.

## Recurrence triage

A new header box button without `className="secondary"` will look the same way.
