// File name rules per project language. Kept free of imports so it can be tested directly.
export const JAVA_PATH = /^(?:[A-Za-z_$][\w$]*\/)*[A-Za-z_$][\w$]*\.java$/;
// /api/execute's own length cap (routes.ts) - a java file path longer than this can never run.
export const JAVA_PATH_MAX_LENGTH = 160;
// Letters, digits, _ and - in each folder/name part, so ".." and hidden files are impossible.
const WEB_PATH = /^(?:[\w-]+\/)*[\w-]+(?:\.[\w-]+)*\.(?:html|css|js)$/;
// Web module projects may also keep plain-text reference files from the module (teacher, 2026-10-28).
const MODULE_TEXT_PATH = /^(?:[\w-]+\/)*[\w-]+(?:\.[\w-]+)*\.txt$/;

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

export function moduleWebPathError(path: string) {
  return MODULE_TEXT_PATH.test(path) ? null : projectPathError("web", path);
}

// Module media files (Cloudflare R2, one shared copy per module; teacher, 2026-10-29): images/, audio/
// or video/ plus one safe name. The type comes from the ending, never from the uploader.
export const MEDIA_LIMIT = 5 * 1024 * 1024;
const MEDIA_TYPES: Record<string, string> = { svg: "image/svg+xml", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp",
  wav: "audio/wav", mp3: "audio/mpeg", ogg: "audio/ogg", webm: "video/webm", mp4: "video/mp4" };
export function mediaPathType(path: string) {
  const ending = path.match(/^(?:images|audio|video)\/[\w-]+(?:\.[\w-]+)*\.([a-z0-9]+)$/i)?.[1];
  return ending ? MEDIA_TYPES[ending.toLowerCase()] ?? null : null;
}
