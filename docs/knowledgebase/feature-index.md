# Feature index

| Keywords | Server | Pages | Database / tests |
| --- | --- | --- | --- |
| sign in, register, password reset, session, idle, inactivity, restored browser | `routes.ts` (auth routes including `/auth/activity`, `requireAuth`, `setSession`), `realtime.ts` (pass deadline), `supabase-repository.ts` (`loginWithSupabase`, `registerWithSupabase`) | `AuthScreen`, `ResetPasswordScreen` in `app/page.tsx`; root `SessionActivity.tsx`, `sessionActivity.ts`, `apiClient.ts` | `profiles`, Supabase Auth; no migration; `tests/session-expiry.test.mjs`, `tests/session-activity.test.mjs`, CKB-051 |
| join class, class code | `joinSupabaseClass`, `ensurePersonalWorkspace` | `JoinClass` in `app/page.tsx` | `classrooms`, `classroom_members` |
| workspace load, sidebar, teams list, session expired | `bootstrapFromSupabase` | `loadWorkspace`, team list in `app/page.tsx` | `teams`, `projects`, `code_files`; CKB-023 session-expiry reset parity with `logout()` |
| save file, versions, conflict | `saveSupabaseFile`, `PUT /api/files/:id` | `persistCurrentCode` | `code_files`, `file_versions` |
| new file, rename file, file name rules | `createSupabaseFile`, `renameSupabaseFile`, `file-paths.ts` | `createFile`, `renameFile`, new-file dialog | `tests/web-workspace.test.mjs` |
| teacher sees student web projects, View web projects, saved source, Run preview, Refresh | `listSupabaseStudentWebProjects`, `getSupabaseStudentWebProject`, shared `teacherStudentWorkspace`; teacher-only GET routes under `/api/classes/:classroomId/students/:studentId/web-projects` | `app/Landing.tsx`, `app/TeacherWebProjects.tsx`, `app/teacherWebPreview.ts`; existing `CodeEditor`/`webPreview` | `tests/teacher-web-projects.test.mjs`, `tests/web-workspace.test.mjs`; CKB-020 keyboard fix; CKB-021 existing write gap; CKB-027 preview CSP eval fix; `docs/verification/stage-three-teacher-web-projects.md` |
| web project, HTML, CSS, JavaScript, preview, console, sandbox | `createSupabaseWebProject`, `POST /api/classes/:id/web-projects` | `createWebProject`, `runCode`, `app/webPreview.ts` | `projects.language`, `tests/web-workspace.test.mjs` |
| syntax colours, highlighting, brackets, semicolon hint, Java code suggestions, autocomplete | none | `app/CodeEditor.tsx`, `app/javaSuggestions.ts` | `tests/java-suggestions.test.mjs`, `tests/java-suggestions-ui.browser.mjs`, `tests/java-suggestions.browser.mjs`; CKB-020 read-only Tab, CKB-059 caret placement |
| run Java, javac, Judge0, demo mode | `POST /api/execute` in `routes.ts`, `executeLocally` in `java-runner.ts` | `runCode` | none |
| live typing, cursors, active file, who's online, live channel, Realtime | `backend/src/realtime.ts`, `GET /api/realtime/pass` | live effect in `app/page.tsx`, `app/realtime.ts`, `app/liveText.ts` (typing operations) | migration `20261016000200_realtime_private_channels.sql`, `tests/realtime.test.mjs` |
| teacher live help, watch student module/personal project, teacher edits student code, group editing by teacher | none (browser-to-browser `team:module-*` events, team-channel Presence) | `app/liveText.ts`, live effect and live editor in `app/page.tsx`, `live`/`applyEdit` in `app/StudentModuleActivity.tsx` | `tests/teacher-live-help.test.mjs`, `tests/teacher-live-help.browser.mjs` |
| chat, mute | messages routes, `chat-mute`, `chat:message` | chat panel | `messages` |
| teacher live share | `live-share` routes, `class:live-share*` | live-share overlay | `classrooms.live_share_project_id` |
| activities, groups, auto-group, leader, submit | activity and group routes | activity and group dialogs | `activities`, `teams`, `submissions`, `group_*` |
| saved work, restore | saved-work routes | `saveWork`, `restoreWork` | `saved_works` |
| photos | photo routes | photo inputs | Storage `student-photos` |
| live-class invitation, Your class is live, Join live class, Not now, Reconnect | `classSummary` in `supabase-repository.ts` (`liveSessionId`, no new route/table); existing class broadcasts | `app/Landing.tsx`, `app/liveClasses.ts`, dismissal state in `app/page.tsx`, shared channel release in `app/realtime.ts` | `tests/live-classes.test.mjs`, `tests/landing-pages.test.mjs`; CKB-017; CKB-024 per-topic cleanup; CKB-026 dismiss-after-success; `docs/verification/stage-three-live-class-invitation.md` |
| student landing, automatic classroom, last class, Classes, no class, shared browser | existing scoped `bootstrapFromSupabase`; no new route or schema | `app/studentClassroomEntry.ts`, `loadWorkspace` / `showClasses` in `app/page.tsx`, chooser in `app/Landing.tsx`; module browser stays in the classroom | `tests/student-classroom-entry.test.mjs`, `tests/landing-pages.test.mjs`; CKB-042; `docs/handoffs/student-classroom-entry.md`, `docs/verification/student-classroom-entry.md` |
| legacy teacher availability API (retained for compatibility; students now unlock activities automatically) | `setSupabaseModuleAvailability`, `getSupabaseModule`, progress guards in `supabase-repository.ts`; `PATCH .../modules/:moduleId/availability` | `app/ModuleViewer.tsx` | `course_modules.open_lesson_ids`, `performance_task_open`; migration `20261018000500_module_availability.sql`; `tests/module-availability.test.mjs`, `tests/course-module-schema.test.mjs`; CKB-018/019; `docs/lesson-availability-setup.md` |
| teacher dashboard, Overview, Students, Curriculum, class progress | `getSupabaseTeacherClassProgress`, `GET /api/classes/:classroomId/module-progress` | `app/TeacherClassDashboard.tsx`, teacher branch in `app/Landing.tsx`; existing `ModuleViewer` preview and `TeacherWebProjects` | `tests/teacher-dashboard.test.mjs`, `tests/teacher-dashboard-ui.test.mjs`; CKB-010/039/040/041; `docs/handoffs/teacher-progress-dashboard.md` |
| teacher activity summary and student accounts | `activity-summary`, `teacher/students` | `app/teacher/` | Existing account/activity behavior retained |
| course modules (stage two), upload a module, module viewer, goal meter, step checklist, exit slip, performance task sample vs own version | `course-module-schema.ts` (upload validation), module and module-progress routes in `routes.ts` (`POST/GET/DELETE /api/classrooms/:id/modules*`, `GET/PUT .../progress*`), `supabase-repository.ts` (`uploadSupabaseModule`, `listSupabaseModules`, `getSupabaseModule`, `deleteSupabaseModule`, `getSupabaseModuleProgress`, `setSupabaseModuleStepState`, `setSupabaseModulePerformanceTask`) | `app/ModuleViewer.tsx` (teacher upload + list embedded on class home; student goal meter, step-by-step run & check for Java steps, exit slip, two performance-task submission slots) | `module_progress`, `course_modules`, migrations `20261018000100_module_progress.sql`, `20261018000200_course_modules.sql`, `20261018000300_module_progress_exit_slip_fix.sql`, `tests/module-progress.test.mjs`, `tests/course-modules.test.mjs`, `tests/course-module-schema.test.mjs`, `tests/fixtures/sample-module.codeshare.json` |
| module viewer redesign (stage four, backend plus classroom printed worksheet), weekly module pick, this week's module, live-class module lock, part (grouping steps into a named chain), shared per-module project | `course-module-schema.ts` (`part` on a step block), `supabase-repository.ts` (`setSupabaseClassroomActiveModule`, `enforceModuleLiveLock`, `setSupabaseModuleProjectFiles`; `isActive`/`locked` added to `listSupabaseModules`' summaries), `PATCH /api/classrooms/:id/active-module`, `PUT /api/classrooms/:id/modules/:moduleId/progress/project` | `app/ModuleWorkspace.tsx`, `app/moduleParts.ts`, worksheet mode in `app/ModuleViewer.tsx`; classroom browser and worksheet use author-defined parts; shared central project/editor and teacher cards remain separate work | `classrooms.active_module_id`, `module_progress.project_files`, migration `20261018000600_module_weekly_active_and_shared_project.sql`, `tests/module-weekly-active.test.mjs`; `docs/handoffs/stage-four.md` |
| offline mode, launcher, LAN address | none | none | `scripts/classroom-mode.mjs`, `scripts/classroom.mjs` |
| Cloudflare, hosting, deploy, OpenNext, wrangler, preview | `backend/src/router.ts`, `routes.ts` | `app/api/[...path]/route.ts` | `wrangler.jsonc`, `open-next.config.ts`, `docs/cloudflare-setup.md`, `tests/api-router.test.mjs` |
| student activity, main editor, multi-file Java, target output, automatic unlock, preceding module project | `module-activities.ts`, `prepareSupabaseModuleActivity`, `runSupabaseModuleActivity`; GET `.../progress/activity?stepId=...`, POST `.../progress/run` | `StudentModuleActivity.tsx`, `ModuleWorkspace.tsx`, `ModuleViewer.tsx`, `moduleDeviceStore.ts`, `page.tsx` | device drafts/cache; existing `module_progress.project_files`/`step_states`; `tests/module-activities.test.mjs`, `tests/module-device-store.test.mjs`; CKB-038/043/065; `docs/verification/module-completion-saves.md` |

