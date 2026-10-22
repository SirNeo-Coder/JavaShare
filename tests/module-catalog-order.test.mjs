import assert from "node:assert/strict";
import { test } from "node:test";
import { require as tsxRequire } from "tsx/cjs/api";

const { sortModuleCatalog } = tsxRequire("../app/ModuleViewer.tsx", import.meta.url);
const modules = Array.from({ length: 10 }, (_, index) => ({
  moduleId: `week-${21 - index}`, week: 21 - index, title: `Week ${21 - index}`,
  course: "java-2", updatedAt: "", isActive: index === 0, locked: index !== 9,
}));
const weeks = (summaries = {}) => sortModuleCatalog(modules, summaries).map((module) => module.week);

test("module catalog order: unfinished weeks run from 12 to 21 despite active and locked flags", () => {
  assert.deepEqual(weeks(), [12, 13, 14, 15, 16, 17, 18, 19, 20, 21]);
  assert.deepEqual(modules.map((module) => module.week), [21, 20, 19, 18, 17, 16, 15, 14, 13, 12]);
});

test("module catalog order: finishing Week 12 puts Week 13 first and Week 12 last", () => {
  assert.deepEqual(weeks({ "week-12": 100 }), [13, 14, 15, 16, 17, 18, 19, 20, 21, 12]);
});

test("module catalog order: only complete modules move below all unfinished weeks", () => {
  assert.deepEqual(weeks({ "week-12": 99, "week-13": 100, "week-21": 100 }), [12, 14, 15, 16, 17, 18, 19, 20, 13, 21]);
  assert.deepEqual(weeks(Object.fromEntries(modules.map((module) => [module.moduleId, 100]))), [12, 13, 14, 15, 16, 17, 18, 19, 20, 21]);
});

test("module catalog order: equal weeks keep their existing order and an empty catalog stays empty", () => {
  const sameWeek = modules.slice(0, 2).map((module) => ({ ...module, week: 12 }));
  assert.deepEqual(sortModuleCatalog(sameWeek, {}), sameWeek);
  assert.deepEqual(sortModuleCatalog([], {}), []);
});
