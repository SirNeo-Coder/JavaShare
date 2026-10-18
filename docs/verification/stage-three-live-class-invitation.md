# Stage three item 3: live-class invitation verification

Verified 2026-10-18 on `codex/live-class-invitation`, based on class-home commit `4e6fa27`.

## Results, expected failure, and limits

- **PASS:** `sg docker -c 'npm test'`: **39/39**, zero failures/skips. This includes four new invitation tests and expanded class-summary assertions in the existing landing integration test.
- **PASS:** `sg docker -c 'npm run build:all'`: production Next.js and backend TypeScript builds, after the last application change.
- **PASS with warnings:** `npm run lint`: **0 errors, 9 existing warnings**, two hook-dependency warnings and seven image warnings. Node also prints existing module-type warnings when importing application TypeScript in tests.
- **PASS:** prior CKB-006/016 evidence was reused first: `sg docker -c 'node --test --test-concurrency=1 tests/landing-pages.test.mjs tests/api-router.test.mjs'` passed 8/8 before editing.
- **EXPECTED FAIL, then restored PASS:** removed `await channelCleanup` temporarily; the new handoff test failed at `a new screen must wait for the old subscription to leave`, `true !== false`. Restored it and ran all four new tests successfully. Final full suite passes with the wait present. No mutation was left in the source.
- **Offline limit:** `sg docker -c 'npm run classroom:offline'` configured local Supabase and built successfully, then reused an existing dev server on port 3000. That server was left untouched. Browser checks used separate production `next start` on 3001, with the same local Supabase configuration source and laptop Java enabled. A disposable 3002 server tested pass unavailability and recovery. A fresh launcher-owned production instance on 3000 was not tested.
- **Not verified:** Cloudflare/online, Windows, mobile layout, a second physical device, other browser engines, or physically disconnecting the network. Reconnect callbacks are unit-tested; real browser recovery used a deliberately unavailable live-pass endpoint rather than a forced socket outage. Browser resource timing was unavailable through the testing API, so idle request counts were not measured; the code has no repeating status timer.
- **Known behavior:** dismissal lasts while this page is open and survives workspace round trips, but resets on reload/sign-out. It uses current activity/project ids. A same-id activity/presentation stopped and restarted entirely while disconnected may remain dismissed; a persisted session-start marker would be needed to distinguish it. No schema change was added for this edge case.
- **Levels:** invitation filtering, dismissal, callback handling, and the SDK channel handoff have unit tests. Existing API handlers and local Supabase test class membership, summary data, and channel policies. Real browser checks cover the rendered popup, keyboard dismissal, module deferral, navigation, and recovery. No frontend component-testing framework was added.

## Real-app checks

All accounts/classes were disposable fixtures in local Supabase. A teacher used `127.0.0.1:3001`;
a student used `localhost:3001` for a separate cookie session. Activity setup also used the
existing teacher-only API through a local fixture script. No hosted services were changed.
Each check below passed; core invitation/deferral/join/dismissal and error recovery were repeated
after the final build and a server restart/reload.

1. With neither class live, student sign-in shows two class cards without a popup. Teacher class list also has no invitation popup.
2. In the teacher's class-A workspace, **Present this code** triggers **Your class is live** for the student on Classes, without reloading. Initial focus is on **Join live class: Class Home A**.
3. **Not now** leaves the student on Classes with **Live now**. Re-sending the same presentation announcement leaves the popup dismissed (dialog count 0).
4. **Stop presenting** removes the live badge. Starting a later session can invite again.
5. Student opens class B's module and edits a textarea. Start activities in A and B. The module stays open, its draft remains intact, its class badge updates, and invitation count remains 0.
6. **Close** on the module shows one invitation containing both A and B. The student chooses B and gets B's workspace and activity, **Live classroom connected**, and no browser console errors.
7. Run the activity's Java code offline: actual laptop output is `Live class`. Return through **Class home**: only A is offered, not B again.
8. Escape dismisses A. Another Enter classroom → Class home round trip shows no repeated invitation for either dismissed session.
9. Sign out and back in while A and B remain live: both appear immediately in the invitation, confirming initial snapshot detection and dismissal reset.
10. End the two activities through the teacher API: their invitations disappear, and after the last ends the popup closes automatically and live badges clear.
11. Run a temporary local production server on 3002 with `SUPABASE_JWT_SECRET` absent. The student sees **Live invitations are unavailable. You can still enter a classroom.** and **Reconnect**; class cards remain usable.
12. Restore that disposable server's normal local live-pass configuration, click **Reconnect**, and confirm the error disappears without a page reload. Start a fresh teacher presentation: the recovered listener receives its invitation. Stopping removes it.
13. On the final build, repeat open-module deferral with two classes, choose A this time, and verify A's connected workspace. Return home: only B is offered; dismiss it and round-trip again without repeated popups or console errors.
14. Repeatedly inspect the teacher view: it has no invitation dialog. Teacher workspace showed the student Offline while the student was only listening on the class list; the listener unit test also rejects any attempt to track Presence or broadcast.

