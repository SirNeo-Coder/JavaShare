import { buildPreview, type PreviewFile } from "./webPreview.ts";

export function buildTeacherPreview(files: PreviewFile[]) {
  const preview = buildPreview(files);
  if (!preview.html) return preview;
  // Place the policy before student code, without adding a line or displacing the doctype.
  const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; base-uri 'none'; form-action 'none'">`;
  const doctype = preview.html.match(/^\s*<!doctype[^>]*>/i)?.[0] ?? "";
  return { ...preview, html: doctype + policy + preview.html.slice(doctype.length) };
}
