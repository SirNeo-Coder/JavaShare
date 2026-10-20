import { api } from "./apiClient";
import { JAVA_PATH, JAVA_PATH_MAX_LENGTH } from "../backend/src/file-paths";
import { sourcePath, type ModuleFile } from "../backend/src/module-activities";

export type JavaResult = { mode: string; success: boolean; output: string };
export type JavaRunner = { mode: "local" | "judge0" | "browser"; url?: string };
export const getJavaRunner = () => api<JavaRunner>("/api/java-runner");
let browserUsed = false;
const listeners = new Set<() => void>();
export const subscribeJavaRunner = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const browserJavaUsed = () => browserUsed;
export const serverJavaUsed = () => false;

export function runnerAddress(address: string, parentOrigin: string) {
  const url = new URL(address);
  if (url.origin === parentOrigin || url.username || url.password || url.search || url.hash || url.pathname !== "/" ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) {
    throw new Error("Java needs a separate HTTPS runner address. Ask your teacher to check JAVA_RUNNER_URL.");
  }
  return url;
}

export async function runJava(files: ModuleFile[], stdin: string, runner?: JavaRunner): Promise<JavaResult> {
  const config = runner ?? await getJavaRunner();
  if (config.mode !== "browser") return api<JavaResult>("/api/execute", { method: "POST", body: JSON.stringify({ files, stdin }) });
  const url = runnerAddress(config.url ?? "", window.location.origin);
  const paths = files.map((file) => sourcePath(file.path));
  if (!files.length || files.length > 50 || stdin.length > 10000 || paths.some((path) => path.length > JAVA_PATH_MAX_LENGTH || !JAVA_PATH.test(path)) || new Set(paths).size !== paths.length || files.some((file) => file.content.length > 200000)) throw new Error("Choose up to 50 valid Java files and at most 10,000 characters of input.");
  const main = files.find((file) => /(?:^|\/)Main\.java$/.test(file.path));
  if (!main) return { mode: "browser", success: false, output: "Run failed: this project needs a Main.java file containing public static void main(String[] args)." };
  const packageName = main.content.match(/^\s*package\s+([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*;/m)?.[1];
  browserUsed = true; listeners.forEach((listener) => listener());
  return new Promise((resolve) => {
    const frame = document.createElement("iframe");
    const id = `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    frame.title = "Java execution"; frame.hidden = true;
    // The URL must be a different origin: its Java has no access to CodeShare's signed-in page.
    frame.sandbox.add("allow-scripts", "allow-same-origin");
    frame.referrerPolicy = "no-referrer";
    frame.src = url.href;
    let sent = false, running = false;
    const finish = (success: boolean, output: string) => {
      clearTimeout(timer); window.removeEventListener("message", receive); frame.remove();
      resolve({ mode: "browser", success, output });
    };
    let timer = setTimeout(() => finish(false, "Java loading or compilation stopped after 120 seconds. Check your internet connection and try again."), 120000);
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow || event.origin !== url.origin) return;
      const data = event.data;
      if (data?.type === "codeshare-java-ready" && !sent) {
        sent = true;
        frame.contentWindow!.postMessage({ type: "codeshare-java-run", id, files: files.map((file, index) => ({ ...file, path: paths[index] })), stdin, mainClass: packageName ? `${packageName}.Main` : "Main" }, url.origin);
      } else if (data?.id === id && data.type === "codeshare-java-running" && !running) {
        running = true; clearTimeout(timer);
        timer = setTimeout(() => finish(false, "Execution stopped after 5 seconds."), 5000);
      } else if (data?.id === id && data.type === "codeshare-java-result" && typeof data.success === "boolean" && typeof data.output === "string") {
        if (data.output.length > 70000) finish(false, "Execution stopped: output exceeded 64 KB.");
        else finish(data.success, data.output);
      }
    };
    window.addEventListener("message", receive);
    document.body.append(frame);
  });
}
