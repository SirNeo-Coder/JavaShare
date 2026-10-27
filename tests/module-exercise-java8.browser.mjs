// Revised requirements must also run in the online classroom's Java 8 runtime.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { matchesActivityOutput, matchesSample } from "../backend/src/module-activities.ts";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const edits = JSON.parse(readFileSync(new URL("./fixtures/week12-week13-task-edits.json", import.meta.url)));

test("revised Week 12–13 exercises: unchanged samples and meaningful alterations run on actual browser Java 8", async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  try {
    const page = await browser.newPage(); await page.goto("http://localhost:3020");
    for (const week of [12, 13]) {
      const content = JSON.parse(readFileSync(new URL(`../docs/modules/week${week}/Java2_Week_${week}.codeshare.json`, import.meta.url)));
      for (const step of content.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "step" && block.activity.id.endsWith("-v2"))) {
        await t.test(`Java 8 Week ${week} Step ${step.number}: unchanged sample and revised alteration`, async () => {
          let files = step.files;
          for (const stage of ["sample", "alteration"]) {
            if (stage === "alteration") files = files.map((file) => ({ ...file, content: edits[step.id].filter((edit) => edit.path === file.path).reduce((source, edit) => source.replaceAll(edit.from, edit.to), file.content) }));
            const result = await page.evaluate(({ files, stdin }) => new Promise((resolve) => {
              const frame = document.createElement("iframe"); frame.src = "http://localhost:3021/"; frame.sandbox.add("allow-scripts", "allow-same-origin");
              const id = `logic-${Date.now()}`;
              const done = (result) => { clearTimeout(timer); window.removeEventListener("message", receive); frame.remove(); resolve(result); };
              const timer = setTimeout(() => done({ success: false, output: "Java 8 check timed out" }), 120000);
              const receive = (event) => {
                if (event.source !== frame.contentWindow || event.origin !== "http://localhost:3021") return;
                if (event.data?.type === "codeshare-java-ready") frame.contentWindow.postMessage({ type: "codeshare-java-run", id, files, stdin, mainClass: "Main" }, event.origin);
                if (event.data?.type === "codeshare-java-result" && event.data.id === id) done(event.data);
              };
              window.addEventListener("message", receive); document.body.append(frame);
            }), { files, stdin: stage === "sample" ? step.stdin ?? "" : step.activity.stdin ?? "" });
            assert.equal(result.success, true, result.output);
            assert.equal(stage === "sample" ? matchesSample(result, step) : matchesActivityOutput(result, step.activity.expectedOutput), true, `${stage}: ${result.output}`);
          }
        });
      }
    }
  } finally { await browser.close(); }
});
