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
      assert.equal((await context.request.patch(`/api/classrooms/${classroomId}/modules/${fixture.id}/availability`, { data: { target: "performance-task", open: true } })).status(), 200);
      assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);
      assert.equal((await context.request.post("/api/auth/login", { data: { email: users[1].email, password } })).status(), 200);
      const page = await context.newPage(); page.setDefaultTimeout(180000);
      let moduleContentRequests = 0;
      page.on("request", (request) => {
        if (request.method() === "GET" && request.url().endsWith(`/api/classrooms/${classroomId}/modules/${fixture.id}`)) moduleContentRequests++;
      });
      await page.goto("/"); await page.locator(".classroom-workspace").waitFor();
      await page.locator('.workspace-rail button[aria-controls="classroom-modules"]').click();
      await page.locator("#classroom-modules .module-catalog-card").first().getByRole("button").first().click();
      await page.locator(".student-module-project").waitFor();
      assert.equal(moduleContentRequests, 1, "module content should be downloaded once and reused from this device's cache");
      await page.getByRole("button", { name: "Close module worksheet", exact: true }).click();
      const indicator = page.locator(".java-run-progress");
      const consoleOutput = page.getByLabel("Program output", { exact: true });
      const runButton = () => page.getByRole("button", { name: /Run code/ });
      const runBox = page.locator(".run-box");
      const outside = () => page.mouse.click(5, 5);
      const idle = () => page.waitForFunction(() => !document.querySelector(".java-run-progress") && !document.querySelector('.student-module-project [aria-label="Java source code editor"]')?.readOnly);
      const hold = async (pattern) => {
        let release, reached;
        const wait = new Promise((resolve) => { release = resolve; });
        const seen = new Promise((resolve) => { reached = resolve; });
        // A cancelled run removes its runner frame, so its held request may be gone by release.
        await page.route(pattern, async (route) => { reached(); await wait; await route.continue().catch(() => undefined); }, { times: 1 });
        gates.push(release); return { release, seen };
      };

      await t.test("shows saving and startup immediately, checking until the actual result, and honors reduced motion", async () => {
        assert.equal(await indicator.count(), 0);
        const config = await hold("**/api/java-runner");
        const result = await hold(`**/progress/${mode === "offline" ? "run" : "complete"}`);
        await runButton().click();
        assert.match(await indicator.textContent(), /Saving your code on this device|Java is loading or running/);
        await config.seen;
        assert.match(await indicator.textContent(), /Java is loading or running/);
        assert.match(await runBox.textContent(), /Java is loading or running/, "Run code shows the floating run box");
        assert.match(await runBox.textContent(), /Please wait — this box closes when your code has run/, "a module check run cannot be cancelled");
        await outside(); assert.equal(await runBox.count(), 1, "clicking outside must not close an uncancellable run box");
        assert.equal(await page.locator(".console[aria-busy='true']").count(), 1);
        assert.equal(await indicator.locator(".java-run-spinner").evaluate((el) => getComputedStyle(el).animationName), "java-run-spin");
        await page.screenshot({ path: `/tmp/java-progress-${mode}-loading.png`, fullPage: true });
        config.release(); await result.seen;
        assert.match(await indicator.textContent(), mode === "offline" ? /Running Java and checking output/ : /Syncing your completed task/);
        await page.emulateMedia({ reducedMotion: "reduce" });
        assert.equal(await indicator.locator(".java-run-spinner").evaluate((el) => getComputedStyle(el).animationName), "none");
        const checked = page.waitForResponse((response) => response.url().endsWith(`/progress/${mode === "offline" ? "run" : "complete"}`));
        result.release();
        const checkedResponse = await checked;
        assert.equal(checkedResponse.status(), 200);
        await runBox.waitFor({ state: "detached" });
        assert.ok((await checkedResponse.json()).module?.performanceTask, "successful module completion returns the newly unlocked task in the same response");
        await idle();
        assert.match(await consoleOutput.textContent(), /Java status check/);
        const saved = await (await context.request.get(`/api/classrooms/${classroomId}/modules/${fixture.id}/progress`)).json();
        assert.equal(saved.stepStates[fixture.lessons[0].blocks[0].id], "pass", "successful code must sync its completed module step");
        assert.equal(await page.locator('.student-module-project img[alt="CheerpJ"]').count(), mode === "online" ? 1 : 0);
      });

      await t.test("failed runs stay on this device and never replace the completed server project", async () => {
        const before = await (await context.request.get(`/api/classrooms/${classroomId}/modules/${fixture.id}/progress`)).json();
        const editor = page.getByRole("textbox", { name: "Java source code editor", exact: true });
        const working = await editor.inputValue();
        await editor.fill("public class Main { invalid java }");
        if (mode === "offline") await delay(1600);
        const failed = mode === "offline" ? page.waitForResponse((response) => response.url().endsWith("/progress/run")) : null;
        await runButton().click(); if (failed) assert.equal((await failed).status(), 200); await idle();
        assert.match(await consoleOutput.textContent(), /error/i);
        const after = await (await context.request.get(`/api/classrooms/${classroomId}/modules/${fixture.id}/progress`)).json();
        assert.deepEqual(after.projectFiles, before.projectFiles, "failed code must not overwrite the last completed server project");
        assert.equal(await indicator.count(), 0);
        await editor.fill(working);
        if (mode === "offline") await delay(1600);
        const checked = page.waitForResponse((response) => response.url().endsWith(`/progress/${mode === "offline" ? "run" : "complete"}`));
        await runButton().click();
        const retried = await checked; assert.equal(retried.status(), 200, await retried.text()); await idle();
        assert.match(await consoleOutput.textContent(), /Java status check/);
      });

      await page.getByRole("button", { name: "Return to class project", exact: true }).click();
      await page.getByRole("button", { name: "Module", exact: true }).click();
      await page.locator("#classroom-worksheet").getByRole("button", { name: /Performance task/ }).click();
      await page.getByRole("button", { name: "Work on performance task", exact: true }).click();
      await page.locator(".student-module-project").waitFor();

      await t.test("Save work alone does not claim Java is running", async () => {
        const editor = page.getByRole("textbox", { name: "Java source code editor", exact: true });
        await editor.fill((await editor.inputValue()) + "\n");
        const saving = await hold("**/progress/performance-project");
        await page.getByRole("button", { name: "Save work", exact: true }).click(); await saving.seen;
        assert.equal(await indicator.count(), 0);
        assert.equal(await runBox.count(), 0, "saving alone never shows the run box");
        saving.release(); await idle();
        const notice = page.getByRole("alertdialog", { name: "Work saved" });
        assert.match(await notice.textContent(), /Your project is saved to CodeShare\./);
        await notice.getByRole("button", { name: "OK" }).click(); await notice.waitFor({ state: "detached" });
      });

      if (mode === "online") {
        await t.test("personal Java shows input waiting, resumes on Enter, and clears after Stop", async () => {
          await runButton().click();
          await indicator.filter({ hasText: "Waiting for your input" }).waitFor();
          assert.equal(await runBox.count(), 0, "the run box closes once Java runs so Program input can be used");
          assert.equal(await page.locator(".console[aria-busy='false']").count(), 1);
          const input = page.getByRole("textbox", { name: "Program input" });
          await input.fill("Ada"); await input.press("Enter"); await idle();
          assert.match(await consoleOutput.textContent(), /Hello Ada/);
          await runButton().click(); await indicator.filter({ hasText: "Waiting for your input" }).waitFor();
          await page.getByRole("button", { name: "Stop", exact: true }).click(); await idle();
          assert.match(await consoleOutput.textContent(), /Execution stopped/);
        });

        await t.test("personal Java: clicking outside the run box cancels compiling", async () => {
          const startup = await hold("http://localhost:3031/");
          await runButton().click(); await startup.seen;
          await runBox.filter({ hasText: "Click outside this box or press Esc to cancel." }).waitFor();
          await delay(400); await page.screenshot({ path: `/tmp/run-box-${mode}-personal-cancellable.png` });
          await outside(); await runBox.waitFor({ state: "detached" });
          startup.release(); await idle();
          assert.match(await consoleOutput.textContent(), /Execution stopped/);
        });
      } else {
        await t.test("offline personal Java retains input-before-Run and clears progress after real javac", async () => {
          await delay(1600);
          await page.getByRole("textbox", { name: "Program input" }).fill("Ada");
          // Offline personal runs compile and run on the laptop inside personal-run (no /api/execute).
          const laptop = await hold("**/progress/personal-run");
          const executed = page.waitForResponse((response) => response.url().endsWith("/progress/personal-run"));
          await runButton().click(); await laptop.seen;
          assert.match(await runBox.textContent(), /Please wait — this box closes when your code has run/, "laptop Java cannot be cancelled");
          await delay(400); await page.screenshot({ path: `/tmp/run-box-${mode}-personal-wait.png` });
          await outside(); assert.equal(await runBox.count(), 1, "clicking outside must not close the offline run box");
          laptop.release(); assert.equal((await executed).status(), 200); await idle();
          assert.equal(await runBox.count(), 0);
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
            assert.match(await runBox.textContent(), mode === "online" ? /Click outside this box or press Esc to cancel/ : /Please wait — this box closes/, "the regular Code editor shows the run box too");
            await delay(400); await page.screenshot({ path: `/tmp/run-box-${mode}-regular-${role}.png` });
            if (mode === "offline") { await outside(); assert.equal(await runBox.count(), 1); }
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
            assert.equal(await runBox.count(), 0);
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
            const startup = await hold("http://localhost:3031/");
            await runButton().click(); await startup.seen;
            await runBox.filter({ hasText: "Click outside this box or press Esc to cancel." }).waitFor();
            await page.keyboard.press("Escape"); await runBox.waitFor({ state: "detached" });
            startup.release(); await finished();
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
