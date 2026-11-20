import assert from "node:assert/strict";
import { test } from "node:test";
import { require as tsxRequire } from "tsx/cjs/api";
const { onlineStepDone } = tsxRequire("../app/SessionStepDone.tsx", import.meta.url);

// CKB-129: the class session count lists only students online now; a saved pass or a matching class-step run counts.
test("session step count: only online students, saved passes and this step's class-step runs", () => {
  const ana = { id: "a", name: "Ana" }, ben = { id: "b", name: "Ben" }, cy = { id: "c", name: "Cy" }, dee = { id: "d", name: "Dee" };
  const data = { step: { moduleId: "w15", stepId: "s1" }, done: [ana], notDone: [ben, cy, dee] };
  const result = onlineStepDone(data, ["a", "b", "c", "teacher"], { b: ["w15:s1"], c: ["w15:s2"], d: ["w15:s1"] });
  assert.deepEqual(result, { done: ["Ana", "Ben"], notDone: ["Cy"] }, "Dee is offline; Cy passed another step");
  assert.deepEqual(onlineStepDone(data, [], {}), { done: [], notDone: [] });
});
