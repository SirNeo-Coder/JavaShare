// Real local browser check: class session step count (teacher, 2026-11-11). The Class session bar shows
// "Step N · done/total done"; hovering lists who is done and who is not. A student finishing the step updates it
// live, with no page reload and no timer.
// Local Supabase only. Env: PREVIEW_BASE_URL (default http://localhost:3062, laptop Java), CODESHARE_PLAYWRIGHT_MODULE,
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const config = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(config.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const content = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
content.id = `step-done-browser-${randomUUID().slice(0, 6)}`; content.week = 60; content.title = "Step done week 60";
const stepOne = content.lessons[0].blocks[0];

test("class session step count: Step 1 · 0/2 done, a student's finished run makes it 1/2 live, hover lists Done and Not yet", async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const baseURL = process.env.PREVIEW_BASE_URL || "http://localhost:3062";
  const users = []; let classId;
  try {
    const password = randomUUID();
    const contexts = [];
    for (const [role, name] of [["teacher", "Done Teacher"], ["student", "Ana Done"], ["student", "Ben Notyet"]]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `step-done-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role, name }).eq("id", data.user.id)).error, null);
      const context = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
      assert.equal((await context.request.post("/api/auth/login", { data: { email: data.user.email, password } })).status(), 200);
      contexts.push(context);
    }
    const [teacher, ana] = contexts;
    const created = await teacher.request.post("/api/classes", { data: { subject: "Java", name: "Step done browser" } });
    assert.equal(created.status(), 201); classId = (await created.json()).id;
    assert.equal((await teacher.request.post(`/api/classrooms/${classId}/modules`, { data: content })).status(), 201);
    assert.equal((await admin.from("classroom_members").insert([{ classroom_id: classId, user_id: users[1].id }, { classroom_id: classId, user_id: users[2].id }])).error, null);

    const page = await teacher.newPage(); page.setDefaultTimeout(30000);
    const errors = []; page.on("pageerror", (error) => errors.push(error.message));
    const reads = []; page.on("request", (request) => { if (request.url().endsWith("/session/step-progress")) reads.push(Date.now()); });
    await page.goto("/");
    await page.locator("header").filter({ hasText: "Step done browser" }).getByRole("button", { name: "Open class", exact: true }).click();
    await page.getByRole("button", { name: "Enter classroom" }).click();
    await page.locator(".team-header").getByRole("button", { name: "End session" }).waitFor();
    const chip = page.locator(".session-step-done");
    assert.equal(await chip.count(), 0, "no worksheet open: no count");

    await page.getByRole("button", { name: "Module", exact: true }).hover();
    await page.locator("#classroom-modules .module-catalog-card").filter({ hasText: content.title }).getByRole("button").first().click();
    await page.locator("#classroom-worksheet article:not([hidden])").waitFor();
    await chip.getByRole("button", { name: "Step 1 · 0/2 done" }).waitFor();

    // Ana finishes step 1 with the laptop's Java, as Run code does offline.
    const base = `/api/classrooms/${classId}/modules/${content.id}/progress`;
    const prepared = await (await ana.request.post(`${base}/activity`, { data: { stepId: stepOne.id } })).json();
    const before = reads.length;
    const run = await (await ana.request.post(`${base}/run`, { data: { stepId: stepOne.id, files: prepared.projectFiles, updatedAt: prepared.updatedAt } })).json();
    assert.equal(run.passed, true, JSON.stringify(run).slice(0, 300));
    await chip.getByRole("button", { name: "Step 1 · 1/2 done" }).waitFor();
    assert.equal(reads.length, before + 1, "one re-read for one finished task");

    const list = chip.getByRole("tooltip");
    assert.equal(await list.isVisible(), false, "the names stay hidden until hover");
    await chip.getByRole("button").hover();
    await list.waitFor({ state: "visible" });
    assert.equal(await list.innerText(), "Done (1)\nAna Done\nNot yet (1)\nBen Notyet");
    if (process.env.STEP_DONE_SCREENSHOT) await page.screenshot({ path: process.env.STEP_DONE_SCREENSHOT });

    // No timer: nothing re-reads while nobody finishes.
    const quiet = reads.length;
    await page.waitForTimeout(4000);
    assert.equal(reads.length, quiet, "no re-reads without a finished task or a page change");
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    if (classId) await admin.from("classrooms").delete().eq("id", classId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
