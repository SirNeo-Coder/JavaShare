-- Live features (typing, cursors, chat signals, live share, who's online) use Supabase Realtime
-- private channels. Browsers join with a short-lived pass the CodeShare server signs for the
-- signed-in user. These policies decide who may join (receive) and send on each channel:
--   team:<team id>   members of that team (plus the class teacher); for the Teacher Demo
--                    workspace, everyone in its class (it carries classroom chat)
--   class:<class id> class members receive and announce presence; only the class teacher
--                    may broadcast (activity started, live share typing, ...)
-- The CodeShare server sends its own broadcasts with the service-role key, which bypasses these.

create or replace function public.can_join_realtime_topic(topic text)
returns boolean
language plpgsql
stable
security definer set search_path = ''
as $$
declare
  target uuid;
begin
  if topic ~ '^team:[0-9a-f-]{36}$' then
    target := substring(topic from 6)::uuid;
    return public.is_team_member(target) or exists (
      select 1 from public.teams t
      where t.id = target and t.slug = 'teacher-demo' and public.is_classroom_member(t.classroom_id)
    );
  end if;
  if topic ~ '^class:[0-9a-f-]{36}$' then
    target := substring(topic from 7)::uuid;
    return public.is_classroom_member(target) or public.is_classroom_teacher(target);
  end if;
  return false;
end;
$$;

create or replace function public.can_broadcast_realtime_topic(topic text)
returns boolean
language plpgsql
stable
security definer set search_path = ''
as $$
begin
  if topic ~ '^team:[0-9a-f-]{36}$' then
    return public.can_join_realtime_topic(topic);
  end if;
  if topic ~ '^class:[0-9a-f-]{36}$' then
    return public.is_classroom_teacher(substring(topic from 7)::uuid);
  end if;
  return false;
end;
$$;

create policy "codeshare members receive their channels"
  on realtime.messages for select to authenticated
  using (public.can_join_realtime_topic((select realtime.topic())));

create policy "codeshare members send on their channels"
  on realtime.messages for insert to authenticated
  with check (
    (realtime.messages.extension = 'presence' and public.can_join_realtime_topic((select realtime.topic())))
    or (realtime.messages.extension = 'broadcast' and public.can_broadcast_realtime_topic((select realtime.topic())))
  );

-- The browser's pass is only for live channels. CodeShare's pages never read or write tables
-- directly (everything goes through the server), so remove the old direct-table permissions.
revoke all privileges on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
