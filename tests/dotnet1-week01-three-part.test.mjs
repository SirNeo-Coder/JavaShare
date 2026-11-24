// .NET 1 Week 1 three-part file (sample + discussion, guided example, own task) on web steps (teacher, 2026-11-24).
// Every "Look at line N" quote, guided line and answer-key line must sit where the text says. The pages themselves
// are run by the teacher's checker (docs/modules/dotnet1/week01/test_threepart_checker.py) and in real CodeShare
// (tests/dotnet1-week01-three-part.browser.mjs).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { courseModule } from "../backend/src/course-module-schema.ts";
import { checkModuleRun, guidedStateId, sampleStateId } from "../backend/src/module-activities.ts";

const load = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const content = load("../docs/modules/dotnet1/week01/DotNet1_Week_01.threepart.codeshare.json");
const source = load("../docs/modules/dotnet1/week01/DotNet1_Week_01.codeshare.json");
const edits = load("./fixtures/dotnet1-week01-three-part-edits.json");
const steps = (module) => module.lessons.flatMap((lesson) => lesson.blocks.filter((block) => block.type === "step"));
const solved = (step, kind) => step.files.map((file) => ({ ...file, content: edits[step.id][kind]
  .reduce((text, edit) => { assert.equal(text.split(edit.from).length, 2, `${step.id} ${kind}: ${edit.from} must appear once`); return text.replace(edit.from, edit.to); }, file.content) }));
const linesOf = (files) => files[0].content.split("\n");
const answerPage = (folder) => readFileSync(new URL(`../docs/modules/dotnet1/week01/solutions/${folder}/index.html`, import.meta.url), "utf8");

test("Week 1 three-part: uploads, keeps lessons, slips, starters and the module id, and gives every own task a -v2 id", () => {
  courseModule.parse(content);
  assert.deepEqual(steps(content).map((step) => step.id), steps(source).map((step) => step.id));
  for (const [index, step] of steps(content).entries()) {
    const old = steps(source)[index];
    assert.equal(step.activity.id, old.activity.id.replace(/-alter-v1$/, "-alter-v2"));
    assert.deepEqual([step.files, step.expectedOutput, step.webChecks], [old.files, old.expectedOutput, old.webChecks], `${step.id}: the sample is unchanged`);
    assert.equal(step.activity.guided.expectedOutput, old.activity.expectedOutput, `${step.id}: the guided example is the verified old task`);
    assert.notEqual(step.activity.expectedOutput, step.activity.guided.expectedOutput, `${step.id}: own task and guided example give different pages`);
    assert.doesNotMatch(step.activity.instruction, /</, `${step.id}: the own task gives no code`);
    assert.ok(step.activity.solution.lines && step.activity.solution.note && step.activity.guided.discussion);
  }
  assert.deepEqual(content.lessons.map((lesson) => [lesson.id, lesson.exitSlip]), source.lessons.map((lesson) => [lesson.id, lesson.exitSlip]));
  assert.deepEqual([content.id, content.starterFiles, content.previousModuleId, content.performanceTask, content.sampleFirst],
    [source.id, source.starterFiles, source.previousModuleId, source.performanceTask, source.sampleFirst]);
});

