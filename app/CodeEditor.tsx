"use client";

import { useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type UIEvent } from "react";

const TAB = "    ";
const JAVA_TOKEN = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|@[A-Za-z_$][\w$]*|\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|true|false|null)\b|\b(?:String|System|Object|Integer|Double|Float|Long|Boolean|Character|Math|Override|ArrayList|List|Map|Set|View|TextView|Activity|ViewGroup|ArrayAdapter)\b|\b\d+(?:\.\d+)?(?:[fFdDlL])?\b)/g;

function tokenClass(token: string) {
  if (token.startsWith("//") || token.startsWith("/*")) return "comment";
  if (token.startsWith('"') || token.startsWith("'")) return "string";
  if (token.startsWith("@")) return "annotation";
  if (/^\d/.test(token)) return "number";
  if (/^(String|System|Object|Integer|Double|Float|Long|Boolean|Character|Math|Override|ArrayList|List|Map|Set|View|TextView|Activity|ViewGroup|ArrayAdapter)$/.test(token)) return "type";
  return "keyword";
}

function HighlightedJava({ code, matched }: { code: string; matched: Set<number> }) {
  const parts = code.split(JAVA_TOKEN);
  return <>{parts.map((part, index) => {
    const start = parts.slice(0, index).reduce((length, previous) => length + previous.length, 0);
    const content = Array.from(part).map((character, characterIndex) => {
      const position = start + characterIndex;
      return matched.has(position) ? <mark className="matching-bracket" key={position}>{character}</mark> : character;
    });
    return index % 2 === 1
      ? <span className={`token-${tokenClass(part)}`} key={index}>{content}</span>
      : <span key={index}>{content}</span>;
  })}</>;
}

type Diagnostic = { line: number; message: string };
const OPENING: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
const CLOSING: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

function analyze(code: string) {
  const pairs = new Map<number, number>();
  const diagnostics: Diagnostic[] = [];
  const stack: { character: string; position: number; line: number }[] = [];
  let line = 1;
  let state: "code" | "line-comment" | "block-comment" | "string" | "char" = "code";

  for (let position = 0; position < code.length; position += 1) {
    const character = code[position];
    const next = code[position + 1];
    if (character === "\n") { line += 1; if (state === "line-comment") state = "code"; continue; }
    if (state === "line-comment") continue;
    if (state === "block-comment") { if (character === "*" && next === "/") { state = "code"; position += 1; } continue; }
    if (state === "string" || state === "char") {
      if (character === "\\") { position += 1; continue; }
      if ((state === "string" && character === '"') || (state === "char" && character === "'")) state = "code";
      continue;
    }
    if (character === "/" && next === "/") { state = "line-comment"; position += 1; continue; }
    if (character === "/" && next === "*") { state = "block-comment"; position += 1; continue; }
    if (character === '"') { state = "string"; continue; }
    if (character === "'") { state = "char"; continue; }
    if (OPENING[character]) stack.push({ character, position, line });
    if (CLOSING[character]) {
      const opening = stack.at(-1);
      if (!opening || opening.character !== CLOSING[character]) diagnostics.push({ line, message: `Unexpected '${character}'` });
      else { stack.pop(); pairs.set(opening.position, position); pairs.set(position, opening.position); }
    }
  }
  stack.forEach((item) => diagnostics.push({ line: item.line, message: `Missing '${OPENING[item.character]}'` }));

  code.split("\n").forEach((source, index) => {
    const text = source.replace(/\/\/.*$/, "").trim();
    if (!text || /[;{}:,]$/.test(text) || /^(if|for|while|switch|catch|else|try|finally|class|interface|enum|do|synchronized)\b/.test(text)) return;
    if (/^(?:return\b.+|throw\b.+|break\b|continue\b|import\b|package\b|(?:[\w<>\[\],?]+\s+)+[A-Za-z_$][\w$]*\s*=|[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[[^\]]+\])*\s*(?:=|\+\+|--|\+=|-=|\*=|\/=)|(?:[A-Za-z_$][\w$]*\.)*[A-Za-z_$][\w$]*\s*\(.*\))/.test(text)) {
      diagnostics.push({ line: index + 1, message: "Possible missing semicolon" });
    }
  });
  return { pairs, diagnostics };
}

type RemoteCursor = { userId: string; name: string; line: number; column: number; color: string; photoUrl?: string | null };
type Props = { value: string; onChange: (value: string) => void; onCursorChange?: (offset: number) => void; remoteCursors?: RemoteCursor[]; readOnly?: boolean; ariaLabel?: string };

