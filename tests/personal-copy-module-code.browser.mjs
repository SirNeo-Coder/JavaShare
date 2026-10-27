// Disposable local class; the real personal project page. Run against the laptop's network address
// (COPY_CODE_BASE_URL=http://<laptop-ip>:<port>) to check the plain-http classroom copy path.
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
const baseURL = process.env.COPY_CODE_BASE_URL || "http://localhost:3032";
const own = "// my coffee shop project\n";
const sample = fixture.performanceTask.exampleFiles[0].content;

async function run(content, check) {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const users = []; let classId;
  try {
    const password = randomUUID();
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `copy-code-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Copy ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const teacher = await browser.newContext({ baseURL });
    const student = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
    assert.equal((await teacher.request.post("/api/auth/login", { data: { email: users[0].email, password } })).status(), 200);
    const created = await teacher.request.post("/api/classes", { data: { name: "Copy module code browser test", subject: "Java" } });
    assert.equal(created.status(), 201, await created.text()); classId = (await created.json()).id;
    assert.equal((await teacher.request.post(`/api/classrooms/${classId}/modules`, { data: content })).status(), 201);
    await admin.from("classroom_members").insert({ classroom_id: classId, user_id: users[1].id });
    await admin.from("module_progress").insert({ classroom_id: classId, student_id: users[1].id, module_id: fixture.id,
      step_states: Object.fromEntries(fixture.lessons.flatMap((l) => l.blocks).filter((b) => b.type === "step").map((b) => [b.id, "pass"])),
      project_files: [], performance_task: { project: { files: [{ path: "CoffeeShop.java", content: own }] } } });
    assert.equal((await student.request.post("/api/auth/login", { data: { email: users[1].email, password } })).status(), 200);

    const page = await student.newPage(); page.setDefaultTimeout(20000);
    const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/"); await page.locator(".classroom-workspace").waitFor();
    await page.getByRole("button", { name: "Projects", exact: true }).hover();
    await page.locator("#classroom-projects").getByRole("button", { name: "Choose module" }).click();
    await page.locator("#classroom-modules .module-catalog-card").filter({ hasText: fixture.title }).getByRole("button").first().click();
    await page.locator("#classroom-worksheet").getByRole("button", { name: "Work on performance task" }).click();
    const editor = page.getByRole("textbox", { name: "Java source code editor", exact: true });
    await page.waitForFunction((value) => document.querySelector('textarea[aria-label="Java source code editor"]')?.value === value, own);

    // Plain http on a network address is not a secure context, so this exercises the classroom copy path.
    const secure = await page.evaluate(() => { document.addEventListener("copy", () => { window.copiedText = String(document.getSelection()); }); return window.isSecureContext; });
    if (!["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname)) assert.equal(secure, false);
    await check(page, secure);

    await editor.click(); await page.keyboard.press("Control+A"); await page.keyboard.press("Control+V");
    assert.equal(await editor.inputValue(), sample);
    const tabs = await page.locator('[aria-label="Personal project files"] .file-tab').allTextContents();
    assert.deepEqual(tabs, ["CoffeeShop.java"]);
    await page.getByText("Unsaved changes — click Save work").waitFor();
    if (process.env.COPY_CODE_SCREENSHOT) await page.screenshot({ path: process.env.COPY_CODE_SCREENSHOT });

    const progress = await (await student.request.get(`/api/classrooms/${classId}/modules/${fixture.id}/progress`)).json();
    assert.deepEqual(progress.performanceProjectFiles, [{ path: "CoffeeShop.java", content: own }]);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    if (classId) await admin.from("classrooms").delete().eq("id", classId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
}

test("personal project: Copy code copies only module code and leaves the student's own files alone", () => run(fixture, async (page, secure) => {
  await page.getByText("Code from this module", { exact: true }).click();
  const entry = page.locator(".module-before-sample div").filter({ hasText: "Sample code · Main.java" });
  await entry.getByRole("button", { name: "Copy code" }).click();
  await entry.getByRole("button", { name: "Copied" }).waitFor();
  if (!secure) assert.equal(await page.evaluate(() => window.copiedText), sample);
}));

test("personal project with steps: each step copies the sample it names; the Console list is gone", () => {
  const withSteps = structuredClone(fixture);
  withSteps.performanceTask.steps = ["Plan your own theme", "Copy **Sample code · Main.java** and change it for your project"];
  return run(withSteps, async (page, secure) => {
    const steps = page.locator(".module-activity-details").getByRole("region", { name: "Performance task steps" });
    await steps.waitFor();
    assert.equal(await page.getByText("Code from this module", { exact: true }).count(), 0);
    assert.equal(await steps.locator("li").first().getByRole("button").count(), 0);
    await steps.getByRole("button", { name: "Copy Sample code · Main.java" }).click();
    await steps.getByRole("button", { name: "Copied" }).waitFor();
    if (!secure) assert.equal(await page.evaluate(() => window.copiedText), sample);
    if (process.env.COPY_CODE_STEPS_SCREENSHOT) await page.locator(".module-activity-details").screenshot({ path: process.env.COPY_CODE_STEPS_SCREENSHOT });
  });
});
