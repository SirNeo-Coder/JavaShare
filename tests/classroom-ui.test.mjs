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

const { ModuleContent } = tsxRequire("../app/ModuleViewer.tsx", import.meta.url);
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
