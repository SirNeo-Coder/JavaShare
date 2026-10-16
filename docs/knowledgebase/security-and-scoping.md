# Security and scoping

## Sign-in

- Supabase Auth checks the password (`loginWithSupabase`). The server then sets its own cookie, `javashare_session`: a JWT (HS256, `jose`) signed with `JWT_SECRET`, valid for 7 days, `httpOnly`, `SameSite=Lax`, and `Secure` only over https (plain http on the classroom network must still work). Behind Render with pages on Vercel: `Secure; SameSite=None` (`apiConfig.crossSiteCookies`).
- **A server restart no longer signs people out** (decided 2026-10-16; Cloudflare runs many short-lived copies of the server). Cookies issued before PR c2 stay valid when `JWT_SECRET` is unchanged.
- Request bodies: JSON up to 300 KB, images up to 2 MB (`backend/src/router.ts`).
- Teacher password reset: the teacher approves; the student signs in with a blank password and must set a new one.

## The secret key

`SUPABASE_SERVICE_ROLE_KEY` is used only in `backend/src/database.ts` and `backend/src/realtime.ts`. `SUPABASE_JWT_SECRET` (which signs live passes) is used only in `backend/src/realtime.ts`. Neither may appear in `app/` or a `NEXT_PUBLIC_` variable.

## Who can see what

Checked in `supabase-repository.ts` (row-level security exists but the server bypasses it with the service-role key):

- `canAccessSupabaseClass`: teacher of the class, or a member.
- `canAccessSupabaseTeam`: team members; the teacher of the class; anyone in the class for the `teacher-demo` workspace.
- `canEditSupabaseTeamFile`: personal teams always; in groups, the leader, or members not locked by the leader.
- Live share drafts: only the teacher, only for the `teacher-demo` project.
- Web projects: only students create them, at most 20 personal projects each.
- File names: `backend/src/file-paths.ts` rejects names that don't fit the project language, plus `..` and hidden files.

## Live channels (PR c1)

- The browser gets a one-hour pass (`GET /api/realtime/pass`): a JWT with `sub` = user id and `role` = `authenticated`, signed with `SUPABASE_JWT_SECRET`. It is renewed 5 minutes before expiry, and forgotten on sign-out.
- Policies on `realtime.messages`, using `can_join_realtime_topic` and `can_broadcast_realtime_topic`:
  - **team channel:** team members and the class teacher join and send; for `teacher-demo` (classroom chat), every class member.
  - **class channel:** members join and announce presence; **only the class teacher broadcasts**.
- The same migration **revokes all direct table access** from `anon` and `authenticated`, so the pass can't read or change tables (tested: `403`, code `42501`).
- Coarser than before: channels check membership only. Typing from a member the group leader locked is ignored by receivers (`app/page.tsx`), and saving is still fully checked by the server. Sender names in typing messages come from the sender's browser.
- Tests: `tests/realtime.test.mjs` (needs local Supabase). Both rule checks were shown to fail when the rule was weakened.

## Web preview sandbox

`app/webPreview.ts` plus the iframe in `app/page.tsx`:

- `<iframe sandbox="allow-scripts" srcdoc=...>` **without** `allow-same-origin`. The page gets a blank, isolated origin: no access to the CodeShare cookie, page, or storage. This was verified in a browser on 2026-10-16.
- Linked project CSS and JS are inlined; `</script` and `</style` inside them are escaped so student code cannot break out of its tag.
- Console messages come back with `postMessage`. The parent accepts only messages whose source is the current preview frame.
- Known limit: an endless loop in student JavaScript can freeze that student's tab.

## Java runner

Local runner only when `LOCAL_JAVA_EXECUTION=true` and either `NODE_ENV` is not production or `CODESHARE_LAPTOP=true` (set by the classroom launcher). Render (production) and Cloudflare never run it. It blocks file, network, process and system APIs by pattern, with a 10-second compile limit, 5-second run limit, 128 MB memory, 64 KB output, at most 2 runs at once, and 1.5 seconds between a student's runs. It is not a full security sandbox.
