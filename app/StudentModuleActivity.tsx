"use client";

import { useImperativeHandle, useRef, useState, type Ref } from "react";
import CodeEditor from "./CodeEditor";
import { api } from "./apiClient";
import { runJava, getJavaRunner } from "./javaExecution";
import { useJavaConsole } from "./useJavaConsole";
import JavaRunnerBrand from "./JavaRunnerBrand";
import type { CourseModule, ModuleFile, Progress, StepBlock } from "./ModuleViewer";
import { JAVA_PATH, JAVA_PATH_MAX_LENGTH } from "../backend/src/file-paths";
import { sourcePath, samplePending } from "../backend/src/module-activities";

export type StudentActivity = {
  kind: "module" | "performance"; module: CourseModule;
  classroomId: string; moduleId: string; moduleTitle: string; stepId: string; stateId: string;
  instruction: string; expectedOutput: string; stdin: string; progress: Progress;
};
export type ModuleEditorHandle = { save: () => Promise<void> };

type RunCheck = { check: "sample" | "task"; passed: boolean; sampleMatched: boolean; success: boolean };

export function ModuleRunFeedback({ result, completed, pendingSample, expectedError }: {
  result: RunCheck | null; completed: boolean; pendingSample: boolean; expectedError?: string;
}) {
  const good = result?.passed ?? completed;
  const title = result?.check === "sample" ? result.passed
    ? expectedError ? "Expected error observed — now complete Your task." : "Sample verified — now complete Your task."
    : "Sample not verified — run the supplied sample unchanged."
    : result ? result.passed ? "Completed — next activity unlocked."
      : result.sampleMatched ? "Still showing sample output. Apply the task changes and run again."
        : "Not completed — this run differs from the required output."
      : completed ? "Completed — your progress is saved." : pendingSample ? "First, run the sample unchanged." : "Not checked yet — complete Your task, then Run code.";
  return <div className={`module-run-feedback ${good ? "passed" : result ? "retry" : "ready"}`} role="status" aria-live="polite">
    <strong>{title}</strong>
    {result?.check === "sample" && result.passed && <p>Sample verification is saved. This step stays open until your alteration matches Expected task output.</p>}
    {result && !result.passed && <p>{completed ? "This task was completed earlier. Your saved completion remains." : "Progress has not advanced. Compare Actual output with the expected output above."}</p>}
  </div>;
}

export function JavaRunProgress({ message, waiting = false }: { message: string | null; waiting?: boolean }) {
  if (!message) return null;
  return <div className="java-run-progress" role="status" aria-live="polite">
    <span className="java-run-spinner" aria-hidden="true" />
    <strong>{waiting ? "Waiting for your input — type your answer in Program input and press Enter." : message}</strong>
  </div>;
}

