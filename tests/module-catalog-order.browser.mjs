// Real local production app, disposable local accounts and laptop Java; no hosted services.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const raw = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(raw.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((match) => [match[1], match[2]]));
const baseURL = process.env.MODULE_ORDER_BROWSER_URL || "http://localhost:3040";
for (const url of [local.API_URL, baseURL]) assert.ok(["localhost", "127.0.0.1"].includes(new URL(url).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const fixture = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
const weeks = Array.from({ length: 10 }, (_, index) => index + 12);
const contents = weeks.map((week) => {
  const content = structuredClone(fixture);
  content.id = `catalog-order-${week}`; content.week = week; content.title = `Catalog order Week ${week}`;
  content.starterFiles = []; delete content.performanceTask;
  content.lessons = content.lessons.slice(0, 1);
  const step = content.lessons[0].blocks[0]; delete step.activity;
  step.files = [{ path: "Main.java", content: `public class Main { public static void main(String[] args) { System.out.println(${week}); } }` }];
  step.expectedOutput = String(week);
  if (week > 12) content.previousModuleId = `catalog-order-${week - 1}`;
  return content;
});

test("module catalog browser: chronological unfinished weeks and completed weeks at the bottom", async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
  const users = [], external = [], errors = []; let classroomId;
  const password = randomUUID();
  const check = async (response, status = 200) => { assert.equal(response.status(), status, await response.text()); return response.json(); };
  const login = async (user) => check(await context.request.post("/api/auth/login", { data: { email: user.email, password } }));
  await context.route("**/*", async (route) => {
    if (!["localhost", "127.0.0.1"].includes(new URL(route.request().url()).hostname)) { external.push(route.request().url()); await route.abort(); }
    else await route.continue();
  });
  try {
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `catalog-order-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Catalog ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    await login(users[0]);
    classroomId = (await check(await context.request.post("/api/classes", { data: { subject: "Java", name: "Disposable catalog order class" } }), 201)).id;
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);
    for (const content of contents) await check(await context.request.post(`/api/classrooms/${classroomId}/modules`, { data: content }), 201);
    await check(await context.request.patch(`/api/classrooms/${classroomId}/active-module`, { data: { moduleId: contents.at(-1).id } }));
    await login(users[1]);
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on("pageerror", (error) => errors.push(error.message));
    const catalog = page.locator("#classroom-modules");
    const cardTitles = () => catalog.locator(".module-catalog-card strong").allTextContents();
    const titles = (order) => order.map((week) => `Catalog order Week ${week}`);
    const openCatalog = async () => {
      await page.getByRole("button", { name: "Modules", exact: true }).click();
      await page.waitForFunction(() => document.querySelectorAll("#classroom-modules .module-catalog-card").length === 10);
    };
    await page.goto("/"); await page.locator(".classroom-workspace").waitFor();
    await t.test("Week 12 is first and Week 21 is last even when Week 21 is the weekly pick", async () => {
      await openCatalog();
      assert.deepEqual(await cardTitles(), titles(weeks));
      assert.match(await catalog.locator(".module-catalog-card").last().textContent(), /THIS WEEK/);
      assert.match(await catalog.locator(".module-catalog-card").nth(1).textContent(), /Locked/);
      await page.screenshot({ path: "/tmp/module-order-unfinished.png", fullPage: true, animations: "disabled" });
    });
    await t.test("a successful laptop Java run moves completed Week 12 below unfinished Week 13 through Week 21", async () => {
      await catalog.locator(".module-catalog-card").first().getByRole("button").click();
      await page.locator("#classroom-worksheet article:not([hidden])").getByRole("button", { name: "Work in code editor", exact: true }).click();
      await page.waitForFunction(() => document.getElementById("classroom-worksheet")?.dataset.open === "false");
      await page.getByRole("button", { name: /Run code/ }).click();
      await page.waitForFunction(() => document.querySelector(".module-run-feedback.passed, .module-run-feedback.retry, .student-module-project .module-error"), null, { timeout: 30000 });
      assert.match(await page.locator(".student-module-project").textContent(), /Completed — next activity unlocked/);
      await openCatalog();
      await page.waitForFunction(() => document.querySelector("#classroom-modules .catalog-progress")?.textContent.includes("1 / 10"));
      assert.deepEqual(await cardTitles(), titles([...weeks.slice(1), 12]));
      assert.match(await catalog.locator(".module-catalog-card").last().textContent(), /100% complete/);
      await page.screenshot({ path: "/tmp/module-order-completed.png", fullPage: true, animations: "disabled" });
    });
    await t.test("reload retains the order and browsing does not change saved completion", async () => {
      const progressPath = `/api/classrooms/${classroomId}/modules/${contents[0].id}/progress`;
      const before = await check(await context.request.get(progressPath));
      await page.reload(); await page.locator(".classroom-workspace").waitFor(); await openCatalog();
      await page.waitForFunction(() => document.querySelector("#classroom-modules .catalog-progress")?.textContent.includes("1 / 10"));
      assert.deepEqual(await cardTitles(), titles([...weeks.slice(1), 12]));
      const after = await check(await context.request.get(progressPath));
      assert.deepEqual(after.stepStates, before.stepStates); assert.deepEqual(after.projectFiles, before.projectFiles);
      assert.equal(after.percent, 100); assert.equal(after.updatedAt, before.updatedAt);
      assert.deepEqual(external, []); assert.deepEqual(errors, []);
    });
  } finally {
    await context.close(); await browser.close();
    if (classroomId) assert.equal((await admin.from("classrooms").delete().eq("id", classroomId)).error, null);
    for (const user of users) assert.equal((await admin.auth.admin.deleteUser(user.id)).error, null);
  }
});
