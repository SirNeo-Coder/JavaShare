// .NET 1 Week 2 three-part file in real CodeShare. Week 2's steps are media steps: with its media uploaded (Cloudflare's
// runtime on this laptop, port 8787, has local media storage) a student runs every sample, the guided example, then
// changes that guided code as Your task says, each checked by the app. Without media storage (offline classroom
// settings) every step is checked by the teacher: the student still sees the discussion and guided example.
// Local Supabase only. Env: WEEK2_BASE_URL (default http://localhost:8787), CODESHARE_PLAYWRIGHT_MODULE,
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { activityStateId, guidedStateId } from "../backend/src/module-activities.ts";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const config = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(config.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const week = fileURLToPath(new URL("../docs/modules/dotnet1/week02/", import.meta.url));
const content = JSON.parse(readFileSync(join(week, "DotNet1_Week_02.threepart.codeshare.json"), "utf8"));
// Standalone copy: no Week 1 prerequisite, its own id and title.
delete content.previousModuleId; content.id = `w2-three-${randomUUID().slice(0, 6)}`; content.title = `Week 2 three-part ${content.id.slice(-4)}`;
const answer = (folder) => readFileSync(join(week, "solutions", folder, "index.html"), "utf8");
const edits = JSON.parse(readFileSync(new URL("./fixtures/dotnet1-week02-three-part-edits.json", import.meta.url)));
const fromGuided = (step, text) => edits[step.id].fromGuided.reduce((code, edit) => { assert.ok(code.includes(edit.from), `${step.id}: ${edit.from}`); return code.replace(edit.from, edit.to); }, text);
const steps = content.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "step");
const mediaRoot = join(week, "project_end");
const mediaFiles = ["images", "audio", "video"].flatMap((kind) => existsSync(join(mediaRoot, kind)) ? readdirSync(join(mediaRoot, kind)).map((name) => `${kind}/${name}`) : []);

const closePageWindow = async (where) => {
  const close = where.locator(".page-window").getByRole("button", { name: "Close", exact: true });
  await close.waitFor();
  await where.waitForFunction(() => document.querySelector(".page-window header button")?.disabled === false, null, { timeout: 60000 });
  await close.click();
  await where.locator(".page-window").waitFor({ state: "detached" });
};

