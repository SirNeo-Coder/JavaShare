-- module_id is free text from a module's own JSON file (docs/course-format.md), not unique
-- across classrooms - the same module_id string can legitimately be uploaded to two different
-- classrooms (course_modules is correctly keyed by (classroom_id, module_id)). A student who is a
-- member of two classrooms (supported today) could have progress on a same-named module in one
-- classroom leak into/collide with the other, since module_progress was only unique on
-- (student_id, module_id). Scope the row to its classroom too.
alter table public.module_progress drop constraint module_progress_student_id_module_id_key;
alter table public.module_progress add constraint module_progress_student_id_classroom_id_module_id_key
  unique (student_id, classroom_id, module_id);
