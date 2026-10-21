# Backend (server)

All in `backend/src/`: `routes.ts` (every route, sign-in, the Java endpoint; `handleApi` takes a web `Request`), `router.ts` (the tiny Express-style router), `java-runner.ts` (the laptop JDK runner, loaded only when allowed), `realtime.ts` (`broadcast` live signals, `realtimePass` for browsers), `server.ts` (Express wrapper for Render only). Next.js calls `handleApi` from `app/api/[...path]/route.ts`. Backend files import each other with `.ts` extensions; `tsc` rewrites them to `.js` for Render., `supabase-repository.ts` (every database read and write plus permission checks), `database.ts` (Supabase clients, `DATABASE_MODE`), `file-paths.ts` (file-name rules per project language).

## Routes (`routes.ts`)

| Area | Routes |
| --- | --- |
| Health | `GET /api/health` |
| Live channels | `GET /api/realtime/pass` (one-hour pass for Supabase Realtime; 503 if `SUPABASE_JWT_SECRET` is missing), `POST /api/classes/:id/arrive` (called when a page opens a class; places a late student into a group) |
| Sign-in | `POST /api/auth/register` (first account ever becomes the teacher and gets starter class `JAVA101`), `login`, `forgot-password`, `logout`, `GET /api/auth/me`, `POST /api/auth/change-reset-password` |
| Teacher admin | `GET /api/teacher/students` (also returns `classroomIds` for the live "Online" status), `POST .../:studentId/reset-password`, `PATCH`/`DELETE /api/teacher/students/:studentId`, `PUT .../photo`, `PUT /api/teacher/profile/photo`, `GET /api/teacher/activity-summary` |
| Classes | `POST /api/classes` (teacher-only, creates an additional class with its own join code), `POST /api/classes/join`, `GET /api/bootstrap` (no `classroomId`: the class list only, no workspace data; each summary includes `liveSessionId` derived from the current activity/presentation id for invitation dismissal; with `?classroomId=`: that one class's full workspace, scoped so no other classroom's teams/activities can appear), `POST /api/classes/:id/auto-group`, activities (`POST .../activities`, `end-activity`, `.../reopen`, `DELETE`), `PUT .../chat-mute`, `GET`/`POST .../live-share`, `POST .../web-projects` (students only) |
| Teams | `GET`/`POST /api/teams/:id/messages`, `PUT .../group-profile`, `PUT .../group-permissions` |
| Teacher module dashboard | `GET /api/classes/:classroomId/module-progress` (class teacher only). Current roster, uploaded module metadata, per-student percentages and class totals; reuses `moduleCompletionPercent`, reads progress in pages, returns no student source or new progress rows |
| Teacher web-project review | `GET /api/classes/:classroomId/students/:studentId/web-projects` (list metadata), `GET .../:projectId` (one project and saved files). Teacher-only; verifies class ownership, current student membership, personal workspace ownership, class, web language and no activity |
| Files and projects | `PUT /api/files/:id` (save; needs matching `version` for groups), `PATCH /api/files/:id` (rename), `POST /api/projects/:id/files`, `POST .../submit`, saved work (`GET`/`POST .../saved-work`, `PUT /api/saved-work/:id`, `POST .../restore`), `GET /api/submissions` |
| Course modules | `GET`/`POST /api/classrooms/:classroomId/modules`, `GET`/`DELETE .../:moduleId`, `PATCH .../:moduleId/availability` (class teacher only; lesson id + boolean, or performance-task boolean), `GET .../summary`, `GET .../:moduleId/progress`, `PUT .../:moduleId/progress/step`, `PUT .../:moduleId/progress/performance-task` |
| Java | `GET /api/java-runner` chooses browser/local/legacy server mode; `POST /api/execute` retains laptop/legacy runner |

## Live events (Supabase Realtime, since PR c1)

