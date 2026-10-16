// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPreview, originOf } from "../app/webPreview.ts";
import { fileLanguage, projectPathError } from "../backend/src/file-paths.ts";

const lineOf = (html, snippet) => html.slice(0, html.indexOf(snippet)).split("\n").length;

const files = [
  { path: "index.html", content: `<!DOCTYPE html>\n<html>\n<head>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hi</h1>\n  <script src="script.js"></script>\n  <p id="after">after</p>\n</body>\n</html>\n` },
  { path: "style.css", content: "body {\n  color: red;\n}\n" },
  { path: "script.js", content: "const a = 1;\nconsole.log(a);\nmissing();\n" },
];

test("inlines linked CSS and JavaScript, no external loads", () => {
  const { html, warnings } = buildPreview(files);
  assert.match(html, /color: red/);
  assert.match(html, /missing\(\);/);
  assert.doesNotMatch(html, /src="script\.js"/);
  assert.doesNotMatch(html, /href="style\.css"/);
  assert.deepEqual(warnings, []);
  assert.ok(html.startsWith("<!DOCTYPE html>"), "doctype stays first so the page is in standards mode");
});

test("maps document lines back to the student's file and line", () => {
  const preview = buildPreview(files);
  assert.deepEqual(originOf(preview, lineOf(preview.html, "missing();")), { file: "script.js", line: 3 });
  assert.deepEqual(originOf(preview, lineOf(preview.html, "color: red")), { file: "style.css", line: 2 });
  assert.deepEqual(originOf(preview, lineOf(preview.html, '<p id="after">')), { file: "index.html", line: 9 });
  assert.deepEqual(originOf(preview, lineOf(preview.html, "<h1>Hi</h1>")), { file: "index.html", line: 7 });
});

test("capture script sits on the <head> line and does not shift lines", () => {
  const preview = buildPreview(files);
  const captureLine = lineOf(preview.html, "codeshare:");
  assert.equal(captureLine, lineOf(preview.html, "<head>"));
  assert.match(preview.html, new RegExp(`const own=${captureLine};`));
});

test("works without <head>, and warns about missing files", () => {
  const preview = buildPreview([{ path: "index.html", content: "<p>x</p>\n<script src=\"app.js\"></script>\n<script>boom()</script>" }]);
  assert.match(preview.html, /^<script>\(\(\)=>\{const own=1;/);
  assert.deepEqual(preview.warnings, ["index.html loads app.js, but this project has no file with that name."]);
  assert.deepEqual(originOf(preview, lineOf(preview.html, "boom()")), { file: "index.html", line: 3 });
});

test("a </script> inside JavaScript cannot break out of the inlined script", () => {
  const { html } = buildPreview([
    { path: "index.html", content: '<head></head><script src="s.js"></script>' },
    { path: "s.js", content: 'console.log("</script><b>x</b>");' },
  ]);
  assert.equal(html.match(/<\/script>/g).length, 2); // capture script + inlined script only
});

test("no index.html gives a friendly message", () => {
  assert.deepEqual(buildPreview([{ path: "style.css", content: "" }]).warnings, ["Add an index.html file to see your page."]);
});

test("file names must fit the project language", () => {
  assert.equal(projectPathError("web", "about.html"), null);
  assert.equal(projectPathError("web", "css/site.css"), null);
  assert.equal(projectPathError("web", "game.min.js"), null);
  assert.notEqual(projectPathError("web", "../secret.html"), null);
  assert.notEqual(projectPathError("web", "Main.java"), null);
  assert.notEqual(projectPathError("web", ".hidden.js"), null);
  assert.equal(projectPathError("java", "src/Helper.java"), null);
  assert.equal(projectPathError(undefined, "src/Helper.java"), null, "projects without a language are Java");
  assert.notEqual(projectPathError("java", "index.html"), null);
  assert.equal(fileLanguage("a/b.js"), "javascript");
  assert.equal(fileLanguage("x.html"), "html");
  assert.equal(fileLanguage("x.css"), "css");
  assert.equal(fileLanguage("Main.java"), "java");
});
