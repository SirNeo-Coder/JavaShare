import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { require as tsxRequire } from "tsx/cjs/api";
import { activityStateId, sampleStateId } from "../backend/src/module-activities.ts";
const { moduleResumeStep } = tsxRequire("../app/moduleParts.ts", import.meta.url);
const load = (week) => JSON.parse(readFileSync(new URL(`../docs/modules/week${week}/Java2_Week_${week}.codeshare.json`, import.meta.url)));
const content = load(12);
const steps = content.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "step");

test("module resume: two completed Monday steps reopen at Day 2 Step 3 after saved progress is reloaded", () => {
  const states = JSON.parse(JSON.stringify(Object.fromEntries(steps.slice(0, 2).map((step) => [activityStateId(step), "pass"]))));
  assert.equal(moduleResumeStep(content, states).id, steps[2].id);
  assert.equal(content.lessons.find((lesson) => lesson.blocks.includes(steps[2])).dayLabel, "DAY 2");
});

test("module resume: verifying a sample, failing a task or legacy passes cannot skip an unfinished alteration", () => {
  assert.equal(moduleResumeStep(content, {}).id, steps[0].id);
  assert.equal(moduleResumeStep(content, { [sampleStateId(steps[0])]: "pass", [steps[0].id]: "pass", [activityStateId(steps[0])]: "fail" }).id, steps[0].id);
  assert.equal(moduleResumeStep(content, { "task:java-2-w12-s1-alter-v1": "pass" }).id, steps[0].id);
});

test("module resume: closed lessons and locked steps are excluded; completed modules have no unfinished step", () => {
  const view = structuredClone(content);
  view.lessons[0].closed = true;
  const next = view.lessons[1].blocks.filter((block) => block.type === "step"); next[0].locked = true;
  assert.equal(moduleResumeStep(view, {}).id, next[1].id);
  assert.equal(moduleResumeStep(content, Object.fromEntries(steps.map((step) => [activityStateId(step), "pass"]))), undefined);
});

test("module exercises: revised requirements get separate identities and retain unsolved samples", () => {
  for (const [week, numbers] of [[12, [1, 3, 4, 7]], [13, [6, 9, 11]]]) {
    const tasks = load(week).lessons.flatMap((lesson) => lesson.blocks).filter((step) => step.type === "step" && numbers.includes(step.number));
    assert.equal(tasks.length, numbers.length);
    for (const step of tasks) {
      assert.equal(step.activity.id, `${step.id}-alter-v2`);
      assert.deepEqual(step.activity.files, []);
      assert.equal(moduleResumeStep({ ...content, lessons: [{ blocks: [step] }] }, { [`task:${step.id}-alter-v1`]: "pass" }).id, step.id);
    }
  }
});
