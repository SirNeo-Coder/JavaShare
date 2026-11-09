// Real local production browser checks for web module steps (Slices 1-2), with the teacher's own
// Net MVC weeks of the resume course (Resume/Week_NN/, 2026-11-06). Local Supabase only, no hosted data; the server may
// use offline settings (laptop Java), online settings (browser Java) or Cloudflare's runtime (npm run cf:preview).
// Env: WEB_STEPS_BASE_URL (default http://localhost:3042), DOTNET_WEEKS_DIR (the teacher's Resume folder holding
// Week_NN/DotNet1_Week_NN.codeshare.json), CODESHARE_PLAYWRIGHT_MODULE, PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
// Subtests that need a week skip until that Resume week is built. Media subtests use each week's own media files in
// Week_NN/project_end (Juan's picture, sound and video; Resume Weeks 2 and 3, 2026-11-06).
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { activityStateId } from "../backend/src/module-activities.ts";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const config = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(config.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const folder = process.env.DOTNET_WEEKS_DIR || "/home/ireneo/Documents/Java 2026/Net Files/Resume";
// Every built week, in order from Week 1 (stops at the first week not built yet).
const paths = Array.from({ length: 10 }, (_, i) => join(folder, `Week_${String(i + 1).padStart(2, "0")}`, `DotNet1_Week_${String(i + 1).padStart(2, "0")}.codeshare.json`));
const missing = paths.findIndex((path) => !existsSync(path));
if (missing >= 0) paths.length = missing;
const weeks = paths.length ? paths.map((path) => JSON.parse(readFileSync(path, "utf8"))) : null;
const stepsOf = (module) => module.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "step");
// Weeks in the Java student workflow (teacher, 2026-10-29): run the sample first, then the task. The task
// answers stay in <week folder>/solutions/<step id>/, never in the JSON.
const revised = Boolean(weeks?.some((week) => week.sampleFirst));
assert.ok(!weeks || weeks.every((week) => Boolean(week.sampleFirst) === revised), "The weeks must all use the same format (all sample-first or none)");
const legacyOnly = revised && "the teacher's weeks are sample-first; the next-to-last student subtest walks every step";
const answerFiles = (week, step) => {
  const dir = join(dirname(paths[weeks.indexOf(week)]), "solutions", step.id);
  return existsSync(dir) ? readdirSync(dir, { recursive: true, withFileTypes: true }).filter((entry) => entry.isFile())
    .map((entry) => ({ path: relative(dir, join(entry.parentPath, entry.name)).replaceAll("\\", "/"), content: readFileSync(join(entry.parentPath, entry.name), "utf8") })) : null;
};

// Whether this server stores module media: 200 yes, 503 no (offline); any other answer fails at once with its status.
const mediaStorage = async (request, path) => {
  const status = (await request.get(path)).status();
  assert.ok(status === 200 || status === 503, `unexpected media list status ${status} for ${path}`);
  return status === 200;
};

// Run opens the floating page window (2026-10-30). Wait until the run has been checked (Close comes on;
// a RUN CODE box still on top makes the click wait), then close it so the checks show beside the code again.
const closePageWindow = async (where) => {
  const close = where.locator(".page-window").getByRole("button", { name: "Close", exact: true });
  await close.waitFor();
  await where.waitForFunction(() => document.querySelector(".page-window header button")?.disabled === false);
  await close.click();
  await where.locator(".page-window").waitFor({ state: "detached" });
};

