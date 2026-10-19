# Frontend (pages)

| File | What it is |
| --- | --- |
| `app/layout.tsx` | Page title, link preview, theme and font-size start-up script |
| `app/page.tsx` | Almost the whole app: sign-in, sign-up, join class, password reset screens, the class-list landing page (`Landing`), and the workspace for students and teachers (collapsible Projects or Students / projects drawer, file tabs, dark editor and Console, separate right-side existing chat drawer, saved work panel, activities, groups, live share, New web project). `enteredClassroomId` state picks which class's workspace is loaded; `null` shows `Landing` (the class list or class home) instead; `homeClassroomId` remembers where to return from the live workspace |
| `app/Landing.tsx` | The class list after sign-in ("Create a class" / "Join another class"). "Open class" shows class home: teacher module management, roster, per-student progress and saved web projects; student module cards with their own progress. Student modules open here without entering the workspace. Student-only live invitations listen on all joined class channels, defer while a module is open, and keep background status separate from workspace loading |
| `app/TeacherWebProjects.tsx` | Teacher class-home **View web projects** dialog: personal project list, read-only saved file tabs, **Run preview**, console, **Refresh**, and **Close**. Fetches only the selected project's files; does not join live team channels |
| `app/teacherWebPreview.ts` | Wraps the existing web renderer with a teacher-only network-blocking policy before student code, preserving the doctype and line map |
| `app/ModuleViewer.tsx` | Shared module viewer: embedded on the teacher's class home for upload, preview, and deletion; a modal from student class-home cards and the student workspace. Teachers get an **Open to students** checkbox per lesson and performance task. Students see **Not open yet** for closed titles, and a server-calculated whole-module percentage. Closing a module opened from a class-home card returns directly to those cards. In the classroom’s left drawer, cards show real progress and live-lock flags, and lesson navigation hides inactive editors without discarding their drafts |
| `app/WorkspaceDrawer.tsx` | Classroom left/right drawer frame, 250 ms slide-in/out, close/Escape and focus restoration, optional wide-desktop pin. Closed drawers stay mounted but inert and hidden from assistive technology; CSS delays visibility until the closing slide ends. Reduced-motion preferences disable the transition. Projects uses the same CSS/state markers in `app/page.tsx` |
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
