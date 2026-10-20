// This public origin has no CodeShare session, API, or Supabase keys.
// Create a fresh frame for each run so loaded classes and threads cannot survive another run.
(() => {
  let started = false;
  window.addEventListener("message", async (event) => {
    if (started || event.source !== parent || !/^https?:\/\//.test(event.origin) || event.data?.type !== "codeshare-java-run") return;
    const { id, files, stdin, mainClass, interactive = false } = event.data;
    if (typeof id !== "string" || !/^[a-z0-9-]{1,80}$/i.test(id)) return;
    started = true;
    const send = (type, extra = {}) => parent.postMessage({ type, id, ...extra }, event.origin);
    let stage = "Checking Java project";
    const status = (text) => {
      stage = text; document.querySelector("p").textContent = `${text}…`;
      send("codeshare-java-status", { stage });
    };
    let pending = null, inputId = 0, inputUsed = stdin?.length ?? 0;
    const receiveInput = (reply) => {
      const data = reply.data;
      if (!pending || reply.source !== parent || reply.origin !== event.origin || data?.type !== "codeshare-java-input" ||
          data.id !== id || data.inputId !== inputId || typeof data.line !== "string") return;
      if ((inputUsed += data.line.length) > 10000) { const resolve = pending; pending = null; resolve(null); return; }
      const resolve = pending; pending = null; resolve(data.line);
    };
    window.addEventListener("message", receiveInput);
    try {
      if (typeof interactive !== "boolean" || !Array.isArray(files) || !files.length || files.length > 50 || typeof stdin !== "string" || stdin.length > 10000 || typeof mainClass !== "string" ||
          files.some((file) => typeof file.path !== "string" || !/^(?:[A-Za-z_$][\w$]*\/)*[A-Za-z_$][\w$]*\.java$/.test(file.path) || typeof file.content !== "string" || file.content.length > 200000)) throw new Error("Invalid Java project");
      status("Loading Java 8");
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cjrtnc.leaningtech.com/4.3/loader.js";
        script.onload = resolve; script.onerror = () => reject(new Error("Could not load Java. Check your internet connection and try again."));
        document.head.append(script);
      });
      /* global cheerpjInit, cheerpjRunLibrary, cheerpOSAddStringFile */
      status("Starting Java 8");
      await cheerpjInit({ version: 8, status: "none", javaProperties: ["codeshare.browser=true"], natives: {
        Java_CodeShareJava_running: () => send("codeshare-java-running"),
        Java_CodeShareJava_output: (_lib, output) => send("codeshare-java-output", { output }),
        Java_CodeShareJava_readInput: () => new Promise((resolve) => {
          pending = resolve; send("codeshare-java-input", { inputId: ++inputId });
        }),
      } });
      // Static hosts may ignore Range requests; load complete JARs into CheerpJ's memory filesystem.
      for (const name of ["javac.jar", "codeshare-runner.jar"]) {
        status(`Downloading ${name}`);
        const response = await fetch(`/${name}`);
        if (!response.ok) throw new Error(`Could not download ${name} (HTTP ${response.status}).`);
        cheerpOSAddStringFile(`/str/${name}`, new Uint8Array(await response.arrayBuffer()));
      }
      status("Starting Java compiler");
      const library = await cheerpjRunLibrary("/str/javac.jar:/str/codeshare-runner.jar");
      status("Compiling project");
      const paths = files.map((file, index) => {
        const path = `/str/codeshare-${index}`;
        cheerpOSAddStringFile(path, file.content);
        return file.path;
      });
      const runner = await library.CodeShareJava;
      const args = [paths.join("\n"), mainClass, stdin, `/files/${id}`, "/str"];
      const result = JSON.parse(await (interactive ? runner.runInteractiveSources(...args) : runner.runSources(...args)));
      send("codeshare-java-result", result);
    } catch (error) { send("codeshare-java-result", { success: false, output: `Java execution failed during ${stage}: ${String(error)}`.slice(0, 70000) }); }
    finally { window.removeEventListener("message", receiveInput); }
  });
  parent.postMessage({ type: "codeshare-java-ready", interactive: true }, "*");
})();
