"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import CodeEditor from "./CodeEditor";
import { api } from "./apiClient";
import { runJava, getJavaRunner } from "./javaExecution";
import { useJavaConsole } from "./useJavaConsole";
import JavaRunnerBrand from "./JavaRunnerBrand";
import type { CourseModule, ModuleFile, Progress, StepBlock } from "./ModuleViewer";
import { JAVA_PATH, JAVA_PATH_MAX_LENGTH } from "../backend/src/file-paths";
import { checkModuleRun, mergeProjectFiles, samplePending, sampleStateId, sourcePath } from "../backend/src/module-activities";
import { moduleRecordKey, readDeviceRecord, restoreModuleDraft, writeDeviceRecord, type ModuleDeviceDraft } from "./moduleDeviceStore";

export type StudentActivity = {
  kind: "module" | "performance" | "review";
  review?: { studentId: string; studentName: string; submissionId: string; submission: import("../backend/src/personal-performance").PersonalSubmission }; module: CourseModule;
  classroomId: string; moduleId: string; moduleTitle: string; stepId: string; stateId: string; studentId: string;
  instruction: string; expectedOutput: string; stdin: string; progress: Progress;
};
export type ModuleEditorHandle = { save: () => Promise<void> };

type RunCheck = { check: "sample" | "task"; passed: boolean; sampleMatched: boolean; success: boolean; syncPending?: boolean };

export function ModuleRunFeedback({ result, completed, pendingSample, expectedError }: {
  result: RunCheck | null; completed: boolean; pendingSample: boolean; expectedError?: string;
}) {
  const good = !result?.syncPending && (result?.passed ?? completed);
  const title = result?.syncPending ? "Passed locally — awaiting sync."
    : result?.check === "sample" ? result.passed
    ? expectedError ? "Expected error observed — now complete Your task." : "Sample verified — now complete Your task."
    : "Sample not verified — run the supplied sample unchanged."
    : result ? result.passed ? "Completed — next activity unlocked."
      : result.sampleMatched ? "Still showing sample output. Apply the task changes and run again."
        : "Not completed — this run differs from the required output."
      : completed ? "Completed — your progress is saved." : pendingSample ? "First, run the sample unchanged." : "Not checked yet — complete Your task, then Run code.";
  return <div className={`module-run-feedback ${good ? "passed" : result ? "retry" : "ready"}`} role="status" aria-live="polite">
    <strong>{title}</strong>
    {result?.syncPending && <p>Your code is kept on this device. The next activity opens after CodeShare accepts this completion.</p>}
    {result?.check === "sample" && result.passed && <p>Sample verification is saved. This step stays open until your alteration matches Expected task output.</p>}
    {result && !result.passed && <p>{completed ? "This task was completed earlier. Your saved completion remains." : "Progress has not advanced. Compare Actual output with the expected output above."}</p>}
  </div>;
}

