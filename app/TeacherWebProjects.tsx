"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "./apiClient";
import CodeEditor from "./CodeEditor";
import { originOf, type Preview, type ConsoleMessage } from "./webPreview";
import { buildTeacherPreview } from "./teacherWebPreview";

type Project = { id: string; title: string; description: string };
type ProjectFiles = { project: Project; files: { id: string; path: string; language: string; content: string; version: number }[] };
type Props = { classroomId: string; student: { id: string; name: string }; onClose: () => void };

function ProjectList({ path, onOpen }: { path: string; onOpen: (project: Project) => void }) {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    api<{ projects: Project[] }>(path)
      .then((result) => { if (active) setProjects(result.projects); })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load web projects"); });
    return () => { active = false; };
  }, [path, refresh]);
  return <>
    <div className="teacher-web-actions"><button type="button" onClick={() => { setProjects(null); setError(""); setRefresh((value) => value + 1); }}>Refresh</button></div>
    {error ? <p className="module-error" role="alert">{error}</p> : projects === null ? <p>Loading web projects…</p> :
      projects.length === 0 ? <p>No web projects saved for this student in this class yet.</p> :
      <div className="module-list">{projects.map((project) => <div className="module-list-row" key={project.id}>
        <button type="button" onClick={() => onOpen(project)}>{project.title}</button>
      </div>)}</div>}
  </>;
}

function ProjectView({ path, title, onBack }: { path: string; title: string; onBack: () => void }) {
  const [detail, setDetail] = useState<ProjectFiles | null>(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [fileId, setFileId] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [run, setRun] = useState(0);
  const [logs, setLogs] = useState<{ kind: ConsoleMessage["kind"]; text: string; where: string }[]>([]);
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    let active = true;
    api<ProjectFiles>(path).then((result) => {
      if (active) { setDetail(result); setFileId(result.files[0]?.id ?? ""); }
    }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load web project"); });
    return () => { active = false; };
  }, [path, refresh]);
  useEffect(() => {
    if (!preview) return;
    const receive = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      const message = event.data as ConsoleMessage;
      if (message?.codeshare !== "console" || !["log", "info", "warn", "error", "alert"].includes(message.kind) || typeof message.text !== "string") return;
      const origin = originOf(preview, Number.isInteger(message.line) ? message.line : null);
      setLogs((current) => current.length >= 500 ? current : [...current, { kind: message.kind, text: message.text.slice(0, 2000), where: origin ? `${origin.file}:${origin.line}` : "" }]);
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [preview]);
  const file = detail?.files.find((item) => item.id === fileId);
  return <>
    <div className="teacher-web-actions">
      <button type="button" onClick={onBack}>Back to projects</button>
      <button type="button" onClick={() => { setDetail(null); setPreview(null); setLogs([]); setError(""); setRefresh((value) => value + 1); }}>Refresh</button>
      <button type="button" disabled={!detail?.files.length} onClick={() => { setPreview(buildTeacherPreview(detail!.files)); setLogs([]); setRun((value) => value + 1); }}>Run preview</button>
    </div>
    <h3>{detail?.project.title ?? title}</h3>
    {error ? <p className="module-error" role="alert">{error}</p> : detail === null ? <p>Loading saved files…</p> :
      detail.files.length === 0 ? <p>This project has no saved files yet.</p> : <>
        <div className="teacher-web-files" aria-label="Saved project files">
          <div className="submission-file-tabs">{detail.files.map((item) => <button type="button" className={item.id === fileId ? "active" : ""} aria-pressed={item.id === fileId} key={item.id} onClick={() => setFileId(item.id)}>{item.path}</button>)}</div>
          {file && <CodeEditor value={file.content} language={file.language} readOnly onChange={() => {}} />}
        </div>
        <div className="web-preview teacher-web-preview">
          {preview?.html ? <iframe key={run} ref={frame} title="Student web page preview" sandbox="allow-scripts" srcDoc={preview.html} /> : <p className="web-preview-empty"><span>Press <b>Run preview</b> to see this saved page.</span></p>}
          <ol className="preview-console" aria-label="Page console">
            {preview?.warnings.map((warning, index) => <li className="log-warn" key={`warning-${index}`}>{warning}</li>)}
            {logs.length ? logs.map((log, index) => <li className={`log-${log.kind}`} key={index}><span>{log.text}</span>{log.where && <small>{log.where}</small>}</li>) : <li className="log-empty">console.log output and errors appear here</li>}
          </ol>
        </div>
      </>}
  </>;
}

export default function TeacherWebProjects({ classroomId, student, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Project | null>(null);
  const path = `/api/classes/${classroomId}/students/${student.id}/web-projects`;
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} className="activity-modal teacher-web-projects" aria-labelledby="teacher-web-title" onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <header><h2 id="teacher-web-title">Web projects — {student.name}</h2><button type="button" onClick={onClose} aria-label="Close">×</button></header>
    <p className="module-preview-note">Read-only saved files. Ask the student to save, then press Refresh to see their latest work.</p>
    {selected ? <ProjectView key={selected.id} path={`${path}/${selected.id}`} title={selected.title} onBack={() => setSelected(null)} /> : <ProjectList path={path} onOpen={setSelected} />}
  </dialog>;
}
