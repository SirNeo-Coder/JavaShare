// Real local production browser check of the guided example (teacher, 2026-11-15). No hosted data.
// Offline: app on 3022 with LOCAL_JAVA_EXECUTION=true and CODESHARE_LAPTOP=true. Online: app on 3020 with
// JAVA_RUNNER_URL=http://localhost:3021/ and java-runtime/public served on 3021. Local Supabase.
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
const content = JSON.parse(readFileSync(new URL("../docs/modules/week14/Java2_Week_14.codeshare.json", import.meta.url)));
const edits = JSON.parse(readFileSync(new URL("./fixtures/week14-task-edits.json", import.meta.url)));
delete content.previousModuleId;
content.id = "java-2-w14-guided-browser";
const steps = content.lessons.flatMap((l) => l.blocks).filter((b) => b.type === "step");
const first = steps[0], second = steps[1];
const sample = first.files.find((f) => f.path === "Main.java").content;
const task = edits[first.id].reduce((source, edit) => source.replace(edit.from, edit.to), sample);
const guidedCode = task.replace("fleet.remove(3);", "fleet.remove(2);");
// Real laptop javac output of guidedCode (2026-11-15).
const guidedOutput = "Vehicles in fleet: 4\nFirst vehicle: NXA 123\nAfter removal: 3\nNXA 123 | Driver: Mang Ramon | Passengers: 0/20\nTRC 456 | Driver: Kuya Ben | Passengers: 0/4\nNYB 321 | Driver: Mang Tonyo | Passengers: 0/20\nNo vehicle at index 5.";
first.activity.guided = { discussion: "Look at line 1. GUIDED-DISCUSSION-MARKER", instruction: "Remove index 2 and change the message, then run.",
  code: "fleet.remove(2);", expectedOutput: guidedOutput };

