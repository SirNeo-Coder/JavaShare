import assert from "node:assert/strict";
import { test } from "node:test";
import { require as tsxRequire } from "tsx/cjs/api";
const { localEdit, remoteEdit, shareModuleLive, takeOperation, teacherWatching } = tsxRequire("../app/liveText.ts", import.meta.url);

const own = { isGroup: false, isTeacherWorkspace: false };

test("teacher live help: unfinished module work is shared only on the student's own workspace while the teacher watches", () => {
  assert.equal(shareModuleLive("student", own, true), true);
  assert.equal(shareModuleLive("student", own, false), false, "nothing is sent before the teacher selects the student");
  assert.equal(shareModuleLive("student", { isGroup: true, isTeacherWorkspace: false }, true), false, "group-mates never receive a module draft");
  assert.equal(shareModuleLive("student", { isGroup: false, isTeacherWorkspace: true }, true), false, "the whole class shares the Teacher Demo channel");
  assert.equal(shareModuleLive("teacher", own, true), false);
  assert.equal(shareModuleLive("student", undefined, true), false);
});

test("teacher live help: only a teacher's presence counts as watching", () => {
  assert.equal(teacherWatching({}), false);
  assert.equal(teacherWatching({ a: [{ online: true }] }), false);
  assert.equal(teacherWatching({ a: [{ teacher: "yes" }] }), false);
  assert.equal(teacherWatching({ a: [{ online: true }], b: [{ teacher: true, presence_ref: "x" }] }), true);
});

test("teacher live help: teacher and student typing at the same moment keep both changes", () => {
  const start = 'class Main {\n  int x = 1;\n}\n';
  const student = { path: "Main.java", content: start, base: null };
  const teacher = { path: "Main.java", content: start, base: null };
  localEdit(student, start.replace("int x = 1;", "int x = 1;\n  int y = 2;"));
  localEdit(teacher, start.replace("class Main", "public class Main"));
  const fromStudent = takeOperation(student, "team", 1);
  const fromTeacher = takeOperation(teacher, "team", 1);
  remoteEdit(student, fromTeacher);
  remoteEdit(teacher, fromStudent);
  const both = 'public class Main {\n  int x = 1;\n  int y = 2;\n}\n';
  assert.equal(student.content, both);
  assert.equal(teacher.content, both);
  assert.equal(takeOperation(student, "team", 2), null, "nothing left to send once both are applied");
});

test("teacher live help: a teacher edit arriving before the student's typing is sent is not erased by it", () => {
  const student = { path: "Main.java", content: "abc", base: null };
  localEdit(student, "abcd");
  remoteEdit(student, { teamId: "team", fileId: "Main.java", start: { line: 0, column: 0 }, end: { line: 0, column: 0 }, text: "X", content: "Xabc", sequence: 1 });
  assert.equal(student.content, "Xabcd");
  const teacher = { path: "Main.java", content: "Xabc", base: null };
  remoteEdit(teacher, takeOperation(student, "team", 1));
  assert.equal(teacher.content, "Xabcd");
});
