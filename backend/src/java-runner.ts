// The classroom Java runner: compiles and runs with the laptop's JDK. Node only (offline
// classroom mode); it is loaded on demand so Cloudflare never runs it.
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

type ProcessResult = { stdout: string; stderr: string; exitCode: number | null; timedOut: boolean; outputLimited: boolean };

function runLimitedProcess(command: string, args: string[], cwd: string, stdin: string, timeoutMs: number): Promise<ProcessResult> {
  return new Promise((resolveProcess, rejectProcess) => {
    const child = spawn(command, args, { cwd, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = ""; let stderr = ""; let outputLimited = false; let finished = false; let timedOut = false;
    const outputLimit = 64 * 1024;
    const stopTree = () => {
      if (process.platform === "win32" && child.pid) spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true, stdio: "ignore" });
      else child.kill("SIGKILL");
    };
    const collect = (target: "stdout" | "stderr", chunk: Buffer) => {
      const text = chunk.toString("utf8");
      if (stdout.length + stderr.length + text.length > outputLimit) { outputLimited = true; stopTree(); return; }
      if (target === "stdout") stdout += text; else stderr += text;
    };
    child.stdout.on("data", (chunk: Buffer) => collect("stdout", chunk));
    child.stderr.on("data", (chunk: Buffer) => collect("stderr", chunk));
    child.on("error", rejectProcess);
    child.stdin.end(stdin);
    const timer = setTimeout(() => { if (!finished) { timedOut = true; stopTree(); } }, timeoutMs);
    child.on("close", (exitCode) => {
      finished = true;
      clearTimeout(timer);
      resolveProcess({ stdout, stderr, exitCode, timedOut, outputLimited });
    });
  });
}

type ExecutableJavaFile = { path: string; content: string };

export async function executeLocally(files: ExecutableJavaFile[], stdin: string) {
  return (await executeLocallyResult(files, stdin)).output;
}

export async function executeLocallyResult(files: ExecutableJavaFile[], stdin: string) {
  const failed = (output: string) => ({ success: false, output });
  const code = files.map((file) => file.content).join("\n");
  const blocked = [
    /\b(?:java\.io|java\.nio\.file|java\.net)\b/,
    /\b(?:ProcessBuilder|Runtime\.getRuntime|System\.exit|ClassLoader|javax\.script)\b/,
  ];
  if (blocked.some((pattern) => pattern.test(code))) throw new Error("This local classroom runner blocks file, network, process, and system-control APIs.");
  const directory = await mkdtemp(join(tmpdir(), "javashare-"));
  try {
    for (const file of files) {
      const relativePath = file.path.replace(/\\/g, "/").replace(/^src\//, "");
      const destination = join(directory, ...relativePath.split("/"));
      await mkdir(join(destination, ".."), { recursive: true });
      await writeFile(destination, file.content, "utf8");
    }
    // .txt data files are written beside the sources for the program to read, not compiled.
    const sourcePaths = files.filter((file) => file.path.endsWith(".java")).map((file) => file.path.replace(/\\/g, "/").replace(/^src\//, ""));
    const compiled = await runLimitedProcess("javac", ["-encoding", "UTF-8", "-d", directory, ...sourcePaths], directory, "", 10000);
    if (compiled.outputLimited) return failed("Compilation stopped: output exceeded 64 KB.");
    if (compiled.timedOut) return failed("Compilation stopped after 10 seconds.");
    if (compiled.exitCode !== 0) return failed(compiled.stderr || compiled.stdout || "Compilation failed.");
    const mainFile = files.find((file) => /(?:^|\/)Main\.java$/.test(file.path));
    if (!mainFile) return failed("Run failed: this project needs a Main.java file containing public static void main(String[] args).");
    const packageName = mainFile.content.match(/^\s*package\s+([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*;/m)?.[1];
    const mainClass = packageName ? `${packageName}.Main` : "Main";
    const executed = await runLimitedProcess("java", ["-Xmx128m", "-Xss1m", "-cp", directory, mainClass], directory, stdin, 5000);
    if (executed.outputLimited) return failed(`${executed.stdout}${executed.stderr}\n\nExecution stopped: output exceeded 64 KB.`);
    if (executed.timedOut) return failed(`${executed.stdout}${executed.stderr}\n\nExecution stopped after 5 seconds.`);
    return { success: executed.exitCode === 0 && !executed.stderr, output: executed.stdout + executed.stderr };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