export default function StudentModuleActivity({ activity, ref, onChecked, onClose }: {
  activity: StudentActivity; ref: Ref<ModuleEditorHandle>; onChecked: () => void; onClose: () => void;
}) {
  const personal = activity.kind === "performance";
  const task = !personal && activity.stateId.startsWith("task:");
  const [files, setFiles] = useState<ModuleFile[]>(personal ? activity.progress.performanceProjectFiles : activity.progress.projectFiles);
  const [stdin, setStdin] = useState("");
  const [path, setPath] = useState(files.find((file) => /(?:^|\/)Main\.java$/.test(file.path))?.path ?? files[0]?.path ?? "");
  const [newPath, setNewPath] = useState("");
  const [addingFile, setAddingFile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [output, setOutput] = useState("Ready — edit your project, then press Run code.");
  const javaConsole = useJavaConsole(setOutput, `${activity.classroomId}/${activity.moduleId}/${activity.kind}`);
  const [status, setStatus] = useState(personal ? activity.progress.performanceTask.own ? "Submitted" : "Personal project" : activity.progress.stepStates[activity.stateId] === "pass" ? "Completed" : "Not checked yet");
  const progress = useRef(activity.progress);
  const [stepStates, setStepStates] = useState(activity.progress.stepStates);
  const [lastCheck, setLastCheck] = useState<RunCheck | null>(null);
  const step = activity.module?.lessons?.flatMap((lesson) => lesson.blocks).find((block): block is StepBlock => block.type === "step" && "id" in block && block.id === activity.stepId);
  const pendingSample = !personal && Boolean(step && samplePending(activity.module, step, stepStates));
  const completed = !personal && stepStates[activity.stateId] === "pass";
  const checkInput = pendingSample ? step?.stdin ?? "" : activity.stdin;
  const [savedFiles, setSavedFiles] = useState(JSON.stringify(files));
  const busyRef = useRef(false);
  const base = `/api/classrooms/${activity.classroomId}/modules/${activity.moduleId}/progress`;
  const projectPath = `${base}/${personal ? "performance-project" : "project"}`;
  const dirty = JSON.stringify(files) !== savedFiles;

  const save = async () => {
    if (busyRef.current) throw new Error("Wait for the current save or run to finish");
    if (!dirty) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      progress.current = await api<Progress>(projectPath, { method: "PUT", body: JSON.stringify({ files, updatedAt: progress.current.updatedAt, ...(!personal ? { stepId: activity.stepId } : {}) }) });
      setSavedFiles(JSON.stringify(files));
    } finally { busyRef.current = false; setBusy(false); }
  };
  useImperativeHandle(ref, () => ({ save }));

  const run = async () => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true); setError("");
    setLastCheck(null);
    setRunMessage("Saving your code…");
    try {
      // Save first so failures or an unavailable runner never discard the student's edits.
      progress.current = await api<Progress>(projectPath, { method: "PUT", body: JSON.stringify({ files, updatedAt: progress.current.updatedAt, ...(!personal ? { stepId: activity.stepId } : {}) }) });
      setSavedFiles(JSON.stringify(files));
      setRunMessage("Java is loading or running… Please wait.");
      if (personal) {
        await javaConsole.run(files, stdin, () => setStdin(""));
      } else {
        const runner = await getJavaRunner();
        const browserResult = runner.mode === "browser" ? await runJava(files, checkInput, runner) : null;
        setRunMessage(browserResult ? "Checking your output…" : "Running Java and checking output… Please wait.");
        const result = await api<RunCheck & { output: string; progress: Progress }>(`${base}/${browserResult ? "browser-result" : "run"}`, {
          method: "POST", body: JSON.stringify({ stepId: activity.stepId, updatedAt: progress.current.updatedAt, ...(browserResult ? { success: browserResult.success, output: browserResult.output } : { files }) }),
        });
        progress.current = result.progress;
        setStepStates(result.progress.stepStates);
        setOutput(result.output);
        setLastCheck(result);
        setStatus(result.progress.stepStates[activity.stateId] === "pass" ? "Completed" : result.check === "sample" && result.passed ? "Sample verified" : "Try again");
        onChecked();
      }
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Could not run this activity");
    } finally { busyRef.current = false; setBusy(false); setRunMessage(null); }
  };

  const submit = async () => {
    if (busyRef.current) return;
    try {
      await save();
      if (busyRef.current) return;
      busyRef.current = true; setBusy(true); setError("");
      progress.current = await api<Progress>(`${base}/performance-task`, {
        method: "PUT", body: JSON.stringify({ variant: "own", files, status: "pass", updatedAt: progress.current.updatedAt }),
      });
      setStatus("Submitted"); onChecked();
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Could not submit your project"); }
    finally { busyRef.current = false; setBusy(false); }
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
      if (event.ctrlKey && event.key === "Enter" && !javaConsole.waiting) { event.preventDefault(); void run(); }
    }}>
      <section className="editor-card">
        <div className="workspace-card-heading"><b>{personal ? "Personal project" : "Module project"} · {activity.moduleTitle}</b><span>Java</span></div>
        <div className="file-tabs" aria-label={personal ? "Personal project files" : "Module project files"}>
          {files.map((file) => <button type="button" key={file.path} className={`file-tab ${path === file.path ? "active" : ""}`} onClick={() => setPath(file.path)}>{file.path}</button>)}
          <button type="button" className="add-file" aria-label={personal ? "Add personal Java file" : "Add module Java file"} disabled={busy || pendingSample} onClick={() => setAddingFile(!addingFile)}>＋</button>
        </div>
        <CodeEditor value={files.find((file) => file.path === path)?.content ?? ""} language="java" readOnly={busy || pendingSample} onChange={(content) => setFiles((current) => current.map((file) => file.path === path ? { ...file, content } : file))} />
        <div className="editor-status"><span>{path}</span><span>{dirty ? "Unsaved changes — click Save work" : "Your project is saved"}</span></div>
      </section>
      <aside className="right-panel module-activity-console">
        <div className="workspace-card-heading"><b>Console</b><span aria-live="polite">{status}</span></div>
        <div className="module-activity-details">
          <b>{personal ? "Your performance task" : pendingSample ? "Run the sample first" : task ? "Your task" : "Module sample"}</b><p>{pendingSample ? "The sample and supporting classes are loaded. Press Run code before editing. After verification, this editor opens for Your task." : activity.instruction}</p>
          {personal ? <label>Program input<textarea value={stdin} disabled={busy && !javaConsole.waiting} placeholder={javaConsole.waiting ? "Type your answer and press Enter…" : "Optional input before running"} onChange={(event) => setStdin(event.target.value)} onKeyDown={(event) => {
            if (javaConsole.waiting && event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault(); javaConsole.send(stdin); setStdin("");
            }
          }} /></label> : <><b>{pendingSample ? step?.expectedError ? "Expected error" : "Expected sample output" : task ? "Expected task output" : "Expected output"}</b><pre>{pendingSample ? step?.expectedError ?? step?.expectedOutput : activity.expectedOutput}</pre></>}
          {checkInput && <><b>Program input for this check</b><pre>{checkInput}</pre></>}
          {!personal && activity.progress.activityProjects?.beforeSampleFiles && <details className="module-before-sample"><summary>Work saved before sample loading</summary>{activity.progress.activityProjects.beforeSampleFiles.map((file) => <div key={file.path}><b>{file.path}</b><pre>{file.content}</pre></div>)}</details>}
          {addingFile && <form onSubmit={addFile}><label>Java filename<input autoFocus value={newPath} onChange={(event) => setNewPath(event.target.value)} placeholder="Helper.java" /></label><button disabled={busy}>Add file</button></form>}
          {error && <p className="module-error" role="alert">{error}</p>}
        </div>
        {!personal && <ModuleRunFeedback result={lastCheck} completed={completed} pendingSample={pendingSample} expectedError={step?.expectedError} />}
        <JavaRunnerBrand />
        <JavaRunProgress message={runMessage} waiting={javaConsole.waiting} />
        <div className="console" aria-busy={Boolean(runMessage) && !javaConsole.waiting}><b>Actual output</b><pre aria-label="Program output">{output}</pre>
          {javaConsole.waiting && <small role="status">Waiting for input — press Enter to send</small>}
          {javaConsole.active && <button type="button" className="run-button" onClick={javaConsole.stop}>Stop</button>}
        </div>
      </aside>
    </div>
    <footer className="actionbar">
      <div><span className="sync" aria-live="polite">{status}</span><button type="button" disabled={busy} onClick={async () => { try { await save(); onClose(); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Could not save"); } }}>Return to class project</button></div>
      <div>{personal && <button type="button" className="run-button" disabled={busy} onClick={() => void submit()}>Submit this version</button>}<button type="button" className="run-button" disabled={busy} onClick={() => void run()}>{busy ? "Working…" : "▶ Run code"}<kbd>Ctrl ↵</kbd></button><button type="button" className="run-button" disabled={busy} onClick={() => void save().catch((saveError) => setError(saveError instanceof Error ? saveError.message : "Could not save"))}>Save work</button></div>
    </footer>
  </>;
}
