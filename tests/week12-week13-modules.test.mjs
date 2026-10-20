import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { courseModule } from "../backend/src/course-module-schema.ts";
import { executeLocallyResult } from "../backend/src/java-runner.ts";
import { activityTask, matchesActivityOutput, matchesSample, mergeProjectFiles } from "../backend/src/module-activities.ts";

const load = (week) => JSON.parse(readFileSync(new URL(`../docs/modules/week${week}/Java2_Week_${week}.codeshare.json`, import.meta.url)));
const modules = [load(12), load(13)];
const nextModule = load(14);
const edits = JSON.parse(readFileSync(new URL("./fixtures/week12-week13-task-edits.json", import.meta.url)));
const steps = (content) => content.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "step");
const supporting = (files) => files.filter((file) => file.path !== "Main.java").sort((a, b) => a.path.localeCompare(b.path));
const alter = (files, step) => files.map((file) => {
  let source = file.content;
  for (const edit of edits[step.id].filter((item) => item.path === file.path)) {
    assert.ok(source.includes(edit.from), `${step.id}: missing exercise edit in ${file.path}`);
    source = source.replaceAll(edit.from, edit.to);
  }
  return { ...file, content: source };
});

test("Weeks 12–14: uploads validate, identities link, and no personal starter receives the Vehicle family", () => {
  for (const [index, content] of modules.entries()) {
    const parsed = courseModule.parse(content);
    assert.equal(parsed.id, `java-2-w${12 + index}`);
    assert.equal(parsed.sampleFirst, true);
    assert.equal(parsed.lessons.length, 5);
    assert.equal(steps(parsed).length, [9, 13][index]);
    assert.deepEqual(parsed.starterFiles, []);
    assert.deepEqual(parsed.performanceTask.starterFiles.map((file) => file.path), ["Main.java"]);
    assert.doesNotMatch(parsed.performanceTask.starterFiles[0].content, /class (?:Vehicle|Jeepney|Tricycle|Bus)\b/);
    for (const step of steps(parsed)) {
      assert.ok(step.activity.id);
      assert.notEqual(step.expectedOutput, step.activity.expectedOutput, `${step.id}: baseline must not complete the alteration`);
      assert.deepEqual(step.activity.files, [], "never upload a solved replacement");
      assert.ok(step.files.some((file) => file.path === "Main.java"));
      assert.doesNotMatch(step.files.map((file) => file.content).join("\n"), /\b(?:java\.io|java\.nio\.file|java\.net|ProcessBuilder|Runtime\.getRuntime|System\.exit)\b/);
    }
  }
  assert.equal(modules[0].previousModuleId, undefined);
  assert.equal(modules[1].previousModuleId, modules[0].id);
  assert.equal(nextModule.previousModuleId, modules[1].id);
  assert.deepEqual(supporting(steps(modules[1]).at(-1).files), supporting(nextModule.starterFiles));
  const reading = modules[1].lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type !== "step");
  assert.match(JSON.stringify(reading), /FileNotFoundException/);
  assert.match(JSON.stringify(reading), /in-memory/);
});

test("Weeks 12–13: every sample and small alteration runs in a rolling multi-file project with real Java", async (t) => {
  let project = [];
  for (const content of modules) for (const step of steps(content)) {
    await t.test(`Week ${content.week} Step ${step.number}: ${step.id} sample and alteration`, async () => {
      project = mergeProjectFiles(project, step.files);
      const baseline = await executeLocallyResult(project, step.stdin ?? "");
      assert.equal(baseline.success, true, baseline.output);
      assert.equal(matchesSample(baseline, step), true, `${step.id} sample:\n${baseline.output}`);
      assert.equal(matchesActivityOutput(baseline, activityTask(step).expectedOutput), false);
      project = alter(project, step);
      const changed = await executeLocallyResult(project, activityTask(step).stdin ?? "");
      assert.equal(changed.success, true, changed.output);
      assert.equal(matchesActivityOutput(changed, activityTask(step).expectedOutput), true, `${step.id} task:\n${changed.output}`);
      assert.equal(matchesActivityOutput({ success: false, output: changed.output }, activityTask(step).expectedOutput), false);
    });
  }
  await t.test("Week 13 completed classes run Week 14 ArrayList without replacing supporting classes", async () => {
    const first = steps(nextModule)[0];
    assert.deepEqual(supporting(project), supporting(nextModule.starterFiles));
    project = mergeProjectFiles(project, first.files);
    const result = await executeLocallyResult(project, first.stdin ?? "");
    assert.equal(matchesSample(result, first), true, result.output);
  });
});

for (const content of modules) {
  test(`Week ${content.week}: personal starter and reference example compile and run independently`, async () => {
    for (const files of [content.performanceTask.starterFiles, content.performanceTask.exampleFiles]) {
      const result = await executeLocallyResult(files, "");
      assert.equal(result.success, true, result.output);
    }
  });
}
