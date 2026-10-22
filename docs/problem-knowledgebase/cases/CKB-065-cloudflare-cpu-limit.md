# CKB-065 — Module practice saves exceed Cloudflare's CPU limit

- Status: implemented and locally verified; hosted CPU recovery remains unverified
- First recorded: 2026-10-22
- Last verified: 2026-10-22
- Area: module projects, prerequisite reads, Cloudflare CPU
- Search terms: 503, exceededCpu, cpuTimeMs 10, Save work, failed runs save code, completion-only saves, cache modules

## Symptom

Teacher screenshots showed module/progress and other requests failing with 503.
A supplied module-project save invocation reported exceededCpu at 10 ms CPU and
404 ms total time. The raw log and student/network/account information are omitted.
The related HTML/JSON error message is handled separately in PR #39.

## Root cause

The supplied invocation proves CPU exhaustion for that save. The free account plan
was not directly inspected. Local Worker profiles with actual Week 12–21 content
identified full-library Supabase response parsing as a major cost. Each prerequisite
check loaded every module's full content, followed by duplicate selected-module reads.
The old online editor also saved before every Run code and posted unsuccessful
results. Opening a step wrote its prepared project files too.

Earlier diagnosis/profile records are in PR #39. A healthy public read does not
establish that signed-in saves fit the hosted CPU budget. CKB-035's cache freshness
regression also applies: a saved copy must not hide teacher/module/access changes.

## Durable solution

The teacher explicitly approved the combined device-cache/local-draft, completion-only
saving and lighter-server-read plan. Online Module project practice should keep
unfinished code and sample verification on the device, then send one server-validated
successful checkpoint. Failed runs must not replace earlier successful code. Server
identity/class/prerequisite/live-week/activity/source/project-version checks remain.
Later locked content stays withheld until server-confirmed completion.

The new migration defines server-only metadata reads derived from current content
and a checkpoint write guarded by module/project versions. Student module content and
unfinished code/sample evidence are cached per student/class/module/step in IndexedDB.
The successful checkpoint response includes newly unlocked content, so the client refreshes
its filtered cache without another module request. No stored summary cache, new dependency,
data rename, deleted work or existing migration edits. Existing routes remain compatible.
Teacher setup: docs/module-completion-setup.md. Only local SQL has been applied.

## Regression proof

Server step: the final full suite passed 316/316 with no skips; focused module checks
passed 28/28, including real Java, completion validation, stale writes and device-cache
key/expiry checks. Build: npm run build:all passed; lint had 0 errors and 8 existing warnings.
New checks cover small/scoped summaries and browser-role denial; no full-library
access read; opening without project writes; rejection of failed/sample-only/direct
pass evidence; atomic successful code/verification/completion; duplicate checkpoints;
legacy/error samples; stale modules/projects, live locks and isolation.
The online local browser run passed 9/9 checks, including a single module-content download,
successful checkpoint with immediate unlock, failed-run preservation, and personal Java.
The offline launcher build passed; the attempted offline browser run was interrupted after
about four minutes before any case reported, so offline browser behavior is not claimed as
verified here. The integration suite covers offline module behavior. The pre-run-save
mutation was restored and its regression passes. Hosted CPU recovery and physical classroom
Wi-Fi remain unverified; see `docs/verification/module-completion-saves.md` for commands
and exact test evidence.
Branch: codex/module-completion-saves.

## Recurrence triage

Inspect the invocation outcome before assuming traffic, missing tables or a daily
request limit. Count actual requests separately from CPU per request. Do not claim
that fewer requests alone fixes a heavy successful checkpoint. Verify cache keys,
module versions, task identities and stale-write guards before reusing old content.

## History

- 2026-10-22 — Teacher supplied CPU failure evidence, required free hosting, and
  approved device-cached modules with code saved only after successful task completion.
  Server, online browser, full suite and builds are verified locally; hosted recovery
  still requires teacher review and deployment.
# CKB-065 — Cloudflare stops a module save at its CPU limit

