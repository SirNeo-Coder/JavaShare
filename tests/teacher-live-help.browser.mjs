// Disposable local class; real teacher, student and group-member screens over local Supabase Realtime.
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
const baseURL = process.env.LIVE_HELP_BASE_URL || "http://localhost:3032";
const main = 'public class Main { public static void main(String[] a) { System.out.println("Coffee shop"); } }';
const groupCode = 'public class Main { public static void main(String[] a) { System.out.println("Group"); } }';
const editorValue = (page) => page.getByRole("textbox", { name: "Java source code editor", exact: true }).inputValue();
const waitForEditor = (page, pattern) => page.waitForFunction((source) => new RegExp(source).test(document.querySelector('textarea[aria-label="Java source code editor"]')?.value ?? ""), pattern.source);
const typeAtEnd = async (page, text) => {
  const editor = page.getByRole("textbox", { name: "Java source code editor", exact: true });
  await editor.click(); await page.keyboard.press("Control+End"); await page.keyboard.type(text);
};

test("teacher live help: watch and edit a student's projects only while selected; edit an online group's code", async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const users = []; let classId;
  try {
    const password = randomUUID();
    for (const [role, name] of [["teacher", "Live teacher"], ["student", "Live student"], ["student", "Group one"], ["student", "Group two"]]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `live-help-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role, name }).eq("id", data.user.id)).error, null);
    }
    const context = async (user) => {
      const created = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
      assert.equal((await created.request.post("/api/auth/login", { data: { email: user.email, password } })).status(), 200);
      return created;
    };
    const teacher = await context(users[0]);
    const created = await teacher.request.post("/api/classes", { data: { name: "Teacher live help browser test", subject: "Java" } });
    assert.equal(created.status(), 201, await created.text()); classId = (await created.json()).id;
    assert.equal((await teacher.request.post(`/api/classrooms/${classId}/modules`, { data: fixture })).status(), 201);
    for (const user of users.slice(1)) assert.equal((await admin.from("classroom_members").insert({ classroom_id: classId, user_id: user.id })).error, null);
    await admin.from("module_progress").insert({ classroom_id: classId, student_id: users[1].id, module_id: fixture.id,
      step_states: Object.fromEntries(fixture.lessons.flatMap((l) => l.blocks).filter((b) => b.type === "step").map((b) => [b.id, "pass"])),
      project_files: [{ path: "Main.java", content: "// MODULE TRACK" }], performance_task: { project: { files: [{ path: "Main.java", content: main }] } } });
    const { data: group } = await admin.from("teams").insert({ classroom_id: classId, owner_id: null, slug: `group-${randomUUID()}`, name: "Live group" }).select("id").single();
    for (const user of users.slice(2)) assert.equal((await admin.from("team_members").insert({ team_id: group.id, user_id: user.id })).error, null);
    const { data: groupProject } = await admin.from("projects").insert({ classroom_id: classId, team_id: group.id, title: "Group code", description: "Shared" }).select("id").single();
    const { data: groupFile } = await admin.from("code_files").insert({ project_id: groupProject.id, path: "src/Main.java", content: groupCode, updated_by: users[2].id }).select("id").single();

    const errors = [];
    const open = async (browserContext) => {
      const page = await browserContext.newPage(); page.setDefaultTimeout(20000);
      page.on("pageerror", (e) => errors.push(e.message));
      return page;
    };
    const student = await open(await context(users[1]));
    // Every live message the student's browser sends, to prove nothing goes out unless the teacher watches.
    const moduleFrames = [];
    student.on("websocket", (ws) => ws.on("framesent", (frame) => { if (/team:module-/.test(String(frame.payload))) moduleFrames.push(String(frame.payload)); }));
    await student.goto("/"); await student.locator(".classroom-workspace").waitFor();
    const teacherPage = await open(teacher);
    const studentCard = () => teacherPage.locator(".team-select").filter({ hasText: "Live student" });

    await t.test("student's personal project sends nothing while the teacher has not selected them", async () => {
      await student.getByRole("button", { name: "Projects", exact: true }).hover();
      await student.locator("#classroom-projects").getByRole("button", { name: "Choose module" }).click();
      await student.locator("#classroom-modules .module-catalog-card").filter({ hasText: fixture.title }).getByRole("button").first().click();
      await student.locator("#classroom-worksheet").getByRole("button", { name: "Work on performance task" }).click();
      await waitForEditor(student, /Coffee shop/);
      await teacherPage.goto("/");
      await teacherPage.getByRole("button", { name: "Open class", exact: true }).click();
      await teacherPage.getByRole("button", { name: "Enter classroom" }).click();
      await teacherPage.locator(".classroom-workspace").waitFor();
      await typeAtEnd(student, "\n// before teacher");
      await student.waitForTimeout(1500);
      assert.deepEqual(moduleFrames, []);
    });

    await t.test("selecting the student shows their live personal project with their name cursor", async () => {
      await teacherPage.getByRole("button", { name: "Students / projects", exact: true }).hover();
      await studentCard().click();
      await teacherPage.getByText(`Live: Live student · Personal project · ${fixture.title}`).waitFor();
      await waitForEditor(teacherPage, /before teacher/);
      assert.equal(await editorValue(teacherPage), await editorValue(student));
      await typeAtEnd(student, "\n// from student");
      await waitForEditor(teacherPage, /from student/);
      await teacherPage.locator(".remote-cursor").filter({ hasText: "Live student" }).waitFor();
      assert.ok(moduleFrames.length > 0);
    });

    await t.test("the teacher's typing lands in the student's editor with a Teacher cursor, unsaved", async () => {
      const saved = await (await student.context().request.get(`/api/classrooms/${classId}/modules/${fixture.id}/progress`)).json();
      await typeAtEnd(teacherPage, "\n// from teacher");
      await waitForEditor(student, /from teacher/);
      await student.locator(".remote-cursor").filter({ hasText: "Teacher" }).waitFor();
      assert.match(await editorValue(student), /before teacher[\s\S]*from student[\s\S]*from teacher/);
      assert.equal(await editorValue(student), await editorValue(teacherPage));
      await student.getByText("Unsaved changes — click Save work").waitFor();
      const after = await (await student.context().request.get(`/api/classrooms/${classId}/modules/${fixture.id}/progress`)).json();
      assert.deepEqual(after.performanceTask, saved.performanceTask, "the teacher never saves into the student's project");
    });

    await t.test("switching to the module project switches the teacher's view", async () => {
      await student.getByRole("button", { name: "Save work", exact: true }).click();
      await student.getByText("Your project is saved", { exact: true }).waitFor();
      await student.getByRole("button", { name: "Projects", exact: true }).hover();
      await student.locator("#classroom-projects").getByRole("button", { name: "Module project", exact: true }).click();
      await teacherPage.getByText(`Live: Live student · Module project · ${fixture.title}`).waitFor();
      await waitForEditor(student, /MODULE TRACK/);
      await waitForEditor(teacherPage, /MODULE TRACK/);
      assert.equal(await editorValue(teacherPage), await editorValue(student));
      await teacherPage.screenshot({ path: "/tmp/codeshare-teacher-live-help-module.png" });
    });

    await t.test("selecting another card stops the student's live sending", async () => {
      await teacherPage.getByRole("button", { name: "Students / projects", exact: true }).hover();
      await teacherPage.locator(".team-select").filter({ hasText: "Teacher Demo" }).click();
      await teacherPage.getByText(/^Live: /).waitFor({ state: "detached" });
      await student.waitForTimeout(1500);
      const sent = moduleFrames.length;
      await typeAtEnd(student, "\n// after teacher left");
      await student.waitForTimeout(1500);
      assert.equal(moduleFrames.length, sent);
    });

    await t.test("group: read-only while no member is online, then the teacher's typing reaches online members unsaved", async () => {
      await teacherPage.getByRole("button", { name: "Students / projects", exact: true }).hover();
      await teacherPage.getByRole("button", { name: /^Groups/ }).click();
      await teacherPage.locator(".team-select").filter({ hasText: "Live group" }).click();
      await waitForEditor(teacherPage, /"Group"/);
      await teacherPage.getByText("Editing opens when a group member is online").waitFor();
      assert.equal(await teacherPage.getByRole("textbox", { name: "Java source code editor", exact: true }).getAttribute("readonly"), "");
      const member = await open(await context(users[2]));
      await member.goto("/"); await member.locator(".classroom-workspace").waitFor();
      await member.getByRole("button", { name: "Projects", exact: true }).hover();
      await member.locator("#classroom-projects .team-select").filter({ hasText: "Live group" }).click();
      await waitForEditor(member, /"Group"/);
      await teacherPage.getByText("Editing opens when a group member is online").waitFor({ state: "detached" });
      assert.equal(await teacherPage.getByRole("textbox", { name: "Java source code editor", exact: true }).getAttribute("readonly"), null);
      await member.waitForTimeout(1000);
      await typeAtEnd(teacherPage, "\n// teacher help");
      await waitForEditor(member, /teacher help/);
      await member.locator(".remote-cursor").filter({ hasText: "Teacher" }).waitFor();
      await member.waitForTimeout(1500);
      const { data: file } = await admin.from("code_files").select("content").eq("id", groupFile.id).single();
      assert.equal(file.content, groupCode, "the teacher never saves into the group's files");
      await teacherPage.screenshot({ path: "/tmp/codeshare-teacher-live-help-group.png" });
    });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    if (classId) await admin.from("classrooms").delete().eq("id", classId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
