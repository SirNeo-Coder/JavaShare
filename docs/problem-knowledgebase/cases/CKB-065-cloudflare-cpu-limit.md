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
