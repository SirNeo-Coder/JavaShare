# Workflow state (updated 2026-10-20, branch `codex/student-classroom-entry`)

What teachers and students can do today. Keep this page current when their use of CodeShare changes; no change-level classification is required.

## Service error messages (2026-10-22)

- If a request receives an HTML or empty error page, **Modules**, **Module worksheet**,
  and other screens using the shared request helper show a readable CodeShare message
  containing the failure status, for example **CodeShare could not complete the request
  (503). Please try again.** Existing JSON explanations remain visible.
- A protected request returning 401 still returns the classroom to **Sign in**, including
  when its error body is HTML. Failed sign-in/registration does not trigger that recovery.
- Error handling does not automatically retry saves or runs. A later deliberate retry
  can succeed when service returns. This does not establish recovery from the reported
  hosted save: its Worker log confirms CPU exhaustion at 10 ms (CKB-065).
  A hosting-budget remedy or separately approved CPU investigation is still needed.

## Java code suggestions (2026-10-21)

- In the classroom **Code editor**, **Module project**, and **Personal project**, typing two Java
  characters opens **Java code suggestions**. Examples: `Sys` offers `System` and
  `System.out.println(…)`; `ma` offers a `main` statement. Suggestions include Java keywords,
  common types and names in the current file, without Java type checking or AI generation.
- Use ↑/↓ to choose, Enter to insert, Escape to close, or click/tap an item. Print statements
  leave the caret inside their parentheses; `main` retains the current indentation.
  Tab/Shift+Tab still indent, and Ctrl+Enter still runs code. Read-only views retain normal Tab navigation.
- Comments and strings, selected text and composing text do not open suggestions. Moving the
  caret, scrolling, leaving the editor, or receiving changed live code closes the list.
- Suggestions use bundled code online and offline. Accepting one edits only the current file;
  existing Save work, Run code, explicit submission, live sharing and module completion rules apply.
  HTML, CSS, JavaScript and the teacher worksheet's plain sample textareas retain their existing behavior.

## Java run status (2026-10-21)

- The regular **Code editor → Console** used by teachers and students also shows the same
  rotating status strip while Java loads or runs. It remains visible even when output is blank
  during online startup, points to **Program input** when Java waits, and clears on output,
  errors or Stop. Reduced motion disables rotation. This applies to Java, not web previews.

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
- Each class’s roster, student progress, teams, activities, and live-share state stay separate. Assigned classes share their teacher’s module content by subject (Java or Net MVC). Progress summaries are loaded when opening the class or a student's progress; they are not a live dashboard.

## Weekly Java projects (approved workflow change, 2026-10-20)

- Each student has a **Module project** and a **Personal performance-task project** for every
  module in each class. Both use the main Java editor, supporting class tabs, Add file,
  **Save work** and **Run code**. The Projects drawer offers both for the selected module;
  the worksheet's **Work in code editor** and **Work on performance task** open the same projects.
- Legacy modules check the printed sample. Modules with explicit `activity.id` instead verify
  the separate alteration target and store `task:<activity.id>` completion. Old sample passes
  cannot complete new tasks. `sampleFirst` additionally verifies the unchanged sample before editing.
  Compilation and execution must succeed. Match spaces/blank lines exactly; normalize CRLF
  and allow one final newline (Java println). Failed exploratory runs retain earlier passes.
- Explicit alteration tasks open one step at a time; legacy samples open one part at a time.
  Locked content and premature requests are refused server-side. Reopening resumes unfinished work.
  Handwritten liplets are assessed separately and do not gate progress. Teacher availability
  switches do not gate progress. During live class, the weekly module and its prerequisite chain are available; unrelated modules remain locked.
- `previousModuleId` links the preceding week. Module files copy only the previous module project;
  personal files copy only the previous personal working project (or its submitted own version
  for older records). Supporting starter classes are added. Sample-first steps load their own supplied sources on
  first opening and restore their draft on revisits; legacy projects retain existing-file precedence. Each
  copy is saved independently and never changes the preceding week. The teacher must supply
  the stable link in weekly JSON. No declared link starts with the supplied starter files; a declared link to a missing upload blocks access with a teacher-upload message.