export default function CodeEditor({ value, onChange, onCursorChange, remoteCursors = [], readOnly = false, ariaLabel = "Java source code editor" }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const numbersRef = useRef<HTMLDivElement>(null);
  const guidesRef = useRef<HTMLDivElement>(null);
  const cursorsRef = useRef<HTMLDivElement>(null);
  const previousValueRef = useRef(value);
  const localChangeRef = useRef(false);
  const selectionRef = useRef({ start: 0, end: 0 });
  const [cursor, setCursor] = useState(0);
  const lineCount = Math.max(1, value.split("\n").length);
  const analysis = useMemo(() => analyze(value), [value]);
  const matched = useMemo(() => {
    const positions = new Set<number>();
    const bracketPosition = analysis.pairs.has(cursor) ? cursor : analysis.pairs.has(cursor - 1) ? cursor - 1 : -1;
    if (bracketPosition >= 0) { positions.add(bracketPosition); positions.add(analysis.pairs.get(bracketPosition)!); }
    return positions;
  }, [analysis, cursor]);
  const guideLines = useMemo(() => value.split("\n").map((line) => {
    const whitespace = line.match(/^[ \t]*/)?.[0] ?? "";
    return Math.floor(whitespace.replace(/\t/g, TAB).length / TAB.length);
  }), [value]);

  useLayoutEffect(() => {
    const previous = previousValueRef.current;
    previousValueRef.current = value;
    if (previous === value) return;
    if (localChangeRef.current) { localChangeRef.current = false; return; }
    let prefix = 0;
    while (prefix < previous.length && prefix < value.length && previous[prefix] === value[prefix]) prefix += 1;
    let suffix = 0;
    while (suffix < previous.length - prefix && suffix < value.length - prefix && previous[previous.length - 1 - suffix] === value[value.length - 1 - suffix]) suffix += 1;
    const removedEnd = previous.length - suffix;
    const insertedLength = value.length - prefix - suffix;
    const move = (position: number) => position <= prefix ? position : position >= removedEnd ? position + insertedLength - (removedEnd - prefix) : prefix + insertedLength;
    const start = Math.max(0, Math.min(value.length, move(selectionRef.current.start)));
    const end = Math.max(start, Math.min(value.length, move(selectionRef.current.end)));
    selectionRef.current = { start, end };
    textareaRef.current?.setSelectionRange(start, end);
  }, [value]);

  function syncScroll(event: UIEvent<HTMLTextAreaElement>) {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = event.currentTarget.scrollTop;
      highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
    if (numbersRef.current) numbersRef.current.scrollTop = event.currentTarget.scrollTop;
    if (guidesRef.current) {
      guidesRef.current.scrollTop = event.currentTarget.scrollTop;
      guidesRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
    if (cursorsRef.current) {
      cursorsRef.current.scrollTop = event.currentTarget.scrollTop;
      cursorsRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
  }

  function handleTab(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const input = event.currentTarget;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;

    let next = value;
    let nextStart = start;
    let nextEnd = end;
    if (start === end) {
      if (event.shiftKey) {
        const removable = value.slice(lineStart, start).match(/^ {1,4}|^\t/)?.[0] ?? "";
        next = value.slice(0, lineStart) + value.slice(lineStart + removable.length);
        nextStart = nextEnd = Math.max(lineStart, start - removable.length);
      } else {
        next = value.slice(0, start) + TAB + value.slice(end);
        nextStart = nextEnd = start + TAB.length;
      }
    } else {
      const selectedLineEnd = value.indexOf("\n", end);
      const blockEnd = selectedLineEnd === -1 ? value.length : selectedLineEnd;
      const block = value.slice(lineStart, blockEnd);
      if (event.shiftKey) {
        const lines = block.split("\n");
        const removed = lines.map((line) => line.match(/^ {1,4}|^\t/)?.[0].length ?? 0);
        const replacement = lines.map((line, index) => line.slice(removed[index])).join("\n");
        next = value.slice(0, lineStart) + replacement + value.slice(blockEnd);
        nextStart = Math.max(lineStart, start - removed[0]);
        nextEnd = end - removed.reduce((sum, count) => sum + count, 0);
      } else {
        const replacement = TAB + block.replace(/\n/g, `\n${TAB}`);
        const affectedLines = block.split("\n").length;
        next = value.slice(0, lineStart) + replacement + value.slice(blockEnd);
        nextStart = start + TAB.length;
        nextEnd = end + TAB.length * affectedLines;
      }
    }
    localChangeRef.current = true;
    selectionRef.current = { start: nextStart, end: nextEnd };
    onChange(next);
    requestAnimationFrame(() => textareaRef.current?.setSelectionRange(nextStart, nextEnd));
  }

  return <div className="code-editor">
    <div className="line-numbers" ref={numbersRef} aria-hidden="true">
      {Array.from({ length: lineCount }, (_, index) => <span key={index}>{index + 1}</span>)}
    </div>
    <div className="code-input">
      <div className="indent-guides" ref={guidesRef} aria-hidden="true">{guideLines.map((depth, lineIndex) => <span className="guide-row" key={lineIndex}>{Array.from({ length: depth }, (_, level) => <i style={{ left: `calc(15px + ${level + 1} * 4ch)` }} key={level} />)}</span>)}</div>
      <pre className="code-highlight" ref={highlightRef} aria-hidden="true"><HighlightedJava code={value} matched={matched} />{"\n"}</pre>
      <div className="remote-cursors" ref={cursorsRef} aria-hidden="true">{remoteCursors.map((remote) => <span className="remote-cursor" key={remote.userId} style={{ top: `calc(13px + ${remote.line} * 21px)`, left: `calc(15px + ${remote.column} * 1ch)`, borderColor: remote.color }}><b style={{ background: remote.color }}>{remote.photoUrl ? <img src={remote.photoUrl} alt="" /> : <i>{remote.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</i>}<span>{remote.name}</span></b></span>)}</div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => {
          localChangeRef.current = true;
          selectionRef.current = { start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd };
          onChange(event.target.value);
        }}
        onKeyDown={handleTab}
        onScroll={syncScroll}
        onSelect={(event) => {
          selectionRef.current = { start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd };
          setCursor(event.currentTarget.selectionStart);
          onCursorChange?.(event.currentTarget.selectionStart);
        }}
        readOnly={readOnly}
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        data-gramm="false"
        data-gramm_editor="false"
        data-enable-grammarly="false"
        aria-label={ariaLabel}
      />
      {analysis.diagnostics.length > 0 && <div className="code-diagnostics" role="status" title={analysis.diagnostics.map((item) => `Line ${item.line}: ${item.message}`).join("\n")}><b>{analysis.diagnostics.length}</b> {analysis.diagnostics[0].message} <span>Line {analysis.diagnostics[0].line}</span></div>}
    </div>
  </div>;
}
