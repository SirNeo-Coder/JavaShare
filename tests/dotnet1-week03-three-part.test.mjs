// .NET 1 Week 3 three-part file (sample + discussion, guided example, own task) on steps with several pages (teacher,
// 2026-11-25). Every "Look at line N of <page>" quote, guided line and answer-key line must sit in the page it names;
// Your task starts from the guided code (CKB-141) and its line numbers count in that page after the guided example
// (CKB-142). A step loads only its own pages; the others keep the student's earlier work, so no step may depend on a
// page it does not load. The pages are run by the teacher's checker (docs/modules/dotnet1/week03/test_threepart_checker.py)
// and in real CodeShare (tests/dotnet1-week03-three-part.browser.mjs). Answer pages: solutions/<step id>/ (guided),
// solutions/<task id>/ (own).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { courseModule } from "../backend/src/course-module-schema.ts";
import { checkModuleRun, guidedStateId, sampleStateId, teacherCheckedStep } from "../backend/src/module-activities.ts";

const load = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const content = load("../docs/modules/dotnet1/week03/DotNet1_Week_03.threepart.codeshare.json");
const source = load("../docs/modules/dotnet1/week03/DotNet1_Week_03.codeshare.json");
const edits = load("./fixtures/dotnet1-week03-three-part-edits.json");
const steps = (module) => module.lessons.flatMap((lesson) => lesson.blocks.filter((block) => block.type === "step"));
const page = (folder, file) => readFileSync(new URL(`../docs/modules/dotnet1/week03/solutions/${folder}/${file}`, import.meta.url), "utf8");
const lines = (text) => text.split("\n");
const sampleOf = (step, file) => step.files.find((f) => f.path === file)?.content;
const MEDIA_STEPS = ["dotnet-1-r03-d1-s1", "dotnet-1-r03-d5-s9"];

test("Week 3 three-part: uploads, keeps lessons, slips, starters, samples and the module link, and gives every own task a -v2 id", () => {
  courseModule.parse(content);
  assert.deepEqual(steps(content).map((step) => step.id), steps(source).map((step) => step.id));
  for (const [index, step] of steps(content).entries()) {
    const old = steps(source)[index];
    assert.equal(step.activity.id, old.activity.id.replace(/-alter-v1$/, "-alter-v2"));
    assert.deepEqual([step.files, step.run, step.expectedOutput, step.webChecks, step.mediaChecks, step.includeMediaOutput],
      [old.files, old.run, old.expectedOutput, old.webChecks, old.mediaChecks, old.includeMediaOutput], `${step.id}: the sample is unchanged`);
    assert.equal(step.activity.guided.expectedOutput, old.activity.expectedOutput, `${step.id}: the guided example is the verified old task`);
    assert.notEqual(step.activity.expectedOutput, step.activity.guided.expectedOutput, `${step.id}: own task and guided example give different pages`);
    assert.doesNotMatch(step.activity.instruction, /</, `${step.id}: the own task gives no code`);
    assert.equal(teacherCheckedStep(step), MEDIA_STEPS.includes(step.id), `${step.id}: only Steps 1 and 9 are media steps`);
  }
  assert.deepEqual(content.lessons.map((lesson) => [lesson.id, lesson.exitSlip]), source.lessons.map((lesson) => [lesson.id, lesson.exitSlip]));
  assert.deepEqual([content.id, content.starterFiles, content.previousModuleId, content.performanceTask, content.sampleFirst],
    [source.id, source.starterFiles, source.previousModuleId, source.performanceTask, source.sampleFirst]);
});

