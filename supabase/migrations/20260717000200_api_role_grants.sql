-- Tables created through SQL migrations need explicit API-role privileges.
-- RLS still determines which rows authenticated browser clients may access;
-- service_role is reserved for the JavaShare backend and bypasses RLS.
grant usage on schema public to anon, authenticated, service_role;

grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

grant select on table
  public.profiles,
  public.classrooms,
  public.classroom_members,
  public.teams,
  public.team_members,
  public.activities,
  public.projects,
  public.code_files,
  public.messages
to authenticated;

grant update on table public.code_files to authenticated;
grant insert on table public.messages to authenticated;

alter default privileges in schema public
  grant all privileges on tables to service_role;
alter default privileges in schema public
  grant all privileges on sequences to service_role;
alter default privileges in schema public
  grant execute on functions to service_role;