| two weekly Java projects, personal performance draft, sample output progression, copy module code into personal project | `prepareSupabasePerformanceProject`, `saveSupabasePerformanceProject`; POST/PUT `.../progress/performance-project`; existing sample run and task submission | `StudentModuleActivity`, `ModuleViewer`, `ModuleWorkspace`, `page.tsx` | existing `module_progress.performance_task.project.files`, no migration; `tests/module-activities.test.mjs`, `tests/weekly-java-project-ui.test.mjs`, `tests/personal-copy-module-code.browser.mjs`; CKB-045; `docs/handoffs/weekly-java-projects.md` |

| online multi-file Java, Java packages, CheerpJ, browser practice result | GET `/api/java-runner`, POST `.../progress/browser-result`, `recordSupabaseModuleActivityResult` | `javaExecution.ts`, `JavaRunnerBrand`, three existing Java callers; `java-runtime/`, `vendor/java/` | no migration; `tests/browser-java-*.test.mjs`; CKB-046/047/048; `docs/handoffs/online-multifile-java.md` |

| interactive online Java, Scanner waits, answer after Run, live Console output, Stop | existing Java mode and module-result routes unchanged | useJavaConsole.ts, javaExecution.ts, page.tsx, StudentModuleActivity.tsx; runner.js and vendor/java/CodeShareJava.java | tests/browser-java-client.test.mjs and browser-java-runtime.test.mjs; CKB-049; docs/handoffs/online-java-interactive-input.md |

