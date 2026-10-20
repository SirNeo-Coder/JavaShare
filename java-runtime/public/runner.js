// This public origin has no CodeShare session, API, or Supabase keys.
// Create a fresh frame for each run so loaded classes and threads cannot survive another run.
(() => {
  let started = false;
  window.addEventListener("message", async (event) => {
    if (started || event.source !== parent || !/^https?:\/\//.test(event.origin) || event.data?.type !== "codeshare-java-run") return;
    const { id, files, stdin, mainClass } = event.data;
    if (typeof id !== "string" || !/^[a-z0-9-]{1,80}$/i.test(id)) return;
    started = true;
    const send = (type, extra = {}) => parent.postMessage({ type, id, ...extra }, event.origin);
    try {
      if (!Array.isArray(files) || !files.length || files.length > 50 || typeof stdin !== "string" || stdin.length > 10000 || typeof mainClass !== "string" ||
          files.some((file) => typeof file.path !== "string" || !/^(?:[A-Za-z_$][\w$]*\/)*[A-Za-z_$][\w$]*\.java$/.test(file.path) || typeof file.content !== "string" || file.content.length > 200000)) throw new Error("Invalid Java project");
      const status = (text) => { document.querySelector("p").textContent = text; };
      status("Loading Java 8…");
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cjrtnc.leaningtech.com/4.3/loader.js";
        script.onload = resolve; script.onerror = () => reject(new Error("Could not load Java. Check your internet connection and try again."));
        document.head.append(script);
      });
      /* global cheerpjInit, cheerpjRunLibrary, cheerpOSAddStringFile */
      status("Starting Java 8…");
      await cheerpjInit({ version: 8, status: "none", javaProperties: ["codeshare.browser=true"], natives: {
        Java_CodeShareJava_running: () => send("codeshare-java-running"),
      } });
      status("Starting compiler…");
      const library = await cheerpjRunLibrary("/app/javac.jar:/app/codeshare-runner.jar");
      status("Compiling project…");
      const paths = files.map((file, index) => {
        const path = `/str/codeshare-${index}`;
        cheerpOSAddStringFile(path, file.content);
        return file.path;
      });
      const runner = await library.CodeShareJava;
      const result = JSON.parse(await runner.runSources(paths.join("\n"), mainClass, stdin, `/files/${id}`, "/str"));
      send("codeshare-java-result", result);
    } catch (error) { send("codeshare-java-result", { success: false, output: `Java execution failed: ${String(error)}`.slice(0, 70000) }); }
  });
  parent.postMessage({ type: "codeshare-java-ready" }, "*");
})();
