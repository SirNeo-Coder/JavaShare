// Real local browser check: Share with class (teacher, 2026-11-10). Every student, whatever their week or step,
// gets the teacher's step fresh; Stop sharing returns each to their own work, unchanged.
// Local Supabase only. Env: PREVIEW_BASE_URL (default http://localhost:3052, laptop Java), CODESHARE_PLAYWRIGHT_MODULE,
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

const fixture = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
const [first, second] = [1, 2].map((week) => {
  const content = structuredClone(fixture);
  content.id = `shared-browser-${week}-${randomUUID().slice(0, 6)}`; content.week = 40 + week; content.title = `Shared week ${40 + week}`;
  content.lessons.forEach((lesson, index) => { lesson.blocks[0].activity.id = `shared-browser-${week}-task-${index}`; });
  return content;
});
second.previousModuleId = first.id;
const step = second.lessons[0].blocks[0];
const sample = step.files.find((file) => file.path === "Main.java").content;
const steps = (content) => content.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "step");
const passed = (content) => Object.fromEntries(steps(content).map((item) => [`task:${item.activity.id}`, "pass"]));

test("Share with class: students behind and ahead get the same fresh step; Stop sharing returns their own work", async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const baseURL = process.env.PREVIEW_BASE_URL || "http://localhost:3052";
  const users = []; let classId;
  try {
    const password = randomUUID();
    const contexts = [];
    for (const role of ["teacher", "student", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `shared-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Shared ${role} ${users.length}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
      const context = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
      assert.equal((await context.request.post("/api/auth/login", { data: { email: data.user.email, password } })).status(), 200);
      contexts.push(context);
    }
    const [teacher] = contexts;
    const created = await teacher.request.post("/api/classes", { data: { subject: "Java", name: "Shared step browser" } });
    assert.equal(created.status(), 201, await created.text()); classId = (await created.json()).id;
    for (const content of [first, second]) assert.equal((await teacher.request.post(`/api/classrooms/${classId}/modules`, { data: content })).status(), 201);
    assert.equal((await admin.from("classroom_members").insert(users.slice(1).map((user) => ({ classroom_id: classId, user_id: user.id })))).error, null);
    // "ahead" finished the first week and has their own edits in the second; "behind" has not started.
    const edited = sample.replace('"Capacity: "', '"MY OWN EDIT: "');
    assert.equal((await admin.from("module_progress").insert([
      { classroom_id: classId, student_id: users[2].id, module_id: first.id, step_states: passed(first), project_files: [] },
      { classroom_id: classId, student_id: users[2].id, module_id: second.id, step_states: {}, project_files: [...second.starterFiles, { path: "Main.java", content: edited }] },
    ])).error, null);

    const pages = []; const errors = [];
    for (const context of contexts) { const page = await context.newPage(); page.setDefaultTimeout(30000); page.on("pageerror", (e) => errors.push(e.message)); pages.push(page); }
    const [teacherPage, behindPage, aheadPage] = pages;
    const project = (page) => page.locator(".student-module-project");
    const editor = (page) => project(page).getByRole("textbox", { name: "Java source code editor", exact: true });
    const heading = async (page) => (await project(page).locator(".workspace-card-heading").first().innerText());
    const footer = (page) => page.locator("footer.actionbar").filter({ hasText: "Return to class project" });

    for (const page of [behindPage, aheadPage]) { await page.goto("/"); await page.locator(".classroom-workspace").waitFor(); }
    // The student ahead opens their own Week 42 work.
    await aheadPage.getByRole("button", { name: "Module", exact: true }).hover();
    await aheadPage.locator("#classroom-modules .module-catalog-card").filter({ hasText: second.title }).getByRole("button").first().click();
    await project(aheadPage).waitFor();
    await aheadPage.waitForFunction(() => document.querySelector(".student-module-project .editor-card textarea")?.value.includes("MY OWN EDIT"));

    await teacherPage.goto("/");
    await teacherPage.getByRole("button", { name: "Open class", exact: true }).click();
    await teacherPage.getByRole("button", { name: "Enter classroom" }).click();
    await teacherPage.locator(".classroom-workspace").waitFor();
    await teacherPage.getByRole("button", { name: "Module", exact: true }).hover();
    await teacherPage.locator("#classroom-modules .module-catalog-card").filter({ hasText: second.title }).getByRole("button").first().click();
    const worksheet = teacherPage.locator("#classroom-worksheet");
    await worksheet.locator("article:not([hidden])").waitFor();
    await worksheet.getByRole("button", { name: /Step 1$/ }).first().click();
    await worksheet.locator("article:not([hidden])").getByRole("button", { name: "Work in code editor", exact: true }).click();
    await footer(teacherPage).getByRole("button", { name: "Share with class" }).click();
    await footer(teacherPage).getByRole("button", { name: "Stop sharing" }).waitFor();
    await teacherPage.locator(".team-header").getByText("Week 42 · Step 1").waitFor();

    for (const page of [behindPage, aheadPage]) {
      await page.waitForFunction(() => document.querySelector(".student-module-project .workspace-card-heading b")?.textContent?.startsWith("Class step"));
      assert.match(await heading(page), /Class step · Week 42 · Step 1/);
      assert.equal(await editor(page).inputValue(), sample, "the teacher's fresh sample, not the student's own edits");
      assert.equal(await editor(page).isEditable(), true);
      assert.equal(await footer(page).getByRole("button", { name: "Save work" }).count(), 0);
      assert.notEqual(await page.evaluate(() => document.getElementById("classroom-worksheet")?.dataset.open), "true", "the student's own worksheet no longer covers the class step");
    }
    await editor(behindPage).fill(sample.replace('"Capacity: "', '"Class edit: "'));
    await footer(behindPage).getByRole("button", { name: /Run code/ }).click();
    await behindPage.waitForFunction(() => document.querySelector('[aria-label="Program output"]')?.textContent?.includes("Class edit: 20"));

    await footer(teacherPage).getByRole("button", { name: "Stop sharing" }).click();
    await footer(teacherPage).getByRole("button", { name: "Share with class" }).waitFor();
    await project(behindPage).waitFor({ state: "detached" });
    await aheadPage.waitForFunction(() => document.querySelector(".student-module-project .workspace-card-heading b")?.textContent?.startsWith("Module project"));
    await aheadPage.waitForFunction(() => document.querySelector(".student-module-project .editor-card textarea")?.value.includes("MY OWN EDIT"));

    const { data: rows } = await admin.from("module_progress").select("student_id,module_id,project_files").eq("classroom_id", classId);
    assert.equal(rows.some((row) => row.student_id === users[1].id), false, "the student behind got no progress");
    assert.match(JSON.stringify(rows.find((row) => row.student_id === users[2].id && row.module_id === second.id).project_files), /MY OWN EDIT/);
    assert.doesNotMatch(JSON.stringify(rows), /Class edit/);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    if (classId) await admin.from("classrooms").delete().eq("id", classId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
