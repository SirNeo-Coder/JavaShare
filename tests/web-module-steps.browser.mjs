// Real local production browser checks for web module steps (Slices 1-2), with the teacher's own
// Net MVC Week 1-3 files. Local Supabase only, no hosted data; the server may use offline settings
// (laptop Java), online settings (browser Java) or Cloudflare's runtime (npm run cf:preview).
// Env: WEB_STEPS_BASE_URL (default http://localhost:3042), DOTNET_WEEKS_DIR (folder holding the
// teacher's DotNet1_Week_0N.codeshare.json files), CODESHARE_PLAYWRIGHT_MODULE, PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { activityStateId } from "../backend/src/module-activities.ts";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const config = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(config.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const folder = process.env.DOTNET_WEEKS_DIR || "/home/ireneo/Documents/Java 2026/Net Files";
const paths = ["DotNet1_Week_01.codeshare.json", "Week_02/DotNet1_Week_02.codeshare.json", "Week_03/DotNet1_Week_03.codeshare.json"].map((name) => join(folder, name));
const weeks = paths.every(existsSync) ? paths.map((path) => JSON.parse(readFileSync(path, "utf8"))) : null;
const stepsOf = (module) => module.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "step");

test("web module steps: uploads keep checks, teacher preview checks every sample, a student completes Week 2", { skip: !weeks && `teacher files not found in ${folder}` }, async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const baseURL = process.env.WEB_STEPS_BASE_URL || "http://localhost:3042";
  const users = []; let classroomId;
  try {
    const password = randomUUID();
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `web-steps-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Web ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const teacher = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
    assert.equal((await teacher.request.post("/api/auth/login", { data: { email: users[0].email, password } })).status(), 200);
    const created = await teacher.request.post("/api/classes", { data: { subject: "Net MVC", name: "Web steps verification" } });
    assert.equal(created.status(), 201); classroomId = (await created.json()).id;
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);
    const errors = [];

    await t.test("upload keeps webChecks, mediaChecks and includeMediaOutput", async () => {
      for (const week of weeks) assert.equal((await teacher.request.post(`/api/classrooms/${classroomId}/modules`, { data: week })).status(), 201, week.id);
      for (const week of weeks.slice(1)) {
        const saved = stepsOf(await (await teacher.request.get(`/api/classrooms/${classroomId}/modules/${week.id}`)).json());
        for (const [index, step] of stepsOf(week).entries()) {
          for (const field of ["webChecks", "mediaChecks", "includeMediaOutput"]) assert.deepEqual(saved[index][field], step[field], `${step.id} ${field}`);
        }
      }
      assert.ok(stepsOf(weeks[2]).some((step) => step.mediaChecks), "Week 3 has a mediaChecks step to keep");
    });

    await t.test("teacher preview runs every step's own sample through the web check", async () => {
      const page = await teacher.newPage(); page.setDefaultTimeout(20000); page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("/");
      await page.getByRole("button", { name: /Open class/ }).click();
      const curriculum = page.getByRole("navigation", { name: "Teacher class navigation" }).getByRole("button", { name: /Curriculum/ });
      await curriculum.click();
      const report = [];
      for (const week of weeks) {
        await page.locator(".teacher-module-card", { hasText: week.title.replace(/^Self-Paced Module:\s*/, "") }).getByRole("button", { name: /View module details/ }).click();
        const views = page.locator(".module-step");
        await views.first().waitFor();
        for (const [index, step] of stepsOf(week).entries()) {
          const view = views.nth(index);
          await view.getByRole("button", { name: "Run", exact: true }).click();
          const checks = view.locator(".web-checks");
          await checks.waitFor();
          const media = /(?:^|\n)Media checks:/.test(step.expectedOutput);
          if (media) { assert.match(await checks.textContent(), /Checked by your teacher for now/); report.push(`${step.id}: teacher-checked (expected output has Media checks)`); continue; }
          const failed = (await checks.locator("li.failed").allTextContents()).map((line) => line.replace(/^✗ /, ""));
          const textFailed = failed.some((line) => /^(?:Page text|Console output) matches$/.test(line));
          const pageCheckFails = failed.filter((line) => !/^(?:Page text|Console output) matches$/.test(line));
          const yours = textFailed ? await checks.getByLabel("Your output").textContent() : "";
          const alert = await checks.getByRole("alert").count() ? await checks.getByRole("alert").textContent() : "";
          // Week 1 was written with the page text on the title's next line; say when that is the only difference.
          const lineBreakOnly = textFailed && !alert && step.expectedOutput.replace(/\nVisible page text: /, "\nVisible page text:\n") === yours;
          const textReason = textFailed ? `${alert || firstDifference(step.expectedOutput, yours)}${lineBreakOnly ? " (only difference: no line break after \"Visible page text:\")" : ""}` : "";
          const pageChecks = await checks.locator("li").count() - 1;
          report.push(`${step.id}: ${failed.length ? `fail — ${[textReason, ...pageCheckFails].filter(Boolean).join("; ")}` : `pass (page text + ${pageChecks} page checks)`}`);
        }
        await page.getByRole("button", { name: /Close|Back/ }).first().click().catch(() => page.goBack());
        await curriculum.click();
      }
      console.log(`Per-step sample results:\n${report.join("\n")}`);
      t.diagnostic(report.join(" | "));
    });

    const student = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
    assert.equal((await student.request.post("/api/auth/login", { data: { email: users[1].email, password } })).status(), 200);
    const page = await student.newPage(); page.setDefaultTimeout(20000); page.on("pageerror", (e) => errors.push(e.message));
    const worksheet = page.locator("#classroom-worksheet");
    // A Net MVC class's own web project also has an HTML editor; use the module project's.
    const editor = page.locator(".student-module-project").getByRole("textbox", { name: "HTML source code editor", exact: true });
    const checks = page.locator(".student-module-project .web-checks");
    const progress = async (week) => (await student.request.get(`/api/classrooms/${classroomId}/modules/${week.id}/progress`)).json();
    const openWorksheet = async () => {
      await page.mouse.move(1100, 20); await page.getByRole("button", { name: "Module", exact: true }).hover();
      await page.waitForFunction(() => document.getElementById("classroom-worksheet")?.dataset.open === "true");
    };
    const openCatalog = async (week) => {
      await page.goto("/"); await page.locator(".classroom-workspace").waitFor();
      await page.getByRole("button", { name: "Module", exact: true }).hover();
      await page.locator("#classroom-modules .module-catalog-card").filter({ hasText: week.title.replace(/^Self-Paced Module:\s*/, "") }).getByRole("button").first().click();
      await worksheet.locator("article:not([hidden])").waitFor();
      await editorReady(); // choosing a module opens its next unfinished step in the editor
    };
    const currentTab = () => worksheet.locator('.worksheet-tabs [aria-current="page"]').textContent();
    // Opening a step remounts the module editor; wait for the old one to go and the new one to finish restoring.
    const editorReady = async (old) => {
      if (old) await page.waitForFunction((element) => !element.isConnected, old);
      await page.waitForFunction(() => { const box = document.querySelector('.student-module-project .editor-card textarea'); return box && !box.readOnly; });
    };
    const openStep = async (step) => {
      const old = await editor.elementHandle();
      await openWorksheet();
      await worksheet.getByRole("button", { name: new RegExp(`Step ${step.number}$`) }).click();
      await worksheet.locator("article:not([hidden])").getByRole("button", { name: "Work in code editor", exact: true }).click();
      await editorReady(old);
    };
    // Each run replaces the preview frame; wait for the new one, then for Run code to come back.
    const run = async () => {
      const frame = page.locator(".student-module-project .module-web-preview iframe");
      const old = await frame.count() ? await frame.elementHandle() : null;
      await page.getByRole("button", { name: /Run code/ }).click();
      if (old) await page.waitForFunction((element) => !element.isConnected, old);
      else await frame.waitFor({ state: "attached" });
      await page.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      await checks.waitFor();
    };
    const week2 = weeks[1], steps2 = stepsOf(week2);

    await t.test("Week 2 Step 1: mismatch and uncaught error show a cross with Required and Your output, a failed page check shows what was found, then the sample passes", async () => {
      await openCatalog(week2);
      assert.match(await currentTab(), /Step 1$/);
      await page.waitForFunction((value) => document.querySelector('.student-module-project .editor-card textarea')?.value === value, steps2[0].files[0].content);
      assert.equal(await page.locator(".student-module-project .file-tab.active").textContent(), "index.html");
      assert.equal(await page.getByLabel("Program input").count(), 0, "web steps have no Program input");
      const sample = steps2[0].files[0].content;
      await editor.fill(sample.replace("Welcome to our school canteen portfolio.", "Welcome to the canteen."));
      await run();
      assert.equal(await checks.locator("li.failed").textContent(), "✗ Page text matches");
      assert.equal(await checks.getByLabel("Your output").textContent(), "Tab title: School Canteen Portfolio\nVisible page text:\nWelcome to the canteen.");
      assert.match(await checks.textContent(), /Required output/);
      assert.match(await page.locator(".module-run-feedback").textContent(), /Not completed/);
      await editor.fill(sample.replace("</body>", "<script>missingFunction()</script></body>"));
      await run();
      assert.equal(await checks.locator("li.failed").count(), 1);
      assert.match(await checks.getByRole("alert").textContent(), /Uncaught error: .*missingFunction/);
      assert.notEqual((await progress(week2)).stepStates[steps2[0].id], "pass");
      // Same page text, but the html lang check fails: a cross with what was found, and no completion.
      await editor.fill(sample.replace('<html lang="en">', '<html lang="fil">'));
      await run();
      assert.equal(await checks.locator("li.passed").textContent(), "✓ Page text matches");
      assert.equal(await checks.locator("li.failed").textContent(), '✗ html has lang="en" — found fil');
      assert.equal(await checks.getByLabel("Your output").count(), 0, "matching page text shows no output comparison");
      assert.match(await page.locator(".module-run-feedback").textContent(), /Not completed/);
      assert.notEqual((await progress(week2)).stepStates[steps2[0].id], "pass");
      await editor.fill(sample);
      await run();
      assert.equal(await checks.locator("li.failed").count(), 0);
      assert.deepEqual(await checks.locator("li.passed").allTextContents(), ["✓ Page text matches", '✓ html has lang="en"']);
      await page.waitForFunction(() => document.querySelector(".module-run-feedback")?.textContent.includes("Completed"));
      const saved = await progress(week2);
      assert.equal(saved.stepStates[activityStateId(steps2[0])], "pass");
      assert.equal(saved.percent, Math.round(100 / (steps2.length + 1)));
    });

    await t.test("Week 2: each next step opens, passes, the next part opens and the percentage moves", async () => {
      for (const step of steps2.slice(1, 3)) {
        await openStep(step);
        await editor.fill(step.files[0].content);
        await run();
        assert.equal(await checks.locator("li.failed").count(), 0, step.id);
        await page.waitForFunction(() => document.querySelector(".module-run-feedback")?.textContent.includes("Completed"));
        assert.equal((await progress(week2)).stepStates[step.id], "pass");
      }
      assert.equal((await progress(week2)).percent, Math.round(300 / (steps2.length + 1)));
      await openWorksheet();
      assert.equal(await worksheet.locator(".worksheet-parts button.part-done").count(), 2, "Monday and Tuesday parts done, Wednesday open");
    });

    await t.test("Week 2: reload resumes at the next unfinished step, from the worksheet and the Module project button", async () => {
      await openCatalog(week2);
      assert.match(await currentTab(), /Step 4$/);
      await page.getByRole("button", { name: "Projects", exact: true }).click();
      await page.getByRole("button", { name: "Module project", exact: true }).click();
      await page.waitForFunction(() => document.getElementById("classroom-projects")?.dataset.open === "false");
      await page.waitForFunction((value) => document.querySelector(".module-activity-details pre")?.textContent === value, steps2[3].expectedOutput);
      await page.waitForFunction(() => { const box = document.querySelector('.student-module-project .editor-card textarea'); return box && !box.readOnly; });
      for (const step of steps2.slice(3)) {
        if (step !== steps2[3]) await openStep(step);
        await editor.fill(step.files[0].content);
        await run();
        assert.equal(await checks.locator("li.failed").count(), 0, step.id);
        await page.waitForFunction(() => document.querySelector(".module-run-feedback")?.textContent.includes("Completed"));
      }
      const saved = await progress(week2);
      assert.ok(steps2.every((step) => saved.stepStates[step.id] === "pass"));
      assert.equal(saved.percent, Math.round(100 * steps2.length / (steps2.length + 1)), "the performance task (Slice 2) is the remaining share");
      await page.screenshot({ path: "/tmp/codeshare-web-steps-student.png" });
    });

    await t.test("a preview that starts below the screen edge still reads the drawn page text, not the raw source", async () => {
      await page.setViewportSize({ width: 1500, height: 520 });
      try {
        await run();
        assert.equal(await checks.locator("li.failed").count(), 0);
        assert.equal(await checks.locator("li.passed").first().textContent(), "✓ Page text matches");
      } finally { await page.setViewportSize({ width: 1500, height: 1050 }); }
    });

    await t.test("teacher dashboard shows the web student's percentage and marks a media step done", async () => {
      const week3 = weeks[2], steps3 = stepsOf(week3);
      await openCatalog(week3);
      await run();
      await page.waitForFunction(() => document.querySelector(".module-run-feedback")?.textContent.includes("Completed"));
      await openStep(steps3[1]);
      assert.match(await worksheet.locator("article:not([hidden])").textContent(), /Checked by your teacher for now/);
      await run();
      assert.match(await checks.textContent(), /Checked by your teacher for now/);
      assert.notEqual((await progress(week3)).stepStates[steps3[1].id], "pass");
      const refused = await student.request.post(`/api/classrooms/${classroomId}/modules/${week3.id}/progress/complete`, { data: {
        stepId: steps3[1].id, updatedAt: (await progress(week3)).updatedAt, moduleVersion: new Date().toISOString(), completionId: randomUUID(),
        files: steps3[1].files, success: true, output: steps3[1].expectedOutput } });
      assert.equal(refused.status(), 400, "a media step cannot be completed from the browser");

      const dashboard = await teacher.newPage(); dashboard.setDefaultTimeout(20000); dashboard.on("pageerror", (e) => errors.push(e.message));
      await dashboard.goto("/");
      await dashboard.getByRole("button", { name: /Open class/ }).click();
      await dashboard.getByRole("button", { name: /^Students/ }).click();
      const percent2 = Math.round(100 * steps2.length / (steps2.length + 1));
      await dashboard.getByRole("button", { name: /Open Web student.*progress/ }).click();
      const card2 = dashboard.locator(".teacher-module-card", { hasText: "Canteen Descriptions" });
      assert.match(await card2.textContent(), new RegExp(`${percent2}%`));
      const card3 = dashboard.locator(".teacher-module-card", { hasText: "Local Canteen Media" });
      await card3.locator(".teacher-checked-steps").getByRole("button", { name: "Mark done" }).first().click();
      await card3.getByText("Done ✓").first().waitFor();
      assert.equal((await progress(week3)).stepStates[steps3[1].id], "pass");
      assert.equal(await card3.getByRole("button", { name: "Mark done" }).count(), steps3.length - 2);
      await dashboard.screenshot({ path: "/tmp/codeshare-web-steps-teacher.png", fullPage: true });
      await openCatalog(week3);
      assert.match(await currentTab(), /Step 3$/, "the student resumes after the teacher-marked step");
    });

    await t.test("Week 3 media (Slice 3b, Cloudflare R2): the teacher adds the media files once; media steps then check pictures, sound and video automatically", async (st) => {
      const week3 = weeks[2], steps3 = stepsOf(week3);
      if ((await teacher.request.get(`/api/classrooms/${classroomId}/modules/${week3.id}/media`)).status() === 503) { st.skip("no media storage (Cloudflare R2) on this server; media steps stay teacher-checked"); return; }
      const mediaRoot = join(folder, "Week_03", "project_end");
      const mediaFiles = ["images/snacks.svg", "images/counter.svg", "audio/chime.wav", "video/canteen.webm"];
      if (!mediaFiles.every((path) => existsSync(join(mediaRoot, path)))) { st.skip(`teacher media not found in ${mediaRoot}`); return; }
      const details = await teacher.newPage(); details.setDefaultTimeout(20000); details.on("pageerror", (e) => errors.push(e.message));
      await details.goto("/");
      await details.getByRole("button", { name: /Open class/ }).click();
      await details.getByRole("navigation", { name: "Teacher class navigation" }).getByRole("button", { name: /Curriculum/ }).click();
      await details.locator(".teacher-module-card", { hasText: "Local Canteen Media" }).getByRole("button", { name: /View module details/ }).click();
      const section = details.getByRole("region", { name: "Media files" });
      await section.getByText("No media files yet.").waitFor();
      await section.getByLabel("Add media files").setInputFiles(mediaFiles.map((path) => join(mediaRoot, path)));
      await section.getByText("video/canteen.webm").waitFor();
      assert.deepEqual((await section.locator("li").allTextContents()).map((line) => line.split(" · ")[0]).sort(), [...mediaFiles].sort());
      // Every media step's own sample now runs automatically in the teacher preview.
      const views = details.locator(".module-step");
      const report = [];
      for (const [index, step] of steps3.entries()) {
        if (index === 0) continue;
        const view = views.nth(index), checks = view.locator(".web-checks");
        for (let attempt = 0; attempt < 20; attempt++) {
          await view.getByRole("button", { name: "Run", exact: true }).click();
          await checks.waitFor();
          await details.waitForFunction((element) => /✓|✗|Checked by your teacher/.test(element.textContent), await checks.elementHandle());
          if (!/Checked by your teacher/.test(await checks.textContent())) break;
          await details.waitForTimeout(500); // the teacher's media files are still loading
        }
        const failed = (await checks.locator("li.failed").allTextContents()).map((line) => line.replace(/^✗ /, ""));
        const media = (await checks.locator("li").allTextContents()).filter((line) => /: (?:image|playback)/.test(line)).length;
        report.push(`${step.id}: ${failed.length ? `fail — ${failed.join("; ")}` : `pass (page text + page checks + ${media} media lines)`}`);
      }
      console.log(`Week 3 media steps with the teacher's media files:\n${report.join("\n")}`);
      t.diagnostic(report.join(" | "));
      assert.ok(report.every((line) => /: pass/.test(line)), report.join("\n"));
      await details.screenshot({ path: "/tmp/codeshare-web-media-teacher.png", fullPage: true });
      await details.close();

      // The student resumes at Step 3 (Step 2 was marked done above); it is now checked automatically.
      await openCatalog(week3);
      assert.match(await currentTab(), /Step 3$/);
      await page.waitForFunction(() => !/Checked by your teacher/.test(document.querySelector(".student-module-project .web-checks")?.textContent ?? ""));
      await editor.fill(steps3[2].files[0].content);
      await run();
      assert.equal(await checks.locator("li.failed").count(), 0, await checks.textContent());
      assert.deepEqual((await checks.locator("li.passed").allTextContents()).filter((line) => /: (?:image|playback)/.test(line)),
        ["✓ images/snacks.svg: image decoded", "✓ images/counter.svg: image decoded", "✓ audio/chime.wav: playback advanced", "✓ video/canteen.webm: playback advanced"]);
      await page.waitForFunction(() => document.querySelector(".module-run-feedback")?.textContent.includes("Completed"));
      assert.equal((await progress(week3)).stepStates[steps3[2].id], "pass");
      await page.screenshot({ path: "/tmp/codeshare-web-media-student.png" });
    });

    await t.test("Week 2 personal performance-task project (Slice 2): HTML editor and page preview, run, submit, 100%; the teacher reviews the frozen page", async () => {
      const submit = page.getByRole("button", { name: "Submit this version", exact: true });
      const ready = page.getByText("Run succeeded — ready to submit this version.", { exact: false });
      const frame = page.locator(".student-module-project .module-web-preview iframe");
      const runPage = async () => {
        const old = await frame.count() ? await frame.elementHandle() : null;
        await page.getByRole("button", { name: /Run code/ }).click();
        if (old) await page.waitForFunction((element) => !element.isConnected, old); else await frame.waitFor({ state: "attached" });
        await page.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      };
      const starter = week2.performanceTask.starterFiles[0].content;
      assert.match(starter, /<\/body>/);
      const mine = starter.replace("</body>", "<p>My stall sells turon.</p></body>");
      await openCatalog(week2);
      await page.getByRole("button", { name: "Projects", exact: true }).hover();
      const projects = page.locator("#classroom-projects");
      assert.deepEqual(await projects.locator('[aria-label="Weekly web projects"] .team-icon').allTextContents(), ["W", "W"]);
      await projects.getByRole("button", { name: "Personal performance-task project", exact: true }).click();
      await page.waitForFunction(() => document.getElementById("classroom-projects")?.dataset.open === "false");
      await page.waitForFunction((value) => document.querySelector('.student-module-project .editor-card textarea')?.value === value, starter);
      assert.match(await page.locator(".student-module-project .workspace-card-heading").first().textContent(), /Personal project.*Web page/);
      assert.match(await page.locator(".assignment-block").textContent(), /Your own web project, continued from the previous week/);
      assert.equal(await page.getByLabel("Program input").count(), 0, "web pages have no Program input");
      assert.equal(await submit.isDisabled(), true);
      await editor.fill(mine.replace("</body>", "<script>missingFunction()</script></body>"));
      await runPage();
      assert.match(await page.locator(".student-module-project").getByRole("alert").first().textContent(), /Uncaught error: .*missingFunction/);
      assert.equal(await submit.isDisabled(), true, "a page with an uncaught error cannot be submitted");
      await editor.fill(mine);
      await runPage();
      await ready.waitFor();
      assert.equal(await submit.isEnabled(), true);
      assert.ok((await progress(week2)).performanceTask.project.successfulRun, "the server recorded the successful run of the saved files");
      await editor.fill(`${mine}\n<!-- changed -->`);
      assert.equal(await submit.isDisabled(), true, "an edit after the run needs a new run");
      await runPage();
      await ready.waitFor();
      await submit.click();
      await page.locator(".actionbar .sync", { hasText: "Submitted" }).waitFor();
      await page.getByRole("alertdialog", { name: "Version submitted" }).getByRole("button", { name: "OK" }).click();
      const saved = await progress(week2);
      assert.equal(saved.percent, 100);
      assert.equal(saved.performanceTask.own.files[0].content, `${mine}\n<!-- changed -->`);
      await page.screenshot({ path: "/tmp/codeshare-web-personal-student.png" });

      // Teacher live help on a web file says Web page and uses the HTML editor (CKB-078).
      const live = await teacher.newPage(); live.setDefaultTimeout(20000); live.on("pageerror", (e) => errors.push(e.message));
      await live.goto("/");
      await live.getByRole("button", { name: /Open class/ }).click();
      await live.getByRole("button", { name: "Enter classroom" }).click();
      await live.locator(".classroom-workspace").waitFor();
      await live.getByRole("button", { name: "Students / projects", exact: true }).hover();
      await live.locator(".team-select").filter({ hasText: "Web student" }).click();
      const helping = live.getByRole("region", { name: "Student live project" });
      await helping.getByText(`Live: Web student · Personal project · ${week2.title}`).waitFor();
      assert.equal(await helping.locator(".workspace-card-heading span").textContent(), "Web page");
      await helping.getByRole("textbox", { name: "HTML source code editor", exact: true }).waitFor();
      await live.close();

      const review = await teacher.newPage(); review.setDefaultTimeout(20000); review.on("pageerror", (e) => errors.push(e.message));
      await review.goto("/");
      await review.getByRole("button", { name: /Open class/ }).click();
      await review.getByRole("button", { name: /^Students/ }).click();
      await review.getByRole("button", { name: /Open Web student.*progress/ }).click();
      assert.match(await review.locator(".teacher-module-card", { hasText: "Canteen Descriptions" }).textContent(), /100%/);
      await review.getByRole("button", { name: "Review personal submission" }).click();
      const frozen = review.locator(".student-module-project").getByRole("textbox", { name: "HTML source code editor", exact: true });
      await frozen.waitFor(); assert.equal(await frozen.getAttribute("readonly"), "");
      assert.match(await frozen.inputValue(), /turon/);
      assert.equal(await review.getByRole("button", { name: "Save work", exact: true }).count(), 0);
      assert.equal(await review.getByLabel("Program input").count(), 0);
      await review.mouse.click(1200, 400);
      await review.getByRole("button", { name: /Run code/ }).click();
      await review.locator(".student-module-project .module-web-preview iframe").waitFor({ state: "attached" });
      await review.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      assert.deepEqual(await progress(week2), saved, "teacher runs never change the student's progress");
      await review.screenshot({ path: "/tmp/codeshare-web-personal-review.png", fullPage: true });
      await review.close();
    });

    await t.test("Week 3 personal project: the student adds their own pictures, sound and video; Run shows them; Submit freezes them; the teacher's review shows them", async (st) => {
      const week3 = weeks[2], steps3 = stepsOf(week3);
      if ((await student.request.get(`/api/classrooms/${classroomId}/modules/${week3.id}/media`)).status() === 503) { st.skip("no media storage (Cloudflare R2) on this server"); return; }
      const mediaRoot = join(folder, "Week_03", "project_end");
      // Week 3's starter page already uses these four files; the student adds three, then the fourth.
      const own = ["images/snacks.svg", "audio/chime.wav", "video/canteen.webm", "images/counter.svg"];
      if (!own.every((path) => existsSync(join(mediaRoot, path)))) { st.skip(`media files not found in ${mediaRoot}`); return; }
      // The module steps are checked elsewhere; mark them done so the personal task opens.
      const states = (await progress(week3)).stepStates;
      assert.equal((await admin.from("module_progress").update({ step_states: { ...states, ...Object.fromEntries(steps3.map((step) => [activityStateId(step), "pass"])) } })
        .eq("student_id", users[1].id).eq("classroom_id", classroomId).eq("module_id", week3.id)).error, null);
      const submit = page.getByRole("button", { name: "Submit this version", exact: true });
      const ready = page.getByText("Run succeeded — ready to submit this version.", { exact: false });
      const frame = page.locator(".student-module-project .module-web-preview iframe");
      const runPage = async () => {
        const old = await frame.count() ? await frame.elementHandle() : null;
        await page.getByRole("button", { name: /Run code/ }).click();
        if (old) await page.waitForFunction((element) => !element.isConnected, old); else await frame.waitFor({ state: "attached" });
        await page.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      };
      // What the preview shows: whether each picture, sound and video came with the page (data:), and whether pictures draw.
      const shownMedia = async (where) => {
        const inside = await (await where.locator(".student-module-project .module-web-preview iframe").elementHandle()).contentFrame();
        await inside.waitForFunction(() => document.querySelector("img")?.complete && document.querySelector("video")?.readyState >= 2 && document.querySelector("audio")?.readyState >= 2);
        await inside.evaluate(() => document.querySelector("img").scrollIntoView());
        return inside.evaluate(() => [...document.querySelectorAll("img,audio,video")].map((element) => `${element.getAttribute("data-codeshare-src") ?? element.getAttribute("src")}: ${element.src.startsWith("data:") ? "from the page" : "not found"}${element.tagName === "IMG" ? `, ${element.naturalWidth > 0 ? "drawn" : "broken"}` : ""}`));
      };
      const starter = week3.performanceTask.starterFiles[0].content;
      const mine = starter.replace("Describe your own silent video here.", "Our canteen at lunch time.");
      assert.notEqual(mine, starter);
      await openCatalog(week3);
      await page.getByRole("button", { name: "Projects", exact: true }).hover();
      await page.locator("#classroom-projects").getByRole("button", { name: "Personal performance-task project", exact: true }).click();
      await page.waitForFunction(() => document.getElementById("classroom-projects")?.dataset.open === "false");
      await page.waitForFunction((value) => document.querySelector(".student-module-project .editor-card textarea")?.value === value, starter);
      const box = page.locator(".student-module-project").getByRole("region", { name: "Media files" });
      await box.getByText("No media files yet.").waitFor();
      await box.getByLabel("Add media files").setInputFiles(own.slice(0, 3).map((path) => join(mediaRoot, path)));
      await box.getByText("video/canteen.webm").waitFor();
      assert.deepEqual((await box.locator("li").allTextContents()).map((line) => line.split(" · ")[0]), own.slice(0, 3));
      await editor.fill(mine);
      await runPage();
      await ready.waitFor();
      assert.deepEqual(await shownMedia(page), ["images/snacks.svg: from the page, drawn", "images/counter.svg: not found, broken", "audio/chime.wav: from the page", "video/canteen.webm: from the page"]);
      await box.getByLabel("Add media files").setInputFiles(join(mediaRoot, own[3]));
      await box.getByText("images/counter.svg").waitFor();
      await page.getByText("Run the current files successfully before submitting.", { exact: false }).waitFor();
      assert.equal(await submit.isDisabled(), true, "adding a media file needs a new run before submitting");
      await runPage();
      await ready.waitFor();
      const allShown = ["images/snacks.svg: from the page, drawn", "images/counter.svg: from the page, drawn", "audio/chime.wav: from the page", "video/canteen.webm: from the page"];
      assert.deepEqual(await shownMedia(page), allShown);
      await submit.click();
      await page.locator(".actionbar .sync", { hasText: "Submitted" }).waitFor();
      const saved = await progress(week3);
      assert.deepEqual(saved.performanceTask.own.media.map((item) => item.path), own);
      assert.equal(saved.percent, 100);
      await box.scrollIntoViewIfNeeded();
      await box.screenshot({ path: "/tmp/codeshare-web-student-media-box.png" });
      await page.locator(".student-module-project .module-web-preview").screenshot({ path: "/tmp/codeshare-web-student-media.png" });

      const review = await teacher.newPage(); review.setDefaultTimeout(20000); review.on("pageerror", (e) => errors.push(e.message));
      await review.goto("/");
      await review.getByRole("button", { name: /Open class/ }).click();
      await review.getByRole("button", { name: /^Students/ }).click();
      await review.getByRole("button", { name: /Open Web student.*progress/ }).click();
      await review.locator(".teacher-module-card", { hasText: "Local Canteen Media" }).getByRole("button", { name: "Review personal submission" }).click();
      await review.locator(".student-module-project").getByRole("textbox", { name: "HTML source code editor", exact: true }).waitFor();
      assert.equal(await review.locator(".student-module-project").getByRole("region", { name: "Media files" }).count(), 0, "the review cannot add or remove media");
      await review.mouse.click(1200, 400);
      await review.getByRole("button", { name: /Run code/ }).click();
      assert.deepEqual(await shownMedia(review), allShown, "the review shows the student's submitted media");
      await review.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      assert.deepEqual(await progress(week3), saved, "teacher runs never change the student's progress");
      await review.locator(".student-module-project .module-web-preview").screenshot({ path: "/tmp/codeshare-web-student-media-review.png" });
      await review.close();
    });

    await t.test("a .js step compares real console lines: teacher preview ticks a match, crosses an uncaught error; a student completes it", async () => {
      const step = (id, number, code, expectedOutput) => ({ type: "step", id, number, instruction: "Run app.js.", language: "javascript", run: "app.js", files: [{ path: "app.js", content: code }], expectedOutput });
      const lessonOf = (id, order, block) => ({ id, order, dayLabel: `DAY ${order}`, title: `Console ${order}`, hours: 1, objectives: { cognitive: "c", affective: "a", psychomotor: "p" }, blocks: [block],
        exitSlip: { id: `${id}-slip`, points: 1, afterStep: block.id, questions: [{ id: "1.1", kind: "Define", points: 1, prompt: "What is the console?" }] } });
      const consoleWeek = { format: "codeshare-module", version: 1, course: "dotnet-1", week: 9, id: "web-console-check", title: "Console check", lessons: [
        lessonOf("web-console-d1", 1, step("web-console-s1", 1, "console.log(\"Total: \" + (2 + 3));\nconsole.info(\"Done\");\nalert(\"not part of the output\");", "Total: 5\nDone")),
        lessonOf("web-console-d2", 2, step("web-console-s2", 2, "console.log(\"before\");\nmissingFunction();", "before")),
      ] };
      assert.equal((await teacher.request.post(`/api/classrooms/${classroomId}/modules`, { data: consoleWeek })).status(), 201);
      const preview = await teacher.newPage(); preview.setDefaultTimeout(20000);
      await preview.goto("/");
      await preview.getByRole("button", { name: /Open class/ }).click();
      await preview.getByRole("navigation", { name: "Teacher class navigation" }).getByRole("button", { name: /Curriculum/ }).click();
      await preview.locator(".teacher-module-card", { hasText: "Console check" }).getByRole("button", { name: /View module details/ }).click();
      const views = preview.locator(".module-step");
      await views.nth(0).getByRole("button", { name: "Run", exact: true }).click();
      assert.equal(await views.nth(0).locator(".web-checks li").textContent(), "✓ Console output matches");
      await views.nth(1).getByRole("button", { name: "Run", exact: true }).click();
      assert.equal(await views.nth(1).locator(".web-checks li").textContent(), "✗ Console output matches");
      assert.match(await views.nth(1).locator(".web-checks").getByRole("alert").textContent(), /Uncaught error: .*missingFunction/);
      assert.equal(await views.nth(1).locator(".web-checks").getByLabel("Your output").textContent(), "before");
      await openCatalog(consoleWeek);
      await run();
      assert.equal(await checks.locator("li.passed").textContent(), "✓ Console output matches");
      await page.waitForFunction(() => document.querySelector(".module-run-feedback")?.textContent.includes("Completed"));
      assert.equal((await progress(consoleWeek)).stepStates["web-console-s1"], "pass");
    });

    await t.test("a module page loads nothing from outside CodeShare (rule 5): stylesheet, picture and fetch are blocked", async () => {
      // A local request counter stands in for an internet site; nothing leaves this computer.
      const requests = [];
      const counter = createServer((request, response) => { requests.push(request.url); response.end(""); });
      await new Promise((resolve) => counter.listen(0, "127.0.0.1", resolve));
      const outside = `http://127.0.0.1:${counter.address().port}`;
      try {
        const html = `<!doctype html>\n<html>\n<head>\n  <title>Offline page</title>\n  <link rel="stylesheet" href="${outside}/style.css">\n</head>\n<body>\n  <h1>Offline page</h1>\n  <img src="${outside}/picture.png" alt="">\n  <script>fetch("${outside}/data").catch(() => {});</script>\n</body>\n</html>\n`;
        const networkWeek = { format: "codeshare-module", version: 1, course: "dotnet-1", week: 10, id: "web-network-check", title: "Network check", lessons: [{
          id: "web-network-d1", order: 1, dayLabel: "DAY 1", title: "No internet", hours: 1, objectives: { cognitive: "c", affective: "a", psychomotor: "p" },
          blocks: [{ type: "step", id: "web-network-s1", number: 1, instruction: "Run the page.", language: "html", run: "index.html", files: [{ path: "index.html", content: html }], expectedOutput: "Tab title: Offline page\nVisible page text:\nOffline page" }],
          exitSlip: { id: "web-network-slip", points: 1, afterStep: "web-network-s1", questions: [{ id: "1.1", kind: "Define", points: 1, prompt: "What is offline?" }] } }] };
        assert.equal((await teacher.request.post(`/api/classrooms/${classroomId}/modules`, { data: networkWeek })).status(), 201);
        await openCatalog(networkWeek);
        await run();
        assert.equal(await checks.locator("li.passed").textContent(), "✓ Page text matches");
        await page.waitForFunction(() => document.querySelector(".module-run-feedback")?.textContent.includes("Completed"));
        await page.waitForTimeout(500); // give any late request time to arrive
        assert.deepEqual(requests, [], "no request reached the outside site");
      } finally { await new Promise((resolve) => counter.close(resolve)); }
    });

    // The deliberate missingFunction() run is a student page error, not a CodeShare error.
    assert.deepEqual(errors.filter((message) => !/missingFunction/.test(message)), []);
  } finally {
    await browser.close();
    if (classroomId) await admin.from("classrooms").delete().eq("id", classroomId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});

function firstDifference(expected, actual) {
  const want = expected.replace(/\r\n/g, "\n").split("\n"), got = actual.split("\n");
  const line = want.findIndex((text, index) => text !== got[index]);
  const at = line === -1 ? want.length : line;
  return `line ${at + 1}: required ${JSON.stringify(want[at] ?? "(end)")}, page gave ${JSON.stringify(got[at] ?? "(end)")}`;
}
