"use client";

// Module editor, Option A (teacher, 2026-11-23): a separate editing copy of the worksheet paper. It reuses the
// worksheet's look (CSS) and text formatter but none of the student worksheet code, so students' screens never
// change with it. Every clickable spot is one wording field the server allows (tests/module-editor.test.mjs).
import { useRef, useState, type ReactNode } from "react";
import { Markdown, renderInline } from "./ModuleViewer";
import type { CourseModule } from "../backend/src/course-module-schema";
import { getWording } from "../backend/src/module-wording";

type Path = (string | number)[];
type Kind = "plain" | "inline" | "block";
type Edit = { module: CourseModule; onChange: (path: Path, text: string) => void };

// Wraps the selected words in a formatting mark, e.g. **bold**; with nothing selected it inserts an empty pair.
export function wrapSelection(text: string, start: number, end: number, mark: string) {
  return { text: text.slice(0, start) + mark + text.slice(start, end) + mark + text.slice(end), start: start + mark.length, end: end + mark.length };
}

function Spot({ edit, path, kind, label }: { edit: Edit; path: Path; kind: Kind; label: string }) {
  const value = getWording(edit.module, path);
  const [editing, setEditing] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);
  const shown = kind === "block" ? <Markdown markdown={value} /> : kind === "inline" ? renderInline(value, path.join(".")) : value;
  if (!editing) {
    const Tag = kind === "block" ? "div" : "span";
    return <Tag className="module-edit-spot" data-path={path.join(".")} role="button" tabIndex={0} title={`Edit ${label}`} aria-label={`Edit ${label}`}
      onClick={() => setEditing(true)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); setEditing(true); } }}>
      {value ? shown : <i className="module-edit-empty">(empty)</i>}
    </Tag>;
  }
  const mark = (symbol: string) => {
    const area = box.current;
    if (!area) return;
    const next = wrapSelection(value, area.selectionStart, area.selectionEnd, symbol);
    edit.onChange(path, next.text);
    requestAnimationFrame(() => { area.focus(); area.setSelectionRange(next.start, next.end); });
  };
  return <span className="module-edit-box" data-path={path.join(".")}>
    {kind !== "plain" && <span className="module-edit-tools" aria-label="Formatting">
      {([["**", "B", "Bold"], ["*", "I", "Italic"], ["`", "code", "Code"]] as const).map(([symbol, text, name]) =>
        <button key={name} type="button" aria-label={name} onMouseDown={(event) => { event.preventDefault(); mark(symbol); }}>{text}</button>)}
    </span>}
    <textarea ref={box} autoFocus aria-label={label} value={value} rows={Math.max(kind === "block" ? 3 : 1, value.split("\n").length + Math.floor(value.length / 90))}
      onChange={(event) => edit.onChange(path, event.target.value)} onBlur={() => setEditing(false)}
      onKeyDown={(event) => { if (event.key === "Escape") setEditing(false); }} />
  </span>;
}

function Locked({ children }: { children: ReactNode }) {
  return <div className="module-edit-locked" title="Not editable in this stage">{children}</div>;
}

function Liplet({ edit, l }: { edit: Edit; l: number }) {
  const lesson = edit.module.lessons[l];
  return <div className="module-exit-slip"><b>LIPLET · {lesson.dayLabel || lesson.title}</b>
    {lesson.exitSlip.questions.map((question, q) => <p key={question.id}>{question.id}. <Spot edit={edit} path={["lessons", l, "exitSlip", "questions", q, "prompt"]} kind="plain" label={`liplet question ${question.id}`} /></p>)}
  </div>;
}

function Block({ edit, l, b }: { edit: Edit; l: number; b: number }) {
  const lesson = edit.module.lessons[l], block = lesson.blocks[b], at = (...path: Path) => ["lessons", l, "blocks", b, ...path];
  if (block.type === "step") {
    const task = block.activity;
    return <div className="module-step">
      <h3 className="paper-heading">{lesson.dayLabel || "Lesson"} · Step {block.number}</h3>
      <Spot edit={edit} path={at("instruction")} kind="block" label={`Step ${block.number} instruction`} />
      <Locked>{task?.id && <b>Sample code</b>}<div className="printed-sample">{block.files.map((file) => <div key={file.path}><small>{file.path}</small><pre><code>{file.content}</code></pre></div>)}</div>
        <b>{task?.id ? "Sample output" : "Output (expected):"}</b><pre className="printed-output">{block.expectedOutput}</pre></Locked>
      {task?.guided && <div className="paper-instructions module-guided">
        {task.guided.discussion !== undefined && <><b>Discussion</b><Spot edit={edit} path={at("activity", "guided", "discussion")} kind="block" label={`Step ${block.number} discussion`} /></>}
        <b>Guided example</b><Spot edit={edit} path={at("activity", "guided", "instruction")} kind="block" label={`Step ${block.number} guided example`} />
        <Locked><div className="printed-sample"><pre><code>{task.guided.code}</code></pre></div><b>Expected guided output</b><pre className="printed-output">{task.guided.expectedOutput}</pre></Locked>
      </div>}
      {task && <div className="paper-instructions"><b>{task.id ? "Your task" : "Student activity"}</b><Spot edit={edit} path={at("activity", "instruction")} kind="block" label={`Step ${block.number} task`} />
        <Locked><b>Expected task output</b><pre className="printed-output">{task.expectedOutput}</pre>
          {task.solution && <><b>Answer key (teacher only)</b><pre><code>{task.solution.lines}</code></pre>{task.solution.note && <Markdown markdown={task.solution.note} />}</>}</Locked></div>}
      {block.checkYourself !== undefined && <div className="module-check-yourself"><Spot edit={edit} path={at("checkYourself")} kind="block" label={`Step ${block.number} check yourself`} /></div>}
    </div>;
  }
  const table = (columns: ReactNode[], rows: ReactNode[][]) => <div className="paper-table-scroll"><table><thead><tr>{columns.map((column, c) => <th key={c}>{column}</th>)}</tr></thead>
    <tbody>{rows.map((row, r) => <tr key={r}>{row.map((cell, c) => <td key={c}>{cell}</td>)}</tr>)}</tbody></table></div>;
  return <div className={`module-text-block paper-${block.type}`}>
    {(block.type === "analogy" || block.type === "note" || block.type === "errorGuide") && <b className="paper-label">{block.type === "errorGuide" ? "Error guide" : block.type === "analogy" ? "Analogy" : "Check yourself"}</b>}
    {block.type === "definition" && <b><Spot edit={edit} path={at("term")} kind="plain" label="term" />: </b>}
    {"markdown" in block && <Spot edit={edit} path={at("markdown")} kind="block" label="text" />}
    {block.type === "table" && table(block.columns.map((_, c) => <Spot key={c} edit={edit} path={at("columns", c)} kind="plain" label={`column ${c + 1}`} />),
      block.rows.map((row, r) => row.map((_, c) => <Spot key={c} edit={edit} path={at("rows", r, c)} kind="inline" label={`row ${r + 1} cell ${c + 1}`} />)))}
    {block.type === "errorGuide" && table(["If you see", "It means", "Fix"], block.rows.map((_, r) => (["see", "means", "fix"] as const).map((key) =>
      <Spot key={key} edit={edit} path={at("rows", r, key)} kind="inline" label={`error guide row ${r + 1} ${key}`} />)))}
    {block.type === "error" && <Locked><pre className="printed-output">{block.message}</pre></Locked>}
  </div>;
}

