import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { require as tsxRequire } from "tsx/cjs/api";

const { default: ModuleCatalogCard } = tsxRequire("../app/ModuleCatalogCard.tsx", import.meta.url);
const { default: WorkspaceDrawer } = tsxRequire("../app/WorkspaceDrawer.tsx", import.meta.url);
const cardFixture = { moduleId: "files", title: "Java File Handling", week: 15, course: "java", updatedAt: "", isActive: false, locked: false };
const renderCard = (changes = {}, percent = 0, role = "student") => renderToStaticMarkup(createElement(ModuleCatalogCard, { module: { ...cardFixture, ...changes }, percent, role, onOpen() {} }));

test("module catalog: displays saved progress and distinguishes continuing from reviewing", () => {
  const inProgress = renderCard({}, 60);
  assert.match(inProgress, /60% complete/);
  assert.match(inProgress, /width:60%/);
  assert.match(inProgress, /Continue lesson/);
  assert.match(inProgress, /Java File Handling/);
  assert.match(renderCard({}, 100), /Review lesson/);
  assert.doesNotMatch(renderCard({}, 0), /Review lesson/);
});

test("module catalog: the server's live lock disables opening and only the weekly pick gets its badge", () => {
  const locked = renderCard({ locked: true });
  assert.match(locked, /<button[^>]*disabled=""/);
  assert.match(locked, /Available after the live class/);
  assert.match(locked, />Locked</);
  assert.doesNotMatch(renderCard(), /disabled=/);
  assert.doesNotMatch(renderCard(), /THIS WEEK/);
  assert.match(renderCard({ isActive: true }), /THIS WEEK/);
});

test("module catalog: teacher browsing never invents student progress", () => {
  const teacher = renderCard({}, 0, "teacher");
  assert.match(teacher, /Java File Handling/);
  assert.doesNotMatch(teacher, /% complete|Continue lesson|Review lesson/);
});

test("workspace drawers: closed panels stay mounted but inaccessible so closing can animate", () => {
  const renderDrawer = (open, side, title) => renderToStaticMarkup(createElement(WorkspaceDrawer, { id: side, title, side, open, onClose() {} }, "Existing feature content"));
  const closed = renderDrawer(false, "left", "Course modules");
  assert.match(closed, /aria-hidden="true"/);
  assert.match(closed, /inert=""/);
  assert.match(closed, /data-open="false"/);
  assert.doesNotMatch(closed, /<aside[^>]* hidden=/);
  assert.match(closed, /Existing feature content/);
  const open = renderDrawer(true, "right", "Classroom chat");
  assert.doesNotMatch(open, /<aside[^>]* hidden=|inert=/);
  assert.match(open, /aria-hidden="false"/);
  assert.match(open, /data-open="true"/);
  assert.match(open, /aria-label="Classroom chat"/);
  assert.match(open, /aria-label="Close classroom chat"/);
  assert.match(open, /Existing feature content/);
  assert.match(renderDrawer(true, "left", "Course modules"), /aria-label="Course modules"/);
});

const { default: ModuleWorkspace } = tsxRequire("../app/ModuleWorkspace.tsx", import.meta.url);
test("workspace rails: one Module control and the role's Projects control share the fixed left rail", () => {
  for (const role of ["teacher", "student"]) {
    const html = renderToStaticMarkup(createElement(ModuleWorkspace, {
      classroomId: "local-class", role, browserOpen: false, projectsOpen: false,
      onBrowserChange() {}, onProjectsChange() {}, async onStartActivity() {},
    }));
    assert.equal((html.match(/aria-label="Module"/g) || []).length, 1);
    assert.match(html, /aria-controls="classroom-projects"/);
    assert.match(html, role === "teacher" ? /Students \/ projects/ : /> Projects</);
    assert.doesNotMatch(html, /worksheet-ear|worksheet-hover-bridge/);
  }
});