## Automated checks by file

Command for all files below: `sg docker -c 'npm test'`. Marks, names, and timings are the runner's output.

### `tests/api-router.test.mjs`

```text
✔ router: path parameters, query, cookies, and JSON body reach the handler (25.20998ms)
✔ router: middleware passes on with next(), stops by responding, and next(error) reaches the error handler (1.245186ms)
✔ router: cookies, 204, unknown routes, bad JSON, and size limits (12.840072ms)
✔ router: the larger JSON body cap is scoped to the module-upload route, not every route (6.479882ms)
✔ routes: register, stay signed in with the cookie, get a live pass, sign out (328.23149ms)
✔ routes: a chat message's live signal finishes sending before the reply (CKB-006) (539.375538ms)
```

### `tests/course-module-schema.test.mjs`

```text
✔ course module schema: accepts a module matching docs/course-format.md (7.607777ms)
✔ course module schema: rejects a step missing expectedOutput (0.703499ms)
✔ course module schema: rejects an unknown course (0.382593ms)
✔ course module schema: rejects the wrong format tag (0.384957ms)
✔ course module schema: rejects a step id reused by another lesson's step (CKB-007's bug class, reachable at upload) (0.706266ms)
✔ course module schema: rejects a step id that collides with an exit slip's id (0.418715ms)
✔ course module schema: rejects a java step file path that /api/execute could never run (a space) (0.605034ms)
✔ course module schema: rejects a java step file path over /api/execute's 160-character cap (0.570836ms)
✔ course module schema: rejects an unrunnable .java performance-task file path (0.563823ms)
```

### `tests/course-modules.test.mjs`

```text
✔ course modules: teacher uploads, class members read, only the teacher may upload or delete (1034.287843ms)
```

### `tests/kb-search.test.mjs`

```text
✔ kb:search finds the matching bug record first (64.178796ms)
✔ kb:search says so when nothing matches (43.792976ms)
```

### `tests/landing-pages.test.mjs`

```text
✔ landing pages: class roster, a student's own module summary, and a teacher's view of a student's progress (1132.848881ms)
✔ class list and creation: a teacher creates classes, a student joins one, and one class's workspace never bleeds into another's (554.953335ms)
```

### `tests/live-classes.test.mjs`

```text
✔ live invitations: all live classes are offered, dismissal hides only that session, and a new activity invites again (1.814825ms)
✔ live invitations: refresh preserves dismissal, ending a session clears it, and a stopped presentation can invite again (0.38709ms)
✔ live invitations: receive-only listeners refresh on start, stop, and reconnect; cleanup removes their channels and ignores late events (0.783765ms)
✔ live invitations: entering or leaving the workspace waits for old channels to close before reusing their topics (51.524418ms)
```

### `tests/module-progress.test.mjs`

```text
✔ module progress: step checklist, exit slip, and both performance-task versions (new feature, no prior CKB) (853.488518ms)
✔ module progress: two simultaneous first touches of a module don't 500 (write race) (225.041919ms)
✔ module progress: a module in two classrooms doesn't share one student's progress (classroom scoping) (361.628183ms)
✔ module progress: two simultaneous performance-task submissions don't lose one (write race) (225.470265ms)
```

### `tests/realtime.test.mjs`

```text
✔ offline: classroom devices reach local Supabase through the laptop's address (0.850887ms)
✔ throttle sends at most once per interval and never drops the newest value (80.271545ms)
✔ channel rules: members join, outsiders are refused, only the teacher broadcasts to the class (15247.019036ms)
✔ browser pass cannot read tables directly (3.389754ms)
```

### `tests/web-workspace.test.mjs`

```text
✔ inlines linked CSS and JavaScript, no external loads (2.17939ms)
✔ maps document lines back to the student's file and line (0.448776ms)
✔ capture script sits on the <head> line and does not shift lines (0.294821ms)
✔ works without <head>, and warns about missing files (0.235196ms)
✔ a </script> inside JavaScript cannot break out of the inlined script (0.233051ms)
✔ no index.html gives a friendly message (0.131116ms)
✔ file names must fit the project language (1.282908ms)
```

```text
ℹ tests 39
ℹ suites 0
ℹ pass 39
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

## CKB-017 mutation proof

Command with the wait deliberately removed:
`sg docker -c 'node --test --test-name-pattern="waits for old channels" tests/live-classes.test.mjs'`.

```text
✖ live invitations: entering or leaving the workspace waits for old channels to close before reusing their topics
AssertionError [ERR_ASSERTION]: a new screen must wait for the old subscription to leave
true !== false
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

Restored `await channelCleanup`. Command: `sg docker -c 'node --test tests/live-classes.test.mjs'`.
All four invitation tests passed, then the final full suite passed 39/39. The test uses the
installed SDK's real reuse/removal behavior without opening a socket; the browser round trips
above provide the end-to-end check. See [CKB-017](../problem-knowledgebase/cases/CKB-017-live-channel-screen-handoff.md).
