"use client";

// Existing module routes supply the catalog, worksheet, progress and teacher availability.
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./apiClient";
import { groupModuleParts, modulePartPages } from "./moduleParts";
import ModuleCatalogCard from "./ModuleCatalogCard";

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
export type StepBlock = {
  part?: string;
  type: "step";
  id: string;
  number: number;
  instruction: string;
  language: string;
  files: ModuleFile[];
  expectedOutput: string;
  checkYourself?: string;
};
type OtherBlock = { type: string; markdown?: string; term?: string; columns?: string[]; rows?: string[][] | { see: string; means: string; fix: string }[]; message?: string };
export type Block = StepBlock | OtherBlock;
export type Lesson = {
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
  presentationOutline?: string[];
  questionsToPrepare?: string[];
  rubric?: { criterion: string; points: number }[];
  totalPoints: number;
};
type Availability = { openLessonIds: string[]; performanceTaskOpen: boolean };
type AvailabilityChange = { target: "lesson"; lessonId: string; open: boolean } | { target: "performance-task"; open: boolean };
export type CourseModule = { continues?: string; id: string; title: string; week: number; course: string; lessons: Lesson[]; performanceTask?: PerformanceTask; closedPerformanceTask?: { title: string }; availability: Availability };
type ModuleSummary = { moduleId: string; title: string; week: number; course: string; updatedAt: string; isActive?: boolean; locked?: boolean };
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

type Props = { role: "teacher" | "student"; classroomId: string; initialModuleId?: string; embedded?: boolean; drawer?: boolean; active?: boolean; worksheet?: boolean; onOpenModule?: (id: string) => void; onClose?: () => void };

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

export function ModulePaperBlock({ block }: { block: OtherBlock }) {
  const rows = block.type === "errorGuide" ? block.rows as { see: string; means: string; fix: string }[] : undefined;
  const columns = rows ? ["If you see", "It means", "Fix"] : block.columns;
  const cells = rows ? rows.map((row) => [row.see, row.means, row.fix]) : block.rows as string[][] | undefined;
  return <div className={`module-text-block paper-${block.type}`}>
    {(block.type === "analogy" || block.type === "note" || block.type === "errorGuide") && <b className="paper-label">{block.type === "errorGuide" ? "Error guide" : block.type === "analogy" ? "Analogy" : "Check yourself"}</b>}
    {block.term && <b>{block.term}: </b>}
    {block.markdown && <Markdown markdown={block.markdown} />}
    {columns && cells && <div className="paper-table-scroll"><table><thead><tr>{columns.map((column, index) => <th key={index}>{column}</th>)}</tr></thead><tbody>{cells.map((row, index) => <tr key={index}>{row.map((cell, index) => <td key={index}>{renderInline(cell, String(index))}</td>)}</tr>)}</tbody></table></div>}
    {block.message && <pre className="printed-output">{block.message}</pre>}
  </div>;
}

