"use client";

import { useImperativeHandle, useRef, useState, type Ref } from "react";
import CodeEditor from "./CodeEditor";
import { api } from "./apiClient";
import type { ModuleFile, Progress } from "./ModuleViewer";
import { JAVA_PATH, JAVA_PATH_MAX_LENGTH } from "../backend/src/file-paths";
import { sourcePath } from "../backend/src/module-activities";

export type StudentActivity = {
  classroomId: string; moduleId: string; moduleTitle: string; stepId: string; stateId: string;
  instruction: string; expectedOutput: string; stdin: string; progress: Progress;
};
export type ModuleEditorHandle = { save: () => Promise<void> };

export default function StudentModuleActivity({ activity, ref, onChecked, onClose }: {
  activity: StudentActivity; ref: Ref<ModuleEditorHandle>; onChecked: () => void; onClose: () => void;
}) {
  const [files, setFiles] = useState<ModuleFile[]>(activity.progress.projectFiles);
  const [path, setPath] = useState(files.find((file) => /(?:^|\/)Main\.java$/.test(file.path))?.path ?? files[0]?.path ?? "");
  const [newPath, setNewPath] = useState("");
  const [addingFile, setAddingFile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState("Ready — edit your project, then press Run code.");
  const [status, setStatus] = useState(activity.progress.stepStates[activity.stateId] === "pass" ? "Passed" : "Not checked yet");
  const progress = useRef(activity.progress);
  const [savedFiles, setSavedFiles] = useState(JSON.stringify(files));
  const busyRef = useRef(false);
  const base = `/api/classrooms/${activity.classroomId}/modules/${activity.moduleId}/progress`;
  const dirty = JSON.stringify(files) !== savedFiles;

  const save = async () => {
    if (busyRef.current) throw new Error("Wait for the current save or run to finish");
    if (!dirty) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      progress.current = await api<Progress>(`${base}/project`, { method: "PUT", body: JSON.stringify({ files, updatedAt: progress.current.updatedAt }) });
      setSavedFiles(JSON.stringify(files));
    } finally { busyRef.current = false; setBusy(false); }
  };
  useImperativeHandle(ref, () => ({ save }));

  const run = async () => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      // Save first so failures or an unavailable runner never discard the student's edits.
      progress.current = await api<Progress>(`${base}/project`, { method: "PUT", body: JSON.stringify({ files, updatedAt: progress.current.updatedAt }) });
      setSavedFiles(JSON.stringify(files));
      const result = await api<{ output: string; passed: boolean; progress: Progress }>(`${base}/run`, {
        method: "POST", body: JSON.stringify({ stepId: activity.stepId, files, updatedAt: progress.current.updatedAt }),
      });
      progress.current = result.progress;
      setOutput(result.output);
      setStatus(result.passed ? "Passed" : "Try again — this run did not match the required outcome");
      onChecked();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Could not run this activity");
    } finally { busyRef.current = false; setBusy(false); }
  };

  const addFile = (event: React.FormEvent) => {
    event.preventDefault();
    const entered = newPath.trim().replace(/\\/g, "/");
    if (files.length >= 50 || entered.length > JAVA_PATH_MAX_LENGTH || !JAVA_PATH.test(entered) || files.some((file) => sourcePath(file.path) === sourcePath(entered))) {
      setError("Choose a unique Java filename, such as Helper.java (up to 50 files)."); return;
    }
    const name = entered.split("/").at(-1)!.slice(0, -5);
    const packageName = sourcePath(entered).split("/").slice(0, -1).join(".");
    setFiles([...files, { path: entered, content: `${packageName ? `package ${packageName};\n\n` : ""}public class ${name} {\n\n}\n` }]);
    setPath(entered); setNewPath(""); setAddingFile(false); setError("");
  };

  return <>
    <div className="content-grid student-module-project" onKeyDown={(event) => {
      if (event.ctrlKey && event.key === "Enter") { event.preventDefault(); void run(); }
    }}>
      <section className="editor-card">
        <div className="workspace-card-heading"><b>Code editor · {activity.moduleTitle}</b><span>Java</span></div>
        <div className="file-tabs" aria-label="Module project files">
          {files.map((file) => <button type="button" key={file.path} className={`file-tab ${path === file.path ? "active" : ""}`} onClick={() => setPath(file.path)}>{file.path}</button>)}
          <button type="button" className="add-file" aria-label="Add module Java file" disabled={busy} onClick={() => setAddingFile(!addingFile)}>＋</button>
        </div>
        <CodeEditor value={files.find((file) => file.path === path)?.content ?? ""} language="java" readOnly={busy} onChange={(content) => setFiles((current) => current.map((file) => file.path === path ? { ...file, content } : file))} />
        <div className="editor-status"><span>{path}</span><span>{dirty ? "Unsaved changes — click Save work" : "Your module project is saved"}</span></div>
      </section>
      <aside className="right-panel module-activity-console">
        <div className="workspace-card-heading"><b>Console</b><span aria-live="polite">{status}</span></div>
        <div className="module-activity-details">
          <b>Your activity</b><p>{activity.instruction}</p>
          <b>Required output</b><pre>{activity.expectedOutput}</pre>
          {activity.stdin && <><b>Program input for this check</b><pre>{activity.stdin}</pre></>}
          {addingFile && <form onSubmit={addFile}><label>Java filename<input autoFocus value={newPath} onChange={(event) => setNewPath(event.target.value)} placeholder="Helper.java" /></label><button disabled={busy}>Add file</button></form>}
          {error && <p className="module-error" role="alert">{error}</p>}
        </div>
        <div className="console"><pre aria-label="Program output">{output}</pre></div>
      </aside>
    </div>
    <footer className="actionbar">
      <div><span className="sync" aria-live="polite">{status}</span><button type="button" disabled={busy} onClick={async () => { try { await save(); onClose(); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Could not save"); } }}>Return to class project</button></div>
      <div><button type="button" className="run-button" disabled={busy} onClick={() => void run()}>{busy ? "Working…" : "▶ Run code"}<kbd>Ctrl ↵</kbd></button><button type="button" className="run-button" disabled={busy} onClick={() => void save().catch((saveError) => setError(saveError instanceof Error ? saveError.message : "Could not save"))}>Save work</button></div>
    </footer>
  </>;
}
