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

// CKB-128: a teacher preview or class-step run says whether it matched, without saving or completing anything.
test("preview feedback: task, sample and differing runs each get a banner that never claims Completed", () => {
  const { previewMatch, PreviewRunFeedback } = tsxRequire("../app/StudentModuleActivity.tsx", import.meta.url);
  const sample = { expectedOutput: "SAMPLE" }, task = { expectedOutput: "TASK" };
  assert.equal(previewMatch({ success: true, output: "TASK\n" }, sample, task), "task");
  assert.equal(previewMatch({ success: true, output: "SAMPLE" }, sample, task), "sample");
  assert.equal(previewMatch({ success: true, output: "other" }, sample, task), "none");
  assert.equal(previewMatch({ success: false, output: "TASK" }, sample, task), "none", "a failed or stopped run never matches");
  assert.equal(previewMatch({ success: true, output: "SAMPLE" }, sample), "sample", "a step without a task matches its sample");
  const banner = (match) => renderToStaticMarkup(createElement(PreviewRunFeedback, { match }));
  assert.match(banner("task"), /module-run-feedback passed/); assert.match(banner("task"), /Matches Expected task output/);
  assert.match(banner("sample"), /Matches Expected sample output/);
  assert.match(banner("none"), /module-run-feedback retry/); assert.match(banner("none"), /Differs from the expected output/);
  for (const match of ["task", "sample", "none"]) { assert.match(banner(match), /not saved/); assert.doesNotMatch(banner(match), /Completed —|unlocked/); }
  assert.doesNotMatch(banner(null), /Matches|Differs/, "before a run only the unticked checks show");
});

test("preview feedback: the teacher's preview shows unticked checks and no result before its first run", () => {
  const html = renderToStaticMarkup(createElement(Editor, { activity: { kind: "preview", classroomId: "c", moduleId: "m", moduleTitle: "Preview", stepId: "one", stateId: "", instruction: "", expectedOutput: "SAMPLE", stdin: "", task: { instruction: "Do it", expectedOutput: "TASK" }, progress: { projectFiles: [], performanceTask: {}, stepStates: {}, updatedAt: "" } }, onChecked() {}, onClose() {} }));
  assert.match(html, /Preview — not saved/); assert.doesNotMatch(html, /Matches|Differs/, "no result before any run");
  assert.match(html, /○ Sample, unchanged code/); assert.match(html, /○ Your task/); assert.doesNotMatch(html, /Guided example<\/li>/, "no guided tick without a guided example");
});

// CKB-130: the editor itself says why it is locked, so neither student nor teacher is left guessing.
test("editor lock: sample-first and running say why the editor is read-only; an open editor says nothing", () => {
  const { editorLockNote } = tsxRequire("../app/StudentModuleActivity.tsx", import.meta.url);
  assert.equal(editorLockNote(true, false, false), "🔒 Locked — press ▶ Run code to check the sample first. Then you can edit.");
  assert.match(editorLockNote(true, true, false), /Loading Java or running — the editor unlocks when the run finishes/);
  assert.match(editorLockNote(false, true, true), /Running your page/);
  assert.equal(editorLockNote(false, false, false), null);
  const step = { type: "step", id: "one", files: [{ path: "Main.java", content: "SAMPLE" }], expectedOutput: "OUT", activity: { id: "alt" } };
  const html = renderToStaticMarkup(createElement(Editor, { activity: { kind: "module", module: { sampleFirst: true, lessons: [{ blocks: [step] }] }, classroomId: "c", moduleId: "m", moduleTitle: "Lock", stepId: "one", stateId: "task:alt", instruction: "", expectedOutput: "TASK", stdin: "", progress: { projectFiles: step.files, performanceTask: {}, stepStates: {}, updatedAt: "" } }, onChecked() {}, onClose() {} }));
  assert.match(html, /class="editor-lock" role="status">🔒 Locked — press ▶ Run code/);
});

// CKB-131: the guided example is the third preview check, ticked like the sample and the task.
test("preview feedback: guided example output matches as guided, and each check stays ticked", () => {
  const { previewMatch, PreviewRunFeedback } = tsxRequire("../app/StudentModuleActivity.tsx", import.meta.url);
  const sample = { expectedOutput: "SAMPLE" }, task = { expectedOutput: "TASK", guided: { expectedOutput: "GUIDED" } };
  assert.equal(previewMatch({ success: true, output: "GUIDED" }, sample, task), "guided");
  assert.equal(previewMatch({ success: true, output: "TASK" }, sample, task), "task");
  assert.equal(previewMatch({ success: true, output: "SAMPLE" }, sample, task), "sample");
  assert.equal(previewMatch({ success: false, output: "GUIDED" }, sample, task), "none");
  const html = renderToStaticMarkup(createElement(PreviewRunFeedback, { match: "guided", passed: ["sample", "guided"], hasGuided: true, hasTask: true }));
  assert.match(html, /Matches Expected guided output/);
  assert.match(html, /✓ Sample, unchanged code/); assert.match(html, /✓ Guided example/); assert.match(html, /○ Your task/);
});

// CKB-139: a web step's check list compares with what the run was checked as, never always the sample.
test("web check list target: preview uses the matched check or the next unticked one; own work uses the run's check", () => {
  const { webListTarget } = tsxRequire("../app/StudentModuleActivity.tsx", import.meta.url);
  assert.equal(webListTarget(true, "task", "guided", ["sample", "guided"], true, true), "guided", "a guided match compares with the guided output");
  assert.equal(webListTarget(true, "task", "task", ["task"], true, true), "task");
  assert.equal(webListTarget(true, "task", "sample", ["sample"], true, true), "sample");
  assert.equal(webListTarget(true, "task", "none", [], true, true), "sample", "nothing ticked yet: the sample comes first");
  assert.equal(webListTarget(true, "task", "none", ["sample"], true, true), "guided", "after the sample, the guided example is next");
  assert.equal(webListTarget(true, "task", "none", ["sample"], false, true), "task", "no guided example: the task is next");
  assert.equal(webListTarget(true, "task", "none", ["sample", "guided", "task"], true, true), "task", "all ticked: the last check");
  assert.equal(webListTarget(true, "task", null, [], false, false), "sample", "a step without a task compares with its sample");
  assert.equal(webListTarget(false, "guided", null, [], true, true), "guided", "own work: a guided run compares with the guided output");
  assert.equal(webListTarget(false, "sample", "guided", [], true, true), "sample", "own work ignores preview ticks");
});