Private channels `team:<teamId>` and `class:<classroomId>` (policies in `supabase/migrations/20261016000200_realtime_private_channels.sql`). Browser code in `app/page.tsx` (the live effect) and `app/realtime.ts`.

- **Server to browsers** (`broadcast()` in `backend/src/realtime.ts`, after the request succeeds; always `await` it before replying, or Cloudflare drops it, CKB-006):
  - class channel: `class:live-share`, `class:live-share-update`, `class:activity-deployed`, `class:activity-ended`, `class:chat-muted`, `groups:updated`
  - team channel: `chat:message`, `file:updated`, `team:submitted`, `team:profile-updated`, `team:permissions-updated`
- **Browser to browsers** (sent directly on the channel; capped):
  - team: `team:file-operation` (typing; 3 a second), `team:cursor` (4 a second), `team:active-file`, `team:sync-request` (a newcomer asks), answered with `team:active-file` and `team:live-snapshots` (unsaved typing)
  - class (teacher only): `class:live-share-draft` (2 a second)
- **Invitations outside the workspace:** students receive existing activity and live-share announcements on their joined classes' private channels, then re-read the lightweight bootstrap summaries. They do not track Presence or receive team channels there.
- **Who's online:** Presence on the workspace's class channel, keyed by user id. Used by the workspace sidebar, the auto-group roster, and `/teacher/accounts`.

Nothing live is kept in server memory any more. File saves emit `file:updated`. Live-share and invitation safety checks run on opening the screen, returning to the tab, and channel (re)connection; there is no 2-second polling timer.

## Module activities and saved projects

- `POST /api/classrooms/:id/modules/:moduleId/progress/activity` prepares the selected unlocked
  step's project. It combines supporting starter files, optional activity files and the student's
  optional preceding module project, keeping the current project's existing files.
- `POST .../progress/run` validates Java source paths, membership, cross-module prerequisites and live-week access,
  the activity's existence and its part's prerequisites. It saves the project, runs it through
  the existing rate/concurrency-limited Java runner, and writes pass/fail from the actual result.
  Demo mode never passes. A previous pass survives later failed practice runs.
- `PUT .../progress/project` accepts optional `updatedAt`; new editor clients must supply it so
  a stale tab cannot overwrite a newer project. A project changed while compiling cannot receive
  a result for the earlier source. Existing clients remain compatible.
- `GET .../modules/:moduleId` returns all content to the teacher. Students receive unlocked
  parts plus locked step placeholders, without future instructions, code, output or questions.
  Base supporting starter files are available to initialize the shared project. Completed parts
  stay accessible. Successful checks refresh the worksheet immediately without polling.
- Direct `PUT .../progress/step` code pass flags are refused. Old paper liplet writes remain
  compatible, but do not affect percentages or unlocking. Legacy challenge state keys (`<step id>:activity`) remain stored, but sample progression uses
  the sample step id and ignores those challenge passes.
- Completion counts passed activities plus the two existing performance-task submissions.
  Liplets are assessed on paper. The task opens after all lesson activities pass; its submission
  workflow is unchanged. Teacher availability writes remain teacher-only for older clients,
  but the old switches no longer control student access. No new database migration or live event.

## Two weekly Java projects (2026-10-20)

- The existing module activity endpoints now prepare/check the printed sample and sample step id,
  including optional sample stdin. Legacy challenge fields/results are retained.
- POST `.../progress/performance-project` initializes/reopens the personal working project from
  its own preceding week's draft (legacy own submission fallback), preserving current edits.
  PUT on that path saves valid, unique Java files with required `updatedAt`. Both require the
  current student/class membership, live-week access and completed module samples.
- Personal drafts use `performance_task.project.files`; sample/own submission snapshots are
  untouched by draft saves/runs. Existing own submission accepts optional `updatedAt` for the
  main editor's stale-tab protection. Old clients keep working. No new table or migration.
- Both tracks are scoped by student, class and module. Previous-week copies never modify the
  source week. The laptop compiles all files together offline; online uses the separate browser Java runner.

