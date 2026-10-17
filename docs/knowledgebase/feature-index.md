# Feature index

| Keywords | Server | Pages | Database / tests |
| --- | --- | --- | --- |
| sign in, register, password reset, session, signed out after restart | `routes.ts` (auth routes, `requireAuth`, `setSession`), `supabase-repository.ts` (`loginWithSupabase`, `registerWithSupabase`) | `AuthScreen`, `ResetPasswordScreen` in `app/page.tsx` | `profiles`, Supabase Auth |
| join class, class code | `joinSupabaseClass`, `ensurePersonalWorkspace` | `JoinClass` in `app/page.tsx` | `classrooms`, `classroom_members` |
| workspace load, sidebar, teams list | `bootstrapFromSupabase` | `loadWorkspace`, team list in `app/page.tsx` | `teams`, `projects`, `code_files` |
| save file, versions, conflict | `saveSupabaseFile`, `PUT /api/files/:id` | `persistCurrentCode` | `code_files`, `file_versions` |
| new file, rename file, file name rules | `createSupabaseFile`, `renameSupabaseFile`, `file-paths.ts` | `createFile`, `renameFile`, new-file dialog | `tests/web-workspace.test.mjs` |
| web project, HTML, CSS, JavaScript, preview, console, sandbox | `createSupabaseWebProject`, `POST /api/classes/:id/web-projects` | `createWebProject`, `runCode`, `app/webPreview.ts` | `projects.language`, `tests/web-workspace.test.mjs` |
| syntax colours, highlighting, brackets, semicolon hint | none | `app/CodeEditor.tsx` | none |
| run Java, javac, Judge0, demo mode | `POST /api/execute` in `routes.ts`, `executeLocally` in `java-runner.ts` | `runCode` | none |
| live typing, cursors, active file, who's online, live channel, Realtime | `backend/src/realtime.ts`, `GET /api/realtime/pass` | live effect in `app/page.tsx`, `app/realtime.ts` | migration `20261016000200_realtime_private_channels.sql`, `tests/realtime.test.mjs` |
| chat, mute | messages routes, `chat-mute`, `chat:message` | chat panel | `messages` |
| teacher live share | `live-share` routes, `class:live-share*` | live-share overlay | `classrooms.live_share_project_id` |
| activities, groups, auto-group, leader, submit | activity and group routes | activity and group dialogs | `activities`, `teams`, `submissions`, `group_*` |
| saved work, restore | saved-work routes | `saveWork`, `restoreWork` | `saved_works` |
| photos | photo routes | photo inputs | Storage `student-photos` |
| teacher dashboards | `activity-summary`, `teacher/students` | `app/teacher/` | none |
| course modules (stage two) | none yet | none yet | `docs/course-format.md` |
| module progress, goal meter, checklist, performance task sample vs own version | module-progress routes in `routes.ts` (`GET/PUT /api/classrooms/:id/modules/:id/progress*`), `supabase-repository.ts` (`getSupabaseModuleProgress`, `setSupabaseModuleStepState`, `setSupabaseModuleExitSlip`, `setSupabaseModulePerformanceTask`) | none yet (backend plumbing only; no module viewer exists to show it) | `module_progress`, migration `20261018000100_module_progress.sql`, `tests/module-progress.test.mjs`, `tests/fixtures/sample-module.codeshare.json` |
| offline mode, launcher, LAN address | none | none | `scripts/classroom-mode.mjs`, `scripts/classroom.mjs` |
| Cloudflare, hosting, deploy, OpenNext, wrangler, preview | `backend/src/router.ts`, `routes.ts` | `app/api/[...path]/route.ts` | `wrangler.jsonc`, `open-next.config.ts`, `docs/cloudflare-setup.md`, `tests/api-router.test.mjs` |
