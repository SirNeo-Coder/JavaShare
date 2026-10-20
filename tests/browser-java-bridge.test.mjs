import assert from "node:assert/strict";
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
const jar = resolve("java-runtime/public/codeshare-runner.jar");
function run(files, mainClass = "Main", input = "", flat = false) {
  const base = mkdtempSync(join(tmpdir(), "codeshare-browser-bridge-"));
  try {
    const abandoned = join(base, "run-abandoned");
    if (flat) { mkdirSync(abandoned); writeFileSync(join(abandoned, "Previous.class"), "previous run"); }
    const paths = files.map(([path, content], index) => { const file = join(base, flat ? `codeshare-${index}` : path); mkdirSync(resolve(file, ".."), { recursive: true }); writeFileSync(file, content); return flat ? path : file; });
    const output = join(base, "classes");
    const result = JSON.parse(execFileSync("java", ["-cp", jar, "CodeShareJava", paths.join("\n"), mainClass, input, output, ...(flat ? [base] : [])], { encoding: "utf8", timeout: 15000, maxBuffer: 300000 }));
    if (flat) assert.equal(existsSync(abandoned), false, "the next run clears files left by an interrupted frame");
    assert.equal(existsSync(output), false, "compiled classes are removed even on failure");
    return result;
  } finally { rmSync(base, { recursive: true, force: true }); }
}

test("browser bridge: committed JAR matches its Java source", () => {
  const directory = mkdtempSync(join(tmpdir(), "codeshare-bridge-source-"));
  try {
    execFileSync("jar", ["--extract", "--file", jar, "codeshare-source.sha256"], { cwd: directory });
    assert.equal(readFileSync(join(directory, "codeshare-source.sha256"), "utf8"), createHash("sha256").update(readFileSync("vendor/java/CodeShareJava.java")).digest("hex"));
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("browser bridge: packages, inheritance, input and Unicode run together", () => {
  const result = run([
    ["oop/Main.java", 'package oop; import java.util.Scanner; public class Main { public static void main(String[] args) { Animal pet = new Dog(); System.out.println(pet.name()+": "+new Scanner(System.in).nextInt()); } }'],
    ["oop/Animal.java", 'package oop; public abstract class Animal { public abstract String name(); }'],
    ["oop/Dog.java", 'package oop; public class Dog extends Animal { public String name() { return "Aso 🐕"; } }'],
  ], "oop.Main", "14\n");
  assert.deepEqual(result, { success: true, output: "Aso 🐕: 14\n" });
});

test("browser bridge: compile error, stderr and crash after expected output all fail", () => {
  const broken = run([["Main.java", "public class Main { missing }"]]);
  assert.equal(broken.success, false); assert.match(broken.output, /error/);
  for (const code of ['System.out.println("Correct"); throw new IllegalStateException("crash");', 'System.out.println("Correct"); System.err.print("error");']) {
    const result = run([["Main.java", `public class Main { public static void main(String[] args) { ${code} } }`]]);
    assert.equal(result.success, false); assert.match(result.output, /Correct/); assert.match(result.output, /crash|error/);
  }
});

test("browser bridge: combined stdout/stderr stops at 64 KB and missing classes cannot survive another run", () => {
  const result = run([["Main.java", 'public class Main { public static void main(String[] args) { for (int i=0;i<100000;i++) { System.out.print("x"); System.err.print("y"); } } }']]);
  assert.equal(result.success, false); assert.match(result.output, /output exceeded 64 KB/); assert.ok(result.output.length < 65700);
  const missing = run([["Main.java", 'public class Main { public static void main(String[] args) { System.out.print(new Dog()); } }']]);
  assert.equal(missing.success, false); assert.match(missing.output, /Dog/);
});


test("browser bridge: flat browser strings become distinct source folders, including duplicate class names", () => {
  const files = [
    ["app/Main.java", 'package app; public class Main { public static void main(String[] args) { System.out.println(new left.Helper().name() + new right.Helper().name()); } }'],
    ["left/Helper.java", 'package left; public class Helper { public String name() { return "left"; } }'],
    ["right/Helper.java", 'package right; public class Helper { public String name() { return "right"; } }'],
  ];
  assert.deepEqual(run(files, "app.Main", "", true), { success: true, output: "leftright\n" });
  assert.equal(run([["../Main.java", ""]], "Main", "", true).success, false);
});
