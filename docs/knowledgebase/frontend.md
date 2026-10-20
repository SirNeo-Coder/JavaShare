# Frontend (pages)

| File | What it is |
| --- | --- |
| `app/layout.tsx` | Page title, link preview, theme and font-size start-up script |
| `app/page.tsx` | Almost the whole app: sign-in, sign-up, join class, password reset screens, the class-list landing page (`Landing`), and the workspace for students and teachers (collapsible Projects or Students / projects drawer, file tabs, dark editor and Console, separate right-side existing chat drawer, saved work panel, activities, groups, live share, New web project). `enteredClassroomId` selects one classroom. Students auto-enter their sole membership or valid last-used class; otherwise they choose. The student **Classes** button explicitly keeps the chooser open. `homeClassroomId` returns teachers to their dashboard; logout/session-expiry clear the entry state |
| `app/Landing.tsx` | Class chooser ("Create a class" / "Join another class"). **Open class** opens `TeacherClassDashboard` for teachers and enters the classroom directly for students. Student modules are only in the classroom. Student live invitations listen on joined class channels while the chooser is open and keep background status separate from workspace loading |
| `app/studentClassroomEntry.ts` | Small student destination rule and per-account `javashare-last-classroom-<userId>` browser preference. A saved class must still be in the bootstrap membership list; blocked storage falls back safely to the chooser for multiple classes |
| `app/TeacherClassDashboard.tsx` | Teacher class home: Figma-inspired Overview, searchable Students cards and individual progress, Curriculum module cards with upload/delete and existing teacher preview/availability. Class-wide saved figures from one teacher-only request; Refresh reloads them. Existing web-project review and teacher account/activity links retained; all local assets |
| `app/TeacherWebProjects.tsx` | Teacher class-home **View web projects** dialog: personal project list, read-only saved file tabs, **Run preview**, console, **Refresh**, and **Close**. Fetches only the selected project's files; does not join live team channels |
| `app/teacherWebPreview.ts` | Wraps the existing web renderer with a teacher-only network-blocking policy before student code, preserving the doctype and line map |
| `app/ModuleViewer.tsx` | Shared module viewer: embedded on the teacher's class home for upload, preview, and deletion; a reader from the student classroom. Teachers get an **Open to students** checkbox per lesson and performance task. Students see **Not open yet** for closed titles, and a server-calculated whole-module percentage. In the classroom’s left drawer, cards show real progress and live-lock flags, and selecting a module opens the separate wide worksheet with part/page navigation and mounted practice editors |
| `app/WorkspaceDrawer.tsx` | Classroom left/right drawer frame, 250 ms slide-in/out, close/Escape and focus restoration, optional wide-desktop pin. Closed drawers stay mounted but inert and hidden from assistive technology; CSS delays visibility until the closing slide ends. Reduced-motion preferences disable the transition. Projects uses the same CSS/state markers in `app/page.tsx` |
| `app/ModuleWorkspace.tsx`, `app/moduleParts.ts` | Classroom module browser plus separate printed worksheet drawer. The selected module keeps its Module ear; mouse hover previews it, leaving closes a hover preview, Pin or click keeps it open, Escape returns focus. Grouping follows optional author-defined step `part` titles across lessons; old files fall back to lesson grouping. Overview contains only introductory discussion; step pages preserve following notes/tables and the liplet stays at the end. Pages render existing tables, analogies, notes, errors and rubric; code is practised through the existing runner/progress handlers |
| `app/ModuleCatalogCard.tsx` | Classroom module card using saved progress and server-supplied weekly/lock flags |
| `app/CodeEditor.tsx` | The editor: a textarea over a coloured copy. Highlighting for Java, HTML, CSS, JavaScript; bracket matching; Java-only "missing semicolon" hint; remote cursors |
| `app/api/[...path]/route.ts` | Sends every `/api` request to the shared server routes (`backend/src/routes.ts`) |
| `app/liveClasses.ts` | Invitation filtering and dismissal rules, receive-only class announcements, reconnect refreshes, and listener cleanup; tested in `tests/live-classes.test.mjs` |
| `app/realtime.ts` | Live channels: gets the pass, connects to Supabase Realtime, private channels, `throttle`, the approved caps, and `releaseRealtimeChannels` (new subscribers wait for old channels to finish leaving, CKB-017) |
| `app/webPreview.ts` | Builds the sandboxed page for web projects and maps console lines back to file and line |
| `app/teacher/page.tsx` | Teacher activity summary (`/teacher`) |
| `app/teacher/accounts/page.tsx` | Student account management (`/teacher/accounts`) |
| `app/globals.css` | All styles; dark theme via `html[data-theme="dark"]` |

The browser calls the server with `api()` in `app/page.tsx` (cookies included) and joins live channels through `realtimeClient()` in `app/realtime.ts`.

Online Java uses shared `app/javaExecution.ts` from practice/classroom Run code,
StudentModuleActivity (module and personal), and ModuleViewer previews. Module runs
save first, run in browser when configured, then report success/output with saved
version. Personal/practice runs do not write module completion. JavaRunnerBrand uses
a locally served CheerpJ logo and is shown only after online execution is requested.

`StudentModuleActivity.tsx` shows `JavaRunProgress` immediately above **Actual output** for
module and personal runs: saving, Java startup/running, then module output checking. The strip
uses its own run message rather than the general busy flag, so Save work or submission alone
does not claim Java is running. Interactive personal runs show **Waiting for your input**; success,
compiler errors, failed requests and Stop remove the strip. Screen readers receive the status,
and the spinner stops animating under reduced motion. No runner protocol or completion rule changes.
