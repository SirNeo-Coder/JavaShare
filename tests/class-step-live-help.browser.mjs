// Real local browser check (CKB-114): during a class session the teacher selecting a student in Students / projects
// sees the Class step that student is typing in, live, not their own saved module project from before the session.
// Local Supabase only. Env: PREVIEW_BASE_URL (default http://localhost:3072, laptop Java), CODESHARE_PLAYWRIGHT_MODULE,
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

const week60 = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
week60.id = `class-live-${randomUUID().slice(0, 6)}`; week60.week = 60; week60.title = "Class live week 60";
week60.lessons.forEach((lesson, index) => { lesson.blocks[0].activity.id = `class-live-task-${index}`; });
const sample = week60.lessons[0].blocks[0].files.find((file) => file.path === "Main.java").content;

test("class step live help: the teacher sees and edits the class step a student is typing in, not their saved project", async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const baseURL = process.env.PREVIEW_BASE_URL || "http://localhost:3072";
  const users = []; let classId;
  try {
    const password = randomUUID();
    const contexts = [];
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `class-live-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Class live ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
      const context = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
      assert.equal((await context.request.post("/api/auth/login", { data: { email: data.user.email, password } })).status(), 200);
      contexts.push(context);
    }
    const [teacher] = contexts;
    const created = await teacher.request.post("/api/classes", { data: { subject: "Java", name: "Class live browser" } });
    assert.equal(created.status(), 201, await created.text()); classId = (await created.json()).id;
    assert.equal((await teacher.request.post(`/api/classrooms/${classId}/modules`, { data: week60 })).status(), 201);
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classId, user_id: users[1].id })).error, null);
    // The student's own saved work from before the session: what the teacher used to see instead.
    const ownEdit = sample.replace('"Capacity: "', '"MY OWN EDIT: "');
    assert.equal((await admin.from("module_progress").insert({ classroom_id: classId, student_id: users[1].id, module_id: week60.id, step_states: {},
      project_files: [...week60.starterFiles, { path: "Main.java", content: ownEdit }], performance_task: {} })).error, null);

    const errors = [];
    const [teacherPage, studentPage] = await Promise.all(contexts.map(async (context) => {
      const page = await context.newPage(); page.setDefaultTimeout(30000); page.on("pageerror", (e) => errors.push(e.message)); return page;
    }));
    const studentEditor = studentPage.locator(".student-module-project").getByRole("textbox", { name: "Java source code editor", exact: true });
    await studentPage.goto("/"); await studentPage.locator(".classroom-workspace").waitFor();

    // Enter classroom starts the session; Work in code editor shares the step with the class (CKB-102).
    await teacherPage.goto("/");
    await teacherPage.getByRole("button", { name: "Open class", exact: true }).click();
    await teacherPage.getByRole("button", { name: "Enter classroom" }).click();
    await teacherPage.locator(".team-header").getByRole("button", { name: "End session" }).waitFor();
    await teacherPage.getByRole("button", { name: "Module", exact: true }).hover();
    await teacherPage.locator("#classroom-modules .module-catalog-card").filter({ hasText: week60.title }).getByRole("button").first().click();
    const worksheet = teacherPage.locator("#classroom-worksheet");
    await worksheet.locator("article:not([hidden])").waitFor();
    await worksheet.getByRole("button", { name: /Step 1$/ }).first().click();
    await worksheet.locator("article:not([hidden])").getByRole("button", { name: "Work in code editor", exact: true }).click();
    await teacherPage.locator(".team-header").getByText("Week 60 · Step 1").waitFor();

    await studentPage.waitForFunction(() => document.querySelector(".student-module-project .workspace-card-heading b")?.textContent?.startsWith("Class step"));
    const classEdit = sample.replace('"Capacity: "', '"Class edit: "');
    await studentEditor.fill(classEdit);

    await teacherPage.getByRole("button", { name: "Students / projects", exact: true }).hover();
    await teacherPage.locator(".team-select").filter({ hasText: "Class live student" }).click();
    const helping = teacherPage.getByRole("region", { name: "Student live project" });
    await helping.getByText("Live: Class live student · Class step · Week 60 · Step 1").waitFor();
    const liveEditor = helping.getByRole("textbox", { name: "Java source code editor", exact: true });
    await teacherPage.waitForFunction(() => document.querySelector('[aria-label="Student live project"] textarea')?.value.includes("Class edit: "));
    assert.doesNotMatch(await liveEditor.inputValue(), /MY OWN EDIT/, "not the student's saved project from before the session");

    // The student keeps typing; it reaches the teacher. The teacher's typing reaches the student.
    await studentEditor.fill(classEdit.replace('"Class edit: "', '"Class edit two: "'));
    await teacherPage.waitForFunction(() => document.querySelector('[aria-label="Student live project"] textarea')?.value.includes("Class edit two: "));
    await liveEditor.fill((await liveEditor.inputValue()).replace('"Class edit two: "', '"Teacher help: "'));
    await studentPage.waitForFunction(() => document.querySelector(".student-module-project .editor-card textarea")?.value.includes("Teacher help: "));
    assert.match(await studentPage.locator(".student-module-project .workspace-card-heading b").first().innerText(), /^Class step/);

    const { data: rows } = await admin.from("module_progress").select("project_files").eq("classroom_id", classId);
    assert.match(JSON.stringify(rows), /MY OWN EDIT/, "the student's own project is unchanged");
    assert.doesNotMatch(JSON.stringify(rows), /Class edit|Teacher help/, "a class step is never saved");
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    if (classId) await admin.from("classrooms").delete().eq("id", classId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
