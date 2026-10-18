# Stage three: second-opinion audit of items 1–3

**For Codex: read this after item 5 (teacher sees student web projects) is finished and verified
— not before, and not as part of item 5's own work.** This is a separate piece of work: fixing
issues found in already-shipped items 1–3 (class list, class home, live-class invitation). Each
one still needs the normal before-code proposal and teacher approval per `AGENTS.md` before any
code changes — this document is what that proposal should be checked against.

## Where this came from

A second-opinion review (by the teacher's other coding assistant, Claude Code) of the combined
diff `landing-pages...codex/live-class-invitation` (PRs #9 and #10 — items 2 and 3). Seven
independent review passes (line-by-line correctness, removed-behavior audit, cross-file
breakage, reuse, simplification/efficiency, architecture-depth, and AGENTS.md conventions), with
the top findings independently re-verified against the actual code afterward. The conventions
pass found no violations (migrations, secrets, renamed data, CKB record completeness, and
workflow-state.md were all clean).

## Confirmed bugs (verified directly against the code)

1. **`app/page.tsx:554`** — the session-expiry auto-logout path (`loadWorkspace`'s catch block
   for `"Sign in required"`/`"Session expired"`) resets `user`/`data` but not
   `enteredClassroomId`, `homeClassroomId`, `dismissedLiveSessions`, or `modulesOpen` — unlike the
   explicit `logout()` function, which resets all four.
   - **Failure scenario:** shared classroom computer. Student A's session expires while
     `enteredClassroomId` is set to class A. Student B signs in on the same tab (no reload).
     `loadWorkspace()` immediately requests `/api/bootstrap?classroomId=A` using the stale id —
     if B isn't in class A, that 403s and B is stuck instead of seeing their own class list. If B
     *is* in class A, B also inherits A's leftover `dismissedLiveSessions` entry, silently
     suppressing a live-class invitation B should see.
   - **Suggested fix:** add the same four resets to that catch branch.

2. **`app/realtime.ts:54`** — `channelCleanup` is one module-global promise chain, not scoped per
   topic or per client. Every `realtimeClient()` call awaits the *entire* chain regardless of
   whether its own channels are involved, and `forgetRealtimeClient()` (sign-out) never touches
   or resets it.
   - **Failure scenario:** any `releaseRealtimeChannels` call anywhere in the app makes every
     other unrelated `realtimeClient()` caller wait on that teardown. A fast sign-out-then-sign-in
     on a shared computer makes the new user's first `realtimeClient()` call await a stale
     cleanup chain tied to the previous user's already-discarded client.
   - **Suggested fix:** scope the lock per topic (e.g. `Map<topic, Promise<void>>`), and have
     `forgetRealtimeClient()` clear/replace it on sign-out.

3. **`app/Landing.tsx:258`** — `selectedModuleId` lives in the parent `Landing` component, above
   the `key={classroom.id}` remount boundary, so it isn't reset when the user switches classrooms
   via the keyboard — the module overlay has no focus trap or Escape handler, so the "Classes"
   button is still keyboard-reachable while a module is open.
   - **Failure scenario:** a student opens a module in class A, tabs to "Classes" (bypassing the
     overlay with the keyboard, not the mouse), opens class B — `StudentModules` mounts for B
     with `selectedModuleId` still holding A's module id, skips fetching B's own module list, and
     opens `ModuleViewer` against `GET /api/classrooms/B/modules/<A's id>` directly. At best a
     confusing "module not found"; at worst B's own differently-titled module that happens to
     reuse the same id (a case the project's own verification notes say is realistic).
   - **Suggested fix:** reset `selectedModuleId` to `null` whenever `selectedClassroomId` changes.

4. **`app/Landing.tsx:266`** — `enterClassroom()` calls `onDismissLiveClasses([item])`
   synchronously, before `onEnter`'s resulting classroom-scoped workspace load has actually
   succeeded.
   - **Failure scenario:** a student clicks "Join live class" on a flaky connection; the
     invitation is marked dismissed immediately, but the scoped bootstrap fetch then fails or
     hangs, leaving them stuck on "Preparing your classroom…" with no back button. They'd need a
     full page reload (which resets *all* dismissals) to see that invitation again.
   - **Suggested fix:** only dismiss after `onEnter` succeeds, or revert the dismissal on failure.

## Needs a judgment call, not a one-line fix

5. **`backend/src/supabase-repository.ts:258`** — a live session's identity is the reused
   `current_activity_id` / `live_share_project_id`, not a real session marker. The documented gap
   ("a restart missed while disconnected keeps the same id") also fires while fully *connected*,
   whenever a teacher clicks End then Reopen within a couple seconds — not mentioned anywhere.
   The real fix (a persisted session-start marker) is architectural; at minimum, the docs should
   stop implying "disconnected" is the only trigger.

6. **`app/Landing.tsx:271`** — right after a student returns from the live workspace to class
   home, the invitation listener briefly subscribes to only the one classroom just exited, until
   the follow-up unscoped class-list fetch resolves. Self-healing today (the next focus/reconnect
   re-checks), but worth deciding whether to harden (keep the old subscription alive until the
   new list loads, instead of swapping).

7. **`app/ModuleViewer.tsx:442`** — Upload/Delete now require `embedded && role==="teacher"`, not
   just role — an undocumented precondition the `Props` type doesn't enforce. Unreachable today
   (every non-embedded caller passes `role="student"`), but a trap for whoever builds the next
   teacher-facing module entry point (possibly item 5 itself, or future work). Decide: gate on
   role alone and let callers suppress visually, or keep `embedded` but document/type the
   precondition so it can't be silently dropped.

## Cleanup (optional, not urgent)

8. **`app/Landing.tsx:309`** vs **`app/page.tsx`** — the tab-focus/visibility-change refresh
   listener is written twice (near-identical `addEventListener("focus"/"visibilitychange")` +
   cleanup) instead of shared via one helper in `app/realtime.ts`.
9. **`app/Landing.tsx:44`** — `LiveBadge` still derives "is this class live" from
   `classroom.hasActivity || classroom.hasLiveShare`, a second encoding of the same condition the
   new `liveSessionId` field was introduced to capture once. Use `Boolean(classroom.liveSessionId)`
   instead.
10. **`app/page.tsx:1752`** — the "record a dismissal" map-building logic is inline in `page.tsx`
    instead of living next to its sibling helpers (`pendingLiveClasses`, `retainLiveDismissals`)
    in `app/liveClasses.ts`.

## What this document is not

This is a second-opinion review, not a confirmed-and-fixed bug record. Per `AGENTS.md`, each item
above that gets fixed still needs: a before-code proposal (current understanding, suspected
approach, files, tests, workflow-change classification), explicit teacher approval, and — for
items 1–4, which are real bugs — a numbered `CKB-NNN` case once fixed, with a regression test
shown failing before the fix and passing after.
