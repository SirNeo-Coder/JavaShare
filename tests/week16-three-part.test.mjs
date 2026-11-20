// Week 16 three-part file (sample + discussion, guided example, own task). Every "Look at line N" quote,
// every guided line and every answer-key line must sit where the text says; every sample, guided example
// and own-task answer must give its exact output on the laptop runner. The CheerpJ (online) run is
// tests/week16-three-part.browser.mjs.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { courseModule } from "../backend/src/course-module-schema.ts";
import { executeLocallyResult } from "../backend/src/java-runner.ts";
import { matchesActivityOutput, matchesSample } from "../backend/src/module-activities.ts";

const load = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const content = load("../docs/modules/week16/Java2_Week_16.threepart.codeshare.json");
const source = load("../docs/modules/week16/Java2_Week_16.codeshare.json");
const edits = load("./fixtures/week16-three-part-edits.json");
const steps = (module) => module.lessons.flatMap((lesson) => lesson.blocks.filter((block) => block.type === "step"));
const solved = (step, kind) => step.files.map((file) => ({ ...file, content: edits[step.id][kind]
  .filter((edit) => edit.path === file.path)
  .reduce((text, edit) => { assert.ok(text.includes(edit.from), `${step.id} ${kind}: missing ${edit.from}`); return text.replaceAll(edit.from, edit.to); }, file.content) }));
const linesOf = (files, path) => files.find((file) => file.path === path)?.content.split("\n");

test("Week 16 three-part: uploads as five days, Monday to Friday, with ten steps and a liplet every day", () => {
  courseModule.parse(content);
  assert.deepEqual(content.lessons.map((lesson) => lesson.dayLabel), ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]);
  assert.deepEqual(steps(content).map((step) => step.number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  for (const lesson of content.lessons) assert.ok(lesson.exitSlip.questions.length >= 3, `${lesson.id} has a liplet`);
  // The eight earlier steps keep their step ids (saved progress), with new -v2 own tasks; the two new steps are -v1.
  const earlier = steps(source).map((step) => step.id);
  for (const step of steps(content)) {
    const kept = earlier.includes(step.id);
    assert.equal(step.activity.id, `${step.id}-alter-${kept ? "v2" : "v1"}`);
    assert.deepEqual(step.activity.files, []);
    assert.ok(step.activity.solution.lines && step.activity.guided.discussion);
  }
  assert.deepEqual(steps(content).filter((step) => earlier.includes(step.id)).map((step) => step.id), earlier);
  assert.deepEqual([content.starterFiles, content.previousModuleId], [source.starterFiles, source.previousModuleId]);
});

test("Week 16 three-part: every discussion quote sits on the line it names", () => {
  let checked = 0;
  for (const step of steps(content)) {
    for (const [, from, path = "Main.java", quote] of step.activity.guided.discussion.matchAll(/Look at line (\d+)(?: of (\w+\.java))?\. `([^`]+)`/g)) {
      assert.ok(linesOf(step.files, path)[Number(from) - 1].includes(quote), `${step.id}: ${path} line ${from} does not hold ${quote}`);
      checked++;
    }
  }
  assert.ok(checked >= 60, `only ${checked} quotes checked`);
});

test("Week 16 three-part: guided lines and answer-key lines sit where they say", () => {
  for (const step of steps(content)) {
    const guided = solved(step, "guided").flatMap((file) => file.content.split("\n"));
    for (const line of step.activity.guided.code.split("\n")) assert.ok(guided.includes(line), `${step.id}: guided line not in the guided files: ${line}`);
    const own = solved(step, "own");
    for (const block of step.activity.solution.lines.split("\n\n")) {
      const [heading, ...quoted] = block.split("\n");
      const [, path, from, to] = heading.match(/^(\S+\.java), lines? (\d+)(?:-(\d+))?/);
      assert.deepEqual(linesOf(own, path).slice(from - 1, to ?? from), quoted, `${step.id}: ${heading}`);
    }
  }
});

test("Week 16 three-part: sample, guided example and own task give their exact output on laptop Java", async (t) => {
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
