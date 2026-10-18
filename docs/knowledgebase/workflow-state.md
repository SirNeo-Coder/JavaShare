# Workflow state (snapshot 2026-10-16, branch `web-workspace`)

What teachers and students can do today. Compare any proposed change with this page to decide whether it is a workflow change or an adjustment.

## Accounts

- The first account ever registered becomes the teacher and gets a starter class (code `JAVA101`) plus the "Teacher Demo Workspace" with "Live Lesson Code". Every later account is a student.
- Students join a class with its code; each gets a personal workspace with "My Practice Code" (Java).
- Teachers manage student accounts at `/teacher/accounts` (edit, photo, approve password reset, delete) and see an activity summary at `/teacher`.

## Classes (landing page)

- On login, everyone sees a class list before entering any classroom: a teacher sees every class they teach as a card (name, subject, join code, a "Live now" badge if an activity or live share is running), a student sees one card per class they've joined, each with that class's own module list and progress.
- A teacher can **Create a class** (name + subject) from this screen - it gets its own join code and its own "Teacher Demo Workspace", independent of their other classes. A student can **Join another class** from the same screen the same way they joined their first one.
- Clicking a class's **Enter classroom** opens today's live workspace (editor, live share, activities, chat) scoped to just that one class; a **Dashboard** button in the workspace header returns to the class list. Each classroom's teams, activities, and live-share state are isolated from every other classroom the same user belongs to.
- A teacher's roster/module-progress drill-down (click "View students" on a class, then a student, for their module summary) lives on this same class list screen.

## Students

- Edit Java files, press **Run code** (laptop `javac` offline; demo mode online today), and type program input in the Console.
- **New web project** (from PR b): name it, and get `index.html`, `style.css`, `script.js`. **Run code** shows the page in the panel, with console output and errors (file:line) under it. Add `.html`/`.css`/`.js` files with **＋**; double-click a tab to rename.
- **Save work** (manual save for students), **Reopen saved work**, and named saved copies.
- Activities from the teacher appear in the sidebar; **Submit to teacher**. In group activities the leader submits, a leader vote prompt appears, and the leader can mute or lock members.
- Classroom chat (no activity), private chat with the teacher (individual activity), group chat (group activity).

## Teachers

- Teacher Demo Workspace with autosave, **Save lesson**, **New lesson**, and the lesson library.
- **Live share** the demo workspace to every student, keystroke by keystroke.
- **New activity** (individual or group, with starter code), **End activity**, reopen and delete, auto-grouping, Students/Groups views, following a student's active file live, viewing submissions, muting classroom chat.
- Teachers do not yet see students' web projects.

## Sign-in (PR c2)

- Sign-in lasts 7 days, online and offline. Restarting the laptop or the server no longer signs anyone out.

## Live features (PR c1)

- Teammates see typing about a quarter of a second later (at most 3 updates a second), and students see the teacher's live share about half a second behind (2 a second). Cursors update up to 4 times a second.
- "Online" (sidebar, auto-group roster, Student accounts) means the person has CodeShare open, via the live class channel. Student accounts shows "Connected to the live classroom".