- The personal task opens after the module steps pass, as before. **Run code** accepts personal
  program input and does not check a module target. **Submit this version** saves a separate
  own-version snapshot. Later draft edits do not change that submission. Existing sample and
  own submission records, completion totals and assessment are preserved; output is not a grade.
- Opening another project/module/class or signing out saves the active project first; save
  failures stop the transition. New saves/submissions reject stale tabs. Reload before saving
  can still lose unsaved edits. The personal draft is `performance_task.project.files`, separate
  from `performance_task.sample` and `.own`; drafts never count as submissions. Sample-first history uses the additive migration described below.
- Offline Java compiles all project files on the laptop, including Java packages with Main.java.
  Online execution uses Java 8/CheerpJ on a separate public runner origin after the teacher's setup. Students keep Run code; first run needs internet and displays CheerpJ attribution. Browser-reported results are practice evidence, not grades. Server access, exact expected output and saved-version checks remain authoritative. No new migration.


## Students

- Edit Java files, press **Run code** (laptop `javac` offline; CheerpJ Java 8 online after setup), and type program input in the Console.
- Editable online Java Consoles show the current loading stage, then the program's
  output. A loading timeout names the last stage so the teacher can identify where
  startup stopped. Loading text is separate from the Java result and cannot complete
  module steps. The loading, execution and input-wait deadlines remain separate.
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
- One fixed **Module** tab on the left edge opens the module browser before selection, then reopens the selected worksheet. **Modules** in the student top bar always opens the browser. The weekly
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
- Hovering **Module**, **Projects / Students / projects**, or **Chat** slides its panel open without taking editor focus. Leaving keeps it open. Clicking outside slides it closed, including a pinned panel. The first click on a hover-opened tab keeps it open; the next toggles it closed. Touch and keyboard activation also toggle. Drawer **×** or Escape from within the drawer closes it and restores focus. At
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
- After selecting a module, the same fixed **Module** tab reopens its worksheet; there is no
  additional tab that can cover **Projects**. Hover opens it, leaving keeps it open, and outside
  click or **× / Escape** closes it. **Pin** reserves space at wide desktop widths. The tabs
  remain reachable while a worksheet is open, including smaller screens.
- **All modules** returns to the existing browser. Selecting a card again reloads its current
  content and teacher availability; closing/reopening the tab preserves the current visit.
  Opening **Projects** closes the worksheet while keeping its selected page and draft; reopening
  **Module** returns to that visit. Closing Projects does not automatically reopen the worksheet.
  The classroom top bar and existing chat system are retained. Class-home upload, availability, progress and submission
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

## Sample verification before alterations (approved 2026-10-21)

- Revised Week 14 opts into `sampleFirst: true`. **Work in code editor** loads the current step's
  sample on first opening. Supporting classes roll forward; each step's saved working files are
  kept independently. Reopening resumes those edits. Work present before the update remains
  readable under **Work saved before sample loading**. The previous week and personal drafts and
  submissions are never changed by module sample loading.
- The sample editor stays read-only until the student presses **Run code** and verifies the
  unchanged supplied sources and sample result. **Sample verified — now complete Your task.**
  saves verification without completing the task, advancing its percentage, or opening the next step.
  A sample with an explicit `expectedError` verifies the declared exception and shows
  **Expected error observed**; it cannot earn task completion.
- The same editor then opens for the small alteration and shows **Expected task output**.
  A matching successful task run saves **Completed** immediately and unlocks the next activity.
  The prominent banner sits above **Actual output**, outside the scrolling instructions.
  Other banners distinguish unchanged sample output and a mismatch. A failed later run reports
  its failure while explicitly retaining earlier saved completion. Reopening shows saved completion.
- An additive `module_progress.activity_projects` column stores module-only working drafts;
  sample evidence uses separate `sample:<activity.id>` keys. Existing completion keys stay intact
  and already completed tasks are not forced to repeat a sample or given invented sample passes.
  Older JSON without `sampleFirst` keeps its existing checks. Old cached clients attempting to
  save a new-flow project without its step identity are refused, rather than overwriting another step.
