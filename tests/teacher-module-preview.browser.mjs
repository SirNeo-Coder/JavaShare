// Real local browser check: a teacher's Work in code editor opens a step's sample in the main editor for
// discussing in class (teacher, 2026-11-09). Editable and runnable; never saved, never sent to students.
// Local Supabase only. Env: PREVIEW_BASE_URL (default http://localhost:3052, laptop Java), CODESHARE_PLAYWRIGHT_MODULE,
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

const java = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url)));
java.id = `preview-java-${randomUUID().slice(0, 8)}`;
const page = (title, body) => `<!doctype html>\n<html lang="en">\n<head>\n  <title>${title}</title>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
const webId = `preview-web-${randomUUID().slice(0, 8)}`;
const web = { format: "codeshare-module", version: 1, course: "dotnet-1", week: 1, id: webId, title: "Preview resume page", sampleFirst: true, starterFiles: [],
  lessons: [{ id: `${webId}-d1`, order: 1, dayLabel: "DAY 1", title: "Lesson 1", hours: 2, objectives: { cognitive: "c", affective: "a", psychomotor: "p" },
    blocks: [{ type: "step", id: `${webId}-s1`, number: 1, instruction: "Run the resume heading.", language: "html", run: "index.html",
      files: [{ path: "index.html", content: page("Resume", "<h1>Juan Dela Cruz</h1>") }, { path: "style.css", content: "h1 { color: navy; }\n" }],
      expectedOutput: "Tab title: Resume\nVisible page text:\nJuan Dela Cruz",
      activity: { id: `${webId}-s1-alter-v1`, instruction: "Add a Skills heading.", expectedOutput: "Tab title: Resume\nVisible page text:\nJuan Dela Cruz\nSkills" } }],
    exitSlip: { id: `${webId}-slip`, points: 5, afterStep: `${webId}-s1`, questions: [{ id: "1.1", kind: "Define", points: 5, prompt: "What changed?" }] } }],
  performanceTask: { id: `${webId}-pt`, title: "Your own page", markdown: "Build your own page.", checklist: ["Give the page a title"],
    exampleFiles: [{ path: "index.html", content: page("Mine", "<p>Mine</p>") }], starterFiles: [{ path: "index.html", content: page("Mine", "<p>Mine</p>") }],
    presentationOutline: [], questionsToPrepare: [], rubric: [{ criterion: "Page", points: 10 }], totalPoints: 10 } };

const cases = [
  { subject: "Java", module: java, editor: "Java source code editor", edit: (code) => code.replace('"Capacity: "', '"Preview edit: "'), shows: "Preview edit: 20" },
  { subject: "Net MVC", module: web, editor: "HTML source code editor", edit: (code) => code.replace("</h1>", "</h1>\n<h2>Preview edit</h2>"), shows: "Preview edit" },
];

test("teacher Work in code editor: Java and Net MVC samples open in the main editor, run, and are never saved", async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const baseURL = process.env.PREVIEW_BASE_URL || "http://localhost:3052";
  const users = [], classes = [];
  try {
    for (const item of cases) {
      const password = randomUUID();
      const { data, error } = await admin.auth.admin.createUser({ email: `preview-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: "Preview teacher" } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role: "teacher" }).eq("id", data.user.id)).error, null);
      const teacher = await browser.newContext({ baseURL, viewport: { width: 1500, height: 1050 } });
      assert.equal((await teacher.request.post("/api/auth/login", { data: { email: data.user.email, password } })).status(), 200);
      const created = await teacher.request.post("/api/classes", { data: { subject: item.subject, name: `${item.subject} preview` } });
      assert.equal(created.status(), 201, await created.text()); const classId = (await created.json()).id; classes.push(classId);
      const uploaded = await teacher.request.post(`/api/classrooms/${classId}/modules`, { data: item.module });
      assert.equal(uploaded.status(), 201, await uploaded.text());

      const view = await teacher.newPage(); view.setDefaultTimeout(30000);
      const errors = []; view.on("pageerror", (e) => errors.push(e.message));
      const writes = []; view.on("request", (request) => { if (request.method() !== "GET" && /\/progress|\/files|\/api\/projects\//.test(request.url())) writes.push(`${request.method()} ${request.url()}`); });
      await view.goto("/");
      await view.getByRole("button", { name: "Open class", exact: true }).click();
      await view.getByRole("button", { name: "Enter classroom" }).click();
      await view.locator(".classroom-workspace").waitFor();
      await view.getByRole("button", { name: "Module", exact: true }).hover();
      await view.locator("#classroom-modules .module-catalog-card").filter({ hasText: item.module.title }).getByRole("button").first().click();
      const worksheet = view.locator("#classroom-worksheet");
      await worksheet.locator("article:not([hidden])").waitFor();
      await worksheet.getByRole("button", { name: /Step 1$/ }).first().click();
      await worksheet.locator("article:not([hidden])").getByRole("button", { name: "Work in code editor", exact: true }).click();

      const project = view.locator(".student-module-project");
      await project.waitFor();
      assert.match(await project.locator(".workspace-card-heading").first().innerText(), new RegExp(`Module preview · ${item.module.title}`));
      const sample = item.module.lessons[0].blocks[0].files;
      for (const file of [...item.module.starterFiles, ...sample]) await project.getByRole("button", { name: file.path, exact: true }).waitFor();
      const editor = project.getByRole("textbox", { name: item.editor, exact: true });
      assert.equal(await editor.inputValue(), sample[0].content, "the step's sample is in the main editor");
      assert.equal(await editor.isEditable(), true, "the teacher can edit it, even in a sample-first module");
      const footer = view.locator("footer.actionbar").filter({ hasText: "Return to class project" });
      assert.equal(await footer.getByRole("button", { name: "Save work" }).count(), 0, "no Save work in a preview");
      await project.getByText("Preview only — nothing is saved").waitFor();

      await editor.fill(item.edit(sample[0].content));
      await footer.getByRole("button", { name: /Run code/ }).click();
      if (item.subject === "Java") await view.waitForFunction((text) => document.querySelector('[aria-label="Program output"]')?.textContent?.includes(text), item.shows);
      else {
        const pageWindow = view.locator(".page-window");
        await pageWindow.waitFor();
        await view.waitForFunction(() => document.querySelector(".page-window header button")?.disabled === false);
        assert.match(await pageWindow.innerText(), new RegExp(item.shows), "the edited page runs in the page window");
        await pageWindow.getByRole("button", { name: "Close", exact: true }).click();
      }

      await footer.getByRole("button", { name: "Return to class project" }).click();
      await project.waitFor({ state: "detached" });
      assert.deepEqual(writes, [], "the preview saved nothing");
      const { data: rows } = await admin.from("module_progress").select("student_id").eq("classroom_id", classId);
      assert.deepEqual(rows, [], "no module progress was written");
      assert.deepEqual(errors, []);
      await teacher.close();
    }
  } finally {
    await browser.close();
    for (const id of classes) await admin.from("classrooms").delete().eq("id", id);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
