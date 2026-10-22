# Free Worker CPU investigation — 2026-10-22

Teacher instruction: **CodeShare must stay free; investigate CPU reductions.**
This is an investigation and proposal. No repository application, migration,
configuration or test files changed during profiling. The separate error-message
repair is commit `f256834`, [PR #39](https://github.com/SirNeo-Coder/JavaShare/pull/39).

## Established production failure

The supplied module-project save invocation reports 503 / exceededCpu / 10 ms CPU /
404 ms total time. This establishes CPU exhaustion for that request, not every
failed request in the screenshots. The account's effective plan/settings were not
inspected. No billing, hosted limits, deployment or database changes were made.
CKB-065 records the cleaned facts; the raw invocation and connection/account/student
information are not stored.

## Local experiment

Commands and setup:

- ✔ `npm run cf:build`: built the existing production Worker locally, with the
  error-message repair. No deploy command was run.
- ✔ `wrangler dev --local --port 3035 --inspector-port 9237 --ip 127.0.0.1`:
  existing OpenNext Worker, existing local Supabase only. Local keys were placed
  in ignored .dev.vars, not printed or committed.
- ✔ Temporary control Worker on port 3036 / debugger 9238: an external /tmp entry
  imported the unchanged `backend/src/routes.ts` handler directly. This control
  bypassed Next.js for comparison only; it is not a proposed application change.
- ✔ A temporary local-only driver created a teacher/student/class and subject
  library, marked actual Week 12 activity ids complete, opened Week 13's first
  sample through the real route, and repeated real version-checked saves.
  Every measured response was 200. All disposable data was deleted in finally.
- Each phase warmed up with three requests, then measured twenty sequential
  requests using the Worker's DevTools CPU profiler at 100-microsecond sampling.
  Both Workers used the same workload and the actual committed Week 12–21 JSON.
- Initial setup attempts failed on a lowercase disposable join code and a debugger
  WebSocket handshake without its Origin header. Both were corrected before any
  measurements below; no application code or live data was changed to address them.

This follows [Cloudflare's local profiling workflow](https://developers.cloudflare.com/workers/observability/dev-tools/cpu-usage/).
Samples include profiler/runtime overhead. These are **local V8 sampled non-idle
estimates**, not Cloudflare's billed/limited CPU metric, and cannot prove a hosted
request will fit 10 ms. They support relative diagnosis only.

| Workload (20 warm requests) | Existing Next.js Worker, sampled non-idle ms/request | Direct-handler control, sampled non-idle ms/request |
| --- | ---: | ---: |
| Sign-in activity, no module/library reads | 6.1 | 2.9 |
| Week 13 save, two modules in library | 26.3 | 22.2 |
| Week 13 save, ten modules in library | 37.1 | 32.0 |
| Week 13 progress read, ten modules | 33.7 | 32.2 |

The direct-handler control removed some overhead, but left most module-request
work. It does not justify introducing a second production routing path now.

## Findings tied to source

1. `loadStudentModuleAccess` calls `loadCourseModules`, which selects full rows and
   full module content for the teacher/subject library (or legacy class uploads).
   This happens before each protected module save/read. The selected Week 13
   module is then read in enforcement and again by the caller.
2. The two source modules contain 113,289 compact JSON bytes. The ten contain
   885,987 bytes (885,998 as one JSON array). The extra eight modules are not
   prerequisites of Week 13, yet their code/discussion/output is fetched and parsed.
   Actual database response formatting/row metadata adds to these source sizes.
3. The profiler's `processResponse` is Supabase's response handler, including
   `JSON.parse` (generated Worker line 58064). It is a major self-time contributor:
   approximately 94 ms across the two-module save phase and 122 ms in the
   ten-module phase. The direct control also spends substantial time there.
4. The Next.js profile also samples response splitting/cloning in `rh`
   (generated line 53323: body.tee and two Response constructions). The direct
   control lacks that wrapper, but the large module read remains expensive.
5. Prerequisite completion only needs module identity/predecessor/week and required
   activity state ids. A read-only size estimate preserving the actual 66 required
   ids gives **2,934 bytes** for ten summaries, a 99.67% smaller payload than full
   content. This is a payload estimate, **not a measured speed improvement** and not
   an implemented query. Catalog labels and per-student progress would add some
   bytes to that minimum access summary. Current content/version/access rules remain authoritative.

Source locations: `backend/src/supabase-repository.ts` — loadStudentModuleAccess,
loadCourseModules, enforceStudentModuleAccess, setSupabaseModuleProjectFiles,
getSupabaseModuleProgress, getSupabaseModule, listSupabaseModules and
listSupabaseModuleSummaries. Prerequisite rules: backend/src/module-prerequisites.ts.
Activity identity/access: backend/src/module-activities.ts.

## Proposed next change — needs separate approval

Goal: reduce the existing module-request work while keeping hosting free and the
same student behavior. No hosting move or new production API routing path proposed.

- Add one new migration defining a small server-only database read for module
  prerequisite/progress metadata. Return links and required activity ids instead
  of lesson text, Java sources and expected outputs when those are unnecessary.
  Derive the metadata from current stored content so uploads and changed task ids
  cannot leave stale cached completion requirements. No existing migration edits,
  data renames, deleted work, new persistent summary cache or new dependency.
- Reuse the selected module within a request, avoiding repeated reads/parses.
  Use the metadata in the student module catalog/progress/prerequisite paths that
  currently load full content just to check access or calculate summary progress.
  Full module reads still supply the actual worksheet/editor and authoritative
  sample/task checking. Preserve ordering/latest-module behavior.
- Keep teacher/subject and legacy-class scoping, live-week/catch-up rules, unknown
  module refusal, missing/cyclic prerequisites, exact activity ids, version checks,
  draft backups, both project tracks and server-owned output checking intact.
- Likely files: one new supabase/migrations SQL file; supabase-repository.ts;
  module-prerequisites.ts if needed to accept the smaller metadata shape; focused
  module prerequisite/progress/sharing tests; knowledge-base/setup/handoff records.
  A narrow helper in module-activities.ts is permissible only if existing identity
  logic must be reused. No UI behavior or runtime changes are intended.
- Verify new server-only grants and scopes in local Supabase; compare metadata and
  full-content decisions for actual modules, old/new activity ids, no-step modules,
  changed uploads, missing/cyclic links and completion percentages. Demonstrate the
  regression failing without the new read/reuse. Run build:all, lint, full suite,
  actual offline/browser checks and the same local Worker profiling workload.
- Compatibility: new SQL must be applied locally and **by the teacher online**
  before a client of that new database read is deployed. Preserve current tables
  and data. Prepare a staged deployment/rollback guide; assistants never db push,
  deploy, alter hosted settings or apply hosted SQL.
- Stop after that narrow reduction and measurement. If the free cap still cannot
  be met, report the remaining cost and propose a separate next step rather than
  expanding scope. Hosted CPU success must be verified by the teacher after rollout;
  neither local timings nor the small payload estimate guarantee it.

AGENTS.md requires explicit approval of this new code/schema plan. The earlier
approval covered error handling and diagnosis, not this migration or optimization.

## Limits and cleanup

No cold-start distribution, concurrent classroom load or hosted signed-in save was
profiled; these local samples cannot prove all requests stay under 10 ms. The source
library's separate CKB-063 predecessor-id mismatch remains unchanged. The temporary
control route was never deployed. Both profiling Workers, ignored local credentials
and disposable fixtures are cleaned up. Original checkout and existing servers remain.
