# CKB-085 — Net MVC module tells students to use VS Code and Chrome

- Status: resolved (course map); old Weeks 1–3 materials retired by the teacher
- First recorded: 2026-10-30
- Last verified: 2026-10-30
- Area: teacher's course files (`/home/ireneo/Documents/Java 2026/Net Files/`, not in git): `DotNet1_Course_Map.md`, Weeks 1–3 JSON, DLL and printed module
- Search terms: module says Visual Studio, VS Code, Chrome Ctrl+O, open folder, local folder, copy the project folder, not aligned with CodeShare, .NET module wrong software

## Symptom

Reading the Net MVC Week 1 module, the teacher saw step instructions such as "Open canteen-portfolio in VS Code using File > Open Folder … In Chrome press Ctrl+O". The JSON's task boxes already said "Work in code editor … Run code", so one step told students to use two different workflows.

## Root cause

The course map's "Offline delivery" section said "Use the existing VS Code and Google Chrome", written before CodeShare could run web pages. Weeks 1–3 were written from it, so their lesson text, DLL and printed module described local files, while their JSON (samples, tasks, expected outputs) followed the CodeShare workflow.

## Durable solution

- `DotNet1_Course_Map.md` (teacher, 2026-10-30) is now a 10-week resume course with a "Delivery inside CodeShare" section: all student work is done inside CodeShare (module project and personal project), with no VS Code, Chrome file opening or local folders. The old 20-week map is kept in `before_revision/DotNet1_Course_Map_20_weeks.md`.
- The teacher retired the old Weeks 1–3 materials; every week is written new from the map.
- AGENTS.md, "Net MVC course (agreed 2026-10-30)", states the rule for every assistant.

## Regression proof

- Not code: checked by searching the course map. `grep -n -i -E "VS Code|Chrome" DotNet1_Course_Map.md` finds only the line that says not to use them.
- Each new week's DLL, module and JSON must be searched the same way before it is handed to the teacher.

## Recurrence triage

If a module step mentions any program other than CodeShare, check the course map first, then the weekly-materials prompt the teacher uses.

## History

- 2026-10-30 — Teacher asked why the module mentions Visual Studio (it said VS Code). Course map rewritten to the teacher's 10-week resume plan, CodeShare only.
