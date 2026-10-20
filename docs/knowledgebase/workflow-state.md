# Workflow state (updated 2026-10-20, branch `codex/student-classroom-entry`)

What teachers and students can do today. Keep this page current when their use of CodeShare changes; no change-level classification is required.

## Java run status (2026-10-21)

- In the module and personal Java editor, a prominent strip directly above **Actual output**
  shows **Saving your code…**, **Java is loading or running… Please wait.**, and **Checking your output…**.
  Offline module execution shows **Running Java and checking output… Please wait.**.
- During online personal input waits, it says **Waiting for your input** and points to **Program input**.
  Enter sends the answer; Stop cancels. Once output, a compiler error, or a request failure arrives,
  the strip clears. Previous output remains readable during the run.
- Save work and Submit this version alone do not display a Java-running indicator. This display
  does not change sample completion, personal submission or offline input-before-Run behavior.
- The text is announced for accessibility. Reduced motion keeps the indicator visible without spinning.

## Accounts

- The first account ever registered becomes the teacher and gets a starter class (code `JAVA101`) plus the "Teacher Demo Workspace" with "Live Lesson Code". Every later account is a student.
- Students join a class with its code; each gets a personal workspace with "My Practice Code" (Java).
- Teachers manage student accounts at `/teacher/accounts` (edit, photo, approve password reset, delete) and see an activity summary at `/teacher`.

## Classes and class home

- Students sign in or reopen CodeShare directly in their classroom when they belong to one class. With several classes, the last successfully entered class reopens if they still belong to it; otherwise **Classes** offers their current memberships. The preference belongs to this account in this browser. If browser storage is unavailable, one class still opens automatically and several classes require a choice.
- Students without a class see **Join your class** and enter the classroom after successfully joining. A required password reset takes priority over classroom entry.
- The student classroom header has **Classes** to switch or **Join another class**. This deliberately opens the chooser even with one class. **Open class** enters directly; there is no separate student module home. Modules and saved progress remain in the existing left-hand classroom module browser and worksheet.
- Teachers still start with the class list. Each card shows the class name, subject, join code and a **Live now** badge when appropriate. **Open class** shows the teacher dashboard with **Overview**, **Students**, and **Curriculum**. **Enter classroom** opens the live workspace and **Class home** returns to that dashboard.
- A teacher can **Create a class** (name + subject) from the class list. It gets its own join code and "Teacher Demo Workspace". A student can **Join another class** from the chooser.
- Student entry failures show the server's error, **Retry**, and **Classes** so a removed membership or connection failure need not trap the student. Server membership checks and per-class workspace loading remain authoritative.
- While students are on **Classes**, **Your class is live** offers **Join live class** or **Not now**; several live classes appear as a choice. Teachers do not receive this popup. The initial classroom entry rule is independent of whether a live session is running.
- **Not now** (or Escape) dismisses the displayed sessions while this page remains open, including trips into the workspace and back. Joining dismisses that chosen session. A new activity, or a session stopped and restarted while the page can observe the stop, can invite again. Reloading the page or signing out resets dismissal.
- Live status refreshes on announcements, connection/reconnection, and returning to the tab, without a repeating status timer. If live passes or the live connection fail, students see an error with **Reconnect** and can still enter a class manually. Listening outside a workspace does not mark students Online in every class.
- Session identity reuses the current activity or presentation project id, without a new database column. If the same activity/presentation stops and restarts entirely while disconnected, a previously dismissed invitation may remain dismissed; a persisted session-start marker would be needed to distinguish that case.
- Each class's roster, modules, progress, teams, activities, and live-share state stay separate. Progress summaries are loaded when opening the class or a student's progress; they are not a live dashboard.

## Weekly Java projects (approved workflow change, 2026-10-20)

- Each student has a **Module project** and a **Personal performance-task project** for every
  module in each class. Both use the main Java editor, supporting class tabs, Add file,
  **Save work** and **Run code**. The Projects drawer offers both for the selected module;
  the worksheet's **Work in code editor** and **Work on performance task** open the same projects.
- Module progress checks the printed sample's `files`, `expectedOutput` and optional `stdin`.
  Legacy `activity` JSON and challenge results stay stored, but no longer determine progression.
  The sample step id is the completion key; old `:activity` passes do not unlock sample steps.
  Compilation and execution must succeed. Match spaces/blank lines exactly; normalize CRLF
  and allow one final newline (Java println). Failed exploratory runs retain earlier passes.
- The first part opens automatically. Every required sample step in a part must pass to unlock
  the next part for that student. Locked content and premature requests are refused server-side.
  Handwritten liplets are assessed separately and do not gate progress. Teacher availability
  switches do not gate progress. The existing weekly live-class lock remains enforced.
- `previousModuleId` links the preceding week. Module files copy only the previous module project;
  personal files copy only the previous personal working project (or its submitted own version
  for older records). Supporting starter classes are added; existing student files win. Each
  copy is saved independently and never changes the preceding week. The teacher must supply
  the stable link in weekly JSON; a missing link starts with the supplied starter files.
