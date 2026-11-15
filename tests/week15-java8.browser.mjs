// Week 15 runs online only (the laptop runner blocks java.io), so every sample and every task answer must
// pass in the real online runner (CheerpJ Java 8), whose java.io.File differs from laptop Java (CKB-073,
// CKB-089, CKB-123). Needs any page on http://localhost:3020 and java-runtime/public served on 3021.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { matchesActivityOutput, matchesSample } from "../backend/src/module-activities.ts";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const load = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const content = load(process.env.WEEK15_MODULE ? `file://${process.env.WEEK15_MODULE}` : "../docs/modules/week15/Java2_Week_15.codeshare.json");
const edits = load("./fixtures/week15-week21-task-edits.json");
const steps = content.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "step");
// The task answer: the step's files with the teacher's verified edits applied (as tests/week15-week21-modules.test.mjs does).
const answer = (step) => step.files.map((file) => ({ ...file, content: edits[step.id].filter((edit) => edit.path === file.path)
  .reduce((source, edit) => { assert.ok(source.includes(edit.from), `${step.id}: missing ${edit.from}`); return source.replaceAll(edit.from, edit.to); }, file.content) }));

test("Week 15 online: every sample and task answer gives its expected output in CheerpJ Java 8", async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  try {
    const page = await browser.newPage(); await page.goto("http://localhost:3020");
    // Each step's own files only: an online run starts in an empty folder holding just those (CKB-088).
    const run = (files, stdin) => page.evaluate(({ files, stdin }) => new Promise((resolve) => {
      const frame = document.createElement("iframe"); frame.src = "http://localhost:3021/";
      frame.sandbox.add("allow-scripts", "allow-same-origin"); frame.title = "Java execution compatibility check";
      const id = `verify-${Date.now()}`;
      const done = (result) => { clearTimeout(timer); window.removeEventListener("message", receive); frame.remove(); resolve(result); };
      const timer = setTimeout(() => done({ success: false, output: "Browser verification timed out" }), 180000);
      const receive = (event) => {
        if (event.source !== frame.contentWindow || event.origin !== "http://localhost:3021") return;
        if (event.data?.type === "codeshare-java-ready") frame.contentWindow.postMessage({ type: "codeshare-java-run", id, files, stdin, mainClass: "Main" }, event.origin);
        if (event.data?.type === "codeshare-java-result" && event.data.id === id) done(event.data);
      };
      window.addEventListener("message", receive); document.body.append(frame);
    }), { files, stdin });
    for (const step of steps) {
      await t.test(`sample ${step.number}: ${step.id}`, async () => {
        const result = await run(step.files, step.stdin ?? "");
        assert.equal(matchesSample(result, step), true, result.output);
      });
      await t.test(`task ${step.number}: ${step.activity.id}`, async () => {
        const result = await run(answer(step), step.activity.stdin ?? "");
        assert.equal(matchesActivityOutput(result, step.activity.expectedOutput), true, result.output);
      });
    }
  } finally { await browser.close(); }
});
