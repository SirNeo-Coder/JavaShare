# Workflow state (updated 2026-10-19, branch `codex/classroom-figma-ui`)

What teachers and students can do today. Compare any proposed change with this page to decide whether it is a workflow change or an adjustment.

## Accounts

- The first account ever registered becomes the teacher and gets a starter class (code `JAVA101`) plus the "Teacher Demo Workspace" with "Live Lesson Code". Every later account is a student.
- Students join a class with its code; each gets a personal workspace with "My Practice Code" (Java).
- Teachers manage student accounts at `/teacher/accounts` (edit, photo, approve password reset, delete) and see an activity summary at `/teacher`.

## Classes and class home

- On login, everyone sees a class list. Each card shows the class name, subject, and a "Live now" badge if an activity or live share is running; teachers also see its join code. **Open class** opens that class's home, without entering the live workspace.
- A teacher can **Create a class** (name + subject) from the class list. It gets its own join code and "Teacher Demo Workspace". A student can **Join another class** from that same list.
- A teacher's class home uses **Overview**, **Students**, and **Curriculum** (the module-management page). See "Teacher class dashboard" below for the approved 2026-10-20 workflow.
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

## Classroom layout (approved workflow change, 2026-10-19)

- The teacher retained CodeShare's existing top bar: brand, role, class, **Class home**, student
  **Modules**, display settings, notifications and account. On phones those same visible controls
  wrap into two rows so they fit the screen; desktop appearance stays the same.
- The classroom uses the Figma reference's dark editor and Console with a yellow **Run code**
  button. File editing, program input, saved work, submissions and teacher live share keep their
  existing handlers and permissions.
- **Module** on the left edge or **Modules** in the top bar opens the module browser. The weekly
  pick appears first when one exists; cards show the student's saved percentage and server's live
  lock. Selecting a module opens a separate wide worksheet drawer; **Performance task** has its own page.
  Closed lessons still show **Not open yet**. Navigation keeps editors mounted, so switching
  lessons preserves unsaved drafts. This does not add persistence across reloading or leaving a module.
- **Projects** on the left edge exposes the existing student projects/activity list and **New web
  project**. Teachers use **Students / projects** for their existing student/group lists, activity
  controls and demo workspace. This drawer and the module drawer share the left-hand space.
- **Chat** on the right edge, or the existing conversation tab beside **Console**, opens the right
  drawer. It is the existing messaging system: classroom chat outside an activity, private chat
  during an individual activity, group chat in a group activity. Existing messages, live delivery,
  teacher mute and group-leader permissions are reused. Both Enter and **Send message** submit
  through the same existing handler. The Console remains available independently.
- Drawer **×** or Escape from within the drawer closes it and restores the previous focus. At
  wide desktop widths (1400 pixels and above), **Pin** reserves workspace space for a drawer;
  narrower screens use overlays. The chat conversation area stays light in both saved themes,
  matching the Figma reference, with a navy heading.
- Class-home module upload, deletion, full teacher preview and availability controls stay where
  they were. No new chat service, AI assistant, route, migration, dependency or internet asset.

## Printed module worksheet (approved workflow change, 2026-10-19)

- The classroom's left **Module** browser stays available. Choosing a module opens a wider
  worksheet with a white paper surface, navy section headings, tables, code/output, analogy and
  note boxes, and a dotted desk background. The teacher's PDF is a visual reference; module
  content still comes from the existing uploaded JSON, not a new PDF-import feature.
- The progress row uses saved student progress. Named parts follow the author's step `part`
  labels, even across days. Older modules fall back to one part per lesson. Closed lessons show
  **Not open yet** without exposing content; the existing teacher availability rules still apply.
- Each part has **Overview** for its opening discussion and step pages retaining their following
  tables/notes in reading order, with the liplet at the end. **Previous page / Next page** walk through the
  digital pages; their page count is separate from physical printed PDF pages. **Practise this
  step** exposes the existing editor and **Run & check**. Page switches and drawer closing keep
  drafts mounted. Reloading, changing module or leaving the classroom still does not save a draft.
- After selecting a module, its additional **Module** ear previews the worksheet on mouse hover.
  Moving into the worksheet keeps the preview open; leaving closes it unless pinned. Clicking or
  keyboard-activating the ear keeps it open. **Pin** keeps it visible; at wide desktop widths it
  also reserves space. **× / Escape** closes it, with keyboard focus returned to its ear.
- **All modules** returns to the existing browser. Selecting a card again reloads its current
  content and teacher availability; merely closing/reopening the ear preserves the current visit. Projects temporarily covers the worksheet and hides its ear without dropping the selected
  page or draft; closing Projects restores that visit. The classroom top bar and existing chat
  system are retained. Class-home upload, availability, progress and submission
  routes retain their existing storage and permissions. No new route, dependency or migration.

## Teacher class dashboard (approved workflow change, 2026-10-20)

- **Open class** in the teacher account opens a dashboard for that class, with a dark sidebar and
  **Overview**, **Students**, and **Curriculum**. **All classes**, **Enter classroom**, **Activity
  summary**, **Student accounts**, and **Sign out** remain available, including on narrow screens.
- **Overview** shows student count, average saved completion, completed student–module pairs, and
  students with no completed items. A student's overall percentage is the arithmetic mean of
  their percentages across all uploaded modules. The class mean includes every student–module
  pair, including untouched modules and closed lessons. These are completion figures, not grades.
- Displayed averages are rounded. Finished/In progress/Not started labels and filters use the
  underlying completion records, so rounding to 0% or 100% cannot change status.
- **Students** shows searchable cards with completion filters. **View module progress** opens a
  student's summary and module cards. **View web projects** retains the existing saved-file review.
- **Curriculum** is the teacher's module-management page. Cards show week, course, lesson and step
  counts, average completion, students finished, and saved performance-task submission count.
  **Add module** uses the existing JSON upload; **View module details** opens the existing teacher
  preview and **Open to students** controls. **Back to modules** returns to Curriculum. **Delete
  module** asks for confirmation; cancelling restores focus to its original button.
- **Refresh** fetches saved progress again. Navigation within a class uses that visit's loaded
  figures; returning from module preview, uploading, and deleting refreshes them. This is not a
  live dashboard. Search and filters affect cards, not the class-wide summary totals.
- Only the class teacher can fetch the class-wide progress request. Current student membership is
  required for inclusion; former members and deleted modules do not affect totals. Progress pages
  are read in batches so a year's records are not truncated by Supabase's response limit.
- No new tables, migrations, progress-writing rules, grading, time tracking, streaks, or weekly
  history. All dashboard assets are local. Student module use and classroom live features retain
  their existing behavior.
