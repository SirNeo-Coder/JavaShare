# Frontend (pages)

| File | What it is |
| --- | --- |
| `app/layout.tsx` | Page title, link preview, theme and font-size start-up script |
| `app/page.tsx` | Almost the whole app: sign-in, sign-up, join class, password reset screens, the class-list landing page (`Landing`), and the workspace for students and teachers (sidebar of teams and projects, file tabs, editor, Console / chat / saved work panel, activities, groups, live share, New web project). `enteredClassroomId` state picks which class's workspace is loaded; `null` shows the class list instead |
| `app/Landing.tsx` | The class list shown after sign-in and before any classroom: a teacher's class cards (each expands to a roster, and each student to their module progress) plus "Create a class"; a student's one card per joined class, each with that class's own module list, plus "Join another class" |
| `app/CodeEditor.tsx` | The editor: a textarea over a coloured copy. Highlighting for Java, HTML, CSS, JavaScript; bracket matching; Java-only "missing semicolon" hint; remote cursors |
| `app/api/[...path]/route.ts` | Sends every `/api` request to the shared server routes (`backend/src/routes.ts`) |
| `app/realtime.ts` | Live channels: gets the pass, connects to Supabase Realtime, private channels, `throttle`, the approved caps |
| `app/webPreview.ts` | Builds the sandboxed page for web projects and maps console lines back to file and line |
| `app/teacher/page.tsx` | Teacher activity summary (`/teacher`) |
| `app/teacher/accounts/page.tsx` | Student account management (`/teacher/accounts`) |
| `app/globals.css` | All styles; dark theme via `html[data-theme="dark"]` |

The browser calls the server with `api()` in `app/page.tsx` (cookies included) and joins live channels through `realtimeClient()` in `app/realtime.ts`.
