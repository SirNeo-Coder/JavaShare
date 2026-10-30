import { buildPreview, type PreviewFile } from "./webPreview.ts";
import type { WebCheck } from "../backend/src/module-activities.ts";

// Also used for module web steps, so they load nothing from the internet (rule 5, CKB-022).
// projectPages (module steps, 2026-10-30): links and frames open this project's own pages. A page shown in a
// frame keeps its links but does not show frames of its own, so pages framing each other cannot loop.
export function buildTeacherPreview(files: PreviewFile[], entryPath = "index.html", checks: WebCheck[] = [], testMedia = false, projectPages = false, framed = false) {
  const pages = projectPages ? (path: string) => framed ? undefined : buildTeacherPreview(files, path, [], false, true, true).html : undefined;
  const preview = buildPreview(files, entryPath, checks, testMedia, pages);
  if (!preview.html) return preview;
  // Place the policy before student code, without adding a line or displacing the doctype.
  const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; media-src data:; font-src data:; base-uri 'none'; form-action 'none'">`;
  const doctype = preview.html.match(/^\s*<!doctype[^>]*>/i)?.[0] ?? "";
  return { ...preview, html: doctype + policy + preview.html.slice(doctype.length) };
}
