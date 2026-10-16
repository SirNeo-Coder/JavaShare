// Search past bug records: npm run kb:search -- "symptom or feature words"
import { readdirSync, readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("..", import.meta.url));
const root = join(repo, "docs", "problem-knowledgebase");
const query = process.argv.slice(2).join(" ").trim().toLowerCase();
if (!query) {
  console.error('Usage: npm run kb:search -- "symptom or feature keywords"');
  process.exit(1);
}

const stopWords = new Set("a an and are as at be but by for from has have how i in is it not of on or that the this to was we were what when where with you".split(" "));
const tokens = [...new Set(query.replace(/[^a-z0-9]+/g, " ").split(/\s+/).filter((token) => token.length > 1 && !stopWords.has(token)))];
const markdownFiles = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = join(directory, entry.name);
  return entry.isDirectory() ? markdownFiles(path) : entry.name.endsWith(".md") ? [path] : [];
});

const results = markdownFiles(root).flatMap((file) => {
  const text = readFileSync(file, "utf8");
  const lower = text.toLowerCase();
  const matched = tokens.filter((token) => lower.includes(token));
  if (!matched.length) return [];
  const name = basename(file).toLowerCase();
  const score = matched.length * 2 + (lower.includes(query) ? 8 : 0) + tokens.filter((token) => name.includes(token)).length * 3;
  const lines = text.split(/\r?\n/);
  const evidence = lines.map((line, index) => ({ line, index: index + 1 }))
    .filter(({ line }) => matched.some((token) => line.toLowerCase().includes(token))).slice(0, 3);
  return [{ path: relative(repo, file), heading: lines.find((line) => line.startsWith("# ")) || "", score, matched, evidence }];
}).sort((left, right) => right.score - left.score || left.path.localeCompare(right.path));

if (!results.length) {
  console.log("No prior problem case matched. Diagnose normally, then record the verified result.");
  process.exit(0);
}
for (const result of results.slice(0, 8)) {
  console.log(`${result.path} [score ${result.score}; ${result.matched.join(", ")}]`);
  if (result.heading) console.log(`  ${result.heading}`);
  for (const { line, index } of result.evidence) console.log(`  L${index}: ${line.trim()}`);
}
