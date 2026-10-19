import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { require as tsxRequire } from "tsx/cjs/api";

const { studentEntryClassroom, rememberedStudentClassroom, rememberStudentClassroom } = tsxRequire("../app/studentClassroomEntry.ts", import.meta.url);
const { default: Landing } = tsxRequire("../app/Landing.tsx", import.meta.url);
const student = { id: "student-a", role: "student", passwordResetRequired: false };
const classes = [{ id: "class-a" }, { id: "class-b" }];

test("student entry: a single membership opens that classroom even with an obsolete saved choice", () => {
  assert.equal(studentEntryClassroom(student, [classes[0]], null, false), "class-a");
  assert.equal(studentEntryClassroom(student, [classes[0]], "former-class", false), "class-a");
});

test("student entry: multiple memberships reopen only a remembered class the student still belongs to", () => {
  assert.equal(studentEntryClassroom(student, classes, "class-b", false), "class-b");
  assert.equal(studentEntryClassroom(student, classes, null, false), null);
  assert.equal(studentEntryClassroom(student, classes, "former-class", false), null);
});

test("student entry: no membership never opens a saved or invented classroom", () => {
  assert.equal(studentEntryClassroom(student, [], "class-a", false), null);
});

test("student entry: teachers, required password reset and explicit Classes navigation do not auto-enter", () => {
  assert.equal(studentEntryClassroom({ ...student, role: "teacher" }, [classes[0]], "class-a", false), null);
  assert.equal(studentEntryClassroom({ ...student, passwordResetRequired: true }, [classes[0]], null, false), null);
  assert.equal(studentEntryClassroom(student, [classes[0]], "class-a", true), null);
  assert.equal(studentEntryClassroom(student, classes, "class-b", true), null);
});

test("student entry: remembered classrooms stay separate for different accounts on a shared browser", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  rememberStudentClassroom("student-a", "class-a", storage);
  assert.equal(rememberedStudentClassroom("student-b", storage), null);
  rememberStudentClassroom("student-b", "class-b", storage);
  assert.equal(rememberedStudentClassroom("student-a", storage), "class-a");
  assert.equal(rememberedStudentClassroom("student-b", storage), "class-b");
  assert.ok([...values.keys()].every((key) => key.startsWith("javashare-")));
});

test("student entry: unavailable browser storage still permits single-class entry and safe multi-class choice", () => {
  const storage = { getItem() { throw new Error("Storage disabled"); }, setItem() { throw new Error("Storage disabled"); } };
  assert.equal(rememberedStudentClassroom(student.id, storage), null);
  assert.doesNotThrow(() => rememberStudentClassroom(student.id, "class-a", storage));
  assert.equal(studentEntryClassroom(student, [classes[0]], rememberedStudentClassroom(student.id, storage), false), "class-a");
  assert.equal(studentEntryClassroom(student, classes, rememberedStudentClassroom(student.id, storage), false), null);
});

const renderChooser = (role, initialClassroomId = null) => renderToStaticMarkup(createElement(Landing, {
  role, name: "Test user", classrooms: classes.map((item) => ({ ...item, name: item.id, subject: "Java", hasActivity: false, hasLiveShare: false, liveSessionId: null })),
  initialClassroomId, onEnter() {}, onLogout() {}, async onRefresh() {}, onLiveStatusChange() {}, dismissedLiveSessions: {}, onDismissLiveClasses() {},
}));

test("student chooser: a former class-home selection cannot resurrect the removed module landing page", () => {
  const html = renderChooser("student", "class-a");
  assert.match(html, /<h1>Classes<\/h1>/);
  assert.match(html, /Choose a class to enter its classroom/);
  assert.match(html, /Join another class/);
  assert.equal((html.match(/>Open class<\/button>/g) ?? []).length, 2);
  assert.doesNotMatch(html, /Your modules|Enter classroom|View module progress|class-module-panel/);
});

test("teacher chooser: class creation and the teacher dashboard entry remain available", () => {
  const html = renderChooser("teacher");
  assert.match(html, /Teacher dashboard/);
  assert.match(html, /Create a class/);
  assert.match(html, /Open a class to see its modules and students/);
  assert.doesNotMatch(html, /Join another class/);
});
