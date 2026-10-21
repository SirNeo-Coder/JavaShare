type Suggestion = { label: string; text: string; cursor: number };

const words = `abstract assert boolean break byte case catch char class continue default do double else enum extends final finally float for if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while true false null String System Object Integer Double Float Long Boolean Character Math Override ArrayList List Map Set Scanner`.split(" ");
const snippets: Suggestion[] = [
  { label: "System.out.println(…)", text: "System.out.println();", cursor: 19 },
  { label: "System.out.print(…)", text: "System.out.print();", cursor: 17 },
  { label: "main", text: "public static void main(String[] args) {\n    \n}", cursor: 45 },
];
const tokens = /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)|"""[\s\S]*?(?:"""|$)|"(?:\\[\s\S]|[^"\\])*(?:"|$)|'(?:\\[\s\S]|[^'\\])*(?:'|$)|[A-Za-z_$][\w$]*/g;

export function javaSuggestions(code: string, start: number, end = start) {
  if (start !== end || start < 0 || start > code.length) return null;
  const before = code.slice(0, start);
  const prefix = before.match(/(?:System(?:\.[\w$]*){0,2}|[A-Za-z_$][\w$]*)$/)?.[0];
  if (!prefix || prefix.length < 2) return null;
  const from = start - prefix.length;
  if (/[\w$.]/.test(code[from - 1] ?? "")) return null;

  const names = new Set(words);
  for (const token of code.matchAll(tokens)) {
    if (/^[A-Za-z_$]/.test(token[0])) names.add(token[0]);
    else if (start > token.index && start <= token.index + token[0].length) return null;
  }
  // shortcut: names come from this file, without Java type checking; use a language server if typed member completion is needed.
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