## Online Java (2026-10-20)

`GET /api/java-runner` requires sign-in. Local mode takes precedence over hosted
settings; otherwise a valid separate HTTPS `JAVA_RUNNER_URL` selects browser mode.
HTTP localhost is allowed for development. No configured runner gives a clear 503.
Legacy Judge0 remains optional. The existing local execution endpoint is unchanged.

`POST .../progress/browser-result` accepts stepId, updatedAt, success and output
(max 70,000 characters including limit diagnostics). It refuses local mode, validates
identity/class/Java step/part/live week and saved version, compares its own expected
output and retains earlier passes. It uses `recordSupabaseModuleActivityResult`,
also used by the laptop path. The teacher accepts browser result falsification for
practice; this is not grading. No browser-supplied expected output/pass flag is used.

## Explicit alteration tasks (2026-10-20)

The existing activity/run/browser-result/project routes also serve tasks with `activity.id`.
`activityTask` chooses server-owned task input/output; `activityStateId` uses `task:<id>` so
sample and legacy challenge passes cannot count. `activityAccess.openStepIds` enforces
individual prerequisites in opted-in modules; legacy modules retain part access. Student module
responses redact future task instructions/files/output while keeping their identity for status.
Current and previous project files still win over starter/sample/task templates. No migration,
runner change, new route, settings or live event.

Sample-first modules (`sampleFirst: true`, 2026-10-21) reuse the existing activity/run/browser-result
routes. Preparation snapshots the active step, resumes a saved draft or loads the new sample,
and preserves pre-update files. Project saves include `stepId` as well as `updatedAt`; both must
identify the current draft. The server selects the sample or task check from saved progress,
never a client pass flag or requested stage. Sample verification requires the unchanged supplied
step files and its declared result. Expected runtime errors compare the exception type across
laptop JVM / browser stack formats, separately from successful alteration execution. Result
responses add `check`, `sampleMatched` and the latest `passed`; prior completion stays monotonic.
History appears in progress responses only for opted-in modules, keeping old response shapes.

## Cross-module prerequisites (2026-10-21)

`module-prerequisites.ts` walks the declared predecessor chain and reuses `activityAccess` and
current activity ids to find the oldest unfinished module. `loadStudentModuleAccess` reads only
this class's modules and this student's class-scoped step states; it creates no progress rows.
`enforceStudentModuleAccess` guards every content/progress/project/submission path, including
activity preparation and both execution-result paths. Teacher previews bypass student gates.
Live access includes the active module's ancestors. Invalid/missing chains block safely.

Existing catalog replies may include `moduleAccess` (kind, message, and prerequisite moduleId/week).
A blocked request returns HTTP 403 with the same metadata beside `error`; `ApiError` preserves
it for the prominent banner and Continue action. Live-only cards remain disabled; prerequisite
cards open their explanation. Existing routes, database identities and saved work are retained.

## Subject module sharing (2026-10-22)

- `POST /api/classes` now requires `subject: "Java" | "Net MVC"` and sets `module_subject`.
- `GET /api/classrooms/:classroomId/module-sharing`: owner-only subject and saved-upload
  summaries, including subject match, whether content is already shared, and shared timestamp.
- `PATCH /api/classrooms/:classroomId/module-subject`: owner assigns `java` or `net-mvc` once.
- `POST /api/classrooms/:classroomId/modules/:moduleId/share`: shares a saved class upload;
  `expectedUpdatedAt` is required when explicitly replacing a shared version.
- Existing module list/read/upload/delete routes resolve the selected teacher/subject library;
  legacy unassigned classes keep their old read behavior. Dashboard and progress-summary reads
  use the same resolver. Availability remains class-specific for older clients.
- Source: `supabase-repository.ts` (`loadCourseModules`, `loadCourseModuleRow`,
  `getSupabaseModuleSharing`, `setSupabaseModuleSubject`, `shareSupabaseModule`), `routes.ts`.
