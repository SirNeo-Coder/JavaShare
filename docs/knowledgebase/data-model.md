# Data model

Source: `supabase/migrations/` (the code is authoritative). Every table has row-level security on; the server uses the service-role key and checks permissions itself in `backend/src/supabase-repository.ts`.

| Table | Holds | Links |
| --- | --- | --- |
| `profiles` | Name, email, role (`teacher`/`student`), password-reset flags, `photo_path` | 1:1 with Supabase `auth.users` (created by trigger `handle_new_user`) |
| `classrooms` | Class name, subject, `join_code`, `live_share_project_id`, `current_activity_id`, `chat_muted` | `teacher_id` -> profiles |
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
| `module_progress` | A student's progress through one weekly course module (`docs/course-format.md`): `step_states` (jsonb, stepId -> `pass`/`fail`), `exit_slip_done`, `performance_task` (jsonb, `{sample, own}`, each `{files, status, submittedAt}` — the two tracked submissions: the sample/example code the student runs, and their own version). The goal meter and checklist are computed from this on read, not stored. `module_id` is the module file's own `id` field (modules are JSON files, not database rows) | `student_id` -> profiles, `classroom_id` -> classrooms; unique on `(student_id, module_id)` |

Notes:
- Since migration `20261016000200`, the `anon` and `authenticated` roles have no table privileges. Only the server (service role) reads and writes tables. Functions `can_join_realtime_topic` and `can_broadcast_realtime_topic` back the live-channel policies on `realtime.messages`.
- A student's personal team can hold several personal projects ("My Practice Code" plus web projects). Activity projects have `activity_id` set.
- Language values are free text on purpose so `csharp` and module languages need no schema change (see `../course-format.md`).