- Status: investigating (save CPU exhaustion confirmed; remedy and hosted recovery pending)
- First recorded: 2026-10-22
- Last verified: 2026-10-22
- Area: Cloudflare hosting, module-project save
- Search terms: 503, exceededCpu, cpuTimeMs 10, wallTimeMs 404, Worker exceeded resource limits, progress/project, Save work

## Symptom

The teacher reported failed module, live-share and sign-in activity requests with
503, and supplied a Cloudflare invocation for
`PUT /api/classrooms/:classroomId/modules/java-2-w13/progress/project`.
The associated HTML parsing error is separately mitigated in CKB-064.

## Root cause

Cleaned invocation facts: response **503**, outcome **exceededCpu**, CPU time
**10 ms**, total time **404 ms**. Cloudflare terminated this save for exceeding
its CPU execution budget. Network/database waiting contributes to total time,
not CPU time. This evidence does not prove the cause of every other failed request.

[Cloudflare's CPU limits](https://developers.cloudflare.com/workers/platform/limits/#cpu-time)
document 10 ms per HTTP request on Workers Free; Workers Paid defaults to 30 seconds.
The 10 ms report is consistent with Free. The actual account plan/effective setting
was not inspected, so do not claim the plan was verified. The local wrangler.jsonc
does not specify a CPU limit. Local Node tests do not enforce Cloudflare CPU limits.

The correct public health endpoint returned 200 with `ok: true` and database
`connected: true` at 12:31 PM Asia/Manila on 2026-10-22. This is a lightweight
read, not a signed-in module save. An earlier lookup used a misread hostname.

Read-only code inspection shows the save checks membership/prerequisites, loads
the module library and current module, and merges progress under a version check.
Local Worker profiling identifies full-library Supabase parsing as a major cost;
see the comparison below.
Do not remove access/version checks or assume slow network waits caused CPU usage.

## Durable solution

The teacher explicitly requires CodeShare to remain free and requested CPU-reduction
investigation. No paid-plan change is approved. Profile the existing local Worker
with representative module content and propose measured reductions separately;
fitting the complete app under 10 ms is not established. Raising a local config
value cannot bypass the Free cap. Preserve all membership/prerequisite/version
checks and student drafts. Paid is documented only as the alternative the teacher
declined; no pricing/hosting change is part of this repair.

The stay-free investigation profiled the unchanged local Worker with two versus ten
modules and a direct-handler control. Full-library parsing is a major measured cost;
the control removes only part of the total. A metadata payload estimate is 2,934
bytes versus 885,998 bytes full content. No CPU reduction is implemented or proven
by that size estimate. [Evidence and next approval plan](../../verification/free-worker-cpu-investigation.md)
propose one new server-only metadata read and request-local module reuse, preserving
all access/progression/version rules. New code/schema needs separate approval.

Teacher-only steps and acceptance checks are in [Cloudflare setup](../../cloudflare-setup.md#module-saves-fail-with-exceededcpu).
The assistant has not changed billing, limits, hosted settings or deployments.

## Regression proof

- Production failure: teacher-supplied invocation facts above. The raw log, IP,
  account/trace ids, connection details and student information are not stored.
- Public health read: 200 / connected, not a save recovery test.
- Local route suite and real laptop Java pass; these do not prove CPU-limit recovery.
- Required hosted proof after the teacher applies the chosen remedy: open/save/run
  Week 13, reload and verify saved work; check invocation success and CPU usage.
- No deliberately failing CPU-budget test or hosted passing-after proof exists yet.
- Record branch: `codex/api-service-errors`; no CPU optimization/config change included.

## Recurrence triage

Check invocation outcome first. `exceededCpu` identifies CPU exhaustion;
application JSON errors, missing tables, memory exhaustion and daily request caps
need their own evidence. Re-check the plan/effective limit and profile before
changing code. Preserve unsaved editor text and do not automatically retry writes.

## History

- 2026-10-22 — Teacher supplied a cleaned Worker invocation during the approved
  incident investigation. CPU exhaustion confirmed for the save. Response-message
  mitigation passed locally; teacher requires Free. Local Worker/control profiling identifies excessive full-module
  parsing; metadata/reuse proposal awaits separate approval. No hosting action taken.
