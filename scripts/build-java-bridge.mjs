// Only needed when vendor/java/CodeShareJava.java changes. The small built JAR is committed
// so Cloudflare and normal offline builds do not need a JDK to package the browser bridge.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
const directory = "outputs/java-bridge";
mkdirSync(directory, { recursive: true });
mkdirSync("java-runtime/public", { recursive: true });
try {
  execFileSync("javac", ["--release", "8", "-d", directory, "vendor/java/CodeShareJava.java"], { stdio: "inherit" });
  writeFileSync(`${directory}/codeshare-source.sha256`, createHash("sha256").update(readFileSync("vendor/java/CodeShareJava.java")).digest("hex"));
  execFileSync("jar", ["--create", "--file", "java-runtime/public/codeshare-runner.jar", "--date=2026-10-20T00:00:00Z", "-C", directory, "."], { stdio: "inherit" });
} finally { rmSync(directory, { recursive: true, force: true }); }
