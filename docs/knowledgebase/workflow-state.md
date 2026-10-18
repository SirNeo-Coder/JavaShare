# Workflow state (updated 2026-10-18, branch `codex/class-home`)

What teachers and students can do today. Compare any proposed change with this page to decide whether it is a workflow change or an adjustment.

## Accounts

- The first account ever registered becomes the teacher and gets a starter class (code `JAVA101`) plus the "Teacher Demo Workspace" with "Live Lesson Code". Every later account is a student.
- Students join a class with its code; each gets a personal workspace with "My Practice Code" (Java).
- Teachers manage student accounts at `/teacher/accounts` (edit, photo, approve password reset, delete) and see an activity summary at `/teacher`.

## Classes and class home

- On login, everyone sees a class list. Each card shows the class name, subject, and a "Live now" badge if an activity or live share is running; teachers also see its join code. **Open class** opens that class's home, without entering the live workspace.
- A teacher can **Create a class** (name + subject) from the class list. It gets its own join code and "Teacher Demo Workspace". A student can **Join another class** from that same list.
- A teacher's class home contains **Modules** (the **Upload module** file picker, module preview, and **Delete**) and **Students**. **View module progress** on a student shows that student's module summaries for this class. **Back to modules** leaves a teacher preview.
- A student's class home shows **Your modules**, with each module's progress. Opening a module stays on class home; **Close** returns to the module cards and refreshes their progress.
- **Enter classroom** opens the existing live workspace for that one class. **Class home** in its header returns to the same class home; **Classes** goes back to the class list. Students also retain the workspace's **Modules** shortcut. Teacher module upload and deletion now live on class home, rather than in the workspace header.
- Each class's roster, modules, progress, teams, activities, and live-share state stay separate. Progress summaries are loaded when opening the class or a student's progress; they are not a live dashboard.

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
