# CKB-001 — Login card still said "Collaborative Java classroom" after the rename

- Status: resolved
- First recorded: 2026-10-16
- Last verified: 2026-10-16
- Area: rename (stage one PR a), sign-in screen `AuthScreen` in `app/page.tsx`
- Search terms: login subtitle, Collaborative Java classroom, JavaShare leftover, old name, rename missed, sign-in card text

## Symptom

After renaming JavaShare to CodeShare, the sign-in card said "CodeShare", but the small line under it still read "Collaborative Java classroom". Found by opening the built login page in a browser during the PR (a) check.

## Root cause

The rename searched for "JavaShare". The subtitle never contained that word ("Java" and "classroom" separately), so the search missed it.

## Durable solution

The subtitle reads "Collaborative coding classroom", matching the page title "CodeShare — Collaborative Coding Classroom" in `app/layout.tsx`. When renaming or rebranding, also search for the old subject words (`Java classroom`, `Java project`), not only the old product name.

## Regression proof

- Display-only, checked on screen: the built login page showed "Collaborative coding classroom" (browser text search, 2026-10-16).
- No automated test: plain display text; a test would only repeat the string.
- Commit `ee95ef2` (PR #1).

## Recurrence triage

Search all of `app/` for "Java" next to "classroom" or "Share". Leave Java wording that really refers to Java files (the Java runner, Java file dialog) alone.

## History

- 2026-10-16 — Found while checking PR (a) in the browser; fixed before the PR was opened.
