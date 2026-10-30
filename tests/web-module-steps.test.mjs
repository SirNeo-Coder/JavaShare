import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { require as tsxRequire } from "tsx/cjs/api";
import { buildPreview, embedMedia, projectPath, webPageOutput, webRunResult } from "../app/webPreview.ts";
import { activityStateId, checkModuleRun, checkableStep, sampleStateId, matchesActivityOutput, mediaCheckLines, mediaLinesPass, matchesSample, mergeProjectFiles, sourcePath, teacherCheckedStep, unchangedSample, webCheckLines, webChecksPass, webPerformanceTask, webStep } from "../backend/src/module-activities.ts";
import { restoreModuleDraft } from "../app/moduleDeviceStore.ts";
import { MEDIA_LIMIT, mediaPathType, moduleWebPathError } from "../backend/src/file-paths.ts";
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
  assert.deepEqual(result, { mode: "page", success: true, output: "Tab title: School Canteen\nVisible page text:\nSchool Canteen\nWelcome", checks: [], media: [] });
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
  assert.deepEqual(result, { mode: "console", success: true, output: "Total: 5\nDone", checks: [], media: [] });
  assert.equal(matchesActivityOutput(result, "Total: 5\nDone\n"), true);
  assert.equal(matchesActivityOutput(result, "Total: 5"), false);
  const thrown = webRunResult("console", { lines: ["Total: 5"], errors: ["boom"], page: { title: "", text: "" } });
  assert.equal(matchesActivityOutput(thrown, "Total: 5"), false);
});