for (const mode of (process.env.GUIDED_BROWSER_MODE ? [process.env.GUIDED_BROWSER_MODE] : ["offline", "online"])) test(`guided example ${mode}: worksheet order and line numbers, then sample, guided and own task in the real editor`, async (t) => {
  const baseURL = mode === "offline" ? "http://localhost:3022" : "http://localhost:3020";
  // Online the guided pass stays on this device until the own task's completion is sent (like the sample).
  const savedOnServer = mode === "offline" ? "pass" : undefined;
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const users = []; let classroomId;
  try {
    const password = randomUUID();
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `guided-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Guided ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const context = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
    assert.equal((await context.request.post("/api/auth/login", { data: { email: users[0].email, password } })).status(), 200);
    const created = await context.request.post("/api/classes", { data: { subject: "Java", name: "Guided example verification" } });
    assert.equal(created.status(), 201); classroomId = (await created.json()).id;
    const uploaded = await context.request.post(`/api/classrooms/${classroomId}/modules`, { data: content });
    assert.equal(uploaded.status(), 201, await uploaded.text());
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);
    assert.equal((await context.request.post("/api/auth/login", { data: { email: users[1].email, password } })).status(), 200);
    const page = await context.newPage(); page.setDefaultTimeout(12000);
    const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/"); await page.locator(".classroom-workspace").waitFor();
    const worksheet = page.locator("#classroom-worksheet");
    const editor = page.getByRole("textbox", { name: "Java source code editor", exact: true });
    const panel = page.locator(".module-activity-details");
    const progressPath = `/api/classrooms/${classroomId}/modules/${content.id}/progress`;
    const run = async (message) => {
      if (mode === "offline") await page.waitForTimeout(1600);
      await page.getByRole("button", { name: /Run code/ }).click();
      await page.waitForFunction((message) => document.querySelector(".module-run-feedback")?.textContent.includes(message), message, { timeout: mode === "online" ? 180000 : 30000 });
    };
    await page.locator('.workspace-rail button[aria-controls="classroom-modules"]').hover();
    await page.locator("#classroom-modules .module-catalog-card").first().getByRole("button").first().click();
    await worksheet.locator(".worksheet-paper:not([hidden])").waitFor();
    await page.mouse.move(1100, 20);
    await page.getByRole("button", { name: "Module", exact: true }).hover();
    await worksheet.getByRole("button", { name: new RegExp(`Step ${first.number}$`) }).click();

    await t.test("the worksheet numbers the sample lines and shows the discussion and guided code between sample output and Your task", async () => {
      const step = worksheet.locator(".module-step").first();
      const numbered = step.locator(".printed-sample .numbered-code").first();
      assert.equal(await numbered.locator("span").count(), sample.split("\n").length, "one number per line, as the code editor counts");
      assert.equal(await numbered.evaluate((el) => getComputedStyle(el.querySelector("span"), "::before").content), "counter(line)");
      const text = await step.innerText();
      const at = (label) => { const i = text.indexOf(label); assert.ok(i >= 0, `${label} is shown`); return i; };
      assert.ok(at("Sample output") < at("GUIDED-DISCUSSION-MARKER"));
      assert.ok(at("GUIDED-DISCUSSION-MARKER") < at("Guided example"));
      assert.ok(at("Guided example") < at("fleet.remove(2);"));
      assert.ok(at("Expected guided output") < at("Your task"));
      assert.ok(!text.includes("Answer key"), "students never see the answer key panel");
      // The guided code sits in the same box as Sample code, not in the single-word highlight (CKB-124).
      const guidedCode = step.locator(".module-guided .printed-sample pre code");
      assert.equal(await guidedCode.count(), 1, "the guided code is boxed like Sample code");
      assert.equal(await guidedCode.evaluate((el) => getComputedStyle(el).backgroundColor), "rgba(0, 0, 0, 0)", "no grey highlight behind the guided code");
      await page.screenshot({ path: `/tmp/guided-worksheet-${mode}.png`, fullPage: false });
    });

    await t.test("sample verified opens the guided example; the own task's code cannot pass it", async () => {
      const opening = page.waitForResponse((response) => response.url().includes("/progress/activity?stepId=") && response.request().method() === "GET");
      await worksheet.getByRole("button", { name: "Work in code editor", exact: true }).click();
      assert.equal((await opening).status(), 200);
      await page.locator(".student-module-project").waitFor();
      await page.waitForFunction((expected) => document.querySelector('textarea[aria-label="Java source code editor"]')?.value === expected, sample);
      assert.equal(await editor.getAttribute("readonly"), "");
      assert.ok(!(await panel.innerText()).includes("GUIDED-DISCUSSION-MARKER"), "the editor shows the discussion only after Sample verified");
      await run("Sample verified — now do the Guided example.");
      assert.equal(await editor.getAttribute("readonly"), null);
      const shown = await panel.innerText();
      assert.match(shown, /Guided example/); assert.match(shown, /GUIDED-DISCUSSION-MARKER/); assert.match(shown, /Expected guided output/);
      await editor.fill(task); await run("Guided example not verified");
      const p = await (await context.request.get(progressPath)).json();
      assert.equal(p.stepStates[guidedStateId(first)], undefined); assert.equal(p.stepStates[activityStateId(first)], undefined);
    });

    await t.test("guided verified keeps the code, saves guided only and keeps the next step locked", async () => {
      await editor.fill(guidedCode); await run("Guided example verified — now do Your task on your own.");
      assert.equal(await editor.inputValue(), guidedCode, "the student's code stays in the editor");
      const p = await (await context.request.get(progressPath)).json();
      assert.equal(p.stepStates[guidedStateId(first)], savedOnServer);
      assert.equal(p.stepStates[activityStateId(first)], undefined, "a guided pass is not Completed");
      assert.equal((await context.request.post(`${progressPath}/activity`, { data: { stepId: second.id } })).status(), 403);
      assert.match(await panel.innerText(), /Your task/);
      await page.screenshot({ path: `/tmp/guided-verified-${mode}.png`, fullPage: false });
    });

    await t.test("rerunning the guided code says so; the own task completes and opens the next step", async () => {
      await run("Still showing the guided example output");
      await editor.fill(task); await run("Completed — next activity unlocked");
      const p = await (await context.request.get(progressPath)).json();
      assert.equal(p.stepStates[activityStateId(first)], "pass"); assert.equal(p.stepStates[guidedStateId(first)], "pass");
      assert.equal((await context.request.post(`${progressPath}/activity`, { data: { stepId: second.id } })).status(), 200);
    });
    assert.deepEqual(errors, []);
    await context.close();
  } finally {
    await browser.close();
    if (classroomId) await admin.from("classrooms").delete().eq("id", classroomId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
