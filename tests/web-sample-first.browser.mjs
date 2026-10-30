// Real local browser check: Net MVC web steps in the Java student workflow (teacher, 2026-10-29) —
// sample first, one alteration task per step, the next week linked with previousModuleId.
// Local Supabase only. Env: WEB_STEPS_BASE_URL (default http://localhost:3042; 8787 for Cloudflare's
// runtime), CODESHARE_PLAYWRIGHT_MODULE, PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.
import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { activityStateId, sampleStateId } from "../backend/src/module-activities.ts";
const { chromium } = await import(process.env.CODESHARE_PLAYWRIGHT_MODULE || "playwright");
const config = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const local = Object.fromEntries(config.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
assert.ok(["localhost", "127.0.0.1"].includes(new URL(local.API_URL).hostname));
const admin = createClient(local.API_URL, local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const page = (title, body) => `<!doctype html>\n<html lang="en">\n<head>\n  <title>${title}</title>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
const lesson = (id, order, blocks) => ({ id, order, dayLabel: `DAY ${order}`, title: `Lesson ${order}`, hours: 2,
  objectives: { cognitive: "c", affective: "a", psychomotor: "p" }, blocks,
  exitSlip: { id: `${id}-slip`, points: 5, afterStep: blocks[0].id, questions: [{ id: "1.1", kind: "Define", points: 5, prompt: "What changed?" }] } });
const week = (id, number, previousModuleId) => ({
  format: "codeshare-module", version: 1, course: "dotnet-1", week: number, id, title: `Sample First Week ${number} ${id.slice(-4)}`, sampleFirst: true,
  ...(previousModuleId ? { previousModuleId } : {}), starterFiles: [],
  lessons: [
    lesson(`${id}-d1`, 1, [{ type: "step", id: `${id}-d1-s1`, number: 1, instruction: "Run the food list.", language: "html", run: "index.html",
      files: [{ path: "index.html", content: page("Canteen", "<h1>Canteen</h1>\n<ul><li>Pandesal</li></ul>") }],
      expectedOutput: "Tab title: Canteen\nVisible page text:\nCanteen\nPandesal", webChecks: [{ selector: "ul > li", count: 1 }],
      activity: { id: `${id}-d1-s1-alter-v1`, instruction: "Add Banana as a second food item.", expectedOutput: "Tab title: Canteen\nVisible page text:\nCanteen\nPandesal\nBanana" } }]),
    lesson(`${id}-d2`, 2, [{ type: "step", id: `${id}-d2-s2`, number: 2, instruction: "Run the total.", language: "javascript", run: "app.js",
      files: [{ path: "app.js", content: "console.log(\"Total: \" + (2 + 3));" }], expectedOutput: "Total: 5",
      activity: { id: `${id}-d2-s2-alter-v1`, instruction: "Add a 4-peso item to the total.", expectedOutput: "Total: 9" } }]),
  ],
  performanceTask: { id: `${id}-pt`, title: "Your own page", markdown: "Build your own page.", checklist: ["Give the page a title"],
    exampleFiles: [{ path: "index.html", content: page("Mine", "<p>Mine</p>") }], starterFiles: [{ path: "index.html", content: page("Mine", "<p>Mine</p>") }],
    presentationOutline: [], questionsToPrepare: [], rubric: [{ criterion: "Page", points: 10 }], totalPoints: 10 },
});
const weekA = week(`wsf-${randomUUID().slice(0, 8)}`, 1);
const weekB = week(`wsf-${randomUUID().slice(0, 8)}`, 2, weekA.id);
const [a1, a2] = weekA.lessons.map((item) => item.blocks[0]);
const listAnswer = a1.files[0].content.replace("<li>Pandesal</li>", "<li>Pandesal</li><li>Banana</li>");
const totalAnswer = "console.log(\"Total: \" + (2 + 3 + 4));";

// Run opens the floating page window (2026-10-30). Wait until the run has been checked (Close comes on;
// a RUN CODE box still on top makes the click wait), then close it so the checks show beside the code again.
const closePageWindow = async (where) => {
  const close = where.locator(".page-window").getByRole("button", { name: "Close", exact: true });
  await close.waitFor();
  await where.waitForFunction(() => document.querySelector(".page-window header button")?.disabled === false);
  await close.click();
  await where.locator(".page-window").waitFor({ state: "detached" });
};
// A step whose index.html links to its own pages, shows one in a frame, and links to a missing page and the internet.
const pagesWeek = {
  format: "codeshare-module", version: 1, course: "dotnet-1", week: 3, id: `wsf-pages-${randomUUID().slice(0, 8)}`, title: "Linked resume pages", starterFiles: [],
  lessons: [
    lesson("wsf-pages-d1", 1, [{ type: "step", id: "wsf-pages-s1", number: 1, instruction: "Open the linked pages.", language: "html", run: "index.html",
      files: [
        { path: "index.html", content: page("Home", '<h1>Juan Dela Cruz</h1>\n<p><a href="about.html">About</a></p>\n<p><a href="missing.html">Missing</a></p>\n<p><a href="https://example.com/">Internet</a></p>\n<iframe src="about.html" title="About frame"></iframe>') },
        { path: "about.html", content: page("About", '<h1>About Juan</h1>\n<p><a href="contact.html">Contact</a></p>') },
        { path: "contact.html", content: page("Contact", '<h1>Contact Juan</h1>\n<p><a href="index.html">Home</a></p>') },
      ],
      expectedOutput: "Tab title: Home\nVisible page text:\nJuan Dela Cruz\nAbout\nMissing\nInternet" }]),
    // window.parent is replaceable, so this page's report never reaches CodeShare: the run waits its full 5 seconds.
    lesson("wsf-pages-d2", 2, [{ type: "step", id: "wsf-pages-s2", number: 2, instruction: "A slow page.", language: "html", run: "index.html",
      files: [{ path: "index.html", content: page("Slow", "<script>window.parent = { postMessage() {} };</script>\n<p>Slow</p>") }],
      expectedOutput: "Tab title: Slow\nVisible page text:\nSlow" }]),
  ],
};

test("web steps in the Java workflow: sample first, then the task; the next step and week open; reload resumes; projects carry forward", async (t) => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const baseURL = process.env.WEB_STEPS_BASE_URL || "http://localhost:3042";
  const users = []; let classroomId;
  try {
    const password = randomUUID();
    for (const role of ["teacher", "student"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `web-sample-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Sample ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
    }
    const teacher = await browser.newContext({ baseURL });
    assert.equal((await teacher.request.post("/api/auth/login", { data: { email: users[0].email, password } })).status(), 200);
    const created = await teacher.request.post("/api/classes", { data: { subject: "Net MVC", name: "Web sample-first verification" } });
    assert.equal(created.status(), 201); classroomId = (await created.json()).id;
    for (const upload of [weekA, weekB]) assert.equal((await teacher.request.post(`/api/classrooms/${classroomId}/modules`, { data: upload })).status(), 201);
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);

    const student = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
    assert.equal((await student.request.post("/api/auth/login", { data: { email: users[1].email, password } })).status(), 200);
    const tab = await student.newPage(); tab.setDefaultTimeout(20000);
    const errors = []; tab.on("pageerror", (e) => errors.push(e.message));
    const worksheet = tab.locator("#classroom-worksheet");
    const project = tab.locator(".student-module-project");
    const editor = project.getByRole("textbox", { name: "HTML source code editor", exact: true });
    const jsEditor = project.getByRole("textbox", { name: "JavaScript source code editor", exact: true });
    const checks = project.locator(".web-checks");
    const feedback = tab.locator(".module-run-feedback");
    const progress = async (target) => (await student.request.get(`/api/classrooms/${classroomId}/modules/${target.id}/progress`)).json();
    const showing = (value) => tab.waitForFunction((value) => document.querySelector(".student-module-project .editor-card textarea")?.value === value, value);
    const openCatalog = async (target) => {
      await tab.goto("/"); await tab.locator(".classroom-workspace").waitFor();
      await tab.getByRole("button", { name: "Module", exact: true }).hover();
      await tab.locator("#classroom-modules .module-catalog-card").filter({ hasText: target.title }).getByRole("button").first().click();
      await worksheet.locator("article:not([hidden])").waitFor();
    };
    // part: the worksheet part (day) to show first, when the step is not in the part shown now.
    const openStep = async (step, part) => {
      await tab.mouse.move(1100, 20); await tab.getByRole("button", { name: "Module", exact: true }).hover();
      await tab.waitForFunction(() => document.getElementById("classroom-worksheet")?.dataset.open === "true");
      if (part) await worksheet.getByRole("button", { name: part }).first().click();
      await worksheet.getByRole("button", { name: new RegExp(`Step ${step.number}$`) }).click();
      await worksheet.locator("article:not([hidden])").getByRole("button", { name: "Work in code editor", exact: true }).click();
    };
    // Each run opens the page window; close it once checked, then wait for the banner to say `message`.
    const run = async (message) => {
      await tab.getByRole("button", { name: /Run code/ }).click();
      await closePageWindow(tab);
      await tab.waitForFunction((message) => document.querySelector(".module-run-feedback")?.textContent.includes(message), message);
    };

    await t.test("a page step opens its sample read-only; the unchanged run verifies it with its page check; the task completes it", async () => {
      await openCatalog(weekA); // choosing a module opens its next unfinished step
      await showing(a1.files[0].content);
      assert.equal(await editor.getAttribute("readonly"), "", "the sample is run before editing");
      assert.match(await feedback.textContent(), /First, run the sample unchanged/);
      assert.equal(await tab.getByLabel("Program input").count(), 0);
      await run("Sample verified — now complete Your task.");
      assert.deepEqual(await checks.locator("li").allTextContents(), ["✓ Page text matches", "✓ Page has 1 ul > li"]);
      await tab.waitForFunction(() => !document.querySelector(".student-module-project .editor-card textarea")?.readOnly);
      assert.equal((await progress(weekA)).stepStates[activityStateId(a1)], undefined, "verifying the sample does not complete the task");
      await run("Still showing sample output");
      await editor.fill(a1.files[0].content.replace("<li>Pandesal</li>", "<li>Pandesal</li><li>Mango</li>"));
      await run("Not completed — this run differs");
      assert.deepEqual(await checks.locator("li").allTextContents(), ["✗ Page text matches"], "a task is checked by its output only");
      assert.match(await checks.getByLabel("Your output").textContent(), /Mango/);
      await editor.fill(listAnswer);
      // The window stays until the completion is synced too: hold that request; Close, Esc and a click beside it wait.
      let release, syncing; const held = new Promise((resolve) => { release = resolve; }), sent = new Promise((resolve) => { syncing = resolve; });
      await tab.route("**/progress/complete", async (route) => { syncing(); await held; await route.continue(); });
      await tab.getByRole("button", { name: /Run code/ }).click();
      await sent;
      const pageWindow = tab.locator(".page-window");
      assert.equal(await pageWindow.getByRole("button", { name: "Close", exact: true }).isDisabled(), true, "Close waits for the completion to sync");
      await tab.keyboard.press("Escape");
      await tab.mouse.click(5, 5);
      assert.equal(await pageWindow.count(), 1, "Esc and a click beside the window wait for the sync too");
      release(); // later completions pass straight through
      await closePageWindow(tab);
      await tab.waitForFunction(() => document.querySelector(".module-run-feedback")?.textContent.includes("Completed — next activity unlocked"));
      const saved = await progress(weekA);
      assert.equal(saved.stepStates[activityStateId(a1)], "pass"); assert.equal(saved.stepStates[sampleStateId(a1)], "pass");
      const blocked = await student.request.get(`/api/classrooms/${classroomId}/modules/${weekB.id}/progress`);
      assert.equal(blocked.status(), 403, "the next week waits for this one");
    });

    await t.test("the console step loads its own sample, verifies it, then completes its task", async () => {
      await openStep(a2);
      await showing(a2.files[0].content);
      assert.equal(await project.locator(".file-tab.active").textContent(), "app.js");
      await run("Sample verified");
      assert.deepEqual(await checks.locator("li").allTextContents(), ["✓ Console output matches"]);
      await tab.waitForFunction(() => !document.querySelector(".student-module-project .editor-card textarea")?.readOnly);
      await jsEditor.fill(totalAnswer);
      await run("Completed — next activity unlocked");
      assert.equal((await progress(weekA)).stepStates[activityStateId(a2)], "pass");
    });

    await t.test("after a reload, a finished step reopens with the student's completed work and keeps its completion", async () => {
      await openCatalog(weekA);
      await openStep(a1, /Lesson 1/);
      await showing(listAnswer);
      assert.match(await feedback.textContent(), /Completed — your progress is saved/);
      await tab.screenshot({ path: "/tmp/codeshare-web-sample-first.png" });
    });

    await t.test("the personal project is submitted; the next week opens and carries both projects forward", async () => {
      const mine = page("Mine", "<p>Week 1 work</p>");
      await tab.getByRole("button", { name: "Projects", exact: true }).hover();
      await tab.locator("#classroom-projects").getByRole("button", { name: "Personal performance-task project", exact: true }).click();
      await tab.waitForFunction(() => document.getElementById("classroom-projects")?.dataset.open === "false");
      await showing(weekA.performanceTask.starterFiles[0].content);
      await editor.fill(mine);
      await tab.getByRole("button", { name: /Run code/ }).click();
      await tab.getByText("Run succeeded — ready to submit this version.", { exact: false }).waitFor();
      await closePageWindow(tab);
      await tab.getByRole("button", { name: "Submit this version", exact: true }).click();
      await tab.locator(".actionbar .sync", { hasText: "Submitted" }).waitFor();
      assert.equal((await progress(weekA)).percent, 100);

      const b1 = weekB.lessons[0].blocks[0];
      await openCatalog(weekB);
      await showing(b1.files[0].content);
      assert.deepEqual(await project.locator(".file-tab").allTextContents(), ["index.html", "app.js"], "the module project carries week 1's files forward");
      await project.locator(".file-tab", { hasText: "app.js" }).dispatchEvent("click"); // the worksheet drawer may still cover the tabs
      await showing(totalAnswer);
      // The personal task opens after the week's steps, as in Java; mark week 2's tasks done to reach it.
      const states = Object.fromEntries(weekB.lessons.map((item) => [activityStateId(item.blocks[0]), "pass"]));
      assert.equal((await admin.from("module_progress").update({ step_states: states }).eq("classroom_id", classroomId).eq("student_id", users[1].id).eq("module_id", weekB.id)).error, null);
      const personal = await student.request.post(`/api/classrooms/${classroomId}/modules/${weekB.id}/progress/performance-project`);
      assert.equal(personal.status(), 200, await personal.text());
      assert.deepEqual((await personal.json()).performanceProjectFiles, [{ path: "index.html", content: mine }], "the personal project carries week 1's submission forward");
      assert.deepEqual(errors, []);
    });

    await t.test("the page window: links and frames open the project's own pages, nothing comes from the internet, and it stays until the run is checked", async () => {
      assert.equal((await teacher.request.post(`/api/classrooms/${classroomId}/modules`, { data: pagesWeek })).status(), 201);
      const view = await teacher.newPage(); view.setDefaultTimeout(20000);
      const pageErrors = []; view.on("pageerror", (e) => pageErrors.push(e.message));
      const requests = []; view.on("request", (request) => requests.push(request.url()));
      await view.goto("/");
      await view.getByRole("button", { name: /Open class/ }).click();
      await view.getByRole("navigation", { name: "Teacher class navigation" }).getByRole("button", { name: /Curriculum/ }).click();
      await view.locator(".teacher-module-card", { hasText: "Linked resume pages" }).getByRole("button", { name: /View module details/ }).click();
      const steps = view.locator(".module-step");
      await steps.nth(0).getByRole("button", { name: "Run", exact: true }).click();
      const pageWindow = view.locator(".page-window"), heading = pageWindow.locator("h2"), note = pageWindow.locator(".page-window-note");
      const inside = view.frameLocator(".page-window .module-web-preview iframe");
      // CodeShare zooms the page (body zoom), which throws off Playwright's mouse inside frames; links are followed
      // with the keyboard instead: focus, then Enter, which the page sees as a click.
      const follow = async (name) => { await inside.getByRole("link", { name, exact: true }).focus(); await view.keyboard.press("Enter"); };
      await view.waitForFunction(() => document.querySelector(".page-window header button")?.disabled === false);
      assert.equal(await heading.textContent(), "index.html");
      assert.deepEqual(await pageWindow.locator(".web-checks li").allTextContents(), ["✓ Page text matches"], "the window shows the run's checks");
      // Playwright cannot reach a frame inside the sandboxed page, so the framed page is reloaded and its own report read.
      const outer = await (await view.locator(".page-window .module-web-preview iframe").elementHandle()).contentFrame();
      const framedText = await outer.evaluate(() => new Promise((resolve) => {
        addEventListener("message", (event) => { if (event.data?.codeshare === "page") resolve(event.data.text); });
        const frame = document.querySelector('iframe[title="About frame"]'); frame.srcdoc = frame.srcdoc;
      }));
      assert.match(framedText, /^About Juan\s+Contact$/, "a frame shows the project's own page");

      await follow("About");
      await view.waitForFunction(() => document.querySelector(".page-window h2")?.textContent === "about.html");
      assert.equal(await inside.locator("h1").textContent(), "About Juan");
      assert.deepEqual(await pageWindow.locator(".web-checks li").allTextContents(), ["✓ Page text matches"], "looking at another page never changes the result");
      await follow("Contact");
      await view.waitForFunction(() => document.querySelector(".page-window h2")?.textContent === "contact.html");
      await follow("Home");
      await view.waitForFunction(() => document.querySelector(".page-window h2")?.textContent === "index.html");
      // A link inside the framed page: Tab from the last link of the page moves into the frame's Contact link.
      await inside.getByRole("link", { name: "Internet", exact: true }).focus();
      await view.keyboard.press("Tab");
      await view.keyboard.press("Enter");
      await view.waitForFunction(() => document.querySelector(".page-window h2")?.textContent === "contact.html", null, { timeout: 5000 });
      await follow("Home");
      await view.waitForFunction(() => document.querySelector(".page-window h2")?.textContent === "index.html");

      await follow("Missing");
      assert.equal(await note.textContent(), "This project has no page named missing.html.");
      assert.equal(await heading.textContent(), "index.html");
      await follow("Internet");
      await view.waitForFunction(() => /outside this project/.test(document.querySelector(".page-window-note")?.textContent ?? ""));
      assert.equal(await note.textContent(), "Links outside this project do not open in CodeShare.");
      assert.equal(await inside.locator("h1").textContent(), "Juan Dela Cruz", "the page stays where it was");
      assert.deepEqual(requests.filter((url) => /example\.com/.test(url)), [], "nothing is requested from the internet");
      await view.screenshot({ path: "/tmp/codeshare-page-window.png" });

      // Esc closes the window when CodeShare has the keyboard; inside the page, the student's page gets the key.
      await pageWindow.getByRole("button", { name: "Close", exact: true }).focus();
      await view.keyboard.press("Escape");
      await pageWindow.waitFor({ state: "detached" });
      assert.deepEqual(await steps.nth(0).locator(".web-checks li").allTextContents(), ["✓ Page text matches"], "closed, the checks show beside the step");
      await steps.nth(0).getByRole("button", { name: "Show page", exact: true }).click();
      await pageWindow.waitFor();
      await pageWindow.getByRole("button", { name: "Close", exact: true }).click();
      await pageWindow.waitFor({ state: "detached" });

      await steps.nth(1).getByRole("button", { name: "Run", exact: true }).click();
      await pageWindow.waitFor();
      assert.equal(await pageWindow.getByRole("button", { name: "Close", exact: true }).isDisabled(), true, "Close waits for the run to be checked");
      await view.keyboard.press("Escape");
      await view.mouse.click(5, 5);
      assert.equal(await pageWindow.count(), 1, "Esc and a click beside the window wait for the run too");
      await closePageWindow(view);

      // In the classroom the teacher's worksheet is a drawer that closes on clicks outside it; the window sits on
      // the page body above it, so using the window must leave the drawer open.
      await view.goto("/");
      await view.getByRole("button", { name: "Open class", exact: true }).click();
      await view.getByRole("button", { name: "Enter classroom" }).click();
      await view.locator(".classroom-workspace").waitFor();
      await view.getByRole("button", { name: "Module", exact: true }).hover();
      await view.locator("#classroom-modules .module-catalog-card").filter({ hasText: "Linked resume pages" }).getByRole("button").first().click();
      const worksheet = view.locator("#classroom-worksheet");
      await worksheet.locator("article:not([hidden])").waitFor();
      await worksheet.getByRole("button", { name: /Step 1$/ }).click();
      const sample = worksheet.locator("article:not([hidden]) details").filter({ hasText: "Preview sample code" }).first();
      if (await sample.getAttribute("open") === null) await sample.locator("summary").click();
      await sample.getByRole("button", { name: "Run", exact: true }).click();
      await view.waitForFunction(() => document.querySelector(".page-window header button")?.disabled === false);
      await pageWindow.locator(".page-window-results").click();
      assert.equal(await worksheet.getAttribute("data-open"), "true", "a click in the window keeps the worksheet open");
      await closePageWindow(view);
      assert.equal(await worksheet.getAttribute("data-open"), "true", "closing the window keeps the worksheet open");
      assert.deepEqual(pageErrors, []);
      await view.close();
    });
  } finally {
    await browser.close();
    if (classroomId) await admin.from("classrooms").delete().eq("id", classroomId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
