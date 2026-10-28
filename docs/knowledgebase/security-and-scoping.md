# Security and scoping

## Sign-in

- Supabase Auth checks the password (`loginWithSupabase`). The server sets `javashare_session`, a JWT (HS256, `jose`) signed with `JWT_SECRET`. Teachers expire after two hours without interaction; students after fifteen minutes. The signed `idleExpiresAt` and short cookie lifetime enforce inactivity in the shared server routes. The original seven-day absolute maximum is retained across renewals. Cookie flags remain `httpOnly`, `SameSite=Lax`, and `Secure` only over https (plain classroom HTTP must work); Render/Vercel use `Secure; SameSite=None` (`apiConfig.crossSiteCookies`).
- `POST /api/auth/activity` renews only a still-valid session; ordinary reads and live updates do not. Browser `sessionActivity.ts`, mounted once by `SessionActivity` in the root layout, reports trusted visible interaction at most once a minute, including the elapsed time since the last gesture. A one-minute warning tells users to save; expiry clears the cookie and reloads to sign-in, clearing editor/teacher-page state. Tabs share only a random session id and deadlines, never credentials or work. Old cookies lacking the inactivity deadline require a fresh sign-in. CKB-051 and `tests/session-{expiry,activity}.test.mjs` cover the rules.
- **A server restart does not itself sign people out** (decided 2026-10-16; Cloudflare runs many short-lived copies of the server). Current-format sessions stay valid within their signed deadlines when `JWT_SECRET` is unchanged; old seven-day cookies without an inactivity deadline require a new sign-in.
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

- The browser gets a pass (`GET /api/realtime/pass`) lasting at most one hour and no longer than the current inactivity deadline: a JWT with `sub` = user id and `role` = `authenticated`, signed with `SUPABASE_JWT_SECRET`. Renewal is attempted 5 minutes before expiry and cannot extend sign-in; sign-out removes live connections by reloading the page.
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
- Module web steps (2026-10-28, `app/WebStepRun.tsx`) reuse this preview. After the page loads and
  draws, the frame posts `{ codeshare: "page", title, text }`; uncaught errors carry `uncaught: true`.
  The parent accepts these only from its own current frame. Student code can forge them, so they are
  practice evidence only; the server still checks expected output, step access and saved versions.
  CKB-022 (network requests allowed) applies to module web steps too.
- Teacher **Mark done** (`markSupabaseTeacherCheckedStep`) checks class ownership, current student
  membership and that the step is a media step before writing a pass.
- Known limit: an endless loop in student JavaScript can freeze that student's tab.

## Java runner

Local runner only when `LOCAL_JAVA_EXECUTION=true` and either `NODE_ENV` is not production or `CODESHARE_LAPTOP=true` (set by the classroom launcher). Render (production) and Cloudflare never run it. It blocks file, network, process and system APIs by pattern, with a 10-second compile limit, 5-second run limit, 128 MB memory, 64 KB output, at most 2 runs at once, and 1.5 seconds between a student's runs. It is not a full security sandbox.

## Online browser Java (approved 2026-10-20)

`javaExecution.ts` rejects CodeShare's own origin, credentials and non-root runner
URLs. HTTPS is required except localhost development. Its frame has allow-scripts
and allow-same-origin **only on the separate public origin**. That origin hosts no
private app, sessions or Supabase keys. Browser and runner verify message source;
the parent also checks origin/run id, result types and output length. No source is
placed in URLs. Every run gets a fresh frame/Java state, removed on result or timeout. CheerpJ /files
persists locally, so the bridge removes prior interrupted run folders before compiling
new student code and removes the current folder on normal return/error.

Public runtime CSP allows only its own assets and CheerpJ's official runtime site,
including CheerpJ's required nested runtime frame. It does not enable top navigation,
popups or arbitrary network connections. Program execution stops after 5 seconds;
startup/compile stops after 120 seconds. Combined stdout/stderr is capped at 64 KB.
The teacher explicitly accepts browser evidence as falsifiable practice completion;
the authenticated server retains class, part, live-week, version and exact-output checks.
Offline rejects browser result reporting and never loads CheerpJ. See setup/verification.

Module prerequisite access (2026-10-21): every module content/progress/project/save/run/result/
submission path checks the student's class-scoped current activity passes across the complete
predecessor chain. No browser pass flag or progress percentage can substitute. Missing uploads
and cycles block access. Live class permits the active module's ancestors; teachers retain full
previews. Catalog metadata contains only the blocked module's reason and prerequisite identity.

## Shared subject modules (2026-10-22)

Class membership is still checked before module reads. Assigned-class library queries always
filter by that class’s `teacher_id` and `module_subject`; student claims never choose the owner
or subject. Subject selection, saved-upload inspection/sharing, uploads and deletion require the
class owner. New classes accept exactly Java or Net MVC. The app refuses subsequent subject
changes and checks the matching course family on upload/import; database constraints also prevent
a Java/.NET mismatch. Existing unassigned classes remain compatible for reads, but must choose
a subject before new uploads. Replacement imports require the current shared `updated_at` to
avoid overwriting a concurrent correction. All student progress queries retain their class key.

Prerequisite links resolve inside that same teacher/subject library. Completion is still looked
up by student and class; finishing a shared week in one class never opens it in another class.

Personal task review/submission (2026-10-23): browser success remains explicitly accepted practice
evidence, not a grade. Personal submission checks identity/class/module access, saved-version
freshness and a server-computed file hash; offline refuses browser claims. Teacher checklist
routes require class ownership and current student membership. A submission-specific id prevents
old review ticks from overwriting a resubmission. Frozen teacher-run files never use student-save
or completion routes. Existing class isolation, live restrictions and prerequisite checks remain.
