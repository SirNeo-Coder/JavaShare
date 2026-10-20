# Interactive online Java

Updated 2026-10-20. Branch: codex/online-java-interactive-input.
Worktree: /home/ireneo/.codex/worktrees/online-java-interactive-input/JavaShare.
Base: main after PR #21 (ec90c56). The original checkout's unfinished merge is untouched.

## Approved decisions

The teacher approved this as an online workflow change, then explicitly requested
commit/push/merge. Teacher demos, normal classroom Java and personal performance projects
wait for answers while running. Module checks retain supplied sample input. Offline
retains laptop javac and input-before-Run. No new database migration or dependency.
Hosted settings remain teacher-managed; a merge can trigger the configured automatic builds.

## Done

Implemented streaming output, repeated live input, blank/Unicode answers, Stop,
cumulative five-second execution budget excluding waiting, two-minute idle wait,
existing input/output caps, authenticated per-run/per-question messages and cleanup.
An older public runner produces a clear refresh/update message while independent builds settle.
Shared Console behavior is in app/useJavaConsole.ts; Java protocol is app/javaExecution.ts
and java-runtime/public/runner.js. Rebuilt Java 8 helper matches vendor/java/CodeShareJava.java.

No earlier problem case matched. CKB-049 records the fixed-input stream, disabled input
box and result-only output as the verified cause. A temporary diagnostic reproduced
NoSuchElementException with no pre-entered input and success with Neo supplied beforehand.

## Verification

Production build passed; lint: zero errors/eight existing warnings.
Full suite: 125 passed, zero failed/cancelled/skipped. Runner dry-run passed, no bindings/deploy. Regression disabled live-input handling:
new test failed; restored protocol checks passed. Full test names and commands:
../verification/online-java-interactive-input.md.

Real production app/local Supabase and actual CheerpJ:
- Teacher: two files, three successive answers including Unicode and blank, correct output.
- Stop during a question and endless-loop timeout worked; the following correct run recovered.
- Module: JSON input 14 gave Sample: 14 and passed; next sample passed and unlocked
  personal work. Personal input Neo then 27 gave Hello, Neo: 27, with progress still 50%
  and both submission slots empty.
- Offline production on isolated port 3008 returned Laptop: 7 with laptop javac,
  no CheerpJ logo/frame, despite a configured online runner URL. Offline profile ready.
- Existing server on port 3000 left alone. Local runner on 3007 used a command-line
  compatibility-date override (2026-10-19) because the installed binary did not support
  2026-10-20. The committed/hosted configuration was unchanged.

## Delivery and remaining teacher checks

Implementation commit: 7930d79, committed and pushed. Pull request:
https://github.com/SirNeo-Coder/JavaShare/pull/22 (the PR is the authoritative merge status).
The teacher explicitly authorized merge into main. All feature work and required local
verification are complete: build passed, 125/125 tests, zero lint errors/eight existing
warnings, static Worker dry-run and regression failure/restoration proof.

Both Workers already follow main. After the PR merge, check the codeshare and
codeshare-java automatic production builds, then refresh hosted CodeShare and repeat
Run -> prompt -> Enter answer. No hosted setting change is needed.
If the app deploys before the runner, its temporary update message means to wait for
the separate runner build and refresh again.

Hosted interactive flow, disconnected internet, Windows and another Wi-Fi device remain
unverified. Offline remains input-before-Run by the approved scope. Local test servers
and disposable fixtures are cleaned up after browser verification; port 3000 is untouched.
