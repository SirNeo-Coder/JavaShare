-- Share with class (teacher, 2026-11-10): the module step the teacher is discussing. Every class member
-- gets that step's fresh sample, whatever their own progress. Never saved as student work. null = not sharing.
alter table public.classrooms add column if not exists shared_module_id text;
alter table public.classrooms add column if not exists shared_step_id text;