- Apply the new migration before deploying this app and re-uploading the revised Week 14 JSON.
  See `docs/module-sample-first-setup.md`. No assistant hosted migration or deployment is performed.

## Weeks 12 and 13 JSON (approved 2026-10-21)

- New Week 12 OOP and Week 13 exception-handling JSON use sample verification followed by small
  alterations with separate expected outputs. Upload Week 12, then 13, then 14 in the same class;
  stable predecessor ids connect their module projects. Week 13 finishes with the exact supporting
  classes Week 14 expects. No app or migration change is needed beyond the sample-first setup.
- Week 12 preserves the printed three-session catch-up order, grouped by the four pillars plus
  synthesis. Week 13 follows its five-day plan. Complete per-step sources run in the main editor;
  deliberately uncompilable/crashing demonstrations remain reading examples. Liplets stay separate.
- Week 13's disk example is reading material. Its runnable checked-exception practice uses an
  approved in-memory driver list and `Exception`, since the runner blocks `java.io` imports.
  This does not enable disk access or verify file-handling skills.
- The personal performance project retains the student's own theme and track. Neither new module
  inserts Vehicle starter classes into it. Original PDF/DOCX documents and the generation prompt
  remain unchanged. Source mapping and evidence: `docs/modules/week12/README.md`,
  `docs/modules/week13/README.md`, `docs/verification/week12-week13-modules.md`.

## Resuming and lesson logic (2026-10-21)

- Student module worksheets and the Module project button use saved completion to reopen the next
  unfinished step. Sample verification or a failed run keeps that step unfinished. Reload and
  another browser use the same server progress. Once all steps pass, the worksheet opens the
  performance task; completed modules without one open their final page. Teachers start at Overview.
- Weeks 12 and 13 include object state, inherited behavior, reversed object reports, polymorphic
  array swaps and exception-path tasks, each with complete changed output. Renaming output alone
  is insufficient. Revised requirements have `-v2` ids; old records stay saved and cannot skip them.
- First opening loads that step's complete sample; revisiting restores its saved draft. Module
  sources, personal sources, earlier weeks and submissions remain separate. The sample history
  migration and revised JSON must accompany the app rollout; hosted steps remain teacher actions.

## Rolling module prerequisites (2026-10-21)

- **Modules** shows why a later week is locked. Selecting it displays **Complete Week 12 before
  starting Week 14**, for example, and **Continue Week 12** opens that student's next unfinished
  step using saved progress. The rule follows declared links, not week numbers or upload order.
- All required module activities in every preceding module must pass. Current alteration ids
  count; sample verification, failed runs and old task identities cannot bypass new tasks.
  Personal performance-task submissions and handwritten liplets remain separate. Existing
  progress percentages still include submissions, so prerequisite readiness does not mean 100%.
- Week 12 completion unlocks Week 13; Week 13 completion then unlocks Week 14. Existing later
  work stays saved but cannot be reopened until prerequisites are satisfied. Missing linked
  modules ask for a teacher upload; circular links ask for corrected module files.
- Live class permits earlier modules in the weekly module's prerequisite chain. Teacher previews
  stay available. The server applies the same restriction to direct module/project requests,
  saves, runs, browser results and submissions in online and offline modes. No migration.

## Week 15 to 21 curriculum review copies 2026-10-22

The teacher approved additive task material while preserving the original lessons and samples.
[Review files](../modules/week15-week21.md) contain 33 explicit alteration tasks, complete targets,
sample-first settings, weekly links, corrected upload fields and matching PDF/Word appendices.
Week 20 remains a written proposal. No app workflow or runner was changed. These are review
copies: classroom disk support is still absent, original thread samples retain timing assumptions,
and visible/browser GUI interaction remains unverified. Do not treat upload acceptance as rollout
approval. Module and personal projects, paper assessment and submitted snapshots stay separate.

## Subject-specific shared module sets (approved 2026-10-22)

