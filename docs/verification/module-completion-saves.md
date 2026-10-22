# Module work saves only when a task succeeds

Branch: `codex/module-completion-saves`. The teacher approved device-cached lesson
content and unfinished module work, with module code sent to the server only after a
successful task. Personal projects keep their existing save and submission flow.

## What changed

- Student lesson content is cached per student, class, and module on the device.
  The cache expires after five minutes so module updates and access changes are fetched.
- Module code, sample checks, and failed runs stay in device storage. Opening a task
  prepares files with a read-only request; Run code no longer writes module code first.
- A successful module task sends one guarded checkpoint containing the code, verified
  sample evidence, and completion. The response includes newly unlocked content so the
  device can update its cache without fetching the module again.
- If sync fails, the same checkpoint id is retried when the student is online again.
  Offline mode continues to run Java on the classroom laptop and saves only successful
  module results.

No existing migration was changed. No hosted database, Worker setting, deployment, or
student record was touched.

## Verification

| Command | Result |
| --- | --- |
| `npm test` | 316 passed, 0 failed, 0 skipped |
| `npm run lint` | Passed; 0 errors, 8 existing warnings |
| `npm run build:all` | Passed (Next.js and backend TypeScript) |
| `npm run classroom:offline -- --build-only` | Passed; offline build ready |
| Online local browser: `node --test --test-name-pattern='Java progress online' --test-reporter=spec tests/java-run-progress.browser.mjs` | 9 passed, 0 failed, 0 skipped |
| Focused regressions: `node --test --test-reporter=spec tests/module-activities.test.mjs tests/module-completion.test.mjs tests/module-device-store.test.mjs tests/student-module-activity-ui.test.mjs` | 28 passed, 0 failed, 0 skipped |

The online browser check used local CodeShare, local Supabase, and the local Java runner.
It verified one module-content download, successful task checkpoint and immediate unlock,
failed-run preservation, and the separate personal project flow.

The offline launcher build passed. A later offline browser check was interrupted after
about four minutes before it reported any test cases, so actual offline browser behavior
is not claimed as verified in this final run. The existing integration suite's offline
module and Java checks passed.

The checkpoint regression was mutation-checked: restoring the old pre-run project save
made `module activities: compile errors and a crash after the right output cannot pass`
fail; restoring the fix made it pass. The device cache tests cover student/class/module/
step key isolation and expiry.

## Test names for the changed paths

### `tests/module-activities.test.mjs`

- `module activities: compile errors and a crash after the right output cannot pass`
- `module activities: offline ignores online runner address and refuses browser progress`
- `sample first: real Java verifies samples, completes alterations, restores step drafts and refuses stale tabs`

### `tests/module-completion.test.mjs`

- `opening a step prepares local files without saving project code or draft history`
- `failed output, sample-only evidence, changed samples and direct flags cannot save code or complete`
- `a successful checkpoint saves exact files, sample verification and completion together once`
- `completion-only modules: read-only preparation, small summaries and guarded successful checkpoints`

### `tests/module-device-store.test.mjs`

- `module device cache keys isolate student, classroom, module, and activity`
- `module content cache expires so teacher updates are fetched`

### `tests/module-completion.test.mjs`

- `a successful checkpoint saves exact files, sample verification and completion together once` also verifies newly unlocked content arrives with the checkpoint.

### `tests/java-run-progress.browser.mjs`

- `Java progress online: real module, personal and classroom Console statuses` (9/9)

## Limits

The Cloudflare event log proves a 10 ms CPU-limit failure for the supplied save request.
The exact hosted CPU contribution and whether this change keeps every real classroom
request under the free-plan limit are unknown until the teacher reviews and deploys it.
No hosted recovery, physical classroom Wi-Fi, or final offline browser result is claimed.
