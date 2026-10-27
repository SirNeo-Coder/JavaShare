import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { require as tsxRequire } from "tsx/cjs/api";

const { default: Editor } = tsxRequire("../app/StudentModuleActivity.tsx", import.meta.url);
const activity = { kind: "module", module: {}, classroomId: "class", moduleId: "week", moduleTitle: "Week 14", stepId: "sample", stateId: "sample", instruction: "Use the sample", expectedOutput: "Module output", stdin: "", progress: {
  projectFiles: [{ path: "Main.java", content: "MODULE SOURCE" }], performanceProjectFiles: [{ path: "Own.java", content: "PERSONAL SOURCE" }],
  performanceTask: {}, stepStates: {}, updatedAt: "", percent: 0,
} };
const render = (value) => renderToStaticMarkup(createElement(Editor, { activity: value, onChecked() {}, onClose() {} }));

test("weekly Java editor: module shows sample output and only module source", () => {
  const html = render(activity);
  assert.match(html, /MODULE SOURCE/); assert.doesNotMatch(html, /PERSONAL SOURCE|Submit this version/);
  assert.match(html, /Expected output/); assert.match(html, /Module output/);
});

test("weekly Java editor: personal shows its own source, input and explicit submission", () => {
  const html = render({ ...activity, kind: "performance" });
  assert.match(html, /PERSONAL SOURCE/); assert.doesNotMatch(html, /MODULE SOURCE|Expected output|Module output/);
  assert.match(html, /Program input/); assert.match(html, /Submit this version/);
  assert.match(html, /Personal project/); assert.match(html, /Save work/);
});

test("weekly Java editor: alteration shows its own target and remembers completed tasks", () => {
  const html = render({ ...activity, stateId: "task:alteration", progress: { ...activity.progress, stepStates: { "task:alteration": "pass" } } });
  assert.match(html, /Your task/); assert.match(html, /Expected task output/);
  assert.match(html, /Completed/); assert.doesNotMatch(html, /Module sample|Submit this version/);
});

test("personal submission: button starts disabled and teacher editor cannot save or edit", () => {
  const personal = render({ ...activity, kind: "performance" });
  assert.match(personal, /disabled=""[^>]*>Submit this version/);
  const review = render({ ...activity, kind: "review" });
  assert.match(review, /readOnly=""/i);
  assert.match(review, /Frozen submitted files/);
  assert.match(review, /Run code/);
  assert.doesNotMatch(review, /Save work|Submit this version|Rename file|Delete file|Add personal Java file/);
});

test("personal task checklist: read-only items, ticks restored only from this device's storage", () => {
  const { PersonalTaskChecklist } = tsxRequire("../app/PersonalSubmissionChecklist.tsx", import.meta.url);
  const items = ["Compiles", "Prints 5 lines"];
  const show = () => renderToStaticMarkup(createElement(PersonalTaskChecklist, { items, storageKey: "k" }));
  const blank = show();
  assert.equal(blank.match(/type="checkbox"/g).length, 2); assert.doesNotMatch(blank, /checked=""|<textarea|<button/);
  assert.match(blank, /Saved on this device only, not a submission or grade/);
  globalThis.localStorage = { getItem: (key) => key === "k" ? JSON.stringify(["Prints 5 lines"]) : null };
  try { assert.match(show(), /<input type="checkbox"\/> Compiles.*checked=""\/> Prints 5 lines/s); }
  finally { delete globalThis.localStorage; }
});

test("save work colour: changed lines count edits once, ignore renames, and span all files", () => {
  const { changedLines } = tsxRequire("../app/StudentModuleActivity.tsx", import.meta.url);
  const saved = [{ path: "Main.java", content: "a\nb\nc" }, { path: "Car.java", content: "x\ny" }];
  assert.equal(changedLines(saved, saved), 0);
  assert.equal(changedLines(saved, [{ ...saved[0], content: "a\nB\nc" }, saved[1]]), 1);
  assert.equal(changedLines(saved, [saved[0], { path: "Bus.java", content: "x\ny" }]), 0);
  assert.equal(changedLines(saved, [{ ...saved[0], content: `a\nb\nc${"\nnew".repeat(10)}` }, saved[1]]), 10);
  assert.equal(changedLines(saved, [saved[0]]), 2);
});

test("save work colour: personal button starts blue (saved); module and review keep the plain button", () => {
  assert.match(render({ ...activity, kind: "performance" }), /class="run-button save-saved"[^>]*>Save work/);
  assert.match(render(activity), /class="run-button"[^>]*>Save work/);
  assert.doesNotMatch(render({ ...activity, kind: "review" }), /Save work/);
});

const copyModule = { lessons: [{ blocks: [
  { type: "step", number: 1, files: [{ path: "Main.java", content: "SAMPLE ONE" }, { path: "Vehicle.java", content: "SUPPORT" }] },
  { type: "text", markdown: "not code" },
  { type: "step", number: 2, files: [{ path: "Main.java", content: "SAMPLE TWO" }, { path: "Vehicle.java", content: "SUPPORT" }] },
  { type: "step", number: 3, locked: true, files: [{ path: "Main.java", content: "LOCKED" }] },
] }], performanceTask: { exampleFiles: [{ path: "Shop.java", content: "TASK SAMPLE" }] } };

