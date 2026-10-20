// Local production app + local Supabase; online compatibility uses the separate public runner.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { activityStateId, sampleStateId, matchesActivityOutput, matchesSample, mergeProjectFiles } from "../backend/src/module-activities.ts";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const modules = [12, 13].map((week) => JSON.parse(readFileSync(new URL(`../docs/modules/week${week}/Java2_Week_${week}.codeshare.json`, import.meta.url))));
const edits = JSON.parse(readFileSync(new URL("./fixtures/week12-week13-task-edits.json", import.meta.url)));
const steps = (content) => content.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "step");
const alter = (files, step) => files.map((file) => ({ ...file, content: edits[step.id].filter((edit) => edit.path === file.path).reduce((source, edit) => source.replaceAll(edit.from, edit.to), file.content) }));
const launch = () => chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });

test("Weeks 12–13 offline: real uploads, editor sample verification, completion and saved drafts", async (t) => {
  const config = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const local = Object.fromEntries(config.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
  const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const browser = await launch();
  const users = []; let classroomId;
  try {
    const password = randomUUID();
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `weeks12-13-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Module ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const context = await browser.newContext({ baseURL: "http://localhost:3022", viewport: { width: 1500, height: 1050 } });
    assert.equal((await context.request.post("/api/auth/login", { data: { email: users[0].email, password } })).status(), 200);
    const created = await context.request.post("/api/classes", { data: { name: "Weeks 12–13 curriculum verification" } });
    assert.equal(created.status(), 201); classroomId = (await created.json()).id;
    for (const content of modules) assert.equal((await context.request.post(`/api/classrooms/${classroomId}/modules`, { data: content })).status(), 201);
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);
    assert.equal((await context.request.post("/api/auth/login", { data: { email: users[1].email, password } })).status(), 200);
    const page = await context.newPage(); page.setDefaultTimeout(12000);
    const errors = []; page.on("pageerror", (error) => errors.push(error.message));
    for (const content of modules) await t.test(`Week ${content.week}: sample first, unchanged output, saved completion and next sample`, async () => {
      await page.goto("/"); await page.locator(".classroom-workspace").waitFor();
      await page.locator('.workspace-rail button[aria-controls="classroom-modules"]').hover();
      const card = page.locator("#classroom-modules .module-catalog-card").filter({ hasText: content.title });
      await card.getByRole("button").first().click();
      const worksheet = page.locator("#classroom-worksheet");
      const editor = page.getByRole("textbox", { name: "Java source code editor", exact: true });
      const [first, second] = steps(content);
      const main = (files) => files.find((file) => file.path === "Main.java").content;
      const openStep = async (step, expected = main(step.files)) => {
        await page.mouse.move(1100, 20);
        await page.getByRole("button", { name: "Module", exact: true }).hover();
        await worksheet.getByRole("button", { name: new RegExp(`Step ${step.number}$`) }).click();
        const opening = page.waitForResponse((response) => response.url().endsWith("/progress/activity") && response.request().method() === "POST");
        await worksheet.getByRole("button", { name: "Work in code editor", exact: true }).click();
        assert.equal((await opening).status(), 200);
        await page.waitForFunction((expected) => document.querySelector('textarea[aria-label="Java source code editor"]')?.value === expected, expected);
      };
      const run = async (message) => {
        await page.waitForTimeout(1600);
        await page.getByRole("button", { name: /Run code/ }).click();
        await page.waitForFunction((message) => document.querySelector(".module-run-feedback")?.textContent.includes(message), message, { timeout: 30000 });
      };
      await openStep(first); assert.equal(await editor.getAttribute("readonly"), "");
      await run("Sample verified"); assert.equal(await editor.getAttribute("readonly"), null);
      const progressPath = `/api/classrooms/${classroomId}/modules/${content.id}/progress`;
      let progress = await (await context.request.get(progressPath)).json();
      assert.equal(progress.stepStates[sampleStateId(first)], "pass"); assert.equal(progress.stepStates[activityStateId(first)], undefined);
      assert.equal((await context.request.post(`${progressPath}/activity`, { data: { stepId: second.id } })).status(), 403);
      await run("Still showing sample output");
      const changed = main(alter(first.files, first)); await editor.fill(changed);
      await run("Completed — next activity unlocked");
      progress = await (await context.request.get(progressPath)).json(); assert.equal(progress.stepStates[activityStateId(first)], "pass");
      await page.screenshot({ path: `/tmp/week${content.week}-completed.png`, fullPage: true });
      await openStep(second); assert.equal(await editor.getAttribute("readonly"), "");
      await openStep(first, changed); assert.match(await page.locator(".module-run-feedback").textContent(), /Completed — your progress is saved/);
      assert.equal(await page.locator('.student-module-project img[alt="CheerpJ"]').count(), 0);
    });
    assert.deepEqual(errors, []); await context.close();
  } finally {
    await browser.close();
    if (classroomId) assert.equal((await admin.from("classrooms").delete().eq("id", classroomId)).error, null);
    for (const user of users) assert.equal((await admin.auth.admin.deleteUser(user.id)).error, null);
  }
});

test("Weeks 12–13 online: all samples and alterations match in actual CheerpJ Java 8", async (t) => {
  const browser = await launch();
  try {
    const page = await browser.newPage(); await page.goto("http://localhost:3020");
    let files = [];
    for (const content of modules) for (const step of steps(content)) await t.test(`Java 8 Week ${content.week} Step ${step.number}: sample and alteration`, async () => {
      files = mergeProjectFiles(files, step.files);
      for (const stage of ["sample", "alteration"]) {
        if (stage === "alteration") files = alter(files, step);
        const result = await page.evaluate(({ files, stdin }) => new Promise((resolve) => {
          const frame = document.createElement("iframe"); frame.src = "http://localhost:3021/";
          frame.sandbox.add("allow-scripts", "allow-same-origin"); frame.title = "Java compatibility check";
          const id = `weeks12-13-${Date.now()}`;
          const done = (result) => { clearTimeout(timer); window.removeEventListener("message", receive); frame.remove(); resolve(result); };
          const timer = setTimeout(() => done({ success: false, output: "Browser verification timed out" }), 120000);
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
  } finally { await browser.close(); }
});
