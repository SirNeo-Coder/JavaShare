"use client";

// Stage two: shows a weekly course module (docs/course-format.md) to a student, with a goal
// meter, a per-step checklist (auto-checked for Java steps by running the code and comparing to
// expectedOutput), and the performance task's two tracked submissions (sample code, own
// version). A teacher can upload a module here too. v1 renders "text" and "step" blocks plus the
// exit slip and performance task; other block types fall back to plain text.
import { useEffect, useRef, useState } from "react";
import { api } from "./apiClient";

// CodeEditor (the full syntax-highlighted editor) renders invisible text when there are many
// small instances nested inside this scrollable modal - confirmed in the browser (DOM and
// computed styles are correct; it never paints). It's built for one full-height instance, not
// many small ones, so a plain textarea is used here instead: simpler, and it reliably renders.
function SimpleCodeEditor({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <textarea className="module-code-textarea" value={value} onChange={(event) => onChange(event.target.value)} spellCheck={false} />;
}

// Shared by StepView and PerformanceTaskSlot, which otherwise duplicated this almost verbatim.
function ModuleFileEditors({ files, onChange }: { files: ModuleFile[]; onChange: (index: number, value: string) => void }) {
  return (
    <>
      {files.map((file, index) => (
        <div key={file.path} className="module-step-file">
          <small>{file.path}</small>
          <SimpleCodeEditor value={file.content} onChange={(value) => onChange(index, value)} />
        </div>
      ))}
    </>
  );
}

async function runFiles(files: ModuleFile[]) {
  const result = await api<{ mode: string; output: string }>("/api/execute", { method: "POST", body: JSON.stringify({ files, stdin: "" }) });
  return result.output;
}

type ModuleFile = { path: string; content: string };
type StepBlock = {
  type: "step";
  id: string;
  number: number;
  instruction: string;
  language: string;
  files: ModuleFile[];
  expectedOutput: string;
  checkYourself?: string;
};
type OtherBlock = { type: string; markdown?: string; term?: string };
type Block = StepBlock | OtherBlock;
type Lesson = {
  id: string;
  closed?: boolean;
  order: number;
  dayLabel: string;
  title: string;
  blocks: Block[];
  exitSlip: { id: string; points: number; questions: { id: string; kind: string; points: number; prompt: string }[] };
};
type PerformanceTask = {
  id: string;
  title: string;
  markdown: string;
  checklist: string[];
  exampleFiles: ModuleFile[];
  starterFiles: ModuleFile[];
  totalPoints: number;
};
type Availability = { openLessonIds: string[]; performanceTaskOpen: boolean };
type AvailabilityChange = { target: "lesson"; lessonId: string; open: boolean } | { target: "performance-task"; open: boolean };
type CourseModule = { id: string; title: string; week: number; course: string; lessons: Lesson[]; performanceTask?: PerformanceTask; closedPerformanceTask?: { title: string }; availability: Availability };
type ModuleSummary = { moduleId: string; title: string; week: number; course: string; updatedAt: string };
type StepStatus = "pass" | "fail";
type Progress = {
  moduleId: string;
  percent: number;
  updatedAt: string;
  // Covers both step blocks and a lesson's exitSlip, keyed by whichever's own "id" - one flag
  // per module couldn't tell lessons apart (CKB-007).
  stepStates: Record<string, StepStatus>;
  performanceTask: Partial<Record<"sample" | "own", { status: StepStatus }>>;
};

type Props = { role: "teacher" | "student"; classroomId: string; initialModuleId?: string; embedded?: boolean; onClose?: () => void };

function isStepBlock(block: Block): block is StepBlock {
  return block.type === "step";
}

// docs/course-format.md's markdown subset only: **bold**, *italic*, `code`, [text](link), "- "
// bullets, blank lines between paragraphs. No HTML, so this never uses dangerouslySetInnerHTML.
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return parts.filter(Boolean).map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith("**") && part.endsWith("**")) return <b key={key}>{part.slice(2, -2)}</b>;
    if (part.startsWith("*") && part.endsWith("*")) return <i key={key}>{part.slice(1, -1)}</i>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={key}>{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) return <a key={key} href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a>;
    return <span key={key}>{part}</span>;
  });
}

