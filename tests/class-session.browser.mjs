// Real local browser check: class session (teacher, 2026-11-10). Enter classroom pulls a student in from the class
// list; students follow the teacher's worksheet page, even a week they have not reached, with no page buttons;
// Work in code editor shares the step; End session releases them.
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

const fixture = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
const [first, second] = [1, 2].map((week) => {
  const content = structuredClone(fixture);
  content.id = `session-browser-${week}-${randomUUID().slice(0, 6)}`; content.week = 50 + week; content.title = `Session week ${50 + week}`;
  content.lessons.forEach((lesson, index) => { lesson.blocks[0].activity.id = `session-browser-${week}-task-${index}`; });
  return content;
});
second.previousModuleId = first.id;
const lastStep = second.lessons[1].blocks[0];
const lastSample = lastStep.files.find((file) => file.path === "Main.java").content;

test("class session: Enter classroom pulls students in; they follow the teacher's worksheet pages past their locks; Work in code editor shares; End session releases", async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const baseURL = process.env.PREVIEW_BASE_URL || "http://localhost:3062";
  const users = []; const classIds = [];
  try {
    const password = randomUUID();
    const contexts = [];
    for (const role of ["teacher", "student", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `session-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Session ${role} ${users.length}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
      const context = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
      assert.equal((await context.request.post("/api/auth/login", { data: { email: data.user.email, password } })).status(), 200);
      contexts.push(context);
    }
    const [teacher] = contexts;
    for (const name of ["Class session browser", "Another class"]) {
      const created = await teacher.request.post("/api/classes", { data: { subject: "Java", name } });
      assert.equal(created.status(), 201, await created.text()); classIds.push((await created.json()).id);
    }
    const [classId, otherClassId] = classIds;
    for (const content of [first, second]) assert.equal((await teacher.request.post(`/api/classrooms/${classId}/modules`, { data: content })).status(), 201);
    // "listed" belongs to two classes, so it waits on the class list; "inside" is already in the classroom. Neither has started Week 51.
    assert.equal((await admin.from("classroom_members").insert([
      { classroom_id: classId, user_id: users[1].id }, { classroom_id: otherClassId, user_id: users[1].id }, { classroom_id: classId, user_id: users[2].id },
    ])).error, null);

    const pages = []; const errors = [];
    for (const context of contexts) { const page = await context.newPage(); page.setDefaultTimeout(30000); page.on("pageerror", (e) => errors.push(e.message)); pages.push(page); }
    const [teacherPage, listedPage, insidePage] = pages;
    const students = [listedPage, insidePage];
    const shownPage = (page) => page.locator("#classroom-worksheet article.worksheet-paper:not([hidden])").getAttribute("aria-label");

    await listedPage.goto("/");
    await listedPage.getByRole("button", { name: "Join another class" }).waitFor();
    await insidePage.goto("/");
    await insidePage.locator(".classroom-workspace").waitFor();

    await teacherPage.goto("/");
    await teacherPage.locator("header").filter({ hasText: "Class session browser" }).getByRole("button", { name: "Open class", exact: true }).click();
    await teacherPage.getByRole("button", { name: "Enter classroom" }).click();
    await teacherPage.locator(".classroom-workspace").waitFor();
    await teacherPage.locator(".team-header").getByRole("button", { name: "End session" }).waitFor();

    await listedPage.locator(".classroom-workspace").waitFor();
    assert.equal(await listedPage.getByText("Your class is live").count(), 0, "pulled straight in, no invitation");

    await teacherPage.getByRole("button", { name: "Module", exact: true }).hover();
    await teacherPage.locator("#classroom-modules .module-catalog-card").filter({ hasText: second.title }).getByRole("button").first().click();
    const worksheet = teacherPage.locator("#classroom-worksheet");
    await worksheet.locator("article:not([hidden])").waitFor();
    const next = worksheet.getByRole("button", { name: "Next page →" });
    // Turn the teacher's pages until the second step page (the second week part), checking the students each time.
    for (let stepPages = 0; ;) {
      const label = await shownPage(teacherPage);
      for (const page of students) {
        await page.waitForFunction((value) => document.querySelector("#classroom-worksheet article.worksheet-paper:not([hidden])")?.getAttribute("aria-label") === value, label);
        assert.equal(await page.locator("#classroom-worksheet").getAttribute("data-open"), "true");
        assert.equal(await page.locator("#classroom-worksheet").getByRole("button", { name: "Next page →" }).isDisabled(), true, "students cannot move on by themselves");
      }
      if (/Step \d+$/.test(label) && ++stepPages === 2) break;
      assert.equal(await next.isDisabled(), false, "the second step page exists");
      await next.click();
    }
    // The teacher is on the last step, which neither student has reached: it is shown to them, not locked.
    for (const page of students) assert.doesNotMatch(await page.locator("#classroom-worksheet article.worksheet-paper:not([hidden])").innerText(), /Complete the previous/);

    await worksheet.locator("article:not([hidden])").getByRole("button", { name: "Work in code editor", exact: true }).click();
    const footer = (page) => page.locator("footer.actionbar").filter({ hasText: "Return to class project" });
    await footer(teacherPage).getByRole("button", { name: "Stop sharing" }).waitFor();
    for (const page of students) {
      await page.waitForFunction(() => document.querySelector(".student-module-project .workspace-card-heading b")?.textContent?.startsWith("Class step"));
      assert.equal(await page.locator(".student-module-project").getByRole("textbox", { name: "Java source code editor", exact: true }).inputValue(), lastSample);
      assert.notEqual(await page.locator("#classroom-worksheet").getAttribute("data-open"), "true");
    }

    await teacherPage.locator(".team-header").getByRole("button", { name: "End session" }).click();
    await teacherPage.locator(".team-header").getByRole("button", { name: "End session" }).waitFor({ state: "detached" });
    for (const page of students) await page.locator(".student-module-project").waitFor({ state: "detached" });
    const { data } = await admin.from("classrooms").select("session_seen_at,shared_step_id").eq("id", classId).single();
    assert.deepEqual(data, { session_seen_at: null, shared_step_id: null });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    for (const id of classIds) await admin.from("classrooms").delete().eq("id", id);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