test("Week 3 three-part: every discussion quote sits on the line it names, in the page it names", () => {
  let checked = 0;
  for (const step of steps(content)) {
    const discussion = step.activity.guided.discussion;
    assert.equal((discussion.match(/Look at line \d+\./g) ?? []).length, 0, `${step.id}: every discussion line names its page`);
    for (const [, line, file, quote] of discussion.matchAll(/Look at line (\d+) of ([\w.]+)\. `([^`]+)`/g)) {
      const sample = sampleOf(step, file);
      assert.ok(sample, `${step.id}: the discussion names ${file}, which this step does not load`);
      assert.ok(lines(sample)[Number(line) - 1].includes(quote), `${step.id}: line ${line} of ${file} does not hold ${quote}`);
      checked++;
    }
  }
  assert.ok(checked >= 54, `only ${checked} quotes checked`);
});

test("Week 3 three-part: guided lines, answer-key lines, continuity and Your task's line numbers, per page", () => {
  for (const step of steps(content)) {
    const file = edits[step.id].fromGuided[0].path;
    const sample = lines(sampleOf(step, file)), guided = lines(page(step.id, file)), own = page(step.activity.id, file);
    const code = step.activity.guided.code.split("\n");
    for (const line of code) assert.ok(guided.includes(line), `${step.id}: guided line not in the guided page: ${line}`);
    const named = [...step.activity.guided.instruction.matchAll(/\*\*lines? (\d+)(?: (?:to|and) (\d+))? of ([\w.]+)\*\*/g)];
    assert.equal(named.length, 1, `${step.id}: the guided example names its line and page`);
    for (const [, from, to, inFile] of named) {
      assert.equal(inFile, file, `${step.id}: the guided example names ${inFile}`);
      for (const line of guided.slice(from - 1, Number(to ?? from))) assert.ok(code.includes(line), `${step.id}: guided line ${from}: ${line}`);
    }
    for (const block of step.activity.solution.lines.split("\n\n")) {
      const [heading, ...quoted] = block.split("\n");
      const [, inFile, start, end] = heading.match(/^([\w.]+\.html), lines? (\d+)(?:-(\d+))?:$/);
      assert.equal(inFile, file, `${step.id}: ${heading}`);
      assert.deepEqual(lines(own).slice(start - 1, Number(end ?? start)), quoted, `${step.id}: ${heading}`);
    }
    const fromGuided = edits[step.id].fromGuided.reduce((text, edit) => {
      assert.equal(edit.path, file);
      assert.equal(text.split(edit.from).length, 2, `${step.id}: ${edit.from} must appear once`); return text.replace(edit.from, edit.to); }, page(step.id, file));
    assert.equal(fromGuided, own, `${step.id}: changing the guided code as Your task says gives the answer page`);
    assert.match(step.activity.instruction, /guided example/, `${step.id}: Your task says what to do with the guided code`);
    // "line N" (or "lines N to M") counts in the named page after the guided example (CKB-142); unnamed means the run page.
    for (const [, from, to, ofWhat] of step.activity.instruction.matchAll(/lines? (\d+)(?: to (\d+))?(?: of (the sample|[\w.]+\.html))?/g)) {
      if (ofWhat === "the sample") continue;
      assert.equal(ofWhat ?? step.run, file, `${step.id}: Your task's line ${from} is in ${file}`);
      for (let n = Number(from); n <= Number(to ?? from); n++) {
        assert.ok(guided[n - 1] === sample[n - 1] || code.includes(guided[n - 1]), `${step.id}: Your task's line ${n} of ${file} moved after the guided example`);
      }
    }
  }
});

test("Week 3 three-part: each step's output, links, frame and page checks use only the pages the step loads", () => {
  // The run page is always loaded by the step; the only page it shows from elsewhere is a frame, whose text is not page
  // text. A step's own-task page must change only its run page.
  for (const step of steps(content)) {
    assert.ok(sampleOf(step, step.run), `${step.id}: the step loads its run page`);
    assert.equal(edits[step.id].fromGuided[0].path, step.run, `${step.id}: Your task changes the run page`);
    for (const [, src] of sampleOf(step, step.run).matchAll(/<iframe src="([^"]+)"/g)) {
      assert.ok(steps(content).slice(0, step.number - 1).some((earlier) => sampleOf(earlier, src)), `${step.id}: the frame's ${src} comes from an earlier step`);
      const heading = sampleOf(steps(content).find((earlier) => sampleOf(earlier, src)), src).match(/<h1>(.*?)<\/h1>/)[1];
      for (const output of [step.expectedOutput, step.activity.guided.expectedOutput, step.activity.expectedOutput]) {
        assert.ok(!output.includes(heading), `${step.id}: the framed page's ${heading} is not in the output`);
      }
    }
  }
});

test("Week 3 three-part: CodeShare's rule takes sample, then guided example, then own task (media lines on Steps 1 and 9)", () => {
  // Media steps are checked automatically only once the module's media files are uploaded (online); then each run's
  // output carries the media lines, as the expected outputs do.
  const run = (output) => ({ success: true, output, media: output.includes("\nMedia checks:\n") ? output.split("\nMedia checks:\n")[1].split("\n") : [], checks: [] });
  for (const step of steps(content)) {
    const sampleRun = { ...run(step.expectedOutput), checks: (step.webChecks ?? []).map((check) => ({ count: check.count ?? 1, ...(check.attribute ? { attribute: check.value } : {}) })) };
    assert.equal(checkModuleRun(content, step, {}, step.files, sampleRun).passed, true, `${step.id}: sample`);
    const afterSample = { [sampleStateId(step)]: "pass" };
    const files = (folder) => step.files.map((f) => f.path === step.run ? { path: f.path, content: page(folder, f.path) } : f);
    const guided = checkModuleRun(content, step, afterSample, files(step.id), run(step.activity.guided.expectedOutput));
    assert.deepEqual([guided.check, guided.passed], ["guided", true], `${step.id}: guided`);
    const afterGuided = { ...afterSample, [guidedStateId(step)]: "pass" };
    assert.equal(checkModuleRun(content, step, afterGuided, files(step.id), run(step.activity.guided.expectedOutput)).passed, false, `${step.id}: the guided page does not complete`);
    const own = checkModuleRun(content, step, afterGuided, files(step.activity.id), run(step.activity.expectedOutput));
    assert.deepEqual([own.check, own.passed], ["task", true], `${step.id}: own task`);
  }
});

