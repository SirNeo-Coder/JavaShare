-- Keep code, discussion and expected output out of prerequisite/catalog reads.
create or replace function public.codeshare_module_summaries(p_classroom_id uuid)
returns table (module_id text, content jsonb, created_at timestamptz, updated_at timestamptz)
language sql stable security invoker set search_path = public
as $$
  with modules as (
    select m.module_id, m.content, m.created_at, m.updated_at
    from public.classrooms c
    join public.subject_modules m on m.teacher_id = c.teacher_id and m.subject = c.module_subject
    where c.id = p_classroom_id and c.module_subject is not null
    union all
    select m.module_id, m.content, m.created_at, m.updated_at
    from public.classrooms c
    join public.course_modules m on m.classroom_id = c.id
    where c.id = p_classroom_id and c.module_subject is null
  )
  select m.module_id, jsonb_strip_nulls(jsonb_build_object(
    'id', m.content->'id', 'title', m.content->'title', 'course', m.content->'course',
    'week', m.content->'week', 'previousModuleId', m.content->'previousModuleId',
    'hasPerformanceTask', m.content ? 'performanceTask',
    'requiredActivityIds', coalesce((
      select jsonb_agg(case when step->'activity'->>'id' is not null
        then 'task:' || (step->'activity'->>'id') else step->>'id' end order by ordinal)
      from jsonb_array_elements(jsonb_path_query_array(m.content,
        '$.lessons[*].blocks[*] ? (@.type == "step")')) with ordinality as steps(step, ordinal)
    ), '[]'::jsonb)
  )), m.created_at, m.updated_at
  from modules m order by m.created_at desc, m.module_id;
$$;

revoke all on function public.codeshare_module_summaries(uuid) from public, anon, authenticated;
grant execute on function public.codeshare_module_summaries(uuid) to service_role;

-- The server validates output; the database guards both source and project versions.
create or replace function public.codeshare_complete_module_activity(
  p_classroom_id uuid, p_student_id uuid, p_module_id text,
  p_progress_version timestamptz, p_module_version timestamptz,
  p_files jsonb, p_states jsonb, p_projects jsonb
) returns setof public.module_progress
language sql security invoker set search_path = public
as $$
  update public.module_progress p
  set project_files = p_files, step_states = p_states, activity_projects = p_projects
  where p.classroom_id = p_classroom_id and p.student_id = p_student_id
    and p.module_id = p_module_id and p.updated_at = p_progress_version
    and exists (
      select 1 from public.classrooms c
      where c.id = p_classroom_id and (
        (c.module_subject is not null and exists (
          select 1 from public.subject_modules m where m.teacher_id = c.teacher_id
          and m.subject = c.module_subject and m.module_id = p_module_id and m.updated_at = p_module_version
        )) or (c.module_subject is null and exists (
          select 1 from public.course_modules m where m.classroom_id = c.id
          and m.module_id = p_module_id and m.updated_at = p_module_version
        ))
      )
    )
  returning p.*;
$$;
revoke all on function public.codeshare_complete_module_activity(uuid, uuid, text, timestamptz, timestamptz, jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.codeshare_complete_module_activity(uuid, uuid, text, timestamptz, timestamptz, jsonb, jsonb, jsonb) to service_role;