test("Week 1 three-part: every discussion quote sits on the line it names", () => {
  let checked = 0;
  for (const step of steps(content)) {
    for (const [, line, quote] of step.activity.guided.discussion.matchAll(/Look at line (\d+)\. `([^`]+)`/g)) {
      assert.ok(linesOf(step.files)[Number(line) - 1].includes(quote), `${step.id}: line ${line} does not hold ${quote}`);
      checked++;
    }
  }
  assert.ok(checked >= 50, `only ${checked} quotes checked`);
});

test("Week 1 three-part: guided lines and answer-key lines sit where they say; the answer pages are the solved files", () => {
  for (const step of steps(content)) {
    const guided = solved(step, "guided"), own = solved(step, "own");
    assert.equal(guided[0].content, answerPage(step.id), `${step.id}: the guided page is the old verified answer`);
    assert.equal(own[0].content, answerPage(step.activity.id), `${step.id}: the own-task answer page`);
    const [, from, and] = step.activity.guided.instruction.match(/\*\*lines? (\d+)(?: and (\d+))?\*\*/);
    const code = step.activity.guided.code.split("\n");
    assert.deepEqual(linesOf(guided).slice(from - 1, from - 1 + code.length), code, `${step.id}: guided code is not at line ${from}`);
    if (and) assert.equal(Number(and), Number(from) + 1);
    const [heading, ...quoted] = step.activity.solution.lines.split("\n");
    const [, start, end] = heading.match(/^index\.html, lines? (\d+)(?:-(\d+))?:$/);
    assert.deepEqual(linesOf(own).slice(start - 1, end ?? start), quoted, `${step.id}: ${heading}`);
  }
});

test("Week 1 three-part: CodeShare's rule takes sample, then guided example, then own task; only the own task completes", () => {
  for (const step of steps(content)) {
    const page = (output) => ({ success: true, output, checks: (step.webChecks ?? []).map((check) => ({ count: check.count ?? 1, ...(check.attribute ? { attribute: check.value } : {}) })) });
    assert.equal(checkModuleRun(content, step, {}, step.files, page(step.expectedOutput)).passed, true, `${step.id}: sample`);
    const afterSample = { [sampleStateId(step)]: "pass" };
    const guided = checkModuleRun(content, step, afterSample, solved(step, "guided"), page(step.activity.guided.expectedOutput));
    assert.deepEqual([guided.check, guided.passed], ["guided", true], `${step.id}: guided`);
    assert.equal(checkModuleRun(content, step, afterSample, solved(step, "own"), page(step.activity.expectedOutput)).passed, false, `${step.id}: the own task cannot skip the guided example`);
    const afterGuided = { ...afterSample, [guidedStateId(step)]: "pass" };
    assert.equal(checkModuleRun(content, step, afterGuided, solved(step, "guided"), page(step.activity.guided.expectedOutput)).passed, false, `${step.id}: the guided page does not complete`);
    const own = checkModuleRun(content, step, afterGuided, solved(step, "own"), page(step.activity.expectedOutput));
    assert.deepEqual([own.check, own.passed], ["task", true], `${step.id}: own task`);
  }
});

// The printed step guide (source/p9.html onward, built by build_step_pages.py) matches the module file and never
// prints the answer key (teacher, 2026-11-11: the PDF module never prints an answer).
test("Week 1 three-part: the printed step pages match the module file and never print an answer", () => {
  const decode = (text) => text.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
  const pageOf = (number) => readFileSync(new URL(`../docs/modules/dotnet1/week01/source/p${8 + number}.html`, import.meta.url), "utf8");
  for (const step of steps(content)) {
    const html = pageOf(step.number);
    assert.ok(html.includes(`data-step="${step.id}"`), `${step.id}: printed on page ${8 + step.number}`);
    const numbered = [...html.matchAll(/<span class="cl">(.*?)<\/span>/g)].map((m) => decode(m[1]));
    assert.deepEqual(numbered.map((line) => line === " " ? "" : line), step.files[0].content.replace(/\n$/, "").split("\n"), `${step.id}: numbered sample`);
    const outputs = [...html.matchAll(/<pre class="out">(.*?)<\/pre>/g)].map((m) => [...m[1].matchAll(/<span class="ln">(.*?)<\/span>/g)].map((l) => decode(l[1])).join("\n"));
    assert.deepEqual(outputs, [step.activity.guided.expectedOutput, step.activity.expectedOutput], `${step.id}: guided and task outputs`);
    const text = decode(html);
    assert.ok(text.includes(step.activity.guided.code), `${step.id}: guided code`);
    const [, ...answer] = step.activity.solution.lines.split("\n");
    const shown = `${step.files[0].content}\n${step.activity.guided.code}`;
    for (const line of answer.map((line) => line.trim()).filter((line) => !shown.includes(line))) {
      assert.ok(!text.includes(line), `${step.id}: the answer line ${line} is printed`);
    }
    assert.ok(!text.replace(/\s+/g, "").includes(answer.join("").replace(/\s+/g, "")), `${step.id}: the answer is printed`);
    assert.ok(!text.includes(step.activity.solution.note), `${step.id}: the answer note is printed`);
  }
});
