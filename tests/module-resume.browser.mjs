// Local production app, local disposable classroom data, real laptop/browser Java.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { activityStateId, sampleStateId } from "../backend/src/module-activities.ts";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const raw = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(raw.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const content = JSON.parse(readFileSync(new URL("../docs/modules/week12/Java2_Week_12.codeshare.json", import.meta.url)));
const steps = content.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "step");
const edits = JSON.parse(readFileSync(new URL("./fixtures/week12-week13-task-edits.json", import.meta.url)));
const main = (files) => files.find((file) => file.path === "Main.java").content;
const alteredMain = (step) => edits[step.id].filter((edit) => edit.path === "Main.java").reduce((source, edit) => source.replaceAll(edit.from, edit.to), main(step.files));

for (const mode of process.env.RESUME_BROWSER_MODE ? [process.env.RESUME_BROWSER_MODE] : ["offline", "online"]) test(`module resume ${mode}: sample loading, Monday completion, Tuesday resume and separate projects`, async (t) => {
  const baseURL = mode === "offline" ? "http://localhost:3022" : "http://localhost:3020";
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const users = []; let classroomId;
  try {
    const password = randomUUID();
    for (const role of ["teacher", "student", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `resume-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Resume ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const context = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
    const login = async (user) => assert.equal((await context.request.post("/api/auth/login", { data: { email: user.email, password } })).status(), 200);
    await login(users[0]);
    const created = await context.request.post("/api/classes", { data: { subject: "Java", name: "Disposable module resume checks" } });
    assert.equal(created.status(), 201); classroomId = (await created.json()).id;
    assert.equal((await context.request.post(`/api/classrooms/${classroomId}/modules`, { data: content })).status(), 201);
    assert.equal((await admin.from("classroom_members").insert(users.slice(1).map((user) => ({ classroom_id: classroomId, user_id: user.id })))).error, null);
    await login(users[1]);
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    const errors = []; page.on("pageerror", (error) => errors.push(error.message));
    const progressPath = `/api/classrooms/${classroomId}/modules/${content.id}/progress`;
    const progress = async () => (await context.request.get(progressPath)).json();
    const worksheet = page.locator("#classroom-worksheet");
    const rail = page.getByRole("button", { name: "Module", exact: true });
    const editor = page.getByRole("textbox", { name: "Java source code editor", exact: true });
    const openWorksheet = async () => {
      await page.mouse.move(1100, 20); await rail.hover();
      await page.waitForFunction(() => document.getElementById("classroom-worksheet")?.dataset.open === "true");
    };
    const openCatalog = async () => {
      await page.goto("/"); await page.locator(".classroom-workspace").waitFor();
      await rail.hover();
      await page.locator("#classroom-modules .module-catalog-card").filter({ hasText: content.title }).getByRole("button").first().click();
      await worksheet.locator("article:not([hidden])").waitFor();
    };
    const openCurrent = async (expected) => {
      await worksheet.locator("article:not([hidden])").getByRole("button", { name: "Work in code editor", exact: true }).click();
      await page.waitForFunction((value) => document.querySelector('textarea[aria-label="Java source code editor"]')?.value === value, expected);
    };
    const run = async (message) => {
      if (mode === "offline") await page.waitForTimeout(1600);
      await page.getByRole("button", { name: /Run code/ }).click();
      await page.waitForFunction((text) => document.querySelector(".module-run-feedback")?.textContent.includes(text), message, { timeout: 180000 });
    };
    await t.test("first sample verifies separately; unchanged output cannot complete its alteration", async () => {
      await openCatalog();
      assert.match(await worksheet.locator('.worksheet-tabs [aria-current="page"]').textContent(), /DAY 1 · Step 1/);
      await openCurrent(main(steps[0].files));
      assert.equal(await editor.getAttribute("readonly"), "");
      await run("Sample verified");
      let saved = await progress();
      assert.equal(saved.stepStates[sampleStateId(steps[0])], "pass"); assert.equal(saved.stepStates[activityStateId(steps[0])], undefined);
      await run("Still showing sample output");
      assert.notEqual((await progress()).stepStates[activityStateId(steps[0])], "pass");
    });
    await t.test("meaningful object-state alteration completes Step 1 and opens Step 2", async () => {
      await editor.fill(alteredMain(steps[0])); await run("Completed — next activity unlocked");
      assert.equal((await progress()).stepStates[activityStateId(steps[0])], "pass");
      await openWorksheet();
      await page.waitForFunction(() => document.querySelector('#classroom-worksheet .worksheet-tabs [aria-current="page"]')?.textContent.includes("Step 2"));
      await openCurrent(main(steps[1].files));
    });
    await t.test("finishing Monday and reloading opens Tuesday Step 3 with its own sample", async () => {
      await run("Sample verified"); await editor.fill(alteredMain(steps[1])); await run("Completed — next activity unlocked");
      await openCatalog();
      assert.match(await worksheet.locator('.worksheet-tabs [aria-current="page"]').textContent(), /DAY 2 · Step 3/);
      await openCurrent(main(steps[2].files));
      assert.match(await editor.inputValue(), /getRoute/); assert.doesNotMatch(await editor.inputValue(), /setPassengers\(-3\)/);
      for (const name of ["Vehicle.java", "Jeepney.java", "Tricycle.java"]) assert.equal(await page.getByRole("button", { name, exact: true }).count(), 1);
    });
    await t.test("earlier drafts restore, personal work stays separate, and another student starts at Step 1", async () => {
      await openWorksheet();
      await worksheet.getByRole("button", { name: /Encapsulation: protect the data/ }).click();
      await worksheet.getByRole("button", { name: "DAY 1 · Step 1", exact: true }).click();
      await openCurrent(alteredMain(steps[0]));
      assert.match(await page.locator(".module-run-feedback").textContent(), /Completed — your progress is saved/);
      const original = await progress();
      const personal = await context.request.post(`${progressPath}/performance-project`, { data: {} });
      assert.equal(personal.status(), 403, "personal project is still gated until all module tasks are complete");
      assert.deepEqual((await progress()).projectFiles, original.projectFiles);
      await login(users[2]); await openCatalog();
      assert.match(await worksheet.locator('.worksheet-tabs [aria-current="page"]').textContent(), /DAY 1 · Step 1/);
      assert.deepEqual((await progress()).stepStates, {});
      if (mode === "offline") assert.equal(await page.locator('.student-module-project img[alt="CheerpJ"]').count(), 0);
    });
    if (mode === "offline") await t.test("all steps lead to the performance task; personal edits and prior module drafts remain separate", async () => {
      await login(users[1]);
      const runFiles = async (step, files, updatedAt) => {
        await page.waitForTimeout(1600);
        const response = await context.request.post(`${progressPath}/run`, { data: { stepId: step.id, files, updatedAt } });
        assert.equal(response.status(), 200, await response.text());
        const result = await response.json(); assert.equal(result.passed, true, result.output); return result.progress;
      };
      for (const step of steps.slice(2)) {
        const prepared = await context.request.post(`${progressPath}/activity`, { data: { stepId: step.id } });
        assert.equal(prepared.status(), 200);
        let saved = await prepared.json();
        saved = await runFiles(step, saved.projectFiles, saved.updatedAt);
        const changed = saved.projectFiles.map((file) => ({ ...file, content: edits[step.id].filter((edit) => edit.path === file.path).reduce((source, edit) => source.replaceAll(edit.from, edit.to), file.content) }));
        await runFiles(step, changed, saved.updatedAt);
      }
      const opened = await context.request.post(`${progressPath}/performance-project`, { data: {} });
      assert.equal(opened.status(), 200); const personal = await opened.json();
      const personalFiles = [{ path: "Main.java", content: 'public class Main { public static void main(String[] args) { System.out.println("Personal draft kept"); } }' }];
      assert.equal((await context.request.put(`${progressPath}/performance-project`, { data: { files: personalFiles, updatedAt: personal.updatedAt } })).status(), 200);
      await openCatalog();
      assert.match(await worksheet.locator("article:not([hidden])").textContent(), /Build and present your own OOP program/);
      const after = await progress(); assert.deepEqual(after.performanceProjectFiles, personalFiles); assert.equal(after.performanceTask.own, undefined);
      assert.equal(main(after.activityProjects.drafts[activityStateId(steps[0])]), alteredMain(steps[0]));
    });
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `/tmp/module-resume-${mode}.png`, fullPage: true });
    await context.close();
  } finally {
    await browser.close();
    if (classroomId) assert.equal((await admin.from("classrooms").delete().eq("id", classroomId)).error, null);
    for (const user of users) assert.equal((await admin.auth.admin.deleteUser(user.id)).error, null);
  }
});
