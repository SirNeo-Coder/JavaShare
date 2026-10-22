// Real local production apps: online 3030, separate runner 3031, offline 3032.
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";

const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const output = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(output.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
assert.ok(["127.0.0.1", "localhost"].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const fixture = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url), "utf8"));
fixture.id = "java-progress-check"; fixture.starterFiles = []; fixture.lessons = fixture.lessons.slice(0, 1);
fixture.lessons[0].blocks[0].files = [{ path: "Main.java", content: 'public class Main { public static void main(String[] args) throws Exception { Thread.sleep(300); System.out.println("Java status check"); } }' }];
fixture.lessons[0].blocks[0].expectedOutput = "Java status check";
fixture.performanceTask.starterFiles = [{ path: "Main.java", content: 'import java.util.Scanner; public class Main { public static void main(String[] args) { System.out.println("Name?"); System.out.println("Hello " + new Scanner(System.in).nextLine()); } }' }];

for (const mode of ["offline", "online"]) {
  test(`Java progress ${mode}: real module, personal and classroom Console statuses`, { timeout: 300000 }, async (t) => {
    const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
    const users = [], gates = [];
    let classroomId;
    try {
      const password = randomUUID();
      for (const role of ["teacher", "student"]) {
        const { data, error } = await admin.auth.admin.createUser({ email: `progress-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Progress ${role}` } });
        assert.equal(error, null); users.push(data.user);
        assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
      }
      const context = await browser.newContext({ baseURL: mode === "offline" ? "http://localhost:3032" : "http://localhost:3030", viewport: { width: 1500, height: 1050 }, reducedMotion: "no-preference" });
      assert.equal((await context.request.post("/api/auth/login", { data: { email: users[0].email, password } })).status(), 200);
      const created = await context.request.post("/api/classes", { data: { subject: "Java", name: `Java progress ${mode}` } });
      assert.equal(created.status(), 201); classroomId = (await created.json()).id;
      assert.equal((await context.request.post(`/api/classrooms/${classroomId}/modules`, { data: fixture })).status(), 201);
      assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);
      assert.equal((await context.request.post("/api/auth/login", { data: { email: users[1].email, password } })).status(), 200);
      const page = await context.newPage(); page.setDefaultTimeout(180000);
      await page.goto("/"); await page.locator(".classroom-workspace").waitFor();
      await page.locator('.workspace-rail button[aria-controls="classroom-modules"]').click();
      await page.locator("#classroom-modules .module-catalog-card").first().getByRole("button").first().click();
      await page.locator(".student-module-project").waitFor();
      await page.getByRole("button", { name: "Close module worksheet", exact: true }).click();
      const indicator = page.locator(".java-run-progress");
      const consoleOutput = page.getByLabel("Program output", { exact: true });
      const runButton = () => page.getByRole("button", { name: /Run code/ });
      const idle = () => page.waitForFunction(() => !document.querySelector(".java-run-progress") && !document.querySelector('.student-module-project [aria-label="Java source code editor"]')?.readOnly);
      const hold = async (pattern) => {
        let release, reached;
        const wait = new Promise((resolve) => { release = resolve; });
        const seen = new Promise((resolve) => { reached = resolve; });
        await page.route(pattern, async (route) => { reached(); await wait; await route.continue(); }, { times: 1 });
        gates.push(release); return { release, seen };
      };

      await t.test("shows saving and startup immediately, checking until the actual result, and honors reduced motion", async () => {
        assert.equal(await indicator.count(), 0);
        const save = await hold("**/progress/project"), config = await hold("**/api/java-runner");
        const result = await hold(`**/progress/${mode === "offline" ? "run" : "browser-result"}`);
        await runButton().click();
        await save.seen; assert.match(await indicator.textContent(), /Saving your code/);
        save.release(); await config.seen;
        assert.match(await indicator.textContent(), /Java is loading or running/);
        assert.equal(await page.locator(".console[aria-busy='true']").count(), 1);
        assert.equal(await indicator.locator(".java-run-spinner").evaluate((el) => getComputedStyle(el).animationName), "java-run-spin");
        await page.screenshot({ path: `/tmp/java-progress-${mode}-loading.png`, fullPage: true });
        config.release(); await result.seen;
        assert.match(await indicator.textContent(), mode === "offline" ? /Running Java and checking output/ : /Checking your output/);
        await page.emulateMedia({ reducedMotion: "reduce" });
        assert.equal(await indicator.locator(".java-run-spinner").evaluate((el) => getComputedStyle(el).animationName), "none");
        const checked = page.waitForResponse((response) => response.url().endsWith(`/progress/${mode === "offline" ? "run" : "browser-result"}`));
        result.release(); assert.equal((await checked).status(), 200); await idle();
        assert.match(await consoleOutput.textContent(), /Java status check/);
        assert.equal(await page.locator('.student-module-project img[alt="CheerpJ"]').count(), mode === "online" ? 1 : 0);
      });

      await t.test("a failed run clears the indicator and the next run recovers", async () => {
        await page.route("**/progress/project", (route) => route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Temporary verification failure" }) }), { times: 1 });
        await runButton().click(); await page.getByRole("alert").filter({ hasText: "Temporary verification failure" }).waitFor();
        await idle(); assert.equal(await indicator.count(), 0);
        if (mode === "offline") await delay(1600); // Respect the existing 1.5-second laptop run limit.
        const checked = page.waitForResponse((response) => response.url().endsWith(`/progress/${mode === "offline" ? "run" : "browser-result"}`));
        await runButton().click(); assert.equal((await checked).status(), 200); await idle();
        assert.match(await consoleOutput.textContent(), /Java status check/);
      });

      await t.test("compiler errors clear progress and remain visible in Actual output", async () => {
        if (mode === "offline") await delay(1600);
        await page.getByRole("textbox", { name: "Java source code editor", exact: true }).fill("public class Main { invalid java }");
        const checked = page.waitForResponse((response) => response.url().endsWith(`/progress/${mode === "offline" ? "run" : "browser-result"}`));
        await runButton().click(); assert.equal((await checked).status(), 200); await idle();
        assert.match(await consoleOutput.textContent(), /error/i);
        assert.equal(await indicator.count(), 0);
      });

      await page.getByRole("button", { name: "Return to class project", exact: true }).click();
      await page.getByRole("button", { name: "Module worksheet", exact: true }).focus(); await page.keyboard.press("Enter");
      await page.locator("#classroom-worksheet").getByRole("button", { name: /Performance task/ }).click();
      await page.getByRole("button", { name: "Work on performance task", exact: true }).click();
      await page.locator(".student-module-project").waitFor();

      await t.test("Save work alone does not claim Java is running", async () => {
        const editor = page.getByRole("textbox", { name: "Java source code editor", exact: true });
        await editor.fill((await editor.inputValue()) + "\n");
        const saving = await hold("**/progress/performance-project");
        await page.getByRole("button", { name: "Save work", exact: true }).click(); await saving.seen;
        assert.equal(await indicator.count(), 0);
        saving.release(); await idle();
      });

      if (mode === "online") {
        await t.test("personal Java shows input waiting, resumes on Enter, and clears after Stop", async () => {
          await runButton().click();
          await indicator.filter({ hasText: "Waiting for your input" }).waitFor();
          assert.equal(await page.locator(".console[aria-busy='false']").count(), 1);
          const input = page.getByRole("textbox", { name: "Program input" });
          await input.fill("Ada"); await input.press("Enter"); await idle();
          assert.match(await consoleOutput.textContent(), /Hello Ada/);
          await runButton().click(); await indicator.filter({ hasText: "Waiting for your input" }).waitFor();
          await page.getByRole("button", { name: "Stop", exact: true }).click(); await idle();
          assert.match(await consoleOutput.textContent(), /Execution stopped/);
        });
      } else {
        await t.test("offline personal Java retains input-before-Run and clears progress after real javac", async () => {
          await delay(1600);
          await page.getByRole("textbox", { name: "Program input" }).fill("Ada");
          const executed = page.waitForResponse((response) => response.url().endsWith("/api/execute"));
          await runButton().click(); assert.equal((await executed).status(), 200); await idle();
          assert.match(await consoleOutput.textContent(), /Hello Ada/);
        });
      }

      await page.getByRole("button", { name: "Return to class project", exact: true }).click();
      for (const role of ["student", "teacher"]) {
        if (role === "teacher") {
          assert.equal((await context.request.post("/api/auth/login", { data: { email: users[0].email, password } })).status(), 200);
          await page.goto("/");
          await page.getByRole("button", { name: "Open class", exact: true }).click();
          await page.getByRole("button", { name: "Enter classroom" }).click();
        }
        const regular = page.locator(".right-panel:not(.module-activity-console) .console");
        const regularOutput = regular.locator(":scope > pre");
        const regularIndicator = regular.locator(".java-run-progress");
        const editor = page.getByRole("textbox", { name: "Java source code editor", exact: true });
        const finished = () => regularIndicator.waitFor({ state: "hidden" });
        const cooldown = async () => { if (mode === "offline") await delay(1600); };

        await t.test(`regular ${role} Console: spinner rotates through startup, then clears after real Java`, async () => {
          await cooldown(); await page.emulateMedia({ reducedMotion: "no-preference" });
          await editor.fill(`public class Main { public static void main(String[] args) { System.out.println("Regular ${role} output"); } }`);
          const startup = await hold(mode === "online" ? "http://localhost:3031/" : "**/api/execute");
          try {
            await runButton().click(); await startup.seen;
            assert.ok(await regularIndicator.isVisible(), "the regular Code editor must render the status strip");
            assert.match(await regularIndicator.textContent(), /Java is loading or running/);
            if (mode === "online") assert.match(await regularOutput.textContent(), /Opening Java runner/, "keep the newer startup-stage feedback alongside the indicator");
            const spinner = regularIndicator.locator(".java-run-spinner");
            const firstTransform = await spinner.evaluate((el) => getComputedStyle(el).transform);
            await page.waitForFunction((first) => getComputedStyle(document.querySelector(".console .java-run-spinner")).transform !== first, firstTransform, { timeout: 3000 });
            assert.equal(await regularOutput.getAttribute("aria-busy"), "true");
            await page.screenshot({ path: `/tmp/classroom-java-progress-${mode}-${role}.png`, fullPage: true });
            await regularIndicator.screenshot({ path: `/tmp/classroom-java-progress-${mode}-${role}-strip.png` });
            await page.emulateMedia({ reducedMotion: "reduce" });
            assert.equal(await spinner.evaluate((el) => getComputedStyle(el).animationName), "none");
            startup.release(); await finished();
            assert.match(await regularOutput.textContent(), new RegExp(`Regular ${role} output`));
          } finally { startup.release(); }
        });

        await t.test(`regular ${role} Console: input and compiler errors clear progress; online Stop works`, async () => {
          await cooldown();
          await editor.fill(fixture.performanceTask.starterFiles[0].content);
          const input = page.getByRole("textbox", { name: "Program input", exact: true });
          if (mode === "offline") await input.fill("Ada");
          await runButton().click();
          if (mode === "online") {
            await regularIndicator.filter({ hasText: "Waiting for your input" }).waitFor({ timeout: 30000 });
            await input.fill("Ada"); await input.press("Enter");
          }
          await finished(); assert.match(await regularOutput.textContent(), /Hello Ada/);
          if (mode === "online") {
            await runButton().click(); await regularIndicator.filter({ hasText: "Waiting for your input" }).waitFor({ timeout: 30000 });
            await page.getByRole("button", { name: "Stop", exact: true }).click(); await finished();
            assert.match(await regularOutput.textContent(), /Execution stopped/);
          }
          await cooldown(); await editor.fill("public class Main { invalid java }");
          await runButton().click(); await finished();
          assert.match(await regularOutput.textContent(), /error/i);
          assert.equal(await regularIndicator.count(), 0);
        });
      }
      await context.close();
    } finally {
      gates.forEach((release) => release());
      await browser.close();
      if (classroomId) assert.equal((await admin.from("classrooms").delete().eq("id", classroomId)).error, null);
      for (const user of users) assert.equal((await admin.auth.admin.deleteUser(user.id)).error, null);
    }
  });
}
