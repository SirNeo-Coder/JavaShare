# Security and scoping

## Sign-in

- Supabase Auth checks the password (`loginWithSupabase`). The server then sets its own cookie, `javashare_session`: a JWT signed with `JWT_SECRET`, valid for 7 days, `httpOnly`.
- The JWT carries `serverSessionId`, a random id made each time the server starts, so **restarting the server signs everyone out** on purpose.
- Socket.IO reads the same cookie on connect.
- Teacher password reset: the teacher approves; the student signs in with a blank password and must set a new one.

## The secret key

`SUPABASE_SERVICE_ROLE_KEY` is used only in `backend/src/database.ts`. It must never appear in `app/` or a `NEXT_PUBLIC_` variable. The browser has no Supabase session at all today.

## Who can see what

Checked in `supabase-repository.ts` (row-level security exists but the server bypasses it with the service-role key):

- `canAccessSupabaseClass`: teacher of the class, or a member.
- `canAccessSupabaseTeam`: team members; the teacher of the class; anyone in the class for the `teacher-demo` workspace.
- `canEditSupabaseTeamFile`: personal teams always; in groups, the leader, or members not locked by the leader.
- Live share drafts: only the teacher, only for the `teacher-demo` project.
- Web projects: only students create them, at most 20 personal projects each.
- File names: `backend/src/file-paths.ts` rejects names that don't fit the project language, plus `..` and hidden files.

## Web preview sandbox

`app/webPreview.ts` plus the iframe in `app/page.tsx`:

- `<iframe sandbox="allow-scripts" srcdoc=...>` **without** `allow-same-origin`. The page gets a blank, isolated origin: no access to the CodeShare cookie, page, or storage. This was verified in a browser on 2026-10-16.
- Linked project CSS and JS are inlined; `</script` and `</style` inside them are escaped so student code cannot break out of its tag.
- Console messages come back with `postMessage`. The parent accepts only messages whose source is the current preview frame.
- Known limit: an endless loop in student JavaScript can freeze that student's tab.

## Java runner

Local runner only when `LOCAL_JAVA_EXECUTION=true` and not production. It blocks file, network, process and system APIs by pattern, with a 10-second compile limit, 5-second run limit, 128 MB memory, 64 KB output, at most 2 runs at once, and 1.5 seconds between a student's runs. It is not a full security sandbox.
