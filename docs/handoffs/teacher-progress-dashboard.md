# Teacher progress dashboard handoff

Last updated: 2026-10-20. Branch: `codex/teacher-progress-dashboard`.
Base: `codex/printed-module-worksheet`; keep the dashboard review separate from that worksheet PR.

## Approved decision

The teacher approved a workflow change adapting the supplied Figma Student Progress Dashboard.
**Overview** summarizes one class, **Students** opens saved student/module progress, and
**Curriculum** manages uploaded modules. Use current completion data; do not invent scores,
streaks, learning time, weekly trends, deadlines, or “on track” labels. Caveman applies to chat
updates for this work; persisted code, comments, documentation and PR text remain normal prose.

## Done

- Teacher **Open class** opens the new dashboard; student class home is unchanged.
- Sidebar retains class return, classroom entry, activity summary, student accounts and sign-out.
- Overview summaries; student search/filter/cards and individual module grid; existing saved web
  project review; Curriculum search/filter/week-or-title ordering and module cards.
- Add module uses the existing JSON upload. Module details reuse the existing teacher preview,
  Java runner and Open to students controls. Back to modules returns to Curriculum. Deletion
  uses the existing route and a confirmation dialog with keyboard focus restoration.
- One class-wide teacher-only GET request, with current roster, module metadata and saved progress.
  Reuses the existing full-module percentage formula, counts both performance-task slots as
  submissions rather than grades, excludes former members/deleted modules, and pages progress
  reads to avoid the database's per-reply row limit. No source files are returned.
- Removed the superseded class-home roster/per-student summary components before testing.
  Student components and the old summary route remain because student cards/tests still use them.
- Updated knowledge-base routes, frontend, security, workflow and feature map. Recorded CKB-039
  (avatar selector isolation), CKB-040 (native delete-dialog focus), and CKB-041 (rounded average
  statuses); extended CKB-010 evidence.

## Evidence

See [verification](../verification/teacher-progress-dashboard.md) for every test name grouped by
file, commands, isolated-vs-real-app distinctions, mutation proof and screenshots.

- Required build passed; lint passed with 0 errors and 8 pre-existing warnings.
- Full suite: 80 passed, 0 failed, 0 skipped. Final full suite includes all 11 dashboard checks after the dialog/CSS/status changes. CKB-010, CKB-039, and CKB-041 mutations failed before protections were restored.
- Real browser: class totals, student search/filter/detail, empty class, JSON upload, teacher
  preview/availability, Java output 1/2/3, return to cards, Cancel and restored trigger focus.
- Final offline build passed through `classroom:offline -- --build-only`. Normal offline launcher
  also passed but reused the existing port-3000 instance. New UI tested against a separate local
  production server on port 3100 with local Supabase and laptop Java; existing classroom untouched.
- Desktop checked at a reported 1500 CSS pixels. Narrow layout checked, but browser scaling
  prevented a trustworthy exact 390-pixel emulation. Real phone/second Wi-Fi device and hosted
  Cloudflare are untested. Destructive browser confirmation was not clicked; existing deletion
  route integration tests pass. No new migration, package, live event or hosted setting.

## In progress / next

Implementation and verification complete. Commit, push and prepare a draft review PR against
`codex/printed-module-worksheet`, then record the PR link here. The teacher reviews and merges.
No deployment or hosted changes are authorized. No dashboard feature work remains in this scope.

## Local working state

Existing unrelated changes were left alone: `logs/classroom.log`, `supabase/.temp/cli-latest`,
`.claude/`, and `supabase/snippets/`. Do not include them in the dashboard commits.
Disposable browser fixtures and the temporary port-3100 server are cleaned up after verification.
