# Online multi-file Java

Updated 2026-10-20. Branch `codex/online-multifile-java`, based on weekly projects
PR #20 (`b925043`). Worktree `/home/ireneo/.codex/worktrees/weekly-java-projects/JavaShare`.
The original checkout's unrelated unfinished merge must remain untouched.

## Teacher decisions

Online execution approved next. Browser-reported CheerpJ success/output is approved
practice evidence, acknowledged falsifiable in developer tools and not grading.
Separate public Java runner address approved as a workflow change, extra Cloudflare
setup by teacher. Prepare files and guide only; never merge/deploy/change hosted services.

## Implemented

Shared browser runner reaches practice/class Java, module/personal Java and teacher
previews. GET /api/java-runner picks laptop first, browser when a valid separate URL
is configured, legacy Judge0 otherwise, or a clear unavailable response. No secret
is sent to the runner. It uses Java 8/CheerpJ 4.3; Java 9+ features remain unsupported
online. Offline keeps installed javac. Source folders/packages, supporting files,
input, errors, stdout/stderr, output and time limits are supported.

Public assets-only Worker is in java-runtime. OpenJDK compiler subset, matching
source, checksums and licence notices included. CodeShare bridge source/JAR and
manual rebuild script included. Per-run frame isolation resets loaded classes and threads; the bridge clears abandoned
run folders before any new student class executes. CheerpJ logo is locally served. Teacher guide:
docs/online-java-setup.md. No new dependency or migration.

Module browser-result route enforces identity/class/part/live week and latest saved
version, then compares server-owned sample output. Failed execution cannot pass;
earlier completion is retained. Offline refuses browser evidence. Personal runs do
not submit or advance module samples. Existing submission action remains separate.

## Verification and delivery

Complete: production build passed; full suite 115/115 passed, 0 failed/skipped;
lint 0 errors/8 existing warnings. Static Worker dry run passed (no bindings, no deploy).
Actual browser Run code returned Hello CodeShare; three-file module OOP sample
Capacity: 20 passed and unlocked the next part; countdown passed; five-file personal
package/inheritance/input project returned My saved personal week 14: 27. Endless
loop stopped after 5 seconds, then a correct run succeeded. Public runner policy
and flat source transfer bugs were observed before fixes (CKB-047/048).

Three deliberate regressions failed (runtime frame policy, nested string paths,
stale saved version), then restored checks passed. Real offline production build
on isolated port 3005 ran laptop Java with no CheerpJ frame/logo, despite configured
online and unusable Judge0 addresses. Offline launcher profile check passed. The
teacher's existing server on port 3000 was left running; exact full launcher on that
port and disconnected-internet/multiple Wi-Fi devices were not tested.
All test names/commands/levels: docs/verification/online-multifile-java.md.

Implementation `8af5b90` is committed and pushed. [PR #21](https://github.com/SirNeo-Coder/JavaShare/pull/21)
targets codex/weekly-java-projects (PR #20 remains open). Teacher reviews #20 before
the stacked online change, then
follows docs/online-java-setup.md. Hosted deployment/setup, preview end-to-end and
real classroom Wi-Fi devices remain teacher checks. No hosted settings were changed.
