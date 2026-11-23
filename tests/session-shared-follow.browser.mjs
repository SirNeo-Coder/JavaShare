// Real local browser check (CKB-133): with the teacher in Work in code editor during a class session, a student who has
// not finished the prerequisite still reads the class module at the shared step's page when they open Module, and a
// refresh brings them back to the class step and that page. Local Supabase, laptop Java.
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

const fixture = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
const [first, second] = [1, 2].map((week) => {
  const content = structuredClone(fixture);
  content.id = `shared-follow-${week}-${randomUUID().slice(0, 6)}`; content.week = 70 + week; content.title = `Shared follow week ${70 + week}`;
  content.lessons.forEach((lesson, index) => { lesson.blocks[0].activity.id = `shared-follow-${week}-task-${index}`; });
  return content;
});
second.previousModuleId = first.id;

test("class session in the code editor: a student behind on prerequisites opens Module at the shared step, also after a refresh", async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const baseURL = process.env.PREVIEW_BASE_URL || "http://localhost:3062";
  const users = []; let classId;
  try {
    const password = randomUUID(); const contexts = [];
    for (const [role, name] of [["teacher", "Follow Teacher"], ["student", "Behind Student"]]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `shared-follow-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role, name }).eq("id", data.user.id)).error, null);
      const context = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
      assert.equal((await context.request.post("/api/auth/login", { data: { email: data.user.email, password } })).status(), 200);
      contexts.push(context);
    }
    const [teacher, student] = contexts;
    const created = await teacher.request.post("/api/classes", { data: { subject: "Java", name: "Shared follow browser" } });
    assert.equal(created.status(), 201); classId = (await created.json()).id;
    for (const content of [first, second]) assert.equal((await teacher.request.post(`/api/classrooms/${classId}/modules`, { data: content })).status(), 201);
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classId, user_id: users[1].id })).error, null);
    const errors = [];
    const [studentPage, teacherPage] = await Promise.all([student.newPage(), teacher.newPage()]);
    for (const page of [studentPage, teacherPage]) { page.setDefaultTimeout(30000); page.on("pageerror", (error) => errors.push(error.message)); }
    // Without a session the second week is locked behind the first.
    assert.equal((await student.request.get(`/api/classrooms/${classId}/modules/${second.id}`)).status(), 403);

    await studentPage.goto("/"); await studentPage.locator(".classroom-workspace").waitFor();
    await teacherPage.goto("/");
    await teacherPage.locator("header").filter({ hasText: "Shared follow browser" }).getByRole("button", { name: "Open class", exact: true }).click();
    await teacherPage.getByRole("button", { name: "Enter classroom" }).click();
    await teacherPage.locator(".team-header").getByRole("button", { name: "End session" }).waitFor();
    await teacherPage.getByRole("button", { name: "Module", exact: true }).hover();
    await teacherPage.locator("#classroom-modules .module-catalog-card").filter({ hasText: second.title }).getByRole("button").first().click();
    const worksheet = teacherPage.locator("#classroom-worksheet");
    await worksheet.locator("article:not([hidden])").waitFor();
    await worksheet.getByRole("button", { name: "Next page →" }).click();
    await worksheet.locator("article:not([hidden])").getByRole("button", { name: "Work in code editor", exact: true }).click();
    await teacherPage.locator(".team-header").getByText("Shared with class").waitFor();
    const stepLabel = `Week ${second.week} · Step 1`;

    const classStep = (page) => page.waitForFunction((label) => document.querySelector(".student-module-project .workspace-card-heading b")?.textContent?.includes(`Class step · ${label}`), stepLabel);
    const shownPage = () => studentPage.locator("#classroom-worksheet article.worksheet-paper:not([hidden])");
    const checkModule = async (when) => {
      await classStep(studentPage);
      assert.notEqual(await studentPage.evaluate(() => document.getElementById("classroom-worksheet")?.dataset.open), "true", `${when}: the worksheet does not cover the class step`);
      await studentPage.getByRole("button", { name: "Module", exact: true }).click();
      await shownPage().waitFor();
      assert.match(await shownPage().getAttribute("aria-label"), /Step 1$/, `${when}: Module opens the class module at the shared step`);
      assert.equal(await studentPage.locator("#classroom-worksheet").getByRole("button", { name: "Next page →" }).isDisabled(), true, `${when}: page buttons stay off`);
      const blocked = await shownPage().getByText(/Complete .* first|previous module|Continue Week/i).allInnerTexts(); assert.equal(await studentPage.locator(".module-access-notice").count(), 0); assert.deepEqual(blocked, [], `${when}: no prerequisite block`);
    };
    await checkModule("in the session");
    await studentPage.reload();
    await studentPage.locator(".classroom-workspace").waitFor();
    await checkModule("after a refresh");
    assert.equal((await student.request.get(`/api/classrooms/${classId}/modules/${second.id}`)).status(), 200, "the session opens the class module on the server");

    // End session: the prerequisite applies again.
    await teacherPage.locator(".team-header").getByRole("button", { name: "End session" }).click();
    await teacherPage.locator(".team-header").getByRole("button", { name: "End session" }).waitFor({ state: "detached" });
    assert.equal((await student.request.get(`/api/classrooms/${classId}/modules/${second.id}`)).status(), 403);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    if (classId) await admin.from("classrooms").delete().eq("id", classId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
