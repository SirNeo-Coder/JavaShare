# CKB-120 — End session and Stop sharing disappeared on narrow windows

- Status: resolved (branch `fix/live-classroom-header`)
- First recorded: 2026-11-15
- Last verified: 2026-11-15
- Area: workspace header — `app/globals.css` (narrow-screen rules for `.presence`)
- Search terms: End session missing, cannot end session, Stop sharing missing, small window, zoomed in, narrow laptop, class session box gone, 900 px

## Symptom

Noticed while checking CKB-118/119 (2026-11-15): at 900 px wide or narrower, the header showed neither
**Class session · End session** nor **Shared with class · Stop sharing**. The teacher could not end the session or stop
sharing from the header; the session ended only after 30 minutes without the teacher's interaction.

## Root cause

The prototype's narrow-screen rule `.presence { display:none; }` (written to hide student avatar circles) also hides
every header box added later, including the two with buttons.

## Durable solution

At ≤900 px header boxes that hold a button stay visible without their grey second line. At 681–900 px (teacher's choice,
2026-11-15) only the button shows; at ≤680 px the bold label stays beside it. Boxes without a button stay hidden.

## Regression proof

- `tests/team-header-layout.browser.mjs`: every **End session** / **Stop sharing** button must be visible and clickable
  at 420–1600 px. Without the fix 6 cases failed (800, 600, 420 px with one or two session boxes); restored, 21/21 pass.
- Real app (offline, light and dark, 850 and 600 px): **End session** visible and clickable; clicking it ended the session.
  **Stop sharing** was not opened in the real app.

## Recurrence triage

If a header button vanishes on narrow windows, check the `@media (max-width:900px)` rules for `.presence` in `app/globals.css`.
