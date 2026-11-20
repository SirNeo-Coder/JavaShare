// Real local browser check (CKB-130): a sample-first step's locked editor says why, on the student's screen and in the
// teacher's live view, and the notice goes once the unchanged sample runs. Local Supabase, laptop Java.
// Env: PREVIEW_BASE_URL (default http://localhost:3062), CODESHARE_PLAYWRIGHT_MODULE, PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
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
Object.assign(content, { id: `sample-lock-${randomUUID().slice(0, 6)}`, week: 61, title: "Sample lock week 61", sampleFirst: true });
content.lessons.forEach((lesson, index) => lesson.blocks.filter((block) => block.activity).forEach((block) => { block.activity.id = `sample-lock-task-${index}`; }));

test("sample lock notice: student and teacher live view say the editor is locked until the sample runs, then it goes; the teacher sees the student's output", async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const baseURL = process.env.PREVIEW_BASE_URL || "http://localhost:3062";
  const users = []; let classId;
  try {
    const password = randomUUID(); const contexts = [];
    for (const [role, name] of [["teacher", "Lock Teacher"], ["student", "Lock Student"]]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `sample-lock-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role, name }).eq("id", data.user.id)).error, null);
      const context = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
      assert.equal((await context.request.post("/api/auth/login", { data: { email: data.user.email, password } })).status(), 200);
      contexts.push(context);
    }
    const [teacher, student] = contexts;
    const created = await teacher.request.post("/api/classes", { data: { subject: "Java", name: "Sample lock browser" } });
    assert.equal(created.status(), 201); classId = (await created.json()).id;
    assert.equal((await teacher.request.post(`/api/classrooms/${classId}/modules`, { data: content })).status(), 201);
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classId, user_id: users[1].id })).error, null);
    const errors = [];
    const [studentPage, teacherPage] = await Promise.all([student.newPage(), teacher.newPage()]);
    for (const page of [studentPage, teacherPage]) { page.setDefaultTimeout(30000); page.on("pageerror", (error) => errors.push(error.message)); }

    await studentPage.goto("/"); await studentPage.locator(".classroom-workspace").waitFor();
    await studentPage.getByRole("button", { name: "Module", exact: true }).hover();
    await studentPage.locator("#classroom-modules .module-catalog-card").filter({ hasText: content.title }).getByRole("button").first().click();
    await studentPage.locator("#classroom-worksheet article:not([hidden])").getByRole("button", { name: "Work in code editor", exact: true }).click();
    const lock = (page) => page.locator(".student-module-project .editor-lock");
    await lock(studentPage).filter({ hasText: "🔒 Locked — press ▶ Run code to check the sample first. Then you can edit." }).waitFor();

    await teacherPage.goto("/");
    await teacherPage.locator("header").filter({ hasText: "Sample lock browser" }).getByRole("button", { name: "Open class", exact: true }).click();
    await teacherPage.getByRole("button", { name: "Enter classroom" }).click();
    await teacherPage.locator(".classroom-workspace").waitFor();
    await teacherPage.getByRole("button", { name: "Students / projects", exact: true }).hover();
    await teacherPage.locator(".team-select").filter({ hasText: "Lock Student" }).click();
    await teacherPage.getByText(`Live: Lock Student · Module project · ${content.title}`).waitFor();
    await lock(teacherPage).filter({ hasText: "🔒 Locked — the student must press ▶ Run code to check the sample first. Then you both can edit." }).waitFor();

    // The notice is one line above the code, never a tall block that pushes the code to the bottom.
    for (const page of [studentPage, teacherPage]) assert.ok((await lock(page).boundingBox()).height < 80, "the notice stays one short line");
    if (process.env.SAMPLE_LOCK_SCREENSHOT) { await studentPage.screenshot({ path: `${process.env.SAMPLE_LOCK_SCREENSHOT}-student.png` }); await teacherPage.screenshot({ path: `${process.env.SAMPLE_LOCK_SCREENSHOT}-teacher.png` }); }
    await studentPage.locator("footer.actionbar").getByRole("button", { name: /Run code/ }).click();
    await studentPage.locator(".module-run-feedback").filter({ hasText: "Sample verified" }).waitFor();
    await lock(studentPage).waitFor({ state: "detached" });
    await lock(teacherPage).waitFor({ state: "detached" });
    assert.equal(await studentPage.locator(".student-module-project").getByRole("textbox", { name: "Java source code editor", exact: true }).isEditable(), true);
    // CKB-132: the teacher's right panel shows the watched student's output and status, live.
    const panel = teacherPage.getByRole("complementary", { name: "Student live output" });
    await panel.getByText("Live output: Lock Student").waitFor();
    await teacherPage.waitForFunction(() => document.querySelector('[aria-label="Student program output"]')?.textContent?.includes("Capacity: 20"));
    await panel.locator(".module-run-feedback.passed").getByText(/^Sample verified/).waitFor();
    if (process.env.SAMPLE_LOCK_SCREENSHOT) await teacherPage.screenshot({ path: `${process.env.SAMPLE_LOCK_SCREENSHOT}-output.png` });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    if (classId) await admin.from("classrooms").delete().eq("id", classId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
