"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type ComponentProps, type Ref } from "react";
import CodeEditor from "./CodeEditor";
import { api } from "./apiClient";
import { runJava, getJavaRunner } from "./javaExecution";
import { useJavaConsole } from "./useJavaConsole";
import JavaRunnerBrand from "./JavaRunnerBrand";
import { ModuleMediaFiles, PerformanceTaskSteps, copyText, moduleCode, type CourseModule, type ModuleFile, type Progress, type StepBlock } from "./ModuleViewer";
import { JAVA_PATH, JAVA_PATH_MAX_LENGTH, fileLanguage, moduleWebPathError, projectPathError } from "../backend/src/file-paths";
import { checkModuleRun, mergeProjectFiles, samplePending, sampleStateId, sourcePath, teacherCheckedStep, webPerformanceTask, webStep } from "../backend/src/module-activities";
import { WebCheckList, useWebPageRun, type WebRunResult } from "./WebStepRun";
import { moduleRecordKey, readDeviceRecord, restoreModuleDraft, writeDeviceRecord, type ModuleDeviceDraft } from "./moduleDeviceStore";
import { listModuleMedia, loadModuleMedia, loadPersonalMedia } from "./moduleMedia";

export type StudentActivity = {
  kind: "module" | "performance" | "review";
  review?: { studentId: string; studentName: string; submissionId: string; submission: import("../backend/src/personal-performance").PersonalSubmission }; module: CourseModule;
  classroomId: string; moduleId: string; moduleTitle: string; stepId: string; stateId: string; studentId: string;
  instruction: string; expectedOutput: string; stdin: string; progress: Progress;
};
export type ModuleEditorHandle = { save: () => Promise<void>; applyEdit: (path: string, edit: (content: string) => string) => void };
// Teacher live help: the open file, typing and cursor go to the watching teacher; their cursor comes back.
export type ModuleLiveLink = {
  cursors: ComponentProps<typeof CodeEditor>["remoteCursors"];
  onFile: (path: string, content: string, editable: boolean) => void;
  onEdit: (path: string, content: string) => void;
  onCursor: (offset: number) => void;
};

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

// Dialogs take keyboard focus while open and hand it back when they close (CKB-040).
function useDialogFocus<T extends HTMLElement>(open: boolean) {
  const target = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    target.current?.focus();
    return () => previous?.focus();
  }, [open]);
  return target;
}

// Floating box while code saves, compiles and runs (CKB-081). Clicking outside or Esc cancels
// only when the run can really be stopped (online Java in this browser); otherwise it stays until done.
export function RunBox({ message, onCancel }: { message: string | null; onCancel?: () => void }) {
  const box = useDialogFocus<HTMLElement>(Boolean(message));
  if (!message) return null;
  return <div className="confirm-overlay" onMouseDown={(event) => { if (onCancel && event.target === event.currentTarget) onCancel(); }}>
    <section ref={box} tabIndex={-1} className="confirm-card run-box" role="dialog" aria-modal="true" aria-labelledby="run-box-title" aria-describedby="run-box-hint"
      onKeyDown={(event) => { if (onCancel && event.key === "Escape") onCancel(); }}>
      <span className="java-run-spinner" aria-hidden="true" />
      <div className="confirm-copy"><span className="eyebrow">RUN CODE</span><h2 id="run-box-title">{message}</h2>
        <p id="run-box-hint">{onCancel ? "Click outside this box or press Esc to cancel." : "Please wait — this box closes when your code has run."}</p></div>
    </section>
  </div>;
}

export type Notice = { title: string; text: string; failed?: boolean };
// Confirms Save work and Submit this version, or says why they failed (CKB-081).
export function NoticeBox({ notice, onClose }: { notice: Notice | null; onClose: () => void }) {
  const ok = useDialogFocus<HTMLButtonElement>(Boolean(notice));
  if (!notice) return null;
  return <div className="confirm-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="notice-title" aria-describedby="notice-text" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
      <span className={`confirm-icon ${notice.failed ? "danger" : "done"}`} aria-hidden="true">{notice.failed ? "!" : "✓"}</span>
      <div className="confirm-copy"><h2 id="notice-title">{notice.title}</h2><p id="notice-text">{notice.text}</p></div>
      <div className="confirm-actions"><button type="button" ref={ok} onClick={onClose}>OK</button></div>
    </section>
  </div>;
}