Online Java loading timeout / whole-file compiler downloads: `runner.js` loads the
binary compiler/helper into `/str/`; `javaExecution.ts` authenticates stage messages
and names the last stage on timeout; `useJavaConsole.ts` shows loading feedback.
CKB-056; `tests/browser-java-client.test.mjs`, `tests/browser-java-runtime.test.mjs`;
verification and rollout: `docs/verification/java-runner-startup.md`.

Explicit alteration tasks: `activityTask` / `activityStateId` / `activityAccess.openStepIds` in
`backend/src/module-activities.ts`; existing repository activity and result routes;
`ModuleViewer`, `StudentModuleActivity`, `moduleParts`, `page.tsx`. Tests in module-activities,
browser-java-progress, classroom-ui, weekly-java-project-ui and rolling-module-tasks.
First example: `docs/modules/week14/`; CKB-052.

Sample-first loading and visible run feedback: `samplePending`, `sampleStateId`, `matchesSample`
and `unchangedSample` in `module-activities.ts`; activity preparation, project saves and result
recording in `supabase-repository.ts`; existing project route adds optional `stepId`.
`StudentModuleActivity`, `ModuleRunFeedback` and `ModuleViewer` handle the screen.
Migration `20261021000100_module_activity_projects.sql`; CKB-054; regressions in module-activities,
browser-java-progress, module-run-feedback, module-activity-migration and rolling-module-tasks;
actual production browser script `tests/module-sample-first.browser.mjs`.

