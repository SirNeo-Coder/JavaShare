import assert from "node:assert/strict";
import { test } from "node:test";
import { javaSuggestions, insertJavaSuggestion } from "../app/javaSuggestions.ts";

const labels = (code, cursor = code.length) => javaSuggestions(code, cursor)?.items.map((item) => item.label) ?? [];

test("Java suggestions: keywords, standard names and print statements match typed prefixes", () => {
  assert.ok(labels("pu").includes("public"));
  assert.ok(labels("sys").includes("System"));
  assert.ok(labels("Sys").includes("System.out.println(…)"));
  assert.deepEqual(labels("System.out."), ["System.out.println(…)", "System.out.print(…)"]);
  assert.deepEqual(labels("System.o"), ["System.out.println(…)", "System.out.print(…)"]);
  assert.deepEqual(labels("System.out.pri"), ["System.out.println(…)", "System.out.print(…)"]);
});

test("Java suggestions: current-file names are unique and ignore comments and string literals", () => {
  const code = 'int capacity; capacity = 25; // caption\nString text = "capture"; char c = \'x\';\nca';
  assert.deepEqual(labels(code), ["case", "catch", "capacity"]);
  assert.deepEqual(labels('class Main { void main() {} }\nma').filter((name) => name === "main"), ["main"]);
  assert.ok(labels("vehicle.move();\nve").includes("vehicle"));
});

test("Java suggestions: comments, escaped strings, characters and text blocks never open suggestions", () => {
  for (const code of ['// Sys', '/* Sys', '"Sys', "'Sy", '"escaped \\\" Sys', '"""\nSys', '/* done */ // Sys']) {
    assert.equal(javaSuggestions(code, code.length), null, code);
  }
  assert.ok(labels('/* done */\nSys').includes("System"));
  assert.ok(labels('// done\nSys').includes("System"));
  const code = '"System"';
  assert.equal(javaSuggestions(code, 4), null);
});

test("Java suggestions: empty, short, selected, numeric and unsupported member prefixes stay quiet", () => {
  for (const code of ["", "S", " ", "1Sys", "object.Sy", "System.out.println();", "nonexistent"]) assert.equal(javaSuggestions(code, code.length), null, code);
  assert.equal(javaSuggestions("System", 2, 4), null);
  assert.equal(javaSuggestions("Sys", -1), null);
  assert.equal(javaSuggestions("Sys", 4), null);
  assert.ok(labels("int capacity;\nca").length <= 8);
  assert.equal(labels("public").includes("public"), false);
});

test("Java suggestions: insertion replaces the full word and preserves surrounding code", () => {
  const code = "class Main { System }";
  const cursor = code.indexOf("System") + 3;
  const suggestions = javaSuggestions(code, cursor);
  const item = suggestions.items.find((item) => item.label === "System");
  assert.deepEqual(insertJavaSuggestion(code, suggestions.from, suggestions.to, item), { value: code, cursor: code.indexOf("System") + 6 });
});

test("Java suggestions: print snippets place the caret inside the parentheses", () => {
  for (const label of ["System.out.println(…)", "System.out.print(…)"]) {
    const suggestions = javaSuggestions("    Sys", 7);
    const result = insertJavaSuggestion("    Sys", suggestions.from, suggestions.to, suggestions.items.find((item) => item.label === label));
    assert.equal(result.value[result.cursor - 1], "(");
    assert.equal(result.value.slice(result.cursor), ");");
    assert.ok(result.value.startsWith("    System.out."));
  }
});

test("Java suggestions: the main statement keeps existing indentation and puts the caret in its body", () => {
  const code = "class Main {\n    ma\n}";
  const cursor = code.indexOf("ma") + 2;
  const suggestions = javaSuggestions(code, cursor);
  const result = insertJavaSuggestion(code, suggestions.from, suggestions.to, suggestions.items.find((item) => item.label === "main"));
  assert.equal(result.value, "class Main {\n    public static void main(String[] args) {\n        \n    }\n}");
  assert.equal(result.value.slice(result.cursor), "\n    }\n}");
});
