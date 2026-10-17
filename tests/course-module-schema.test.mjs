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

// Student progress (step_states) is one flat map per module, keyed by whichever id was marked -
// a step block's own id or a lesson's exitSlip id (CKB-007's bug class). If two of those ids
// collide, even across different lessons, marking one done silently marks the other done too.
test("course module schema: rejects a step id reused by another lesson's step (CKB-007's bug class, reachable at upload)", () => {
  const broken = JSON.parse(JSON.stringify(fixture));
  broken.lessons[1].blocks.find((block) => block.type === "step").id = broken.lessons[0].blocks.find((block) => block.type === "step").id;
  const parsed = courseModule.safeParse(broken);
  assert.equal(parsed.success, false, "a step id reused by a different lesson's step must be rejected");
});

test("course module schema: rejects a step id that collides with an exit slip's id", () => {
  const broken = JSON.parse(JSON.stringify(fixture));
  broken.lessons[1].exitSlip.id = broken.lessons[0].blocks.find((block) => block.type === "step").id;
  const parsed = courseModule.safeParse(broken);
  assert.equal(parsed.success, false, "a step id reused as an exit slip's id must be rejected");
});
