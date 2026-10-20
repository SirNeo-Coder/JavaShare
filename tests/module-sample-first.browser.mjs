// Real local production browser checks. Runner/assets are served separately; no hosted data.
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { activityStateId, sampleStateId } from "../backend/src/module-activities.ts";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const config = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(config.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const content = JSON.parse(readFileSync(new URL("../docs/modules/week14/Java2_Week_14.codeshare.json", import.meta.url)));
const edits = JSON.parse(readFileSync(new URL("./fixtures/week14-task-edits.json", import.meta.url)));
const steps = content.lessons.flatMap((l) => l.blocks).filter((b) => b.type === "step");
const first = steps[0], second = steps[1];
const alter = (step) => edits[step.id].reduce((source, edit) => edit.path === "Main.java" ? source.replace(edit.from, edit.to) : source, step.files.find((f) => f.path === "Main.java").content);

for (const mode of (process.env.SAMPLE_BROWSER_MODE ? [process.env.SAMPLE_BROWSER_MODE] : ["offline", "online"])) {
  test(`sample first ${mode}: real editor verification, feedback, saved completion and step restoration`, async (t) => {
    const baseURL = mode === "offline" ? "http://localhost:3022" : "http://localhost:3020";
    const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
    const users = []; let classroomId;
    try {
      const password = randomUUID();
      for (const role of ["teacher", "student"]) {
        const { data, error } = await admin.auth.admin.createUser({ email: `sample-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Sample ${role}` } });
        assert.equal(error, null); users.push(data.user);
        assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
      }
      const context = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
      assert.equal((await context.request.post("/api/auth/login", { data: { email: users[0].email, password } })).status(), 200);
      const created = await context.request.post("/api/classes", { data: { name: `Sample-first ${mode} verification` } });
      assert.equal(created.status(), 201); classroomId = (await created.json()).id;
      assert.equal((await context.request.post(`/api/classrooms/${classroomId}/modules`, { data: content })).status(), 201);
      assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);
      assert.equal((await context.request.post("/api/auth/login", { data: { email: users[1].email, password } })).status(), 200);
      const page = await context.newPage(); page.setDefaultTimeout(12000);
      const errors = []; page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("/"); await page.locator(".classroom-workspace").waitFor();
      const worksheet = page.locator("#classroom-worksheet");
      const editor = page.getByRole("textbox", { name: "Java source code editor", exact: true });
      const feedback = page.locator(".module-run-feedback");
      const progressPath = `/api/classrooms/${classroomId}/modules/${content.id}/progress`;
      const openModule = async () => {
        await page.locator('.workspace-rail button[aria-controls="classroom-modules"]').hover();
        await page.locator("#classroom-modules .module-catalog-card").first().getByRole("button").first().click();
        await worksheet.locator(".worksheet-paper:not([hidden])").waitFor();
      };
      const openStep = async (step, expected = step.files.find((f) => f.path === "Main.java").content) => {
        await page.mouse.move(1100, 20);
        await page.getByRole("button", { name: "Module", exact: true }).hover();
        await worksheet.getByRole("button", { name: new RegExp(`Step ${step.number}$`) }).click();
        const opening = page.waitForResponse((response) => response.url().endsWith("/progress/activity") && response.request().method() === "POST");
        await worksheet.getByRole("button", { name: "Work in code editor", exact: true }).click();
        assert.equal((await opening).status(), 200);
        await page.locator(".student-module-project").waitFor();
        await page.waitForFunction((expected) => document.querySelector('textarea[aria-label="Java source code editor"]')?.value === expected, expected);
      };
      const run = async (message) => {
        // The real laptop runner rejects repeat clicks less than 1.5 seconds apart.
        if (mode === "offline") await page.waitForTimeout(1600);
        await page.getByRole("button", { name: /Run code/ }).click();
        await page.waitForFunction((message) => document.querySelector(".module-run-feedback")?.textContent.includes(message), message, { timeout: mode === "online" ? 180000 : 30000 });
        assert.equal(await page.getByRole("button", { name: /Run code/ }).isEnabled(), true);
      };
      await openModule();
      await t.test("loads the exact sample and requires verification before editing", async () => {
        await openStep(first);
        assert.equal(await editor.inputValue(), first.files[0].content); assert.equal(await editor.getAttribute("readonly"), "");
        await run("Sample verified"); assert.equal(await editor.getAttribute("readonly"), null);
        const p = await (await context.request.get(progressPath)).json();
        assert.equal(p.stepStates[sampleStateId(first)], "pass"); assert.equal(p.stepStates[activityStateId(first)], undefined);
        const locked = await context.request.post(`${progressPath}/activity`, { data: { stepId: second.id } }); assert.equal(locked.status(), 403);
      });
      await t.test("shows visible old-sample and mismatch banners, then saves completion immediately", async () => {
        await run("Still showing sample output");
        await editor.fill(alter(first).replace("fleet.remove(3);", "fleet.remove(2);"));
        await run("Not completed — this run differs");
        await editor.fill(alter(first)); await run("Completed — next activity unlocked");
        const p = await (await context.request.get(progressPath)).json(); assert.equal(p.stepStates[activityStateId(first)], "pass");
        await page.screenshot({ path: `/tmp/sample-first-${mode}-completed.png`, fullPage: true });
      });
      await t.test("loads the next sample, completes its alteration, and restores the first step after reload", async () => {
        await openStep(second); assert.equal(await editor.inputValue(), second.files[0].content);
        await run("Sample verified"); await editor.fill(alter(second)); await run("Completed — next activity unlocked");
        await page.reload(); await page.locator(".classroom-workspace").waitFor(); await openModule();
        await openStep(first, alter(first)); assert.equal(await editor.inputValue(), alter(first));
        assert.match(await feedback.textContent(), /Completed — your progress is saved/);
        await editor.fill(first.files[0].content); await run("Still showing sample output");
        assert.match(await feedback.textContent(), /saved completion remains/);
        const p = await (await context.request.get(progressPath)).json(); assert.equal(p.stepStates[activityStateId(first)], "pass");
      });
      await t.test("recognizes the deliberate error demonstration without completing its task", async () => {
        const p = await (await context.request.get(progressPath)).json();
        const states = { ...p.stepStates }; for (const step of steps.slice(0, 7)) states[activityStateId(step)] = "pass";
        assert.equal((await admin.from("module_progress").update({ step_states: states }).eq("classroom_id", classroomId).eq("student_id", users[1].id)).error, null);
        await page.reload(); await page.locator(".classroom-workspace").waitFor(); await openModule();
        // Wednesday/Thursday parts become visible after the fixture's prerequisite setup.
        await worksheet.getByRole("button", { name: /One at a Time/ }).click();
        await openStep(steps[7]); await run("Expected error observed");
        const now = await (await context.request.get(progressPath)).json();
        assert.equal(now.stepStates[sampleStateId(steps[7])], "pass"); assert.equal(now.stepStates[activityStateId(steps[7])], undefined);
      });
      if (mode === "offline") assert.equal(await page.locator('.student-module-project img[alt="CheerpJ"]').count(), 0);
      else assert.equal(await page.locator('.student-module-project img[alt="CheerpJ"]').count(), 1);
      assert.deepEqual(errors, []);
      await context.close();
    } finally {
      await browser.close();
      if (classroomId) await admin.from("classrooms").delete().eq("id", classroomId);
      for (const user of users) await admin.auth.admin.deleteUser(user.id);
    }
  });
}
