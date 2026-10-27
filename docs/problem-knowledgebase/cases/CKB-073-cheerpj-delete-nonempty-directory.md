# CKB-073 — CheerpJ's File.delete() reports success on a non-empty directory

- Status: CheerpJ's bug remains unfixed, but no curriculum content exercises it anymore
- First recorded: 2026-10-27
- Last verified: 2026-10-27
- Area: online Java / CheerpJ browser runtime (`java.io.File` semantics)
- Search terms: Delete the folder true, delete returns true on non-empty directory, folder.delete() should be false, Week 15 Activity Two still wrong after CKB-072, Java File Handling module partially fails online

## Symptom

After CKB-072 shipped (clearing CheerpJ's filesystem before each run), the teacher
re-tested Week 15 Activity Two online. Every line of actual output now matches expected
except one: `Delete the folder? true` where real Java and the module's `expectedOutput`
both say `false`, because `records/` still contains `trips.txt` at that point. This is now
a genuinely fresh run (confirmed by `Folder made? true` matching), so CKB-072's fix is
working — this is a second, separate problem.

## Root cause

Confirmed directly and in isolation against the live CheerpJ 4.3 CDN runtime (same probe
method as CKB-072, a minimal classfile run through `cheerpjRunMain`, independent of any
CodeShare code): `File.delete()` on a non-empty directory returns `true` and leaves the
directory and its contents completely untouched.

```
mkdir=true
createNewFile=true
delete non-empty dir=true
dir.exists after=true
dir.list after=[inside.txt]
inside.exists after=true
```

Real Java's contract (`java.io.File#delete`, `Files#delete`) requires a directory to be
empty before it can be removed, and returns `false`/throws otherwise. CheerpJ's
implementation does not enforce this — `delete()` is effectively a no-op on a non-empty
directory but incorrectly reports success.

This is inside CheerpJ's own JRE reimplementation of `java.io.File`, invoked directly when
the student's compiled bytecode calls `.delete()`. Neither `vendor/java/CodeShareJava.java`
(CodeShare's bridge, which only prepares sources, classpath and stdio around the student's
`main()`) nor `java-runtime/public/runner.js` has any hook into individual `File` method
calls inside the student's own running program. There is no interception point available
to CodeShare to correct this specific method's return value or behavior.

## Durable solution

None available from CodeShare's side for CheerpJ's `File.delete()` itself — this remains
a CheerpJ vendor limitation, not an application bug, and it could resurface if any future
module content calls `.delete()` on a non-empty directory.

**Teacher decision (2026-10-27, superseded same day):** initially directed running
affected file-handling steps via the offline/classroom laptop runner, where a real JVM
gives the correct result (confirmed: `backend/src/java-runner.ts` is unaffected, real
`javac`/`java` matches `expectedOutput` exactly). Noted in `docs/modules/week15/README.md`
and `docs/knowledgebase/workflow-state.md` at the time.

**Final decision (2026-10-27): remove the one line that triggers it.** A repo-wide check
confirmed `folder.delete()` on a non-empty directory occurred in exactly one place across
the whole curriculum (weeks 12–21): the sample `Main.java` for this step
(`java-2-w15-d1-s2`). The teacher chose to drop
`System.out.println("Delete the folder? " + folder.delete());` from the sample and its
matching line from `expectedOutput`, rather than keep routing around it operationally.
The step's **task** (`activity`) still calls `folder.delete()`, but on a folder the
student has just made genuinely empty — unaffected by this CheerpJ bug either way
(verified: the printed result is identical, `true`, whether CheerpJ's `delete()` is
correct or is silently a no-op on an already-empty directory). This makes the step safe
to run online again; the offline-only guidance added earlier was reverted as part of this
same change since nothing left in the curriculum needs it.

## Regression proof

- No regression test for CheerpJ's own bug — there's no CodeShare code to test, since the
  defect is inside CheerpJ's own runtime, not in any file this repository controls.
- Live reproduction (for the bug itself): isolated probe page loading real CheerpJ 4.3
  from `cjrtnc.leaningtech.com`, running a tiny class that creates a directory with one
  file inside and calls `.delete()` on it — reproducible on demand, not tied to the Week
  15 module content.
- For the content edit: `tests/week15-week21-modules.test.mjs` recompiles and runs both
  the new sample and the task-edits-derived alteration for every Week 15–21 step with a
  real `javac`/`java`, asserting each matches its `expectedOutput`/`activity.expectedOutput`
  exactly — this already covered the new code before the edit landed, since it runs
  against whatever the module JSON currently says. 49/49 in that file, 345/345 full suite.
- Confirmed repo-wide (`grep -rl '\.delete()' docs/modules/*/Java2_Week_*.codeshare.json`)
  that this was the only `.delete()` call on a directory anywhere in weeks 12–21 before
  the edit, and the only remaining `.delete()` calls afterward are the two single-file
  deletes in this same sample (`old.delete()`, unaffected by this bug) and the task's own
  empty-directory delete (unaffected, as explained above).

## Recurrence triage

Any step whose expected output depends on `File.delete()` correctly refusing a non-empty
directory will show this same single-line mismatch online, regardless of module or week.
Distinguish from CKB-072 (stale cross-run state, which affects earlier lines like
`mkdir()`/`exists()` results) by checking whether every line up to the delete call already
matches: if so, this case applies, not CKB-072.

## History

- 2026-10-27 — Teacher re-tested Week 15 Activity Two after CKB-072 shipped; confirmed
  CKB-072's fix resolved the `mkdir` mismatch, but one line remained wrong. Isolated and
  confirmed directly against the live CheerpJ runtime as a separate, upstream limitation
  with no CodeShare-side fix available.
- 2026-10-27 — Teacher directed running affected file-handling steps offline for now.
  Noted in `docs/modules/week15/README.md` and `docs/knowledgebase/workflow-state.md`;
  no module content or application code changed.
- 2026-10-27 — Teacher superseded that decision: confirmed this was the only
  non-empty-directory `.delete()` call in the whole curriculum, then directed removing it
  from the sample instead. Edited `docs/modules/week15/Java2_Week_15.codeshare.json`
  (sample `Main.java`, `expectedOutput`, `activity.instruction`, and the step's teaching
  note, which explained the now-removed output line), updated the matching test fixtures
  (`tests/fixtures/week15-week21-task-edits.json`, `tests/fixtures/week15-week21-originals.json`'s
  content-integrity hash), and reverted the offline-only guidance in the module README and
  workflow-state.md. 49/49 in `tests/week15-week21-modules.test.mjs`, 345/345 full suite.
