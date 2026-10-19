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
| Java | `POST /api/execute` |

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

## Module availability

`getSupabaseModule` returns full content to the class teacher. Students receive open lessons, closed lesson title stubs, and either the open performance task or its title stub. Closed instructions, questions, expected output and supplied code are withheld server-side, including top-level starter files. Original JSON stays intact.

Progress reads/writes require an uploaded module; step writes also require a real step/exit-slip id in an open lesson, and task writes require an existing open task (CKB-018). Progress replies include `percent` from the whole module and `updatedAt`; the viewer ignores older save replies. Closing content preserves progress and submissions. Availability updates retry against `updated_at` so concurrent teacher tabs retain separate switch changes. No new live event: students close and reopen the module to refresh availability.
