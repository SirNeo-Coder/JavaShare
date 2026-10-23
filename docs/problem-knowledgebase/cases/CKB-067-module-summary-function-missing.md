# CKB-067 — Module lists fail when the summary database function is missing

- Status: repaired; teacher reports SQL success and recovered module loading
- First recorded: 2026-10-23
- Last verified: 2026-10-23
- Area: module catalog, hosted database readiness
- Search terms: module wont load, Unexpected server error, modules summary 500, cache module, codeshare_module_summaries false

## Symptom

Teacher and student screenshots show Your learning modules failing with Unexpected
server error; the student view also remains at Loading. Requests to both the module
list and module progress summary fail. The supplied invocation returns HTTP 500,
outcome ok, CPU time 7 ms; it is not the earlier exceededCpu/503 evidence.
The teacher reports a student seeing the problem around 9 p.m. on October 22.

## Root cause

The teacher's read-only `to_regprocedure('public.codeshare_module_summaries(uuid)')`
check returned false in the database checked. The saved origin/main code at
fc0972c calls that function from loadModuleSummaries for both list routes and throws
on its absence. Teacher applied the existing migration and reports SQL success and
recovered module loading, confirming the missing-function diagnosis for this incident. The deployed
commit and Worker/Supabase project pairing were not independently inspected; the
supplied stack lacks its error explanation.

Earlier teacher checks found course_modules, module_progress and active_module_id,
and service_role SELECT permissions on classrooms, classroom_members, course_modules
and module_progress. They checked tables, not the newer required functions. Initial
inspection used an older curriculum checkout; inspecting the newer origin/main code
revealed the function dependency. Code history records PR #41 merging at 20:59:57
Asia/Manila on October 22, close to the reported onset; commit time is not deployment
proof. No raw logs, account identifiers or student data are retained here.

## Durable solution

Teacher applies the existing, unchanged
supabase/migrations/20261022000200_module_access_summaries.sql to the correct hosted
project after the prerequisite check in docs/module-completion-setup.md. It defines
the summary and version-guarded completion functions, restricted to service_role.
Install inside one transaction, then check function presence/permissions and the
actual teacher/student module requests. Installing definitions does not invoke the
completion UPDATE or replace module/progress data. No new migration or app change.

## Regression proof

- Before repair: teacher reports function-existence check false; screenshots/logs
  show module-list HTTP 500. Tables/read permissions are present in database checked.
- Existing tests/module-completion.test.mjs covers summaries, legacy class scope,
  browser-role denial and guarded successful writes against local Supabase.
- Current check commands and results: docs/verification/module-summary-repair.md.
- Teacher confirms all four prerequisite values true (shared library, class subject,
  project files and per-step drafts). Teacher reports SQL success and recovered
  Module loading after applying the existing migration. Five-value function/permission
  readiness and actual student completion/reload verification remain pending. No destructive missing-function mutation was run
  against a shared database.
- Branch: codex/module-summary-repair. No hosted SQL executed by the assistant.

## Recurrence triage

Check the actual functions required by the deployed app as well as tables and
permissions. Confirm project pairing. Use invocation outcome to distinguish an app
500 from exceededCpu. Do not reset data, reapply all migrations blindly, or equate
local builds/tests with a repaired hosted service.

## History

- 2026-10-23 — Teacher provided module-list errors and read-only database results;
  missing summary function confirmed in checked project. Teacher approved the
  existing update; all prerequisites true, teacher SQL succeeded and Module now
  loads. Five-value permission and student completion/reload checks remain pending.
