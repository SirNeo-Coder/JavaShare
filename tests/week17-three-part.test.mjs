// Week 17 three-part file (sample + discussion, guided example, own task). Every "Look at line N" quote,
// every guided line and every answer-key line must sit where the text says; every sample, guided example
// and own-task answer must give its exact output on the laptop runner. The CheerpJ (online) run is
// tests/week17-three-part.browser.mjs.
// The GUI samples print what their real Swing controls show (built without a screen), never only "No display".
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { courseModule } from "../backend/src/course-module-schema.ts";
import { executeLocallyResult } from "../backend/src/java-runner.ts";
import { matchesActivityOutput, matchesSample } from "../backend/src/module-activities.ts";

const load = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const content = load("../docs/modules/week17/Java2_Week_17.threepart.codeshare.json");
const source = load("../docs/modules/week17/Java2_Week_17.codeshare.json");
const edits = load("./fixtures/week17-three-part-edits.json");
const steps = (module) => module.lessons.flatMap((lesson) => lesson.blocks.filter((block) => block.type === "step"));
const solved = (step, kind) => step.files.map((file) => ({ ...file, content: edits[step.id][kind]
  .filter((edit) => edit.path === file.path)
  .reduce((text, edit) => { assert.ok(text.includes(edit.from), `${step.id} ${kind}: missing ${edit.from}`); return text.replaceAll(edit.from, edit.to); }, file.content) }));
const linesOf = (files, path) => files.find((file) => file.path === path)?.content.split("\n");

const added = ["java-2-w17-d1-s2", "java-2-w17-d2-s4", "java-2-w17-d4-s8", "java-2-w17-d5-s10"];

test("Week 17 three-part: uploads, 10 steps over five days, keeps old ids and slips, and gives every own task a new id", () => {
  courseModule.parse(content);
  assert.deepEqual(steps(content).map((step) => step.number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(content.lessons.map((lesson) => lesson.blocks.filter((block) => block.type === "step").length), [2, 2, 2, 2, 2]);
  const before = new Map(steps(source).map((step) => [step.id, step]));
  assert.deepEqual(steps(content).filter((step) => !added.includes(step.id)).map((step) => step.id), [...before.keys()]);
  for (const step of steps(content)) {
    const old = before.get(step.id);
    assert.equal(step.activity.id, old ? old.activity.id.replace(/-alter-v1$/, "-alter-v2") : `${step.id}-alter-v1`);
    assert.deepEqual(step.activity.files, []);
    assert.ok(step.activity.solution.lines && step.activity.guided.discussion);
    assert.ok(!step.expectedOutput.includes("No display"), `${step.id} still prints only No display`);
  }
  assert.deepEqual(content.lessons.map((lesson) => [lesson.id, lesson.exitSlip.id, lesson.exitSlip.questions.map((q) => q.id)]),
    source.lessons.map((lesson) => [lesson.id, lesson.exitSlip.id, lesson.exitSlip.questions.map((q) => q.id)]));
  assert.deepEqual(content.lessons.map((lesson) => lesson.exitSlip.afterStep), steps(content).filter((step) => step.number % 2 === 0).map((step) => step.id));
  assert.deepEqual([content.starterFiles, content.previousModuleId, content.id], [source.starterFiles, source.previousModuleId, source.id]);
});

test("Week 17 three-part: every discussion quote sits on the line it names", () => {
  let checked = 0;
  for (const step of steps(content)) {
    for (const [, from, path = "Main.java", quote] of step.activity.guided.discussion.matchAll(/Look at line (\d+)(?: of (\w+\.java))?\. `([^`]+)`/g)) {
      assert.ok(linesOf(step.files, path)[Number(from) - 1].includes(quote), `${step.id}: ${path} line ${from} does not hold ${quote}`);
      checked++;
    }
  }
  assert.ok(checked >= 80, `only ${checked} quotes checked`);
});

test("Week 17 three-part: guided lines and answer-key lines sit where they say", () => {
  for (const step of steps(content)) {
    const guided = linesOf(solved(step, "guided"), edits[step.id].guided[0].path);
    for (const line of step.activity.guided.code.split("\n")) assert.ok(guided.includes(line), `${step.id}: guided line not in the guided file: ${line}`);
    const own = solved(step, "own");
    for (const block of step.activity.solution.lines.split("\n\n")) {
      const [heading, ...quoted] = block.split("\n");
      const [, path, from, to] = heading.match(/^(\S+\.java), lines? (\d+)(?:-(\d+))?/);
      assert.deepEqual(linesOf(own, path).slice(from - 1, to ?? from), quoted, `${step.id}: ${heading}`);
    }
  }
});

test("Week 17 three-part: sample, guided example and own task give their exact output on laptop Java", async (t) => {
  for (const step of steps(content)) {
    await t.test(`Step ${step.number}`, async () => {
      const sample = await executeLocallyResult(step.files, "");
      assert.equal(matchesSample(sample, step), true, sample.output);
      const guided = await executeLocallyResult(solved(step, "guided"), "");
      assert.equal(matchesActivityOutput(guided, step.activity.guided.expectedOutput), true, guided.output);
      const own = await executeLocallyResult(solved(step, "own"), "");
      assert.equal(matchesActivityOutput(own, step.activity.expectedOutput), true, own.output);
      assert.notEqual(step.activity.guided.expectedOutput, step.activity.expectedOutput);
    });
  }
});
