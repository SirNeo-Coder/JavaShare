import assert from "node:assert/strict";
import { test } from "node:test";
import { personalProjectFiles, paperPerformanceTask } from "../backend/src/personal-performance.ts";
const files = (content) => [{ path: "Main.java", content }];
test("personal continuation: current work wins, then submitted personal files, then draft, then personal starters", () => {
  const starters = files("personal starter"), submitted = { files: files("submitted") }, previous = { own: submitted, project: { files: files("later draft") } };
  assert.deepEqual(personalProjectFiles(starters, previous, {}), submitted.files);
  assert.deepEqual(personalProjectFiles(starters, previous, { project: { files: [] } }), [], "an intentionally empty current draft is not recopied");
  assert.deepEqual(personalProjectFiles(starters, previous, { project: { files: files("current") } }), files("current"));
  assert.deepEqual(personalProjectFiles(starters, previous, { own: { files: files("current submission") } }), files("current submission"));
  assert.deepEqual(personalProjectFiles(starters, { project: previous.project }, {}), previous.project.files);
  assert.deepEqual(personalProjectFiles(starters, undefined, {}), starters);
});
test("Week 20: Java 2 proposal stays paper-only; other weeks retain Java submission", () => {
  assert.equal(paperPerformanceTask({ course: "java-2", week: 20 }), true);
  assert.equal(paperPerformanceTask({ course: "java-2", week: 21 }), false);
  assert.equal(paperPerformanceTask({ course: "java-1", week: 20 }), false);
});
