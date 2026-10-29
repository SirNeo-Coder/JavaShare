import assert from "node:assert/strict";
import { test } from "node:test";
import { personalProjectFiles, paperPerformanceTask } from "../backend/src/personal-performance.ts";
const files = (content) => [{ path: "Main.java", content }];
test("personal continuation: current work wins, then submitted personal files, then draft, then personal starters", () => {
  const starters = files("personal starter"), submitted = { files: files("submitted") }, previous = { own: submitted, project: { files: files("later draft") } };
  const chosen = (...args) => personalProjectFiles(...args).files;
  assert.deepEqual(chosen(starters, previous, {}), submitted.files);
  assert.deepEqual(chosen(starters, previous, { project: { files: [] } }), [], "an intentionally empty current draft is not recopied");
  assert.deepEqual(chosen(starters, previous, { project: { files: files("current") } }), files("current"));
  assert.deepEqual(chosen(starters, previous, { own: { files: files("current submission") } }), files("current submission"));
  assert.deepEqual(chosen(starters, { project: previous.project }, {}), previous.project.files);
  assert.deepEqual(chosen(starters, undefined, {}), starters);
});
test("personal continuation: a web project's own media carries forward with the files it came with", () => {
  const photo = (id) => [{ path: "images/photo.png", id, size: 3 }];
  const previous = { own: { files: files("submitted"), media: photo("a") }, project: { files: files("later draft"), media: photo("b") } };
  assert.deepEqual(personalProjectFiles([], previous, {}), { files: files("submitted"), media: photo("a") });
  assert.deepEqual(personalProjectFiles([], { project: previous.project }, {}), previous.project);
  assert.deepEqual(personalProjectFiles([], previous, { project: { files: files("current") } }), { files: files("current"), media: undefined }, "the current project keeps its own media list");
  assert.deepEqual(personalProjectFiles(files("starter"), undefined, {}), { files: files("starter"), media: undefined }, "starters bring no media");
});
test("Week 20: Java 2 proposal stays paper-only; other weeks retain Java submission", () => {
  assert.equal(paperPerformanceTask({ course: "java-2", week: 20 }), true);
  assert.equal(paperPerformanceTask({ course: "java-2", week: 21 }), false);
  assert.equal(paperPerformanceTask({ course: "java-1", week: 20 }), false);
});
