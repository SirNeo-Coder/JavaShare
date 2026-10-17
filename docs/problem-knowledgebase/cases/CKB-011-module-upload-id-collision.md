# CKB-011 — A module upload could contain colliding step/exit-slip ids

- Status: resolved
- First recorded: 2026-10-18
- Last verified: 2026-10-18
- Area: `backend/src/course-module-schema.ts`
- Search terms: duplicate step id, exit slip id collision, two steps share an id, marking one
  step done marks another, module upload id reused, CKB-007 reachable again

## Symptom

Not a live incident — an open finding from `/code-review` on PR #6/#7, tracked in
`docs/handoffs/stage-two.md`, before either PR shipped to a student. `course-module-schema.ts`
validated every field's shape and type but never checked that ids were distinct across the
module. Student progress (`step_states`, `backend/src/supabase-repository.ts`) is one flat map
per module, keyed by whichever id was marked done - a step block's own `id` or a lesson's
`exitSlip.id` (the same mechanism CKB-007 fixed by folding exit slips into this map). If a
module's JSON file happened to contain two steps with the same `id`, or a step `id` that matched
an exit slip's `id` - even across two different lessons - marking either one done would silently
mark the other done too, with no error at upload time to catch it.

## Root cause

`course-module-schema.ts` checked each id's shape (`min(1).max(100)`, etc.) individually but had
no cross-field check at all - there was nowhere in the schema that looked at the set of ids used
as progress keys across the whole module.

## Durable solution

The top-level `courseModule` schema now has a `.refine()` that collects every lesson's
`exitSlip.id` and every step block's `id` across all lessons, and rejects the upload if any two
collide, with a plain-English message (consistent with this file's existing rejection style).
Scoped to exactly the ids used as progress keys (not lesson ids or the module id itself, which
aren't part of that collision space).

## Regression proof

- Test file: `tests/course-module-schema.test.mjs`.
  - "course module schema: rejects a step id reused by another lesson's step (CKB-007's bug
    class, reachable at upload)"
  - "course module schema: rejects a step id that collides with an exit slip's id"
- Command: `node --test tests/course-module-schema.test.mjs` (also covered by `npm test`). No
  local Supabase needed - pure schema validation.
- **Shown failing before the fix:** both tests failed against the unmodified schema
  (`true !== false` - the mutated fixture, with a duplicated id, still parsed successfully).
  Added the `.refine()`; both pass.
- Commit: this change, branch `module-viewer`.

## Recurrence triage

If a future symptom is "marking X done also marked Y done" for anything stored in `step_states`,
check first whether the module file itself has a duplicate id (this case) before assuming the
write path is wrong again (CKB-007's actual bug was in the write path, not the data) - the search
terms above should make it easy to tell these two apart.

## History

- 2026-10-18 — Found by `/code-review` on PR #6/#7, tracked as an open finding in
  `docs/handoffs/stage-two.md`. Fixed in this change: regression tests shown failing against the
  schema with no cross-id check, then the `.refine()` added, tests passing.
