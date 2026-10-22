// Local production app with disposable local Supabase accounts; upstream errors are simulated.
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const baseURL = process.env.CODESHARE_BROWSER_URL || "http://localhost:3034";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname));
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const raw = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(raw.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });

test("API client browser: service errors, recovery and session expiry in the offline classroom", async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const users = [];
  let classroomId;
  try {
    const password = randomUUID();
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `api-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `API ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const context = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1000 } });
    const login = async (user) => assert.equal((await context.request.post("/api/auth/login", { data: { email: user.email, password } })).status(), 200);
    await login(users[0]);
    const created = await context.request.post("/api/classes", { data: { subject: "Java", name: "Disposable API error checks" } });
    assert.equal(created.status(), 201); classroomId = (await created.json()).id;
    const fixture = JSON.parse(readFileSync(new URL("./fixtures/sample-module.codeshare.json", import.meta.url)));
    assert.equal((await context.request.post(`/api/classrooms/${classroomId}/modules`, { data: fixture })).status(), 201);
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);
    await login(users[1]);
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    const errors = []; page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/"); await page.locator(".classroom-workspace").waitFor();
    const editor = page.getByRole("textbox", { name: "Java source code editor", exact: true });
    const modulePath = `/api/classrooms/${classroomId}/modules/${fixture.id}`;
    const catalog = page.locator("#classroom-modules");
    const moduleButton = catalog.locator(".module-catalog-card").filter({ hasText: fixture.title }).getByRole("button").first();

    await t.test("HTML 503 shows its status in Modules and preserves unsaved code", async () => {
      const draft = `${await editor.inputValue()}\n// Unsaved API error check`;
      await editor.fill(draft);
      await page.route(`**${modulePath}`, (route) => route.fulfill({ status: 503, contentType: "text/html", body: "<!DOCTYPE html><html>Service Unavailable</html>" }), { times: 1 });
      await page.getByRole("button", { name: "Module", exact: true }).click();
      await moduleButton.click();
      await catalog.getByText("CodeShare could not complete the request (503). Please try again.", { exact: true }).waitFor();
      assert.equal(await editor.inputValue(), draft);
      assert.doesNotMatch(await catalog.textContent(), /Unexpected token|DOCTYPE/);
    });

    await t.test("retry opens the module and real offline Java completes its sample", async () => {
      await moduleButton.click();
      await page.locator("#classroom-worksheet article:not([hidden])").waitFor();
      await page.getByRole("button", { name: "Module", exact: true }).click();
      assert.equal(await editor.inputValue(), fixture.lessons[0].blocks[0].files[0].content);
      assert.deepEqual(await (await context.request.get("/api/java-runner")).json(), { mode: "local" });
      await page.getByRole("button", { name: /Run code/ }).click();
      await page.waitForFunction(() => document.querySelector(".module-run-feedback")?.textContent.includes("Completed"), null, { timeout: 30000 });
      const progress = await (await context.request.get(`${modulePath}/progress`)).json();
      assert.equal(progress.stepStates[fixture.lessons[0].blocks[0].id], "pass");
      assert.equal(await page.locator("iframe").count(), 0);
    });

    await t.test("HTML 401 on a protected request returns the classroom to Sign in", async () => {
      await page.route(`**/api/classrooms/${classroomId}/modules/summary`, (route) => route.fulfill({ status: 401, contentType: "text/html", body: "<!DOCTYPE html>Unauthorized" }));
      await page.getByRole("button", { name: "Modules", exact: true }).click();
      await page.getByRole("button", { name: "Sign in", exact: true }).waitFor();
      assert.equal(await page.locator(".classroom-workspace").count(), 0);
      assert.deepEqual(errors, []);
    });
  } finally {
    await browser.close();
    if (classroomId) assert.equal((await admin.from("classrooms").delete().eq("id", classroomId)).error, null);
    for (const user of users) assert.equal((await admin.auth.admin.deleteUser(user.id)).error, null);
  }
});