const { ModuleContent } = tsxRequire("../app/ModuleViewer.tsx", import.meta.url);
test("module worksheet: alteration instructions and target stay separate from the sample", () => {
  const course = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url), "utf8"));
  course.lessons[0].blocks[0].activity.id = "capacity-change";
  const html = renderToStaticMarkup(createElement(ModuleContent, { module: course, classroomId: "local-test", role: "teacher", worksheet: true }));
  assert.match(html, /Sample code/); assert.match(html, /Sample output/);
  assert.match(html, /Your task/); assert.match(html, /Expected task output/);
  assert.match(html, /Capacity: 20/); assert.match(html, /Capacity: 25/);
});

test("module parts: a locked next task does not hide the current task's discussion", () => {
  const course = JSON.parse(readFileSync(new URL("./fixtures/student-activity.codeshare.json", import.meta.url), "utf8"));
  course.lessons.forEach((lesson) => { lesson.blocks[0].part = "Vehicle"; });
  course.lessons[1].blocks[0].locked = true;
  const [part] = groupModuleParts(course);
  assert.equal(part.closed, false);
  course.lessons[0].blocks[0].locked = true;
  assert.equal(groupModuleParts(course)[0].closed, true);
});
test("module pages: inactive lessons and task editors stay mounted so navigation cannot discard drafts", () => {
  const course = JSON.parse(readFileSync(new URL("./fixtures/sample-module.codeshare.json", import.meta.url), "utf8"));
  course.availability = { openLessonIds: course.lessons.map((lesson) => lesson.id), performanceTaskOpen: true };
  const html = renderToStaticMarkup(createElement(ModuleContent, { module: course, classroomId: "local-test", role: "teacher", paged: true, onAvailabilityChanged() {} }));
  assert.match(html, /Counting with a for loop/);
  assert.match(html, /Counting down with a while loop/);
  assert.match(html, /int i = 3/);
  assert.match(html, /Sample code/);
  assert.match(html, /Your own version/);
  assert.equal((html.match(/class="module-lesson" hidden=""/g) ?? []).length, 2, "later lesson and performance task are hidden, not unmounted");
});

const { groupModuleParts } = tsxRequire("../app/moduleParts.ts", import.meta.url);
const { ModulePaperBlock } = tsxRequire("../app/ModuleViewer.tsx", import.meta.url);
const worksheetFixture = () => {
  const course = JSON.parse(readFileSync(new URL("./fixtures/sample-module.codeshare.json", import.meta.url), "utf8"));
  course.availability = { openLessonIds: course.lessons.map((lesson) => lesson.id), performanceTaskOpen: true };
  return course;
};

test("module parts: author grouping spans days and assigns discussion and exit slips exactly once", () => {
  const course = worksheetFixture();
  const [monday, tuesday] = course.lessons;
  monday.blocks[0].part = "Reading files";
  tuesday.blocks[0].part = "Reading files";
  monday.blocks.unshift({ type: "definition", term: "File", markdown: "A named store." });
  monday.blocks.push({ type: "note", markdown: "Keep this trailing note." });
  const finalStep = { ...tuesday.blocks[0], id: "second-part-step", part: "Writing files", number: 2 };
  tuesday.blocks.push({ type: "analogy", markdown: "A notebook." }, finalStep);
  const parts = groupModuleParts(course);
  assert.deepEqual(parts.map((part) => part.title), ["Reading files", "Writing files"]);
  assert.equal(parts[0].lessons.length, 2);
  assert.deepEqual(parts[0].blocks.map((block) => block.type), ["definition", "step", "note", "step"]);
  assert.deepEqual(parts[1].blocks.map((block) => block.type), ["analogy", "step"]);
  assert.deepEqual(parts.map((part) => part.exitLessons.map((lesson) => lesson.id)), [[monday.id], [tuesday.id]]);
  assert.equal(parts.flatMap((part) => part.blocks).length, monday.blocks.length + tuesday.blocks.length);
});

test("module parts: older lessons and redacted closed lessons retain their own safe pages", () => {
  const course = worksheetFixture();
  course.lessons[1] = { ...course.lessons[1], closed: true, blocks: [], exitSlip: { id: "closed-slip", questions: [] } };
  const parts = groupModuleParts(course);
  assert.deepEqual(parts.map((part) => part.id), course.lessons.map((lesson) => lesson.id));
  assert.equal(parts[0].closed, false);
  assert.equal(parts[1].closed, true);
  assert.deepEqual(parts[1].blocks, []);
});

