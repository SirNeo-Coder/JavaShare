// Real Java 8 compatibility check using the public runner's documented postMessage bridge.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { matchesSample, mergeProjectFiles } from "../backend/src/module-activities.ts";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const content = JSON.parse(readFileSync(new URL("../docs/modules/week14/Java2_Week_14.codeshare.json", import.meta.url)));

test("Week 14 online samples: every published baseline verifies in actual CheerpJ Java 8", async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  try {
    const page = await browser.newPage(); await page.goto("http://localhost:3020");
    let files = content.starterFiles;
    for (const step of content.lessons.flatMap((l) => l.blocks).filter((b) => b.type === "step")) {
      await t.test(`Java 8 sample ${step.number}: ${step.id}`, async () => {
        files = mergeProjectFiles(files, step.files);
        const result = await page.evaluate(({ files, stdin }) => new Promise((resolve) => {
          const frame = document.createElement("iframe"); frame.src = "http://localhost:3021/";
          frame.sandbox.add("allow-scripts", "allow-same-origin"); frame.title = "Java execution compatibility check";
          const id = `verify-${Date.now()}`;
          const done = (result) => { clearTimeout(timer); window.removeEventListener("message", receive); frame.remove(); resolve(result); };
          const timer = setTimeout(() => done({ success: false, output: "Browser verification timed out" }), 120000);
          const receive = (event) => {
            if (event.source !== frame.contentWindow || event.origin !== "http://localhost:3021") return;
            if (event.data?.type === "codeshare-java-ready") frame.contentWindow.postMessage({ type: "codeshare-java-run", id, files, stdin, mainClass: "Main" }, event.origin);
            if (event.data?.type === "codeshare-java-result" && event.data.id === id) done(event.data);
          };
          window.addEventListener("message", receive); document.body.append(frame);
        }), { files, stdin: step.stdin ?? "" });
        assert.equal(matchesSample(result, step), true, result.output);
        assert.equal(result.success, !step.expectedError);
      });
    }
  } finally { await browser.close(); }
});