export default function ModuleEditPage({ module, onChange, page }: Edit & { page: number }) {
  const edit = { module, onChange };
  const task = module.performanceTask;
  const list = (field: "steps" | "checklist" | "presentationOutline" | "questionsToPrepare", label: string, kind: Kind = "plain") =>
    task?.[field]?.map((_, i) => <li key={i}><Spot edit={edit} path={["performanceTask", field, i]} kind={kind} label={`${label} ${i + 1}`} /></li>);
  return <div className="worksheet-desk module-edit-desk">
    <article className="worksheet-paper" hidden={page !== 0} aria-label="Overview">
      <header className="paper-title"><h2><Spot edit={edit} path={["title"]} kind="plain" label="module title" /></h2>
        <p>{module.course.toUpperCase()} · Week {module.week}{module.continues !== undefined && <> · Continues <Spot edit={edit} path={["continues"]} kind="plain" label="continues" /></>}</p></header>
      <table className="paper-schedule"><thead><tr><th>Day</th><th>Topic</th></tr></thead><tbody>{module.lessons.map((lesson, l) => <tr key={lesson.id}>
        <td><Spot edit={edit} path={["lessons", l, "dayLabel"]} kind="plain" label="day label" /></td><td><Spot edit={edit} path={["lessons", l, "title"]} kind="plain" label="day title" /></td></tr>)}</tbody></table>
    </article>
    {module.lessons.map((lesson, l) => <article key={lesson.id} className="worksheet-paper" hidden={page !== l + 1} aria-label={lesson.dayLabel || `Lesson ${l + 1}`}>
      <h3 className="paper-heading">{lesson.dayLabel} — {lesson.title}</h3>
      <div className="paper-instructions"><b>Objectives (teacher only, not on the student worksheet)</b>
        {(["cognitive", "affective", "psychomotor"] as const).map((kind) => <p key={kind}><small>{kind}: </small><Spot edit={edit} path={["lessons", l, "objectives", kind]} kind="plain" label={`${kind} objective`} /></p>)}</div>
      {lesson.blocks.map((_, b) => <Block key={b} edit={edit} l={l} b={b} />)}
      <Liplet edit={edit} l={l} />
    </article>)}
    {task && <article className="worksheet-paper" hidden={page !== module.lessons.length + 1} aria-label="Performance task">
      <h3 className="paper-heading"><Spot edit={edit} path={["performanceTask", "title"]} kind="plain" label="performance task title" /></h3>
      <Spot edit={edit} path={["performanceTask", "markdown"]} kind="block" label="performance task description" />
      {task.steps && <section><b>How to build it, step by step</b><ol>{list("steps", "step", "inline")}</ol></section>}
      <ul>{list("checklist", "checklist item")}</ul>
      <Locked><b>Sample code and starter files</b><p>Not editable in this stage.</p></Locked>
      {task.presentationOutline.length > 0 && <><h3 className="paper-heading">Presentation</h3><ol>{list("presentationOutline", "presentation point")}</ol></>}
      {task.questionsToPrepare.length > 0 && <><h3 className="paper-heading">Prepare for these questions</h3><ul>{list("questionsToPrepare", "question")}</ul></>}
      <div className="paper-table-scroll"><table><thead><tr><th>Criterion</th><th>Points</th></tr></thead><tbody>{task.rubric.map((row, i) => <tr key={i}>
        <td><Spot edit={edit} path={["performanceTask", "rubric", i, "criterion"]} kind="inline" label={`rubric ${i + 1}`} /></td><td className="module-edit-locked">{row.points}</td></tr>)}</tbody></table></div>
    </article>}
  </div>;
}