function StepView({
  step, classroomId, moduleId, status, onChecked, role, printed = false,
}: { printed?: boolean; step: StepBlock; classroomId: string; moduleId: string; status?: StepStatus; onChecked: (progress: Progress) => void; role: "teacher" | "student" }) {
  const [files, setFiles] = useState(step.files);
  const [practising, setPractising] = useState(false);
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
      {printed && <div className="printed-sample">{step.files.map((file) => <div key={file.path}><small>{file.path}</small><pre><code>{file.content}</code></pre></div>)}</div>}
      {printed && <><b>Output (expected):</b><pre className="printed-output">{step.expectedOutput}</pre><button type="button" className="worksheet-practise" aria-expanded={practising} onClick={() => setPractising(!practising)}>{practising ? "Hide practice editor" : "Practise this step"}</button></>}
      <div hidden={printed && !practising} className="module-practice">
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
      </div>
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

export function ModuleContent({ module, classroomId, role, onAvailabilityChanged, paged = false, worksheet = false }: { worksheet?: boolean; paged?: boolean; module: CourseModule; classroomId: string; role: "teacher" | "student"; onAvailabilityChanged: (availability: Availability) => void }) {
  const [progress, setProgress] = useState<Progress | null>(role === "teacher" ? emptyProgress(module.id) : null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [lessonPage, setLessonPage] = useState(0);
  const [paperPage, setPaperPage] = useState(0);
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

  if (worksheet) {
    const parts = groupModuleParts(module);
    const pages = parts.flatMap((part) => modulePartPages(part).map((page) => ({
      ...page, part,
      label: page.step ? `${part.lessons.find((lesson) => lesson.blocks.some((block) => isStepBlock(block) && block.id === page.step?.id))?.dayLabel || "Lesson"} · Step ${page.step.number}` : "Overview",
    })));
    const hasTask = Boolean(module.performanceTask || module.closedPerformanceTask);
    const totalPages = pages.length + Number(hasTask);
    const currentPage = Math.min(paperPage, totalPages - 1);
    const current = pages[currentPage];
    const partDone = (part: typeof parts[number]) => !part.closed && part.blocks.filter(isStepBlock).every((step) => progress.stepStates[step.id] === "pass") && part.exitLessons.every((lesson) => progress.stepStates[lesson.exitSlip.id] === "pass");
    const taskDone = progress.performanceTask.sample?.status === "pass" && progress.performanceTask.own?.status === "pass";
    const completed = parts.filter(partDone).length + Number(hasTask && taskDone);
    return <div className="worksheet-content">
      {actionError && <p className="module-error" role="alert">{actionError}</p>}
      {role === "teacher" && <p className="module-preview-note">Teacher preview — running code does not save student progress.</p>}
      <div className="worksheet-progress">
        <div><span><small>MODULE PROGRESS</small>{role === "student" ? `${completed} of ${parts.length + Number(hasTask)} parts completed` : "Teacher preview"}</span>{role === "student" && <b>{progress.percent}%</b>}</div>
        {role === "student" && <progress aria-label="Module progress" value={progress.percent} max={100} />}
        <nav aria-label="Module parts" className="worksheet-parts">
          {parts.map((part, index) => <button key={part.id} type="button" aria-current={current?.part.id === part.id ? "step" : undefined} className={role === "student" && partDone(part) ? "part-done" : ""} onClick={() => setPaperPage(pages.findIndex((page) => page.part.id === part.id))}><i aria-hidden="true">{role === "student" && partDone(part) ? "✓" : part.closed ? "⊘" : index + 1}</i><span>{part.title}</span></button>)}
          {hasTask && <button type="button" aria-current={!current ? "step" : undefined} className={role === "student" && taskDone ? "part-done" : ""} onClick={() => setPaperPage(pages.length)}><i aria-hidden="true">{role === "student" && taskDone ? "✓" : "★"}</i><span>Performance task</span></button>}
        </nav>
      </div>
      {current && <nav className="worksheet-tabs" aria-label="Part pages">{pages.map((page, index) => page.part.id === current.part.id && <button key={index} type="button" aria-current={index === currentPage ? "page" : undefined} onClick={() => setPaperPage(index)}>{page.label}</button>)}</nav>}
      <div className="worksheet-desk">
        {pages.map((page, index) => <article key={`${page.part.id}:${page.step?.id || "overview"}`} className="worksheet-paper" hidden={currentPage !== index} aria-label={`${page.part.title} — ${page.label}`}>
          {!page.step && <>
            {index === 0 && <><header className="paper-title"><h2>Self-Paced Module: {module.title.replace(/^Self-Paced Module:\s*/i, "")}</h2><p>{module.course.toUpperCase()} · Week {module.week}{module.continues ? ` · Continues ${module.continues}` : ""}</p></header><table className="paper-schedule"><thead><tr><th>Day</th><th>Topic</th></tr></thead><tbody>{module.lessons.map((lesson) => <tr key={lesson.id}><td>{lesson.dayLabel}</td><td>{lesson.title}</td></tr>)}</tbody></table></>}
            <h3 className="paper-heading">{page.part.title}</h3>
            {role === "teacher" && page.part.lessons.map((lesson) => <label key={lesson.id} className="module-availability"><input type="checkbox" checked={module.availability.openLessonIds.includes(lesson.id)} disabled={savingAvailability} onChange={(event) => void changeAvailability({ target: "lesson", lessonId: lesson.id, open: event.target.checked })} />Open to students — {lesson.title}</label>)}
            {page.part.closed ? <p className="module-preview-note">Not open yet</p> : <>
              {page.blocks.map((block, index) => <ModulePaperBlock key={index} block={block as OtherBlock} />)}
              {page.part.blocks.filter(isStepBlock).length > 0 && <div className="paper-instructions"><b>Work through this part</b><p>Read the discussion, then open each step above. Type and run the sample code in its practice editor.</p></div>}
              {!page.part.blocks.some(isStepBlock) && page.part.exitLessons.map((lesson) => <div key={lesson.id} className="module-exit-slip"><b>LIPLET · {lesson.dayLabel || lesson.title}</b>{lesson.exitSlip.questions.map((question) => <p key={question.id}>{question.id}. {question.prompt}</p>)}{role === "student" && <label><input type="checkbox" checked={progress.stepStates[lesson.exitSlip.id] === "pass"} onChange={() => progress.stepStates[lesson.exitSlip.id] !== "pass" && markExitSlip(lesson.exitSlip.id)} />Mark exit slip done</label>}</div>)}
            </>}
          </>}
          {page.step && <><h3 className="paper-heading">{page.label}</h3><StepView printed step={page.step} classroomId={classroomId} moduleId={module.id} status={progress.stepStates[page.step.id]} onChecked={applyProgress} role={role} />{page.blocks.map((block, index) => <ModulePaperBlock key={index} block={block as OtherBlock} />)}{page.part.blocks.filter(isStepBlock).at(-1)?.id === page.step.id && page.part.exitLessons.map((lesson) => <div key={lesson.id} className="module-exit-slip"><b>LIPLET · {lesson.dayLabel || lesson.title}</b>{lesson.exitSlip.questions.map((question) => <p key={question.id}>{question.id}. {question.prompt}</p>)}{role === "student" && <label><input type="checkbox" checked={progress.stepStates[lesson.exitSlip.id] === "pass"} onChange={() => progress.stepStates[lesson.exitSlip.id] !== "pass" && markExitSlip(lesson.exitSlip.id)} />Mark exit slip done</label>}</div>)}</>}
        </article>)}
        {hasTask && <article className="worksheet-paper" hidden={currentPage !== pages.length} aria-label="Performance task">
          <h3 className="paper-heading">{module.performanceTask?.title || module.closedPerformanceTask?.title}</h3>
          {role === "teacher" && <label className="module-availability"><input type="checkbox" checked={module.availability.performanceTaskOpen} disabled={savingAvailability} onChange={(event) => void changeAvailability({ target: "performance-task", open: event.target.checked })} />Open to students</label>}
          {module.closedPerformanceTask && <p className="module-preview-note">Not open yet</p>}
          {module.performanceTask && <><Markdown markdown={module.performanceTask.markdown} /><ul>{module.performanceTask.checklist.map((item, index) => <li key={index}>{item}</li>)}</ul>
            <PerformanceTaskSlot label="Sample code" files={module.performanceTask.exampleFiles} classroomId={classroomId} moduleId={module.id} variant="sample" role={role} submitted={progress.performanceTask.sample?.status} onSubmitted={applyProgress} />
            <PerformanceTaskSlot label="Your own version" files={module.performanceTask.starterFiles} classroomId={classroomId} moduleId={module.id} variant="own" role={role} submitted={progress.performanceTask.own?.status} onSubmitted={applyProgress} />
            {module.performanceTask.presentationOutline?.length ? <><h3 className="paper-heading">Presentation</h3><ol>{module.performanceTask.presentationOutline.map((item, index) => <li key={index}>{item}</li>)}</ol></> : null}
            {module.performanceTask.questionsToPrepare?.length ? <><h3 className="paper-heading">Prepare for these questions</h3><ul>{module.performanceTask.questionsToPrepare.map((item, index) => <li key={index}>{item}</li>)}</ul></> : null}
            {module.performanceTask.rubric?.length ? <ModulePaperBlock block={{ type: "table", columns: ["Criterion", "Points"], rows: module.performanceTask.rubric.map((row) => [row.criterion, String(row.points)]) }} /> : null}
          </>}
        </article>}
      </div>
      <footer className="worksheet-pagination"><button type="button" disabled={currentPage === 0} onClick={() => setPaperPage(currentPage - 1)}>← Previous page</button><span aria-live="polite">Page {currentPage + 1} of {totalPages}</span><button type="button" disabled={currentPage === totalPages - 1} onClick={() => setPaperPage(currentPage + 1)}>Next page →</button></footer>
    </div>;
  }

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
      {paged && <nav className="module-parts" aria-label="Module lessons">
        {module.lessons.map((lesson, index) => {
          const done = !lesson.closed && progress.stepStates[lesson.exitSlip.id] === "pass" && lesson.blocks.filter(isStepBlock).every((step) => progress.stepStates[step.id] === "pass");
          return <button key={lesson.id} type="button" aria-current={lessonPage === index ? "step" : undefined} onClick={() => setLessonPage(index)} className={done ? "part-done" : ""}><i aria-hidden="true">{done ? "✓" : lesson.closed ? "⊘" : index + 1}</i><span>{lesson.title}</span></button>;
        })}
        {(module.performanceTask || module.closedPerformanceTask) && <button type="button" aria-current={lessonPage === module.lessons.length ? "step" : undefined} onClick={() => setLessonPage(module.lessons.length)}><i aria-hidden="true">★</i><span>Performance task</span></button>}
      </nav>}
      {module.lessons.map((lesson, index) => (
        <section key={lesson.id} className="module-lesson" hidden={paged && index !== lessonPage}>
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
              <ModulePaperBlock key={index} block={block} />
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
        <section className="module-lesson" hidden={paged && lessonPage !== module.lessons.length}>
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
        <section className="module-lesson" hidden={paged && lessonPage !== module.lessons.length}><h3>{module.closedPerformanceTask.title}</h3><p className="module-preview-note">Not open yet</p></section>
      )}
    </div>
  );
}

export default function ModuleViewer({ role, classroomId, initialModuleId, embedded = false, drawer = false, active = true, worksheet = false, onOpenModule, onClose }: Props) {
  const [modules, setModules] = useState<ModuleSummary[] | null>(null);
  const [selected, setSelected] = useState<CourseModule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [summaries, setSummaries] = useState<Record<string, number>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  const openModule = useCallback((moduleId: string) => {
    if (onOpenModule) { onOpenModule(moduleId); return; }
    setError(null);
    api<CourseModule>(`/api/classrooms/${classroomId}/modules/${moduleId}`)
      .then(setSelected)
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load module"));
  }, [classroomId, onOpenModule]);

  const refreshList = useCallback(() => {
    api<ModuleSummary[]>(`/api/classrooms/${classroomId}/modules`)
      .then((list) => {
        setModules(list);
        // Jumping in from the landing page's module cards (app/Landing.tsx): open straight to
        // that module instead of showing the list first.
        if (initialModuleId) openModule(initialModuleId);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load modules"));
  }, [classroomId, initialModuleId, openModule]);

  useEffect(() => { if (!drawer) refreshList(); }, [drawer, refreshList]);

  useEffect(() => {
    if (!drawer || !active) return;
    let cancelled = false;
    Promise.all([
      api<ModuleSummary[]>(`/api/classrooms/${classroomId}/modules`),
      role === "student" ? api<{ moduleId: string; percent: number }[]>(`/api/classrooms/${classroomId}/modules/summary`) : Promise.resolve([]),
    ]).then(([list, progress]) => {
      if (cancelled) return;
      setError(null);
      setModules(list);
      setSummaries(Object.fromEntries(progress.map((item) => [item.moduleId, item.percent])));
    }).catch((loadError) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Could not load modules"); });
    return () => { cancelled = true; };
  }, [drawer, active, classroomId, role]);

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
            <span className="eyebrow">{drawer ? selected ? "MODULE LESSON" : "YOUR LEARNING" : "MODULES"}</span>
            <h2>{selected ? selected.title : drawer ? "Your learning modules" : "Modules"}</h2>
            {worksheet && selected && modules?.some((item) => item.moduleId === selected.id && item.isActive) && <small className="worksheet-weekly">LESSON OF THE WEEK</small>}
            {drawer && !selected && <p>Continue a lesson or revisit what you’ve learned.</p>}
          </div>
          {embedded ? (
            selected && <button type="button" onClick={() => worksheet || (initialModuleId && onClose) ? onClose?.() : setSelected(null)}>{worksheet ? "← All modules" : "Back to modules"}</button>
          ) : (
            <button type="button" onClick={() => selected && !initialModuleId ? setSelected(null) : onClose?.()} aria-label={selected && !initialModuleId ? "Back to modules" : "Close"}>×</button>
          )}
        </header>
        {error && <p className="module-error">{error}</p>}
        {!selected && (
          <div className="module-list">
            {drawer && modules && role === "student" && <div className="catalog-progress"><span>{Object.values(summaries).filter((percent) => percent === 100).length} / {modules.length}</span> modules completed</div>}
            {role === "teacher" && embedded && !drawer && (
              <div className="module-upload">
                <label>Upload module
                <input ref={fileInput} type="file" accept=".json" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} disabled={uploading} />
                </label>
                {uploading && <small>Uploading…</small>}
              </div>
            )}
            {modules === null && <p>Loading…</p>}
            {modules?.length === 0 && <p>No module uploaded for this class yet.</p>}
            {(drawer ? modules?.toSorted((a, b) => Number(Boolean(b.isActive)) - Number(Boolean(a.isActive)) || b.week - a.week) : modules)?.map((module) => (
              <div key={module.moduleId} className={`module-list-row${drawer ? " module-catalog-card" : ""}${drawer && module.isActive ? " module-weekly-card" : ""}`}>
                {drawer ? <ModuleCatalogCard module={module} percent={summaries[module.moduleId] ?? 0} role={role} onOpen={() => openModule(module.moduleId)} /> : <button type="button" onClick={() => openModule(module.moduleId)}>Week {module.week} — {module.title}</button>}
                {role === "teacher" && embedded && !drawer && <button type="button" className="danger-button" onClick={() => removeModule(module.moduleId)}>Delete</button>}
              </div>
            ))}
          </div>
        )}
        {selected && <ModuleContent key={selected.id} worksheet={worksheet} paged={drawer} module={selected} classroomId={classroomId} role={role} onAvailabilityChanged={(availability) => setSelected((current) => current && { ...current, availability })} />}
    </>
  );

  if (embedded) return <div className={`activity-modal class-module-panel${drawer ? " drawer-module-viewer" : ""}${worksheet ? " printed-module-viewer" : ""}`}>{content}</div>;
  return (
    <div className="activity-overlay" onClick={(event) => event.target === event.currentTarget && onClose?.()}>
      <div className="activity-modal module-viewer-modal">{content}</div>
    </div>
  );
}
