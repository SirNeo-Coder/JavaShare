# Stage three: second-opinion audit of item 5 (teacher web-project review)

**For Codex: read after teacher approval, not as part of other work.** Second-opinion review (by
Claude Code) of `ae234a6..HEAD` on `codex/teacher-web-projects` (commit `2623be1`) — the one item-5
commit, 20 files, `app/TeacherWebProjects.tsx`, `app/teacherWebPreview.ts`,
`backend/src/supabase-repository.ts`, `backend/src/routes.ts`, `app/CodeEditor.tsx`,
`app/Landing.tsx`, `app/globals.css` plus docs/tests. Line-by-line correctness, cross-file
breakage, auth/scoping, and conventions passes. Per `AGENTS.md`, any fix below still needs its own
before-code proposal and approval, and a `CKB-NNN` case once fixed.

## Confirmed bug

1. **`app/teacherWebPreview.ts:6`** — the Content-Security-Policy meta tag's `script-src` is
   `'unsafe-inline'` only (no `'unsafe-eval'`), under a `default-src 'none'`. That blocks
   `eval()`, `new Function(...)`, and string-form `setTimeout`/`setInterval` in the teacher's
   **Run preview**, even though the exact same saved files run those calls fine in the student's
   own unrestricted preview (`app/webPreview.ts` adds no CSP at all).
   - **Why this isn't just "blocking network":** the stated and tested intent (per
     `docs/knowledgebase/security-and-scoping.md`'s new line and the test named "blocks network
     resources") is to stop the preview from making outbound requests (CKB-022's gap). `default-src
     'none'` does that, but it also reaches into pure in-browser script execution, which network
     blocking was never meant to touch.
   - **Failure scenario:** `eval()`-based calculators are a common intro-JS exercise. A student
     saves one, it works when they run it themselves. The teacher opens **View web projects** →
     **Run preview** to check the same saved files: the calculator silently does nothing (or logs
     a CSP violation to the preview's own console only, via the browser's internal CSP reporting —
     not through this app's captured `console.error`, so nothing shows in the on-screen console
     panel either). The teacher reasonably concludes the student's code is broken; it isn't.
   - **Suggested fix:** add `'unsafe-eval'` to `script-src` in the policy string. Network resources
     stay blocked (that's `default-src`/`connect-src`/`img-src`/etc., unaffected by `script-src`);
     only the eval-family gap closes. One-word addition to the existing CSP string, same file.
   - **Not independently re-run against a live preview** (this sandbox's local-file preview
     doesn't execute embedded scripts, so this is argued from documented CSP semantics —
     `script-src` without `unsafe-eval` blocking `eval`/`Function`/string timers — not a
     browser-observed repro like the earlier items). Verify in a real browser before trusting this
     as the only check.

## Nothing else found

Auth/scoping (`teacherStudentWorkspace`'s membership + role + personal-team-ownership chain, the
list/detail routes' uuid validation and 404s for wrong class/student/project), the `CodeEditor`
`readOnly` Tab fix (CKB-020), reuse (no new abstraction, existing `CodeEditor`/`webPreview` reused
as-is), and conventions (no migration, no secret in browser code, no CDN, docs/knowledgebase and
`workflow-state.md` updated in the same commit) all checked clean. The two already-known,
already-documented gaps (CKB-021 direct file write, CKB-022 old renderer's network access) are
unchanged by this item and not re-flagged here.

## What this document is not

Second-opinion review, not a confirmed-and-fixed record. The one finding above still needs a
before-code proposal, teacher approval, and — once fixed — a `CKB-NNN` case with a regression test
shown failing before the fix and passing after.
