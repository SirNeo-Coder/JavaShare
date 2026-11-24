// Real local browser check: the guided example on a web step (teacher, 2026-11-24, CKB-138) — the student's own
// work (sample, guided example, own task), the teacher's Module preview ticks and the students' class step.
// Local Supabase only. Env: WEB_GUIDED_BASE_URL (default http://localhost:3072, offline classroom settings:
// LOCAL_JAVA_EXECUTION=true, CODESHARE_LAPTOP=true), CODESHARE_PLAYWRIGHT_MODULE, PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { activityStateId, guidedStateId, sampleStateId } from "../backend/src/module-activities.ts";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const config = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(config.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const page = (title, body) => `<!doctype html>\n<html lang="en">\n<head>\n  <title>${title}</title>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
const lesson = (id, order, blocks) => ({ id, order, dayLabel: `DAY ${order}`, title: `Lesson ${order}`, hours: 2,
  objectives: { cognitive: "c", affective: "a", psychomotor: "p" }, blocks,
  exitSlip: { id: `${id}-slip`, points: 5, afterStep: blocks[0].id, questions: [{ id: "1.1", kind: "Define", points: 5, prompt: "What changed?" }] } });
const id = `wg-${randomUUID().slice(0, 8)}`;
const sample = page("Resume", "<h1>Juan Dela Cruz</h1>\n<ul><li>Reading</li></ul>");
const content = {
  format: "codeshare-module", version: 1, course: "dotnet-1", week: 1, id, title: `Web guided ${id.slice(-4)}`, sampleFirst: true, starterFiles: [],
  lessons: [
    lesson(`${id}-d1`, 1, [{ type: "step", id: `${id}-d1-s1`, number: 1, instruction: "Run the hobby list.", language: "html", run: "index.html",
      files: [{ path: "index.html", content: sample }], expectedOutput: "Tab title: Resume\nVisible page text:\nJuan Dela Cruz\nReading",
      webChecks: [{ selector: "ul > li", count: 1 }],
      activity: { id: `${id}-d1-s1-alter-v2`, instruction: "Add Drawing as a second hobby.", expectedOutput: "Tab title: Resume\nVisible page text:\nJuan Dela Cruz\nReading\nDrawing",
        guided: { discussion: "Look at line 8. WEB-GUIDED-DISCUSSION", instruction: "Add Chess after Reading.", code: "<li>Chess</li>",
          expectedOutput: "Tab title: Resume\nVisible page text:\nJuan Dela Cruz\nReading\nChess" } } }]),
    lesson(`${id}-d2`, 2, [{ type: "step", id: `${id}-d2-s2`, number: 2, instruction: "Run the page again.", language: "html", run: "index.html",
      files: [{ path: "index.html", content: sample }], expectedOutput: "Tab title: Resume\nVisible page text:\nJuan Dela Cruz\nReading",
      activity: { id: `${id}-d2-s2-alter-v2`, instruction: "Change Reading to Singing.", expectedOutput: "Tab title: Resume\nVisible page text:\nJuan Dela Cruz\nSinging" } }]),
  ],
  performanceTask: { id: `${id}-pt`, title: "Your own page", markdown: "Build your own page.", checklist: ["Give the page a title"],
    exampleFiles: [{ path: "index.html", content: page("Mine", "<p>Mine</p>") }], starterFiles: [{ path: "index.html", content: page("Mine", "<p>Mine</p>") }],
    presentationOutline: [], questionsToPrepare: [], rubric: [{ criterion: "Page", points: 10 }], totalPoints: 10 },
};
const [first, second] = content.lessons.map((item) => item.blocks[0]);
const guidedPage = sample.replace("<li>Reading</li>", "<li>Reading</li><li>Chess</li>");
const taskPage = sample.replace("<li>Reading</li>", "<li>Reading</li><li>Drawing</li>");

