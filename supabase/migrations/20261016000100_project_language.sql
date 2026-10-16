-- Each project records what kind of code it holds, so CodeShare knows how to run it.
-- 'java' runs on the classroom Java runner; 'web' (HTML/CSS/JavaScript) runs in the student's browser.
-- Kept as free text (no check constraint) so future languages such as 'csharp' need no schema change.
alter table public.projects
  add column if not exists language text not null default 'java';
