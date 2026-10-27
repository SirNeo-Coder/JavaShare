type Suggestion = { label: string; text: string; cursor: number };
type Member = { name: string; kind: "method" | "field"; params: string };

const words = `abstract assert boolean break byte case catch char class continue default do double else enum extends final finally float for if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while true false null String System Object Integer Double Float Long Boolean Character Math Override ArrayList List Map Set Scanner`.split(" ");
const snippets: Suggestion[] = [
  { label: "System.out.println(…)", text: "System.out.println();", cursor: 19 },
  { label: "System.out.print(…)", text: "System.out.print();", cursor: 17 },
  { label: "main", text: "public static void main(String[] args) {\n    \n}", cursor: 45 },
];
const tokens = /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)|"""[\s\S]*?(?:"""|$)|"(?:\\[\s\S]|[^"\\])*(?:"|$)|'(?:\\[\s\S]|[^'\\])*(?:'|$)|[A-Za-z_$][\w$]*/g;

function insideNonIdentifierToken(code: string, start: number): boolean {
  for (const token of code.matchAll(tokens)) {
    if (!/^[A-Za-z_$]/.test(token[0]) && start > token.index! && start <= token.index! + token[0].length) return true;
  }
  return false;
}

// Member completion below is a regex scan, not a real Java parser — same ceiling as the rest
// of this file. It only resolves a variable's own declared class, not inherited members.
function matchingBrace(source: string, open: number): number {
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    else if (source[index] === "}" && (depth -= 1) === 0) return index;
  }
  return source.length;
}

const CLASS_BLOCK = /\bclass\s+([A-Za-z_$][\w$]*)\b[^{]*\{/g;
const METHOD_DECLARATION = /^public(?:\s+static)?\s+[\w$<>[\],?\s.]+?\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*(?:throws\s+[\w$.,\s]+)?\{$/;
const FIELD_DECLARATION = /^public(?:\s+static)?(?:\s+final)?\s+[\w$<>[\],?]+(?:\[\])?\s+([A-Za-z_$][\w$]*)\s*(?:=.*)?;$/;

function classMembers(source: string, className: string): Member[] | null {
  CLASS_BLOCK.lastIndex = 0;
  for (let match = CLASS_BLOCK.exec(source); match; match = CLASS_BLOCK.exec(source)) {
    if (match[1] !== className) continue;
    const open = match.index + match[0].length - 1;
    const body = source.slice(open + 1, matchingBrace(source, open));
    const members: Member[] = [];
    let parenDepth = 0;
    let segmentStart = 0;
    for (let index = 0; index < body.length; index += 1) {
      const character = body[index];
      if (character === "(") parenDepth += 1;
      else if (character === ")") parenDepth -= 1;
      else if (character === "{" && parenDepth === 0) {
        const signature = body.slice(segmentStart, index + 1).trim().replace(/\s+/g, " ");
        const methodMatch = signature.match(METHOD_DECLARATION);
        if (methodMatch) members.push({ name: methodMatch[1], kind: "method", params: methodMatch[2].trim() });
        const close = matchingBrace(body, index);
        segmentStart = close + 1;
        index = close;
      } else if (character === ";" && parenDepth === 0) {
        const statement = body.slice(segmentStart, index + 1).trim().replace(/\s+/g, " ");
        const fieldMatch = statement.match(FIELD_DECLARATION);
        if (fieldMatch) members.push({ name: fieldMatch[1], kind: "field", params: "" });
        segmentStart = index + 1;
      }
    }
    return members;
  }
  return null;
}

function resolveVariableType(code: string, varName: string): string | null {
  const match = code.match(new RegExp(`\\b([A-Za-z_$][\\w$]*)\\s+${varName}\\s*(?:=\\s*new\\s+([A-Za-z_$][\\w$]*)\\s*\\(|[=;,)])`));
  return match ? match[2] ?? match[1] : null;
}

export function javaSuggestions(code: string, start: number, end = start, files?: string[]) {
  if (start !== end || start < 0 || start > code.length) return null;
  if (insideNonIdentifierToken(code, start)) return null;
  const before = code.slice(0, start);

  const member = before.match(/([A-Za-z_$][\w$]*)\.([A-Za-z_$][\w$]*)?$/);
  if (member && !/System(?:\.[\w$]*){0,2}$/.test(before)) {
    const [, varName, prefix = ""] = member;
    const className = resolveVariableType(code, varName);
    const members = className ? [code, ...(files ?? [])].map((file) => classMembers(file, className)).find((found) => found) : null;
    if (!members) return null;
    const from = start - prefix.length;
    const matches: Suggestion[] = members.filter((item) => item.name.startsWith(prefix)).slice(0, 8).map((item) =>
      item.kind === "method"
        ? { label: `${item.name}(${item.params})`, text: `${item.name}()`, cursor: item.name.length + 1 }
        : { label: item.name, text: item.name, cursor: item.name.length });
    if (!matches.length) return null;
    const to = start + (code.slice(start).match(/^[\w$]*/)?.[0].length ?? 0);
    return { from, to, items: matches };
  }

  const prefix = before.match(/(?:System(?:\.[\w$]*){0,2}|[A-Za-z_$][\w$]*)$/)?.[0];
  if (!prefix || prefix.length < 2) return null;
  const from = start - prefix.length;
  if (/[\w$.]/.test(code[from - 1] ?? "")) return null;

  const names = new Set(words);
  for (const token of code.matchAll(tokens)) if (/^[A-Za-z_$]/.test(token[0])) names.add(token[0]);
  // shortcut: names come from this file, without Java type checking; use a language server if broader member completion is needed.
  const items = [...names].filter((word) => word !== prefix && !snippets.some((item) => item.label === word)).map((text) => ({ label: text, text, cursor: text.length }));
  items.push(...snippets);
  const matches = items.filter((item) => item.label.toLowerCase().startsWith(prefix.toLowerCase())).slice(0, 8);
  if (!matches.length) return null;
  const to = start + (code.slice(start).match(/^[\w$]*/)?.[0].length ?? 0);
  return { from, to, items: matches };
}

export function insertJavaSuggestion(code: string, from: number, to: number, item: Suggestion) {
  const indent = code.slice(code.lastIndexOf("\n", from - 1) + 1, from).match(/^[ \t]*/)?.[0] ?? "";
  const text = item.text.replace(/\n/g, `\n${indent}`);
  const cursor = from + item.cursor + (item.text.slice(0, item.cursor).match(/\n/g)?.length ?? 0) * indent.length;
  return { value: code.slice(0, from) + text + code.slice(to), cursor };
}
