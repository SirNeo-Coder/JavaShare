# Backend (server)

All in `backend/src/`: `routes.ts` (every route, sign-in, the Java endpoint; `handleApi` takes a web `Request`), `router.ts` (the tiny Express-style router), `java-runner.ts` (the laptop JDK runner, loaded only when allowed), `realtime.ts` (`broadcast` live signals, `realtimePass` for browsers), `server.ts` (Express wrapper for Render only). Next.js calls `handleApi` from `app/api/[...path]/route.ts`. Backend files import each other with `.ts` extensions; `tsc` rewrites them to `.js` for Render., `supabase-repository.ts` (every database read and write plus permission checks), `database.ts` (Supabase clients, `DATABASE_MODE`), `file-paths.ts` (file-name rules per project language).

## Routes (`routes.ts`)

| Area | Routes |
| --- | --- |
| Health | `GET /api/health` |
| Live channels | `GET /api/realtime/pass` (one-hour pass for Supabase Realtime; 503 if `SUPABASE_JWT_SECRET` is missing), `POST /api/classes/:id/arrive` (called when a page opens a class; places a late student into a group) |
| Sign-in | `POST /api/auth/register` (first account ever becomes the teacher and gets starter class `JAVA101`), `login`, `forgot-password`, `logout`, `GET /api/auth/me`, `POST /api/auth/change-reset-password` |
| Teacher admin | `GET /api/teacher/students` (also returns `classroomIds` for the live "Online" status), `POST .../:studentId/reset-password`, `PATCH`/`DELETE /api/teacher/students/:studentId`, `PUT .../photo`, `PUT /api/teacher/profile/photo`, `GET /api/teacher/activity-summary` |
| Classes | `POST /api/classes` (teacher-only, creates an additional class with its own join code), `POST /api/classes/join`, `GET /api/bootstrap` (no `classroomId`: the class list only, no workspace data; with `?classroomId=`: that one class's full workspace, scoped so no other classroom's teams/activities can appear), `POST /api/classes/:id/auto-group`, activities (`POST .../activities`, `end-activity`, `.../reopen`, `DELETE`), `PUT .../chat-mute`, `GET`/`POST .../live-share`, `POST .../web-projects` (students only) |
| Teams | `GET`/`POST /api/teams/:id/messages`, `PUT .../group-profile`, `PUT .../group-permissions` |
| Files and projects | `PUT /api/files/:id` (save; needs matching `version` for groups), `PATCH /api/files/:id` (rename), `POST /api/projects/:id/files`, `POST .../submit`, saved work (`GET`/`POST .../saved-work`, `PUT /api/saved-work/:id`, `POST .../restore`), `GET /api/submissions` |
| Java | `POST /api/execute` |

## Live events (Supabase Realtime, since PR c1)

Private channels `team:<teamId>` and `class:<classroomId>` (policies in `supabase/migrations/20261016000200_realtime_private_channels.sql`). Browser code in `app/page.tsx` (the live effect) and `app/realtime.ts`.

- **Server to browsers** (`broadcast()` in `backend/src/realtime.ts`, after the request succeeds; always `await` it before replying, or Cloudflare drops it, CKB-006):
  - class channel: `class:live-share`, `class:live-share-update`, `class:activity-deployed`, `class:activity-ended`, `class:chat-muted`, `groups:updated`
  - team channel: `chat:message`, `file:updated`, `team:submitted`, `team:profile-updated`, `team:permissions-updated`
- **Browser to browsers** (sent directly on the channel; capped):
  - team: `team:file-operation` (typing; 3 a second), `team:cursor` (4 a second), `team:active-file`, `team:sync-request` (a newcomer asks), answered with `team:active-file` and `team:live-snapshots` (unsaved typing)
  - class (teacher only): `class:live-share-draft` (2 a second)
- **Who's online:** Presence on the class channel, keyed by user id. Used by the workspace sidebar, the auto-group roster, and `/teacher/accounts`.

Nothing live is kept in server memory any more. A missed message is covered by saving (`file:updated`) and the 2-second live-share check in `app/page.tsx`.
