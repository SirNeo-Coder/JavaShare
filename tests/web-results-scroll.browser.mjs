// Real local browser check (CKB-140): on a web step, a long result in the side panel scrolls on its own and never
// squeezes the task text above it to a sliver or runs past the panel. Week 1 Step 9 has the longest page text.
// Java panels keep their old layout: the task-text minimum is for web results only (CodeRabbit, PR #140).
// Local Supabase only. Env: WEB_SCROLL_BASE_URL (default http://localhost:3072, offline classroom settings),
// CODESHARE_PLAYWRIGHT_MODULE, PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { activityStateId, sampleStateId } from "../backend/src/module-activities.ts";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const config = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(config.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const content = JSON.parse(readFileSync(new URL("../docs/modules/dotnet1/week01/DotNet1_Week_01.threepart.codeshare.json", import.meta.url)));
content.id = `scroll-${randomUUID().slice(0, 8)}`; content.title = `Scroll check ${content.id.slice(-4)}`;
const java = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
java.id = `scroll-java-${randomUUID().slice(0, 6)}`; java.title = `Scroll Java ${java.id.slice(-4)}`;
java.lessons[0].blocks[0].instruction = Array.from({ length: 12 }, (_, i) => `Line ${i + 1} of a long task text that wraps in the panel.`).join("\n");
const steps = content.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "step");
const last = steps.at(-1);

