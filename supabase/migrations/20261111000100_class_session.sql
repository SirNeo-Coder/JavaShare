-- Class session (teacher, 2026-11-10): Enter classroom starts it, End session or 30 minutes without the
-- teacher's interaction ends it. seen_at is the teacher's last interaction; null = no session.
-- module/page/step: the worksheet page the teacher has open, which students follow (step = open through).
alter table public.classrooms add column if not exists session_started_at timestamptz;
alter table public.classrooms add column if not exists session_seen_at timestamptz;
alter table public.classrooms add column if not exists session_module_id text;
alter table public.classrooms add column if not exists session_page text;
alter table public.classrooms add column if not exists session_step_id text;
