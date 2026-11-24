// .NET 1 Week 1 three-part file in real CodeShare: a student runs every step's sample unchanged, types the guided
// example, then changes that guided code as Your task says; each run is checked by the app in the page window. Run it twice: offline
// classroom settings (LOCAL_JAVA_EXECUTION=true, CODESHARE_LAPTOP=true) and online settings (no laptop runner).
// Local Supabase only. Env: WEEK1_BASE_URL (default http://localhost:3072), CODESHARE_PLAYWRIGHT_MODULE,
// PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { activityStateId, guidedStateId } from "../backend/src/module-activities.ts";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const config = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(config.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const content = JSON.parse(readFileSync(new URL("../docs/modules/dotnet1/week01/DotNet1_Week_01.threepart.codeshare.json", import.meta.url)));
const answer = (folder) => readFileSync(new URL(`../docs/modules/dotnet1/week01/solutions/${folder}/index.html`, import.meta.url), "utf8");
const steps = content.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "step");
// Your task starts from the guided code still in the editor (teacher, 2026-11-24): the student changes those lines.
const edits = JSON.parse(readFileSync(new URL("./fixtures/dotnet1-week01-three-part-edits.json", import.meta.url)));
const fromGuided = (step, text) => edits[step.id].fromGuided.reduce((code, edit) => { assert.ok(code.includes(edit.from), `${step.id}: ${edit.from}`); return code.replace(edit.from, edit.to); }, text);

const closePageWindow = async (where) => {
  const close = where.locator(".page-window").getByRole("button", { name: "Close", exact: true });
  await close.waitFor();
  await where.waitForFunction(() => document.querySelector(".page-window header button")?.disabled === false);
  await close.click();
  await where.locator(".page-window").waitFor({ state: "detached" });
};

test("Week 1 three-part in CodeShare: every sample, guided example and own task passes in order", async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const baseURL = process.env.WEEK1_BASE_URL || "http://localhost:3072";
  const users = []; let classroomId;
  try {
    const password = randomUUID();
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `week1-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Week1 ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const teacher = await browser.newContext({ baseURL });
    assert.equal((await teacher.request.post("/api/auth/login", { data: { email: users[0].email, password } })).status(), 200);
    const created = await teacher.request.post("/api/classes", { data: { subject: "Net MVC", name: `Week 1 three-part ${randomUUID().slice(0, 6)}` } });
    assert.equal(created.status(), 201); classroomId = (await created.json()).id;
    const uploaded = await teacher.request.post(`/api/classrooms/${classroomId}/modules`, { data: content });
    assert.equal(uploaded.status(), 201, await uploaded.text());
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);

    const student = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
    assert.equal((await student.request.post("/api/auth/login", { data: { email: users[1].email, password } })).status(), 200);
    const tab = await student.newPage(); tab.setDefaultTimeout(20000);
    const errors = []; tab.on("pageerror", (e) => errors.push(e.message));
    const editor = tab.locator(".student-module-project").getByRole("textbox", { name: "HTML source code editor", exact: true });
    const panel = tab.locator(".module-activity-details");
    const progress = async () => (await student.request.get(`/api/classrooms/${classroomId}/modules/${content.id}/progress`)).json();
    const run = async (message) => {
      await tab.getByRole("button", { name: /Run code/ }).click();
      await closePageWindow(tab);
      await tab.waitForFunction((message) => document.querySelector(".module-run-feedback")?.textContent.includes(message), message);
    };
    // Choosing the module opens its next unfinished step (module resume).
    const openNext = async (step) => {
      await tab.goto("/"); await tab.locator(".classroom-workspace").waitFor();
      await tab.getByRole("button", { name: "Module", exact: true }).hover();
      await tab.locator("#classroom-modules .module-catalog-card").filter({ hasText: content.title.replace(/^Self-Paced Module:\s*/, "") }).getByRole("button").first().click();
      await tab.waitForFunction((value) => document.querySelector(".student-module-project .editor-card textarea")?.value === value, step.files[0].content);
    };

    for (const step of steps) {
      await t.test(`Step ${step.number}: sample, guided example, own task`, async () => {
        await openNext(step);
        await run("Sample verified — now do the Guided example.");
        const shown = await panel.innerText();
        assert.match(shown, /Look at line/); assert.ok(shown.includes(step.activity.guided.code.split("\n")[0].trim()), "the guided code is shown");
        assert.ok(!shown.includes("Answer key") && !shown.includes(step.activity.solution.note), "students never see the answer key");
        await tab.waitForFunction(() => !document.querySelector(".student-module-project .editor-card textarea")?.readOnly);
        await editor.fill(answer(step.activity.id)); await run("Guided example not verified");
        await editor.fill(answer(step.id)); await run("Guided example verified — now do Your task on your own.");
        assert.equal((await progress()).stepStates[activityStateId(step)], undefined, "the guided example does not complete the step");
        await run("Still showing the guided example output");
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