test("web step side panel: a long result scrolls; the task text keeps its room; Show page stays in the panel", async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const baseURL = process.env.WEB_SCROLL_BASE_URL || "http://localhost:3072";
  const users = []; let classroomId;
  try {
    const password = randomUUID();
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `scroll-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Scroll ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const teacher = await browser.newContext({ baseURL });
    assert.equal((await teacher.request.post("/api/auth/login", { data: { email: users[0].email, password } })).status(), 200);
    const created = await teacher.request.post("/api/classes", { data: { subject: "Net MVC", name: `Scroll ${randomUUID().slice(0, 6)}` } });
    assert.equal(created.status(), 201); classroomId = (await created.json()).id;
    assert.equal((await teacher.request.post(`/api/classrooms/${classroomId}/modules`, { data: content })).status(), 201);
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);
    // Steps 1-8 done, so the module opens at Step 9 (a laptop-height screen).
    const student = await browser.newContext({ baseURL, viewport: { width: 1366, height: 720 } });
    assert.equal((await student.request.post("/api/auth/login", { data: { email: users[1].email, password } })).status(), 200);
    assert.equal((await student.request.get(`/api/classrooms/${classroomId}/modules/${content.id}/progress`)).status(), 200);
    const done = Object.fromEntries(steps.slice(0, -1).flatMap((step) => [[activityStateId(step), "pass"], [sampleStateId(step), "pass"]]));
    assert.equal((await admin.from("module_progress").update({ step_states: done }).eq("classroom_id", classroomId).eq("student_id", users[1].id).eq("module_id", content.id)).error, null);

    const tab = await student.newPage(); tab.setDefaultTimeout(20000);
    const errors = []; tab.on("pageerror", (e) => errors.push(e.message));
    await tab.goto("/"); await tab.locator(".classroom-workspace").waitFor();
    await tab.getByRole("button", { name: "Module", exact: true }).hover();
    await tab.locator("#classroom-modules .module-catalog-card").filter({ hasText: content.title }).getByRole("button").first().click();
    await tab.waitForFunction((value) => document.querySelector(".student-module-project .editor-card textarea")?.value === value, last.files[0].content);
    await tab.mouse.move(700, 20);
    const run = async () => {
      await tab.getByRole("button", { name: /Run code/ }).click();
      await tab.waitForFunction(() => document.querySelector(".page-window header button")?.disabled === false);
      await tab.locator(".page-window").getByRole("button", { name: "Close", exact: true }).click();
    };
    await run(); // the unchanged sample first (it opens the editor)
    await tab.waitForFunction(() => !document.querySelector(".student-module-project .editor-card textarea")?.readOnly);
    // A run that matches nothing: the page window closes after the check, then the long result sits in the side panel.
    await tab.locator(".student-module-project").getByRole("textbox", { name: "HTML source code editor", exact: true }).fill(last.files[0].content.replace("Chess</li>", "Chess and darts</li>"));
    await run();
    await tab.locator(".module-activity-console > .web-checks .web-check-compare").waitFor();

    const box = await tab.evaluate(() => {
      const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
      const checks = document.querySelector(".module-activity-console > .web-checks");
      checks.scrollTop = checks.scrollHeight;
      const yours = document.querySelector('.module-activity-console > .web-checks [aria-label="Your output"]').getBoundingClientRect();
      return { panel: rect(".module-activity-console"), details: rect(".module-activity-details"), checks: checks.getBoundingClientRect(),
        scrolls: checks.scrollHeight > checks.clientHeight, yours, show: rect(".show-page-button") };
    });
    await tab.screenshot({ path: "/tmp/codeshare-web-results-scroll.png" });
    assert.ok(box.details.height >= Math.min(100, box.panel.height / 4) - 1, `the task text keeps its room (${Math.round(box.details.height)}px of ${Math.round(box.panel.height)}px)`);
    assert.ok(box.checks.height >= Math.min(120, box.panel.height / 4) - 1, `the result keeps its room (${Math.round(box.checks.height)}px of ${Math.round(box.panel.height)}px)`);
    assert.ok(box.scrolls, "the long result scrolls on its own");
    assert.ok(box.checks.bottom <= box.panel.bottom + 1, "the result ends inside the panel");
    assert.ok(box.yours.bottom <= box.checks.bottom + 1 && box.yours.bottom > box.checks.top, "scrolled down, the end of Your output is in view");
    assert.ok(box.show.bottom <= box.panel.bottom + 1, "Show page stays inside the panel");
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    if (classroomId) await admin.from("classrooms").delete().eq("id", classroomId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});

test("Java step side panel on a short screen: long task text still shrinks, so the console stays inside the panel", async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const baseURL = process.env.WEB_SCROLL_BASE_URL || "http://localhost:3072";
  const users = []; let classroomId;
  try {
    const password = randomUUID();
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `scroll-java-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Scroll ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const teacher = await browser.newContext({ baseURL });
    assert.equal((await teacher.request.post("/api/auth/login", { data: { email: users[0].email, password } })).status(), 200);
    const created = await teacher.request.post("/api/classes", { data: { subject: "Java", name: `Scroll Java ${randomUUID().slice(0, 6)}` } });
    assert.equal(created.status(), 201); classroomId = (await created.json()).id;
    assert.equal((await teacher.request.post(`/api/classrooms/${classroomId}/modules`, { data: java })).status(), 201);
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);
    const student = await browser.newContext({ baseURL, viewport: { width: 1366, height: Number(process.env.JAVA_SCROLL_HEIGHT || 500) } });
    assert.equal((await student.request.post("/api/auth/login", { data: { email: users[1].email, password } })).status(), 200);
    const tab = await student.newPage(); tab.setDefaultTimeout(20000);
    await tab.goto("/"); await tab.locator(".classroom-workspace").waitFor();
    await tab.getByRole("button", { name: "Module", exact: true }).hover();
    await tab.locator("#classroom-modules .module-catalog-card").filter({ hasText: java.title }).getByRole("button").first().click();
    await tab.locator(".module-activity-console .console").waitFor();
    await tab.mouse.move(700, 20);
    // After a run the banner is taller: the space the console needs is tightest then.
    await tab.getByRole("button", { name: /Run code/ }).click();
    await tab.waitForFunction(() => /Completed|Not completed|differs|Try again/i.test(document.querySelector(".module-run-feedback")?.textContent ?? ""), null, { timeout: 60000 });
    const box = await tab.evaluate(() => {
      const rect = (selector) => document.querySelector(selector).getBoundingClientRect();
      return { panel: rect(".module-activity-console"), details: rect(".module-activity-details"), console: rect(".module-activity-console .console") };
    });
    await tab.screenshot({ path: "/tmp/codeshare-java-panel-short.png" });
    assert.ok(box.console.bottom <= box.panel.bottom + 1, `the Java console ends inside the panel (console ${Math.round(box.console.bottom)}, panel ${Math.round(box.panel.bottom)}, task text ${Math.round(box.details.height)}px)`);
  } finally {
    await browser.close();
    if (classroomId) await admin.from("classrooms").delete().eq("id", classroomId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
