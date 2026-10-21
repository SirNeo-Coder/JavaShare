// Real production app with disposable local accounts; no hosted services.
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const output = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(output.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((match) => [match[1], match[2]]));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
const baseURL = process.env.SUBJECT_BROWSER_URL || "http://localhost:3036";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(baseURL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const fixture = JSON.parse(readFileSync(new URL("./fixtures/sample-module.codeshare.json", import.meta.url)));

test("subject sharing browser: subject choice, existing upload sharing, subject isolation, corrections, deletion warning and offline Java", async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage(); page.setDefaultTimeout(15000);
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  const users = [], classes = [];
  const password = randomUUID(); let legacy, javaB, mvc;
  const check = async (response, status = 200) => { assert.equal(response.status(), status, await response.text()); return response.json(); };
  const login = async (user) => check(await context.request.post("/api/auth/login", { data: { email: user.email, password } }));
  const openClass = async (name) => {
    await page.goto("/");
    await page.locator(".class-summary").filter({ hasText: name }).getByRole("button", { name: "Open class", exact: true }).click();
    await page.getByRole("button", { name: "Curriculum", exact: true }).click();
  };
  try {
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `sharing-browser-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Sharing Browser ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const { data, error } = await admin.from("classrooms").insert({ name: "Existing upload class", subject: "Java", teacher_id: users[0].id, join_code: randomUUID().slice(0, 8).toUpperCase() }).select("id").single();
    assert.equal(error, null); legacy = data.id; classes.push(legacy);
    assert.equal((await admin.from("classroom_members").insert([{ classroom_id: legacy, user_id: users[0].id }, { classroom_id: legacy, user_id: users[1].id }])).error, null);
    assert.equal((await admin.from("course_modules").insert({ classroom_id: legacy, module_id: fixture.id, content: fixture, created_by: users[0].id })).error, null);
    await login(users[0]);
    await t.test("Create a class offers only Java and Net MVC, and Java classes share an existing upload", async () => {
      await page.goto("/"); await page.getByRole("button", { name: "Create a class", exact: true }).click();
      await page.getByLabel("Class name", { exact: true }).fill("Another Java class");
      assert.deepEqual(await page.getByRole("combobox").locator("option").allTextContents(), ["Choose a subject", "Java", "Net MVC"]);
      await page.getByRole("combobox").selectOption("Java");
      const created = page.waitForResponse((response) => response.url().endsWith("/api/classes") && response.request().method() === "POST");
      await page.getByRole("button", { name: "Create class", exact: true }).click();
      javaB = (await (await created).json()).id; classes.push(javaB);
      const createdMvc = await check(await context.request.post("/api/classes", { data: { name: "MVC only class", subject: "Net MVC" } }), 201);
      mvc = createdMvc.id; classes.push(mvc);
      await openClass("Existing upload class");
      await page.getByRole("heading", { name: "Choose this class’s subject" }).waitFor();
      assert.equal(await page.getByRole("button", { name: /Add module/ }).isDisabled(), true);
      await page.getByRole("button", { name: "Use Java for this class" }).click();
      await page.getByText("New Java classes receive the same set.", { exact: false }).waitFor();
      await page.getByText("Saved uploads from this class", { exact: true }).click();
      await page.getByRole("button", { name: "Share across Java classes" }).click();
      await page.locator(".teacher-module-card").filter({ hasText: fixture.title }).waitFor();
      await openClass("Another Java class");
      await page.locator(".teacher-module-card").filter({ hasText: fixture.title }).waitFor();
    });
    await t.test("uploading a correction updates both Java classes; Net MVC has its own module set", async () => {
      const correction = { ...fixture, title: "Shared Java browser correction" };
      await page.getByLabel("Upload module", { exact: true }).setInputFiles({ name: "correction.codeshare.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(correction)) });
      await page.locator(".teacher-module-card").filter({ hasText: correction.title }).waitFor();
      await openClass("Existing upload class");
      await page.locator(".teacher-module-card").filter({ hasText: correction.title }).waitFor();
      await openClass("MVC only class");
      await page.getByText("Net MVC modules", { exact: true }).waitFor();
      assert.equal(await page.locator(".teacher-module-card").count(), 0);
      const net = { ...fixture, id: "mvc-browser-module", course: "dotnet-2", title: "MVC browser module" };
      await page.getByLabel("Upload module", { exact: true }).setInputFiles({ name: "mvc.codeshare.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(net)) });
      await page.locator(".teacher-module-card").filter({ hasText: net.title }).waitFor();
      await openClass("Another Java class");
      assert.equal(await page.getByText(net.title, { exact: true }).count(), 0);
    });
    await t.test("a differing saved class copy asks before replacing the shared version", async () => {
      await openClass("Existing upload class");
      await page.getByText("Saved uploads from this class", { exact: true }).click();
      page.once("dialog", async (dialog) => { assert.match(dialog.message(), /ALL your Java classes/); await dialog.dismiss(); });
      await page.getByRole("button", { name: "Replace shared version" }).click();
      assert.equal((await check(await context.request.get(`/api/classrooms/${javaB}/modules`)))[0].title, "Shared Java browser correction");
    });
    await t.test("deletion waits for the sharing scope before offering a confirmation", async () => {
      let release;
      const gate = new Promise((resolve) => { release = resolve; });
      const heldRequests = [];
      const hold = (route) => { const continued = gate.then(() => route.continue()); heldRequests.push(continued); return continued; };
      await page.route("**/module-sharing", hold);
      try {
        await openClass("Another Java class");
        await page.locator(".teacher-module-card").waitFor();
        assert.equal(await page.getByRole("button", { name: "Delete module", exact: true }).isDisabled(), true);
      } finally { release(); await Promise.all(heldRequests); await page.unroute("**/module-sharing", hold); }
      await page.waitForFunction(() => [...document.querySelectorAll("button")].some((button) => button.textContent === "Delete module" && !button.disabled));
    });
    await t.test("shared deletion warns about all Java classes and Cancel keeps the module", async () => {
      await page.getByRole("button", { name: "Delete module", exact: true }).click();
      const dialog = page.getByRole("dialog"); await dialog.waitFor();
      assert.match(await dialog.innerText(), /all your Java classes/);
      await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
      assert.equal(await page.locator(".teacher-module-card").count(), 1);
    });
    await t.test("student opens the shared module and runs its sample using laptop Java with no external requests", async () => {
      await login(users[1]); await page.goto("/");
      await page.locator(".classroom-workspace").waitFor();
      const external = [];
      await page.route("**/*", async (route) => {
        const url = new URL(route.request().url());
        if (!["localhost", "127.0.0.1"].includes(url.hostname)) { external.push(url.origin); await route.abort(); } else await route.continue();
      });
      await page.getByRole("button", { name: "Module", exact: true }).hover();
      await page.locator("#classroom-modules .module-catalog-card").filter({ hasText: "Shared Java browser correction" }).getByRole("button").first().click();
      const worksheet = page.locator("#classroom-worksheet");
      await worksheet.getByRole("button", { name: "Close module worksheet", exact: true }).click();
      await page.getByRole("textbox", { name: "Java source code editor", exact: true }).waitFor();
      await page.locator(".module-activity-console").waitFor();
      const saved = page.waitForResponse((response) => response.url().endsWith("/progress/project") && response.request().method() === "PUT");
      const ran = page.waitForResponse((response) => response.url().endsWith("/progress/run"));
      await page.getByRole("button", { name: /Run code/ }).click();
      await check(await saved);
      const result = await check(await ran);
      assert.equal(result.passed, true, JSON.stringify(result));
      await page.getByText("Actual output", { exact: true }).waitFor();
      assert.equal((await page.getByLabel("Program output", { exact: true }).innerText()).trim(), "1\n2\n3");
      const progress = await check(await context.request.get(`/api/classrooms/${legacy}/modules/${fixture.id}/progress`));
      assert.equal(progress.stepStates[fixture.lessons[0].blocks[0].id], "pass");
      assert.deepEqual(external, []); assert.equal(await page.locator("iframe[data-java-runner]").count(), 0);
    });
    assert.deepEqual(errors, []);
  } catch (error) { console.log((await page.locator("body").innerText()).slice(-5000)); throw error; } finally {
    await browser.close();
    for (const id of classes) assert.equal((await admin.from("classrooms").delete().eq("id", id)).error, null);
    for (const user of users) assert.equal((await admin.auth.admin.deleteUser(user.id)).error, null);
  }
});
