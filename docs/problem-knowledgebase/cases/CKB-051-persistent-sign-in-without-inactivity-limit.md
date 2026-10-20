# CKB-051 — Restored browser kept classroom access after hours away

- Status: resolved locally; deployment pending
- First recorded: 2026-10-20
- Last verified: 2026-10-20
- Area: shared sign-in routes, live passes, root browser activity monitor
- Search terms: idle logout, inactivity, public computer cafe, Brave restore, laptop shutdown, still signed in after hours

## Symptom

The teacher reopened Brave after hours away and a laptop shutdown and could still open
the classroom. The requested policy is two hours idle for teachers and fifteen minutes for students.

## Root cause

The previous documented design issued a seven-day cookie and seven-day signed token.
`requireAuth` checked that token's expiry but had no separate inactivity deadline.
No browser activity monitor existed. This was expected under the previous design,
but did not meet the teacher's public-computer requirement. CKB-023 only clears state
after an already-expired session and does not address when expiry occurs.

## Durable solution

`setSession` signs a role-specific `idleExpiresAt` and limits cookie lifetime to it.
`requireAuth` rejects expired inactivity deadlines, including before any data access,
and refuses legacy tokens without a deadline. Only authenticated `/api/auth/activity`
renews it, preserving the random session id and seven-day absolute maximum. It accounts
for the elapsed time since the browser gesture; reads and live events cannot renew it.
Live passes cannot outlast the inactivity deadline.

The root `SessionActivity` watches trusted interaction in visible pages, including teacher
pages, with at most one renewal a minute. Shared browser metadata keeps tabs in sync.
Timers and visibility/focus/pageshow checks handle suspension without resetting the clock.
A one-minute warning asks users to save; expiry hides old data, clears the cookie and
reloads to sign-in. An account change in another tab reloads old data without signing
the new account out. No student work or credentials are stored in this metadata.

## Regression proof

- `tests/session-expiry.test.mjs`: **session: student expires at fifteen minutes and teacher at two hours, despite background reads (CKB-051)**.
- `tests/session-activity.test.mjs`: **idle browser: a five-hour suspension expires before the returning gesture can renew**; other tests cover warnings, real gestures, shared tabs, cleanup and connection failures.
- Removing the server idle check made the expiry regression fail. Restoring it passed all five server tests.
- Skipping browser expiry made its assertions fail. Restoring it passed all browser-controller tests, including the later warning/continue and delayed-timer regressions.
- Commands and full named results: [session verification](../../verification/session-inactivity.md).
- Implementation commit: `b24c89c`, [PR #24](https://github.com/SirNeo-Coder/JavaShare/pull/24).
- Isolated rule/controller tests use a controlled clock; real-app evidence and untested areas are recorded separately there.

## Recurrence triage

Check the signed inactivity deadline and server time, not just the seven-day JWT expiry.
Verify a background `/auth/me`, bootstrap or live-pass request returns no renewed cookie.
Only trusted user interaction should call `/auth/activity`. Reopening a tab must read
the existing server deadline before allowing renewal. Check every page through the root layout.

## History

- 2026-10-20 — Teacher reported restored Brave access and chose teacher two-hour/student fifteen-minute limits for public computers. Also removed CodeShare's workflow/adjustment classification question; normal proposal approval and workflow documentation remain.
- 2026-10-20 — Teacher explicitly requested merge/push to main. PR #24 merged as `34b83bb`; main delivery confirmed. Only documentation conflicts needed resolution; application code matches the tested implementation. Hosted deployment and Brave re-test remain unverified.
