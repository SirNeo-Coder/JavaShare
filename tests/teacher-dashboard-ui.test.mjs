import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { require as tsxRequire } from "tsx/cjs/api";

const { default: TeacherClassDashboard } = tsxRequire("../app/TeacherClassDashboard.tsx", import.meta.url);
const props = { classroom: { id: "test-class", name: "Test class", subject: "Java", joinCode: "TEST", hasActivity: false, hasLiveShare: false, liveSessionId: null }, name: "Test Teacher", onClasses() {}, onEnter() {}, onLogout() {} };

test("teacher dashboard: navigation maps Students and Curriculum and exposes loading instead of fake totals", () => {
  const html = renderToStaticMarkup(createElement(TeacherClassDashboard, props));
  assert.match(html, /Teacher class navigation/);
  assert.match(html, /aria-current="page"[^>]*>.*Overview/);
  assert.match(html, />Students</);
  assert.match(html, />Curriculum</);
  assert.match(html, /Loading class progress/);
  assert.doesNotMatch(html, /Streak|Exercise accuracy|Average score|Spring 2025|Last active/);
});

test("teacher dashboard: avatar styles cannot override the existing classroom avatar (CKB-039)", () => {
  const html = renderToStaticMarkup(createElement(TeacherClassDashboard, props));
  assert.match(html, /class="teacher-progress-avatar"/);
  assert.doesNotMatch(html, /class="teacher-avatar"/);
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const dashboardCss = css.slice(css.indexOf("/* Teacher class home:"));
  assert.doesNotMatch(dashboardCss, /\.teacher-avatar\b/);
  assert.match(dashboardCss, /\.teacher-progress-avatar\b/);
});

test("workspace header: session boxes cannot push Present this code behind the Code editor (CKB-118)", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.team-header \{[^}]*grid-auto-flow:column/, "header items stay on one line");
  assert.match(css, /\.classroom-workspace \.main-area \{[^}]*grid-template-rows:auto minmax\(66px,auto\)/, "header row grows instead of spilling under the editor");
});

test("workspace header: End session and Stop sharing use the header button style (CKB-119)", () => {
  const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
  for (const label of ["End session", "Stop sharing"]) {
    const button = page.split("\n").find((line) => line.includes(`>${label}</button>`));
    assert.ok(button, `${label} button found`);
    assert.match(button, /className="secondary"/, `${label} must look like Present this code and Lesson library`);
  }
});
