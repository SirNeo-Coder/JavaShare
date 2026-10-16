import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";

const search = (words) => execFileSync(process.execPath, ["scripts/problem-kb-search.mjs", words], { encoding: "utf8" });

test("kb:search finds the matching bug record first", () => {
  assert.match(search("preview line number wrong").split("\n")[0], /CKB-002-web-preview-wrong-line-numbers\.md/);
});

test("kb:search says so when nothing matches", () => {
  assert.match(search("zzzz qqqq"), /No prior problem case matched/);
});
