import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { test } from "node:test";
import { courseModule } from "../backend/src/course-module-schema.ts";
import { executeLocallyResult } from "../backend/src/java-runner.ts";
import { activityAccess, activityStateId, matchesActivityOutput, matchesSample, samplePending, sampleStateId } from "../backend/src/module-activities.ts";
import { moduleAccessBlock } from "../backend/src/module-prerequisites.ts";

const load = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const originals = load("./fixtures/week15-week21-originals.json");
const edits = load("./fixtures/week15-week21-task-edits.json");
const curriculum = Array.from({ length: 10 }, (_, i) => load(`../docs/modules/week${12 + i}/Java2_Week_${12 + i}.codeshare.json`));
const modules = curriculum.filter((content) => content.week >= 15);
const steps = (content) => content.lessons.flatMap((lesson) => lesson.blocks.filter((block) => block.type === "step"));
const digest = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const exec = promisify(execFile);
// Console checks run without windows; actual school-computer GUI use remains a separate check.
delete process.env.DISPLAY;
const alter = (step) => step.files.map((file) => {
  let content = file.content;
  for (const edit of edits[step.id].filter((edit) => edit.path === file.path)) {
    assert.ok(content.includes(edit.from), `${step.id}: missing exercise source in ${file.path}`);
    content = content.replaceAll(edit.from, edit.to);
  }
  return { ...file, content };
});

test("Weeks 12–21: actual curriculum links resolve and current tasks control ordered access", () => {
  const available = new Map(curriculum.map((content) => [content.id, content]));
  const states = new Map();
  const quiet = { current_activity_id: null, active_module_id: null };
  assert.equal(curriculum[0].previousModuleId, undefined);
  for (const [index, content] of curriculum.entries()) {
    if (index) assert.equal(content.previousModuleId, curriculum[index - 1].id, `Week ${content.week} must reference the actual preceding module id`);
  }
  for (const [index, content] of curriculum.entries()) {
    assert.equal(moduleAccessBlock(content, available, states, quiet), undefined, `Week ${content.week} opens after its predecessors pass`);
    const required = steps(content);
    const passed = Object.fromEntries(required.map((step) => [activityStateId(step), "pass"]));
    states.set(content.id, passed);
    if (!required.length) continue; // Week 20 remains written work, without invented code tasks.
    const first = required[0];
    states.set(content.id, { ...passed, [activityStateId(first)]: "fail", [sampleStateId(first)]: "pass", [first.id]: "pass" });
    for (const later of curriculum.slice(index + 1)) {
      assert.equal(moduleAccessBlock(later, available, states, quiet)?.moduleId, content.id, `Week ${later.week} must wait for unfinished Week ${content.week}, despite sample/legacy passes`);
    }
    states.set(content.id, passed);
  }
  for (const content of curriculum) assert.equal(moduleAccessBlock(content, available, states, quiet), undefined);
  available.delete(curriculum[5].id);
  assert.equal(moduleAccessBlock(curriculum[6], available, states, quiet)?.kind, "missing", "completion cannot substitute for a missing upload");
});

for (const content of modules) {
  test(`Week ${content.week}: upload accepts additions and every original lesson value survives`, () => {
    const parsed = courseModule.parse(content), before = originals[content.week];
    assert.equal(parsed.previousModuleId, curriculum.find((previous) => previous.week === content.week - 1).id);
    const restored = structuredClone(content);
    delete restored.previousModuleId;
    delete restored.sampleFirst;
    for (const lesson of restored.lessons) {
      if (before.missingSlipIds.includes(lesson.id)) delete lesson.exitSlip.afterStep;
      for (const step of lesson.blocks.filter((block) => block.type === "step")) {
        assert.equal(step.activity.id, `${step.id}-alter-v1`);
        assert.deepEqual(step.activity.files, [], "no solved source is supplied to students");
        assert.notEqual(step.expectedOutput, step.activity.expectedOutput);
        assert.ok(edits[step.id].length > 0);
        assert.ok(step.files.some((file) => file.path === "Main.java"));
        assert.ok(step.files.every((file) => file.path.endsWith(".java")));
        delete step.activity;
        step.files = before.originalStepFiles[step.id].map((path) => {
          const file = step.files.find((file) => file.path === path) ?? before.relocated.find((entry) => entry.step === step.id && entry.file.path === path)?.file;
          assert.ok(file, `${step.id}: original file ${path} lost`);
          if (!path.endsWith(".java")) assert.equal(readFileSync(new URL(`../docs/modules/week${content.week}/supporting-files/${path}`, import.meta.url), "utf8"), file.content);
          return file;
        });
      }
    }
    const originalFile = (path, supplied) => supplied.find((file) => file.path === path) ?? { path, content: readFileSync(new URL(`../docs/modules/week${content.week}/supporting-files/${path}`, import.meta.url), "utf8") };
    restored.starterFiles = before.originalStarterPaths.map((path) => originalFile(path, content.starterFiles));
    assert.ok(content.starterFiles.every((file) => file.path.endsWith(".java")));
    assert.ok(content.performanceTask.starterFiles.every((file) => file.path.endsWith(".java")));
    for (const [path, hash] of Object.entries(before.assetHashes)) assert.equal(createHash("sha256").update(readFileSync(new URL(`../docs/modules/week${content.week}/supporting-files/${path}`, import.meta.url))).digest("hex"), hash);
    if (before.originalPersonalStarterPaths) restored.performanceTask.starterFiles = before.originalPersonalStarterPaths.map((path) => originalFile(path, content.performanceTask.starterFiles));
    if (before.addedStarter) delete restored.performanceTask.starterFiles;
    if (before.addedExample) delete restored.performanceTask.exampleFiles;
    assert.equal(digest(restored), before.original, "original code, instructions, outputs, ids and assessments must remain unchanged");
    assert.equal(courseModule.safeParse(restored).success, content.week === 18, "the six original upload failures remain reproducible before the additions");
    if (content.week === 20) {
      assert.deepEqual(steps(content), []);
      assert.equal(parsed.sampleFirst, undefined);
      assert.equal(parsed.performanceTask.starterFiles[0].path, "Main.java");
    } else assert.equal(parsed.sampleFirst, true);
  });
}

