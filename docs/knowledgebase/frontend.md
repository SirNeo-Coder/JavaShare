# Frontend (pages)

Module draft recovery (2026-10-23): `moduleDeviceStore.ts` validates sample evidence with the
existing output/exception rules and stores lesson version plus task identity. Changed or legacy
drafts become readable backups in `StudentModuleActivity.tsx`. The editor waits for restoration
before accepting edits. `ModuleWorkspace.tsx` checks content freshness against progress before
choosing a step; `page.tsx` checks it again when opening the editor. Local passes show
**Passed locally — awaiting sync** until acceptance, including after reload/retry.
CKB-067/068/069; tests in module-device-store, module-run-feedback, and module-draft-recovery.browser.

| File | What it is |
| --- | --- |
| `app/layout.tsx` | Page title, link preview, theme and font-size start-up script |
| `app/page.tsx` | Almost the whole app: sign-in, sign-up, join class, password reset screens, the class-list landing page (`Landing`), and the workspace for students and teachers (collapsible Projects or Students / projects drawer, file tabs, dark editor and Console, separate right-side existing chat drawer, saved work panel, activities, groups, live share, New web project). `enteredClassroomId` selects one classroom. Students auto-enter their sole membership or valid last-used class; otherwise they choose. The student **Classes** button explicitly keeps the chooser open. `homeClassroomId` returns teachers to their dashboard; logout/session-expiry clear the entry state |
| `app/Landing.tsx` | Class chooser ("Create a class" / "Join another class"). **Open class** opens `TeacherClassDashboard` for teachers and enters the classroom directly for students. Student modules are only in the classroom. Student live invitations listen on joined class channels while the chooser is open and keep background status separate from workspace loading |
| `app/studentClassroomEntry.ts` | Small student destination rule and per-account `javashare-last-classroom-<userId>` browser preference. A saved class must still be in the bootstrap membership list; blocked storage falls back safely to the chooser for multiple classes |
| `app/TeacherClassDashboard.tsx` | Teacher class home: Figma-inspired Overview, searchable Students cards and individual progress, Curriculum module cards with upload/delete and existing teacher preview/availability. Class-wide saved figures from one teacher-only request; Refresh reloads them. Existing web-project review and teacher account/activity links retained; all local assets |
| `app/TeacherWebProjects.tsx` | Teacher class-home **View web projects** dialog: personal project list, read-only saved file tabs, **Run preview**, console, **Refresh**, and **Close**. Fetches only the selected project's files; does not join live team channels |
| `app/teacherWebPreview.ts` | Wraps the existing web renderer with a teacher-only network-blocking policy before student code, preserving the doctype and line map |
| `app/WebStepRun.tsx` | Web module steps: `useWebPageRun` runs files in the sandboxed preview and resolves with page text or console lines; `WebCheckList` shows one ticked/crossed line per check with Required/Your output. Used by `StudentModuleActivity` and the teacher preview in `ModuleViewer` |
| `app/ModuleViewer.tsx` | Shared module viewer: embedded on the teacher's class home for upload, preview, and deletion; a reader from the student classroom. Teachers get an **Open to students** checkbox per lesson and performance task. Students see **Not open yet** for closed titles, and a server-calculated whole-module percentage. In the classroom’s left drawer, cards show real progress and live-lock flags, and selecting a module opens the separate wide worksheet with part/page navigation and mounted practice editors |
| `app/WorkspaceDrawer.tsx` | Classroom left/right drawer frame, 250 ms slide-in/out, outside-pointer closing, close/Escape and focus restoration, optional wide-desktop pin. Mouse hover opens without stealing editor focus; leaving does not close. Closed drawers stay mounted but inert and hidden from assistive technology; CSS delays visibility until the closing slide ends. Reduced-motion preferences disable the transition. Projects uses the same CSS/state markers in `app/page.tsx` |
| `app/ModuleWorkspace.tsx`, `app/moduleParts.ts` | Classroom module browser plus separate printed worksheet drawer. Owns one fixed left rail with Module and Projects (Students / projects for teachers). Module opens the catalog before selection and reopens the selected worksheet afterwards; All modules or the student top-bar Modules opens the catalog. Both ears open on mouse hover and stay accessible beside the worksheet. Outside clicks close without losing the selected page or drafts; Escape returns focus. Projects closes the worksheet without dropping its visit. Grouping follows optional author-defined step `part` titles across lessons; old files fall back to lesson grouping. Overview contains only introductory discussion; step pages preserve following notes/tables and the liplet stays at the end. Pages render existing tables, analogies, notes, errors and rubric; code is practised through the existing runner/progress handlers |
| `app/useOutsideDismiss.ts` | Shared document pointer handler for drawers and Projects; ignores each panel and all its aria-controls triggers; outside presses also close pinned panels |
| `app/ModuleCatalogCard.tsx` | Classroom module card using saved progress and server-supplied weekly/lock flags |
| `app/CodeEditor.tsx` | The editor: a textarea over a coloured copy. Highlighting for Java, HTML, CSS, JavaScript; bracket matching; Java-only "missing semicolon" hint; remote cursors. Editable Java also offers local suggestions from `javaSuggestions.ts`: keywords, common types, current-file names, print/main statements. Two typed characters open a short list; arrows choose, Enter inserts, Escape closes, Tab retains indentation. Click/tap inserts without moving focus. Comments/strings, composition, selections and read-only views suppress suggestions; external edits dismiss stale suggestions. Caret placement happens before painting (CKB-059). No network or type-aware Java service |
| `app/api/[...path]/route.ts` | Sends every `/api` request to the shared server routes (`backend/src/routes.ts`) |
| `app/liveClasses.ts` | Invitation filtering and dismissal rules, receive-only class announcements, reconnect refreshes, and listener cleanup; tested in `tests/live-classes.test.mjs` |
| `app/realtime.ts` | Live channels: gets the pass, connects to Supabase Realtime, private channels, `throttle`, the approved caps, and `releaseRealtimeChannels` (new subscribers wait for old channels to finish leaving, CKB-017) |
| `app/webPreview.ts` | Builds the sandboxed page for web projects and maps console lines back to file and line |
| `app/teacher/page.tsx` | Teacher activity summary (`/teacher`) |
| `app/teacher/accounts/page.tsx` | Student account management (`/teacher/accounts`) |
| `app/globals.css` | All styles; dark theme via `html[data-theme="dark"]` |

