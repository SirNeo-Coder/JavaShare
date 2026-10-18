# Teacher setup: opening lessons to students

Stage-three item 4, branch `codex/lesson-availability`. This adds **Open to students** beside each
lesson and the performance task in the teacher's module preview. Newly uploaded modules start
closed. Existing modules stay open when the migration is first applied.

## Apply the database change before the new app

The assistant has tested this only against local Supabase. It has not changed your hosted
Supabase project, Cloudflare settings, or any live service.

1. Keep the existing app running while preparing the change. In Supabase, use the project's
   normal backup/export process to retain a recoverable copy of `course_modules` and
   `module_progress`, including the full JSON content and saved submissions.
2. Confirm the earlier module migrations have been applied, in order:
   `20261018000100_module_progress.sql`, `20261018000200_course_modules.sql`,
   `20261018000300_module_progress_exit_slip_fix.sql`, and
   `20261018000400_module_progress_scope_to_classroom.sql`.
3. Check that existing uploaded modules have distinct lesson ids. Older uploads were not checked for this (CKB-019); correct a duplicate-id file before using independent lesson switches. Do not rename ids automatically.
4. Open **SQL Editor** in your intended Supabase project. Open the new repository file
   [`20261018000500_module_availability.sql`](../supabase/migrations/20261018000500_module_availability.sql),
   copy the whole file into SQL Editor, check the project, then run it. Do not edit old migration
   files or run `supabase db push`.
5. Confirm the result succeeds. The transaction adds `open_lesson_ids` and
   `performance_task_open`, fills existing modules as open, and sets new-upload defaults to
   closed. It does not rewrite uploaded content or student progress. Normal module update
   timestamps can change. Repeating this same file preserves choices already made.
6. Inspect an existing `course_modules` row: its lesson ids should appear in `open_lesson_ids`;
   `performance_task_open` should be true only if the uploaded content has a performance task.
   Compare content/progress with your retained copy. No new secret or browser setting is needed.
7. Review and deploy the app through the normal branch/preview process, after the SQL succeeds.
   If SQL fails, keep the prior app and inspect the reported error; do not deploy the new app
   against a database missing these columns. This work is stacked on the earlier stage-three PRs.

## Check with a teacher and a student

1. In a disposable class, upload `tests/fixtures/sample-module.codeshare.json`. Open it as the
   teacher: all three **Open to students** checkboxes start unchecked, while all content remains
   available in the teacher preview.
2. As a student in that class, open the module. There should be two lesson titles and the task
   title, each with **Not open yet**, no code editors, and **0%** progress.
3. As the teacher, open Monday only. The student closes/reopens the module; Monday appears,
   Tuesday and the task remain closed. **Run & check** prints `1`, `2`, `3` on separate lines and
   saves **17%** of the whole module (offline uses the laptop's Java).
4. Close Monday as the teacher. An already-open student copy keeps its displayed content, but
   further progress saves show **This lesson is not open yet**. Closing/reopening hides the
   content and keeps **17%**. Reopening Monday restores **Passed**.
5. Open the performance task independently. Submit **Sample code**: the meter becomes **33%**.
   Closing the task refuses new submissions and preserves the saved one.
6. Reupload a correction using the same ids: choices and progress remain. A newly added lesson
   id starts closed. Use a different class with the same file to check that choices/progress
   remain independent.

Students refresh availability by closing and reopening the module. There is no automatic
availability refresh or schedule. Closing cannot remove a copy of content already received.
The meter includes every requirement, including closed lessons. Adding requirements can reduce
the percentage without deleting any completed work. The viewer still has its existing draft
limits; this change does not add persistent draft storage.

## Rollback without deleting work

The migration only adds columns. The previous server still reads the original JSON and the
previous writer omits the new columns, so the existing upload/read/progress paths remain usable.
If you roll back the app, leave these columns and their values in place. **The previous app does
not enforce the switches and will show all content again**, as it did before this feature.
Uploads made through that older app after the migration still get closed defaults, which take
effect when the new app returns. Existing choices and student progress remain for rolling forward.
Do not drop columns, reset the database, or rewrite progress to roll back the app.

Verification: [full test and browser evidence](verification/stage-three-lesson-availability.md).
Hosted deployment, Windows, and another physical device have not been tested by the assistant.
