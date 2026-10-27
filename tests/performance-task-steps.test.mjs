import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { require as tsxRequire } from "tsx/cjs/api";
import { courseModule } from "../backend/src/course-module-schema.ts";

const { PerformanceTaskSteps, moduleCode, stepCode } = tsxRequire("../app/ModuleViewer.tsx", import.meta.url);
const fixture = JSON.parse(readFileSync(new URL("./fixtures/sample-module.codeshare.json", import.meta.url), "utf8"));
const weeks = [12, 13, 14, 15, 16, 17, 18, 19, 21];
const load = (week) => JSON.parse(readFileSync(new URL(`../docs/modules/week${week}/Java2_Week_${week}.codeshare.json`, import.meta.url), "utf8"));

test("performance task steps: upload keeps steps; a module without steps still uploads", () => {
  const withSteps = structuredClone(fixture);
  withSteps.performanceTask.steps = ["Plan it", "Build it"];
  assert.deepEqual(courseModule.parse(withSteps).performanceTask.steps, ["Plan it", "Build it"]);
  assert.equal(courseModule.parse(fixture).performanceTask.steps, undefined);
});

test("performance task steps: numbered list with inline formatting; nothing without steps", () => {
  const html = renderToStaticMarkup(createElement(PerformanceTaskSteps, { steps: ["Click **Copy code**", "Run `main`"] }));
  assert.match(html, /How to build it, step by step/);
  assert.match(html, /<ol><li>.*<b>Copy code<\/b>.*<\/li><li>.*<code>main<\/code>.*<\/li><\/ol>/);
  assert.equal(renderToStaticMarkup(createElement(PerformanceTaskSteps, {})), "");
  assert.equal(renderToStaticMarkup(createElement(PerformanceTaskSteps, { steps: [] })), "");
});

for (const week of weeks) {
  test(`Week ${week}: performance task steps upload and every named sample has a Copy button on its step`, () => {
    const content = load(week);
    const steps = courseModule.parse(content).performanceTask.steps;
    assert.ok(steps.length >= 5, "steps survive upload");
    const offered = new Set(moduleCode(content).map((code) => code.label));
    const named = steps.flatMap((step) => [...step.matchAll(/\*\*((?:Step \d+|Sample code) · [^*]+)\*\*/g)].map((match) => match[1]));
    assert.ok(named.length > 0);
    for (const step of steps) assert.doesNotMatch(step, /Code from this module/, "steps carry their own Copy buttons; that Console list is hidden");
    for (const label of named) assert.ok(offered.has(label), `Week ${week}: "${label}" is not a Copy code entry`);
    const buttons = steps.flatMap((step) => stepCode(step, content).map((code) => code.label));
    assert.deepEqual(new Set(buttons), new Set(named), "every named sample gets a Copy button on its step");
  });
}

test("Week 20: paper proposal has no performance task steps", () => {
  assert.equal(load(20).performanceTask.steps, undefined);
});