test("Weeks 15–21: old samples and headless messages cannot pass new tasks or bypass their sample gate", () => {
  for (const content of modules) {
    const states = {};
    for (const step of steps(content)) {
      assert.equal(samplePending(content, step, states), true);
      assert.equal(matchesActivityOutput({ success: true, output: step.expectedOutput }, step.activity.expectedOutput), false);
      assert.equal(matchesActivityOutput({ success: true, output: "No display: GUI not opened." }, step.activity.expectedOutput), false);
      states[step.id] = "pass";
      assert.equal(samplePending(content, step, states), true);
      states[sampleStateId(step)] = "pass";
      assert.equal(samplePending(content, step, states), false);
      assert.equal(activityAccess(content, states).performanceTaskOpen, false);
      assert.equal(activityAccess(content, states).openStepIds.includes(activityStateId(step)), true);
      states[activityStateId(step)] = "pass";
    }
    assert.equal(activityAccess(content, states).performanceTaskOpen, true);
  }
});

// These trusted curriculum sources run in disposable folders, not through the classroom file block.
async function desktopRun(folder, files) {
  for (const file of files) await writeFile(join(folder, file.path), file.content);
  await exec("javac", ["-encoding", "UTF-8", "-d", folder, ...files.map((file) => join(folder, file.path))], { timeout: 15000 });
  const { stdout, stderr } = await exec("java", ["-Djava.awt.headless=true", "-cp", folder, "Main"], { cwd: folder, timeout: 5000, env: { ...process.env, LC_ALL: "C.UTF-8" } });
  assert.equal(stderr, "");
  return { success: true, output: stdout };
}

test("Week 15: original disk samples and each independent alteration match real Java output", async (t) => {
  const content = modules[0], folder = await mkdtemp(join(tmpdir(), "codeshare-w15-"));
  try {
    for (const step of steps(content)) {
      await t.test(`Week 15 Step ${step.number}: disk sample and alteration`, async () => {
        for (const asset of originals[15].relocated.filter((entry) => entry.step === step.id)) await writeFile(join(folder, asset.file.path), asset.file.content);
        const taskFolder = await mkdtemp(join(tmpdir(), "codeshare-w15-task-"));
        try {
          await cp(folder, taskFolder, { recursive: true });
          const baseline = await desktopRun(folder, step.files);
          assert.equal(matchesSample(baseline, step), true, baseline.output);
          const changed = await desktopRun(taskFolder, alter(step));
          assert.equal(matchesActivityOutput(changed, step.activity.expectedOutput), true, changed.output);
          assert.equal(matchesActivityOutput({ ...changed, success: false }, step.activity.expectedOutput), false);
          if (step.number === 9) assert.match(await readFile(join(taskFolder, "fleet_backup.txt"), "utf8"), /Bus,BUS 654,Mang Lito,30/);
          if (step.number === 10) assert.equal(await readFile(join(taskFolder, "report.txt"), "utf8"), changed.output.slice(0, changed.output.lastIndexOf("report.txt size:")));
        } finally { await rm(taskFolder, { recursive: true, force: true }); }
      });
    }
  } finally { await rm(folder, { recursive: true, force: true }); }
});

for (const content of modules.filter((content) => content.week !== 15 && content.week !== 20)) {
  test(`Week ${content.week}: complete samples and meaningful alterations run through the classroom laptop runner`, async (t) => {
    for (const step of steps(content)) {
      await t.test(`Week ${content.week} Step ${step.number}: sample and alteration`, async () => {
        const baseline = await executeLocallyResult(step.files, "");
        assert.equal(baseline.success, true, baseline.output);
        // Preserved thread demonstrations contain timing/order assumptions; alterations must not.
        if (!(content.week === 16 && [3, 5, 6, 7].includes(step.number))) assert.equal(matchesSample(baseline, step), true, baseline.output);
        else for (const line of step.expectedOutput.split("\n").filter((line) => !line.startsWith("Finished in under"))) assert.ok(baseline.output.split("\n").includes(line), baseline.output);
        const changed = await executeLocallyResult(alter(step), "");
        assert.equal(changed.success, true, changed.output);
        assert.equal(matchesActivityOutput(changed, step.activity.expectedOutput), true, changed.output);
        assert.equal(matchesActivityOutput({ ...changed, success: false }, step.activity.expectedOutput), false);
      });
    }
  });
}

test("Week 15: classroom file access stays blocked while desktop exercises remain explicitly separate", async () => {
  await assert.rejects(executeLocallyResult(steps(modules[0])[0].files, ""), /blocks file, network, process, and system-control APIs/);
  assert.match(originals[15].notice, /do not treat this JSON as classroom-ready/);
});
