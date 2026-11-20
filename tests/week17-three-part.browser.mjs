// Week 17 three-part file online: every sample, guided example and own-task answer must give its exact output in
// the real online runner (CheerpJ Java 8), not only on laptop Java (tests/week17-three-part.test.mjs).
// Needs any page on http://localhost:3020 and java-runtime/public served on 3021. RUNS=n repeats each run.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { matchesActivityOutput, matchesSample } from "../backend/src/module-activities.ts";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const load = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const content = load("../docs/modules/week17/Java2_Week_17.threepart.codeshare.json");
const edits = load("./fixtures/week17-three-part-edits.json");
const steps = content.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "step");
const solved = (step, kind) => step.files.map((file) => ({ ...file, content: edits[step.id][kind].filter((edit) => edit.path === file.path)
  .reduce((text, edit) => { assert.ok(text.includes(edit.from), `${step.id}: missing ${edit.from}`); return text.replaceAll(edit.from, edit.to); }, file.content) }));
const runs = Number(process.env.RUNS || 1);

test("Week 17 three-part online: every sample, guided example and own task gives its output in CheerpJ Java 8", async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  try {
    const page = await browser.newPage(); await page.goto("http://localhost:3020");
    const run = (files) => page.evaluate(({ files }) => new Promise((resolve) => {
      const frame = document.createElement("iframe"); frame.src = "http://localhost:3021/";
      frame.sandbox.add("allow-scripts", "allow-same-origin"); frame.title = "Java execution compatibility check";
      const id = `verify-${Date.now()}`;
      const done = (result) => { clearTimeout(timer); window.removeEventListener("message", receive); frame.remove(); resolve(result); };
      const timer = setTimeout(() => done({ success: false, output: "Browser verification timed out" }), 180000);
      const receive = (event) => {
        if (event.source !== frame.contentWindow || event.origin !== "http://localhost:3021") return;
        if (event.data?.type === "codeshare-java-ready") frame.contentWindow.postMessage({ type: "codeshare-java-run", id, files, stdin: "", mainClass: "Main" }, event.origin);
        if (event.data?.type === "codeshare-java-result" && event.data.id === id) done(event.data);
      };
      window.addEventListener("message", receive); document.body.append(frame);
    }), { files });
    for (const step of steps) {
      for (let attempt = 1; attempt <= runs; attempt++) {
        await t.test(`Step ${step.number} sample, run ${attempt}`, async () => {
          const result = await run(step.files);
          assert.equal(matchesSample(result, step), true, result.output);
        });
        await t.test(`Step ${step.number} guided, run ${attempt}`, async () => {
          const result = await run(solved(step, "guided"));
          assert.equal(matchesActivityOutput(result, step.activity.guided.expectedOutput), true, result.output);
        });
        await t.test(`Step ${step.number} own task, run ${attempt}`, async () => {
          const result = await run(solved(step, "own"));
          assert.equal(matchesActivityOutput(result, step.activity.expectedOutput), true, result.output);
        });
      }
    }
  } finally { await browser.close(); }
});