// Web steps open their run page (index.html) first; Java opens Main.java first.
function firstPath(list: ModuleFile[], web: boolean, run = "index.html") {
  return (web ? list.find((file) => file.path === run) ?? list.find((file) => file.path.endsWith(".html"))
    : list.find((file) => /(?:^|\/)Main\.java$/.test(file.path)))?.path ?? list[0]?.path ?? "";
}

export default function StudentModuleActivity({ activity, ref, onChecked, onClose, live }: {
  activity: StudentActivity; ref: Ref<ModuleEditorHandle>; onChecked: () => void; onClose: () => void; live?: ModuleLiveLink;
}) {
  const review = activity.kind === "review";
  const personal = activity.kind !== "module";
  const task = !personal && activity.stateId.startsWith("task:");
  const step = activity.module?.lessons?.flatMap((lesson) => lesson.blocks).find((block): block is StepBlock => block.type === "step" && "id" in block && block.id === activity.stepId);
  // Web steps and web personal projects run in the student's own browser preview, online and offline; Java keeps its runners.
  const web = personal ? webPerformanceTask(activity.module) : Boolean(step && webStep(step));
  // A media step is checked automatically once its module's media files are uploaded; until then, or
  // offline, the teacher marks it done (teacher, 2026-10-29). This device keeps the files after downloading.
  const mediaStep = web && Boolean(step && teacherCheckedStep(step));
  const [media, setMedia] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!mediaStep) return;
    let active = true;
    listModuleMedia(activity.classroomId, activity.moduleId)
      .then((files) => loadModuleMedia(activity.classroomId, activity.moduleId, files, moduleRecordKey("media", activity.studentId, activity.classroomId, activity.moduleId)))
      .then((files) => { if (active) setMedia(files); }, () => undefined);
    return () => { active = false; };
  }, [mediaStep, activity.classroomId, activity.moduleId, activity.studentId]);
  const hasMedia = Object.keys(media).length > 0;
  const teacherChecked = mediaStep && !hasMedia;
  // A web personal project's own pictures, sound and video (online only); a review shows the submitted copies.
  const [personalMedia, setPersonalMedia] = useState(review ? activity.review?.submission.media ?? [] : personal ? activity.progress.performanceTask.project?.media ?? [] : []);
  const personalPage = async () => personalMedia.length ? { files: await loadPersonalMedia(activity.classroomId, activity.studentId, personalMedia), include: false } : undefined;
  const webPage = useWebPageRun();
  const [webResult, setWebResult] = useState<WebRunResult | null>(null);
  const [files, setFiles] = useState<ModuleFile[]>(personal ? activity.progress.performanceProjectFiles : activity.progress.projectFiles);
  const [stdin, setStdin] = useState("");
  const [path, setPath] = useState(firstPath(files, web, step?.run));
  const [newPath, setNewPath] = useState("");
  const [addingFile, setAddingFile] = useState(false);
  const [fileError, setFileError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  // Modules with steps offer their copyable samples on the steps themselves instead.
  const codeToCopy = personal && !review && !activity.module?.performanceTask?.steps?.length ? moduleCode(activity.module) : [];
  const [busy, setBusy] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [output, setOutput] = useState("Ready — edit your project, then press Run code.");
  const javaConsole = useJavaConsole(setOutput, `${activity.classroomId}/${activity.moduleId}/${activity.kind}`);
  const [status, setStatus] = useState(personal ? activity.progress.performanceTask.own ? "Submitted" : "Personal project" : activity.progress.stepStates[activity.stateId] === "pass" ? "Completed" : "Not checked yet");
  const progress = useRef(activity.progress);
  const [stepStates, setStepStates] = useState(activity.progress.stepStates);
  const [lastCheck, setLastCheck] = useState<RunCheck | null>(null);
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
        setPath(firstPath(restoredFiles, web, step?.run));
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
  }, [activity.module, activity.progress, activity.stateId, localKey, personal, step, web]);

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
  const saveWork = async () => {
    const changed = dirty;
    try {
      await save();
      setNotice(!personal ? { title: "Work saved", text: "Saved on this device. Your code is sent to CodeShare when you complete the task." }
        : changed ? { title: "Work saved", text: "Your project is saved to CodeShare." } : { title: "Already saved", text: "Nothing changed since your last save." });
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Could not save";
      setError(message); setNotice({ title: "Could not save", text: message, failed: true });
    }
  };
  const editable = !review && deviceReady && !pendingSample;
  // A teacher's edit lands like the student's own typing: unsaved until Save work or a run keeps it.
  const applyEdit = (editPath: string, edit: (content: string) => string) => {
    if (!editable) return;
    setFiles((current) => current.map((file) => file.path === editPath ? { ...file, content: edit(file.content) } : file));
    setSuccessfulFiles(null);
  };
  useImperativeHandle(ref, () => ({ save, applyEdit }));
  // A new snapshot only when the open file or editability changes; typing travels as edits.
  const sentFile = useRef("");
  useEffect(() => {
    if (review || !live || sentFile.current === `${editable}:${path}`) return;
    sentFile.current = `${editable}:${path}`;
    live.onFile(path, files.find((file) => file.path === path)?.content ?? "", editable);
  }, [review, live, path, editable, files]);

  const run = async () => {
    if (busyRef.current || !deviceReady) return;
    busyRef.current = true; setBusy(true); setError("");
    setLastCheck(null); setSuccessfulFiles(null); setWebResult(null);
    setRunMessage(personal ? "Saving your project…" : "Saving your code on this device…");
    try {
      if (review && web) { setRunMessage("Running the page…"); setWebResult(await webPage.run(files, "index.html", [], await personalPage())); return; }
      if (review) { setRunMessage("Java is loading or running… Please wait."); await javaConsole.run(files, stdin, () => setStdin("")); return; }
      if (!personal) await saveDeviceDraft();
      else {
        progress.current = await api<Progress>(projectPath, { method: "PUT", body: JSON.stringify({ files, updatedAt: progress.current.updatedAt }) });
        setSavedFiles(JSON.stringify(files));
      }
      setRunMessage(web ? "Running your page…" : "Java is loading or running… Please wait.");
      if (personal && web) {
        const result = await webPage.run(files, "index.html", [], await personalPage());
        setWebResult(result);
        progress.current = await api<Progress>(`${base}/personal-result`, { method: "POST", body: JSON.stringify({ updatedAt: progress.current.updatedAt, success: result.success, files, output: result.output }) });
        if (result.success) setSuccessfulFiles(JSON.stringify(files));
      } else if (personal) {
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
        const runner = web ? null : runnerRef.current ?? await getJavaRunner();
        if (runner) runnerRef.current = runner;
        if (runner && runner.mode !== "browser") {
          setRunMessage("Running Java and checking output… Please wait.");
          const result = await api<RunCheck & { output: string; progress: Progress; module?: CourseModule }>(`${base}/run`, { method: "POST", body: JSON.stringify({ stepId: activity.stepId, updatedAt: progress.current.updatedAt, files }) });
          progress.current = { ...result.progress, moduleVersion: progress.current.moduleVersion }; setStepStates(result.progress.stepStates); setOutput(result.output); setLastCheck(result);
          if (result.module) await writeDeviceRecord(moduleRecordKey("content", activity.studentId, activity.classroomId, activity.moduleId), { value: result.module, savedAt: Date.now() });
          setStatus(result.progress.stepStates[activity.stateId] === "pass" ? "Completed" : result.check === "sample" && result.passed ? "Sample verified" : "Try again");
          if (result.passed) onChecked();
        } else {
          const result = runner ? await runJava(files, checkInput, runner)
            : await webPage.run(files, step!.run, step!.webChecks, hasMedia ? { files: media, include: Boolean(step!.includeMediaOutput) } : undefined);
          const page = runner ? undefined : result as WebRunResult;
          const pageReport = page ? { checks: page.checks, media: page.media } : {};
          if (!runner) setWebResult(result as WebRunResult);
          if (teacherChecked) { setStatus("Checked by your teacher for now"); return; }
          const check = checkModuleRun(activity.module, { ...step!, activity: step!.activity ? { ...step!.activity, stdin: step!.activity.stdin ?? "" } : undefined } as Parameters<typeof checkModuleRun>[1], stepStates, files, result);
          setOutput(result.output); setLastCheck({ ...check, success: result.success, syncPending: check.check === "task" && check.passed });
          if (check.check === "sample" && check.passed) {
            draftRef.current.sample = { files, success: result.success, output: result.output, ...pageReport };
            setStepStates((current) => ({ ...current, [sampleStateId(step!)]: "pass" }));
            await writeDeviceRecord(localKey, { files, ...draftRef.current });
            setStatus("Sample verified on this device");
          } else if (check.check === "task" && check.passed) {
            const pending = { stepId: activity.stepId, updatedAt: progress.current.updatedAt, moduleVersion: progress.current.moduleVersion, completionId: crypto.randomUUID(), files, success: true, output: result.output,
              ...pageReport, ...(draftRef.current.sample ? { sample: draftRef.current.sample } : {}) };
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
      setNotice({ title: "Version submitted", text: "Your teacher can now review this version. Submission records progress, not a grade or teacher approval." });
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Could not submit your project";
      setError(message); setNotice({ title: "Could not submit", text: message, failed: true });
    }
    finally { busyRef.current = false; setBusy(false); }
  };

  const changeFiles = (next: ModuleFile[]) => { setFiles(next); setSuccessfulFiles(null); };
  const renameFile = () => {
    const entered = window.prompt(web ? "New file path" : "New Java file path", path)?.trim().replace(/\\/g, "/");
    if (!entered || entered === path) return;
    if (web ? moduleWebPathError(entered) || files.some((file) => file.path === entered)
      : entered.length > JAVA_PATH_MAX_LENGTH || !JAVA_PATH.test(entered) || files.some((file) => file.path !== path && sourcePath(file.path) === sourcePath(entered))) {
      setError(web ? "Choose a unique filename ending in .html, .css, .js or .txt." : "Choose a unique Java filename."); return;
    }
    changeFiles(files.map((file) => file.path === path ? { ...file, path: entered } : file)); setPath(entered);
  };

  const closeAddFile = () => { setAddingFile(false); setFileError(""); };
  const addFile = (event: React.FormEvent) => {
    event.preventDefault();
    const entered = newPath.trim().replace(/\\/g, "/");
    if (web) {
      // Personal web projects may also keep .txt backups (teacher, 2026-10-29).
      if (files.length >= 50 || (personal ? moduleWebPathError(entered) : projectPathError("web", entered)) || files.some((file) => file.path === entered)) {
        setFileError(`Choose a unique web filename ending in .html, .css${personal ? ", .js or .txt" : " or .js"}, such as about.html (up to 50 files).`); return;
      }
      changeFiles([...files, { path: entered, content: "" }]);
      setPath(entered); setNewPath(""); setAddingFile(false); setFileError(""); setError(""); return;
    }
    if (files.length >= 50 || entered.length > JAVA_PATH_MAX_LENGTH || !JAVA_PATH.test(entered) || files.some((file) => sourcePath(file.path) === sourcePath(entered))) {
      setFileError("Choose a unique Java filename, such as Helper.java (up to 50 files)."); return;
    }
    const name = entered.split("/").at(-1)!.slice(0, -5);
    const packageName = sourcePath(entered).split("/").slice(0, -1).join(".");
    changeFiles([...files, { path: entered, content: `${packageName ? `package ${packageName};\n\n` : ""}public class ${name} {\n\n}\n` }]);
    setPath(entered); setNewPath(""); setAddingFile(false); setFileError(""); setError("");
  };

  return <>
    <div className="content-grid student-module-project" onKeyDown={(event) => {
      if (event.ctrlKey && event.key === "Enter" && !javaConsole.waiting) { event.preventDefault(); void run(); }
    }}>
      <section className="editor-card">
        <div className="workspace-card-heading"><b>{review ? "Submitted personal project — read-only" : personal ? "Personal project" : "Module project"} · {activity.moduleTitle}</b><span>{web ? "Web page" : "Java"}</span></div>
        <div className="file-tabs" aria-label={personal ? "Personal project files" : "Module project files"}>
          {files.map((file) => <button type="button" key={file.path} className={`file-tab ${path === file.path ? "active" : ""}`} onClick={() => setPath(file.path)}>{file.path}</button>)}
          {!review && <button type="button" className="add-file" aria-label={`Add ${personal ? "personal" : "module"} ${web ? "web" : "Java"} file`} disabled={busy || pendingSample} onClick={() => setAddingFile(true)}>＋</button>}
        </div>
        <CodeEditor value={files.find((file) => file.path === path)?.content ?? ""} language={web ? fileLanguage(path) : "java"} readOnly={review || busy || pendingSample || !deviceReady} files={files.map((file) => file.content)} remoteCursors={live?.cursors} onCursorChange={live?.onCursor} onChange={(content) => { changeFiles(files.map((file) => file.path === path ? { ...file, content } : file)); live?.onEdit(path, content); }} />
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
          {personal && !review && <PerformanceTaskSteps steps={activity.module?.performanceTask?.steps} module={activity.module} />}
          {personal && web && !review && <ModuleMediaFiles<Progress> base={`${projectPath}/media`} files={personalMedia}
            note="Your own pictures, sound and video for this project (5 MB each, up to 10). Use the path shown, for example images/photo.png, in your page. Online only."
            onChange={(next) => { progress.current = next; setPersonalMedia(next.performanceTask.project?.media ?? []); setSuccessfulFiles(null); }} />}
          {personal && web ? null : personal ? <label>Program input<textarea aria-label="Program input" value={stdin} disabled={busy && !javaConsole.waiting} placeholder={javaConsole.waiting ? "Type your answer and press Enter…" : "Optional input before running"} onChange={(event) => setStdin(event.target.value)} onKeyDown={(event) => {
            if (javaConsole.waiting && event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault(); javaConsole.send(stdin); setStdin("");
            }
          }} /></label> : <><b>{pendingSample ? step?.expectedError ? "Expected error" : "Expected sample output" : task ? "Expected task output" : "Expected output"}</b><pre>{pendingSample ? step?.expectedError ?? step?.expectedOutput : activity.expectedOutput}</pre></>}
          {checkInput && <><b>Program input for this check</b><pre>{checkInput}</pre></>}
          {!personal && activity.progress.activityProjects?.beforeSampleFiles && <details className="module-before-sample"><summary>Work saved before sample loading</summary>{activity.progress.activityProjects.beforeSampleFiles.map((file) => <div key={file.path}><b>{file.path}</b><pre>{file.content}</pre></div>)}</details>}
          {!personal && Boolean(backups?.length) && <details className="module-before-sample"><summary>Work saved before lesson changes</summary><p>Your earlier code is kept below. Run the current sample first, then copy any changes you still need.</p>{backups?.map((backup, index) => <div key={index}><b>Backup {index + 1}</b>{backup.files.map((file) => <div key={file.path}><b>{file.path}</b><pre>{file.content}</pre></div>)}</div>)}</details>}
          {Boolean(codeToCopy.length) && <details className="module-before-sample"><summary>Code from this module</summary><p>Copy code copies only the code, not the file name. Paste it into your own file with Ctrl+V, then change it for your project.</p>
            {codeToCopy.map((code, index) => <div key={index}><b>{code.label}</b> <button type="button" onClick={() => void copyText(code.content).then(() => { setCopied(index); setError(""); }, () => setError("Could not copy. Select the code and press Ctrl+C instead."))}>{copied === index ? "Copied" : "Copy code"}</button><pre>{code.content}</pre></div>)}
          </details>}
          {error && <p className="module-error" role="alert">{error}</p>}
        </div>
        {personal && !review && <p role="status">{successfulFiles === JSON.stringify(files) ? "Run succeeded — ready to submit this version." : "Run the current files successfully before submitting."} Submission records progress, not a grade or teacher approval.</p>}
        {!personal && !teacherChecked && <ModuleRunFeedback result={lastCheck} completed={completed} pendingSample={pendingSample} expectedError={web ? undefined : step?.expectedError} />}
        {web ? <>
          <JavaRunProgress message={runMessage} />
          {personal ? webResult?.error && <p className="module-error" role="alert">{webResult.error}</p>
            : <WebCheckList result={webResult} expected={pendingSample ? step?.expectedOutput ?? "" : activity.expectedOutput} teacherChecked={teacherChecked}
              webChecks={pendingSample || !step?.activity?.id ? step?.webChecks : undefined} mediaChecks={hasMedia ? step?.mediaChecks ?? [] : undefined} />}
          <div className="module-web-preview">{webPage.view ?? <p className="web-preview-empty"><span>Press <b>Run code</b> to see your page here.</span></p>}</div>
        </> : <>
          <JavaRunnerBrand />
          <JavaRunProgress message={runMessage} waiting={javaConsole.waiting} />
          <div className="console" aria-busy={Boolean(runMessage) && !javaConsole.waiting}><b>Actual output</b><pre aria-label="Program output">{output}</pre>
            {javaConsole.waiting && <small role="status">Waiting for input — press Enter to send</small>}
            {javaConsole.active && <button type="button" className="run-button" onClick={javaConsole.stop}>Stop</button>}
          </div>
        </>}
      </aside>
    </div>
    <footer className="actionbar">
      <div><span className="sync" aria-live="polite">{status}</span><button type="button" disabled={busy} onClick={async () => { try { await save(); onClose(); } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Could not save"); } }}>Return to class project</button></div>
      <div>{personal && !review && <button type="button" className="run-button" disabled={busy || successfulFiles !== JSON.stringify(files)} onClick={() => void submit()}>Submit this version</button>}<button type="button" className="run-button" disabled={busy || !deviceReady || Boolean(error && error.startsWith("Device storage is unavailable"))} onClick={() => void run()}>{busy ? "Working…" : "▶ Run code"}<kbd>Ctrl ↵</kbd></button>{!review && <button type="button" className={personal ? `run-button save-${saveColour}` : "run-button"} disabled={busy || !deviceReady || Boolean(error && error.startsWith("Device storage is unavailable"))} onClick={() => void saveWork()}>Save work</button>}</div>
    </footer>
    <RunBox message={javaConsole.running ? null : runMessage} onCancel={javaConsole.active ? () => { javaConsole.stop(); setRunMessage(null); } : undefined} />
    <NoticeBox notice={notice} onClose={() => setNotice(null)} />
    {addingFile && <div className="activity-overlay file-dialog-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) closeAddFile(); }}>
      <form className="file-dialog" onSubmit={addFile} onKeyDown={(event) => { if (event.key === "Escape") closeAddFile(); }}>
        <header><span className="java-icon">{web ? "W" : "J"}</span><div><span className="eyebrow">{web ? "WEB PAGE FILE" : "JAVA SOURCE FILE"}</span><h2>Create a new file</h2><p>{web ? "Add another page, stylesheet, or script." : "Add another class to this project."}</p></div><button type="button" onClick={closeAddFile} aria-label="Close">×</button></header>
        <label>File path<input autoFocus required spellCheck={false} value={newPath} onChange={(event) => setNewPath(event.target.value)} placeholder={web ? "about.html" : "Helper.java"} /></label>
        <small className={fileError ? "module-error" : undefined} role={fileError ? "alert" : undefined}>{fileError || (web ? <>Use a unique filename, for example <b>about.html</b>.</> : <>Use a unique Java filename, for example <b>Helper.java</b>.</>)}</small>
        <footer><button type="button" onClick={closeAddFile}>Cancel</button><button className="create-file-button" disabled={busy || !newPath.trim()}>Create file</button></footer>
      </form>
    </div>}
  </>;
}
