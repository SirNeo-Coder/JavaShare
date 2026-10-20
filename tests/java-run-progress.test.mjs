import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { require as tsxRequire } from "tsx/cjs/api";

const { JavaRunProgress } = tsxRequire("../app/StudentModuleActivity.tsx", import.meta.url);
const render = (message, waiting = false) => renderToStaticMarkup(createElement(JavaRunProgress, { message, waiting }));

test("Java progress: idle, finished and failed runs leave no loading indicator", () => {
  assert.equal(render(null), "");
  assert.equal(render(null, true), "");
});

test("Java progress: saving, starting and checking are visible accessible status messages", () => {
  for (const message of ["Saving your code…", "Java is loading or running… Please wait.", "Checking your output…", "Running Java and checking output… Please wait."]) {
    const html = render(message);
    assert.match(html, /role="status"/);
    assert.match(html, /aria-live="polite"/);
    assert.ok(html.includes(`<strong>${message}</strong>`));
    assert.match(html, /class="java-run-spinner" aria-hidden="true"/);
  }
});

test("Java progress: waiting for an answer replaces the working message", () => {
  const html = render("Java is loading or running… Please wait.", true);
  assert.match(html, /Waiting for your input/);
  assert.match(html, /Program input and press Enter/);
  assert.doesNotMatch(html, /Please wait/);
});
