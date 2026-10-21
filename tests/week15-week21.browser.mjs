// Local disposable classroom only. Run with the production offline test server on port 3022.
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { activityStateId, sampleStateId } from "../backend/src/module-activities.ts";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const raw = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(raw.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((match) => [match[1], match[2]]));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const contents = Array.from({ length: 7 }, (_, i) => JSON.parse(readFileSync(new URL(`../docs/modules/week${15 + i}/Java2_Week_${15 + i}.codeshare.json`, import.meta.url))));
const edits = JSON.parse(readFileSync(new URL("./fixtures/week15-week21-task-edits.json", import.meta.url)));
const steps = (content) => content.lessons.flatMap((lesson) => lesson.blocks.filter((block) => block.type === "step"));
const changed = (step, path) => edits[step.id].filter((edit) => edit.path === path).reduce((source, edit) => source.replaceAll(edit.from, edit.to), step.files.find((file) => file.path === path).content);

test("Weeks 15–21 local browser: uploads, sample gate, completion, saved drafts and real component checks", async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const users = []; let classroomId;
  try {
    const password = randomUUID();
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `curriculum-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Curriculum ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const context = await browser.newContext({ baseURL: "http://localhost:3022", viewport: { width: 1500, height: 1050 } });
    assert.equal((await context.request.post("/api/auth/login", { data: { email: users[0].email, password } })).status(), 200);
    const created = await context.request.post("/api/classes", { data: { name: "Week 15–21 disposable verification" } });
    assert.equal(created.status(), 201); classroomId = (await created.json()).id;
    await t.test("all seven revised JSON files upload through the real app", async () => {
      for (const content of contents) assert.equal((await context.request.post(`/api/classrooms/${classroomId}/modules`, { data: content })).status(), 201, `Week ${content.week}`);
    });
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);
    assert.equal((await context.request.post("/api/auth/login", { data: { email: users[1].email, password } })).status(), 200);
    await t.test("every code week opens its first project with Java files only", async () => {
      for (const content of contents.filter((content) => steps(content).length)) {
        const response = await context.request.post(`/api/classrooms/${classroomId}/modules/${content.id}/progress/activity`, { data: { stepId: steps(content)[0].id } });
        assert.equal(response.status(), 200, `Week ${content.week}: ${await response.text()}`);
        assert.ok((await response.json()).projectFiles.every((file) => file.path.endsWith(".java")));
      }
    });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    const errors = []; page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/"); await page.locator(".classroom-workspace").waitFor();
    const worksheet = page.locator("#classroom-worksheet"), editor = page.getByRole("textbox", { name: "Java source code editor", exact: true });
    const feedback = page.locator(".module-run-feedback");
    const progress = (content) => `/api/classrooms/${classroomId}/modules/${content.id}/progress`;
    const openModule = async (content) => {
      await page.locator('.workspace-rail button[aria-controls="classroom-modules"]').hover();
      await page.locator("#classroom-modules .module-catalog-card").filter({ hasText: content.title }).getByRole("button").first().click();
      await worksheet.locator(".worksheet-paper:not([hidden])").waitFor();
    };
    const openStep = async (step, expected = step.files.find((file) => file.path === "Main.java").content) => {
      await page.mouse.move(1100, 20); await page.getByRole("button", { name: "Module", exact: true }).hover();
      await worksheet.getByRole("button", { name: new RegExp(`Step ${step.number}$`) }).click();
      const response = page.waitForResponse((response) => response.url().endsWith("/progress/activity") && response.request().method() === "POST");
      await worksheet.getByRole("button", { name: "Work in code editor", exact: true }).click();
      assert.equal((await response).status(), 200);
      await page.waitForFunction((value) => document.querySelector('textarea[aria-label="Java source code editor"]')?.value === value, expected);
    };
    const run = async (message) => {
      await page.waitForTimeout(1600); await page.getByRole("button", { name: /Run code/ }).click();
      await page.waitForFunction((message) => document.querySelector(".module-run-feedback")?.textContent.includes(message), message, { timeout: 30000 });
    };
    const week16 = contents[1], [first, second] = steps(week16);
    await openModule(week16);
    await t.test("Week 16 verifies its unchanged sample without completing the task", async () => {
      await openStep(first); assert.equal(await editor.getAttribute("readonly"), "");
      await run("Sample verified");
      const saved = await (await context.request.get(progress(week16))).json();
      assert.equal(saved.stepStates[sampleStateId(first)], "pass"); assert.equal(saved.stepStates[activityStateId(first)], undefined);
      assert.equal((await context.request.post(`${progress(week16)}/activity`, { data: { stepId: second.id } })).status(), 403);
    });
    await t.test("Week 16 completes the alteration, opens the next sample and restores saved edits", async () => {
      await editor.fill(changed(first, "Main.java")); await run("Completed — next activity unlocked");
      await openStep(second); await run("Sample verified");
      assert.equal(await editor.inputValue(), second.files.find((file) => file.path === "Main.java").content);
      await page.reload(); await page.locator(".classroom-workspace").waitFor(); await openModule(week16);
      await openStep(first, changed(first, "Main.java"));
      assert.match(await feedback.textContent(), /Completed — your progress is saved/);
    });
    await t.test("Week 17 checks actual panel changes; the no-display sample alone never completes", async () => {
      await page.reload(); await page.locator(".classroom-workspace").waitFor();
      const content = contents[2], first = steps(content)[0]; await openModule(content); await openStep(first);
      await run("Sample verified"); await run("Still showing sample output");
      await editor.fill(changed(first, "Main.java"));
      await page.locator(".student-module-project .file-tabs").getByRole("button", { name: "TerminalPanel.java", exact: true }).click();
      await editor.fill(changed(first, "TerminalPanel.java")); await run("Completed — next activity unlocked");
      const saved = await (await context.request.get(progress(content))).json();
      assert.equal(saved.stepStates[activityStateId(first)], "pass");
      assert.match(await page.locator('pre[aria-label="Program output"]').textContent(), /Panel controls: 3/);
    });
    await page.screenshot({ path: "/tmp/codeshare-week15-21/browser-last-state.png", fullPage: true });
    assert.deepEqual(errors, []); assert.equal(await page.locator('.student-module-project img[alt="CheerpJ"]').count(), 0);
    await context.close();
  } finally {
    await browser.close();
    if (classroomId) assert.equal((await admin.from("classrooms").delete().eq("id", classroomId)).error, null);
    for (const user of users) assert.equal((await admin.auth.admin.deleteUser(user.id)).error, null);
  }
});
