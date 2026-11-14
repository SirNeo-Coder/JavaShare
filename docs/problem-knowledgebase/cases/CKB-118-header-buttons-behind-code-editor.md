# CKB-118 — Present this code and Lesson library hidden behind the Code editor during a class session

- Status: resolved (branch `fix/live-classroom-header`)
- First recorded: 2026-11-15
- Last verified: 2026-11-15
- Area: workspace header — `app/globals.css` (`.team-header`, `.classroom-workspace .main-area`), markup in `app/page.tsx` (`team-header`)
- Search terms: buttons behind code editor, two boxes behind Code editor, Present this code hidden, Lesson library hidden, header buttons covered, Teacher Demo Workspace header overlap, Live Classroom header, class session header

## Symptom

The teacher's screenshot (2026-11-15) showed two outlined buttons peeking out from behind the **Code editor** card,
under the workspace title. They were **Present this code** and **Lesson library**, unreadable and unclickable.

## Root cause

The header grid had exactly three columns (`1fr auto auto`): title, one box, buttons. A class session adds
**Class session · End session**, and a shared step adds **Shared with class · Stop sharing**, so the buttons wrapped
to a second grid row. The classroom header row was a fixed 66 px, so that second row spilled under the content below.
Reproduced with the real stylesheet: no overlap without a session; overlap at 901–1600 px with one or two extra boxes.

## Durable solution

- `.team-header` uses `grid-template-columns:1fr; grid-auto-flow:column`: any number of boxes stay on one line
  (phones ≤680 px reset it to `row`, keeping the stacked layout).
- `.classroom-workspace .main-area` header row is `minmax(66px,auto)`: it grows instead of spilling when a narrow window
  makes the title wrap.

## Regression proof

- `tests/team-header-layout.browser.mjs` lays the header markup out with the real stylesheet at 420–1600 px with no session,
  a class session, and a class session plus shared step; buttons must end inside the header and above the Code editor, with
  no sideways scroll. With the old stylesheet 8 of 21 cases failed (every session case at 901 px and wider); restored, 21/21 pass.
- `tests/teacher-dashboard-ui.test.mjs` — "workspace header … (CKB-118)": stylesheet check run by `npm test`.

## Recurrence triage

If header items vanish again, check whether something new was added to `.team-header`, and whether the header row in
`.classroom-workspace .main-area` went back to a fixed height.