Week 12/13 curriculum JSON: `docs/modules/week12/` and `docs/modules/week13/`, chaining
`java-2-w12` → `java-2-w13` → `java-2-w14`. Complete per-step samples, no Vehicle personal starters,
and an approved in-memory substitute for Week 13 disk examples. No app or migration change.
Real Java and compatibility checks: `tests/week12-week13-modules.test.mjs`; actual production
editor and browser Java 8 checks: `tests/week12-week13.browser.mjs`.

Module resume: `moduleResumeStep` in `app/moduleParts.ts`, consumed by worksheet, catalog and weekly Module project. Saved step completion supplies the position; no navigation storage. CKB-058; `tests/module-resume.test.mjs` and `tests/module-resume.browser.mjs`.

Cross-module prerequisites: `backend/src/module-prerequisites.ts` and the shared access guard in
`supabase-repository.ts`; `ModuleAccessNotice`, `ModuleViewer`, `ModuleWorkspace`, `ModuleCatalogCard`
and project-opening callers in `page.tsx`. Current step passes unlock the full predecessor chain;
live class permits catch-up. CKB-060; `tests/module-prerequisites.test.mjs` and
`tests/module-prerequisites.browser.mjs`. No migration or new endpoint.

Week 15–21 additive curriculum package: `docs/modules/week15-week21.md` links the seven JSON,
module PDFs and lesson plans. Original samples stay unchanged; 33 alterations use existing
sample-first support. Required upload fields, text-asset placement and named-demo Main forwarders
are documented in CKB-061. Week 20 stays written work. Classroom file persistence, preserved
thread-sample timing assumptions and visible/browser GUI execution remain separate limitations.
Tests: `week15-week21-modules.test.mjs` and `week15-week21.browser.mjs`.

Subject-specific shared modules: teacher-owned `subject_modules` and `classrooms.module_subject`;
shared readers and owner-only subject/import routes in `supabase-repository.ts` / `routes.ts`.
`ModuleSharing.tsx` is reused by Curriculum and the existing module upload view; class creation
uses a two-option Subject select in `Landing.tsx`. Migration `20261022000100`; tests in
`subject-module-sharing.test.mjs` and `subject-module-sharing.browser.mjs`; CKB-062.

Actual Week 12–21 prerequisite chain: `tests/week15-week21-modules.test.mjs` compares each
`previousModuleId` with its predecessor file's existing `id`. Weeks 18–21 references use the
preserved `-module` ids; CKB-063. The curriculum browser supplies actual earlier uploads and
disposable completion records, checks re-upload preservation and real blocking/unlocking.
Teacher steps: `docs/curriculum-prerequisite-reupload.md`. Access rules remain unchanged.

Personal submission/review: `personal-performance.ts`, personal run/result and teacher review
routes in `routes.ts`, frozen snapshot/run evidence in `supabase-repository.ts`; existing main
`StudentModuleActivity`, `PersonalSubmissionChecklist` (also `PersonalTaskChecklist`, the student's device-only self-check in Projects), `TeacherClassDashboard`, `Landing`,
`page`, `ModuleWorkspace` and `ModuleViewer`. CKB-067; tests in `personal-performance`,
`browser-java-progress`, `module-activities`, `weekly-java-project-ui`, and actual screens in
`personal-performance.browser.mjs`. No new migration or dependency.