test("web preview: the sandbox reports page text after drawing, flags uncaught errors, and opens the run file", () => {
  const preview = buildPreview([{ path: "index.html", content: page("Home", "<p>Home</p>") }, { path: "about.html", content: page("About", "<p>About</p>") }], "about.html");
  assert.match(preview.html, /<title>About<\/title>/);
  assert.match(preview.html, /requestAnimationFrame\(\(\)=>requestAnimationFrame\(async\(\)=>\{const media=testMedia\?await Promise\.all\(\[\.\.\.document\.querySelectorAll\("img,audio,video"\)\]\.map\(mediaLine\)\):\[\];parent\.postMessage\(\{codeshare:"page",title:document\.title,text:/);
  assert.match(preview.html, /const testMedia=false;/, "only module media steps test pictures, sound and video");
  assert.match(preview.html, /addEventListener\("error",\(event\)=>post\("error",event\.message,event\.lineno\|\|null,true\)\)/);
  assert.match(buildPreview([{ path: "index.html", content: page("Home", "") }], "missing.html").html, /<title>Home<\/title>/);
});

test("module web steps use the no-internet preview and still open the step's run file", () => {
  const preview = buildTeacherPreview([{ path: "index.html", content: page("Home", "") }, { path: "about.html", content: page("About", "") }], "about.html");
  assert.match(preview.html, /^<!doctype html>\n?<meta http-equiv="Content-Security-Policy" content="default-src 'none';/);
  assert.match(preview.html, /<title>About<\/title>/);
  assert.match(readFileSync(new URL("../app/WebStepRun.tsx", import.meta.url), "utf8"), /: buildTeacherPreview\(files, runPath, checks, Boolean\(media\), true\)/, "module runs use the no-internet preview with project pages");
});

// Floating page window (teacher, 2026-10-30): links and frames open the project's own pages.
test("project pages: link and frame addresses resolve inside the project; the internet and mailto: stay outside", () => {
  assert.equal(projectPath("index.html", "about.html"), "about.html");
  assert.equal(projectPath("index.html", "./about.html#top"), "about.html");
  assert.equal(projectPath("pages/about.html", "contact.html?x=1"), "pages/contact.html");
  assert.equal(projectPath("pages/about.html", "../index.html"), "index.html");
  assert.equal(projectPath("pages/about.html", "/index.html"), "index.html");
  for (const outside of ["https://example.com/", "//example.com/a.html", "mailto:me@example.com", "data:text/html,hi"]) assert.equal(projectPath("index.html", outside), null, outside);
});

test("module previews send link clicks to CodeShare and show project pages in frames; the New web project preview is unchanged", () => {
  const files = [
    { path: "index.html", content: page("Home", '<a href="about.html">About</a>\n<iframe src="about.html" title="About frame"></iframe>\n<iframe src="missing.html"></iframe>\n<iframe src="https://example.com/"></iframe>\n<script>boom()</script>') },
    { path: "about.html", content: page("About", '<h1>About "me" & you</h1>\n<iframe src="index.html"></iframe>') },
  ];
  const plain = buildPreview(files);
  assert.doesNotMatch(plain.html, /codeshare:"open"/, "the New web project preview keeps ordinary links");
  assert.match(plain.html, /<iframe src="about.html" title="About frame"><\/iframe>/);
  const withPages = buildTeacherPreview(files, "index.html", [], false, true);
  assert.match(withPages.html, /const from="index\.html";addEventListener\("click"/);
  assert.match(withPages.html, /parent\.postMessage\(\{codeshare:"open",from,href\},"\*"\)/);
  const framed = withPages.html.match(/<iframe srcdoc="([^"]*)" title="About frame">/);
  assert.ok(framed, "the project page is shown through srcdoc");
  assert.match(framed[1], /<title>About<\/title>/);
  assert.match(framed[1], /About &quot;me&quot; &amp; you/, "the framed page is escaped inside the attribute");
  assert.match(framed[1], /const from=&quot;about\.html&quot;/, "links inside a framed page reach CodeShare too");
  assert.doesNotMatch(framed[1], /\n/, "the framed page stays on one line");
  assert.equal((withPages.html.match(/srcdoc=/g) ?? []).length, 1, "a framed page does not show frames again, so pages framing each other cannot loop");
  assert.equal(withPages.html.split("\n").length, buildTeacherPreview(files).html.split("\n").length, "line numbers still match the student's files");
  assert.match(withPages.html, /<iframe src="missing.html"><\/iframe>/);
  assert.match(withPages.html, /<iframe src="https:\/\/example.com\/"><\/iframe>/, "internet frames stay blocked by the no-internet policy");
  assert.deepEqual(withPages.warnings, ["index.html shows missing.html in a frame, but this project has no page with that name."]);
  assert.deepEqual(withPages.lineMap, buildTeacherPreview(files).lineMap);
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
  assert.match(html, /Press <b>Run code<\/b> to see your page\./);
  assert.doesNotMatch(html, /Program input|Program output|CheerpJ/);
});

// One web or Java step, then a personal performance task starting from starterFiles.
const personalFixture = (id, step, starterFiles) => ({
  format: "codeshare-module", version: 1, course: "dotnet-1", week: 2, id, title: "Personal project fixture", starterFiles: [],
  lessons: [lesson(`${id}-d1`, 1, [{ type: "step", id: `${id}-s1`, number: 1, ...step }])],
  performanceTask: { id: `${id}-pt`, title: "Your own page", markdown: "Build your own page.", checklist: ["Give the page a title"], exampleFiles: starterFiles, starterFiles,
    presentationOutline: [], questionsToPrepare: [], rubric: [{ criterion: "Page", points: 10 }], totalPoints: 10 },
});
// Net MVC weeks in the Java student workflow (teacher, 2026-10-29): sampleFirst, one alteration task per
// step, the next week linked with previousModuleId. A page step (with a page check) and a console step.
const sampleFirstWeek = (id, previousModuleId) => ({
  format: "codeshare-module", version: 1, course: "dotnet-1", week: previousModuleId ? 2 : 1, id, title: `Sample-first ${id}`, sampleFirst: true,
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
// The task answers, kept outside the module like the teacher's solutions/ folders.
const sampleFirstAnswer = (step) => step.run === "app.js" ? [{ path: "app.js", content: "console.log(\"Total: \" + (2 + 3 + 4));" }]
  : [{ path: "index.html", content: step.files[0].content.replace("<li>Pandesal</li>", "<li>Pandesal</li><li>Banana</li>") }];

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
      progress: { performanceProjectFiles: files, projectFiles: [], performanceTask: { project: { media: [{ path: "images/photo.png", id: "a".repeat(32), size: 2048 }] } }, stepStates: {}, updatedAt: "", percent: 50 }, ...extra },
    ref: { current: null }, onChecked() {}, onClose() {},
  }));
  const html = render("performance");
  assert.match(html, /HTML source code editor/);
  assert.match(html, /file-tab active">index\.html/);
  assert.match(html, /<span>Web page<\/span>/);
  assert.match(html, /aria-label="Add personal web file"/);
  assert.match(html, /Press <b>Run code<\/b> to see your page\./);
  assert.match(html, /Run the current files successfully before submitting\./);
  assert.match(html, /Submit this version/);
  assert.doesNotMatch(html, /Program input|Program output|CheerpJ|Required output/);
  assert.match(html, /aria-label="Media files"/, "the student's own pictures, sound and video");
  assert.match(html, /Your own pictures, sound and video for this project \(5 MB each, up to 10\)/);
  assert.match(html, /images\/photo\.png · 2 KB/);
  assert.match(html, /Add media files/);
  const review = render("review", { review: { studentId: "student", studentName: "Ana", submissionId: "x", submission: { files, status: "pass", submittedAt: "" } } });
  assert.match(review, /Submitted personal project — read-only/);
  assert.match(review, /Press <b>Run code<\/b> to see your page\./);
  assert.doesNotMatch(review, /Program input|CheerpJ|Submit this version|Add media files/);
});

// What a page that passes a step's own checks reports, as the browser sends it.
const passingChecks = (step) => (step.webChecks ?? []).map((check) => ({ count: check.count ?? 1, ...(check.attribute ? { attribute: check.value } : {}), ...(check.style ? { style: check.value } : {}) }));

test("page-element checks: one line per check, read like the teacher's checker", () => {
  const checks = [{ selector: "h1", count: 1 }, { selector: "html", attribute: "lang", value: "en" }, { selector: "ol", style: "list-style-type", value: "upper-alpha" }, { selector: "p" }];
  assert.deepEqual(webCheckLines(checks, [{ count: 1 }, { count: 1, attribute: "en" }, { count: 1, style: "upper-alpha" }, { count: 3 }]), [
    { label: "Page has 1 h1", passed: true, found: "" },
    { label: "html has lang=\"en\"", passed: true, found: "" },
    { label: "ol has list-style-type: upper-alpha", passed: true, found: "" },
  ], "a check with nothing to compare adds no line, like the checker");
  const failed = webCheckLines(checks, [{ count: 2 }, { count: 1, attribute: "fil" }, { count: 1, style: "decimal" }]);
  assert.deepEqual(failed.map((line) => [line.passed, line.found]), [[false, "2"], [false, "fil"], [false, "decimal"]]);
  assert.deepEqual(webCheckLines([{ selector: "ol", attribute: "start", value: "2" }], [{ count: 0, attribute: null }]), [{ label: "ol has start=\"2\"", passed: false, found: "nothing" }], "a missing element fails");
  assert.equal(webChecksPass([{ selector: "h1", count: 1 }], [null]), false, "a selector the page could not use fails");
  assert.equal(webChecksPass([{ selector: "h1", count: 1 }], undefined), false, "no report fails");
  assert.equal(webChecksPass(undefined, undefined), true, "steps without checks are unchanged");
  assert.equal(webChecksPass([{ selector: "html", attribute: "lang" }], [{ count: 1 }]), false, "an attribute check without a value never passes, like the checker");
});

test("page-element checks apply to the step's own sample, not to an alteration task", () => {
  const step = { id: "s", instruction: "", files: [{ path: "index.html", content: "x" }], expectedOutput: "out", webChecks: [{ selector: "h1", count: 1 }] };
  const run = (checks) => ({ success: true, output: "out", checks });
  assert.equal(checkModuleRun({}, step, {}, step.files, run([{ count: 1 }])).passed, true);
  assert.equal(checkModuleRun({}, step, {}, step.files, run([{ count: 0 }])).passed, false, "the page text matches but a page check fails");
  const task = { ...step, activity: { id: "t", instruction: "", files: step.files, expectedOutput: "changed" } };
  assert.equal(checkModuleRun({ sampleFirst: true }, task, {}, step.files, run([{ count: 0 }])).sampleMatched, false, "sample verification needs the checks");
  assert.equal(checkModuleRun({ sampleFirst: true }, task, { "sample:t": "pass" }, step.files, { success: true, output: "changed", checks: [{ count: 0 }] }).passed, true, "the alteration task is not held to the sample's checks");
  const draft = { files: step.files, moduleVersion: "v", stateId: "task:t", sample: { files: step.files, success: true, output: "out", checks: [{ count: 0 }] } };
  assert.equal(restoreModuleDraft(draft, { files: step.files, moduleVersion: "v", stateId: "task:t" }, step, true).sample, undefined, "a saved sample that failed its checks is not restored as verified");
});

test("the preview carries the step's checks into the page safely and reports them with the page text", () => {
  const html = buildTeacherPreview([{ path: "index.html", content: page("Home", "<h1>Hi</h1>") }], "index.html", [{ selector: "h1", count: 1 }, { selector: "</script><b>", count: 0 }]).html;
  assert.match(html, /const checks=\[\{"selector":"h1","count":1\},\{"selector":"\\u003c\/script>\\u003cb>","count":0\}\]/);
  assert.match(html, /checks:checks\.map\(probe\)/);
  assert.equal(html.split("</script>").length, 2, "a selector cannot close the capture script");
  assert.equal(webRunResult("page", { lines: [], errors: [], page: { title: "Home", text: "Hi", checks: [{ count: 1 }] } }).checks.length, 1);
});

// Week 3 Step 5: two files are missing on purpose and must fail; the counter picture must load.
const week3Step5 = { expectedOutput: "Tab title: Canteen\nVisible page text:\nMenu\nMedia checks:\nimages/snack.svg: image failed to decode\nimages/counter.svg: image decoded\naudio/chime-missing.wav: playback failed",
  mediaChecks: [{ src: "images/snack.svg", state: "broken" }, { src: "audio/chime-missing.wav", state: "broken" }] };
const step5Lines = ["images/snack.svg: image failed to decode", "images/counter.svg: image decoded", "audio/chime-missing.wav: playback failed"];

test("media files: only images/, audio/ or video/ with a picture, sound or video ending, 5 MB each", () => {
  assert.equal(mediaPathType("images/snacks.svg"), "image/svg+xml");
  assert.equal(mediaPathType("audio/chime.wav"), "audio/wav");
  assert.equal(mediaPathType("video/canteen.webm"), "video/webm");
  for (const path of ["snacks.svg", "images/../secret.svg", "images/a b.png", "docs/a.svg", "images/a.html", "images/sub/a.svg"]) assert.equal(mediaPathType(path), null, path);
  assert.equal(MEDIA_LIMIT, 5 * 1024 * 1024);
});

test("media rule: like the teacher's checker, every picture, sound or video loads unless mediaChecks says broken", () => {
  assert.equal(mediaLinesPass(week3Step5.mediaChecks, step5Lines), true, "Week 3 Step 5's deliberate failures pass");
  assert.equal(mediaLinesPass(week3Step5.mediaChecks, ["images/snack.svg: image decoded", ...step5Lines.slice(1)]), false, "a file listed as broken must not load");
  assert.equal(mediaLinesPass([], ["images/counter.svg: image failed to decode"]), false, "an unlisted file must load");
  assert.equal(mediaLinesPass(week3Step5.mediaChecks, step5Lines.slice(1)), false, "a listed file must be on the page");
  assert.deepEqual(mediaCheckLines(week3Step5.mediaChecks, step5Lines.slice(1)).at(-1), { label: "images/snack.svg on the page", passed: false, found: "nothing" });
  assert.equal(mediaLinesPass(undefined, undefined), true);
  const step = { id: "m", instruction: "", files: [{ path: "index.html", content: "x" }], ...week3Step5 };
  const result = (media) => webRunResult("page", { lines: [], errors: [], page: { title: "Canteen", text: "Menu", media } }, true);
  assert.equal(result(step5Lines).output, week3Step5.expectedOutput, "includeMediaOutput appends the media lines");
  assert.equal(webRunResult("page", { lines: [], errors: [], page: { title: "Canteen", text: "Menu", media: step5Lines } }).output, "Tab title: Canteen\nVisible page text:\nMenu", "without includeMediaOutput the lines stay out of the output");
  assert.equal(checkModuleRun({}, step, {}, step.files, result(step5Lines)).passed, true);
  const wrong = { ...result(step5Lines), media: ["images/snack.svg: image decoded", ...step5Lines.slice(1)] };
  assert.equal(checkModuleRun({}, step, {}, step.files, wrong).passed, false, "matching text with a wrong media state fails");
});

test("module media goes into the page as data: URLs, keeps the written path, and leaves missing files to fail", () => {
  const html = "<body>\n<img src=\"images/snacks.svg\"\nalt=\"Snacks\">\n<img src='images/snack.svg'>\n<audio controls src=\"./audio/chime.wav\"></audio>\n<p>src=\"images/snacks.svg\"</p></body>";
  const [page, style] = embedMedia([{ path: "index.html", content: html }, { path: "site.css", content: "img{src:'images/snacks.svg'}" }], { "images/snacks.svg": "data:image/svg+xml;base64,AA==", "audio/chime.wav": "data:audio/wav;base64,BB==" });
  assert.equal(page.content, "<body>\n<img src=\"data:image/svg+xml;base64,AA==\" data-codeshare-src=\"images/snacks.svg\"\nalt=\"Snacks\">\n<img src='images/snack.svg'>\n<audio controls src=\"data:audio/wav;base64,BB==\" data-codeshare-src=\"./audio/chime.wav\"></audio>\n<p>src=\"images/snacks.svg\"</p></body>");
  assert.equal(page.content.split("\n").length, html.split("\n").length, "line numbers stay the same");
  assert.equal(style.content, "img{src:'images/snacks.svg'}", "only HTML tags change");
  const preview = buildTeacherPreview([page], "index.html", [], true).html;
  assert.match(preview, /media-src data:;/, "the no-internet preview allows sound and video only from the page itself");
  assert.match(preview, /const testMedia=true;/);
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
    for (const role of ["teacher", "student", "teacher", "student"]) {
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
        completionId: randomUUID(), files: progress.projectFiles, success: true, output: step.expectedOutput, checks: passingChecks(step), ...changes });
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
      const pageChecks = await complete(s1, { checks: [{ count: 1 }, { count: 1, attribute: null }] });
      assert.equal(pageChecks.status, 400, "a failed page-element check is refused"); assert.match(await pageChecks.text(), /page checks/);
      assert.equal((await complete(s1, { checks: undefined })).status, 400, "page-element checks need the page's report");
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

    // Module media: OpenNext keeps Cloudflare's bindings on this global; a stand-in bucket plays R2 here.
    const mediaModule = { format: "codeshare-module", version: 1, course: "dotnet-1", week: 3, id: `wm-${randomUUID().slice(0, 8)}`, title: "Media fixture", starterFiles: [],
      lessons: [lesson(`wm-d1-${randomUUID().slice(0, 4)}`, 1, [{ type: "step", id: `wm-s1-${randomUUID().slice(0, 4)}`, number: 1, instruction: "Repair the pictures.", language: "html", run: "index.html",
        files: [{ path: "index.html", content: page("Canteen", "<p>Menu</p><img src=\"images/snack.svg\"><img src=\"images/counter.svg\"><audio src=\"audio/chime-missing.wav\"></audio>") }],
        includeMediaOutput: true, ...week3Step5 }])] };
    const [mediaStep] = mediaModule.lessons[0].blocks;
    assert.equal((await call(`/api/classrooms/${classroomId}/modules`, cookies[0], "POST", mediaModule)).status, 201);
    const mediaUrl = (path = "") => `/api/classes/${classroomId}/modules/${mediaModule.id}/media${path}`;
    const readUrl = (path = "") => `/api/classrooms/${classroomId}/modules/${mediaModule.id}/media${path}`;
    const upload = (cookie, path, bytes, type = "image/svg+xml") => handleApi(new Request(`http://localhost:3000${mediaUrl(path)}`, { method: "PUT", headers: { "content-type": type, cookie }, body: bytes }));
    const completeMedia = async (changes = {}) => {
      const progress = await (await call(`/api/classrooms/${classroomId}/modules/${mediaModule.id}/progress/activity?stepId=${mediaStep.id}`, cookies[1])).json();
      return call(`/api/classrooms/${classroomId}/modules/${mediaModule.id}/progress/complete`, cookies[1], "POST", { stepId: mediaStep.id, updatedAt: progress.updatedAt, moduleVersion: progress.moduleVersion,
        completionId: randomUUID(), files: progress.projectFiles, success: true, output: mediaStep.expectedOutput, media: step5Lines, ...changes });
    };
    const contextKey = Symbol.for("__cloudflare-context__");
    const objects = new Map();
    const bucket = {
      async list({ prefix, limit = 1000 }) { return { objects: [...objects].filter(([key]) => key.startsWith(prefix)).slice(0, limit).map(([key, value]) => ({ key, size: value.bytes.length, etag: value.etag })) }; },
      async get(key) { const value = objects.get(key); return value ? { body: new Blob([value.bytes]).stream(), httpMetadata: { contentType: value.type } } : null; },
      async put(key, bytes, options) { objects.set(key, { bytes: new Uint8Array(bytes), etag: randomUUID(), type: options.httpMetadata.contentType }); },
      async delete(key) { objects.delete(key); },
    };

    await t.test("offline (no media storage), media files are unavailable and media steps stay teacher-checked", async () => {
      assert.equal((await call(readUrl(), cookies[1])).status, 503);
      const refused = await completeMedia();
      assert.equal(refused.status, 400); assert.match(await refused.text(), /Your teacher checks this step/);
    });

    await t.test("online, only the class's teacher uploads or removes media; the class reads one shared copy", async () => {
      globalThis[contextKey] = { env: { MODULE_MEDIA: bucket } };
      try {
        const svg = new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg' width='4' height='4'/>");
        assert.deepEqual(await (await call(readUrl(), cookies[1])).json(), { files: [] });
        assert.equal((await completeMedia()).status, 400, "no media uploaded yet: still teacher-checked");
        assert.equal((await upload(cookies[1], "/images/counter.svg", svg)).status, 403, "students cannot upload");
        assert.equal((await upload(cookies[2], "/images/counter.svg", svg)).status, 403, "another teacher's class is refused");
        assert.equal((await upload(cookies[0], "/images/counter.html", svg)).status, 400, "only picture, sound or video names");
        assert.equal((await upload(cookies[0], "/images/big.png", new Uint8Array(MEDIA_LIMIT + 1), "image/png")).status, 413, "5 MB at most");
        const uploaded = await upload(cookies[0], "/images/counter.svg", svg);
        assert.equal(uploaded.status, 200, await uploaded.clone().text());
        assert.deepEqual((await uploaded.json()).files.map((file) => file.path), ["images/counter.svg"]);
        const listed = await (await call(readUrl(), cookies[1])).json();
        assert.deepEqual(listed.files.map((file) => [file.path, file.size]), [["images/counter.svg", svg.length]]);
        const file = await call(readUrl("/images/counter.svg"), cookies[1]);
        assert.equal(file.status, 200); assert.equal(file.headers.get("content-type"), "image/svg+xml");
        assert.deepEqual(new Uint8Array(await file.arrayBuffer()), svg);
        assert.equal((await call(readUrl("/images/counter.svg"), cookies[2])).status, 403, "another teacher cannot read this class's media");
        assert.equal([...objects.keys()].length, 1, "one shared copy, not one per student");
        assert.match([...objects.keys()][0], new RegExp(`^${users[0].id}/net-mvc/${mediaModule.id}/images/counter\\.svg$`));
      } finally { delete globalThis[contextKey]; }
    });

    await t.test("online with media uploaded, a media step completes only with matching media lines", async () => {
      globalThis[contextKey] = { env: { MODULE_MEDIA: bucket } };
      try {
        const wrong = await completeMedia({ media: ["images/snack.svg: image decoded", ...step5Lines.slice(1)] });
        assert.equal(wrong.status, 400); assert.match(await wrong.text(), /pictures, sound or video do not match/);
        assert.equal((await completeMedia({ media: undefined })).status, 400, "the page must report its media");
        const done = await completeMedia();
        assert.equal(done.status, 200, await done.clone().text());
        assert.equal((await done.json()).progress.stepStates[mediaStep.id], "pass");
        const removed = await call(mediaUrl("/images/counter.svg"), cookies[0], "DELETE");
        assert.deepEqual((await removed.json()).files, []);
      } finally { delete globalThis[contextKey]; }
    });

    await t.test("students' own media in a web personal project: own folder, new copy per upload, run and submit cover it, unused copies go", async () => {
      const mediaRoute = (target, path, cookie = cookies[1], method = "PUT", bytes, type = "image/png") => handleApi(new Request(`http://localhost:3000/api/classrooms/${classroomId}/modules/${target.id}/progress/performance-project/media${path}`,
        { method, headers: { "content-type": type, cookie }, ...(bytes ? { body: bytes } : {}) }));
      const read = (id, cookie = cookies[1], student = users[1].id) => call(`/api/classrooms/${classroomId}/students/${student}/personal-media/${id}`, cookie);
      const png = new Uint8Array([137, 80, 78, 71, 1, 2, 3]);
      const studentKeys = () => [...objects.keys()].filter((key) => key.startsWith(`students/${classroomId}/${users[1].id}/`));
      assert.equal((await mediaRoute(webP, "/images/photo.png", cookies[1], "PUT", png)).status, 503, "offline there is no media storage");
      globalThis[contextKey] = { env: { MODULE_MEDIA: bucket } };
      try {
        assert.equal((await admin.from("classroom_members").insert({ classroom_id: classroomId, user_id: users[3].id })).error, null);
        assert.equal((await mediaRoute(javaP, "/images/photo.png", cookies[1], "PUT", png)).status, 400, "Java personal projects hold no media");
        assert.equal((await mediaRoute(webP, "/images/photo.html", cookies[1], "PUT", png)).status, 400, "only picture, sound or video names");
        assert.equal((await mediaRoute(webP, "/images/big.png", cookies[1], "PUT", new Uint8Array(MEDIA_LIMIT + 1))).status, 413, "5 MB at most");
        assert.equal((await mediaRoute(webP, "/images/photo.png", cookies[0], "PUT", png)).status, 403, "a teacher has no personal project to add to");
        let view = await (await personal(webP, "performance-project")).json();
        assert.equal(view.performanceTask.own.status, "pass", "submitted earlier without media");
        const added = await mediaRoute(webP, "/images/photo.png", cookies[1], "PUT", png);
        assert.equal(added.status, 200, await added.clone().text());
        view = await added.json();
        const [first] = view.performanceTask.project.media;
        assert.deepEqual([first.path, first.size], ["images/photo.png", png.length]);
        assert.deepEqual(studentKeys(), [`students/${classroomId}/${users[1].id}/${first.id}`], "the student's own folder, not the module's shared copy");
        assert.equal((await submit(webP, view)).status, 409, "adding media undoes the earlier successful run");
        view = await (await personal(webP, "performance-project", "PUT", { files: view.performanceProjectFiles, updatedAt: view.updatedAt })).json();
        assert.deepEqual(view.performanceTask.project.media, [first], "Save work keeps the media list");

        const file = await read(first.id);
        assert.equal(file.status, 200);
        assert.equal(file.headers.get("content-type"), "image/png");
        assert.equal(file.headers.get("x-content-type-options"), "nosniff");
        assert.match(file.headers.get("content-security-policy"), /sandbox/, "never runs as a page if opened directly");
        assert.deepEqual(new Uint8Array(await file.arrayBuffer()), png);
        assert.equal((await read(first.id, cookies[0])).status, 200, "the class's teacher reads it for Review personal submission");
        assert.equal((await read(first.id, cookies[2])).status, 403, "another class's teacher is refused");
        assert.equal((await read(first.id, cookies[3])).status, 403, "another student in the class is refused");
        assert.equal((await read(first.id, cookies[3], users[3].id)).status, 404, "an id is only found in its own student's folder");
        assert.equal((await read("../x")).status, 404);

        view = await (await webPage(view.performanceProjectFiles, view)).json();
        const submitted = await submit(webP, view);
        assert.equal(submitted.status, 200, await submitted.clone().text());
        assert.deepEqual((await submitted.json()).performanceTask.own.media, [first], "the frozen submission keeps its media");

        view = await (await mediaRoute(webP, "/images/photo.png", cookies[1], "PUT", new Uint8Array([9, 9]))).json();
        const [second] = view.performanceTask.project.media;
        assert.notEqual(second.id, first.id, "replacing a file makes a new copy");
        assert.equal(studentKeys().length, 2, "the submitted copy is kept");
        const removed = await mediaRoute(webP, "/images/photo.png", cookies[1], "DELETE");
        assert.equal(removed.status, 200, await removed.clone().text());
        view = await removed.json();
        assert.deepEqual(view.performanceTask.project.media, []);
        assert.deepEqual(studentKeys(), [`students/${classroomId}/${users[1].id}/${first.id}`], "an unused copy is deleted, the submitted one stays");
        assert.equal((await mediaRoute(webP, "/images/photo.png", cookies[1], "DELETE")).status, 404);
        view = await (await webPage(view.performanceProjectFiles, view)).json();
        assert.equal((await submit(webP, view)).status, 200);
        assert.deepEqual(studentKeys(), [], "resubmitting without media deletes the old submitted copy");

        for (let index = 0; index < 10; index++) view = await (await mediaRoute(webP, `/images/p${index}.png`, cookies[1], "PUT", png)).json();
        const full = await mediaRoute(webP, "/images/extra.png", cookies[1], "PUT", png);
        assert.equal(full.status, 400); assert.match(await full.text(), /at most 10 media files/);
        assert.equal(studentKeys().length, 10, "a refused upload leaves no copy behind");
        assert.equal((await mediaRoute(webP, "/images/p0.png", cookies[1], "PUT", png)).status, 200, "replacing a file is allowed when full");
      } finally { delete globalThis[contextKey]; }
    });

    await t.test("sample first (Java workflow) for web steps: a task completes only after its unchanged sample, page checks belong to the sample, the next week waits", async () => {
      const weekA = sampleFirstWeek(`sfa-${randomUUID().slice(0, 8)}`), weekB = sampleFirstWeek(`sfb-${randomUUID().slice(0, 8)}`, weekA.id);
      for (const week of [weekA, weekB]) assert.equal((await call(`/api/classrooms/${classroomId}/modules`, cookies[0], "POST", week)).status, 201);
      const [a1, a2] = weekA.lessons.map((item) => item.blocks[0]);
      const route = (week, path) => `/api/classrooms/${classroomId}/modules/${week.id}/progress${path}`;
      const finish = async (step, changes = {}) => {
        const opened = await call(route(weekA, `/activity?stepId=${step.id}`), cookies[1]);
        assert.equal(opened.status, 200, await opened.clone().text());
        const view = await opened.json();
        const answer = mergeProjectFiles(view.projectFiles, sampleFirstAnswer(step));
        return call(route(weekA, "/complete"), cookies[1], "POST", { stepId: step.id, updatedAt: view.updatedAt, moduleVersion: view.moduleVersion, completionId: randomUUID(),
          files: answer, success: true, output: step.activity.expectedOutput, checks: passingChecks(step).map(() => ({ count: 2 })),
          sample: { files: mergeProjectFiles(view.projectFiles, step.files), success: true, output: step.expectedOutput, checks: passingChecks(step) }, ...changes });
      };
      const refused = async (response, message) => { assert.equal(response.status, 400); assert.match(await response.text(), message); };
      assert.equal((await call(route(weekA, `/activity?stepId=${a2.id}`), cookies[1])).status, 403, "the second step waits for the first task");
      await refused(await finish(a1, { sample: undefined }), /Run the supplied sample unchanged/);
      await refused(await finish(a1, { sample: { files: sampleFirstAnswer(a1), success: true, output: a1.expectedOutput, checks: passingChecks(a1) } }), /Run the supplied sample unchanged/);
      await refused(await finish(a1, { sample: { files: a1.files, success: true, output: a1.expectedOutput, checks: [{ count: 0 }] } }), /Run the supplied sample unchanged/);
      await refused(await finish(a1, { output: a1.expectedOutput }), /has not completed successfully/);
      const blocked = await call(route(weekB, ""), cookies[1]);
      assert.equal(blocked.status, 403, "the next week waits for this one"); assert.match(await blocked.text(), /Week 1/);
      const done = await finish(a1);
      assert.equal(done.status, 200, await done.clone().text());
      const states = (await done.json()).progress.stepStates;
      assert.equal(states[activityStateId(a1)], "pass"); assert.equal(states[sampleStateId(a1)], "pass", "the page with two items completed the task though the sample's page check counts one");
      const consoleDone = await finish(a2);
      assert.equal(consoleDone.status, 200, await consoleDone.clone().text());
      assert.equal((await consoleDone.json()).progress.stepStates[activityStateId(a2)], "pass");
      const opened = await call(route(weekB, `/activity?stepId=${weekB.lessons[0].blocks[0].id}`), cookies[1]);
      assert.equal(opened.status, 200, await opened.clone().text());
      assert.deepEqual((await opened.json()).projectFiles.find((file) => file.path === "app.js")?.content, sampleFirstAnswer(a2)[0].content, "the module project carries forward from the previous week");
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
