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

export type JavaInteraction = {
  signal: AbortSignal;
  onOutput: (output: string) => void;
  onInput: (send: ((line: string) => void) | null) => void;
};

export async function runJava(files: ModuleFile[], stdin: string, runner?: JavaRunner, interaction?: JavaInteraction): Promise<JavaResult> {
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
    let sent = false, running = false, finished = false, waiting = false;
    let remaining = 5000, resumedAt = 0, inputId = 0, inputUsed = stdin.length;
    let streamed = "";
    const finish = (success: boolean, output: string) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer); window.removeEventListener("message", receive); frame.remove();
      interaction?.signal.removeEventListener("abort", stop);
      interaction?.onInput(null);
      resolve({ mode: "browser", success, output });
    };
    const failure = (message: string) => finish(false, `${streamed}${streamed && !streamed.endsWith("\n") ? "\n" : ""}${message}`);
    const stop = () => failure("Execution stopped.");
    const resume = () => {
      waiting = false; resumedAt = Date.now();
      timer = setTimeout(() => failure("Execution stopped after 5 seconds."), Math.max(0, remaining));
    };
    let timer = setTimeout(() => failure("Java loading or compilation stopped after 120 seconds. Check your internet connection and try again."), 120000);
    const receive = (event: MessageEvent) => {
      if (finished || event.source !== frame.contentWindow || event.origin !== url.origin) return;
      const data = event.data;
      if (data?.type === "codeshare-java-ready" && !sent) {
        if (interaction && data.interactive !== true) { failure("The Java runner is updating. Refresh CodeShare and try again."); return; }
        sent = true;
        frame.contentWindow!.postMessage({ type: "codeshare-java-run", id, files: files.map((file, index) => ({ ...file, path: paths[index] })), stdin, mainClass: packageName ? `${packageName}.Main` : "Main", ...(interaction ? { interactive: true } : {}) }, url.origin);
      } else if (data?.id === id && data.type === "codeshare-java-running" && !running) {
        running = true; clearTimeout(timer); resume();
      } else if (data?.id === id && data.type === "codeshare-java-output" && interaction && running && typeof data.output === "string") {
        if (data.output.length > 70000) failure("Execution stopped: output exceeded 64 KB.");
        else { streamed = data.output; interaction.onOutput(streamed); }
      } else if (data?.id === id && data.type === "codeshare-java-input" && interaction && running && !waiting && data.inputId === inputId + 1) {
        inputId = data.inputId; waiting = true;
        remaining -= Date.now() - resumedAt; clearTimeout(timer);
        if (remaining <= 0) { failure("Execution stopped after 5 seconds."); return; }
        timer = setTimeout(() => failure("Execution stopped after waiting 2 minutes for input."), 120000);
        const requested = inputId;
        interaction.onInput((line) => {
          if (finished || !waiting || requested !== inputId) return;
          if (typeof line !== "string" || (inputUsed += line.length + 1) > 10000) { failure("Execution stopped: input exceeded 10,000 characters."); return; }
          clearTimeout(timer); interaction.onInput(null); resume();
          frame.contentWindow!.postMessage({ type: "codeshare-java-input", id, inputId, line: `${line}\n` }, url.origin);
        });
      } else if (data?.id === id && data.type === "codeshare-java-result" && typeof data.success === "boolean" && typeof data.output === "string") {
        if (data.output.length > 70000) failure("Execution stopped: output exceeded 64 KB.");
        else finish(data.success, data.output);
      }
    };
    window.addEventListener("message", receive);
    interaction?.signal.addEventListener("abort", stop, { once: true });
    if (interaction?.signal.aborted) stop();
    else document.body.append(frame);
  });
}
