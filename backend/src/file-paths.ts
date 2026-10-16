// File name rules per project language. Kept free of imports so it can be tested directly.
const JAVA_PATH = /^(?:[A-Za-z_$][\w$]*\/)*[A-Za-z_$][\w$]*\.java$/;
// Letters, digits, _ and - in each folder/name part, so ".." and hidden files are impossible.
const WEB_PATH = /^(?:[\w-]+\/)*[\w-]+(?:\.[\w-]+)*\.(?:html|css|js)$/;

export function fileLanguage(path: string) {
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".js")) return "javascript";
  return "java";
}

export function projectPathError(projectLanguage: string | null | undefined, path: string) {
  if (projectLanguage === "web") {
    return WEB_PATH.test(path) ? null : "Use a web filename ending in .html, .css, or .js, for example about.html";
  }
  return JAVA_PATH.test(path) ? null : "Use a valid Java filename, for example src/Helper.java";
}
