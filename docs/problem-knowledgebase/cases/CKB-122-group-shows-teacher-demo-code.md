# CKB-122 — Choosing a group soon after Groups showed Teacher Demo's code under the group's name

- Status: resolved (branch `fix/group-view-double-load`)
- First recorded: 2026-11-15
- Last verified: 2026-11-15
- Area: teacher **Students / projects** → **Groups** — `app/page.tsx` (`loadWorkspace`, the view-change effect, the **Students** / **Groups** buttons)
- Search terms: group shows wrong code, group card shows Hello CodeShare, teacher demo code under group, teacher-live-help group subtest times out, waitForEditor "Group", editing opens when a group member is online never goes away, teacher typing never reaches group member, flaky group test

## Symptom

`tests/teacher-live-help.browser.mjs`, subtest "group: read-only while no member is online, then the teacher's typing
reaches online members unsaved", failed in about half of the runs on main `d775f87` (offline settings, local Supabase,
`next start`). The other five subtests passed. After the teacher clicked **Groups** and then the **Live group** card, the
header showed **Live group · Group code**, but the editor held Teacher Demo Workspace's "Hello, CodeShare!" file. Failures
showed up at three different later steps (the editor check, the read-only note, the teacher's typing reaching the
member), depending on when the wrong file arrived.

## Root cause

**Groups** (and **Students**) loads the class list twice: once from the button itself, and once more from the effect that
reloads when the view changes. Each load, when it finishes, puts the first card's file (Teacher Demo) in the editor,
because both started while the first card was selected. Neither load changes the selected card. When the teacher clicked
a card after the first load's answer but before the second's, the second answer replaced the group's file with Teacher
Demo's. In a failing run the second answer arrived 1 ms before the click finished; passing runs had a 25–55 ms gap.
This timing has been possible ever since both loads existed. It is not a recent change: the earlier 7/7 records were lucky timing.

## Durable solution

`loadWorkspace` numbers each load (`workspaceLoadRef`). An answer that a newer load has replaced is ignored, whether it
succeeded or failed. Every caller that starts a second load (**Students**/**Groups**, deploying or ending an activity) is
covered by this one check. Not covered: a reload started by a live event (for example a group update) that lands after a
card click is still the newest load and can reset the editor the same way. That case is rarer and was not changed here.

## Regression proof

- `tests/teacher-live-help.browser.mjs` — "group: read-only while no member is online, then the teacher's typing reaches
  online members unsaved" now holds the first groups answer back by one second, so it always lands after the card
  click.
- Command: `LIVE_HELP_BASE_URL=http://localhost:<port> CODESHARE_PLAYWRIGHT_MODULE=… node --test tests/teacher-live-help.browser.mjs`
  against `next start` with `DATABASE_MODE=supabase-local`.
- Shown failing without the fix: 3 of 3 runs timed out at the editor check. With the fix: 10 of 10 runs passed 7/7.

## Recurrence triage

If a group card shows another card's file, check that the stale-answer check in `loadWorkspace` is still there,
then look for a reload started by a live event (the gap noted above). If the editor is right but the teacher stays
read-only, that is a presence or live-connection problem, not this one.

## History

- 2026-11-15 — Teacher reported the subtest failing on main; diagnosed as a double-load race; fix approved and built.
