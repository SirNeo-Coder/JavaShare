import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { require as tsxRequire } from "tsx/cjs/api";
const { ModuleRunFeedback, default: Editor } = tsxRequire("../app/StudentModuleActivity.tsx", import.meta.url);
const render = (props) => renderToStaticMarkup(createElement(ModuleRunFeedback, { result: null, completed: false, pendingSample: false, ...props }));

test("module feedback: prominent sample verification does not claim task completion", () => {
  const html = render({ result: { check: "sample", passed: true, sampleMatched: true, success: true } });
  assert.match(html, /role="status"/); assert.match(html, /<strong>Sample verified/);
  assert.match(html, /Sample verification is saved/); assert.doesNotMatch(html, /Completed|next activity unlocked/);
  assert.match(render({ result: { check: "sample", passed: true }, expectedError: "java.lang.IllegalStateException" }), /Expected error observed/);
});

test("module feedback: distinguishes old sample, wrong output, new completion and earlier completion", () => {
  assert.match(render({ result: { check: "task", passed: false, sampleMatched: true } }), /Still showing sample output/);
  assert.match(render({ result: { check: "task", passed: false, sampleMatched: false } }), /Not completed — this run differs/);
  assert.match(render({ result: { check: "task", passed: true }, completed: true }), /Completed — next activity unlocked/);
  const later = render({ result: { check: "task", passed: false, sampleMatched: false }, completed: true });
  assert.match(later, /Not completed — this run/); assert.match(later, /saved completion remains/);
  assert.doesNotMatch(later, /module-run-feedback passed/);
  assert.match(render({ completed: true }), /Completed — your progress is saved/);
});

test("module feedback: sample-first editor shows baseline target before allowing edits", () => {
  const step = { type: "step", id: "one", files: [{ path: "Main.java", content: "SAMPLE SOURCE" }], expectedOutput: "SAMPLE OUTPUT", activity: { id: "alteration" } };
  const html = renderToStaticMarkup(createElement(Editor, { activity: { kind: "module", module: { sampleFirst: true, lessons: [{ blocks: [step] }] }, classroomId: "class", moduleId: "module", moduleTitle: "Sample first", stepId: "one", stateId: "task:alteration", instruction: "ALTERATION", expectedOutput: "TASK OUTPUT", stdin: "", progress: { projectFiles: step.files, performanceTask: {}, stepStates: {}, updatedAt: "" } }, onChecked() {}, onClose() {} }));
  assert.match(html, /Run the sample first/); assert.match(html, /Expected sample output/); assert.match(html, /SAMPLE OUTPUT/);
  assert.match(html, /readOnly=/); assert.doesNotMatch(html, /TASK OUTPUT/);
});

test("module feedback: local passes wait for server acceptance even after an earlier completion", () => {
  for (const completed of [false, true]) {
    const result = { check: "task", passed: true, success: true, sampleMatched: false, syncPending: true };
    const pending = render({ result, completed });
    assert.match(pending, /Passed locally — awaiting sync/);
    assert.match(pending, /next activity opens after CodeShare accepts/);
    assert.doesNotMatch(pending, /Completed|next activity unlocked|module-run-feedback passed/);
    assert.match(render({ result: { ...result, syncPending: false }, completed: true }), /Completed — next activity unlocked/);
  }
});
