// Run with: npm test
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { courseModule } from "../backend/src/course-module-schema.ts";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/sample-module.codeshare.json", import.meta.url), "utf8"));

test("course module schema: accepts a module matching docs/course-format.md", () => {
  const parsed = courseModule.safeParse(fixture);
  assert.equal(parsed.success, true);
});

test("course module schema: rejects a step missing expectedOutput", () => {
  const broken = JSON.parse(JSON.stringify(fixture));
  delete broken.lessons[0].blocks[0].expectedOutput;
  const parsed = courseModule.safeParse(broken);
  assert.equal(parsed.success, false);
});

test("course module schema: rejects an unknown course", () => {
  const broken = { ...fixture, course: "java-3" };
  const parsed = courseModule.safeParse(broken);
  assert.equal(parsed.success, false);
});

test("course module schema: rejects the wrong format tag", () => {
  const broken = { ...fixture, format: "something-else" };
  const parsed = courseModule.safeParse(broken);
  assert.equal(parsed.success, false);
});
