# Stage three item 2: class-home verification

Verified 2026-10-18 on `codex/class-home`, based on `landing-pages` at `f01f709`.

## Results and limits

- **PASS:** all 35 automated tests, no failures or skips. Command: `sg docker -c 'npm test'`.
- **PASS:** `npm run build:all`, invoked by `sg docker -c 'npm run classroom:offline'` (Next.js production pages and backend TypeScript build).
- **PASS with warnings:** `npm run lint` — 0 errors, 9 existing warnings (two hook dependency warnings and seven image warnings). The test runner also printed existing module-type warnings for `app/realtime.ts` and `app/webPreview.ts`.
- **Environment retry:** the first sandboxed `npm run build:all` stopped at "Could not parse output from TypeScript's --showConfig." Running the same build through the approved offline launcher outside the sandbox passed. No application change was needed for that retry.
- **Offline limitation:** the launcher successfully configured local Supabase and built, then reused a pre-existing `npm run dev` on port 3000. It did not start a fresh production server. That server was left untouched. Browser verification used a separate production `next start` at port 3001, local Supabase values obtained from the launcher's same `supabase status` source, and `CODESHARE_LAPTOP=true` / local Java enabled. No hosted database or hosting settings were changed.
- **Not checked:** online/Cloudflare, Windows, another physical classroom device, other browser engines, mobile layout, or running with the computer's network physically disconnected.
- **No frontend unit-test harness exists.** This change moves existing data requests and controls into class home; interactive behavior was tested in the real browser, without adding a test framework or dependency. No new server code path was added. Existing API tests check permission and class isolation through the actual request handlers and local database; they do not click the UI.
- **Regression mutation proof:** CKB-010 and CKB-016 checks passed before editing and in the final full suite. Their prior fail-before/pass-after evidence is in the case files. They were not deliberately broken again here, and no automated fail-before/pass-after proof was performed for the new class-home screen.

## Real-app browser checks

Executed through the Codex in-app Chromium browser against the production build. All users/classes were disposable fixtures in local Supabase; no real student data was used. Each check below passed.

1. Teacher login shows **Classes** with two **Open class** buttons, without the old inline roster.
2. **Open class** for A shows that class's name, join code, **Modules**, **Upload module**, and **Students**, with only A's student.
3. Upload `tests/fixtures/sample-module.codeshare.json` from class home. Its Week 99 module appears, with preview and **Delete**.
4. Open the module as teacher. The preview says nothing is graded or saved. **Run** on the first Java step returns the laptop's actual `1`, `2`, `3` output. **Back to modules** returns to upload and list.
5. Student login shows the two class cards, with **Join another class**, without fetching/displaying module cards on the class list.
6. **Open class** for A shows **Your modules**, initially 0%. Opening a module leaves the class home behind the modal, without entering the live workspace. Student sees neither upload nor delete controls.
7. **Run & check** on the first step passes with real Java output; the module meter becomes 17%. **Close** returns directly to class home and its card now reads 17%.
8. Switch to B. It has a differently titled copy of the same module id, at 0%, rather than A's 17%.
9. Teacher opens B: its distinct two-student roster appears. **View module progress** on the common student shows B's module at 0%. Returning to A and opening that student's progress shows A's saved 17%.
10. **Enter classroom** works for both roles, with the selected class name and **Live classroom connected**. **Class home** returns each role to the same class. **Classes** returns to the two-card list. Teacher workspace no longer has the module-management button.
11. Student workspace **Modules** shortcut still opens the module list. Opening a module, **Back to modules**, then **Close** works; returning to class home still shows 17%.
12. Upload a malformed disposable JSON file: a format error appears on class home and existing modules remain.
13. Delete the disposable B module from teacher class home: B's list becomes empty. Open the stale B card in the student's other session: **Module not found** appears. **Close** refreshes the cards and shows the empty-class message.
14. Sign out of the teacher session after a workspace round-trip; sign in as a student in that same browser origin. It starts on **Classes**, with student controls, rather than reopening the teacher's selected class.
15. Inspect both class-home views visually using normal browser screenshots. Full-page captures misrendered the app's existing CSS zoom in this browser, so they were discarded and normal screenshots were used instead. Layout and DOM bounds fit the default viewport.