function Markdown({ markdown }: { markdown: string }) {
  const paragraphs = markdown.split(/\n{2,}/);
  return (
    <>
      {paragraphs.map((paragraph, pIndex) => {
        const lines = paragraph.split("\n").filter((line) => line.trim().length > 0);
        if (lines.every((line) => line.trim().startsWith("- "))) {
          return (
            <ul key={pIndex}>
              {lines.map((line, lIndex) => <li key={lIndex}>{renderInline(line.trim().slice(2), `${pIndex}-${lIndex}`)}</li>)}
            </ul>
          );
        }
        return <p key={pIndex}>{renderInline(paragraph, `${pIndex}`)}</p>;
      })}
    </>
  );
}

function StepView({
  step, classroomId, moduleId, status, onChecked, role,
}: { step: StepBlock; classroomId: string; moduleId: string; status?: StepStatus; onChecked: (progress: Progress) => void; role: "teacher" | "student" }) {
  const [files, setFiles] = useState(step.files);
  const [output, setOutput] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const canRun = step.language === "java";
  // A teacher previewing a module has no progress of their own to save (module_progress is
  // student-only) - they can still run a Java step to check it works, but nothing is persisted.
  const canSaveProgress = role === "student";

  // Saving the step's result is a separate try/catch from running it: a save failure must not
  // overwrite the real program output that already printed above it.
  const saveStepResult = async (status: StepStatus) => {
    try {
      const updated = await api<Progress>(`/api/classrooms/${classroomId}/modules/${moduleId}/progress/step`, { method: "PUT", body: JSON.stringify({ stepId: step.id, status }) });
      onChecked(updated);
    } catch (saveError) {
      setOutput((current) => `${current ?? ""}\n\n(Could not save this result: ${saveError instanceof Error ? saveError.message : "try again"})`);
    }
  };

  const run = async () => {
    setRunning(true);
    try {
      if (canRun) {
        const result = await runFiles(files);
        setOutput(result);
        if (canSaveProgress) await saveStepResult(result.trim() === step.expectedOutput.trim() ? "pass" : "fail");
      } else if (canSaveProgress) {
        await saveStepResult("pass");
      }
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "Could not run this step");
    } finally {
      setRunning(false);
    }
  };

  const showActions = canRun || canSaveProgress;

  return (
    <div className="module-step">
      <div className="module-step-head">
        <b>Step {step.number}</b>
        {status && <span className={`status-chip ${status === "pass" ? "done" : ""}`}>{status === "pass" ? "Passed" : "Try again"}</span>}
      </div>
      <Markdown markdown={step.instruction} />
      <ModuleFileEditors
        files={files}
        onChange={(index, value) => setFiles((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, content: value } : item)))}
      />
      {showActions && (
        <div className="module-step-actions">
          <button type="button" onClick={run} disabled={running}>
            {running ? "Running…" : canRun ? (canSaveProgress ? "Run & check" : "Run") : "Mark done"}
          </button>
          {!canRun && canSaveProgress && <small>This language runs in your own project — run it there, then mark this step done.</small>}
        </div>
      )}
      {output !== null && <pre className="module-step-output">{output}</pre>}
      {step.checkYourself && <div className="module-check-yourself"><Markdown markdown={step.checkYourself} /></div>}
    </div>
  );
}

function PerformanceTaskSlot({
  label, files: initialFiles, classroomId, moduleId, variant, submitted, onSubmitted, role,
}: {
  label: string; files: ModuleFile[]; classroomId: string; moduleId: string; variant: "sample" | "own";
  submitted?: StepStatus; onSubmitted: (progress: Progress) => void; role: "teacher" | "student";
}) {
  const [files, setFiles] = useState(initialFiles);
  const [output, setOutput] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const canRun = files.some((file) => file.path.endsWith(".java"));

  const runIt = async () => {
    setBusy(true);
    try {
      setOutput(await runFiles(files));
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "Could not run this");
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      const updated = await api<Progress>(`/api/classrooms/${classroomId}/modules/${moduleId}/progress/performance-task`, { method: "PUT", body: JSON.stringify({ variant, files, status: "pass" }) });
      onSubmitted(updated);
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "Could not submit this version");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="module-step">
      <div className="module-step-head">
        <b>{label}</b>
        {submitted && <span className="status-chip done">Submitted</span>}
      </div>
      <ModuleFileEditors
        files={files}
        onChange={(index, value) => setFiles((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, content: value } : item)))}
      />
      <div className="module-step-actions">
        {canRun && <button type="button" onClick={runIt} disabled={busy}>{busy ? "Running…" : "Run"}</button>}
        {role === "student" && <button type="button" onClick={submit} disabled={busy}>{busy ? "Submitting…" : "Submit this version"}</button>}
      </div>
      {output !== null && <pre className="module-step-output">{output}</pre>}
    </div>
  );
}

