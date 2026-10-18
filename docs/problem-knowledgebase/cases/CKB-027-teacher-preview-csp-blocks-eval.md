# CKB-027 — The teacher's web-project preview blocked eval()/Function(), unlike the student's own preview

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: app/teacherWebPreview.ts
- Search terms: teacher preview calculator does nothing, eval blocked in teacher preview, Run
  preview silent failure, student code works but teacher preview doesn't, Content-Security-Policy
  script-src eval

## Symptom

Found by a second-opinion code review (Claude Code) auditing stage-three item 5, not reported by a
teacher. `buildTeacherPreview`'s Content-Security-Policy gave `script-src` only `'unsafe-inline'`,
under `default-src 'none'`. That blocks `eval()`, `new Function(...)`, and string-form
`setTimeout`/`setInterval` in the teacher's **Run preview**, even though the exact same saved files
run those calls fine in the student's own preview (`app/webPreview.ts` adds no CSP at all).
`eval()`-based calculators are a common intro-JS exercise; a student's saved calculator would work
when they ran it, then silently do nothing when the teacher checked the same saved files.

## Root cause

The policy's stated and tested purpose was to stop the preview from making outbound network
requests (closing part of the gap CKB-022 documents as still open in the older student renderer).
`default-src 'none'` does stop that, but `script-src` without `'unsafe-eval'` also reaches into
pure in-browser script execution that has nothing to do with the network - a stricter policy than
the feature's own stated scope intended.

## Durable solution

`script-src` in `app/teacherWebPreview.ts`'s policy string is now `'unsafe-inline' 'unsafe-eval'`.
Network resources stay blocked (`default-src 'none'` plus the explicit `img-src`/`font-src`/
`base-uri`/`form-action` directives are unaffected by `script-src`); only the eval-family gap
closes, matching the student's unrestricted preview for in-browser script execution.

## Regression proof

- File: `tests/teacher-web-projects.test.mjs`.
- Exact test: "teacher web preview: allows eval/Function so a saved eval()-based calculator
  behaves the same as it does for the student". The pre-existing CSP-string assertion in "teacher
  web preview: blocks network resources..." was also updated to match the new `script-src` value.
- Command: `node --test tests/teacher-web-projects.test.mjs`.
- **Shown failing:** stashed the `app/teacherWebPreview.ts` change (keeping the updated tests in
  place) and reran; both assertions failed against the old policy string (one by exact regex
  mismatch, one by the explicit "script-src must allow eval" message). Restored the change: all
  teacher-web-project tests passed, including the three that need local Supabase.
- Full suite: `npm test` - 55/55 pass, no skips.
- This test checks the policy string only (building the HTML in Node, not executing it in a real
  browser) - the same level the file's existing CSP tests already use. Not independently verified
  by actually running an `eval()`-based page in the teacher's **Run preview** in a real browser
  this round.

## Recurrence triage

If a saved page behaves differently in the teacher's preview than it did for the student and the
difference isn't about network access, check the CSP's `script-src`/`style-src` directives first -
this is the second time a "block the network" policy here has needed a scope check (CKB-022
documents the student renderer's own remaining network gap, a different, still-open issue).

## History

- 2026-10-18 — Second-opinion audit of item 5 found the gap
  (`docs/handoffs/stage-three-item5-review-findings.md`); fixed on `codex/stage-three-review-fixes`
  after teacher approval.