test("web module steps: uploads keep checks, teacher preview checks every sample, a student completes every built week", { skip: !weeks && `teacher files not found in ${folder}` }, async (t) => {
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
      for (const week of weeks) {
        const saved = stepsOf(await (await teacher.request.get(`/api/classrooms/${classroomId}/modules/${week.id}`)).json());
        for (const [index, step] of stepsOf(week).entries()) {
          for (const field of ["webChecks", "mediaChecks", "includeMediaOutput"]) assert.deepEqual(saved[index][field], step[field], `${step.id} ${field}`);
        }
      }
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
          await closePageWindow(page);
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
    // Opening a step remounts the module editor; wait for the old one to go and the new one to finish restoring
    // (Run code comes on then; a sample-first step stays read-only until its sample runs).
    const editorReady = async (old) => {
      if (old) await page.waitForFunction((element) => !element.isConnected, old);
      await page.waitForFunction(() => document.querySelector(".student-module-project .editor-card textarea")
        && [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
    };
    const openStep = async (step) => {
      // The open tab may be any web file (Week 4: a task ends in styles.css, a CSS editor), so take whichever editor is there.
      const old = await page.locator(".student-module-project .editor-card textarea").elementHandle();
      await openWorksheet();
      await worksheet.getByRole("button", { name: new RegExp(`Step ${step.number}$`) }).click();
      await worksheet.locator("article:not([hidden])").getByRole("button", { name: "Work in code editor", exact: true }).click();
      await editorReady(old);
    };
    // Each run opens the page window; close it once checked, then wait for Run code to come back.
    const run = async () => {
      await page.getByRole("button", { name: /Run code/ }).click();
      await closePageWindow(page);
      await page.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      await checks.waitFor();
    };
    const week2 = weeks[1], steps2 = week2 ? stepsOf(week2) : [];
    const needs = (n) => !weeks[n - 1] && `Resume Week ${n} is not built yet`;

    await t.test("Week 2 Step 1: mismatch and uncaught error show a cross with Required and Your output, a failed page check shows what was found, then the sample passes", { skip: legacyOnly }, async () => {
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

    await t.test("Week 2: each next step opens, passes, the next part opens and the percentage moves", { skip: legacyOnly }, async () => {
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

    await t.test("Week 2: reload resumes at the next unfinished step, from the worksheet and the Module project button", { skip: legacyOnly }, async () => {
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

    await t.test("a preview that starts below the screen edge still reads the drawn page text, not the raw source", { skip: legacyOnly }, async () => {
      await page.setViewportSize({ width: 1500, height: 520 });
      try {
        await run();
        assert.equal(await checks.locator("li.failed").count(), 0);
        assert.equal(await checks.locator("li.passed").first().textContent(), "✓ Page text matches");
      } finally { await page.setViewportSize({ width: 1500, height: 1050 }); }
    });

    await t.test("teacher dashboard shows the web student's percentage and marks a media step done", { skip: legacyOnly }, async () => {
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

    await t.test("Module media (Cloudflare R2): the teacher adds each built week's media files once; every media step's sample then checks its pictures, sound and video automatically", { skip: needs(2) }, async (st) => {
      if (!(await mediaStorage(teacher.request, `/api/classrooms/${classroomId}/modules/${week2.id}/media`))) { st.skip("no media storage (Cloudflare R2) on this server; media steps stay teacher-checked"); return; }
      const report = [];
      for (const week of weeks.filter((module) => stepsOf(module).some((step) => /(?:^|\n)Media checks:/.test(step.expectedOutput)))) {
        const mediaRoot = join(folder, `Week_${String(week.week).padStart(2, "0")}`, "project_end");
        const mediaFiles = ["images", "audio", "video"].flatMap((kind) => existsSync(join(mediaRoot, kind)) ? readdirSync(join(mediaRoot, kind)).map((name) => `${kind}/${name}`) : []);
        assert.ok(mediaFiles.length, `teacher media not found in ${mediaRoot}`);
        const details = await teacher.newPage(); details.setDefaultTimeout(20000); details.on("pageerror", (e) => errors.push(e.message));
        await details.goto("/");
        await details.getByRole("button", { name: /Open class/ }).click();
        await details.getByRole("navigation", { name: "Teacher class navigation" }).getByRole("button", { name: /Curriculum/ }).click();
        await details.locator(".teacher-module-card", { hasText: week.title.replace(/^Self-Paced Module:\s*/, "") }).getByRole("button", { name: /View module details/ }).click();
        const section = details.getByRole("region", { name: "Media files" });
        await section.getByText("No media files yet.").waitFor();
        await section.getByLabel("Add media files").setInputFiles(mediaFiles.map((path) => join(mediaRoot, path)));
        await section.locator("li").nth(mediaFiles.length - 1).waitFor();
        assert.deepEqual((await section.locator("li").allTextContents()).map((line) => line.split(" · ")[0]).sort(), [...mediaFiles].sort());
        // Every media step's own sample now runs automatically in the teacher preview (Run waits for the media, CKB-080).
        const views = details.locator(".module-step");
        for (const [index, step] of stepsOf(week).entries()) {
          if (!/(?:^|\n)Media checks:/.test(step.expectedOutput)) continue;
          const view = views.nth(index), checks = view.locator(".web-checks");
          for (let attempt = 0; attempt < 20; attempt++) {
            await view.getByRole("button", { name: "Run", exact: true }).click();
            await closePageWindow(details);
            await checks.waitFor();
            await details.waitForFunction((element) => /✓|✗|Checked by your teacher/.test(element.textContent), await checks.elementHandle());
            if (!/Checked by your teacher/.test(await checks.textContent())) break;
            await details.waitForTimeout(500); // the teacher's media files are still loading
          }
          const failed = (await checks.locator("li.failed").allTextContents()).map((line) => line.replace(/^✗ /, ""));
          const media = (await checks.locator("li").allTextContents()).filter((line) => /: (?:image|playback)/.test(line)).length;
          report.push(`${step.id}: ${failed.length ? `fail — ${failed.join("; ")}` : `pass (page text + page checks + ${media} media lines)`}`);
        }
        await details.screenshot({ path: `/tmp/codeshare-web-media-teacher-w${week.week}.png`, fullPage: true });
        await details.close();
      }
      console.log(`Media steps with the teacher's media files:\n${report.join("\n")}`);
      t.diagnostic(report.join(" | "));
      assert.ok(report.length && report.every((line) => /: pass/.test(line)), report.join("\n"));
    });

    await t.test("sample-first weeks (Java workflow): every step of every built week verifies its unchanged sample, then completes its task with the answer in solutions/", { skip: !revised && "the teacher's weeks are not sample-first yet" }, async (st) => {
      const missing = weeks.flatMap((week) => stepsOf(week).filter((step) => !answerFiles(week, step)).map((step) => step.id));
      if (missing.length) { st.skip(`no task answer in solutions/ for ${missing.join(", ")}`); return; }
      const textarea = page.locator(".student-module-project .editor-card textarea");
      const feedback = page.locator(".module-run-feedback");
      const banner = (pattern) => page.waitForFunction((source) => new RegExp(source).test(document.querySelector(".module-run-feedback")?.textContent ?? ""), pattern.source);
      const why = async (expected) => [...(await checks.locator("li.failed").allTextContents()),
        ...(await checks.getByLabel("Your output").count() ? [firstDifference(expected, await checks.getByLabel("Your output").textContent())] : [])].join("; ");
      const lines = [];
      try {
        for (const week of weeks) {
          let reopen = true;
          for (const step of stepsOf(week)) {
            // The next week opens only after this one; after the teacher's Mark done the student reopens the module to see it.
            if (reopen) await openCatalog(week); else await openStep(step);
            reopen = false;
            const sample = step.files.find((file) => file.path === (step.run ?? "index.html")) ?? step.files[0];
            await page.waitForFunction((value) => document.querySelector(".student-module-project .editor-card textarea")?.value === value, sample.content);
            // No wait for the media here: Run code stays off until this device has them (CKB-080).
            // CKB-075: the very first sample also runs with the preview starting below the screen edge.
            if (!lines.length) await page.setViewportSize({ width: 1500, height: 520 });
            try { await run(); } finally { await page.setViewportSize({ width: 1500, height: 1050 }); }
            if (/Checked by your teacher for now/.test(await checks.textContent())) {
              // No media storage on this server (offline): the teacher marks the media step done.
              assert.equal((await teacher.request.put(`/api/classes/${classroomId}/students/${users[1].id}/modules/${week.id}/teacher-check`, { data: { stepId: step.id } })).status(), 200);
              lines.push(`${step.id}: teacher-checked (no media storage on this server), marked done`); reopen = true; continue;
            }
            await banner(/Sample verified|Sample not verified/);
            if (!/Sample verified/.test(await feedback.textContent())) { lines.push(`${step.id}: sample NOT verified — ${await why(step.expectedOutput)}`); break; }
            await page.waitForFunction(() => !document.querySelector(".student-module-project .editor-card textarea")?.readOnly);
            for (const file of answerFiles(week, step)) {
              const fileTab = page.locator(".student-module-project .file-tabs").getByRole("button", { name: file.path, exact: true });
              assert.equal(await fileTab.count(), 1, `${step.id}: answer file ${file.path} is not in the student's project`);
              await fileTab.dispatchEvent("click"); // the worksheet drawer may still cover the tabs
              await page.waitForFunction((path) => document.querySelector(".student-module-project .file-tab.active")?.textContent === path, file.path);
              await textarea.fill(file.content);
            }
            await run();
            await banner(/Completed — next activity unlocked|Not completed|Still showing sample output/);
            const done = /Completed — next activity unlocked/.test(await feedback.textContent()) && (await progress(week)).stepStates[activityStateId(step)] === "pass";
            lines.push(`${step.id}: ${done ? "sample verified, task completed" : `task NOT completed — ${await why(step.activity.expectedOutput)}`}`);
            if (!done) break;
          }
          if (lines.at(-1) && !/completed|marked done/.test(lines.at(-1))) break;
        }
      } finally {
        console.log(`Sample-first steps with the teacher's answers:\n${lines.join("\n")}`);
        t.diagnostic(lines.join(" | "));
      }
      assert.equal(lines.length, weeks.reduce((total, week) => total + stepsOf(week).length, 0), lines.join("\n"));
      assert.ok(lines.every((line) => /task completed|marked done/.test(line)), lines.join("\n"));
    });

    await t.test("Week 2 personal performance-task project (Slice 2): HTML editor and page preview, run, submit, 100%; the teacher reviews the frozen page", { skip: needs(2) }, async () => {
      const submit = page.getByRole("button", { name: "Submit this version", exact: true });
      const ready = page.getByText("Run succeeded — ready to submit this version.", { exact: false });
      const runPage = async () => {
        await page.getByRole("button", { name: /Run code/ }).click();
        await closePageWindow(page);
        await page.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      };
      const starter = week2.performanceTask.starterFiles[0].content;
      assert.match(starter, /<\/body>/);
      const mine = starter.replace("Write a short introduction about yourself here.", "I am a Grade 11 student who likes drawing posters.");
      assert.notEqual(mine, starter);
      const card = week2.title.replace(/^Self-Paced Module:\s*/, "");
      // Online, the student adds a teacher-supplied picture under Media files; offline the personal project is text only.
      const withMedia = await mediaStorage(student.request, `/api/classrooms/${classroomId}/modules/${week2.id}/media`);
      const picture = join(folder, "Week_02", "teacher_pictures", "resume_picture_1.svg");
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
      let last = `${mine}\n<!-- changed -->`;
      await editor.fill(last);
      assert.equal(await submit.isDisabled(), true, "an edit after the run needs a new run");
      if (withMedia) {
        const box = page.locator(".student-module-project").getByRole("region", { name: "Media files" });
        await box.getByText("No media files yet.").waitFor();
        await box.getByLabel("Add media files").setInputFiles(picture);
        await box.getByText("images/resume_picture_1.svg").waitFor();
        last = last.replace("images/my_picture.jpg", "images/resume_picture_1.svg");
        await editor.fill(last);
      }
      await page.getByRole("button", { name: /Run code/ }).click();
      const inside = await (await page.locator(".page-window .module-web-preview iframe").elementHandle()).contentFrame();
      await inside.waitForFunction(() => document.querySelector("img")?.complete);
      assert.deepEqual(await inside.evaluate(() => { const img = document.querySelector("img"); return [img.getAttribute("data-codeshare-src") ?? img.getAttribute("src"), img.naturalWidth > 0]; }),
        withMedia ? ["images/resume_picture_1.svg", true] : ["images/my_picture.jpg", false], "the personal picture shows online; offline it is not there");
      await closePageWindow(page);
      await page.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      await ready.waitFor();
      await submit.click();
      await page.locator(".actionbar .sync", { hasText: /^Submitted$/ }).waitFor();
      await page.getByRole("alertdialog", { name: "Version submitted" }).getByRole("button", { name: "OK" }).click();
      const saved = await progress(week2);
      assert.equal(saved.percent, 100);
      assert.equal(saved.performanceTask.own.files[0].content, last);
      assert.deepEqual((saved.performanceTask.own.media ?? []).map((item) => item.path), withMedia ? ["images/resume_picture_1.svg"] : []);
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
      assert.match(await review.locator(".teacher-module-card", { hasText: card }).textContent(), /100%/);
      await review.getByRole("button", { name: "Review personal submission" }).click();
      const frozen = review.locator(".student-module-project").getByRole("textbox", { name: "HTML source code editor", exact: true });
      await frozen.waitFor(); assert.equal(await frozen.getAttribute("readonly"), "");
      assert.match(await frozen.inputValue(), /drawing posters/);
      assert.equal(await review.getByRole("button", { name: "Save work", exact: true }).count(), 0);
      assert.equal(await review.getByLabel("Program input").count(), 0);
      await review.mouse.click(1200, 400);
      await review.getByRole("button", { name: /Run code/ }).click();
      await review.locator(".page-window .module-web-preview iframe").waitFor({ state: "attached" });
      await review.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      assert.deepEqual(await progress(week2), saved, "teacher runs never change the student's progress");
      await review.screenshot({ path: "/tmp/codeshare-web-personal-review.png", fullPage: true });
      await review.close();
    });

    await t.test("Week 3 personal project: the Week 2 resume carries forward; the student adds projects.html and contact.html with ＋ and, online, their own sound and video; Run shows them; Submit freezes pages and media; the teacher's review shows them", { skip: needs(3) }, async () => {
      const week3 = weeks[2], steps3 = stepsOf(week3);
      const withMedia = await mediaStorage(student.request, `/api/classrooms/${classroomId}/modules/${week3.id}/media`);
      const mediaRoot = join(folder, "Week_03", "project_end");
      const own = ["audio/greeting.wav", "video/juan_intro.webm"]; // stand-ins for the student's own sound and video
      // The module steps are checked elsewhere; mark them done so the personal task opens.
      const states = (await progress(week3)).stepStates;
      assert.equal((await admin.from("module_progress").update({ step_states: { ...states, ...Object.fromEntries(steps3.map((step) => [activityStateId(step), "pass"])) } })
        .eq("student_id", users[1].id).eq("classroom_id", classroomId).eq("module_id", week3.id)).error, null);
      const submit = page.getByRole("button", { name: "Submit this version", exact: true });
      const ready = page.getByText("Run succeeded — ready to submit this version.", { exact: false });
      const runPage = async () => {
        if (await page.locator(".page-window").count()) await closePageWindow(page);
        await page.getByRole("button", { name: /Run code/ }).click();
        await page.locator(".page-window .module-web-preview iframe").waitFor({ state: "attached" });
        await page.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      };
      // What the page window shows: each picture, sound and video, whether it came with the page (data:) and whether pictures draw.
      const shownMedia = async (where) => {
        const inside = await (await where.locator(".page-window .module-web-preview iframe").elementHandle()).contentFrame();
        await inside.waitForFunction(() => [...document.querySelectorAll("img")].every((img) => img.complete) && [...document.querySelectorAll("audio,video")].every((media) => media.readyState >= 2 || !media.src.startsWith("data:")));
        return inside.evaluate(() => [...document.querySelectorAll("img,audio,video")].map((element) => `${element.getAttribute("data-codeshare-src") ?? element.getAttribute("src")}: ${element.src.startsWith("data:") ? "from the page" : "not found"}${element.tagName === "IMG" ? `, ${element.naturalWidth > 0 ? "drawn" : "broken"}` : ""}`));
      };
      const fileTab = (path) => page.locator(".student-module-project .file-tabs").getByRole("button", { name: path, exact: true });
      const write = async (path, content) => {
        await fileTab(path).dispatchEvent("click");
        await page.waitForFunction((value) => document.querySelector(".student-module-project .file-tab.active")?.textContent === value, path);
        await editor.fill(content);
      };
      const addPage = async (path, content) => {
        await page.getByRole("button", { name: "Add personal web file", exact: true }).click();
        await page.getByLabel("File path").fill(path);
        await page.getByRole("button", { name: "Create file", exact: true }).click();
        await fileTab(path).waitFor();
        await write(path, content);
      };
      const starter = Object.fromEntries(week3.performanceTask.starterFiles.map((file) => [file.path, file.content]));
      const week2Own = (await progress(weeks[1])).performanceTask.own;
      const carried = week2Own.files.find((file) => file.path === "index.html").content;
      await openCatalog(week3);
      await page.getByRole("button", { name: "Projects", exact: true }).hover();
      await page.locator("#classroom-projects").getByRole("button", { name: "Personal performance-task project", exact: true }).click();
      await page.waitForFunction(() => document.getElementById("classroom-projects")?.dataset.open === "false");
      // Linked weeks carry the Week 2 submission forward: its page, and online its picture.
      await page.waitForFunction((value) => document.querySelector(".student-module-project .editor-card textarea")?.value === value, carried);
      const box = page.locator(".student-module-project").getByRole("region", { name: "Media files" });
      if (withMedia) assert.deepEqual((await box.locator("li").allTextContents()).map((line) => line.split(" · ")[0]), (week2Own.media ?? []).map((item) => item.path));
      const nav = '  <nav><a href="index.html">Home</a> | <a href="projects.html">Projects</a> | <a href="contact.html">Contact</a></nav>\n';
      let index = carried.replace("<body>\n", `<body>\n${nav}`);
      assert.notEqual(index, carried);
      if (withMedia) {
        await box.getByLabel("Add media files").setInputFiles(join(mediaRoot, own[0]));
        await box.getByText(own[0]).waitFor();
        index = index.replace("</body>", `  <audio src="${own[0]}" controls></audio>\n  <video src="${own[1]}" controls width="320"></video>\n</body>`);
      }
      await write("index.html", index);
      const pages = { "projects.html": starter["projects.html"].replace("Write a school project here", "Science poster about clean water"),
        "contact.html": starter["contact.html"] };
      for (const [path, content] of Object.entries(pages)) await addPage(path, content);
      await runPage();
      await ready.waitFor();
      const picture = (week2Own.media ?? []).map((item) => `${item.path}: from the page, drawn`);
      // Offline there are no media: the carried picture is not found either.
      assert.deepEqual(await shownMedia(page), withMedia ? [...picture, `${own[0]}: from the page`, `${own[1]}: not found`] : [`${carried.match(/<img src="([^"]+)"/)[1]}: not found, broken`]);
      if (withMedia) {
        await box.getByLabel("Add media files").setInputFiles(join(mediaRoot, own[1]));
        await box.getByText(own[1]).waitFor();
        await page.getByText("Run the current files successfully before submitting.", { exact: false }).waitFor();
        assert.equal(await submit.isDisabled(), true, "adding a media file needs a new run before submitting");
        await runPage();
        await ready.waitFor();
        assert.deepEqual(await shownMedia(page), [...picture, `${own[0]}: from the page`, `${own[1]}: from the page`]);
      }
      await page.locator(".page-window .module-web-preview").screenshot({ path: "/tmp/codeshare-web-student-week3.png" });
      await closePageWindow(page);
      await submit.click();
      await page.locator(".actionbar .sync", { hasText: /^Submitted$/ }).waitFor();
      await page.getByRole("alertdialog", { name: "Version submitted" }).getByRole("button", { name: "OK" }).click();
      const saved = await progress(week3);
      assert.equal(saved.percent, 100);
      assert.deepEqual(Object.fromEntries(saved.performanceTask.own.files.map((file) => [file.path, file.content])), { "index.html": index, ...pages });
      assert.deepEqual((saved.performanceTask.own.media ?? []).map((item) => item.path), withMedia ? [...(week2Own.media ?? []).map((item) => item.path), ...own] : []);

      const review = await teacher.newPage(); review.setDefaultTimeout(20000); review.on("pageerror", (e) => errors.push(e.message));
      await review.goto("/");
      await review.getByRole("button", { name: /Open class/ }).click();
      await review.getByRole("button", { name: /^Students/ }).click();
      await review.getByRole("button", { name: /Open Web student.*progress/ }).click();
      await review.locator(".teacher-module-card", { hasText: week3.title.replace(/^Self-Paced Module:\s*/, "") }).getByRole("button", { name: "Review personal submission" }).click();
      await review.locator(".student-module-project").getByRole("textbox", { name: "HTML source code editor", exact: true }).waitFor();
      assert.deepEqual(await review.locator(".student-module-project .file-tabs .file-tab").allTextContents(), ["index.html", "projects.html", "contact.html"]);
      assert.equal(await review.locator(".student-module-project").getByRole("region", { name: "Media files" }).count(), 0, "the review cannot add or remove media");
      await review.mouse.click(1200, 400);
      await review.getByRole("button", { name: /Run code/ }).click();
      if (withMedia) assert.deepEqual(await shownMedia(review), [...picture, `${own[0]}: from the page`, `${own[1]}: from the page`], "the review shows the student's submitted media");
      await review.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      assert.deepEqual(await progress(week3), saved, "teacher runs never change the student's progress");
      await review.locator(".page-window .module-web-preview").screenshot({ path: "/tmp/codeshare-web-student-week3-review.png" });
      await review.close();
    });

    await t.test("Week 4 personal project: the Week 3 site carries forward; the student adds styles.css with ＋ and links it from every page; Run shows the styled page; Submit freezes styles.css; the teacher's review shows the same styles", { skip: needs(4) }, async () => {
      const week4 = weeks[3], steps4 = stepsOf(week4);
      // The module steps are checked elsewhere; mark them done so the personal task opens.
      const states = (await progress(week4)).stepStates;
      assert.equal((await admin.from("module_progress").update({ step_states: { ...states, ...Object.fromEntries(steps4.map((step) => [activityStateId(step), "pass"])) } })
        .eq("student_id", users[1].id).eq("classroom_id", classroomId).eq("module_id", week4.id)).error, null);
      const textarea = page.locator(".student-module-project .editor-card textarea"); // HTML or CSS editor
      const submit = page.getByRole("button", { name: "Submit this version", exact: true });
      const ready = page.getByText("Run succeeded — ready to submit this version.", { exact: false });
      const fileTab = (path) => page.locator(".student-module-project .file-tabs").getByRole("button", { name: path, exact: true });
      const write = async (path, content) => {
        await fileTab(path).dispatchEvent("click");
        await page.waitForFunction((value) => document.querySelector(".student-module-project .file-tab.active")?.textContent === value, path);
        await textarea.fill(content);
      };
      // What the page window shows: the navigation's page text, the h1 colour and the class's background, read from the page itself.
      const styled = async (where) => {
        const inside = await (await where.locator(".page-window .module-web-preview iframe").elementHandle()).contentFrame();
        await inside.waitForFunction(() => document.readyState === "complete" && document.querySelector("nav"));
        return inside.evaluate(() => [document.querySelector("nav").innerText, getComputedStyle(document.querySelector("h1")).color,
          getComputedStyle(document.querySelector(".highlight")).backgroundColor, getComputedStyle(document.getElementById("about")).fontStyle]);
      };
      const week3Own = (await progress(weeks[2])).performanceTask.own;
      const carried = Object.fromEntries(week3Own.files.map((file) => [file.path, file.content]));
      await openCatalog(week4);
      await page.getByRole("button", { name: "Projects", exact: true }).hover();
      await page.locator("#classroom-projects").getByRole("button", { name: "Personal performance-task project", exact: true }).click();
      await page.waitForFunction(() => document.getElementById("classroom-projects")?.dataset.open === "false");
      // Linked weeks carry the Week 3 submission forward: all its pages.
      await page.waitForFunction((value) => document.querySelector(".student-module-project .editor-card textarea")?.value === value, carried["index.html"]);
      assert.deepEqual((await page.locator(".student-module-project .file-tabs .file-tab").allTextContents()).sort(), Object.keys(carried).sort());
      const css = "/* My resume: one stylesheet for all my pages */\n\n/* Element selectors */\nh1 {\n  color: #13305c;\n}\nnav {\n  text-transform: uppercase;\n}\n\n"
        + "/* Class selector */\n.highlight {\n  background-color: #fff3c4;\n}\n\n/* ID selector */\n#about {\n  font-style: italic;\n}\n";
      await page.getByRole("button", { name: "Add personal web file", exact: true }).click();
      await page.getByLabel("File path").fill("styles.css");
      await page.getByRole("button", { name: "Create file", exact: true }).click();
      await fileTab("styles.css").waitFor();
      await write("styles.css", css);
      const link = '  <link rel="stylesheet" href="styles.css">\n';
      const pages = Object.fromEntries(Object.entries(carried).map(([path, content]) => [path, content.replace("</title>\n", `</title>\n${link}`)]));
      pages["index.html"] = pages["index.html"].replace("<p>", '<p id="about">').replace("<h2>", '<h2 class="highlight">');
      pages["projects.html"] = pages["projects.html"].replace("<li>", '<li class="highlight">');
      for (const path of Object.keys(carried)) { assert.notEqual(pages[path], carried[path], path); await write(path, pages[path]); }
      await page.getByRole("button", { name: /Run code/ }).click();
      await page.locator(".page-window .module-web-preview iframe").waitFor({ state: "attached" });
      await page.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      await ready.waitFor();
      const looks = ["HOME | PROJECTS | CONTACT", "rgb(19, 48, 92)", "rgb(255, 243, 196)", "italic"];
      assert.deepEqual(await styled(page), looks, "styles.css reaches the page: capitals in the page text, colours and the italic id");
      await page.locator(".page-window .module-web-preview").screenshot({ path: "/tmp/codeshare-web-student-week4.png" });
      await closePageWindow(page);
      await submit.click();
      await page.locator(".actionbar .sync", { hasText: /^Submitted$/ }).waitFor();
      await page.getByRole("alertdialog", { name: "Version submitted" }).getByRole("button", { name: "OK" }).click();
      const saved = await progress(week4);
      assert.equal(saved.percent, 100);
      assert.deepEqual(Object.fromEntries(saved.performanceTask.own.files.map((file) => [file.path, file.content])), { ...pages, "styles.css": css });
      assert.deepEqual((saved.performanceTask.own.media ?? []).map((item) => item.path), (week3Own.media ?? []).map((item) => item.path), "the Week 3 media carry forward");

      const review = await teacher.newPage(); review.setDefaultTimeout(20000); review.on("pageerror", (e) => errors.push(e.message));
      await review.goto("/");
      await review.getByRole("button", { name: /Open class/ }).click();
      await review.getByRole("button", { name: /^Students/ }).click();
      await review.getByRole("button", { name: /Open Web student.*progress/ }).click();
      await review.locator(".teacher-module-card", { hasText: week4.title.replace(/^Self-Paced Module:\s*/, "") }).getByRole("button", { name: "Review personal submission" }).click();
      await review.locator(".student-module-project .editor-card textarea").waitFor();
      assert.deepEqual((await review.locator(".student-module-project .file-tabs .file-tab").allTextContents()).sort(), [...Object.keys(pages), "styles.css"].sort());
      await review.mouse.click(1200, 400);
      await review.getByRole("button", { name: /Run code/ }).click();
      await review.locator(".page-window .module-web-preview iframe").waitFor({ state: "attached" });
      assert.deepEqual(await styled(review), looks, "the review runs the frozen pages with the frozen styles.css");
      await review.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      assert.deepEqual(await progress(week4), saved, "teacher runs never change the student's progress");
      await review.close();
    });

    await t.test("Week 5 personal project: the Week 4 site carries forward; the student adds font lists and a gradient h1 with white capitals to styles.css; Run shows them on index.html and, through the Projects link, on projects.html; Submit freezes styles.css; the teacher's review shows the same styles", { skip: needs(5) }, async () => {
      const week5 = weeks[4], steps5 = stepsOf(week5);
      // The module steps are checked elsewhere; mark them done so the personal task opens.
      const states = (await progress(week5)).stepStates;
      assert.equal((await admin.from("module_progress").update({ step_states: { ...states, ...Object.fromEntries(steps5.map((step) => [activityStateId(step), "pass"])) } })
        .eq("student_id", users[1].id).eq("classroom_id", classroomId).eq("module_id", week5.id)).error, null);
      const textarea = page.locator(".student-module-project .editor-card textarea");
      const fileTab = (path) => page.locator(".student-module-project .file-tabs").getByRole("button", { name: path, exact: true });
      // What the page window shows, read from the page itself: its title, whether the h1's page text is in capitals, and
      // computed styles. notTitle: wait until a link has replaced that page.
      const looks = async (where, notTitle) => {
        for (const until = Date.now() + 15000; Date.now() < until; await where.waitForTimeout(100)) {
          const inside = await (await where.locator(".page-window .module-web-preview iframe").elementHandle())?.contentFrame();
          const seen = await inside?.evaluate(() => {
            const h1 = document.querySelector("h1"), style = h1 && getComputedStyle(h1);
            return document.readyState === "complete" && h1 ? [document.title, h1.innerText === h1.textContent.trim().toUpperCase(), style.backgroundImage,
              style.color, style.fontFamily, getComputedStyle(document.body).fontFamily, getComputedStyle(document.body).lineHeight] : null;
          }).catch(() => null);
          if (seen && seen[0] !== notTitle) return seen;
        }
        assert.fail(`the page window did not show a page other than ${notTitle}`);
      };
      const styled = (title) => [title, true, "linear-gradient(to right, rgb(19, 48, 92), rgb(138, 28, 85))", "rgb(255, 255, 255)",
        'Georgia, "Times New Roman", serif', "Verdana, Tahoma, sans-serif", "24px"];
      const week4Own = (await progress(weeks[3])).performanceTask.own;
      const carried = Object.fromEntries(week4Own.files.map((file) => [file.path, file.content]));
      const title = (path) => carried[path].match(/<title>(.*)<\/title>/)[1];
      await openCatalog(week5);
      await page.getByRole("button", { name: "Projects", exact: true }).hover();
      await page.locator("#classroom-projects").getByRole("button", { name: "Personal performance-task project", exact: true }).click();
      await page.waitForFunction(() => document.getElementById("classroom-projects")?.dataset.open === "false");
      // Linked weeks carry the Week 4 submission forward: its pages and styles.css.
      await page.waitForFunction((value) => document.querySelector(".student-module-project .editor-card textarea")?.value === value, carried["index.html"]);
      assert.deepEqual((await page.locator(".student-module-project .file-tabs .file-tab").allTextContents()).sort(), Object.keys(carried).sort());
      const css = carried["styles.css"] + "\n/* Readable text: a font list ending in a generic family, and space between lines */\nbody {\n"
        + "  font-family: Verdana, Tahoma, sans-serif;\n  line-height: 1.5;\n}\n\n/* Gradient header: white capitals on navy to maroon (8.8:1 or more) */\nh1 {\n"
        + "  font-family: Georgia, \"Times New Roman\", serif;\n  color: #ffffff;\n  text-transform: uppercase;\n"
        + "  background-image: linear-gradient(to right, #13305c, #8a1c55);\n  text-align: center;\n}\n";
      await fileTab("styles.css").dispatchEvent("click");
      await page.waitForFunction(() => document.querySelector(".student-module-project .file-tab.active")?.textContent === "styles.css");
      await textarea.fill(css);
      await page.getByRole("button", { name: /Run code/ }).click();
      await page.locator(".page-window .module-web-preview iframe").waitFor({ state: "attached" });
      await page.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      await page.getByText("Run succeeded — ready to submit this version.", { exact: false }).waitFor();
      assert.deepEqual(await looks(page), styled(title("index.html")), "styles.css reaches index.html: fonts, the gradient, white text and capitals in the page text");
      // The Projects link opens projects.html in the same page window, with the same stylesheet (CodeRabbit on PR #87).
      const frame = await (await page.locator(".page-window .module-web-preview iframe").elementHandle()).contentFrame();
      await frame.locator('nav a[href="projects.html"]').click();
      assert.deepEqual(await looks(page, title("index.html")), styled(title("projects.html")), "styles.css reaches the linked projects.html too");
      await page.locator(".page-window .module-web-preview").screenshot({ path: "/tmp/codeshare-web-student-week5.png" });
      await closePageWindow(page);
      await page.getByRole("button", { name: "Submit this version", exact: true }).click();
      await page.locator(".actionbar .sync", { hasText: /^Submitted$/ }).waitFor();
      await page.getByRole("alertdialog", { name: "Version submitted" }).getByRole("button", { name: "OK" }).click();
      const saved = await progress(week5);
      assert.equal(saved.percent, 100);
      assert.deepEqual(Object.fromEntries(saved.performanceTask.own.files.map((file) => [file.path, file.content])), { ...carried, "styles.css": css });
      assert.deepEqual((saved.performanceTask.own.media ?? []).map((item) => item.path), (week4Own.media ?? []).map((item) => item.path), "the Week 4 media carry forward");

      const review = await teacher.newPage(); review.setDefaultTimeout(20000); review.on("pageerror", (e) => errors.push(e.message));
      await review.goto("/");
      await review.getByRole("button", { name: /Open class/ }).click();
      await review.getByRole("button", { name: /^Students/ }).click();
      await review.getByRole("button", { name: /Open Web student.*progress/ }).click();
      await review.locator(".teacher-module-card", { hasText: week5.title.replace(/^Self-Paced Module:\s*/, "") }).getByRole("button", { name: "Review personal submission" }).click();
      await review.locator(".student-module-project .editor-card textarea").waitFor();
      await review.mouse.click(1200, 400);
      await review.getByRole("button", { name: /Run code/ }).click();
      await review.locator(".page-window .module-web-preview iframe").waitFor({ state: "attached" });
      assert.deepEqual(await looks(review), styled(title("index.html")), "the review runs the frozen pages with the frozen styles.css");
      await review.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      assert.deepEqual(await progress(week5), saved, "teacher runs never change the student's progress");
      await review.close();
    });

    await t.test("Week 6 personal project: the Week 5 site carries forward; the student turns the nav into a list on every page and adds padding, a border, margins and nav link styles to styles.css; Run shows the nav bar on one line and the box values on index.html and, through the Projects link, on projects.html; Submit freezes the pages and styles.css; the teacher's review shows the same", { skip: needs(6) }, async () => {
      const week6 = weeks[5], steps6 = stepsOf(week6);
      // The module steps are checked elsewhere; mark them done so the personal task opens.
      const states = (await progress(week6)).stepStates;
      assert.equal((await admin.from("module_progress").update({ step_states: { ...states, ...Object.fromEntries(steps6.map((step) => [activityStateId(step), "pass"])) } })
        .eq("student_id", users[1].id).eq("classroom_id", classroomId).eq("module_id", week6.id)).error, null);
      const textarea = page.locator(".student-module-project .editor-card textarea");
      const fileTab = (path) => page.locator(".student-module-project .file-tabs").getByRole("button", { name: path, exact: true });
      const write = async (path, content) => {
        await fileTab(path).dispatchEvent("click");
        await page.waitForFunction((value) => document.querySelector(".student-module-project .file-tab.active")?.textContent === value, path);
        await textarea.fill(content);
      };
      // What the page window shows, read from the page itself: its title, the nav's page text, then computed box, list and link
      // styles. No border width: the page window follows the text-size zoom, so 2px reads 1.73913px (CKB-097). notTitle: wait
      // until a link has replaced that page.
      const looks = async (where, notTitle) => {
        for (const until = Date.now() + 15000; Date.now() < until; await where.waitForTimeout(100)) {
          const inside = await (await where.locator(".page-window .module-web-preview iframe").elementHandle())?.contentFrame();
          const seen = await inside?.evaluate(() => {
            const at = (selector) => document.querySelector(selector) && getComputedStyle(document.querySelector(selector));
            const h2 = at("h2"), ul = at("nav ul"), li = at("nav li"), a = at("nav a");
            return document.readyState === "complete" && h2 && li ? [document.title, document.querySelector("nav").innerText.trim(), ul.listStyleType, ul.paddingLeft,
              li.display, li.marginRight, a.color, a.backgroundColor, a.paddingLeft, a.textDecorationLine,
              h2.borderBottomStyle, h2.borderBottomColor, h2.paddingBottom, h2.marginTop] : null;
          }).catch(() => null);
          if (seen && seen[0] !== notTitle) return seen;
        }
        assert.fail(`the page window did not show a page other than ${notTitle}`);
      };
      const styled = (title) => [title, "HOME PROJECTS CONTACT", "none", "0px", "inline-block", "8px", "rgb(255, 255, 255)", "rgb(19, 48, 92)", "12px", "none",
        "solid", "rgb(19, 48, 92)", "6px", "36px"];
      const week5Own = (await progress(weeks[4])).performanceTask.own;
      const carried = Object.fromEntries(week5Own.files.map((file) => [file.path, file.content]));
      const title = (path) => carried[path].match(/<title>(.*)<\/title>/)[1];
      await openCatalog(week6);
      await page.getByRole("button", { name: "Projects", exact: true }).hover();
      await page.locator("#classroom-projects").getByRole("button", { name: "Personal performance-task project", exact: true }).click();
      await page.waitForFunction(() => document.getElementById("classroom-projects")?.dataset.open === "false");
      // Linked weeks carry the Week 5 submission forward: its pages and styles.css.
      await page.waitForFunction((value) => document.querySelector(".student-module-project .editor-card textarea")?.value === value, carried["index.html"]);
      assert.deepEqual((await page.locator(".student-module-project .file-tabs .file-tab").allTextContents()).sort(), Object.keys(carried).sort());
      // The nav becomes a list of links on every page, each li on its own line.
      const oldNav = '<nav><a href="index.html">Home</a> | <a href="projects.html">Projects</a> | <a href="contact.html">Contact</a></nav>';
      const newNav = '<nav>\n    <ul>\n      <li><a href="index.html">Home</a></li>\n      <li><a href="projects.html">Projects</a></li>\n'
        + '      <li><a href="contact.html">Contact</a></li>\n    </ul>\n  </nav>';
      const pages = Object.fromEntries(Object.entries(carried).filter(([path]) => path.endsWith(".html")).map(([path, content]) => [path, content.replace(oldNav, newNav)]));
      for (const path of Object.keys(pages)) { assert.notEqual(pages[path], carried[path], path); await write(path, pages[path]); }
      const css = carried["styles.css"] + "\n/* Box model: room and a line under every section heading */\nh2 {\n  border-bottom: 2px solid #13305c;\n"
        + "  padding-bottom: 0.25em;\n  margin-top: 1.5em;\n}\n\n/* Lists: the nav list with no bullets and no indent, its items on one line */\nnav ul {\n"
        + "  list-style-type: none;\n  margin: 0;\n  padding: 0;\n}\nnav li {\n  margin-right: 0.5em;\n  display: inline-block;\n}\n\n"
        + "/* Links in nav, in state order: white on navy, maroon under the mouse or the keyboard */\nnav a:link, nav a:visited {\n  color: #ffffff;\n"
        + "  background-color: #13305c;\n  padding: 0.25em 0.75em;\n  text-decoration: none;\n}\nnav a:hover, nav a:focus {\n  background-color: #8a1c55;\n}\n";
      await write("styles.css", css);
      await page.getByRole("button", { name: /Run code/ }).click();
      await page.locator(".page-window .module-web-preview iframe").waitFor({ state: "attached" });
      await page.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      await page.getByText("Run succeeded — ready to submit this version.", { exact: false }).waitFor();
      assert.deepEqual(await looks(page), styled(title("index.html")), "index.html: the nav list is one line of white-on-navy links; h2 has its line, padding and margin");
      // The Projects link opens projects.html in the same page window, with the same stylesheet.
      const frame = await (await page.locator(".page-window .module-web-preview iframe").elementHandle()).contentFrame();
      await frame.locator('nav a[href="projects.html"]').click();
      assert.deepEqual(await looks(page, title("index.html")), styled(title("projects.html")), "styles.css reaches the linked projects.html too");
      await page.locator(".page-window .module-web-preview").screenshot({ path: "/tmp/codeshare-web-student-week6.png" });
      await closePageWindow(page);
      await page.getByRole("button", { name: "Submit this version", exact: true }).click();
      await page.locator(".actionbar .sync", { hasText: /^Submitted$/ }).waitFor();
      await page.getByRole("alertdialog", { name: "Version submitted" }).getByRole("button", { name: "OK" }).click();
      const saved = await progress(week6);
      assert.equal(saved.percent, 100);
      assert.deepEqual(Object.fromEntries(saved.performanceTask.own.files.map((file) => [file.path, file.content])), { ...pages, "styles.css": css });
      assert.deepEqual((saved.performanceTask.own.media ?? []).map((item) => item.path), (week5Own.media ?? []).map((item) => item.path), "the Week 5 media carry forward");

      const review = await teacher.newPage(); review.setDefaultTimeout(20000); review.on("pageerror", (e) => errors.push(e.message));
      await review.goto("/");
      await review.getByRole("button", { name: /Open class/ }).click();
      await review.getByRole("button", { name: /^Students/ }).click();
      await review.getByRole("button", { name: /Open Web student.*progress/ }).click();
      await review.locator(".teacher-module-card", { hasText: week6.title.replace(/^Self-Paced Module:\s*/, "") }).getByRole("button", { name: "Review personal submission" }).click();
      await review.locator(".student-module-project .editor-card textarea").waitFor();
      await review.mouse.click(1200, 400);
      await review.getByRole("button", { name: /Run code/ }).click();
      await review.locator(".page-window .module-web-preview iframe").waitFor({ state: "attached" });
      assert.deepEqual(await looks(review), styled(title("index.html")), "the review runs the frozen pages with the frozen styles.css");
      await review.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      assert.deepEqual(await progress(week6), saved, "teacher runs never change the student's progress");
      await review.close();
    });

    await t.test("Week 7 personal project: the Week 6 site carries forward; online the student adds three teacher gallery pictures under Media files; a floated gallery with captions and an absolutely positioned ribbon in styles.css; Run shows the captions and ribbon on their own lines, the computed position and float, and each picture drawn (offline: not found, and the run still succeeds); Submit freezes them; the teacher's review shows the same", { skip: needs(7) }, async () => {
      const week7 = weeks[6], steps7 = stepsOf(week7);
      const withMedia = await mediaStorage(student.request, `/api/classrooms/${classroomId}/modules/${week7.id}/media`);
      const pictures = ["images/gallery_project.svg", "images/gallery_certificate.svg", "images/gallery_activity.svg"]; // the teacher's pictures for students with none
      // The module steps are checked elsewhere; mark them done so the personal task opens.
      const states = (await progress(week7)).stepStates;
      assert.equal((await admin.from("module_progress").update({ step_states: { ...states, ...Object.fromEntries(steps7.map((step) => [activityStateId(step), "pass"])) } })
        .eq("student_id", users[1].id).eq("classroom_id", classroomId).eq("module_id", week7.id)).error, null);
      const textarea = page.locator(".student-module-project .editor-card textarea");
      const fileTab = (path) => page.locator(".student-module-project .file-tabs").getByRole("button", { name: path, exact: true });
      const write = async (path, content) => {
        await fileTab(path).dispatchEvent("click");
        await page.waitForFunction((value) => document.querySelector(".student-module-project .file-tab.active")?.textContent === value, path);
        await textarea.fill(content);
      };
      // What the page window shows, read from the page itself: the page text lines of the h1 and the gallery, the computed position,
      // offsets, z-index and float (offsets only as set in px; none follows the window), and each gallery picture: whether it came
      // with the page (data:) and whether it draws. Personal runs show no Media checks lines (CodeRabbit on PR #89), so the page is read.
      const captions = ["My science project", "My certificate", "Our club activity"];
      const looks = async (where) => {
        const inside = await (await where.locator(".page-window .module-web-preview iframe").elementHandle()).contentFrame();
        await inside.waitForFunction(() => document.readyState === "complete" && [...document.querySelectorAll("img")].every((img) => img.complete));
        return inside.evaluate((captions) => {
          const at = (selector) => getComputedStyle(document.querySelector(selector));
          const ribbon = at(".ribbon"), h1 = at("h1"), figure = at(".gallery figure");
          const lines = document.body.innerText.split("\n").filter((line) => captions.includes(line));
          return [document.querySelector("h1").innerText.split("\n").slice(1), lines, ribbon.position, ribbon.top, ribbon.right, ribbon.zIndex, h1.position, figure.float, figure.width, figure.position,
            ...[...document.querySelectorAll(".gallery img")].map((img) => `${img.getAttribute("data-codeshare-src") ?? img.getAttribute("src")}: ${img.src.startsWith("data:") ? "from the page" : "not found"}, ${img.naturalWidth > 0 ? "drawn" : "broken"}`)];
        }, captions);
      };
      const week6Own = (await progress(weeks[5])).performanceTask.own;
      const carried = Object.fromEntries(week6Own.files.map((file) => [file.path, file.content]));
      await openCatalog(week7);
      await page.getByRole("button", { name: "Projects", exact: true }).hover();
      await page.locator("#classroom-projects").getByRole("button", { name: "Personal performance-task project", exact: true }).click();
      await page.waitForFunction(() => document.getElementById("classroom-projects")?.dataset.open === "false");
      // Linked weeks carry the Week 6 submission forward: its pages and styles.css.
      await page.waitForFunction((value) => document.querySelector(".student-module-project .editor-card textarea")?.value === value, carried["index.html"]);
      assert.deepEqual((await page.locator(".student-module-project .file-tabs .file-tab").allTextContents()).sort(), Object.keys(carried).sort());
      const box = page.locator(".student-module-project").getByRole("region", { name: "Media files" });
      if (withMedia) for (const picture of pictures) {
        await box.getByLabel("Add media files").setInputFiles(join(folder, "Week_07", "teacher_pictures", picture.slice("images/".length)));
        await box.getByText(picture).waitFor();
      }
      const gallery = '  <h2>My gallery</h2>\n  <div class="gallery">\n' + pictures.map((src, i) => `    <figure>\n      <img src="${src}" alt="A drawing for my gallery" `
        + `width="160" height="110">\n      <figcaption>${captions[i]}</figcaption>\n    </figure>\n`).join("") + "  </div>\n";
      const index = carried["index.html"].replace("</h1>", ' <span class="ribbon">ICT strand</span></h1>').replace("</body>", gallery + "</body>");
      assert.equal(index.split('class="ribbon"').length, 2); assert.notEqual(index, carried["index.html"]);
      await write("index.html", index);
      const css = carried["styles.css"] + "\n/* Position: my h1 is the reference box; the ribbon sits in its top-right corner, above it */\nh1 {\n  position: relative;\n}\n"
        + ".ribbon {\n  position: absolute;\n  top: 8px;\n  right: 8px;\n  z-index: 1;\n  font-size: 12px;\n  color: #222222;\n  background-color: #fff3c4;\n}\n"
        + "\n/* Float: my gallery's figures side by side */\n.gallery figure {\n  float: left;\n  width: 170px;\n  margin: 0 12px 12px 0;\n}\n"
        + ".gallery img {\n  width: 160px;\n  height: 110px;\n}\nh2 {\n  clear: both;\n}\n";
      await write("styles.css", css);
      await page.getByRole("button", { name: /Run code/ }).click();
      await page.locator(".page-window .module-web-preview iframe").waitFor({ state: "attached" });
      await page.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      // Offline there are no media files: the pictures are not found, but the run still succeeds (no uncaught error).
      await page.getByText("Run succeeded — ready to submit this version.", { exact: false }).waitFor();
      const expected = [["ICT STRAND"], captions, "absolute", "8px", "8px", "1", "relative", "left", "170px", "static",
        ...pictures.map((src) => `${src}: ${withMedia ? "from the page, drawn" : "not found, broken"}`)];
      const seen = await looks(page);
      assert.deepEqual(seen, expected, "the ribbon and every caption on their own lines; position, offsets, z-index and float as written; each picture");
      await page.locator(".page-window .module-web-preview").screenshot({ path: "/tmp/codeshare-web-student-week7.png" });
      await closePageWindow(page);
      await page.getByRole("button", { name: "Submit this version", exact: true }).click();
      await page.locator(".actionbar .sync", { hasText: /^Submitted$/ }).waitFor();
      await page.getByRole("alertdialog", { name: "Version submitted" }).getByRole("button", { name: "OK" }).click();
      const saved = await progress(week7);
      assert.equal(saved.percent, 100);
      assert.deepEqual(Object.fromEntries(saved.performanceTask.own.files.map((file) => [file.path, file.content])), { ...carried, "index.html": index, "styles.css": css });
      assert.deepEqual((saved.performanceTask.own.media ?? []).map((item) => item.path), [...(week6Own.media ?? []).map((item) => item.path), ...(withMedia ? pictures : [])],
        "the Week 6 media carry forward and, online, the three gallery pictures are frozen with the submission");

      const review = await teacher.newPage(); review.setDefaultTimeout(20000); review.on("pageerror", (e) => errors.push(e.message));
      await review.goto("/");
      await review.getByRole("button", { name: /Open class/ }).click();
      await review.getByRole("button", { name: /^Students/ }).click();
      await review.getByRole("button", { name: /Open Web student.*progress/ }).click();
      await review.locator(".teacher-module-card", { hasText: week7.title.replace(/^Self-Paced Module:\s*/, "") }).getByRole("button", { name: "Review personal submission" }).click();
      await review.locator(".student-module-project .editor-card textarea").waitFor();
      await review.mouse.click(1200, 400);
      await review.getByRole("button", { name: /Run code/ }).click();
      await review.locator(".page-window .module-web-preview iframe").waitFor({ state: "attached" });
      assert.deepEqual(await looks(review), expected, "the review runs the frozen pages, styles.css and pictures");
      await review.waitForFunction(() => [...document.querySelectorAll(".actionbar button")].some((button) => /Run code/.test(button.textContent) && !button.disabled));
      assert.deepEqual(await progress(week7), saved, "teacher runs never change the student's progress");
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
      await closePageWindow(preview);
      assert.equal(await views.nth(0).locator(".web-checks li").textContent(), "✓ Console output matches");
      await views.nth(1).getByRole("button", { name: "Run", exact: true }).click();
      await closePageWindow(preview);
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
