import assert from "node:assert/strict";
import test from "node:test";
import { isFreshDeviceRecord, moduleRecordKey } from "../app/moduleDeviceStore.ts";

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
