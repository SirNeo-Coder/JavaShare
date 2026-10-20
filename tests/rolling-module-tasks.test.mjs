import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { courseModule } from "../backend/src/course-module-schema.ts";
import { executeLocallyResult } from "../backend/src/java-runner.ts";
import { activityTask, matchesActivityOutput, mergeProjectFiles } from "../backend/src/module-activities.ts";

const content = JSON.parse(readFileSync(new URL("../docs/modules/week14/Java2_Week_14.codeshare.json", import.meta.url)));
const edits = JSON.parse(readFileSync(new URL("./fixtures/week14-task-edits.json", import.meta.url)));

test("Week 14 tasks: revised upload keeps published ids and links to the preceding Vehicle project", () => {
  const parsed = courseModule.parse(content);
  assert.equal(parsed.id, "java-2-w14");
  assert.equal(parsed.previousModuleId, "java-2-w13");
  const steps = parsed.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "step");
  assert.equal(steps.length, 11);
  for (const step of steps) {
    assert.ok(step.activity.id);
    assert.notEqual(step.activity.expectedOutput, step.expectedOutput, `${step.id} needs an alteration`);
    assert.deepEqual(step.activity.files, [], "the student receives no solved replacement file");
  }
});

test("Week 14 tasks: all eleven alterations produce their published targets with real multi-file Java", async (t) => {
  let project = content.starterFiles;
  for (const lesson of content.lessons) for (const step of lesson.blocks.filter((block) => block.type === "step")) {
    await t.test(`Week 14 Step ${step.number}: ${step.id}`, async () => {
      project = mergeProjectFiles(project, step.files);
      project = project.map((file) => {
        let source = file.content;
        for (const edit of edits[step.id].filter((item) => item.path === file.path)) {
          assert.ok(source.includes(edit.from), `missing exercise edit in ${file.path}`);
          source = source.replace(edit.from, edit.to);
        }
        return { ...file, content: source };
      });
      const result = await executeLocallyResult(project, activityTask(step).stdin ?? "");
      assert.equal(result.success, true, result.output);
      assert.equal(matchesActivityOutput(result, activityTask(step).expectedOutput), true, result.output);
      assert.equal(matchesActivityOutput({ success: false, output: result.output }, activityTask(step).expectedOutput), false);
    });
  }
});