test("Week 2 three-part in CodeShare: sample, guided example and own task on media steps", async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const baseURL = process.env.WEEK2_BASE_URL || "http://localhost:8787";
  const users = []; let classroomId;
  try {
    const password = randomUUID();
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `week2-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Week2 ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const teacher = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
    assert.equal((await teacher.request.post("/api/auth/login", { data: { email: users[0].email, password } })).status(), 200);
    const created = await teacher.request.post("/api/classes", { data: { subject: "Net MVC", name: `Week 2 three-part ${randomUUID().slice(0, 6)}` } });
    assert.equal(created.status(), 201); classroomId = (await created.json()).id;
    const uploaded = await teacher.request.post(`/api/classrooms/${classroomId}/modules`, { data: content });
    assert.equal(uploaded.status(), 201, await uploaded.text());
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);
    const status = (await teacher.request.get(`/api/classrooms/${classroomId}/modules/${content.id}/media`)).status();
    assert.ok(status === 200 || status === 503, `media list status ${status}`);
    const withMedia = status === 200;

    if (withMedia) await t.test("the teacher adds Week 2's media files once", async () => {
      const details = await teacher.newPage(); details.setDefaultTimeout(30000);
      await details.goto("/");
      await details.getByRole("button", { name: /Open class/ }).click();
      await details.getByRole("navigation", { name: "Teacher class navigation" }).getByRole("button", { name: /Curriculum/ }).click();
      await details.locator(".teacher-module-card", { hasText: content.title }).getByRole("button", { name: /View module details/ }).click();
      const section = details.getByRole("region", { name: "Media files" });
      await section.getByLabel("Add media files").setInputFiles(mediaFiles.map((path) => join(mediaRoot, path)));
      await section.locator("li").nth(mediaFiles.length - 1).waitFor();
      await details.close();
    });

    const student = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
    assert.equal((await student.request.post("/api/auth/login", { data: { email: users[1].email, password } })).status(), 200);
    const tab = await student.newPage(); tab.setDefaultTimeout(30000);
    const errors = []; tab.on("pageerror", (e) => errors.push(e.message));
    const editor = tab.locator(".student-module-project").getByRole("textbox", { name: "HTML source code editor", exact: true });
    const panel = tab.locator(".module-activity-details");
    const progress = async () => (await student.request.get(`/api/classrooms/${classroomId}/modules/${content.id}/progress`)).json();
    const run = async (message) => {
      await tab.getByRole("button", { name: /Run code/ }).click();
      await closePageWindow(tab);
      await tab.waitForFunction((message) => document.querySelector(".module-run-feedback")?.textContent.includes(message), message, { timeout: 60000 });
    };
    const openNext = async (step) => {
      await tab.goto("/"); await tab.locator(".classroom-workspace").waitFor();
      await tab.getByRole("button", { name: "Module", exact: true }).hover();
      await tab.locator("#classroom-modules .module-catalog-card").filter({ hasText: content.title }).getByRole("button").first().click();
      await tab.waitForFunction((value) => document.querySelector(".student-module-project .editor-card textarea")?.value === value, step.files[0].content);
    };

    if (!withMedia) {
      await t.test("offline (no media storage): Step 1 is checked by the teacher; the worksheet shows the discussion and guided example", async () => {
        await openNext(steps[0]);
        const runFor = async (status) => {
          await tab.getByRole("button", { name: /Run code/ }).click();
          await closePageWindow(tab);
          await tab.locator(".sync", { hasText: status }).first().waitFor({ timeout: 60000 });
        };
        // The unchanged sample and the guided example are checked by page text, so the editor opens (CKB-147).
        await runFor("Sample verified on this device");
        await tab.waitForFunction(() => !document.querySelector(".student-module-project .editor-card textarea")?.readOnly);
        await editor.fill(answer(steps[0].id)); await runFor("Guided example verified on this device");
        await editor.fill(fromGuided(steps[0], await editor.inputValue())); await runFor("Checked by your teacher for now");
        assert.equal((await progress()).stepStates[activityStateId(steps[0])], undefined, "only the teacher marks the task done");
        const sheet = await tab.locator("#classroom-worksheet .module-step").first().textContent();
        assert.match(sheet, /Look at line 9/); assert.ok(sheet.includes(steps[0].activity.guided.code.trim()), "the guided code is on the worksheet");
        assert.ok(!sheet.includes(steps[0].activity.solution.note), "students never see the answer key");
      });
      return;
    }

    for (const step of steps) {
      await t.test(`Step ${step.number}: sample, guided example, own task (media uploaded)`, async () => {
        await openNext(step);
        await run("Sample verified — now do the Guided example.");
        const shown = await panel.innerText();
        assert.match(shown, /Look at line/); assert.ok(!shown.includes(step.activity.solution.note), "students never see the answer key");
        await tab.waitForFunction(() => !document.querySelector(".student-module-project .editor-card textarea")?.readOnly);
        await editor.fill(answer(step.activity.id)); await run("Guided example not verified");
        await editor.fill(answer(step.id)); await run("Guided example verified — now do Your task on your own.");
        assert.equal((await progress()).stepStates[activityStateId(step)], undefined, "the guided example does not complete the step");
        await editor.fill(fromGuided(step, await editor.inputValue()));
        await run(step === steps.at(-1) ? "Completed" : "Completed — next activity unlocked");
        const saved = await progress();
        assert.equal(saved.stepStates[activityStateId(step)], "pass"); assert.equal(saved.stepStates[guidedStateId(step)], "pass");
      });
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    if (classroomId) await admin.from("classrooms").delete().eq("id", classroomId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