## Automated checks, grouped by file

Command for every file below: `sg docker -c 'npm test'`. Marks and names below are the runner's output.
The schema, preview, throttle, router-only, and knowledge-search checks test rules in isolation.
The route, course-module, landing, progress, and Realtime policy checks use actual handlers or
local Supabase. Browser checks above go through the complete rendered app.

### `tests/api-router.test.mjs`

```text
✔ router: path parameters, query, cookies, and JSON body reach the handler (32.918453ms)
✔ router: middleware passes on with next(), stops by responding, and next(error) reaches the error handler (2.396443ms)
✔ router: cookies, 204, unknown routes, bad JSON, and size limits (21.071338ms)
✔ router: the larger JSON body cap is scoped to the module-upload route, not every route (7.337942ms)
✔ routes: register, stay signed in with the cookie, get a live pass, sign out (327.844143ms)
✔ routes: a chat message's live signal finishes sending before the reply (CKB-006) (602.754071ms)
```

### `tests/course-module-schema.test.mjs`

```text
✔ course module schema: accepts a module matching docs/course-format.md (8.357944ms)
✔ course module schema: rejects a step missing expectedOutput (0.766907ms)
✔ course module schema: rejects an unknown course (0.471177ms)
✔ course module schema: rejects the wrong format tag (0.398266ms)
✔ course module schema: rejects a step id reused by another lesson's step (CKB-007's bug class, reachable at upload) (0.931968ms)
✔ course module schema: rejects a step id that collides with an exit slip's id (0.503458ms)
✔ course module schema: rejects a java step file path that /api/execute could never run (a space) (0.490397ms)
✔ course module schema: rejects a java step file path over /api/execute's 160-character cap (0.936417ms)
✔ course module schema: rejects an unrunnable .java performance-task file path (3.834637ms)
```

### `tests/course-modules.test.mjs`

```text
✔ course modules: teacher uploads, class members read, only the teacher may upload or delete (1240.598667ms)
```

### `tests/kb-search.test.mjs`

```text
✔ kb:search finds the matching bug record first (60.911511ms)
✔ kb:search says so when nothing matches (44.988043ms)
```

### `tests/landing-pages.test.mjs`

```text
✔ landing pages: class roster, a student's own module summary, and a teacher's view of a student's progress (1333.364676ms)
✔ class list and creation: a teacher creates classes, a student joins one, and one class's workspace never bleeds into another's (522.80911ms)
```

### `tests/module-progress.test.mjs`

```text
✔ module progress: step checklist, exit slip, and both performance-task versions (new feature, no prior CKB) (971.30356ms)
✔ module progress: two simultaneous first touches of a module don't 500 (write race) (316.033339ms)
✔ module progress: a module in two classrooms doesn't share one student's progress (classroom scoping) (359.979632ms)
✔ module progress: two simultaneous performance-task submissions don't lose one (write race) (237.024069ms)
```

### `tests/realtime.test.mjs`

```text
✔ offline: classroom devices reach local Supabase through the laptop's address (1.161808ms)
✔ throttle sends at most once per interval and never drops the newest value (81.807996ms)
✔ channel rules: members join, outsiders are refused, only the teacher broadcasts to the class (15282.340237ms)
✔ browser pass cannot read tables directly (3.52086ms)
```

### `tests/web-workspace.test.mjs`

```text
✔ inlines linked CSS and JavaScript, no external loads (3.087695ms)
✔ maps document lines back to the student's file and line (0.636134ms)
✔ capture script sits on the <head> line and does not shift lines (0.363024ms)
✔ works without <head>, and warns about missing files (0.492515ms)
✔ a </script> inside JavaScript cannot break out of the inlined script (0.357059ms)
✔ no index.html gives a friendly message (0.195496ms)
✔ file names must fit the project language (0.605116ms)
```

```text
ℹ tests 35
ℹ suites 0
ℹ pass 35
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```
