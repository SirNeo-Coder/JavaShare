# Completion-only module practice setup

Status: implementation merged in PR #41; hosted database readiness must be checked.
On 2026-10-23 the teacher confirmed the summary function was missing and approved
applying this existing update. The teacher subsequently reports SQL success and
recovered Module loading (CKB-067), with all five function/permission readiness
values true; student saved-progress checks remain pending.
This guide is for the teacher; assistants do not change hosted services.

## Repair when Module shows Unexpected server error

Both `GET .../modules` and `GET .../modules/summary` use
`public.codeshare_module_summaries(uuid)`. Tables and table read permissions can
all exist while this required function is absent. CKB-067 records the teacher's
read-only check returning false. This differs from CKB-050 (missing tables) and
CKB-065 (a save terminated for CPU exhaustion).

Use the hosted project whose URL matches the Worker's `SUPABASE_URL`; compare it
yourself without sharing keys. First run this read-only prerequisite check:

```sql
select
  to_regclass('public.subject_modules') is not null as shared_modules_ready,
  exists (select 1 from information_schema.columns where table_schema = 'public'
    and table_name = 'classrooms' and column_name = 'module_subject') as class_subject_ready,
  exists (select 1 from information_schema.columns where table_schema = 'public'
    and table_name = 'module_progress' and column_name = 'project_files') as project_files_ready,
  exists (select 1 from information_schema.columns where table_schema = 'public'
    and table_name = 'module_progress' and column_name = 'activity_projects') as step_drafts_ready;
```

All four must be true. If any is false, retain the result and inspect the missing
prerequisite before applying SQL; do not rerun the old table-creation sequence.

When all four are true, use SQL Editor to run the **complete unchanged**
[existing migration](../supabase/migrations/20261022000200_module_access_summaries.sql).
Run it inside one transaction (`begin;`, then the complete file, then `commit;`)
so a failure cannot leave only one function installed. If it fails, retain the
error, run `rollback;` if the editor reports an aborted transaction, and stop.
The migration defines functions and their permissions; installing it does not
execute the completion function or update saved student work.

Run the five-value readiness check below. If all five are true, refresh CodeShare,
open the affected class's Module drawer as teacher and student, and verify both
module-list requests succeed. Run and complete an activity, reload, and check its
saved successful code and completion. If an error remains, inspect that invocation;
do not assume this also fixes the earlier CPU-limit incident. An already deployed
app can use the functions without another app build.

## Database first

Before deploying an app that uses the new module reads/completion checkpoint:

1. Open the hosted Supabase project used by CodeShare. Keep a normal database backup.
2. Open the SQL Editor and run the complete new file
   `supabase/migrations/20261022000200_module_access_summaries.sql`.
   Do not edit older migrations, reset the database or run supabase db push.
3. This adds two server-only functions. It creates no replacement tables and removes
   no accounts, classes, modules, progress, project files or submissions. Summaries
   are derived from current module JSON, not a second stored copy.
4. Run this read-only readiness check:

```sql
select to_regprocedure('public.codeshare_module_summaries(uuid)') is not null as summaries_ready,
       to_regprocedure('public.codeshare_complete_module_activity(uuid,uuid,text,timestamp with time zone,timestamp with time zone,jsonb,jsonb,jsonb)') is not null as completion_ready,
       has_function_privilege('service_role', 'public.codeshare_module_summaries(uuid)', 'EXECUTE') as server_can_read,
       not has_function_privilege('anon', 'public.codeshare_module_summaries(uuid)', 'EXECUTE') as anonymous_blocked,
       not has_function_privilege('authenticated', 'public.codeshare_module_summaries(uuid)', 'EXECUTE') as browser_role_blocked;
```

All five values must be true. Never paste keys or student data into chat.
The application checks membership/class ownership before using its server key.
The completion function also guards both project and module versions in the write.

## Rollout and rollback

Apply SQL before the new app is rolled out. The old app does not use these functions,
so they can be prepared first. The teacher reviews/merges the PR and uses the normal
build pipeline; assistants do not merge, deploy or change hosted settings.

Rollback the app to the previous reviewed version if needed. Leave these functions
in place: old routes and existing progress data remain compatible. Do not delete
student work or edit migration history to roll back.

## Acceptance after browser implementation is complete

Online Module project: open a sample, verify it, make unsuccessful alteration runs,
then complete it. Unfinished drafts/sample verification must remain on this device;
only a successful completion should send its code/results to the server. Reload and
check both local unfinished drafts and server-confirmed completions. Test another
account, another browser, duplicate retry and a changed module without losing work.
Personal projects/submission and the laptop/offline runner retain their existing paths.

A working public health read is not a CPU-budget test. Check the affected hosted
completion invocation and CPU time after rollout. Initial reads and sign-in activity
still use the server. Device storage clearing can remove unfinished local drafts.
