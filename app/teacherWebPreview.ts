import { buildPreview, type PreviewFile } from "./webPreview.ts";

// Also used for module web steps, so they load nothing from the internet (rule 5, CKB-022).
export function buildTeacherPreview(files: PreviewFile[], entryPath = "index.html") {
  const preview = buildPreview(files, entryPath);
  if (!preview.html) return preview;
  // Place the policy before student code, without adding a line or displacing the doctype.
  const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; base-uri 'none'; form-action 'none'">`;
  const doctype = preview.html.match(/^\s*<!doctype[^>]*>/i)?.[0] ?? "";
  return { ...preview, html: doctype + policy + preview.html.slice(doctype.length) };
}
