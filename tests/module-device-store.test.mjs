import assert from "node:assert/strict";
import test from "node:test";
import { isFreshDeviceRecord, moduleRecordKey, restoreModuleDraft } from "../app/moduleDeviceStore.ts";

test("module device cache keys isolate student, classroom, module, and activity", () => {
  const key = moduleRecordKey("activity", "student-a", "class-a", "module-a", "step-a");
  assert.notEqual(key, moduleRecordKey("activity", "student-b", "class-a", "module-a", "step-a"));
  assert.notEqual(key, moduleRecordKey("activity", "student-a", "class-b", "module-a", "step-a"));
  assert.notEqual(key, moduleRecordKey("activity", "student-a", "class-a", "module-a", "step-b"));
});

test("module content cache expires so teacher updates are fetched", () => {
  assert.equal(isFreshDeviceRecord({ savedAt: 1000 }, 1001), true);
  assert.equal(isFreshDeviceRecord({ savedAt: 1000 }, 301001), false);
  assert.equal(isFreshDeviceRecord(null), false);
});

const files = (content) => [{ path: "Main.java", content }];
const current = { files: files("current sample"), moduleVersion: "version-2", stateId: "task:current" };
const step = { files: current.files, expectedOutput: "sample" };

test("module drafts: expected-error verification survives reload with unfinished edits", () => {
  const sample = { files: current.files, success: false, output: "java.lang.ArithmeticException: / by zero" };
  const draft = { ...current, files: files("unfinished alteration"), sample };
  const restored = restoreModuleDraft(draft, current, { ...step, expectedError: "java.lang.ArithmeticException" }, true);
  assert.deepEqual(restored.files, draft.files);
  assert.deepEqual(restored.sample, sample);
  assert.equal(restored.backups, undefined);
});

test("module drafts: changed lesson, task identity and legacy drafts keep backups without reusing evidence", () => {
  for (const metadata of [{ moduleVersion: "version-1", stateId: current.stateId }, { moduleVersion: current.moduleVersion, stateId: "task:old" }, {}]) {
    const draft = { ...metadata, files: files("earlier edits"), sample: { files: current.files, success: true, output: "sample" }, pending: { completionId: "old-attempt" }, backups: [{ files: files("oldest edits") }] };
    const restored = restoreModuleDraft(draft, current, step, true);
    assert.deepEqual(restored.files, current.files);
    assert.equal(restored.sample, undefined);
    assert.equal(restored.pending, undefined);
    assert.deepEqual(restored.backups.map((backup) => backup.files), [files("oldest edits"), draft.files]);
    assert.equal(restoreModuleDraft(restored, current, step, true).backups.length, 2, "reopening must not duplicate backups");
  }
});

test("module drafts: invalid sample evidence resets safely while valid pending completion survives", () => {
  const draft = { ...current, files: files("alteration"), sample: { files: current.files, success: true, output: "sample" }, pending: { completionId: "same-attempt" } };
  assert.deepEqual(restoreModuleDraft(draft, current, step, true), draft);
  for (const sample of [{ ...draft.sample, success: false }, { ...draft.sample, files: files("edited sample") }, { ...draft.sample, output: "wrong output" }]) {
    const restored = restoreModuleDraft({ ...draft, sample }, current, step, true);
    assert.deepEqual(restored.files, current.files);
    assert.deepEqual(restored.backups[0].files, draft.files);
    assert.equal(restored.sample, undefined);
    assert.equal(restored.pending, undefined);
  }
  assert.deepEqual(restoreModuleDraft(null, current, step, true), current);
  assert.deepEqual(restoreModuleDraft({ ...current, files: files("offline edits") }, current, step, false).files, files("offline edits"));
});
