# Workflow state (updated 2026-10-18, branch `codex/teacher-web-projects`)

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
- On **Classes** or class home, students see **Your class is live** for a running activity or teacher live share, with **Join live class** and **Not now**. Several live classes appear as a choice. The invitation waits until an open module is closed, and never moves a student automatically. Teachers do not receive this popup.
- **Not now** (or Escape) dismisses the displayed sessions while this page remains open, including trips into the workspace and back. Joining dismisses that chosen session. A new activity, or a session stopped and restarted while the page can observe the stop, can invite again. Reloading the page or signing out resets dismissal.
- Live status refreshes on announcements, connection/reconnection, and returning to the tab, without a repeating status timer. If live passes or the live connection fail, students see an error with **Reconnect** and can still enter a class manually. Listening outside a workspace does not mark students Online in every class.
- Session identity reuses the current activity or presentation project id, without a new database column. If the same activity/presentation stops and restarts entirely while disconnected, a previously dismissed invitation may remain dismissed; a persisted session-start marker would be needed to distinguish that case.
- Each class's roster, modules, progress, teams, activities, and live-share state stay separate. Progress summaries are loaded when opening the class or a student's progress; they are not a live dashboard.

## Weekly modules: opening lessons (stage-three item 4, approved workflow change)

- In a teacher's class home, opening a module shows **Open to students** beside each lesson and, separately, the performance task. The teacher can preview and run everything regardless of the switches.
- Existing modules remain open when the new migration is first applied. Newly uploaded modules start with all lessons and the performance task closed. Choices belong to this class and module, separately from the uploaded file.
- Students see closed titles with **Not open yet**; their browser is not sent the assigned instructions, questions, expected outputs or supplied code for closed content. They close and reopen the module to see availability changes. Already-loaded content cannot be taken back, but further saves are refused once closed.
- Closing and reopening keeps saved progress and submissions. The percentage always uses the whole module, including closed lessons. Reuploading corrections with the same ids preserves choices and progress; added lesson ids start closed. Adding requirements can reduce the percentage without deleting work.
- Setup and safe rollback: [lesson-availability-setup.md](../lesson-availability-setup.md). The teacher applies the hosted migration before deploying the new app; assistants only apply it locally.

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
- On class home under **Students**, **View web projects** opens that student's personal web projects saved in this class. Choose a project to view its saved HTML/CSS/JavaScript files read-only, then **Run preview** for an isolated page and console output with file/line locations. **Back to projects** returns to the list; **Close** or Escape returns to the roster.
- This is a saved-file review: the student uses **Save work**, then the teacher presses **Refresh**. Refresh clears the previous preview; **Run preview** runs the refreshed files. Unsaved typing, group/activity projects, and named saved copies are not listed. No new submission step or student action was added.
- Only the class teacher can use these new GET routes; current class membership is required. No migration or new live channel. The teacher preview blocks network resources and cannot access the parent app. Existing direct file-save permissions are a separate unresolved issue (CKB-021), despite read-only fields in the teacher UI.

## Sign-in (PR c2)

- Sign-in lasts 7 days, online and offline. Restarting the laptop or the server no longer signs anyone out.

## Live features (PR c1)

- Teammates see typing about a quarter of a second later (at most 3 updates a second), and students see the teacher's live share about half a second behind (2 a second). Cursors update up to 4 times a second.
- "Online" (sidebar, auto-group roster, Student accounts) means the person has CodeShare open, via the live class channel. Student accounts shows "Connected to the live classroom".