// Run opens the floating page window; it closes only after the run is checked.
const closePageWindow = async (where) => {
  const close = where.locator(".page-window").getByRole("button", { name: "Close", exact: true });
  await close.waitFor();
  await where.waitForFunction(() => document.querySelector(".page-window header button")?.disabled === false);
  await close.click();
  await where.locator(".page-window").waitFor({ state: "detached" });
};

test("guided example on a web step: sample, guided, own task; teacher preview ticks; class step shows it", async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const baseURL = process.env.WEB_GUIDED_BASE_URL || "http://localhost:3072";
  const users = []; let classroomId;
  try {
    const password = randomUUID();
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `web-guided-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Guided ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role, name: `Guided ${role}` }).eq("id", data.user.id)).error, null);
    }
    const teacher = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
    assert.equal((await teacher.request.post("/api/auth/login", { data: { email: users[0].email, password } })).status(), 200);
    const className = `Web guided ${randomUUID().slice(0, 6)}`;
    const created = await teacher.request.post("/api/classes", { data: { subject: "Net MVC", name: className } });
    assert.equal(created.status(), 201); classroomId = (await created.json()).id;
    const uploaded = await teacher.request.post(`/api/classrooms/${classroomId}/modules`, { data: content });
    assert.equal(uploaded.status(), 201, await uploaded.text());
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);

    const student = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
    assert.equal((await student.request.post("/api/auth/login", { data: { email: users[1].email, password } })).status(), 200);
    const tab = await student.newPage(); tab.setDefaultTimeout(20000);
    const errors = []; tab.on("pageerror", (e) => errors.push(e.message));
    const worksheet = tab.locator("#classroom-worksheet");
    const project = tab.locator(".student-module-project");
    const editor = project.getByRole("textbox", { name: "HTML source code editor", exact: true });
    const panel = tab.locator(".module-activity-details");
    const progressPath = `/api/classrooms/${classroomId}/modules/${content.id}/progress`;
    const progress = async () => (await student.request.get(progressPath)).json();
    const run = async (message) => {
      await tab.getByRole("button", { name: /Run code/ }).click();
      await closePageWindow(tab);
      await tab.waitForFunction((message) => document.querySelector(".module-run-feedback")?.textContent.includes(message), message);
    };

    await t.test("student: the sample runs unchanged, then the guided example shows its discussion and code", async () => {
      await tab.goto("/"); await tab.locator(".classroom-workspace").waitFor();
      await tab.getByRole("button", { name: "Module", exact: true }).hover();
      await tab.locator("#classroom-modules .module-catalog-card").filter({ hasText: content.title }).getByRole("button").first().click();
      await worksheet.locator("article:not([hidden])").waitFor();
      const text = await worksheet.locator(".module-step").first().innerText();
      const at = (label) => { const i = text.indexOf(label); assert.ok(i >= 0, `${label} is shown`); return i; };
      assert.ok(at("Sample output") < at("WEB-GUIDED-DISCUSSION"));
      assert.ok(at("WEB-GUIDED-DISCUSSION") < at("<li>Chess</li>"));
      assert.ok(at("Expected guided output") < at("Your task"));
      await tab.waitForFunction((value) => document.querySelector(".student-module-project .editor-card textarea")?.value === value, sample);
      assert.equal(await editor.getAttribute("readonly"), "");
      assert.ok(!(await panel.innerText()).includes("WEB-GUIDED-DISCUSSION"), "the editor shows the discussion only after Sample verified");
      await run("Sample verified — now do the Guided example.");
      const shown = await panel.innerText();
      assert.match(shown, /WEB-GUIDED-DISCUSSION/); assert.match(shown, /Add Chess after Reading/); assert.match(shown, /Expected guided output/);
    });

    await t.test("student: the own task's page does not pass the guided example; the guided page verifies it and completes nothing", async () => {
      await tab.waitForFunction(() => !document.querySelector(".student-module-project .editor-card textarea")?.readOnly);
      await editor.fill(taskPage); await run("Guided example not verified");
      await editor.fill(guidedPage); await run("Guided example verified — now do Your task on your own.");
      assert.equal(await editor.inputValue(), guidedPage, "the student's code stays in the editor");
      const saved = await progress();
      assert.equal(saved.stepStates[activityStateId(first)], undefined, "a guided pass is not Completed");
      assert.equal((await student.request.post(`${progressPath}/activity`, { data: { stepId: second.id } })).status(), 403, "the next step stays locked");
      await tab.screenshot({ path: "/tmp/codeshare-web-guided-verified.png" });
    });

    await t.test("student: the guided page again says so; the own task completes and opens the next step", async () => {
      await run("Still showing the guided example output");
      await editor.fill(taskPage); await run("Completed — next activity unlocked");
      const saved = await progress();
      assert.equal(saved.stepStates[activityStateId(first)], "pass"); assert.equal(saved.stepStates[guidedStateId(first)], "pass");
      assert.equal(saved.stepStates[sampleStateId(first)], "pass");
      assert.equal((await student.request.post(`${progressPath}/activity`, { data: { stepId: second.id } })).status(), 200);
    });

    await t.test("teacher's Module preview ticks Sample, Guided example and Your task; the class step shows the guided example", async () => {
      const view = await teacher.newPage(); view.setDefaultTimeout(30000);
      view.on("pageerror", (e) => errors.push(e.message));
      await view.goto("/");
      await view.locator("header").filter({ hasText: className }).getByRole("button", { name: "Open class", exact: true }).click();
      await view.getByRole("button", { name: "Enter classroom" }).click();
      await view.locator(".team-header").getByRole("button", { name: "End session" }).waitFor();
      await view.getByRole("button", { name: "Module", exact: true }).hover();
      await view.locator("#classroom-modules .module-catalog-card").filter({ hasText: content.title }).getByRole("button").first().click();
      const teacherSheet = view.locator("#classroom-worksheet");
      await teacherSheet.locator("article:not([hidden])").waitFor();
      await teacherSheet.getByRole("button", { name: /Step 1$/ }).click();
      await teacherSheet.locator("article:not([hidden])").getByRole("button", { name: "Work in code editor", exact: true }).click();
      await view.locator(".team-header").getByText("Shared with class").waitFor();
      const banner = (p) => p.locator(".student-module-project .module-run-feedback");
      const teacherEditor = view.locator(".student-module-project").getByRole("textbox", { name: "HTML source code editor", exact: true });
      const previewRun = async (p, message) => {
        await p.locator("footer.actionbar").filter({ hasText: "Return to class project" }).getByRole("button", { name: /Run code/ }).click();
        await closePageWindow(p);
        await banner(p).filter({ hasText: message }).waitFor();
      };
      await previewRun(view, "Matches Expected sample output.");
      assert.match(await banner(view).innerText(), /✓ Sample, unchanged code[\s\S]*○ Guided example[\s\S]*○ Your task/);
      await teacherEditor.fill(guidedPage); await previewRun(view, "Matches Expected guided output.");
      await teacherEditor.fill(taskPage); await previewRun(view, "Matches Expected task output.");
      assert.match(await banner(view).locator(".preview-checks").innerText(), /✓ Sample, unchanged code[\s\S]*✓ Guided example[\s\S]*✓ Your task/);
      await view.screenshot({ path: "/tmp/codeshare-web-guided-preview.png" });

      // The student was pulled into the class session; the shared step is practice only.
      await tab.waitForFunction(() => document.querySelector(".student-module-project .workspace-card-heading b")?.textContent?.startsWith("Class step"));
      await tab.locator(".student-module-project .module-guided").getByText("Add Chess after Reading.").waitFor();
      await editor.fill(guidedPage); await previewRun(tab, "Matches Expected guided output.");
      assert.match(await banner(tab).innerText(), /✓ Guided example/);
      await tab.screenshot({ path: "/tmp/codeshare-web-guided-class-step.png" });
      await view.close();
    });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    if (classroomId) await admin.from("classrooms").delete().eq("id", classroomId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
