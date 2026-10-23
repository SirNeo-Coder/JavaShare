// Disposable local class; actual student/teacher screens and laptop Java.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const raw = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(raw.split("\n").map((l) => l.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const fixture = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
const mode = process.env.PERSONAL_BROWSER_MODE || "offline";
const baseURL = mode === "online" ? "http://localhost:3033" : "http://localhost:3032";
const main = 'public class Main { public static void main(String[] a) { System.out.println("Coffee shop"); } }';
test(`personal ${mode} screens: successful submission, separate draft, frozen teacher run and complete checklist`, async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const users = []; let classId;
  try {
    const password = randomUUID();
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `personal-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Personal ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const student = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
    const teacher = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
    assert.equal((await teacher.request.post("/api/auth/login", { data: { email: users[0].email, password } })).status(), 200);
    const created = await teacher.request.post("/api/classes", { data: { name: "Personal workflow browser test", moduleSubject: "java" } });
    assert.equal(created.status(), 201); classId = (await created.json()).id;
    assert.equal((await teacher.request.post(`/api/classrooms/${classId}/modules`, { data: fixture })).status(), 201);
    await admin.from("classroom_members").insert({ classroom_id: classId, user_id: users[1].id });
    await admin.from("module_progress").insert({ classroom_id: classId, student_id: users[1].id, module_id: fixture.id,
      step_states: Object.fromEntries(fixture.lessons.flatMap(l => l.blocks).filter(b => b.type === "step").map(b => [b.id, "pass"])),
      project_files: [{ path: "Main.java", content: "// MODULE TRACK" }], performance_task: { project: { files: [{ path: "Main.java", content: main }] } } });
    assert.equal((await student.request.post("/api/auth/login", { data: { email: users[1].email, password } })).status(), 200);
    const progressPath = `/api/classrooms/${classId}/modules/${fixture.id}/progress`;
    const read = async () => (await student.request.get(progressPath)).json();
    const page = await student.newPage(); page.setDefaultTimeout(20000);
    const errors = []; page.on("pageerror", e => errors.push(e.message));
    await page.goto("/"); await page.locator(".classroom-workspace").waitFor();
    const projects = page.locator("#classroom-projects");
    const editor = page.getByRole("textbox", { name: "Java source code editor", exact: true });
    const submit = page.getByRole("button", { name: "Submit this version", exact: true });
    const run = async () => {
      if (mode === "offline") await page.waitForTimeout(1550);
      await page.getByRole("button", { name: /Run code/ }).click();
      await page.getByRole("button", { name: /Run code/ }).waitFor({ timeout: 180000 });
    };
    await t.test("Projects exposes the personal workflow and both entry points reopen the same draft", async () => {
      await page.getByRole("button", { name: "Projects", exact: true }).hover();
      await projects.getByRole("button", { name: "Choose module" }).click();
      await page.locator("#classroom-modules .module-catalog-card").filter({ hasText: fixture.title }).getByRole("button").first().click();
      await page.locator("#classroom-worksheet").getByRole("button", { name: "Work on performance task" }).click();
      await page.waitForFunction((value) => document.querySelector('textarea[aria-label="Java source code editor"]')?.value === value, main);
      assert.equal(await editor.inputValue(), main);
      assert.equal(await submit.isDisabled(), true);
      await page.getByRole("button", { name: "Projects", exact: true }).hover();
      await projects.getByRole("button", { name: "Personal performance-task project", exact: true }).click();
      await page.waitForFunction(() => document.getElementById("classroom-projects")?.dataset.open === "false");
      await page.waitForFunction((value) => document.querySelector('textarea[aria-label="Java source code editor"]')?.value === value, main);
      assert.equal(await editor.inputValue(), main);
    });
    if (mode === "online") await t.test("live Program input works and Stop invalidates a previously successful run", async () => {
      await editor.fill('import java.util.Scanner; public class Main { public static void main(String[] a) { System.out.println("Order?"); System.out.println("Coffee " + new Scanner(System.in).nextLine()); } }');
      const waiting = async () => {
        await page.getByRole("button", { name: /Run code/ }).click();
        await page.getByText("Waiting for input — press Enter to send", { exact: true }).waitFor({ timeout: 180000 });
      };
      await waiting();
      await page.getByLabel("Program input", { exact: true }).fill("Latte");
      await page.getByLabel("Program input", { exact: true }).press("Enter");
      await page.getByRole("button", { name: /Run code/ }).waitFor({ timeout: 180000 });
      assert.match(await page.getByLabel("Program output", { exact: true }).textContent(), /Coffee Latte/);
      assert.equal(await submit.isEnabled(), true);
      await waiting(); await page.getByRole("button", { name: "Stop", exact: true }).click();
      await page.getByRole("button", { name: /Run code/ }).waitFor({ timeout: 20000 });
      assert.equal(await submit.isDisabled(), true);
      assert.match(await page.getByLabel("Program output", { exact: true }).textContent(), /Execution stopped/);
    });
    await t.test("failed run cannot submit; success enables submission; edits invalidate it", async () => {
      await editor.fill("invalid Java"); await run(); assert.equal(await submit.isDisabled(), true, await page.locator(".student-module-project").textContent());
      await editor.fill(main); await run(); assert.equal(await submit.isEnabled(), true);
      await editor.fill(`${main}\n// changed`); assert.equal(await submit.isDisabled(), true);
      await run(); assert.equal(await submit.isEnabled(), true);
      await submit.click(); await page.getByText("Submitted", { exact: true }).first().waitFor();
      const submitted = await read(); assert.equal(submitted.percent, 100); assert.equal(submitted.performanceTask.own.review, undefined);
      assert.equal(submitted.projectFiles.find((file) => /(?:^|\/)Main.java$/.test(file.path)).content, "// MODULE TRACK");
      await editor.fill(main.replace("Coffee shop", "Later draft")); await page.getByRole("button", { name: "Save work", exact: true }).click();
      await page.getByText("Your project is saved", { exact: true }).waitFor();
      assert.match((await read()).performanceTask.own.files[0].content, /Coffee shop/);
    });
    const teacherPage = await teacher.newPage(); teacherPage.setDefaultTimeout(20000); teacherPage.on("pageerror", e => errors.push(e.message));
    await t.test("teacher opens frozen files in main editor, runs them and saves every checklist item", async () => {
      await teacherPage.goto("/");
      await teacherPage.getByRole("button", { name: /Open class/ }).click();
      await teacherPage.getByRole("button", { name: /^Students/ }).click();
      await teacherPage.getByRole("button", { name: /Open Personal student.*progress/ }).click();
      await teacherPage.getByRole("button", { name: "Review personal submission" }).click();
      const teacherEditor = teacherPage.getByRole("textbox", { name: "Java source code editor", exact: true });
      await teacherEditor.waitFor(); assert.equal(await teacherEditor.getAttribute("readonly"), "");
      assert.match(await teacherEditor.inputValue(), /Coffee shop/); assert.doesNotMatch(await teacherEditor.inputValue(), /Later draft/);
      assert.equal(await teacherPage.getByRole("button", { name: "Save work", exact: true }).count(), 0);
      const before = await read();
      await teacherPage.mouse.click(1200, 400);
      await teacherPage.getByRole("button", { name: /Run code/ }).click();
      await teacherPage.getByRole("button", { name: /Run code/ }).waitFor({ timeout: 180000 });
      assert.match(await teacherPage.getByLabel("Program output", { exact: true }).textContent(), /Coffee shop/);
      assert.deepEqual(await read(), before);
      await teacherPage.getByRole("button", { name: "Students / projects", exact: true }).hover();
      const review = teacherPage.getByRole("region", { name: "Personal submission review" });
      assert.equal(await review.getByRole("checkbox").count(), fixture.performanceTask.checklist.length);
      for (const box of await review.getByRole("checkbox").all()) await box.check();
      await review.getByRole("button", { name: "Save review" }).click(); await review.getByText("Review saved", { exact: true }).waitFor();
      const after = await read(); assert.equal(after.percent, before.percent); assert.deepEqual(after.stepStates, before.stepStates);
      assert.deepEqual(after.performanceTask.own.review.checked, fixture.performanceTask.checklist.map(() => true));
      await teacherPage.screenshot({ path: `/tmp/codeshare-personal-${mode}-review.png`, fullPage: true });
    });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    if (classId) await admin.from("classrooms").delete().eq("id", classId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
