// Local production app and disposable local data; actual laptop/browser Java runs.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { activityStateId } from "../backend/src/module-activities.ts";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const raw = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(raw.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const fixture = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
const code = (value) => `public class Main { public static void main(String[] args) { System.out.println(${value}); } }`;
const contents = [12, 13, 14].map((week) => {
  const content = structuredClone(fixture);
  content.id = `browser-prerequisite-${week}`; content.week = week; content.title = `Week ${week} prerequisite check`;
  content.starterFiles = [];
  if (week > 12) content.previousModuleId = `browser-prerequisite-${week - 1}`;
  if (week > 12) content.lessons = content.lessons.slice(0, 1);
  content.lessons.forEach((lesson, index) => {
    const step = lesson.blocks[0]; step.number = index + 1; lesson.dayLabel = `DAY ${index + 1}`; step.files = [{ path: "Main.java", content: code(week) }]; step.expectedOutput = String(week);
    step.activity = { id: `${content.id}-task-${index}`, instruction: "Print the next number.", files: [], expectedOutput: String(week + 1) };
  });
  return content;
});
const first = contents[0].lessons[0].blocks[0], next = contents[0].lessons[1].blocks[0];
for (const mode of process.env.PREREQUISITE_BROWSER_MODE ? [process.env.PREREQUISITE_BROWSER_MODE] : ["offline", "online"]) test(`prerequisites ${mode}: banner, saved-step resume and ordered unlock through the real app`, async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const users = []; let classroomId;
  try {
    const password = randomUUID();
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `${randomUUID()}@prerequisite-browser.example.test`, password, email_confirm: true, user_metadata: { name: `Prerequisite ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const context = await browser.newContext({ baseURL: `http://localhost:${mode === "offline" ? 3022 : 3020}`, viewport: { width: 1500, height: 1050 } });
    const login = async (user) => assert.equal((await context.request.post("/api/auth/login", { data: { email: user.email, password } })).status(), 200);
    await login(users[0]);
    const created = await context.request.post("/api/classes", { data: { name: "Disposable prerequisite browser class" } });
    assert.equal(created.status(), 201); classroomId = (await created.json()).id;
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);
    for (const content of contents) {
      const response = await context.request.post(`/api/classrooms/${classroomId}/modules`, { data: content });
      assert.equal(response.status(), 201, await response.text());
    }
    const activity = await admin.from("activities").insert({ classroom_id: classroomId, created_by: users[0].id, title: "Live catch-up check", mode: "individual" }).select("id").single();
    assert.equal(activity.error, null);
    await admin.from("classrooms").update({ current_activity_id: activity.data.id, active_module_id: contents[2].id }).eq("id", classroomId);
    const draft = [{ path: "Main.java", content: code(13) }];
    const snapshot = { files: [{ path: "Own.java", content: "saved personal submission" }], status: "pass", submittedAt: new Date().toISOString() };
    const seeded = await admin.from("module_progress").insert([
      { student_id: users[1].id, classroom_id: classroomId, module_id: contents[0].id, step_states: { [activityStateId(first)]: "pass" }, project_files: draft, performance_task: { project: { files: snapshot.files }, own: snapshot } },
      { student_id: users[1].id, classroom_id: classroomId, module_id: contents[2].id, step_states: {}, performance_task: {}, project_files: [{ path: "Main.java", content: "preserve Week 14" }] },
    ]);
    assert.equal(seeded.error, null);
    await login(users[1]);
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    const errors = []; page.on("pageerror", (error) => errors.push(error.message));
    const external = [];
    if (mode === "offline") await context.route("**/*", async (route) => {
      const url = new URL(route.request().url());
      if (!["localhost", "127.0.0.1"].includes(url.hostname)) { external.push(url.origin); await route.abort(); } else await route.continue();
    });
    const catalog = page.locator("#classroom-modules");
    const worksheet = page.locator("#classroom-worksheet");
    const editor = page.getByRole("textbox", { name: "Java source code editor", exact: true });
    const openCatalog = async () => {
      await page.getByRole("button", { name: "Modules", exact: true }).click();
      await page.waitForFunction(() => document.getElementById("classroom-modules")?.dataset.open === "true");
    };
    const select = async (week) => catalog.locator(".module-catalog-card").filter({ hasText: `Week ${week} prerequisite check` }).getByRole("button").first().click();
    const run = async () => {
      if (mode === "offline") await page.waitForTimeout(1600);
      await page.getByRole("button", { name: /Run code/ }).click();
      await page.waitForFunction(() => document.querySelector(".module-run-feedback")?.textContent.includes("Completed — next activity unlocked") || document.querySelector(".module-run-feedback.retry, .student-module-project .module-error"), null, { timeout: 240000 });
      assert.match(await page.locator(".module-run-feedback").textContent(), /Completed — next activity unlocked/, await page.locator(".module-error").allTextContents());
    };
    await page.goto("/"); await page.locator(".classroom-workspace").waitFor();
    await t.test("Week 14 names Week 12 and Continue restores the next unfinished saved step during live class", async () => {
      await openCatalog(); await select(14);
      const notice = catalog.locator(".module-access-notice");
      assert.match(await notice.textContent(), /Complete Week 12 before starting Week 14/);
      await page.screenshot({ path: `/tmp/codeshare-prerequisite-${mode}.png`, fullPage: true });
      await notice.getByRole("button", { name: "Continue Week 12", exact: true }).click();
      await worksheet.locator("article:not([hidden])").waitFor();
      assert.match(await worksheet.locator('.worksheet-tabs [aria-current="page"]').textContent(), /Step 2/);
      assert.equal(await editor.inputValue(), draft[0].content);
      await worksheet.locator("article:not([hidden])").getByRole("button", { name: "Work in code editor", exact: true }).click();
      await page.waitForFunction(() => document.getElementById("classroom-worksheet")?.dataset.open === "false");
      await run();
      const saved = (await admin.from("module_progress").select("step_states,performance_task").eq("classroom_id", classroomId).eq("student_id", users[1].id).eq("module_id", contents[0].id).single()).data;
      assert.equal(saved.step_states[activityStateId(next)], "pass"); assert.deepEqual(saved.performance_task.own, snapshot);
      assert.deepEqual(saved.performance_task.project.files, snapshot.files);
    });
    await t.test("Week 13 must pass before Week 14 opens; reload retains the ordered unlock and Week 14 work", async () => {
      await openCatalog(); await select(14);
      const notice = catalog.locator(".module-access-notice");
      assert.match(await notice.textContent(), /Complete Week 13 before starting Week 14/);
      await notice.getByRole("button", { name: "Continue Week 13", exact: true }).click();
      await worksheet.locator("article:not([hidden])").getByRole("button", { name: "Work in code editor", exact: true }).click();
      await page.waitForFunction(() => document.getElementById("classroom-worksheet")?.dataset.open === "false");
      await editor.fill(code(14));
      assert.equal(await editor.inputValue(), code(14)); await run();
      await page.reload(); await page.locator(".classroom-workspace").waitFor();
      await openCatalog(); await select(14);
      await worksheet.locator("article:not([hidden])").waitFor();
      assert.equal(await editor.inputValue(), "preserve Week 14");
      assert.equal(await worksheet.locator(".module-access-notice").count(), 0);
    });
    await t.test("both Projects shortcuts recheck changed prerequisites and offer Continue without overwriting later work", async () => {
      for (const name of ["Module project", "Personal performance-task project"]) {
        const revised = structuredClone(contents[0]); revised.lessons[0].blocks[0].activity.id += "-revised";
        assert.equal((await admin.from("course_modules").update({ content: revised }).eq("classroom_id", classroomId).eq("module_id", revised.id)).error, null);
        await page.getByRole("button", { name: "Projects", exact: true }).click();
        await page.getByRole("button", { name, exact: true }).click();
        const notice = page.locator(".module-access-notice:visible");
        await notice.waitFor(); assert.match(await notice.textContent(), /Complete Week 12 before starting Week 14/);
        await notice.getByRole("button", { name: "Continue Week 12", exact: true }).click();
        await page.waitForFunction(() => document.querySelector(".student-module-project .workspace-card-heading")?.textContent.includes("Week 12 prerequisite check"));
        assert.equal(await editor.inputValue(), code(13));
        const later = (await admin.from("module_progress").select("project_files").eq("classroom_id", classroomId).eq("student_id", users[1].id).eq("module_id", contents[2].id).single()).data;
        assert.equal(later.project_files[0].content, "preserve Week 14");
        await admin.from("course_modules").update({ content: contents[0] }).eq("classroom_id", classroomId).eq("module_id", contents[0].id);
        await page.reload(); await page.locator(".classroom-workspace").waitFor(); await openCatalog(); await select(14);
        await worksheet.locator("article:not([hidden])").waitFor();
      }
    });
    await t.test("missing prerequisite has a teacher-upload message; teacher preview remains available", async () => {
      await admin.from("course_modules").delete().eq("classroom_id", classroomId).eq("module_id", contents[1].id);
      await page.reload(); await page.locator(".classroom-workspace").waitFor(); await openCatalog(); await select(14);
      const notice = catalog.locator(".module-access-notice");
      assert.match(await notice.textContent(), /teacher needs to upload prerequisite module browser-prerequisite-13/);
      assert.equal(await notice.getByRole("button").count(), 0);
      await login(users[0]);
      assert.equal((await context.request.get(`/api/classrooms/${classroomId}/modules/${contents[2].id}`)).status(), 200);
    });
    assert.deepEqual(errors, []); if (mode === "offline") assert.deepEqual(external, [], "offline must not load internet resources");
  } finally {
    await browser.close();
    if (classroomId) await admin.from("classrooms").delete().eq("id", classroomId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
