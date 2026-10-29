import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { require as tsxRequire } from "tsx/cjs/api";

const { RunBox, NoticeBox } = tsxRequire("../app/StudentModuleActivity.tsx", import.meta.url);
const runBox = (message, onCancel) => renderToStaticMarkup(createElement(RunBox, { message, onCancel }));
const noticeBox = (notice) => renderToStaticMarkup(createElement(NoticeBox, { notice, onClose() {} }));

test("run box (CKB-081): hidden when nothing is running", () => {
  assert.equal(runBox(null), "");
  assert.equal(runBox(null, () => {}), "");
});

test("run box (CKB-081): a run that cannot be stopped says to wait and offers no cancel", () => {
  const html = runBox("Java is loading or running… Please wait.");
  assert.match(html, /role="dialog" aria-modal="true"/);
  assert.ok(html.includes("<h2 id=\"run-box-title\">Java is loading or running… Please wait.</h2>"));
  assert.match(html, /Please wait — this box closes when your code has run\./);
  assert.doesNotMatch(html, /Click outside/);
});

test("run box (CKB-081): a run that can be stopped says clicking outside or Esc cancels", () => {
  const html = runBox("Java is loading or running… Please wait.", () => {});
  assert.match(html, /Click outside this box or press Esc to cancel\./);
  assert.doesNotMatch(html, /this box closes when your code has run/);
});

test("notice box (CKB-081): Save work and Submit this version confirmations, and failures", () => {
  assert.equal(noticeBox(null), "");
  const saved = noticeBox({ title: "Work saved", text: "Your project is saved to CodeShare." });
  assert.match(saved, /role="alertdialog"/);
  assert.match(saved, /confirm-icon done/);
  assert.match(saved, /<h2 id="notice-title">Work saved<\/h2>/);
  assert.match(saved, /Your project is saved to CodeShare\./);
  assert.match(saved, />OK<\/button>/);
  const failed = noticeBox({ title: "Could not save", text: "Network down", failed: true });
  assert.match(failed, /confirm-icon danger/);
  assert.match(failed, /Network down/);
});

test("run box and notices (CKB-081): both editors show the run box; Save work and Submit confirm", async () => {
  const moduleEditor = await readFile(new URL("../app/StudentModuleActivity.tsx", import.meta.url), "utf8");
  const regular = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  // Module/personal: closes once Java runs; only an in-browser run (javaConsole.active) can be cancelled.
  assert.match(moduleEditor, /<RunBox message=\{javaConsole\.running \? null : runMessage\} onCancel=\{javaConsole\.active \?/);
  assert.match(moduleEditor, /onClick=\{\(\) => void saveWork\(\)\}>Save work</);
  assert.match(moduleEditor, /setNotice\(\{ title: "Version submitted"/);
  assert.match(regular, /<RunBox message=\{running && !javaConsole\.running \?/);
});
