# Data model

Source: `supabase/migrations/` (the code is authoritative). Every table has row-level security on; the server uses the service-role key and checks permissions itself in `backend/src/supabase-repository.ts`.

| Table | Holds | Links |
| --- | --- | --- |
| `profiles` | Name, email, role (`teacher`/`student`), password-reset flags, `photo_path` | 1:1 with Supabase `auth.users` (created by trigger `handle_new_user`) |
| `classrooms` | Class name, subject, nullable `module_subject` (`java` or `net-mvc`, existing rows remain unassigned), `join_code`, `live_share_project_id`, `current_activity_id`, `chat_muted`, `active_module_id` (text, the teacher's weekly module pick - matches `course_modules.module_id`, not a foreign key, for the same reason `module_progress.module_id` isn't one; added by `20261018000600_module_weekly_active_and_shared_project.sql`) | `teacher_id` -> profiles |
| `classroom_members` | Who joined which class | classroom <-> profile |
| `teams` | A workspace: personal (`owner_id` set) or group (`owner_id` null); `slug` (`teacher-demo` = the teacher's lesson workspace, `student-<id>`, `group-...`); `leader_id`, `chat_muted`, `editing_locked` | `classroom_id` |
| `team_members` | Who is in which team | team <-> profile |
| `activities` | Teacher-assigned work: title, description, `mode` (`individual`/`group`), `starter_code`, `ended_at` | `classroom_id`, `created_by` |
| `projects` | A set of files: `title`, `description`, **`language`** (`java` default, `web`; added by `20261016000100_project_language.sql`) | `team_id`, `classroom_id`, optional `activity_id` (null = personal project) |
| `code_files` | One file: `path`, `language` (`java`, `html`, `css`, `javascript`), `content`, `version` | `project_id`; unique `(project_id, path)` |
| `file_versions` | The previous content saved at each version | `file_id`, `author_id` |
| `saved_works` | A student's named copy of all project files (JSON) | `project_id`, `owner_id` |
| `submissions` (+ `submission_credits`) | Immutable snapshot of files sent to the teacher; credits for group members | `project_id`, `team_id` |
| `messages` | Chat lines | `team_id` (classroom chat uses the `teacher-demo` team) |
| `group_leader_votes`, `group_member_permissions`, `activity_workspace_members` | Group leader votes, per-member mute/lock, activity roster snapshot | team / project |
| `module_progress` | A student's progress through one weekly course module (`docs/course-format.md`): `step_states` (jsonb, keyed by a legacy step block’s `id`, a new challenge’s derived `<step id>:activity`, **or** a legacy lesson’s `exitSlip.id` -> `pass`/`fail`; CKB-007 folded the exit slip into this instead of a separate whole-module flag, since a module can have several lessons each with its own exit slip), `performance_task` (jsonb, `{sample, own, project?}`, sample/own each `{files, status, submittedAt}`; optional `project: {files}` is the independent personal working draft, never a submission — the two tracked submissions: the sample/example code the student runs, and their own version), `project_files` (jsonb array of `{path, content}` — the student's one evolving project for the module, e.g. the same `Main.java` replaced step by step; separate from the two performance-task submissions; added by `20261018000600_module_weekly_active_and_shared_project.sql`). The server computes the goal meter from `step_states`/`performance_task` on read against all module activities plus task submissions, excluding paper liplets; it is not stored. Project saves from the new editor use `updated_at` to reject stale writes. `module_id` is the uploaded JSON file's own `id` field, rather than a foreign key | `student_id` -> profiles, `classroom_id` -> classrooms; unique on `(student_id, classroom_id, module_id)` (CKB-010) |
| `course_modules` | A weekly module file (`docs/course-format.md`) a teacher uploaded for a class, kept whole in `content` (jsonb). CodeShare never edits it, only replaces it whole on re-upload (same `module_id`), keeping the same database row (rule 2: ids never change, content can be corrected). `open_lesson_ids` (text array) and `performance_task_open` (boolean) retain legacy per-class teacher choices separately from `content` (student access now uses per-student activity completion instead); migration `20261018000500_module_availability.sql` opens existing modules and defaults new inserts to closed | `classroom_id` -> classrooms, `created_by` -> profiles; unique on `(classroom_id, module_id)` |

Notes:
- Since migration `20261016000200`, the `anon` and `authenticated` roles have no table privileges. Only the server (service role) reads and writes tables. Functions `can_join_realtime_topic` and `can_broadcast_realtime_topic` back the live-channel policies on `realtime.messages`.
- A student's personal team can hold several personal projects ("My Practice Code" plus web projects). Activity projects have `activity_id` set.
- Language values are free text on purpose so `csharp` and module languages need no schema change (see `../course-format.md`).

Sample-first addition (2026-10-21): `module_progress.activity_projects` is an additive JSON object
with optional `activeKey`, `drafts` (task completion key to that step's complete working file list),
and `beforeSampleFiles` (the pre-update working copy). `project_files` remains the active rolling
project so existing weekly carry-forward readers keep working. Saves update the active draft and
working copy together under the existing `updated_at` comparison. `step_states` also accepts
`sample:<activity.id>` for sample verification; only the existing task key completes an alteration.
The column is introduced by `20261021000100_module_activity_projects.sql`; older readers ignore it.

## Subject library addition (2026-10-22)

Migration `20261022000100_subject_module_library.sql` adds nullable `classrooms.module_subject`
without renaming existing subject labels. New classes require one subject; older classes choose
once through the teacher-only route.

`subject_modules` stores a single whole JSON module per `(teacher_id, subject, module_id)`, with
its own id and timestamps. Teacher deletion cascades; deleting a class does not remove a library.
The database restricts subjects/course families and enables row-level security, revoking direct
anonymous/authenticated access. Only server-side service-role access is granted.

Assigned classes resolve content through their owner and selected subject. Unassigned legacy
classes read `course_modules` as before; its rows remain original-upload backups after assignment.
Legacy availability changes remain in `course_modules`, separately per class. `module_progress`
keys and all student file/completion/submission fields are unchanged.
