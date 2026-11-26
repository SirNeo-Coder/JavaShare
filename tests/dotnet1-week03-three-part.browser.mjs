// .NET 1 Week 3 three-part file in real CodeShare. Week 3 has three pages; a step loads only its own pages, and the
// other tabs keep the student's earlier work (earlier own-task changes too). Only Steps 1 and 9 are media steps: with
// Week 3's media uploaded (Cloudflare's runtime on this laptop, port 8787, has local media storage) every step runs the
// sample, the guided example, then the guided code changed as Your task says, each checked by the app. Without media
// storage (offline and online settings on `next start`) Steps 1 and 9 are checked by the teacher, who marks them done;
// Steps 2-8 are still checked automatically. Local Supabase only. Env: WEEK3_BASE_URL (default http://localhost:8787),
// CODESHARE_PLAYWRIGHT_MODULE, PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { activityStateId, guidedStateId, teacherCheckedStep } from "../backend/src/module-activities.ts";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const config = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(config.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const week = fileURLToPath(new URL("../docs/modules/dotnet1/week03/", import.meta.url));
const content = JSON.parse(readFileSync(join(week, "DotNet1_Week_03.threepart.codeshare.json"), "utf8"));
// Standalone copy: no Week 2 prerequisite, its own id and title.
delete content.previousModuleId; content.id = `w3-three-${randomUUID().slice(0, 6)}`; content.title = `Week 3 three-part ${content.id.slice(-4)}`;
const answer = (folder, file) => readFileSync(join(week, "solutions", folder, file), "utf8");
const edits = JSON.parse(readFileSync(new URL("./fixtures/dotnet1-week03-three-part-edits.json", import.meta.url)));
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

test("Week 3 three-part in CodeShare: sample, guided example and own task on three pages", async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const baseURL = process.env.WEEK3_BASE_URL || "http://localhost:8787";
  const users = []; let classroomId;
  try {
    const password = randomUUID();
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `week3-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Week3 ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const teacher = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
    assert.equal((await teacher.request.post("/api/auth/login", { data: { email: users[0].email, password } })).status(), 200);
    const created = await teacher.request.post("/api/classes", { data: { subject: "Net MVC", name: `Week 3 three-part ${randomUUID().slice(0, 6)}` } });
    assert.equal(created.status(), 201); classroomId = (await created.json()).id;
    const uploaded = await teacher.request.post(`/api/classrooms/${classroomId}/modules`, { data: content });
    assert.equal(uploaded.status(), 201, await uploaded.text());
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);
    const status = (await teacher.request.get(`/api/classrooms/${classroomId}/modules/${content.id}/media`)).status();
    assert.ok(status === 200 || status === 503, `media list status ${status}`);
    const withMedia = status === 200;

    if (withMedia) await t.test("the teacher adds Week 3's media files once", async () => {
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
    const project = tab.locator(".student-module-project");
    const editor = project.getByRole("textbox", { name: "HTML source code editor", exact: true });
    const panel = tab.locator(".module-activity-details");
    const progress = async () => (await student.request.get(`/api/classrooms/${classroomId}/modules/${content.id}/progress`)).json();
    const showing = (value) => tab.waitForFunction((value) => document.querySelector(".student-module-project .editor-card textarea")?.value === value, value);
    const openTab = async (file) => { await project.locator(".file-tab", { hasText: file }).dispatchEvent("click"); };
    const run = async (message) => {
      await tab.getByRole("button", { name: /Run code/ }).click();
      await closePageWindow(tab);
      await tab.waitForFunction((message) => document.querySelector(".module-run-feedback")?.textContent.includes(message), message, { timeout: 60000 });
    };
    const openNext = async (step) => {
      await tab.goto("/"); await tab.locator(".classroom-workspace").waitFor();
      await tab.getByRole("button", { name: "Module", exact: true }).hover();
      await tab.locator("#classroom-modules .module-catalog-card").filter({ hasText: content.title }).getByRole("button").first().click();
      await project.locator(".file-tab", { hasText: step.run }).waitFor();
      await openTab(step.run);
      await showing(step.files.find((f) => f.path === step.run).content);
    };

    // What every page the step does not load should hold: the latest saved work. Code is saved only when a task completes,
    // so a step the teacher marks done (Steps 1 and 9 without media) leaves the earlier pages as they were.
    const latest = Object.fromEntries(content.starterFiles.map((f) => [f.path, f.content]));
    for (const step of steps) {
      const automatic = withMedia || !teacherCheckedStep(step);
      await t.test(`Step ${step.number}: ${automatic ? "sample, guided example, own task" : "checked by the teacher"}${withMedia ? " (media uploaded)" : ""}`, async () => {
        await openNext(step);
        // The pages this step does not load keep the student's earlier work.
        for (const [file, text] of Object.entries(latest)) {
          if (step.files.some((f) => f.path === file)) continue;
          assert.ok(await project.locator(".file-tab", { hasText: file }).count(), `${step.id}: ${file} is still a tab`);
          await openTab(file);
          await showing(text).catch(async () => assert.equal(await editor.inputValue(), text, `${step.id}: ${file} keeps the earlier work`));
        }
        await openTab(step.run); await showing(step.files.find((f) => f.path === step.run).content);
        if (!automatic) {
          await tab.getByRole("button", { name: /Run code/ }).click();
          await closePageWindow(tab);
          await tab.getByText("Checked by your teacher for now").first().waitFor();
          const sheet = await tab.locator("#classroom-worksheet").textContent();
          assert.ok(sheet.includes(`Look at line 8 of ${step.run}`), "the worksheet shows the discussion");
          assert.ok(sheet.includes(step.activity.guided.code.trim()), "the guided code is on the worksheet");
          assert.ok(!sheet.includes(step.activity.solution.note), "students never see the answer key");
          const marked = await teacher.request.put(`/api/classes/${classroomId}/students/${users[1].id}/modules/${encodeURIComponent(content.id)}/teacher-check`, { data: { stepId: step.id } });
          assert.equal(marked.status(), 200, await marked.text());
          return;
        }
        await run("Sample verified — now do the Guided example.");
        const shown = await panel.innerText();
        assert.match(shown, new RegExp(`Look at line \\d+ of ${step.run.replace(".", "\\.")}`)); assert.ok(!shown.includes(step.activity.solution.note), "students never see the answer key");
        await tab.waitForFunction(() => !document.querySelector(".student-module-project .editor-card textarea")?.readOnly);
        await editor.fill(answer(step.activity.id, step.run)); await run("Guided example not verified");
        await editor.fill(answer(step.id, step.run)); await run("Guided example verified — now do Your task on your own.");
        assert.equal((await progress()).stepStates[activityStateId(step)], undefined, "the guided example does not complete the step");
        await editor.fill(fromGuided(step, await editor.inputValue()));
        assert.equal(await editor.inputValue(), answer(step.activity.id, step.run));
        await run(step === steps.at(-1) ? "Completed" : "Completed — next activity unlocked");
        for (const f of step.files) latest[f.path] = f.path === step.run ? answer(step.activity.id, f.path) : f.content;
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