The browser calls the server with `api()` in `app/page.tsx` (cookies included) and joins live channels through `realtimeClient()` in `app/realtime.ts`.

Online Java uses shared `app/javaExecution.ts` from practice/classroom Run code,
StudentModuleActivity (module and personal), and ModuleViewer previews. Module activity
files and sample verification stay in per-student IndexedDB drafts; browser runs check
locally and only successful task completion sends a guarded checkpoint. The response
includes the newly unlocked, server-filtered module view and refreshes the local cache.
Offline runs still use the laptop runner and sync successful results to local Supabase.
The separate personal performance project keeps its existing server-save and submission
behavior. JavaRunnerBrand uses
a locally served CheerpJ logo and is shown only after online execution is requested.

`StudentModuleActivity.tsx` shows `JavaRunProgress` immediately above **Actual output** for
module and personal runs: saving, Java startup/running, then module output checking. The strip
uses its own run message rather than the general busy flag, so Save work or submission alone
does not claim Java is running. Interactive personal runs show **Waiting for your input**; success,
compiler errors, failed requests and Stop remove the strip. Screen readers receive the status,
and the spinner stops animating under reduced motion. No runner protocol or completion rule changes.

The regular **Code editor** Console in `app/page.tsx` also reuses `JavaRunProgress`, using its
existing Java-only `running` flag. The strip stays visible when interactive startup clears the
output text. Input waiting replaces its loading/running wording; success, failure and Stop clear
it. Only the output pre is marked busy, leaving the status outside that accessibility boundary.
Web previews, saved-work lists and plain Save work do not show Java progress.

Module samples and alterations: `StudentModuleActivity.tsx` restores per-step drafts and shows `ModuleRunFeedback` alongside the existing Java-running indicator. The worksheet and project buttons use `moduleResumeStep` in `moduleParts.ts` to continue unfinished work.

Prerequisite UI (2026-10-21): `ModuleAccessNotice` shows the oldest unfinished linked module and
Continue Week N. `ModuleViewer`/`ModuleWorkspace` and both Projects shortcuts preserve structured
API restriction details through `ApiError`; Continue reuses saved-progress resume. Missing uploads
and cycles display a repair message without an unusable Continue button. No navigation storage.

Shared API errors (2026-10-22): `app/apiClient.ts` handles non-JSON error pages centrally.
Callers show a CodeShare message with the HTTP status instead of a JSON parsing error.
Server JSON messages and prerequisite details remain intact. Protected 401 responses
trigger the existing sign-in recovery even if their body is HTML; login/registration
failures do not. Malformed successful responses are rejected, 204 stays empty, and
requests are never automatically retried. CKB-064; tests/api-client.test.mjs and
tests/api-client.browser.mjs. This changes error reporting, not service availability.
Course modules ordering: `sortModuleCatalog` in `app/ModuleViewer.tsx` sorts drawer cards
by saved completion (100% last), then increasing week. The weekly badge stays visible without
overriding order. `tests/module-catalog-order.test.mjs` checks the rule;
`tests/module-catalog-order.browser.mjs` checks the actual local app. CKB-066.