// module_progress is student-only (backend/src/supabase-repository.ts: getSupabaseModuleProgress
// throws 403 for a teacher). A teacher previewing a module has no progress to load, so this never
// fetches it for them - an empty stub keeps the rendering below (stepStates/performanceTask
// lookups) uniform, and role flags below hide anything progress-dependent (goal meter, checkboxes,
// submit buttons, status chips) for that role.
const emptyProgress = (moduleId: string): Progress => ({ moduleId, stepStates: {}, performanceTask: {}, percent: 0, updatedAt: "" });

function ModuleContent({ module, classroomId, role, onAvailabilityChanged }: { module: CourseModule; classroomId: string; role: "teacher" | "student"; onAvailabilityChanged: (availability: Availability) => void }) {
  const [progress, setProgress] = useState<Progress | null>(role === "teacher" ? emptyProgress(module.id) : null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const applyProgress = (updated: Progress) => setProgress((current) => !current || updated.updatedAt >= current.updatedAt ? updated : current);

  useEffect(() => {
    if (role !== "student") return;
    let active = true;
    api<Progress>(`/api/classrooms/${classroomId}/modules/${module.id}/progress`)
      .then((loaded) => { if (active) setProgress(loaded); })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Could not load progress"); });
    return () => { active = false; };
  }, [classroomId, module.id, role]);

  if (error) return <p className="module-error">{error}</p>;
  if (!progress) return <p>Loading your progress…</p>;

  const markExitSlip = async (exitSlipId: string) => {
    try {
      const updated = await api<Progress>(`/api/classrooms/${classroomId}/modules/${module.id}/progress/step`, { method: "PUT", body: JSON.stringify({ stepId: exitSlipId, status: "pass" }) });
      applyProgress(updated);
    } catch (markError) {
      setActionError(markError instanceof Error ? markError.message : "Could not mark the exit slip done");
    }
  };

  const changeAvailability = async (change: AvailabilityChange) => {
    setSavingAvailability(true);
    setActionError(null);
    try {
      const availability = await api<Availability>(`/api/classrooms/${classroomId}/modules/${module.id}/availability`, { method: "PATCH", body: JSON.stringify(change) });
      onAvailabilityChanged(availability);
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : "Could not save lesson availability");
    } finally { setSavingAvailability(false); }
  };

  return (
    <div className="module-content">
      {actionError && <p className="module-error">{actionError}</p>}
      {role === "teacher" && <p className="module-preview-note">Teacher preview — running code does not save student progress. Availability switches are saved for this class.</p>}
      {role === "student" && (
        <div className="activity-progress module-goal-meter">
          <div><span>Module progress</span><b>{progress.percent}%</b></div>
          <i><span style={{ width: `${progress.percent}%` }} /></i>
        </div>
      )}
      {module.lessons.map((lesson) => (
        <section key={lesson.id} className="module-lesson">
          <h3>{lesson.dayLabel ? `${lesson.dayLabel} — ${lesson.title}` : lesson.title}</h3>
          {role === "teacher" && (
            <label className="module-availability">
              <input type="checkbox" checked={module.availability.openLessonIds.includes(lesson.id)} disabled={savingAvailability} onChange={(event) => void changeAvailability({ target: "lesson", lessonId: lesson.id, open: event.target.checked })} />
              Open to students
            </label>
          )}
          {lesson.closed ? <p className="module-preview-note">Not open yet</p> : <>
          {lesson.blocks.map((block, index) =>
            isStepBlock(block) ? (
              <StepView
                key={block.id}
                step={block}
                classroomId={classroomId}
                moduleId={module.id}
                status={progress.stepStates[block.id]}
                onChecked={applyProgress}
                role={role}
              />
            ) : (
              <div key={index} className="module-text-block">
                {block.term && <b>{block.term}: </b>}
                {block.markdown && <Markdown markdown={block.markdown} />}
              </div>
            ),
          )}
          <div className="module-exit-slip">
            <b>Exit slip</b>
            {lesson.exitSlip.questions.map((question) => <p key={question.id}>{question.id}. {question.prompt}</p>)}
            {role === "student" && (
              <label>
                <input
                  type="checkbox"
                  checked={progress.stepStates[lesson.exitSlip.id] === "pass"}
                  onChange={() => progress.stepStates[lesson.exitSlip.id] !== "pass" && markExitSlip(lesson.exitSlip.id)}
                />
                Mark exit slip done
              </label>
            )}
          </div>
          </>}
        </section>
      ))}
      {module.performanceTask && (
        <section className="module-lesson">
          <h3>{module.performanceTask.title}</h3>
          {role === "teacher" && (
            <label className="module-availability">
              <input type="checkbox" checked={module.availability.performanceTaskOpen} disabled={savingAvailability} onChange={(event) => void changeAvailability({ target: "performance-task", open: event.target.checked })} />
              Open to students
            </label>
          )}
          <Markdown markdown={module.performanceTask.markdown} />
          <ul>{module.performanceTask.checklist.map((item, index) => <li key={index}>{item}</li>)}</ul>
          <PerformanceTaskSlot
            label="Sample code" files={module.performanceTask.exampleFiles} classroomId={classroomId} moduleId={module.id} variant="sample" role={role}
            submitted={progress.performanceTask.sample?.status}
            onSubmitted={applyProgress}
          />
          <PerformanceTaskSlot
            label="Your own version" files={module.performanceTask.starterFiles} classroomId={classroomId} moduleId={module.id} variant="own" role={role}
            submitted={progress.performanceTask.own?.status}
            onSubmitted={applyProgress}
          />
        </section>
      )}
      {module.closedPerformanceTask && (
        <section className="module-lesson"><h3>{module.closedPerformanceTask.title}</h3><p className="module-preview-note">Not open yet</p></section>
      )}
    </div>
  );
}

