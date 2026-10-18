-- Availability belongs to a class's uploaded module, never to the source JSON file.
-- Existing modules stay open; inserts after this migration start closed. Re-running this
-- file only backfills NULL values, so it cannot reopen settings a teacher already changed.
begin;
alter table public.course_modules add column if not exists open_lesson_ids text[];
alter table public.course_modules add column if not exists performance_task_open boolean;

update public.course_modules
set open_lesson_ids = array(select lesson->>'id' from jsonb_array_elements(content->'lessons') as lesson)
where open_lesson_ids is null;
update public.course_modules
set performance_task_open = content ? 'performanceTask'
where performance_task_open is null;

alter table public.course_modules alter column open_lesson_ids set default '{}';
alter table public.course_modules alter column open_lesson_ids set not null;
alter table public.course_modules alter column performance_task_open set default false;
alter table public.course_modules alter column performance_task_open set not null;
commit;
