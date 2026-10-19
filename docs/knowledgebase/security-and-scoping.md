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
- Modules: only the class teacher changes availability; class members read them. Student responses omit closed lesson/task content server-side. Progress writes require an uploaded module and a known step/exit slip in an open lesson, or an existing open performance task. Closing preserves prior work and cannot revoke content already loaded. `tests/module-availability.test.mjs` checks student/foreign-teacher refusal, filtering, direct-save guards, and class separation (CKB-018/019).
- Web projects: only students create them, at most 20 personal projects each. New teacher review GET routes verify the class owner, current student membership, personal team owner, project class, web language, and absence of an activity. Lists omit file content; detail fetches only that project. Repeated reads do not save.
- **Open issue CKB-021:** the older `PUT /api/files/:fileId` allows the class teacher to overwrite a student file via a direct request. The new viewer has read-only fields and GET routes, but does not repair this existing server write-permission gap. Reproduced only with disposable local data; separate approval needed for permission changes.
- File names: `backend/src/file-paths.ts` rejects names that don't fit the project language, plus `..` and hidden files.

## Teacher class progress dashboard

`GET /api/classes/:classroomId/module-progress` requires a signed-in teacher and verifies class
ownership before reading the roster, modules, or progress. Every progress page filters by class.
Only current students and existing uploaded modules contribute to figures. Replies contain counts
and percentages, without student source files or raw progress maps. Reads do not create progress.

## Live channels (PR c1)

- The browser gets a one-hour pass (`GET /api/realtime/pass`): a JWT with `sub` = user id and `role` = `authenticated`, signed with `SUPABASE_JWT_SECRET`. It is renewed 5 minutes before expiry, and forgotten on sign-out.
- Policies on `realtime.messages`, using `can_join_realtime_topic` and `can_broadcast_realtime_topic`:
  - **team channel:** team members and the class teacher join and send; for `teacher-demo` (classroom chat), every class member.
  - **class channel:** members join and announce presence; **only the class teacher broadcasts**.
- On the class list and class home, student invitations only receive class announcements; they neither send broadcasts nor announce Presence. The existing membership policies still apply. Server summaries, not broadcast payloads, determine whether a class is live. Channels are released before a new screen reuses their topics (CKB-017), tracked per topic rather than one chain for the whole app, and cleared on sign-out so a next sign-in never waits on a discarded client's teardown (CKB-024).
- The same migration **revokes all direct table access** from `anon` and `authenticated`, so the pass can't read or change tables (tested: `403`, code `42501`).
- Coarser than before: channels check membership only. Typing from a member the group leader locked is ignored by receivers (`app/page.tsx`), and saving is still fully checked by the server. Sender names in typing messages come from the sender's browser.
- Tests: `tests/realtime.test.mjs` (needs local Supabase). Both rule checks were shown to fail when the rule was weakened.

## Web preview sandbox

`app/webPreview.ts` plus the iframe in `app/page.tsx`:

- `<iframe sandbox="allow-scripts" srcdoc=...>` **without** `allow-same-origin`. The page gets a blank, isolated origin: no access to the CodeShare cookie, page, or storage. This was verified in a browser on 2026-10-16.
- Linked project CSS and JS are inlined; `</script` and `</style` inside them are escaped so student code cannot break out of its tag.
- Console messages come back with `postMessage`. The parent accepts only messages whose source is the current preview frame.
- Teacher review uses `buildTeacherPreview` (`app/teacherWebPreview.ts`) to prepend a Content Security Policy before student code, on the same source line. It blocks network resources, forms, and base URLs while permitting inline project scripts/styles and `eval`/`Function` (CKB-027: the policy's `script-src` must stay as permissive about in-browser script execution as the student's own unrestricted preview - only network access is meant to differ). Parent message handling checks the current iframe, accepted console kinds, text type, and caps output. **Run preview** is explicit, and **Refresh** removes the prior frame. The existing student renderer is unchanged. **Open issue CKB-022:** that older path permits network requests; the sandbox alone does not block them. This was reproduced against a local counter, and is not repaired by the teacher-only wrapper.
- Known limit: an endless loop in student JavaScript can freeze that student's tab.

## Java runner

Local runner only when `LOCAL_JAVA_EXECUTION=true` and either `NODE_ENV` is not production or `CODESHARE_LAPTOP=true` (set by the classroom launcher). Render (production) and Cloudflare never run it. It blocks file, network, process and system APIs by pattern, with a 10-second compile limit, 5-second run limit, 128 MB memory, 64 KB output, at most 2 runs at once, and 1.5 seconds between a student's runs. It is not a full security sandbox.
