# Sample-first module setup

The reviewed change adds automatic sample loading, sample verification, step working copies and
visible result banners. Deploy the app and upload its revised JSON together. Existing completions
and personal submissions are retained. This guide prepares hosted work for the teacher; Codex
does not apply hosted SQL, deploy, or change hosted settings.

## Hosted rollout by the teacher

1. Review the pull request and confirm the Supabase project matches CodeShare's configured
   `SUPABASE_URL`. Keep your normal database backup before rollout.
2. In that project's SQL Editor, run the complete new file
   `supabase/migrations/20261021000100_module_activity_projects.sql` once. It adds only one column;
   it does not rewrite existing drafts, completion records, or submissions. Existing migrations
   must not be edited or rerun as a replacement for this file. Never use `supabase db push`.
3. Confirm the new column exists:

   ```sql
   select column_name, data_type, is_nullable
   from information_schema.columns
   where table_schema = 'public' and table_name = 'module_progress'
     and column_name = 'activity_projects';
   ```

   Expect one row: `activity_projects`, `jsonb`, `NO`.
4. Deploy the reviewed app through your usual review process. Then use **Curriculum**, **Add module**
   to upload the revised JSON for Weeks 12, 13 and 14 from `docs/modules/week12/`, `week13/`
   and `week14/`, in that order, to the intended class. Module/lesson/step ids stay unchanged.
   Revised Week 12/13 exercises have new `-v2` task ids; their old results stay stored but cannot
   complete changed requirements. These files opt into `sampleFirst`; older JSON keeps its old flow.
5. Reload the teacher and student browsers. As a student, open an unfinished step with **Work in
   code editor**. The sample loads; **Run code** first shows **Sample verified** and keeps the next
   step locked. Make **Your task** changes and run again: **Completed** appears and saves immediately.
   Reopen both steps to confirm their code resumes. Step 8 shows **Expected error observed** before
   its alteration. An unchanged second run shows **Still showing sample output**.

## Local rollout

The new migration was applied to local Supabase for verification without resetting the database.
Rebuild/restart the local classroom app before testing; an already running production process can
still serve its previous build. Upload the revised JSON in the local class too. Local accounts,
classes, modules and progress remain separate from hosted data. Offline always runs laptop `javac`.

## Recovery and compatibility

Reopening a started step resumes its latest saved working copy. The editor also exposes
**Work saved before sample loading**, which preserves source files that predated step history;
copy those sources if recovering legacy edits whose step identity was not previously recorded.
Saved completions never claim that an old sample was verified, and old task passes are retained.
New clients include a step identity and saved version; a stale tab is refused instead of replacing
another step's files. Reload a refused tab. Personal drafts and submitted versions remain separate.

If reverting the app, leave the additive column and its data in place. Older app readers still
use `project_files`, `step_states` and `performance_task`; the migration preservation test verifies
that shape. Restore the previously reviewed JSON too if reverting its teaching workflow. Do not
remove the history column or clear progress to roll back. Hosted behavior, Windows and a physical
Wi-Fi student device must be checked by the teacher after rollout.

## Resume check

Finish Week 12 DAY 1 Steps 1 and 2. Reload, open Module, and select Week 12 again: the worksheet
must show DAY 2 · Step 3 immediately, with the inheritance sample in the main editor. Reopening
Step 1 must recover its earlier edits. After all steps pass, the worksheet opens the personal
performance task. Saving or running that personal project remains separate from submission.
