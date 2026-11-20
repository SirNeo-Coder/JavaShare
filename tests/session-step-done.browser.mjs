// Real local browser check: class session step count (teacher, 2026-11-11). The Class session bar shows
// "Step N · done/total done"; hovering lists who is done and who is not. A student finishing the step updates it
// live, with no page reload and no timer.
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

const content = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
content.id = `step-done-browser-${randomUUID().slice(0, 6)}`; content.week = 60; content.title = "Step done week 60";
const stepOne = content.lessons[0].blocks[0];
// A guided example, the third practice check (CKB-131); a guided example needs the task's own id.
stepOne.activity.id = `step-done-task-${randomUUID().slice(0, 6)}`;
stepOne.activity.guided = { instruction: "Print a capacity of 30.", code: "System.out.println(\"Capacity: \" + 30);", expectedOutput: "Capacity: 30", stdin: "" };

test("class session step count: online students only; a saved pass or a matching class-step run counts live; preview runs show a match banner", async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const baseURL = process.env.PREVIEW_BASE_URL || "http://localhost:3062";
  const users = []; let classId;
  try {
    const password = randomUUID();
    const contexts = [];
    for (const [role, name] of [["teacher", "Done Teacher"], ["student", "Ana Done"], ["student", "Ben Notyet"]]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `step-done-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role, name }).eq("id", data.user.id)).error, null);
      const context = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
      assert.equal((await context.request.post("/api/auth/login", { data: { email: data.user.email, password } })).status(), 200);
      contexts.push(context);
    }
    const [teacher, ana, ben] = contexts;
    const created = await teacher.request.post("/api/classes", { data: { subject: "Java", name: "Step done browser" } });
    assert.equal(created.status(), 201); classId = (await created.json()).id;
    assert.equal((await teacher.request.post(`/api/classrooms/${classId}/modules`, { data: content })).status(), 201);
    assert.equal((await admin.from("classroom_members").insert([{ classroom_id: classId, user_id: users[1].id }, { classroom_id: classId, user_id: users[2].id }])).error, null);

    const page = await teacher.newPage(); page.setDefaultTimeout(30000);
    const errors = []; page.on("pageerror", (error) => errors.push(error.message));
    const reads = []; page.on("request", (request) => { if (request.url().endsWith("/session/step-progress")) reads.push(Date.now()); });
    // Only students online count (teacher, 2026-11-20, CKB-129): both students have CodeShare open.
    const studentPages = [];
    for (const context of [ana, ben]) {
      const student = await context.newPage(); student.setDefaultTimeout(30000); student.on("pageerror", (error) => errors.push(error.message));
      await student.goto("/"); await student.locator(".classroom-workspace").waitFor(); studentPages.push(student);
    }
    const [anaPage, benPage] = studentPages;
    await page.goto("/");
    await page.locator("header").filter({ hasText: "Step done browser" }).getByRole("button", { name: "Open class", exact: true }).click();
    await page.getByRole("button", { name: "Enter classroom" }).click();
    await page.locator(".team-header").getByRole("button", { name: "End session" }).waitFor();
    const chip = page.locator(".session-step-done");
    assert.equal(await chip.count(), 0, "no worksheet open: no count");

    await page.getByRole("button", { name: "Module", exact: true }).hover();
    await page.locator("#classroom-modules .module-catalog-card").filter({ hasText: content.title }).getByRole("button").first().click();
    await page.locator("#classroom-worksheet article:not([hidden])").waitFor();
    await chip.getByRole("button", { name: "Step 1 · 0/2 done" }).waitFor();

    // Ana finishes step 1 with the laptop's Java, as Run code does offline.
    const base = `/api/classrooms/${classId}/modules/${content.id}/progress`;
    const prepared = await (await ana.request.post(`${base}/activity`, { data: { stepId: stepOne.id } })).json();
    const before = reads.length;
    // A step with a guided example: the guided run comes first, then the task (saved pass).
    const anaFiles = (capacity) => prepared.projectFiles.map((file) => file.path === "Main.java" ? { ...file, content: file.content.replace("v.getCapacity()", capacity) } : file);
    const guidedRun = await (await ana.request.post(`${base}/run`, { data: { stepId: stepOne.id, files: anaFiles("30"), updatedAt: prepared.updatedAt } })).json();
    assert.equal(guidedRun.check, "guided"); assert.equal(guidedRun.passed, true);
    await page.waitForTimeout(1600);
    const run = await (await ana.request.post(`${base}/run`, { data: { stepId: stepOne.id, files: anaFiles("25"), updatedAt: guidedRun.progress.updatedAt } })).json();
    assert.equal(run.passed, true, JSON.stringify(run).slice(0, 300));
    await chip.getByRole("button", { name: "Step 1 · 1/2 done" }).waitFor();
    assert.equal(reads.length, before + 1, "one re-read for one finished task");

    // Work in code editor closes the worksheet and shares the step: the count stays, now for the shared step (CKB-108).
    await page.locator("#classroom-worksheet").getByRole("button", { name: "Next page →" }).click();
    await chip.getByRole("button", { name: "Step 1 · 1/2 done" }).waitFor();
    await page.locator("#classroom-worksheet article:not([hidden])").getByRole("button", { name: "Work in code editor", exact: true }).click();
    await page.locator(".team-header").getByText("Shared with class").waitFor();
    // Wait for the server to drop the followed page and for that change to reach the screen, then check the chip.
    for (let tries = 0; (await admin.from("classrooms").select("session_page").eq("id", classId).single()).data.session_page; tries++) {
      assert.ok(tries < 50, "the closed worksheet's page was never cleared"); await page.waitForTimeout(200);
    }
    await page.waitForTimeout(2000);
    assert.equal(await chip.getByRole("button").innerText(), "Step 1 · 1/2 done", "the count stays in the code editor");

    // The teacher's own preview run says whether it matched (CKB-128).
    const footer = (p) => p.locator("footer.actionbar").filter({ hasText: "Return to class project" });
    const banner = (p) => p.locator(".student-module-project .module-run-feedback");
    await footer(page).getByRole("button", { name: /Run code/ }).click();
    await banner(page).filter({ hasText: "Matches Expected sample output." }).waitFor();
    assert.match(await banner(page).innerText(), /Practice only — not saved/);
    assert.match(await banner(page).innerText(), /✓ Sample, unchanged code[\s\S]*○ Guided example[\s\S]*○ Your task/);

    // Ben's class-step run with the task output: green banner on his screen, and he counts as done, with nothing saved.
    await benPage.waitForFunction(() => document.querySelector(".student-module-project .workspace-card-heading b")?.textContent?.startsWith("Class step"));
    const benEditor = benPage.locator(".student-module-project").getByRole("textbox", { name: "Java source code editor", exact: true });
    await benEditor.fill((await benEditor.inputValue()).replace("v.getCapacity()", "(v.getCapacity() + 1)"));
    await footer(benPage).getByRole("button", { name: /Run code/ }).click();
    await banner(benPage).filter({ hasText: "Differs from the expected output." }).waitFor();
    assert.equal(await chip.getByRole("button").innerText(), "Step 1 · 1/2 done", "a differing run does not count");
    await benPage.waitForTimeout(1600); // the laptop runner refuses runs less than 1.5 seconds apart
    // The guided example reaches the class step and is its own check (CKB-131).
    await benPage.locator(".student-module-project .module-guided").getByText("Print a capacity of 30.").waitFor();
    await benEditor.fill((await benEditor.inputValue()).replace("(v.getCapacity() + 1)", "30"));
    await footer(benPage).getByRole("button", { name: /Run code/ }).click();
    await banner(benPage).filter({ hasText: "Matches Expected guided output." }).waitFor();
    assert.match(await banner(benPage).innerText(), /✓ Guided example/);
    assert.equal(await chip.getByRole("button").innerText(), "Step 1 · 1/2 done", "the guided example alone does not count as done");
    await benPage.waitForTimeout(1600);
    await benEditor.fill((await benEditor.inputValue()).replace("+ 30)", "+ 25)"));
    await footer(benPage).getByRole("button", { name: /Run code/ }).click();
    await banner(benPage).filter({ hasText: "Matches Expected task output." }).waitFor();
    assert.match(await banner(benPage).getAttribute("class"), /passed/);
    const ticks = await banner(benPage).locator(".preview-checks").innerText();
    assert.match(ticks, /○ Sample, unchanged code/); assert.match(ticks, /✓ Guided example/); assert.match(ticks, /✓ Your task/);
    await chip.getByRole("button", { name: "Step 1 · 2/2 done" }).waitFor();
    const benSaved = await admin.from("module_progress").select("step_states").eq("classroom_id", classId).eq("student_id", users[2].id).maybeSingle();
    assert.ok(!benSaved.data || !Object.values(benSaved.data.step_states).includes("pass"), "the class step saves nothing");

    const list = chip.getByRole("tooltip");
    assert.equal(await list.isVisible(), false, "the names stay hidden until hover");
    await chip.getByRole("button").hover();
    await list.waitFor({ state: "visible" });
    assert.equal((await list.innerText()).replace(/\n+/g, "\n"), "Done (2)\nAna Done\nBen Notyet\nNot yet (0)\nNobody yet");
    if (process.env.STEP_DONE_SCREENSHOT) await page.screenshot({ path: process.env.STEP_DONE_SCREENSHOT });

    // Ana closes CodeShare: she leaves the count, though her saved pass remains.
    await anaPage.close();
    await chip.getByRole("button", { name: "Step 1 · 1/1 done" }).waitFor();

    // No timer: nothing re-reads while nobody finishes.
    const quiet = reads.length;
    await page.waitForTimeout(4000);
    assert.equal(reads.length, quiet, "no re-reads without a finished task or a page change");
    // Only a share re-read can hide the chip here: with the worksheet closed, Stop sharing leaves no step (CKB-110).
    await page.locator(".team-header").getByRole("button", { name: "Stop sharing" }).click();
    await chip.waitFor({ state: "detached" });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    if (classId) await admin.from("classrooms").delete().eq("id", classId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
