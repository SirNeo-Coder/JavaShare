// .NET 1 Week 2 three-part file (sample + discussion, guided example, own task) on web media steps (teacher, 2026-11-25).
// Every "Look at line N" quote, guided line and answer-key line must sit where the text says; Your task starts from the
// guided code (CKB-141) and its line numbers count in the editor after the guided example (CKB-142). The pages are run by
// the teacher's checker (docs/modules/dotnet1/week02/test_threepart_checker.py) and in real CodeShare
// (tests/dotnet1-week02-three-part.browser.mjs). Answer pages: solutions/<step id>/ (guided), solutions/<task id>/ (own).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { courseModule } from "../backend/src/course-module-schema.ts";
import { checkModuleRun, guidedStateId, sampleStateId, teacherCheckedStep } from "../backend/src/module-activities.ts";

const load = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const content = load("../docs/modules/dotnet1/week02/DotNet1_Week_02.threepart.codeshare.json");
const source = load("../docs/modules/dotnet1/week02/DotNet1_Week_02.codeshare.json");
const edits = load("./fixtures/dotnet1-week02-three-part-edits.json");
const steps = (module) => module.lessons.flatMap((lesson) => lesson.blocks.filter((block) => block.type === "step"));
const page = (folder) => readFileSync(new URL(`../docs/modules/dotnet1/week02/solutions/${folder}/index.html`, import.meta.url), "utf8");
const lines = (text) => text.split("\n");

test("Week 2 three-part: uploads, keeps lessons, slips, starters, samples and the module link, and gives every own task a -v2 id", () => {
  courseModule.parse(content);
  assert.deepEqual(steps(content).map((step) => step.id), steps(source).map((step) => step.id));
  for (const [index, step] of steps(content).entries()) {
    const old = steps(source)[index];
    assert.equal(step.activity.id, old.activity.id.replace(/-alter-v1$/, "-alter-v2"));
    assert.deepEqual([step.files, step.expectedOutput, step.webChecks, step.mediaChecks, step.includeMediaOutput],
      [old.files, old.expectedOutput, old.webChecks, old.mediaChecks, old.includeMediaOutput], `${step.id}: the sample is unchanged`);
    assert.equal(step.activity.guided.expectedOutput, old.activity.expectedOutput, `${step.id}: the guided example is the verified old task`);
    assert.notEqual(step.activity.expectedOutput, step.activity.guided.expectedOutput, `${step.id}: own task and guided example give different pages`);
    assert.doesNotMatch(step.activity.instruction, /</, `${step.id}: the own task gives no code`);
    assert.equal(teacherCheckedStep(step), true, `${step.id}: a media step (Media checks: in its outputs)`);
  }
  assert.deepEqual(content.lessons.map((lesson) => [lesson.id, lesson.exitSlip]), source.lessons.map((lesson) => [lesson.id, lesson.exitSlip]));
  assert.deepEqual([content.id, content.starterFiles, content.previousModuleId, content.performanceTask, content.sampleFirst],
    [source.id, source.starterFiles, source.previousModuleId, source.performanceTask, source.sampleFirst]);
});

test("Week 2 three-part: every discussion quote sits on the line it names", () => {
  let checked = 0;
  for (const step of steps(content)) {
    for (const [, line, quote] of step.activity.guided.discussion.matchAll(/Look at line (\d+)\. `([^`]+)`/g)) {
      assert.ok(lines(step.files[0].content)[Number(line) - 1].includes(quote), `${step.id}: line ${line} does not hold ${quote}`);
      checked++;
    }
  }
  assert.ok(checked >= 44, `only ${checked} quotes checked`);
});

test("Week 2 three-part: guided lines, answer-key lines, continuity and Your task's line numbers", () => {
  for (const step of steps(content)) {
    const sample = lines(step.files[0].content), guided = lines(page(step.id)), own = page(step.activity.id);
    const code = step.activity.guided.code.split("\n");
    for (const line of code) assert.ok(guided.includes(line), `${step.id}: guided line not in the guided page: ${line}`);
    for (const [, from, to] of step.activity.guided.instruction.matchAll(/\*\*lines? (\d+)(?: (?:to|and) (\d+))?\*\*/g)) {
      for (const line of guided.slice(from - 1, Number(to ?? from))) assert.ok(code.includes(line), `${step.id}: guided line ${from}: ${line}`);
    }
    for (const block of step.activity.solution.lines.split("\n\n")) {
      const [heading, ...quoted] = block.split("\n");
      const [, start, end] = heading.match(/^index\.html, lines? (\d+)(?:-(\d+))?:$/);
      assert.deepEqual(lines(own).slice(start - 1, Number(end ?? start)), quoted, `${step.id}: ${heading}`);
    }
    const fromGuided = edits[step.id].fromGuided.reduce((text, edit) => {
      assert.equal(text.split(edit.from).length, 2, `${step.id}: ${edit.from} must appear once`); return text.replace(edit.from, edit.to); }, page(step.id));
    assert.equal(fromGuided, own, `${step.id}: changing the guided code as Your task says gives the answer page`);
    assert.match(step.activity.instruction, /guided example/, `${step.id}: Your task says what to do with the guided code`);
    for (const [, n, ofSample] of step.activity.instruction.matchAll(/line (\d+)( of the sample)?/g)) {
      assert.ok(ofSample || guided[n - 1] === sample[n - 1] || code.includes(guided[n - 1]), `${step.id}: Your task's line ${n} moved after the guided example`);
    }
  }
});

test("Week 2 three-part: with its media uploaded, CodeShare's rule takes sample, then guided example, then own task", () => {
  // Media steps are checked automatically only once the module's media files are uploaded (online); then each run's
  // output carries the media lines, as the expected outputs do.
  const run = (output) => ({ success: true, output, media: output.split("\nMedia checks:\n")[1].split("\n"), checks: [] });
  for (const step of steps(content)) {
    const sampleRun = { ...run(step.expectedOutput), checks: (step.webChecks ?? []).map((check) => ({ count: check.count ?? 1, ...(check.attribute ? { attribute: check.value } : {}) })) };
    assert.equal(checkModuleRun(content, step, {}, step.files, sampleRun).passed, true, `${step.id}: sample`);
    const afterSample = { [sampleStateId(step)]: "pass" };
    const files = (folder) => [{ path: "index.html", content: page(folder) }];
    const guided = checkModuleRun(content, step, afterSample, files(step.id), run(step.activity.guided.expectedOutput));
    assert.deepEqual([guided.check, guided.passed], ["guided", true], `${step.id}: guided`);
    const afterGuided = { ...afterSample, [guidedStateId(step)]: "pass" };
    assert.equal(checkModuleRun(content, step, afterGuided, files(step.id), run(step.activity.guided.expectedOutput)).passed, false, `${step.id}: the guided page does not complete`);
    const own = checkModuleRun(content, step, afterGuided, files(step.activity.id), run(step.activity.expectedOutput));
    assert.deepEqual([own.check, own.passed], ["task", true], `${step.id}: own task`);
  }
});
