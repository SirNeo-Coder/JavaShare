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