test("copy module code: unlocked samples and task Sample code, once each, locked steps left out", () => {
  const { moduleCode } = tsxRequire("../app/ModuleViewer.tsx", import.meta.url);
  assert.deepEqual(moduleCode(copyModule), [
    { label: "Step 1 · Main.java", content: "SAMPLE ONE" }, { label: "Step 1 · Vehicle.java", content: "SUPPORT" },
    { label: "Step 2 · Main.java", content: "SAMPLE TWO" }, { label: "Sample code · Shop.java", content: "TASK SAMPLE" },
  ]);
  assert.deepEqual(moduleCode({}), []);
});

test("copy module code: personal project offers it without touching its own files; module and review do not", () => {
  const personal = render({ ...activity, kind: "performance", module: copyModule });
  assert.match(personal, /Code from this module/); assert.match(personal, /copies only the code, not the file name/);
  assert.equal(personal.match(/>Copy code</g).length, 4); assert.doesNotMatch(personal, /LOCKED/);
  assert.match(personal, /class="file-tab active"[^>]*>Own.java</); assert.doesNotMatch(personal, /file-tab[^>]*>(Main|Shop|Vehicle).java</);
  for (const kind of ["module", "review"]) assert.doesNotMatch(render({ ...activity, kind, module: copyModule }), /Code from this module|Copy code/);
});

test("copy module code: clipboard on secure pages, older copy command on plain-http classroom pages", async () => {
  const { copyText } = tsxRequire("../app/ModuleViewer.tsx", import.meta.url);
  const calls = [];
  const area = { style: {}, select: () => calls.push(`select ${area.value}`), remove: () => calls.push("remove") };
  const set = (name, value) => Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
  const saved = ["window", "navigator", "document"].map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]);
  try {
    set("navigator", { clipboard: { writeText: async (text) => calls.push(`clipboard ${text}`) } });
    set("document", { createElement: () => area, body: { append: () => calls.push("append") }, execCommand: (command) => { calls.push(command); return true; } });
    set("window", { isSecureContext: true });
    await copyText("A");
    set("window", { isSecureContext: false });
    await copyText("B");
    assert.deepEqual(calls, ["clipboard A", "append", "select B", "copy", "remove"]);
    document.execCommand = () => false;
    await assert.rejects(copyText("C"), /Copy failed/);
    assert.equal(calls.at(-1), "remove");
  } finally {
    for (const [name, descriptor] of saved) { if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name]; }
  }
});

test("performance task steps: personal Console shows the module's steps; module and review do not", () => {
  const stepsModule = { performanceTask: { steps: ["Plan your **theme**", "Copy `toLine()` and change it"] } };
  const personal = render({ ...activity, kind: "performance", module: stepsModule });
  assert.match(personal, /Your performance task[\s\S]*How to build it, step by step[\s\S]*Program input/);
  assert.match(personal, /<ol><li>.*<b>theme<\/b>.*<\/li><li>.*<code>toLine\(\)<\/code>.*<\/li><\/ol>/);
  for (const kind of ["module", "review"]) assert.doesNotMatch(render({ ...activity, kind, module: stepsModule }), /How to build it/);
  assert.doesNotMatch(render({ ...activity, kind: "performance" }), /How to build it/);
});

test("step copy code: a step naming a sample gets its own button; the Console list hides when the module has steps", () => {
  const { stepCode } = tsxRequire("../app/ModuleViewer.tsx", import.meta.url);
  assert.deepEqual(stepCode("Copy **Step 2 · Main.java** and **Sample code · Shop.java**", copyModule), [
    { label: "Step 2 · Main.java", content: "SAMPLE TWO" }, { label: "Sample code · Shop.java", content: "TASK SAMPLE" },
  ]);
  assert.deepEqual(stepCode("Plan on paper; see Step 2 · Main.java later", copyModule), [], "only bold labels count");
  assert.deepEqual(stepCode("Copy **Step 3 · Main.java**", copyModule), [], "locked samples are never offered");
  assert.deepEqual(stepCode("Copy **Step 9 · Gone.java**", copyModule), []);
  const withSteps = { ...copyModule, performanceTask: { ...copyModule.performanceTask, steps: ["Plan your theme", "Copy **Step 1 · Vehicle.java** and change it", "Compare **Step 2 · Main.java** with **Sample code · Shop.java**"] } };
  const personal = render({ ...activity, kind: "performance", module: withSteps });
  assert.doesNotMatch(personal, /Code from this module|>Copy code</);
  assert.equal(personal.match(/<button type="button">Copy (Step|Sample)/g).length, 3);
  assert.match(personal, /<li><span>Plan your theme<\/span><\/li>/, "a step without a sample has no button");
  assert.match(personal, /Vehicle.java<\/b>.*<button type="button">Copy Step 1 · Vehicle.java<\/button>/);
  assert.match(personal, /class="file-tab active"[^>]*>Own.java</);
});