- The personal task opens after the module steps pass, as before. **Run code** accepts personal
  program input and does not check a module target. **Submit this version** saves a separate
  own-version snapshot. Later draft edits do not change that submission. Existing sample and
  own submission records, completion totals and assessment are preserved; output is not a grade.
- Opening another project/module/class or signing out saves the active project first; save
  failures stop the transition. New saves/submissions reject stale tabs. Reload before saving
  can still lose unsaved edits. The personal draft is `performance_task.project.files`, separate
  from `performance_task.sample` and `.own`; drafts never count as submissions. No migration.
- Offline Java compiles all project files on the laptop, including Java packages with Main.java.
  Online execution uses Java 8/CheerpJ on a separate public runner origin after the teacher's setup. Students keep Run code; first run needs internet and displays CheerpJ attribution. Browser-reported results are practice evidence, not grades. Server access, exact expected output and saved-version checks remain authoritative. No new migration.


## Students

- Edit Java files, press **Run code** (laptop `javac` offline; CheerpJ Java 8 online after setup), and type program input in the Console.
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

- Teachers sign out after two hours without interaction; students after fifteen minutes,
  online and offline. Background classroom updates do not count. Closing the browser or
  shutting down the laptop does not stop the countdown; returning after expiry requires sign-in.
- A warning appears one minute before sign-out: save work or continue using CodeShare.
  Saved files remain safe; unsaved edits may be lost when the page returns to sign-in.
  Activity in another tab keeps the same account active; signing out clears other open tabs.
  Server restarts retain sessions still within these limits. Active sign-ins keep their existing
  seven-day maximum. The first deployment requires existing users to sign in again.

## Live features (PR c1)

- Teammates see typing about a quarter of a second later (at most 3 updates a second), and students see the teacher's live share about half a second behind (2 a second). Cursors update up to 4 times a second.
- "Online" (sidebar, auto-group roster, Student accounts) means the person has CodeShare open, via the live class channel. Student accounts shows "Connected to the live classroom".

## Classroom layout (approved workflow change, 2026-10-19)

- The teacher retained CodeShare's existing top bar: brand, role, class, teacher **Class home** / student **Classes**, student
  **Modules**, display settings, notifications and account. On phones those same visible controls
  wrap into two rows so they fit the screen; desktop appearance stays the same.
- The classroom uses the Figma reference's dark editor and Console with a yellow **Run code**
  button. File editing, program input, saved work, submissions and teacher live share keep their
  existing handlers and permissions.
- **Module** on the left edge or **Modules** in the top bar opens the module browser. The weekly
  pick appears first when one exists; cards show the student's saved percentage and server's live
  lock. Selecting a module opens a separate wide worksheet drawer; **Performance task** has its own page.
  Later parts remain locked until their required activities are passed. Navigation keeps editors mounted, so switching
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
- Class-home module upload, deletion, full teacher preview and activity requirements stay where
  they were. No new chat service, AI assistant, route, migration, dependency or internet asset.

## Printed module worksheet (approved workflow change, 2026-10-19)

- The classroom's left **Module** browser stays available. Choosing a module opens a wider
  worksheet with a white paper surface, navy section headings, tables, code/output, analogy and
  note boxes, and a dotted desk background. The teacher's PDF is a visual reference; module
  content still comes from the existing uploaded JSON, not a new PDF-import feature.
- The progress row uses saved student progress. Named parts follow the author's step `part`
  labels, even across days. Older modules fall back to one part per lesson. Locked parts withhold their content until the student passes the preceding activities.
- Each part has **Overview** for its opening discussion and step pages retaining their following
  tables/notes in reading order, with the liplet at the end. **Previous page / Next page** walk through the
  digital pages; their page count is separate from physical printed PDF pages. **Work in code editor** opens the activity in the main saved module project. Page switches and drawer closing keep
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
  preview and student activity requirements. **Back to modules** returns to Curriculum. **Delete
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

## Interactive online Java (approved workflow change, 2026-10-20)

- In the teacher demo, ordinary practice/class projects and personal performance-task
  projects, Run code starts online Java with live Console output. When Scanner reads
  more input, the Console says Waiting for input; type an answer in Program input and
  press Enter. Blank lines and successive questions are supported. Shift+Enter keeps
  a line break for entering several lines. Optional input entered before Run remains usable.
- Stop cancels loading, execution or input waiting. Java gets five seconds of execution
  time in total, excluding input waits; each unanswered request stops after two minutes.
  Output and input limits remain 64 KB and 10,000 characters. A new run starts fresh.
- Module sample checks and teacher sample previews retain supplied JSON input and fixed
  expected-output checks. Personal Run is separate from Submit this version.
- Offline still runs laptop javac with input supplied before Run. No new route, migration,
  dependency, hosted secret or hosted setting is needed.
