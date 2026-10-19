# CKB-039 — Dashboard avatar styles shared the classroom's name

- Status: resolved
- First recorded: 2026-10-20
- Last verified: 2026-10-20
- Area: `app/TeacherClassDashboard.tsx`, `app/globals.css`
- Search terms: teacher avatar changed, dashboard avatar styles, classroom profile size, global CSS collision

## Symptom

Caught during dashboard implementation, before release. The new dashboard used `.teacher-avatar`,
which already styles the classroom's profile button. A selector comparison found the collision.
The new later rules would also change the classroom avatar's size, shape and colours.

## Root cause

Both pages load `app/globals.css`; a generic class name was reused for unrelated elements.

## Durable solution

Dashboard avatars use `.teacher-progress-avatar`. Keep the existing classroom avatar rules intact.

## Regression proof

- `tests/teacher-dashboard-ui.test.mjs`: "teacher dashboard: avatar styles cannot override the existing classroom avatar (CKB-039)".
- Command: `node --test --test-reporter=spec tests/teacher-dashboard-ui.test.mjs`.
- Restoring the shared name in both new markup and styles caused this test to fail; restoring the
  fix passed. This checks rendered class names and stylesheet isolation, not browser pixels.
- Commit: dashboard implementation on `codex/teacher-progress-dashboard`.

## Recurrence triage

Compare selectors introduced by a new page with existing selectors before changing old profiles.

## History

- 2026-10-20 — Figma-inspired teacher dashboard approved; caught and isolated its avatar styles.