test("module paper: tables, analogies, notes and error guides display their actual supplied content safely", () => {
  const render = (block) => renderToStaticMarkup(createElement(ModulePaperBlock, { block }));
  const table = render({ type: "table", columns: ["Collection", "Rule"], rows: [["**List**", "<script>alert(1)</script>"]] });
  assert.match(table, /<th>Collection<\/th>/);
  assert.match(table, /<td><b>List<\/b><\/td>/);
  assert.match(table, /&lt;script&gt;/);
  assert.doesNotMatch(table, /<script>/);
  assert.match(render({ type: "analogy", markdown: "The dispatcher's logbook." }), /Analogy.*logbook/s);
  assert.match(render({ type: "note", markdown: "Check the key." }), /Check yourself.*Check the key/s);
  assert.match(render({ type: "errorGuide", rows: [{ see: "Missing key", means: "No match", fix: "Check spelling" }] }), /<th>If you see<\/th>.*Missing key.*No match.*Check spelling/s);
  assert.match(render({ type: "error", markdown: "The index is outside the list.", message: "IndexOutOfBoundsException" }), /IndexOutOfBoundsException/);
});

test("module worksheet: named parts, unchanged samples, page controls and teacher-only sample preview coexist", () => {
  const course = worksheetFixture();
  course.lessons[0].blocks[0].part = "PART A — Lists";
  course.lessons[1].blocks[0].part = "PART B — Sets";
  const html = renderToStaticMarkup(createElement(ModuleContent, { module: course, classroomId: "local-test", role: "teacher", worksheet: true, onAvailabilityChanged() {} }));
  assert.match(html, /aria-label="Module parts"/);
  assert.match(html, /PART A — Lists/);
  assert.match(html, /PART B — Sets/);
  assert.match(html, /MONDAY · Step 1/);
  assert.match(html, /Page 1 of 5/);
  assert.match(html, /Next page/);
  assert.match(html, /Output \(expected\):/);
  assert.match(html, /1\n2\n3/);
  assert.match(html, /Preview sample code/);
  assert.doesNotMatch(html, /Open to students|Mark exit slip done|Practise this step/);
  assert.equal((html.match(/class="worksheet-paper" hidden=""/g) ?? []).length, 4);
  assert.match(html, /Sample code/);
  assert.match(html, /Your own version/);
  assert.match(html, /Presentation/);
  assert.match(html, /Correct output/);
  assert.doesNotMatch(html, /\d+ of \d+ parts completed/, "teacher preview must not invent student progress");
});

const { modulePartPages } = tsxRequire("../app/moduleParts.ts", import.meta.url);
test("module worksheet: inter-step tables and notes retain the uploaded reading order", () => {
  const course = worksheetFixture();
  const lesson = course.lessons[0];
  const first = lesson.blocks[0];
  lesson.blocks = [
    { type: "definition", term: "List", markdown: "Introduction before step one." },
    first,
    { type: "table", columns: ["Method"], rows: [["add(item)"]] },
    { type: "note", markdown: "After the first output." },
    { ...first, id: "second-step", number: 2 },
    { type: "note", markdown: "After the second output." },
  ];
  const pages = modulePartPages(groupModuleParts(course)[0]);
  assert.deepEqual(pages.map((page) => [page.step?.id ?? null, page.blocks.map((block) => block.type)]), [
    [null, ["definition"]], [first.id, ["table", "note"]], ["second-step", ["note"]],
  ]);
  const html = renderToStaticMarkup(createElement(ModuleContent, { module: course, classroomId: "local-test", role: "teacher", worksheet: true, onAvailabilityChanged() {} }));
  const articles = html.match(/<article\b[\s\S]*?<\/article>/g);
  assert.match(articles[0], /Introduction before step one/);
  assert.doesNotMatch(articles[0], /add\(item\)|After the first output/);
  assert.match(articles[1], /Output \(expected\):[\s\S]*add\(item\)[\s\S]*After the first output/);
  assert.doesNotMatch(articles[1], /LIPLET/);
  assert.match(articles[2], /After the second output[\s\S]*LIPLET/);
});
