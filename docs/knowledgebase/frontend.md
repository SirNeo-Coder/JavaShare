# Frontend (pages)

| File | What it is |
| --- | --- |
| `app/layout.tsx` | Page title, link preview, theme and font-size start-up script |
| `app/page.tsx` | Almost the whole app: sign-in, sign-up, join class, password reset screens, the class-list landing page (`Landing`), and the workspace for students and teachers (sidebar of teams and projects, file tabs, editor, Console / chat / saved work panel, activities, groups, live share, New web project). `enteredClassroomId` state picks which class's workspace is loaded; `null` shows `Landing` (the class list or class home) instead; `homeClassroomId` remembers where to return from the live workspace |
| `app/Landing.tsx` | The class list after sign-in ("Create a class" / "Join another class"). "Open class" shows class home: teacher module management, roster and per-student progress; student module cards with their own progress. Student modules open here without entering the workspace |
| `app/ModuleViewer.tsx` | Shared module viewer: embedded on the teacher's class home for upload, preview, and deletion; a modal from student class-home cards and the student workspace. Closing a module opened from a class-home card returns directly to those cards |
| `app/CodeEditor.tsx` | The editor: a textarea over a coloured copy. Highlighting for Java, HTML, CSS, JavaScript; bracket matching; Java-only "missing semicolon" hint; remote cursors |
| `app/api/[...path]/route.ts` | Sends every `/api` request to the shared server routes (`backend/src/routes.ts`) |
| `app/realtime.ts` | Live channels: gets the pass, connects to Supabase Realtime, private channels, `throttle`, the approved caps |
| `app/webPreview.ts` | Builds the sandboxed page for web projects and maps console lines back to file and line |
| `app/teacher/page.tsx` | Teacher activity summary (`/teacher`) |
| `app/teacher/accounts/page.tsx` | Student account management (`/teacher/accounts`) |
| `app/globals.css` | All styles; dark theme via `html[data-theme="dark"]` |

The browser calls the server with `api()` in `app/page.tsx` (cookies included) and joins live channels through `realtimeClient()` in `app/realtime.ts`.