// The printed step guide (source/p9.html to p17.html, build_step_pages.py, option A 2026-11-25): each page prints, per
// page name, the sample lines the discussion and guided example name with their real numbers, matches the module file
// and never prints an answer. Steps 1 and 9 (56-line outputs) print only the output lines that differ from the sample's
// output, with their line numbers (teacher, 2026-11-25); the other steps print both outputs in full.
test("Week 3 three-part: the printed step pages show every named line of every page with its real number and never print an answer", () => {
  const decode = (text) => text.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#x27;/g, "'").replace(/&amp;/g, "&");
  const outLines = (pre) => [...pre.matchAll(/<span class="ln">(.*?)<\/span>/g)].map((l) => decode(l[1]));
  for (const step of steps(content)) {
    const html = readFileSync(new URL(`../docs/modules/dotnet1/week03/source/p${8 + step.number}.html`, import.meta.url), "utf8");
    assert.ok(html.includes(`data-step="${step.id}"`), `${step.id}: printed on page ${8 + step.number}`);
    const named = {};
    for (const [, n, file] of step.activity.guided.discussion.matchAll(/Look at line (\d+) of ([\w.]+)\./g)) (named[file] ??= []).push(Number(n));
    for (const [, from, to, file] of step.activity.guided.instruction.matchAll(/\*\*lines? (\d+)(?: (?:to|and) (\d+))? of ([\w.]+)\*\*/g)) {
      for (let n = Number(from); n <= Number(to ?? from); n++) if (n <= lines(sampleOf(step, file)).length) (named[file] ??= []).push(n);
    }
    const excerpts = [...html.matchAll(/<pre class="code numbered" data-file="([\w.]+)">(.*?)<\/pre>/g)];
    assert.deepEqual(excerpts.map((m) => m[1]).sort(), Object.keys(named).sort(), `${step.id}: one excerpt per named page`);
    assert.ok(html.includes(`<b>${excerpts[0][1]}</b>`) && excerpts[0][1] === step.run, `${step.id}: the run page first, with its name above it`);
    for (const [, file, body] of excerpts) {
      const sample = lines(sampleOf(step, file));
      const printed = new Map([...body.matchAll(/<span class="cl" data-n="(\d+)">(.*?)<\/span>/g)].map((m) => [Number(m[1]), decode(m[2])]));
      for (const [n, text] of printed) assert.equal(text === " " ? "" : text, sample[n - 1], `${step.id}: printed line ${n} of ${file}`);
      for (const n of named[file]) assert.ok(printed.has(n), `${step.id}: line ${n} of ${file} is named but not printed`);
    }
    const [guidedBox, taskBox] = html.split('<div class="outs">')[1].split("</div><div>");
    const long = lines(step.expectedOutput).length > 30;
    assert.equal(long, MEDIA_STEPS.includes(step.id), `${step.id}: only Steps 1 and 9 have long outputs`);
    for (const [box, want] of [[guidedBox, step.activity.guided.expectedOutput], [taskBox, step.activity.expectedOutput]]) {
      if (!long) { assert.deepEqual(outLines(box), lines(want), `${step.id}: full output`); continue; }
      const parts = [...box.matchAll(/<pre class="out" data-output-part="[^"]+" data-from="(\d+)">(.*?)<\/pre>/g)];
      assert.ok(parts.length, `${step.id}: the differing lines are printed`);
      const shown = new Set();
      for (const [, from, pre] of parts) outLines(pre).forEach((line, i) => { assert.equal(line, lines(want)[from - 1 + i], `${step.id}: output line ${Number(from) + i}`); shown.add(line); });
      for (const line of lines(want).filter((line) => !lines(step.expectedOutput).includes(line))) assert.ok(shown.has(line), `${step.id}: the new line ${line} is printed`);
    }
    const text = decode(html);
    assert.ok(text.includes(step.activity.guided.code), `${step.id}: guided code`);
    assert.ok(text.includes(step.activity.instruction.replace(/`|\*\*/g, "")), `${step.id}: Your task wording`);
    const shownCode = `${step.files.map((f) => f.content).join("\n")}\n${step.activity.guided.code}`;
    for (const block of step.activity.solution.lines.split("\n\n")) {
      for (const line of block.split("\n").slice(1).map((l) => l.trim()).filter((l) => l && !shownCode.includes(l))) assert.ok(!text.includes(line), `${step.id}: the answer line ${line} is printed`);
    }
    assert.ok(!text.includes(step.activity.solution.note), `${step.id}: the answer note is printed`);
  }
  const last = readFileSync(new URL("../docs/modules/dotnet1/week03/source/p18.html", import.meta.url), "utf8");
  for (const heading of ["Before you add your pages", "My Resume self-check", "Get ready for Week 4", "Starter pages"]) assert.ok(last.includes(heading), `page 18 keeps ${heading}`);
  assert.match(readFileSync(new URL("../docs/modules/dotnet1/week03/source/p6.html", import.meta.url), "utf8"), /Starter pages<\/b> for a student with no Week 2 work are on page 18\./);
});
