import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { require as tsxRequire } from "tsx/cjs/api";
import { buildPreview, webPageOutput, webRunResult } from "../app/webPreview.ts";
import { checkableStep, matchesActivityOutput, matchesSample, mergeProjectFiles, sourcePath, teacherCheckedStep, unchangedSample, webPerformanceTask, webStep } from "../backend/src/module-activities.ts";
import { moduleWebPathError } from "../backend/src/file-paths.ts";
import { buildTeacherPreview } from "../app/teacherWebPreview.ts";
import { courseModule } from "../backend/src/course-module-schema.ts";
const { WebCheckList } = tsxRequire("../app/WebStepRun.tsx", import.meta.url);
const { default: StudentModuleActivity } = tsxRequire("../app/StudentModuleActivity.tsx", import.meta.url);

const page = (title, body) => `<!doctype html>\n<html>\n<head>\n  <title>${title}</title>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
const lesson = (id, order, blocks) => ({ id, order, dayLabel: `DAY ${order}`, title: `Lesson ${order}`, hours: 2,
  objectives: { cognitive: "c", affective: "a", psychomotor: "p" }, blocks,
  exitSlip: { id: `${id}-slip`, points: 5, afterStep: blocks[0].id, questions: [{ id: "1.1", kind: "Define", points: 5, prompt: "What is a tag?" }] } });
// One page step, one media step, one console step and one Java step, in that order (one part each).
const fixture = (id) => ({
  format: "codeshare-module", version: 1, course: "dotnet-1", week: 1, id, title: "Web check fixture",
  starterFiles: [{ path: "notes.txt", content: "Reference only" }],
  lessons: [
    lesson(`${id}-d1`, 1, [{ type: "step", id: `${id}-s1`, number: 1, instruction: "Run the page.", language: "html", run: "index.html",
      files: [{ path: "index.html", content: page("Canteen", "  <h1>Canteen</h1>\n  <p>Menu</p>") }], expectedOutput: "Tab title: Canteen\nVisible page text:\nCanteen\nMenu",
      webChecks: [{ selector: "h1", count: 1 }, { selector: "p", attribute: "class", value: "lead" }], includeMediaOutput: false }]),
    lesson(`${id}-d2`, 2, [{ type: "step", id: `${id}-s2`, number: 2, instruction: "Add a picture.", language: "html", run: "index.html",
      files: [{ path: "index.html", content: page("Canteen", "  <img src=\"images/a.svg\" alt=\"Snack\">") }], expectedOutput: "Tab title: Canteen\nVisible page text:\n\nMedia checks:\nimages/a.svg: image decoded",
      mediaChecks: [{ src: "images/a.svg", state: "loaded" }], includeMediaOutput: true }]),
    lesson(`${id}-d3`, 3, [{ type: "step", id: `${id}-s3`, number: 3, instruction: "Print the total.", language: "javascript", run: "app.js",
      files: [{ path: "app.js", content: "console.log(\"Total: \" + (2 + 3));" }], expectedOutput: "Total: 5" }]),
    lesson(`${id}-d4`, 4, [{ type: "step", id: `${id}-s4`, number: 4, instruction: "Java still uses its runner.", language: "java",
      files: [{ path: "Main.java", content: "public class Main { public static void main(String[] a) { System.out.println(1); } }" }], expectedOutput: "1" }]),
  ],
});

test("web check rule: page text is the tab title then the visible text with blank lines removed", () => {
  const output = webPageOutput({ title: "School Canteen", text: "\n School Canteen\n\nWelcome\n\n\nFood choices\nPandesal\n" });
  assert.equal(output, "Tab title: School Canteen\nVisible page text:\nSchool Canteen\nWelcome\nFood choices\nPandesal");
  const result = webRunResult("page", { lines: ["ignored console line"], errors: [], page: { title: "School Canteen", text: "School Canteen\n\nWelcome" } });
  assert.deepEqual(result, { mode: "page", success: true, output: "Tab title: School Canteen\nVisible page text:\nSchool Canteen\nWelcome" });
  assert.equal(matchesActivityOutput(result, "Tab title: School Canteen\r\nVisible page text:\r\nSchool Canteen\r\nWelcome\r\n"), true, "Windows line endings and one final line break are ignored");
});

test("web check rule: a mismatch fails, and spaces or a missing line break are never ignored", () => {
  const result = webRunResult("page", { lines: [], errors: [], page: { title: "School Canteen", text: "Welcome" } });
  assert.equal(matchesActivityOutput(result, "Tab title: School Canteen\nVisible page text:\nWelcome to the canteen"), false);
  assert.equal(matchesActivityOutput(result, "Tab title: School Canteen\nVisible page text: Welcome"), false, "Week 1's same-line format does not match the agreed rule");
  assert.equal(matchesActivityOutput(result, "Tab title: School Canteen\nVisible page text:\nWelcome "), false);
});

test("web check rule: an uncaught error or a page that never finished makes the run unsuccessful", () => {
  const expected = "Tab title: Canteen\nVisible page text:\nMenu";
  const errored = webRunResult("page", { lines: [], errors: ["missingFunction is not defined"], page: { title: "Canteen", text: "Menu" } });
  assert.equal(errored.output, expected);
  assert.equal(errored.success, false);
  assert.equal(errored.error, "Uncaught error: missingFunction is not defined");
  assert.equal(matchesActivityOutput(errored, expected), false, "matching text still fails when the page raised an uncaught error");
  const unfinished = webRunResult("page", { lines: [], errors: [] });
  assert.equal(unfinished.success, false); assert.match(unfinished.error, /did not finish loading/);
});

test("web check rule: a .js run file compares the console lines, joined with line breaks", () => {
  const result = webRunResult("console", { lines: ["Total: 5", "Done"], errors: [], page: { title: "", text: "" } });
  assert.deepEqual(result, { mode: "console", success: true, output: "Total: 5\nDone" });
  assert.equal(matchesActivityOutput(result, "Total: 5\nDone\n"), true);
  assert.equal(matchesActivityOutput(result, "Total: 5"), false);
  const thrown = webRunResult("console", { lines: ["Total: 5"], errors: ["boom"], page: { title: "", text: "" } });
  assert.equal(matchesActivityOutput(thrown, "Total: 5"), false);
});

test("web preview: the sandbox reports page text after drawing, flags uncaught errors, and opens the run file", () => {
  const preview = buildPreview([{ path: "index.html", content: page("Home", "<p>Home</p>") }, { path: "about.html", content: page("About", "<p>About</p>") }], "about.html");
  assert.match(preview.html, /<title>About<\/title>/);
  assert.match(preview.html, /requestAnimationFrame\(\(\)=>requestAnimationFrame\(\(\)=>parent\.postMessage\(\{codeshare:"page",title:document\.title,text:/);
  assert.match(preview.html, /addEventListener\("error",\(event\)=>post\("error",event\.message,event\.lineno\|\|null,true\)\)/);
  assert.match(buildPreview([{ path: "index.html", content: page("Home", "") }], "missing.html").html, /<title>Home<\/title>/);
});

test("module web steps use the no-internet preview and still open the step's run file", () => {
  const preview = buildTeacherPreview([{ path: "index.html", content: page("Home", "") }, { path: "about.html", content: page("About", "") }], "about.html");
  assert.match(preview.html, /^<!doctype html>\n?<meta http-equiv="Content-Security-Policy" content="default-src 'none';/);
  assert.match(preview.html, /<title>About<\/title>/);
  assert.match(readFileSync(new URL("../app/WebStepRun.tsx", import.meta.url), "utf8"), /: buildTeacherPreview\(files, runPath\)/, "module runs use the no-internet preview");
});

test("web steps: decided by file endings, with no Java-only path handling", () => {
  const files = (...paths) => paths.map((path) => ({ path, content: "" }));
  assert.equal(webStep({ files: files("index.html", "styles.css", "app.js") }), true);
  assert.equal(webStep({ files: files("Main.java") }), false);
  assert.equal(webStep({ files: files("index.html", "Main.java") }), false);
  assert.equal(webStep({ files: [] }), false, "a locked step with no files is not a web step");
  assert.equal(checkableStep({ language: "html", files: files("index.html") }), true);
  assert.equal(checkableStep({ language: "java", files: files("Main.java") }), true);
  assert.equal(checkableStep({ language: "csharp", files: files("Program.cs") }), false);
  assert.equal(sourcePath("src/app.js"), "src/app.js", "web files keep their src/ folder");
  assert.equal(sourcePath("src/Main.java"), "Main.java", "Java still treats src/Main.java as Main.java");
  assert.equal(mergeProjectFiles(files("src/app.js"), files("app.js")).length, 2);
  assert.equal(unchangedSample(files("src/app.js"), files("app.js")), false);
  assert.equal(matchesSample({ success: true, output: "Hi" }, { files: files("index.html"), expectedOutput: "Hi", expectedError: "java.lang.Exception" }), true, "Java's expectedError rule never applies to web pages");
  assert.equal(teacherCheckedStep({ expectedOutput: "Tab title: A\nVisible page text:\nA\nMedia checks:\nimages/a.svg: image decoded" }), true);
  assert.equal(teacherCheckedStep({ expectedOutput: "Tab title: A\nVisible page text:\nA" }), false, "includeMediaOutput without media output is checked automatically");
  for (const path of ["index.html", "css/site.css", "app.js", "MEDIA_README.txt"]) assert.equal(moduleWebPathError(path), null, path);
  for (const path of ["Main.java", "../index.html", ".hidden.html", "image.png"]) assert.ok(moduleWebPathError(path), path);
});

test("module upload keeps webChecks, mediaChecks and includeMediaOutput and rejects an unknown media state", () => {
  const parsed = courseModule.parse(fixture("web-schema"));
  assert.deepEqual(parsed.lessons[0].blocks[0].webChecks, [{ selector: "h1", count: 1 }, { selector: "p", attribute: "class", value: "lead" }]);
  assert.equal(parsed.lessons[0].blocks[0].includeMediaOutput, false);
  assert.deepEqual(parsed.lessons[1].blocks[0].mediaChecks, [{ src: "images/a.svg", state: "loaded" }]);
  const broken = fixture("web-schema"); broken.lessons[1].blocks[0].mediaChecks[0].state = "playing";
  assert.equal(courseModule.safeParse(broken).success, false);
});

test("web check list: a tick when it matches; a cross with Required output and Your output side by side when not", () => {
  const passed = renderToStaticMarkup(createElement(WebCheckList, { result: { mode: "page", success: true, output: "Tab title: A\nVisible page text:\nA" }, expected: "Tab title: A\nVisible page text:\nA" }));
  assert.match(passed, /class="passed"><span aria-hidden="true">✓<\/span> Page text matches/);
  assert.doesNotMatch(passed, /Required output/);
  const failed = renderToStaticMarkup(createElement(WebCheckList, { result: { mode: "console", success: false, output: "Total: 4", error: "Uncaught error: boom" }, expected: "Total: 5" }));
  assert.match(failed, /class="failed"><span aria-hidden="true">✗<\/span> Console output matches/);
  assert.match(failed, /web-check-compare"><div><b>Required output<\/b><pre>Total: 5<\/pre><\/div><div><b>Your output<\/b><pre aria-label="Your output">Total: 4<\/pre>/);
  assert.match(failed, /role="alert">Uncaught error: boom/);
  assert.match(renderToStaticMarkup(createElement(WebCheckList, { result: null, expected: "x", teacherChecked: true })), /Checked by your teacher for now/);
});

test("module editor for a web step: HTML editor on index.html, page preview instead of the Java console, no Program input", () => {
  const content = fixture("web-ui");
  const html = renderToStaticMarkup(createElement(StudentModuleActivity, {
    activity: { kind: "module", module: content, classroomId: "class", moduleId: content.id, moduleTitle: "Canteen", stepId: "web-ui-s1", stateId: "web-ui-s1", studentId: "student",
      instruction: "Run the page.", expectedOutput: content.lessons[0].blocks[0].expectedOutput, stdin: "",
      progress: { projectFiles: [{ path: "notes.txt", content: "Reference only" }, { path: "index.html", content: "<p>Menu</p>" }], stepStates: {}, updatedAt: "", percent: 0 } },
    ref: { current: null }, onChecked() {}, onClose() {},
  }));
  assert.match(html, /HTML source code editor/);
  assert.match(html, /file-tab active">index\.html/);
  assert.match(html, /<span>Web page<\/span>/);
  assert.match(html, /Press <b>Run code<\/b> to see your page here/);
  assert.doesNotMatch(html, /Program input|Program output|CheerpJ/);
});

// One web or Java step, then a personal performance task starting from starterFiles.
const personalFixture = (id, step, starterFiles) => ({
  format: "codeshare-module", version: 1, course: "dotnet-1", week: 2, id, title: "Personal project fixture", starterFiles: [],
  lessons: [lesson(`${id}-d1`, 1, [{ type: "step", id: `${id}-s1`, number: 1, ...step }])],
  performanceTask: { id: `${id}-pt`, title: "Your own page", markdown: "Build your own page.", checklist: ["Give the page a title"], exampleFiles: starterFiles, starterFiles,
    presentationOutline: [], questionsToPrepare: [], rubric: [{ criterion: "Page", points: 10 }], totalPoints: 10 },
});
const webPersonalStep = { instruction: "Run the page.", language: "html", run: "index.html", files: [{ path: "index.html", content: page("Canteen", "<p>Menu</p>") }], expectedOutput: "Tab title: Canteen\nVisible page text:\nMenu" };
const javaPersonalStep = { instruction: "Run it.", language: "java", files: [{ path: "Main.java", content: "public class Main { public static void main(String[] a) { System.out.println(1); } }" }], expectedOutput: "1" };

test("personal project: web when the performance task starts from web files, otherwise Java", () => {
  assert.equal(webPerformanceTask(personalFixture("a", webPersonalStep, [{ path: "index.html", content: "" }])), true);
  assert.equal(webPerformanceTask(personalFixture("b", javaPersonalStep, [{ path: "Main.java", content: "" }])), false);
  assert.equal(webPerformanceTask({}), false, "no performance task is not a web project");
});

test("personal web project editor: HTML editor and page preview, web file names, no Program input or Java console", () => {
  const content = personalFixture("pui", webPersonalStep, [{ path: "index.html", content: page("Mine", "<p>Hi</p>") }]);
  const files = [{ path: "index.html", content: page("Mine", "<p>Hi</p>") }, { path: "backup.txt", content: "old" }];
  const render = (kind, extra = {}) => renderToStaticMarkup(createElement(StudentModuleActivity, {
    activity: { kind, module: content, classroomId: "class", moduleId: content.id, moduleTitle: "Canteen", stepId: "", stateId: "", studentId: "student", instruction: "Build your own page.", expectedOutput: "", stdin: "",
      progress: { performanceProjectFiles: files, projectFiles: [], performanceTask: {}, stepStates: {}, updatedAt: "", percent: 50 }, ...extra },
    ref: { current: null }, onChecked() {}, onClose() {},
  }));
  const html = render("performance");
  assert.match(html, /HTML source code editor/);
  assert.match(html, /file-tab active">index\.html/);
  assert.match(html, /<span>Web page<\/span>/);
  assert.match(html, /aria-label="Add personal web file"/);
  assert.match(html, /Press <b>Run code<\/b> to see your page here/);
  assert.match(html, /Run the current files successfully before submitting\./);
  assert.match(html, /Submit this version/);
  assert.doesNotMatch(html, /Program input|Program output|CheerpJ|Required output/);
  const review = render("review", { review: { studentId: "student", studentName: "Ana", submissionId: "x", submission: { files, status: "pass", submittedAt: "" } } });
  assert.match(review, /Submitted personal project — read-only/);
  assert.match(review, /Press <b>Run code<\/b> to see your page here/);
  assert.doesNotMatch(review, /Program input|CheerpJ|Submit this version/);
});

let local;
try {
  const raw = execFileSync("npx", ["--no-install", "supabase", "status", "-o", "env"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  local = Object.fromEntries(raw.split("\n").map((line) => line.match(/^([A-Z_]+)="?([^"\n]*)"?$/)).filter(Boolean).map((m) => [m[1], m[2]]));
} catch { local = null; }

test("web steps offline (real routes): web completions are accepted, media steps wait for the teacher, Java is unchanged", { skip: !local?.API_URL && "local Supabase is not running" }, async (t) => {
  // Offline classroom settings: the laptop runs Java and there is no online Java runner.
  Object.assign(process.env, { SUPABASE_URL: local.API_URL, SUPABASE_ANON_KEY: local.ANON_KEY, SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET: local.JWT_SECRET, DATABASE_MODE: "supabase-local", LOCAL_JAVA_EXECUTION: "true", JAVA_RUNNER_URL: "", JWT_SECRET: "web-steps-test" });
  const { handleApi } = await import("../backend/src/routes.ts");
  const { getSupabaseAdmin } = await import("../backend/src/database.ts");
  const admin = getSupabaseAdmin();
  const users = [], cookies = [], password = randomUUID();
  const call = (path, cookie, method = "GET", body) => handleApi(new Request(`http://localhost:3000${path}`, { method, headers: { "content-type": "application/json", cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));
  const content = fixture(`web-${randomUUID().slice(0, 8)}`);
  const [s1, s2, s3, s4] = content.lessons.map((item) => item.blocks[0]);
  let classroomId;
  try {
    for (const role of ["teacher", "student", "teacher"]) {
      const { data, error } = await admin.auth.admin.createUser({ email: `web-${randomUUID()}@example.test`, password, email_confirm: true, user_metadata: { name: `Web ${role}` } });
      assert.equal(error, null); users.push(data.user);
      assert.equal((await admin.from("profiles").update({ role }).eq("id", data.user.id)).error, null);
      const response = await call("/api/auth/login", "", "POST", { email: data.user.email, password });
      assert.equal(response.status, 200); cookies.push(response.headers.get("set-cookie").split(";")[0]);
    }
    const { data, error } = await admin.from("classrooms").insert({ name: "Disposable web steps class", join_code: randomUUID().slice(0, 8).toUpperCase(), teacher_id: users[0].id, module_subject: "net-mvc" }).select("id").single();
    assert.equal(error, null); classroomId = data.id;
    assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[1].id })).error, null);
    assert.equal((await call(`/api/classrooms/${classroomId}/modules`, cookies[0], "POST", content)).status, 201);
    const base = `/api/classrooms/${classroomId}/modules/${content.id}`;
    const open = async (step) => (await call(`${base}/progress/activity?stepId=${step.id}`, cookies[1])).json();
    const complete = async (step, changes = {}) => {
      const progress = await open(step);
      return call(`${base}/progress/complete`, cookies[1], "POST", { stepId: step.id, updatedAt: progress.updatedAt, moduleVersion: progress.moduleVersion,
        completionId: randomUUID(), files: progress.projectFiles, success: true, output: step.expectedOutput, ...changes });
    };

    await t.test("upload stores the new fields; the student's web project keeps the .txt reference file", async () => {
      const saved = await (await call(`${base}`, cookies[0])).json();
      assert.deepEqual(saved.lessons[0].blocks[0].webChecks, s1.webChecks);
      assert.deepEqual(saved.lessons[1].blocks[0].mediaChecks, s2.mediaChecks);
      assert.equal(saved.lessons[1].blocks[0].includeMediaOutput, true);
      assert.deepEqual((await open(s1)).projectFiles.map((file) => file.path).sort(), ["index.html", "notes.txt"]);
    });

    await t.test("offline, a wrong page or an uncaught error is refused and a matching page completes the step", async () => {
      assert.equal((await complete(s1, { output: "Tab title: Canteen\nVisible page text:\nCanteen" })).status, 400);
      assert.equal((await complete(s1, { success: false })).status, 400);
      assert.equal((await complete(s1, { files: [{ path: "index.html", content: "" }, { path: "Main.java", content: "" }] })).status, 403, "mixed Java and web files take the Java rule and are refused offline");
      const response = await complete(s1);
      assert.equal(response.status, 200, await response.clone().text());
      const result = await response.json();
      assert.equal(result.progress.stepStates[s1.id], "pass");
      assert.equal(result.progress.percent, 25);
      assert.equal(result.module.lessons[1].closed, false, "the next part opens");
    });

    await t.test("a media step cannot be completed from the browser; only its own class teacher can mark it done", async () => {
      const refused = await complete(s2);
      assert.equal(refused.status, 400); assert.match(await refused.text(), /Your teacher checks this step/);
      const mark = (cookie, step) => call(`/api/classes/${classroomId}/students/${users[1].id}/modules/${content.id}/teacher-check`, cookie, "PUT", { stepId: step.id });
      assert.equal((await mark(cookies[1], s2)).status, 403, "students cannot mark");
      assert.equal((await mark(cookies[2], s2)).status, 403, "another teacher's class is refused");
      assert.equal((await mark(cookies[0], s1)).status, 404, "automatically checked steps cannot be marked");
      const marked = await mark(cookies[0], s2);
      assert.equal(marked.status, 200);
      assert.deepEqual(await marked.json(), { stepStates: { [s1.id]: "pass", [s2.id]: "pass" }, percent: 50 });
    });

    await t.test("offline, a .js step completes from its console output", async () => {
      const response = await complete(s3);
      assert.equal(response.status, 200, await response.clone().text());
      assert.equal((await response.json()).progress.stepStates[s3.id], "pass");
    });

    await t.test("Java steps keep their rules: offline browser results are refused and web files cannot complete them", async () => {
      const java = await complete(s4, { files: s4.files, output: "1" });
      assert.equal(java.status, 403); assert.match(await java.text(), /Offline progress must use the classroom Java runner/);
      assert.equal((await complete(s4, { files: [{ path: "index.html", content: "" }], output: "1" })).status, 400);
    });

    // Personal performance-task projects: a web one and a Java one in the same class.
    const webP = personalFixture(`wp-${randomUUID().slice(0, 8)}`, webPersonalStep, [{ path: "index.html", content: page("My page", "<p>Hello</p>") }]);
    const javaP = personalFixture(`jp-${randomUUID().slice(0, 8)}`, javaPersonalStep, [{ path: "Main.java", content: "public class Main { public static void main(String[] a) {} }" }]);
    for (const upload of [webP, javaP]) assert.equal((await call(`/api/classrooms/${classroomId}/modules`, cookies[0], "POST", upload)).status, 201);
    const personal = (target, route, method = "POST", body) => call(`/api/classrooms/${classroomId}/modules/${target.id}/progress/${route}`, cookies[1], method, body);
    const webPage = (files, view, changes = {}) => personal(webP, "personal-result", "POST", { updatedAt: view.updatedAt, success: true, files, output: "Tab title: My page\nVisible page text:\nHello", ...changes });
    const submit = (target, view) => personal(target, "performance-task", "PUT", { variant: "own", files: view.performanceProjectFiles, status: "pass", updatedAt: view.updatedAt });

    await t.test("web personal project opens from its index.html starter, keeps web and .txt files, refuses Java files", async () => {
      const progress = await (await call(`/api/classrooms/${classroomId}/modules/${webP.id}/progress/activity?stepId=${webP.id}-s1`, cookies[1])).json();
      const done = await personal(webP, "complete", "POST", { stepId: `${webP.id}-s1`, updatedAt: progress.updatedAt, moduleVersion: progress.moduleVersion, completionId: randomUUID(),
        files: progress.projectFiles, success: true, output: webPersonalStep.expectedOutput });
      assert.equal(done.status, 200, await done.clone().text());
      const opened = await personal(webP, "performance-project");
      assert.equal(opened.status, 200, await opened.clone().text());
      const view = await opened.json();
      assert.deepEqual(view.performanceProjectFiles, webP.performanceTask.starterFiles);
      assert.equal(view.percent, 50);
      const saved = await personal(webP, "performance-project", "PUT", { files: [...view.performanceProjectFiles, { path: "backup.txt", content: "Week 1" }], updatedAt: view.updatedAt });
      assert.equal(saved.status, 200, await saved.clone().text());
      assert.deepEqual((await saved.json()).performanceProjectFiles.map((file) => file.path), ["index.html", "backup.txt"]);
      const java = await personal(webP, "performance-project", "PUT", { files: javaP.performanceTask.starterFiles, updatedAt: view.updatedAt });
      assert.equal(java.status, 400); assert.match(await java.text(), /do not belong to this personal project/);
    });

    await t.test("offline, a web page run counts only for the exact saved files with page text; then Submit this version reaches 100%", async () => {
      let view = await (await personal(webP, "performance-project")).json();
      const files = view.performanceProjectFiles;
      const laptop = await personal(webP, "personal-run", "POST", { updatedAt: view.updatedAt });
      assert.equal(laptop.status, 400); assert.match(await laptop.text(), /Web pages run in your browser/);
      assert.equal((await personal(webP, "personal-result", "POST", { updatedAt: view.updatedAt, success: true })).status, 403, "a bare success flag is refused offline");
      assert.equal((await webPage([{ path: "index.html", content: "changed" }, files[1]], view)).status, 409, "files that differ from the saved project are refused");
      assert.equal((await webPage(files, view, { output: "" })).status, 400, "a successful run must report its page text");
      const failed = await webPage(files, view, { success: false, output: "" });
      assert.equal(failed.status, 200, await failed.clone().text());
      view = await failed.json();
      assert.equal((await submit(webP, view)).status, 409, "an unsuccessful run cannot be submitted");
      const ran = await webPage(files, view);
      assert.equal(ran.status, 200, await ran.clone().text());
      view = await ran.json();
      const submitted = await submit(webP, view);
      assert.equal(submitted.status, 200, await submitted.clone().text());
      const result = await submitted.json();
      assert.equal(result.performanceTask.own.status, "pass");
      assert.deepEqual(result.performanceTask.own.files, files);
      assert.equal(result.percent, 100);
    });

    await t.test("Java personal projects keep their rules: web files and web page results are refused", async () => {
      await call(`/api/classrooms/${classroomId}/modules/${javaP.id}/progress`, cookies[1]);
      assert.equal((await admin.from("module_progress").update({ step_states: { [`${javaP.id}-s1`]: "pass" } })
        .eq("student_id", users[1].id).eq("classroom_id", classroomId).eq("module_id", javaP.id)).error, null);
      const opened = await personal(javaP, "performance-project");
      assert.equal(opened.status, 200, await opened.clone().text());
      const view = await opened.json();
      assert.deepEqual(view.performanceProjectFiles.map((file) => file.path), ["Main.java"]);
      assert.equal((await personal(javaP, "performance-project", "PUT", { files: webP.performanceTask.starterFiles, updatedAt: view.updatedAt })).status, 400);
      const page = await personal(javaP, "personal-result", "POST", { updatedAt: view.updatedAt, success: true, files: webP.performanceTask.starterFiles, output: "Tab title: x" });
      assert.equal(page.status, 400); assert.match(await page.text(), /do not belong to this personal project/);
      assert.equal((await personal(javaP, "personal-result", "POST", { updatedAt: view.updatedAt, success: true })).status, 403, "offline still refuses browser Java claims");
    });

    await t.test("teacher class progress shows the web percentage and the media step as done", async () => {
      const progress = await (await call(`/api/classes/${classroomId}/module-progress`, cookies[0])).json();
      const mine = progress.students.find((student) => student.id === users[1].id).modules.find((module) => module.moduleId === content.id);
      assert.equal(mine.percent, 75);
      assert.deepEqual(mine.teacherChecks, [{ stepId: s2.id, number: 2, done: true }]);
    });
  } finally {
    if (classroomId) await admin.from("classrooms").delete().eq("id", classroomId);
    for (const user of users) await admin.auth.admin.deleteUser(user.id);
  }
});