- **Create a class** requires **Subject**: **Java** or **Net MVC**. Each class uses exactly one
  teacher-owned module set. New classes immediately see that teacher’s existing subject modules.
- **Curriculum → Add module** uploads once for every class in that subject. Re-uploading the same
  module id updates their common content. Java accepts `java-1`/`java-2`; Net MVC accepts
  `dotnet-1`/`dotnet-2`. Other teachers have independent libraries.
- An older class retains its old content until its teacher uses **Choose this class’s subject**.
  Choosing a subject is permanent through the app, clears only that class’s weekly pick, and
  switches its module list to the shared subject set. Existing uploads remain in the database.
- **Saved uploads from this class → Share across Java classes / Share across Net MVC classes**
  adds an original upload to the common set. **Replace shared version** confirms the all-class
  effect and refuses a stale confirmation if another update arrived. Other-subject backups
  remain saved but cannot be shared into this class’s subject.
- **Delete module** confirms all classes in that subject lose access; their affected weekly picks
  are cleared. Student saved code, progress and submission snapshots remain stored.
- Every student project, completion, availability switch and live-week selection stays scoped to
  its original class. Shared content is used consistently by catalogs, previews, activity checks,
  student summaries, carry-forward projects and the teacher dashboard.
- Local/offline and hosted databases have independent libraries. Sharing does not transfer files
  between them. Offline continues using laptop Java; no new remote assets or runner changes.
- Setup and rollback limits: [subject-module-sharing-setup.md](../subject-module-sharing-setup.md).

Earlier-week requirements use the shared subject set too. Upload each linked week once; a student
still completes its tasks separately in each class, including after a shared correction.

Curriculum reference correction (CKB-063, approved 2026-10-22): Weeks 18–21 now reference the
actual preceding ids with their `-module` suffix. Week 12–21 links are checked against the real
files. Re-upload the four corrected JSON files through **Java class → Curriculum → Add module**
with the existing module/activity ids; all Java classes share the corrected content, while their
student files, completions and submissions remain separate and unchanged. Refresh/reopen Modules
after saving current edits. Full-chain prerequisites still apply, so unfinished earlier tasks
continue to block later work. Week 20 remains written work. No migration or prerequisite-rule
change. [Re-upload steps and limits](../curriculum-prerequisite-reupload.md). The teacher reports
uploading the four corrections with no apparent problem (2026-10-22). Independent hosted/student
recovery remains unverified.

## Course modules ordering (approved 2026-10-22)

- The classroom **Course modules** drawer shows unfinished modules in increasing week order
  (Week 12 through Week 21 for the current set), then completed modules in increasing week order.
- Saved 100% completion moves a module below every unfinished module. After Week 12 completes,
  Week 13 becomes the first card. Opening the drawer or refreshing progress updates the order.
- The weekly pick keeps its badge but does not override week/completion order. Teacher drawer
  browsing has no student progress and follows increasing week order. Curriculum stays as before.
- Sorting changes only the display; module locks, saved files, task checks and submissions use
  their existing rules. The same display rule applies online and offline. See CKB-066.

## Module work saved on completion (approved 2026-10-22)

- Student **Module** content is cached on that device for five minutes. The cache is scoped to
  student, class and module. Each module activity's working code and sample verification stay in
  that device's IndexedDB; **Save work** saves locally.
- Online Java runs in the browser. A failed run stays on the device and does not replace the last
  completed module project. A successful task sends one guarded completion checkpoint containing
  the code, run result and any required unchanged-sample evidence. A delayed checkpoint retries
  with the same id so it cannot duplicate completion. Newly unlocked content arrives in that same
  response and refreshes the device cache.
- Offline classroom runs continue through laptop Java and save successful code/completion to local
  Supabase. Personal performance-task projects keep their separate save and submit behavior.
- Clearing browser storage removes unfinished device drafts. The server keeps successful module
  completions and their saved project files. Local browser/device behavior is verified; hosted
  Cloudflare CPU recovery remains unverified. See CKB-065 and the completion-only verification.
