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