// Lines added/removed/edited since the last save, across all files. Line multiset, not a real diff:
// moved lines count as unchanged, which is close enough for the Save work colour.
export function changedLines(saved: ModuleFile[], current: ModuleFile[]) {
  const lines = (files: ModuleFile[]) => files.flatMap((file) => file.content.split("\n"));
  const before = lines(saved), after = lines(current), left = new Map<string, number>();
  for (const line of before) left.set(line, (left.get(line) ?? 0) + 1);
  const kept = after.filter((line) => { const n = left.get(line) ?? 0; left.set(line, n - 1); return n > 0; }).length;
  return Math.max(before.length - kept, after.length - kept);
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
  const review = activity.kind === "review";
  const personal = activity.kind !== "module";
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
  const [successfulFiles, setSuccessfulFiles] = useState<string | null>(null);
  const [savedFiles, setSavedFiles] = useState(JSON.stringify(files));
  const [deviceReady, setDeviceReady] = useState(personal);
  const localKey = moduleRecordKey("activity", activity.studentId, activity.classroomId, activity.moduleId, activity.stepId);
  const draftRef = useRef<Omit<ModuleDeviceDraft, "files">>({ moduleVersion: activity.progress.moduleVersion, stateId: activity.stateId });
  const [backups, setBackups] = useState<ModuleDeviceDraft["backups"]>([]);
  const runnerRef = useRef<Awaited<ReturnType<typeof getJavaRunner>> | null>(null);
  const busyRef = useRef(false);
  const base = `/api/classrooms/${activity.classroomId}/modules/${activity.moduleId}/progress`;
  const projectPath = `${base}/${personal ? "performance-project" : "project"}`;
  const dirty = JSON.stringify(files) !== savedFiles;
  const saveColour = !dirty ? "saved" : changedLines(JSON.parse(savedFiles), files) >= 10 ? "many-changes" : "editing";
  const saveDeviceDraft = useCallback(async (nextFiles = files) => {
    await writeDeviceRecord(localKey, { files: nextFiles, ...draftRef.current });
    setSavedFiles(JSON.stringify(nextFiles));
  }, [files, localKey]);

  useEffect(() => {
    if (personal || !deviceReady) return;
    const timer = setTimeout(() => { void saveDeviceDraft().catch((storageError) => setError(storageError instanceof Error ? `Device storage is unavailable: ${storageError.message}` : "Device storage is unavailable")); }, 250);
    return () => clearTimeout(timer);
  }, [files, deviceReady, personal, saveDeviceDraft]);

  useEffect(() => {
    if (personal) return;
    let active = true;
    void readDeviceRecord<ModuleDeviceDraft>(localKey).then(async (saved) => {
      if (!active) return;
      if (step) {
        const needsSample = samplePending(activity.module, step, activity.progress.stepStates);
        const draft = restoreModuleDraft(saved, { files: needsSample ? mergeProjectFiles(activity.progress.projectFiles, step.files) : activity.progress.projectFiles,
          moduleVersion: activity.progress.moduleVersion, stateId: activity.stateId }, step, needsSample);
        await writeDeviceRecord(localKey, draft);
        if (!active) return;
        const { files: restoredFiles, ...evidence } = draft;
        setFiles(restoredFiles);
        setPath(restoredFiles.find((file) => /(?:^|\/)Main\.java$/.test(file.path))?.path ?? restoredFiles[0]?.path ?? "");
        setSavedFiles(JSON.stringify(restoredFiles));
        draftRef.current = evidence;
        setBackups(draft.backups);
        if (draft.sample) setStepStates((current) => ({ ...current, [sampleStateId(step)]: "pass" }));
        if (draft.pending) {
          setLastCheck({ check: "task", passed: true, sampleMatched: false, success: true, syncPending: true });
          setStatus("Passed locally — awaiting sync");
        }
      }
    }).catch((storageError) => setError(storageError instanceof Error ? `Device storage is unavailable: ${storageError.message}` : "Device storage is unavailable"))
      .finally(() => { if (active) setDeviceReady(true); });
    return () => { active = false; };
  }, [activity.module, activity.progress, activity.stateId, localKey, personal, step]);

  const save = async () => {
    if (busyRef.current) throw new Error("Wait for the current save or run to finish");
    if (review || !dirty) return;
    busyRef.current = true; setBusy(true); setError("");
    try {
      if (personal) {
        progress.current = await api<Progress>(projectPath, { method: "PUT", body: JSON.stringify({ files, updatedAt: progress.current.updatedAt }) });
        setSavedFiles(JSON.stringify(files));
      }
      else await saveDeviceDraft();
    } finally { busyRef.current = false; setBusy(false); }
  };
  useImperativeHandle(ref, () => ({ save }));

  const run = async () => {
    if (busyRef.current || !deviceReady) return;
    busyRef.current = true; setBusy(true); setError("");
    setLastCheck(null); setSuccessfulFiles(null);
    setRunMessage(personal ? "Saving your project…" : "Saving your code on this device…");
    try {
      if (review) { setRunMessage("Java is loading or running… Please wait."); await javaConsole.run(files, stdin, () => setStdin("")); return; }
      if (!personal) await saveDeviceDraft();
      else {
        progress.current = await api<Progress>(projectPath, { method: "PUT", body: JSON.stringify({ files, updatedAt: progress.current.updatedAt }) });
        setSavedFiles(JSON.stringify(files));
      }
      setRunMessage("Java is loading or running… Please wait.");
      if (personal) {
        const started = await api<{ progress: Progress; success?: boolean; output?: string }>(`${base}/personal-run`, {
          method: "POST", body: JSON.stringify({ updatedAt: progress.current.updatedAt, stdin }),
        });
        progress.current = started.progress;
        let success = started.success;
        if (success === undefined) {
          const result = await javaConsole.run(files, stdin, () => setStdin(""));
          progress.current = await api<Progress>(`${base}/personal-result`, { method: "POST", body: JSON.stringify({ updatedAt: progress.current.updatedAt, success: result.success }) });
          success = result.success;
        } else setOutput(started.output ?? "");
        if (success) setSuccessfulFiles(JSON.stringify(files));
      } else {
        const runner = runnerRef.current ?? await getJavaRunner();
        runnerRef.current = runner;
        if (runner.mode !== "browser") {
          setRunMessage("Running Java and checking output… Please wait.");
          const result = await api<RunCheck & { output: string; progress: Progress; module?: CourseModule }>(`${base}/run`, { method: "POST", body: JSON.stringify({ stepId: activity.stepId, updatedAt: progress.current.updatedAt, files }) });
          progress.current = { ...result.progress, moduleVersion: progress.current.moduleVersion }; setStepStates(result.progress.stepStates); setOutput(result.output); setLastCheck(result);
          if (result.module) await writeDeviceRecord(moduleRecordKey("content", activity.studentId, activity.classroomId, activity.moduleId), { value: result.module, savedAt: Date.now() });
          setStatus(result.progress.stepStates[activity.stateId] === "pass" ? "Completed" : result.check === "sample" && result.passed ? "Sample verified" : "Try again");
          if (result.passed) onChecked();
        } else {
          const result = await runJava(files, checkInput, runner);
          const check = checkModuleRun(activity.module, { ...step!, activity: step!.activity ? { ...step!.activity, stdin: step!.activity.stdin ?? "" } : undefined } as Parameters<typeof checkModuleRun>[1], stepStates, files, result);
          setOutput(result.output); setLastCheck({ ...check, success: result.success, syncPending: check.check === "task" && check.passed });
          if (check.check === "sample" && check.passed) {
            draftRef.current.sample = { files, success: result.success, output: result.output };
            setStepStates((current) => ({ ...current, [sampleStateId(step!)]: "pass" }));
            await writeDeviceRecord(localKey, { files, ...draftRef.current });
            setStatus("Sample verified on this device");
          } else if (check.check === "task" && check.passed) {
            const pending = { stepId: activity.stepId, updatedAt: progress.current.updatedAt, moduleVersion: progress.current.moduleVersion, completionId: crypto.randomUUID(), files, success: true, output: result.output, ...(draftRef.current.sample ? { sample: draftRef.current.sample } : {}) };
            draftRef.current.pending = pending;
            await writeDeviceRecord(localKey, { files, ...draftRef.current });
            setRunMessage("Syncing your completed task…");
            const synced = await api<{ progress: Progress; module: CourseModule }>(`${base}/complete`, { method: "POST", body: JSON.stringify(pending) });
            progress.current = { ...synced.progress, moduleVersion: progress.current.moduleVersion };
            draftRef.current.pending = undefined;
            await writeDeviceRecord(moduleRecordKey("content", activity.studentId, activity.classroomId, activity.moduleId), { value: synced.module, savedAt: Date.now() });
            await writeDeviceRecord(localKey, { files, ...draftRef.current });
            setStepStates(progress.current.stepStates); setStatus("Completed — saved to CodeShare"); onChecked();
            setLastCheck((current) => current ? { ...current, syncPending: false } : current);
          } else setStatus(check.check === "sample" ? "Sample not verified" : "Try again");
        }
      }
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Could not run this activity");
      if (draftRef.current.pending) setStatus("Passed locally — awaiting sync");
    } finally { busyRef.current = false; setBusy(false); setRunMessage(null); }
  };

  useEffect(() => {
    if (personal || !deviceReady) return;
    const retry = async () => {
      const pending = draftRef.current.pending;
      if (!pending || busyRef.current || !navigator.onLine) return;
      busyRef.current = true; setBusy(true); setError("");
      try {
        const synced = await api<{ progress: Progress; module: CourseModule }>(`${base}/complete`, { method: "POST", body: JSON.stringify(pending) });
        progress.current = { ...synced.progress, moduleVersion: progress.current.moduleVersion }; draftRef.current.pending = undefined;
        await writeDeviceRecord(moduleRecordKey("content", activity.studentId, activity.classroomId, activity.moduleId), { value: synced.module, savedAt: Date.now() });
        await writeDeviceRecord(localKey, { files, ...draftRef.current });
        setStepStates(synced.progress.stepStates); setStatus("Completed — saved to CodeShare"); onChecked();
        setLastCheck((current) => current ? { ...current, syncPending: false } : current);
      } catch (syncError) { setError(syncError instanceof Error ? syncError.message : "Could not sync completed task"); }
      finally { busyRef.current = false; setBusy(false); }
    };
    window.addEventListener("online", retry);
    void retry();
    return () => window.removeEventListener("online", retry);
  }, [activity.classroomId, activity.moduleId, activity.studentId, base, deviceReady, files, localKey, onChecked, personal]);

  const submit = async () => {
    if (busyRef.current || review || successfulFiles !== JSON.stringify(files)) return;
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

  const changeFiles = (next: ModuleFile[]) => { setFiles(next); setSuccessfulFiles(null); };
  const renameFile = () => {
    const entered = window.prompt("New Java file path", path)?.trim().replace(/\\/g, "/");
    if (!entered || entered === path) return;
    if (entered.length > JAVA_PATH_MAX_LENGTH || !JAVA_PATH.test(entered) || files.some((file) => file.path !== path && sourcePath(file.path) === sourcePath(entered))) {
      setError("Choose a unique Java filename."); return;
    }
    changeFiles(files.map((file) => file.path === path ? { ...file, path: entered } : file)); setPath(entered);
  };

  const addFile = (event: React.FormEvent) => {
    event.preventDefault();
    const entered = newPath.trim().replace(/\\/g, "/");
    if (files.length >= 50 || entered.length > JAVA_PATH_MAX_LENGTH || !JAVA_PATH.test(entered) || files.some((file) => sourcePath(file.path) === sourcePath(entered))) {
      setError("Choose a unique Java filename, such as Helper.java (up to 50 files)."); return;
    }
    const name = entered.split("/").at(-1)!.slice(0, -5);
    const packageName = sourcePath(entered).split("/").slice(0, -1).join(".");
    changeFiles([...files, { path: entered, content: `${packageName ? `package ${packageName};\n\n` : ""}public class ${name} {\n\n}\n` }]);
    setPath(entered); setNewPath(""); setAddingFile(false); setError("");
  };

  return <>
    <div className="content-grid student-module-project" onKeyDown={(event) => {
      if (event.ctrlKey && event.key === "Enter" && !javaConsole.waiting) { event.preventDefault(); void run(); }
    }}>
      <section className="editor-card">
        <div className="workspace-card-heading"><b>{review ? "Submitted personal project — read-only" : personal ? "Personal project" : "Module project"} · {activity.moduleTitle}</b><span>Java</span></div>
        <div className="file-tabs" aria-label={personal ? "Personal project files" : "Module project files"}>
          {files.map((file) => <button type="button" key={file.path} className={`file-tab ${path === file.path ? "active" : ""}`} onClick={() => setPath(file.path)}>{file.path}</button>)}
          {!review && <button type="button" className="add-file" aria-label={personal ? "Add personal Java file" : "Add module Java file"} disabled={busy || pendingSample} onClick={() => setAddingFile(!addingFile)}>＋</button>}
        </div>
        <CodeEditor value={files.find((file) => file.path === path)?.content ?? ""} language="java" readOnly={review || busy || pendingSample || !deviceReady} files={files.map((file) => file.content)} onChange={(content) => changeFiles(files.map((file) => file.path === path ? { ...file, content } : file))} />
        <div className="editor-status"><span>{path}</span><span>{review ? "Frozen submitted files" : dirty ? "Unsaved changes — click Save work" : personal ? "Your project is saved" : "Saved on this device"}</span></div>
        {personal && !review && <div className="module-step-actions"><button type="button" disabled={busy} onClick={renameFile}>Rename file</button><button type="button" disabled={busy || files.length < 2} onClick={() => {
          if (!window.confirm(`Delete ${path}?`)) return;
          const remaining = files.filter((file) => file.path !== path); changeFiles(remaining); setPath(remaining[0].path);
        }}>Delete file</button></div>}
      </section>
      <aside className="right-panel module-activity-console">
        <div className="workspace-card-heading"><b>Console</b><span aria-live="polite">{status}</span></div>
        <div className="module-activity-details">
          <b>{personal ? "Your performance task" : pendingSample ? "Run the sample first" : task ? "Your task" : "Module sample"}</b><p>{pendingSample ? "The sample and supporting classes are loaded. Press Run code before editing. After verification, this editor opens for Your task." : activity.instruction}</p>
          {personal ? <label>Program input<textarea aria-label="Program input" value={stdin} disabled={busy && !javaConsole.waiting} placeholder={javaConsole.waiting ? "Type your answer and press Enter…" : "Optional input before running"} onChange={(event) => setStdin(event.target.value)} onKeyDown={(event) => {
            if (javaConsole.waiting && event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault(); javaConsole.send(stdin); setStdin("");
            }
          }} /></label> : <><b>{pendingSample ? step?.expectedError ? "Expected error" : "Expected sample output" : task ? "Expected task output" : "Expected output"}</b><pre>{pendingSample ? step?.expectedError ?? step?.expectedOutput : activity.expectedOutput}</pre></>}
          {checkInput && <><b>Program input for this check</b><pre>{checkInput}</pre></>}
          {!personal && activity.progress.activityProjects?.beforeSampleFiles && <details className="module-before-sample"><summary>Work saved before sample loading</summary>{activity.progress.activityProjects.beforeSampleFiles.map((file) => <div key={file.path}><b>{file.path}</b><pre>{file.content}</pre></div>)}</details>}
          {!personal && Boolean(backups?.length) && <details className="module-before-sample"><summary>Work saved before lesson changes</summary><p>Your earlier code is kept below. Run the current sample first, then copy any changes you still need.</p>{backups?.map((backup, index) => <div key={index}><b>Backup {index + 1}</b>{backup.files.map((file) => <div key={file.path}><b>{file.path}</b><pre>{file.content}</pre></div>)}</div>)}</details>}
          {addingFile && <form onSubmit={addFile}><label>Java filename<input autoFocus value={newPath} onChange={(event) => setNewPath(event.target.value)} placeholder="Helper.java" /></label><button disabled={busy}>Add file</button></form>}
          {error && <p className="module-error" role="alert">{error}</p>}
        </div>
        {personal && !review && <p role="status">{successfulFiles === JSON.stringify(files) ? "Run succeeded — ready to submit this version." : "Run the current files successfully before submitting."} Submission records progress, not a grade or teacher approval.</p>}
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
      <div>{personal && !review && <button type="button" className="run-button" disabled={busy || successfulFiles !== JSON.stringify(files)} onClick={() => void submit()}>Submit this version</button>}<button type="button" className="run-button" disabled={busy || !deviceReady || Boolean(error && error.startsWith("Device storage is unavailable"))} onClick={() => void run()}>{busy ? "Working…" : "▶ Run code"}<kbd>Ctrl ↵</kbd></button>{!review && <button type="button" className={personal ? `run-button save-${saveColour}` : "run-button"} disabled={busy || !deviceReady || Boolean(error && error.startsWith("Device storage is unavailable"))} onClick={() => void save().catch((saveError) => setError(saveError instanceof Error ? saveError.message : "Could not save"))}>Save work</button>}</div>
    </footer>
  </>;
}