export default function ModuleViewer({ role, classroomId, initialModuleId, embedded = false, onClose }: Props) {
  const [modules, setModules] = useState<ModuleSummary[] | null>(null);
  const [selected, setSelected] = useState<CourseModule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const openModule = (moduleId: string) => {
    setError(null);
    api<CourseModule>(`/api/classrooms/${classroomId}/modules/${moduleId}`)
      .then(setSelected)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load module"));
  };

  const refreshList = () => {
    api<ModuleSummary[]>(`/api/classrooms/${classroomId}/modules`)
      .then((list) => {
        setModules(list);
        // Jumping in from the landing page's module cards (app/Landing.tsx): open straight to
        // that module instead of showing the list first.
        if (initialModuleId) openModule(initialModuleId);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load modules"));
  };

  useEffect(refreshList, [classroomId]);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const content = JSON.parse(await file.text());
      await api(`/api/classrooms/${classroomId}/modules`, { method: "POST", body: JSON.stringify(content) });
      refreshList();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Could not upload this file");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const removeModule = async (moduleId: string) => {
    try {
      await api(`/api/classrooms/${classroomId}/modules/${moduleId}`, { method: "DELETE" });
      if (selected?.id === moduleId) setSelected(null);
      refreshList();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Could not delete this module");
    }
  };

  const content = (
    <>
        <header>
          <div>
            <span className="eyebrow">MODULES</span>
            <h2>{selected ? selected.title : "Modules"}</h2>
          </div>
          {embedded ? (
            selected && <button type="button" onClick={() => setSelected(null)}>Back to modules</button>
          ) : (
            <button type="button" onClick={() => selected && !initialModuleId ? setSelected(null) : onClose?.()} aria-label={selected && !initialModuleId ? "Back to modules" : "Close"}>×</button>
          )}
        </header>
        {error && <p className="module-error">{error}</p>}
        {!selected && (
          <div className="module-list">
            {role === "teacher" && embedded && (
              <div className="module-upload">
                <label>Upload module
                <input ref={fileInput} type="file" accept=".json" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} disabled={uploading} />
                </label>
                {uploading && <small>Uploading…</small>}
              </div>
            )}
            {modules === null && <p>Loading…</p>}
            {modules?.length === 0 && <p>No module uploaded for this class yet.</p>}
            {modules?.map((module) => (
              <div key={module.moduleId} className="module-list-row">
                <button type="button" onClick={() => openModule(module.moduleId)}>
                  Week {module.week} — {module.title}
                </button>
                {role === "teacher" && embedded && <button type="button" className="danger-button" onClick={() => removeModule(module.moduleId)}>Delete</button>}
              </div>
            ))}
          </div>
        )}
        {selected && <ModuleContent key={selected.id} module={selected} classroomId={classroomId} role={role} onAvailabilityChanged={(availability) => setSelected((current) => current && { ...current, availability })} />}
    </>
  );

  if (embedded) return <div className="activity-modal class-module-panel">{content}</div>;
  return (
    <div className="activity-overlay" onClick={(event) => event.target === event.currentTarget && onClose?.()}>
      <div className="activity-modal module-viewer-modal">{content}</div>
    </div>
  );
}
