// Builds the page a web project shows when the student presses Run.
//
// How projects run in CodeShare:
// - "web" projects (HTML/CSS/JavaScript) run here, inside the student's own browser, in an
//   <iframe sandbox="allow-scripts" srcdoc=...> WITHOUT allow-same-origin. That sandbox cannot
//   read the student's login cookie, CodeShare data, or the parent page.
// - "java" projects are sent to the classroom Java runner (POST /api/execute: javac on the
//   teacher laptop offline, Judge0 or demo mode online).
// - Future in-browser runners plug in next to this file and are chosen in runCode() in page.tsx:
//   Java via CheerpJ (once its license is settled) and C# via .NET WebAssembly. They must be
//   served from CodeShare itself (no CDN) so they keep working offline.

export type PreviewFile = { path: string; content: string };
export type LineOrigin = { file: string; line: number };
export type Preview = { html: string; lineMap: LineOrigin[]; warnings: string[] };
export type ConsoleKind = "log" | "info" | "warn" | "error" | "alert";
export type ConsoleMessage = { codeshare: "console"; kind: ConsoleKind; text: string; line: number | null };

const normalize = (path: string) => path.trim().replace(/^\.?\//, "");
const isExternal = (path: string) => /^(?:[a-z]+:)?\/\//i.test(path) || /^(?:data|blob):/i.test(path);

// Runs inside the sandbox. Sends console output and errors to CodeShare with the document line
// they came from; the parent turns that line back into "script.js line 4" using lineMap.
function captureScript(ownLine: number) {
  return `<script>(()=>{const own=${ownLine};const post=(kind,text,line)=>parent.postMessage({codeshare:"console",kind,text:String(text).slice(0,2000),line},"*");const fmt=(v)=>{if(typeof v==="string")return v;if(v instanceof Error)return v.name+": "+v.message;try{const s=JSON.stringify(v);return s===undefined?String(v):s}catch{return String(v)}};const caller=()=>{for(const m of String(new Error().stack||"").matchAll(/srcdoc:(\\d+):\\d+/g)){if(+m[1]!==own)return +m[1]}return null};for(const kind of ["log","info","warn","error"]){const original=console[kind].bind(console);console[kind]=(...args)=>{post(kind,args.map(fmt).join(" "),caller());original(...args)}}window.alert=(message)=>post("alert",fmt(message),caller());addEventListener("error",(event)=>post("error",event.message,event.lineno||null));addEventListener("unhandledrejection",(event)=>post("error","Uncaught (in promise) "+fmt(event.reason),null));})();</script>`;
}

export function buildPreview(files: PreviewFile[]): Preview {
  const byPath = new Map(files.map((file) => [normalize(file.path), file]));
  const entry = byPath.get("index.html") ?? files.find((file) => file.path.endsWith(".html"));
  if (!entry) return { html: "", lineMap: [], warnings: ["Add an index.html file to see your page."] };

  const lineMap: LineOrigin[] = [];
  const warnings: string[] = [];
  let html = "";
  // Appends text and records which project file and line each new document line came from.
  // A line is claimed by the first text written on it, so an empty line after "\n" is left for the next chunk.
  const add = (text: string, file: string, startLine: number) => {
    const firstDocLine = html.split("\n").length;
    html += text;
    const lastDocLine = html.split("\n").length - (html.endsWith("\n") ? 1 : 0);
    for (let docLine = lineMap.length + 1; docLine <= lastDocLine; docLine += 1) {
      lineMap.push({ file, line: startLine + docLine - firstDocLine });
    }
  };

  const source = entry.content;
  const pattern = /<link\b[^>]*>|<script\b([^>]*)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>|<head\b[^>]*>/gi;
  const lineAt = (offset: number) => source.slice(0, offset).split("\n").length;
  let cursor = 0;
  let captured = false;
  for (const match of source.matchAll(pattern)) {
    const offset = match.index ?? 0;
    add(source.slice(cursor, offset), entry.path, lineAt(cursor));
    cursor = offset + match[0].length;
    const tag = match[0];
    if (/^<head/i.test(tag)) {
      add(tag, entry.path, lineAt(offset));
      if (!captured) { add(captureScript(lineMap.length), entry.path, lineAt(offset)); captured = true; }
      continue;
    }
    if (/^<link/i.test(tag)) {
      const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
      const css = href && /\brel\s*=\s*["']?stylesheet/i.test(tag) && !isExternal(href) ? byPath.get(normalize(href)) : undefined;
      if (href && /\brel\s*=\s*["']?stylesheet/i.test(tag) && !isExternal(href) && !css) warnings.push(`${entry.path} links to ${href}, but this project has no file with that name.`);
      if (!css) { add(tag, entry.path, lineAt(offset)); continue; }
      add("<style>\n", entry.path, lineAt(offset));
      add(`${css.content.replace(/<\/style/gi, "<\\/style")}\n`, css.path, 1);
      add("</style>", entry.path, lineAt(offset));
      continue;
    }
    const src = match[2];
    const js = isExternal(src) ? undefined : byPath.get(normalize(src));
    if (!js) {
      if (!isExternal(src)) warnings.push(`${entry.path} loads ${src}, but this project has no file with that name.`);
      add(tag, entry.path, lineAt(offset));
      continue;
    }
    add(`<script${match[1]}${match[3]}>\n`, entry.path, lineAt(offset));
    add(`${js.content.replace(/<\/script/gi, "<\\/script")}\n`, js.path, 1);
    add("</script>", entry.path, lineAt(offset));
  }
  add(source.slice(cursor), entry.path, lineAt(cursor));
  // No <head>: put the capture script first on line 1 (after <!DOCTYPE> so the page stays in standards mode).
  if (!captured) {
    const doctype = html.match(/^\s*<!doctype[^>]*>/i)?.[0] ?? "";
    html = doctype + captureScript(1) + html.slice(doctype.length);
  }
  return { html, lineMap, warnings };
}

export function originOf(preview: Preview, line: number | null) {
  return line ? preview.lineMap[line - 1] ?? null : null;
}
