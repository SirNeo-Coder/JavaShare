"use client";

import { useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type UIEvent } from "react";
import { insertJavaSuggestion, javaSuggestions } from "./javaSuggestions";

const TAB = "    ";
const JAVA_TOKEN = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|@[A-Za-z_$][\w$]*|\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while|true|false|null)\b|\b(?:String|System|Object|Integer|Double|Float|Long|Boolean|Character|Math|Override|ArrayList|List|Map|Set|View|TextView|Activity|ViewGroup|ArrayAdapter)\b|\b\d+(?:\.\d+)?(?:[fFdDlL])?\b)/g;
const JAVA_TYPE = /^(String|System|Object|Integer|Double|Float|Long|Boolean|Character|Math|Override|ArrayList|List|Map|Set|View|TextView|Activity|ViewGroup|ArrayAdapter)$/;
const JS_TOKEN = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`|\b(?:async|await|break|case|catch|class|const|continue|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|of|return|super|switch|this|throw|try|typeof|var|void|while|yield|true|false|null|undefined)\b|\b(?:console|document|window|Math|JSON|Array|Object|String|Number|Promise|localStorage)\b|\b\d+(?:\.\d+)?\b)/g;
const CSS_TOKEN = /(\/\*[\s\S]*?\*\/|"[^"\n]*"|'[^'\n]*'|@[\w-]+|#[0-9a-fA-F]{3,8}\b|[\w-]+(?=\s*:[^;{}]*[;}])|-?\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|vmin|vmax|s|ms|deg|fr)?)/g;
// Attribute values only count as strings right after "=", so apostrophes in page text stay plain.
const HTML_TOKEN = /(<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<\/?[A-Za-z][\w-]*|\/?>|[\w-]+(?==)|(?<==)"[^"]*"|(?<==)'[^']*')/gi;

type Classify = (token: string) => string;
const SYNTAX: Record<string, { pattern: RegExp; classify: Classify }> = {
  java: {
    pattern: JAVA_TOKEN,
    classify: (token) => token.startsWith("//") || token.startsWith("/*") ? "comment"
      : token.startsWith('"') || token.startsWith("'") ? "string"
      : token.startsWith("@") ? "annotation"
      : /^\d/.test(token) ? "number"
      : JAVA_TYPE.test(token) ? "type" : "keyword",
  },
  javascript: {
    pattern: JS_TOKEN,
    classify: (token) => token.startsWith("//") || token.startsWith("/*") ? "comment"
      : /^["'`]/.test(token) ? "string"
      : /^\d/.test(token) ? "number"
      : /^(?:console|document|window|Math|JSON|Array|Object|String|Number|Promise|localStorage)$/.test(token) ? "type" : "keyword",
  },
  css: {
    pattern: CSS_TOKEN,
    classify: (token) => token.startsWith("/*") ? "comment"
      : /^["']/.test(token) ? "string"
      : token.startsWith("@") ? "annotation"
      : /^(?:#|-?\d)/.test(token) ? "number" : "type",
  },
  html: {
    pattern: HTML_TOKEN,
    classify: (token) => token.startsWith("<!--") ? "comment"
      : /^["']/.test(token) ? "string"
      : /^(?:<|\/?>)/.test(token) ? "keyword" : "type",
  },
};

export function languageLabel(language: string) {
  return ({ java: "Java", javascript: "JavaScript", css: "CSS", html: "HTML" } as Record<string, string>)[language] ?? language;
}

function Highlighted({ code, matched, language }: { code: string; matched: Set<number>; language: string }) {
  const syntax = SYNTAX[language] ?? SYNTAX.java;
  const parts = code.split(syntax.pattern);
  return <>{parts.map((part, index) => {
    const start = parts.slice(0, index).reduce((length, previous) => length + previous.length, 0);
    const content = Array.from(part).map((character, characterIndex) => {
      const position = start + characterIndex;
      return matched.has(position) ? <mark className="matching-bracket" key={position}>{character}</mark> : character;
    });
    return index % 2 === 1
      ? <span className={`token-${syntax.classify(part)}`} key={index}>{content}</span>
      : <span key={index}>{content}</span>;
  })}</>;
}

type Diagnostic = { line: number; message: string };
const OPENING: Record<string, string> = { "(": ")", "[": "]", "{": "}" };
const CLOSING: Record<string, string> = { ")": "(", "]": "[", "}": "{" };

function analyze(code: string, language: string) {
  const pairs = new Map<number, number>();
  const diagnostics: Diagnostic[] = [];
  const stack: { character: string; position: number; line: number }[] = [];
  // Bracket and semicolon hints understand Java and JavaScript only; HTML and CSS text would give false alarms.
  if (language !== "java" && language !== "javascript") return { pairs, diagnostics };
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
  if (language !== "java") return { pairs, diagnostics };

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
type Props = { value: string; onChange: (value: string) => void; onCursorChange?: (offset: number) => void; remoteCursors?: RemoteCursor[]; readOnly?: boolean; language?: string; files?: string[] };

export default function CodeEditor({ value, onChange, onCursorChange, remoteCursors = [], readOnly = false, language = "java", files }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const numbersRef = useRef<HTMLDivElement>(null);
  const guidesRef = useRef<HTMLDivElement>(null);
  const cursorsRef = useRef<HTMLDivElement>(null);
  const previousValueRef = useRef(value);
  const localChangeRef = useRef(false);
  const selectionRef = useRef({ start: 0, end: 0 });
  const [cursor, setCursor] = useState(0);
  const suggestionId = useId();
  const [completion, setCompletion] = useState<{ value: string; cursor: number; index: number } | null>(null);
  const suggestions = useMemo(() => !readOnly && language === "java" && completion?.value === value
    ? javaSuggestions(value, completion.cursor, completion.cursor, files) : null, [readOnly, language, completion, value, files]);
  const selected = suggestions ? Math.min(completion?.index ?? 0, suggestions.items.length - 1) : 0;
  const lineCount = Math.max(1, value.split("\n").length);
  const analysis = useMemo(() => analyze(value, language), [value, language]);
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
    if (localChangeRef.current) {
      localChangeRef.current = false;
      textareaRef.current?.setSelectionRange(selectionRef.current.start, selectionRef.current.end);
      return;
    }
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
    setCompletion(null);
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

  function acceptSuggestion(index: number) {
    if (!suggestions || readOnly) return;
    const next = insertJavaSuggestion(value, suggestions.from, suggestions.to, suggestions.items[index]);
    setCompletion(null);
    localChangeRef.current = next.value !== value;
    selectionRef.current = { start: next.cursor, end: next.cursor };
    setCursor(next.cursor);
    onChange(next.value);
    onCursorChange?.(next.cursor);
    textareaRef.current?.setSelectionRange(next.cursor, next.cursor);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (readOnly || event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (event.ctrlKey || event.metaKey || event.altKey) { setCompletion(null); return; }
    if (suggestions) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const index = (selected + (event.key === "ArrowDown" ? 1 : -1) + suggestions.items.length) % suggestions.items.length;
        setCompletion((current) => current && { ...current, index });
        requestAnimationFrame(() => document.getElementById(`${suggestionId}-${index}`)?.scrollIntoView({ block: "nearest" }));
        return;
      }
      if (event.key === "Enter") { event.preventDefault(); acceptSuggestion(selected); return; }
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setCompletion(null); return; }
    }
    if (event.key === "Tab") setCompletion(null);
    handleTab(event);
  }

  function handleTab(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (readOnly || event.key !== "Tab") return;
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
    localChangeRef.current = next !== value;
    selectionRef.current = { start: nextStart, end: nextEnd };
    onChange(next);
    textareaRef.current?.setSelectionRange(nextStart, nextEnd);
  }

  return <div className="code-editor">
    <div className="line-numbers" ref={numbersRef} aria-hidden="true">
      {Array.from({ length: lineCount }, (_, index) => <span key={index}>{index + 1}</span>)}
    </div>
    <div className="code-input">
      <div className="indent-guides" ref={guidesRef} aria-hidden="true">{guideLines.map((depth, lineIndex) => <span className="guide-row" key={lineIndex}>{Array.from({ length: depth }, (_, level) => <i style={{ left: `calc(15px + ${level + 1} * 4ch)` }} key={level} />)}</span>)}</div>
      <pre className="code-highlight" ref={highlightRef} aria-hidden="true"><Highlighted code={value} matched={matched} language={language} />{"\n"}</pre>
      <div className="remote-cursors" ref={cursorsRef} aria-hidden="true">{remoteCursors.map((remote) => <span className="remote-cursor" key={remote.userId} style={{ top: `calc(13px + ${remote.line} * 21px)`, left: `calc(15px + ${remote.column} * 1ch)`, borderColor: remote.color }}><b style={{ background: remote.color }}>{remote.photoUrl ? <img src={remote.photoUrl} alt="" /> : <i>{remote.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</i>}<span>{remote.name}</span></b></span>)}</div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => {
          localChangeRef.current = true;
          selectionRef.current = { start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd };
          setCursor(event.currentTarget.selectionStart);
          setCompletion(!(event.nativeEvent as InputEvent).isComposing && event.currentTarget.selectionStart === event.currentTarget.selectionEnd
            ? { value: event.target.value, cursor: event.currentTarget.selectionStart, index: 0 } : null);
          onChange(event.target.value);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => setCompletion(null)}
        onCompositionStart={() => setCompletion(null)}
        onScroll={syncScroll}
        onSelect={(event) => {
          selectionRef.current = { start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd };
          if (event.currentTarget.selectionStart !== completion?.cursor || event.currentTarget.selectionEnd !== completion?.cursor) setCompletion(null);
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
        aria-label={`${languageLabel(language)} source code editor`}
        aria-autocomplete={language === "java" && !readOnly ? "list" : undefined}
        aria-controls={suggestions ? suggestionId : undefined}
        aria-activedescendant={suggestions ? `${suggestionId}-${selected}` : undefined}
        aria-describedby={suggestions ? `${suggestionId}-help` : undefined}
      />
      {suggestions && <div className="code-suggestions">
        <div id={`${suggestionId}-help`} className="code-suggestions-help">Java suggestions · ↑↓ choose · Enter insert · Esc close</div>
        <div id={suggestionId} role="listbox" aria-label="Java code suggestions">
          {suggestions.items.map((item, index) => <button key={item.label} id={`${suggestionId}-${index}`} type="button" role="option" aria-selected={index === selected} tabIndex={-1}
            onPointerDown={(event) => event.preventDefault()} onClick={() => acceptSuggestion(index)}>{item.label}</button>)}
        </div>
      </div>}
      {analysis.diagnostics.length > 0 && <div className="code-diagnostics" role="status" title={analysis.diagnostics.map((item) => `Line ${item.line}: ${item.message}`).join("\n")}><b>{analysis.diagnostics.length}</b> {analysis.diagnostics[0].message} <span>Line {analysis.diagnostics[0].line}</span></div>}
    </div>
  </div>;
}
