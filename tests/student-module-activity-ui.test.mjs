import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { require as tsxRequire } from "tsx/cjs/api";
const { moduleProjectForClass } = tsxRequire("../app/moduleActivityState.ts", import.meta.url);
const { default: Home } = tsxRequire("../app/page.tsx", import.meta.url);
const { default: StudentModuleActivity } = tsxRequire("../app/StudentModuleActivity.tsx", import.meta.url);

test("module activity screen: signing in starts safely before a class or project exists (CKB-044)", () => {
  assert.equal(moduleProjectForClass(null, undefined, "student"), null);
  assert.equal(moduleProjectForClass(null, "class", "student"), null);
  assert.equal(moduleProjectForClass({ classroomId: "old-class" }, "class", "student"), null);
  assert.equal(moduleProjectForClass({ classroomId: "class" }, "class", "teacher"), null);
  assert.match(renderToStaticMarkup(createElement(Home)), /Starting CodeShare/);
});

test("module activity screen: main Java editor has project tabs, sample output, Console, Run code and Save work", () => {
  const html = renderToStaticMarkup(createElement(StudentModuleActivity, {
    activity: { kind: "module", classroomId: "class", moduleId: "module", moduleTitle: "Vehicle project", stepId: "step", stateId: "step:activity", instruction: "Change the capacity", expectedOutput: "Capacity: 25", stdin: "", progress: { projectFiles: [{ path: "Main.java", content: "class Main {}" }, { path: "Vehicle.java", content: "abstract class Vehicle {}" }], stepStates: {}, updatedAt: "", percent: 0 } },
    ref: { current: null }, onChecked() {}, onClose() {},
  }));
  assert.match(html, /Java source code editor/);
  assert.match(html, /Module project files/);
  assert.match(html, /Vehicle\.java/);
  assert.match(html, /Expected output/);
  assert.match(html, /Capacity: 25/);
  assert.match(html, /Program output/);
  assert.match(html, /Run code/);
  assert.match(html, /Save work/);
  assert.doesNotMatch(html, /Mark done|Mark exit slip done|Open to students/);
});

test("module activity screen: ＋ opens the floating Create a new file window, not an inline Console form", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../app/StudentModuleActivity.tsx", import.meta.url), "utf8");
  assert.match(source, /className="activity-overlay file-dialog-overlay"/);
  assert.match(source, /<h2>Create a new file<\/h2>/);
  assert.doesNotMatch(source, /"Java filename"|"Web filename"|>Add file</);
});
