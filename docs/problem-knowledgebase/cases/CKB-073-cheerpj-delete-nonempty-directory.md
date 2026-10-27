# CKB-073 — CheerpJ's File.delete() reports success on a non-empty directory

- Status: investigating; no fix available from CodeShare's side
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

None available from CodeShare's side — this is a CheerpJ vendor limitation, not an
application bug. No application code change is proposed for this case. Options for the
teacher to choose from, none implemented yet:

1. Run file-handling steps that depend on this exact behavior (deleting a non-empty
   directory and checking the result) via the offline/classroom laptop runner instead,
   where a real JVM gives the correct result (confirmed: `backend/src/java-runner.ts`
   is unaffected by this, real `javac`/`java` matches `expectedOutput` exactly).
2. Leave the module content as-is and accept that this one check may not verify online
   until CheerpJ fixes its own `delete()` implementation upstream.
3. Revise this specific step's online-path expectations — not attempted; would mean
   diverging the online `expectedOutput` from what real Java actually does, which risks
   teaching students incorrect `File.delete()` semantics. A curriculum decision, not a
   bug fix, and out of scope to decide unilaterally.

## Regression proof

- No CodeShare-side regression test applies — there's no CodeShare code to test, since
  the defect is inside CheerpJ's own runtime, not in any file this repository controls.
- Live reproduction: isolated probe page loading real CheerpJ 4.3 from `cjrtnc.leaningtech.com`,
  running a tiny class that creates a directory with one file inside and calls `.delete()`
  on it — reproducible on demand, not tied to the Week 15 module content.

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
