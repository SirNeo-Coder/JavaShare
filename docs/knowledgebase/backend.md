# Backend (server)

All in `backend/src/`: `server.ts` (routes, sign-in, Socket.IO, Java runner), `supabase-repository.ts` (every database read and write plus permission checks), `database.ts` (Supabase clients, `DATABASE_MODE`), `file-paths.ts` (file-name rules per project language).

## Routes (`server.ts`)

| Area | Routes |
| --- | --- |
| Health | `GET /api/health` |
| Sign-in | `POST /api/auth/register` (first account ever becomes the teacher and gets starter class `JAVA101`), `login`, `forgot-password`, `logout`, `GET /api/auth/me`, `POST /api/auth/change-reset-password` |
| Teacher admin | `GET /api/teacher/students`, `POST .../:studentId/reset-password`, `PATCH`/`DELETE /api/teacher/students/:studentId`, `PUT .../photo`, `PUT /api/teacher/profile/photo`, `GET /api/teacher/activity-summary` |
| Classes | `POST /api/classes/join`, `GET /api/bootstrap` (everything a screen needs), `POST /api/classes/:id/auto-group`, activities (`POST .../activities`, `end-activity`, `.../reopen`, `DELETE`), `PUT .../chat-mute`, `GET`/`POST .../live-share`, `POST .../web-projects` (students only) |
| Teams | `GET`/`POST /api/teams/:id/messages`, `PUT .../group-profile`, `PUT .../group-permissions` |
| Files and projects | `PUT /api/files/:id` (save; needs matching `version` for groups), `PATCH /api/files/:id` (rename), `POST /api/projects/:id/files`, `POST .../submit`, saved work (`GET`/`POST .../saved-work`, `PUT /api/saved-work/:id`, `POST .../restore`), `GET /api/submissions` |
| Java | `POST /api/execute` |

## Live events (Socket.IO, `server.ts`)

Rooms: `class:<classroomId>` and `team:<teamId>`. Sign-in is read from the session cookie on connect.

- **Browser to server:** `class:join`, `team:join`, `team:file-draft`, `team:file-operation` (typing as edit operations), `team:cursor`, `team:active-file`, `class:live-share-draft`.
- **Server to browser:** `class:presence`, `class:presence-snapshot`, `class:live-share`, `class:live-share-update`, `class:live-share-draft`, `class:activity-deployed`, `class:activity-ended`, `class:chat-muted`, `groups:updated`, `group:late-assigned`, `chat:message`, `file:updated`, `team:file-draft`, `team:file-operation`, `team:live-snapshots`, `team:cursor`, `team:active-file`, `team:permissions-updated`, `team:profile-updated`, `team:submitted`.

**Kept in server memory only** (lost on restart; matters for the Cloudflare move): who is online, latest unsaved live text per file, each student's active file, per-file operation order.
