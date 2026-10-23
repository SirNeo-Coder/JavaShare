"use client";

// Existing module routes supply the catalog, worksheet, progress and teacher availability.
import ModuleSharing from "./ModuleSharing";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "./apiClient";
import ModuleAccessNotice from "./ModuleAccessNotice";
import type { ModuleAccessBlock } from "../backend/src/module-prerequisites";
import { runJava } from "./javaExecution";
import JavaRunnerBrand from "./JavaRunnerBrand";
import { groupModuleParts, modulePartPages, moduleResumeStep } from "./moduleParts";
import { paperPerformanceTask } from "../backend/src/personal-performance";
import { activityStateId } from "../backend/src/module-activities";
import ModuleCatalogCard from "./ModuleCatalogCard";
import { isFreshDeviceRecord, moduleRecordKey, readDeviceRecord, writeDeviceRecord } from "./moduleDeviceStore";

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

async function runFiles(files: ModuleFile[], stdin = "") {
  const result = await runJava(files, stdin);
  return result.output;
}

export type ModuleFile = { path: string; content: string };
export type StepBlock = {
  locked?: boolean;
  activity?: { id?: string; instruction: string; files: ModuleFile[]; expectedOutput: string; stdin?: string };
  part?: string;
  type: "step";
  id: string;
  number: number;
  instruction: string;
  language: string;
  files: ModuleFile[];
  expectedOutput: string;
  expectedError?: string;
  stdin?: string;
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
export type CourseModule = { moduleVersion?: string; continues?: string; sampleFirst?: boolean; id: string; title: string; week: number; course: string; lessons: Lesson[]; performanceTask?: PerformanceTask; closedPerformanceTask?: { title: string }; availability: Availability };
type ModuleSummary = { moduleId: string; title: string; week: number; course: string; updatedAt: string; isActive?: boolean; locked?: boolean; moduleAccess?: ModuleAccessBlock };
export function sortModuleCatalog(modules: ModuleSummary[], summaries: Record<string, number>) {
  return modules.toSorted((a, b) =>
    Number(summaries[a.moduleId] === 100) - Number(summaries[b.moduleId] === 100) || a.week - b.week);
}

type StepStatus = "pass" | "fail";
export type Progress = {
  moduleId: string;
  projectFiles: ModuleFile[];
  performanceProjectFiles: ModuleFile[];
  percent: number;
  updatedAt: string;
  moduleVersion?: string;
  activityProjects?: import("../backend/src/module-activities").ActivityProjects;
  // Covers both step blocks and a lesson's exitSlip, keyed by whichever's own "id" - one flag
  // per module couldn't tell lessons apart (CKB-007).
  stepStates: Record<string, StepStatus>;
  performanceTask: Partial<Record<"sample" | "own", { status: StepStatus }>>;
};

type Props = { studentId?: string; onStartActivity?: (module: CourseModule, step?: StepBlock) => Promise<void>; progressRevision?: number; role: "teacher" | "student"; classroomId: string; initialModuleId?: string; embedded?: boolean; drawer?: boolean; active?: boolean; worksheet?: boolean; onOpenModule?: (id: string) => void; onClose?: () => void };

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

function StepView({ step, status, role, printed = false, sampleFirst = false, onStart }: {
  step: StepBlock; status?: StepStatus; role: "teacher" | "student"; printed?: boolean; sampleFirst?: boolean; onStart?: () => Promise<void>; paper?: boolean;
}) {
  const [files, setFiles] = useState(step.files);
  const [output, setOutput] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try { if (role === "student") await onStart?.(); else setOutput(await runFiles(files, step.stdin ?? "")); }
    catch (error) { setOutput(error instanceof Error ? error.message : "Could not open this activity"); }
    finally { setBusy(false); }
  };
  const task = step.activity?.id ? step.activity : null;
  if (step.locked) return <p className="module-preview-note">Complete the previous activity to unlock this step.</p>;
  return <div className="module-step">
    <div className="module-step-head"><b>Step {step.number}</b>{status && <span className={`status-chip ${status === "pass" ? "done" : ""}`}>{status === "pass" ? "Completed" : "Try again"}</span>}</div>
    <Markdown markdown={step.instruction} />
    {task && <b>Sample code</b>}
    <div className="printed-sample">{step.files.map((file) => <div key={file.path}><small>{file.path}</small><pre><code>{file.content}</code></pre></div>)}</div>
    <b>{task ? "Sample output" : "Output (expected):"}</b><pre className="printed-output">{step.expectedOutput}</pre>
    {task && <div className="paper-instructions"><b>Your task</b><Markdown markdown={task.instruction} /><b>Expected task output</b><pre className="printed-output">{task.expectedOutput}</pre></div>}
    {role === "student" && <div className="paper-instructions">
      <p>{task && sampleFirst ? "Work in code editor loads this step's sample on first opening. Run the sample unchanged to verify it, then make the changes in Your task and Run code again. A matching task run completes this step and unlocks the next activity. Reopening a started step restores your saved edits." : task ? "Continue in your saved module project. Make the changes in Your task, then Run code. Successful execution matching Expected task output completes this task and unlocks the next step." : "Use the sample code above in your module project. Run it successfully with the exact expected output to complete this step."}</p>
      {step.language === "java" ? <button type="button" className="worksheet-practise" disabled={busy || !onStart} onClick={() => void run()}>{busy ? "Opening…" : "Work in code editor"}</button> : <p>Automatic activity checking currently supports Java only.</p>}
    </div>}
    {role === "teacher" && <details open={!printed}><summary>Preview sample code</summary><ModuleFileEditors files={files} onChange={(index, content) => setFiles((current) => current.map((file, i) => i === index ? { ...file, content } : file))} />{step.language === "java" && <button type="button" disabled={busy} onClick={() => void run()}>Run</button>}{step.activity && !task && <><b>Student activity</b><Markdown markdown={step.activity.instruction} /><pre>{step.activity.expectedOutput}</pre></>}</details>}
    <JavaRunnerBrand />{output !== null && <pre className="module-step-output" role="alert">{output}</pre>}
    {step.checkYourself && <div className="module-check-yourself"><Markdown markdown={step.checkYourself} /></div>}
  </div>;
}

function PerformanceTaskSlot({
  label, files: initialFiles, variant, submitted, role, onStart, paper = false,
}: {
  label: string; files: ModuleFile[]; variant: "sample" | "own";
  submitted?: StepStatus; role: "teacher" | "student"; onStart?: () => Promise<void>; paper?: boolean;
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

  if (paper) return variant === "own" ? <p>Submit this proposal on paper to your teacher. No Java run or online submission is required.</p> : null;

  if (role === "student" && variant === "own") return <div className="module-step">
    <b>Personal performance-task project</b>
    <p>Continue your own project from the previous week. Your module project stays separate.</p>
    {submitted && <span className="status-chip done">Submitted</span>}
    <button type="button" disabled={busy || !onStart} onClick={async () => {
      setBusy(true);
      try { await onStart?.(); }
      catch (error) { setOutput(error instanceof Error ? error.message : "Could not open your personal project"); }
      finally { setBusy(false); }
    }}>{busy ? "Opening…" : "Work on performance task"}</button>
    {output && <p role="alert">{output}</p>}
  </div>;

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
      </div>
      <JavaRunnerBrand />{output !== null && <pre className="module-step-output">{output}</pre>}
    </div>
  );
}

// module_progress is student-only (backend/src/supabase-repository.ts: getSupabaseModuleProgress
// throws 403 for a teacher). A teacher previewing a module has no progress to load, so this never
// fetches it for them - an empty stub keeps the rendering below (stepStates/performanceTask
// lookups) uniform, and role flags below hide anything progress-dependent (goal meter, checkboxes,
// submit buttons, status chips) for that role.
const emptyProgress = (moduleId: string): Progress => ({ moduleId, stepStates: {}, performanceTask: {}, projectFiles: [], performanceProjectFiles: [], percent: 0, updatedAt: "" });

export function ModuleContent({ module, classroomId, role, paged = false, worksheet = false, onStartActivity, progressRevision = 0 }: {
  worksheet?: boolean; paged?: boolean; module: CourseModule; classroomId: string; role: "teacher" | "student";
  onStartActivity?: (module: CourseModule, step?: StepBlock) => Promise<void>; progressRevision?: number;
}) {
  const [progress, setProgress] = useState<Progress | null>(role === "teacher" ? emptyProgress(module.id) : null);
  const [error, setError] = useState<string | null>(null);
  const [lessonPage, setLessonPage] = useState(0);
  const [paperPage, setPaperPage] = useState<number | null>(null);

  useEffect(() => {
    if (role !== "student") return;
    let active = true;
    api<Progress>(`/api/classrooms/${classroomId}/modules/${module.id}/progress`)
      .then((loaded) => { if (active) { setProgress(loaded); setPaperPage(null); } })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Could not load progress"); });
    return () => { active = false; };
  }, [classroomId, module.id, role, progressRevision]);

  if (error) return <p className="module-error">{error}</p>;
  if (!progress) return <p>Loading your progress…</p>;

  if (worksheet) {
    const parts = groupModuleParts(module);
    const pages = parts.flatMap((part) => modulePartPages(part).map((page) => ({
      ...page, part,
      label: page.step ? `${part.lessons.find((lesson) => lesson.blocks.some((block) => isStepBlock(block) && block.id === page.step?.id))?.dayLabel || "Lesson"} · Step ${page.step.number}` : "Overview",
    })));
    const hasTask = Boolean(module.performanceTask || module.closedPerformanceTask);
    const totalPages = pages.length + Number(hasTask);
    const resumeStep = moduleResumeStep(module, progress.stepStates);
    const resumePage = resumeStep ? pages.findIndex((page) => page.step?.id === resumeStep.id) : totalPages - 1;
    const currentPage = Math.max(0, Math.min(paperPage ?? (role === "student" ? resumePage : 0), totalPages - 1));
    const current = pages[currentPage];
    const partDone = (part: typeof parts[number]) => !part.closed && part.blocks.filter(isStepBlock).every((step) => progress.stepStates[activityStateId(step)] === "pass");
    const taskDone = Boolean(progress.performanceTask.own);
    const completed = parts.filter(partDone).length + Number(hasTask && taskDone);
    return <div className="worksheet-content">
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
            {page.part.closed ? <p className="module-preview-note">Complete the previous part first</p> : <>
              {page.blocks.map((block, index) => <ModulePaperBlock key={index} block={block as OtherBlock} />)}
              {page.part.blocks.filter(isStepBlock).length > 0 && <div className="paper-instructions"><b>Work through this part</b><p>Read the discussion, then open each step above. Choose Work in code editor to complete the activity in your saved module project.</p></div>}
              {!page.part.blocks.some(isStepBlock) && page.part.exitLessons.map((lesson) => <div key={lesson.id} className="module-exit-slip"><b>LIPLET · {lesson.dayLabel || lesson.title}</b>{lesson.exitSlip.questions.map((question) => <p key={question.id}>{question.id}. {question.prompt}</p>)}{role === "student" && <p>Write your liplet answers on paper and submit them to your teacher. This does not block your next activity.</p>}</div>)}
            </>}
          </>}
          {page.step && <><h3 className="paper-heading">{page.label}</h3><StepView printed sampleFirst={module.sampleFirst} step={page.step} status={progress.stepStates[activityStateId(page.step)]} role={role} onStart={() => onStartActivity?.(module, page.step!) ?? Promise.resolve()} />{page.blocks.map((block, index) => <ModulePaperBlock key={index} block={block as OtherBlock} />)}{page.part.blocks.filter(isStepBlock).at(-1)?.id === page.step.id && page.part.exitLessons.map((lesson) => <div key={lesson.id} className="module-exit-slip"><b>LIPLET · {lesson.dayLabel || lesson.title}</b>{lesson.exitSlip.questions.map((question) => <p key={question.id}>{question.id}. {question.prompt}</p>)}{role === "student" && <p>Write your liplet answers on paper and submit them to your teacher. This does not block your next activity.</p>}</div>)}</>}
        </article>)}
        {hasTask && <article className="worksheet-paper" hidden={currentPage !== pages.length} aria-label="Performance task">
          <h3 className="paper-heading">{module.performanceTask?.title || module.closedPerformanceTask?.title}</h3>
          {module.closedPerformanceTask && <p className="module-preview-note">Complete the previous part first</p>}
          {module.performanceTask && <><Markdown markdown={module.performanceTask.markdown} /><ul>{module.performanceTask.checklist.map((item, index) => <li key={index}>{item}</li>)}</ul>
            <PerformanceTaskSlot label="Sample code" files={module.performanceTask.exampleFiles} variant="sample" role={role} paper={paperPerformanceTask(module)} submitted={progress.performanceTask.sample?.status} />
            <PerformanceTaskSlot label="Your own version" files={module.performanceTask.starterFiles} variant="own" role={role} paper={paperPerformanceTask(module)} onStart={() => onStartActivity?.(module) ?? Promise.resolve()} submitted={progress.performanceTask.own?.status} />
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
      {role === "teacher" && <p className="module-preview-note">Teacher preview — students unlock parts by completing their activities. Running sample code does not save student progress.</p>}
      {role === "student" && (
        <div className="activity-progress module-goal-meter">
          <div><span>Module progress</span><b>{progress.percent}%</b></div>
          <i><span style={{ width: `${progress.percent}%` }} /></i>
        </div>
      )}
      {paged && <nav className="module-parts" aria-label="Module lessons">
        {module.lessons.map((lesson, index) => {
          const done = !lesson.closed && lesson.blocks.filter(isStepBlock).every((step) => progress.stepStates[activityStateId(step)] === "pass");
          return <button key={lesson.id} type="button" aria-current={lessonPage === index ? "step" : undefined} onClick={() => setLessonPage(index)} className={done ? "part-done" : ""}><i aria-hidden="true">{done ? "✓" : lesson.closed ? "⊘" : index + 1}</i><span>{lesson.title}</span></button>;
        })}
        {(module.performanceTask || module.closedPerformanceTask) && <button type="button" aria-current={lessonPage === module.lessons.length ? "step" : undefined} onClick={() => setLessonPage(module.lessons.length)}><i aria-hidden="true">★</i><span>Performance task</span></button>}
      </nav>}
      {module.lessons.map((lesson, index) => (
        <section key={lesson.id} className="module-lesson" hidden={paged && index !== lessonPage}>
          <h3>{lesson.dayLabel ? `${lesson.dayLabel} — ${lesson.title}` : lesson.title}</h3>
          {lesson.closed ? <p className="module-preview-note">Complete the previous part first</p> : <>
          {lesson.blocks.map((block, index) =>
            isStepBlock(block) ? (
              <StepView
                sampleFirst={module.sampleFirst}
                key={block.id}
                step={block}
                status={progress.stepStates[activityStateId(block)]}
                role={role}
                onStart={() => onStartActivity?.(module, block) ?? Promise.resolve()}
              />
            ) : (
              <ModulePaperBlock key={index} block={block} />
            ),
          )}
          <div className="module-exit-slip">
            <b>Exit slip</b>
            {lesson.exitSlip.questions.map((question) => <p key={question.id}>{question.id}. {question.prompt}</p>)}
            {role === "student" && <p>Write your liplet answers on paper and submit them to your teacher.</p>}
          </div>
          </>}
        </section>
      ))}
      {module.performanceTask && (
        <section className="module-lesson" hidden={paged && lessonPage !== module.lessons.length}>
          <h3>{module.performanceTask.title}</h3>
          <Markdown markdown={module.performanceTask.markdown} />
          <ul>{module.performanceTask.checklist.map((item, index) => <li key={index}>{item}</li>)}</ul>
          <PerformanceTaskSlot
            label="Sample code" files={module.performanceTask.exampleFiles} variant="sample" role={role} paper={paperPerformanceTask(module)}
            submitted={progress.performanceTask.sample?.status}
          />
          <PerformanceTaskSlot
            label="Your own version" files={module.performanceTask.starterFiles} variant="own" role={role} paper={paperPerformanceTask(module)} onStart={() => onStartActivity?.(module) ?? Promise.resolve()}
            submitted={progress.performanceTask.own?.status}
          />
        </section>
      )}
      {module.closedPerformanceTask && (
        <section className="module-lesson" hidden={paged && lessonPage !== module.lessons.length}><h3>{module.closedPerformanceTask.title}</h3><p className="module-preview-note">Complete the previous part first</p></section>
      )}
    </div>
  );
}

export default function ModuleViewer({ role, classroomId, studentId, initialModuleId, embedded = false, drawer = false, active = true, worksheet = false, onOpenModule, onClose, onStartActivity, progressRevision = 0 }: Props) {
  const [modules, setModules] = useState<ModuleSummary[] | null>(null);
  const [selected, setSelected] = useState<CourseModule | null>(null);
  const [accessBlock, setAccessBlock] = useState<ModuleAccessBlock | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sharingSubject, setSharingSubject] = useState<"java" | "net-mvc" | null | undefined>(undefined);
  const [summaries, setSummaries] = useState<Record<string, number>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (role !== "student" || !studentId || !selected) return;
    let active = true;
    void readDeviceRecord<{ value: CourseModule; savedAt: number }>(moduleRecordKey("content", studentId, classroomId, selected.id))
      .then((cached) => { if (active && cached && JSON.stringify(cached.value) !== JSON.stringify(selected)) setSelected(cached.value); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [classroomId, progressRevision, role, selected, studentId]);

  const openModule = useCallback((moduleId: string) => {
    setAccessBlock(null);
    if (onOpenModule) { onOpenModule(moduleId); return; }
    setError(null);
    void (async () => {
      const key = studentId && role === "student" ? moduleRecordKey("content", studentId, classroomId, moduleId) : "";
      const cached = key ? await readDeviceRecord<{ value: CourseModule; savedAt: number }>(key).catch(() => null) : null;
      if (cached && isFreshDeviceRecord(cached)) { setSelected(cached.value); return; }
      try {
        const value = await api<CourseModule>(`/api/classrooms/${classroomId}/modules/${moduleId}`);
        setSelected(value);
        if (key) await writeDeviceRecord(key, { value, savedAt: Date.now() }).catch(() => undefined);
      } catch (loadError) {
        if (cached && !(loadError instanceof ApiError)) { setSelected(cached.value); return; }
        if (loadError instanceof ApiError && loadError.moduleAccess) { setSelected(null); setAccessBlock(loadError.moduleAccess); }
        else setError(loadError instanceof Error ? loadError.message : "Could not load module");
      }
    })();
  }, [classroomId, onOpenModule, role, studentId]);

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

  useEffect(() => { if (!drawer) refreshList(); }, [drawer, refreshList, progressRevision]);

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
  }, [drawer, active, classroomId, role, progressRevision]);

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
    if (!window.confirm(`Delete this module from ${sharingSubject ? `all your ${sharingSubject === "java" ? "Java" : "Net MVC"} classes` : "this class"}? Saved student work and submissions will be kept.`)) return;
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
        {accessBlock && <ModuleAccessNotice block={accessBlock} onContinue={openModule} />}
        {error && <p className="module-error">{error}</p>}
        {!selected && (
          <div className="module-list">
            {drawer && modules && role === "student" && <div className="catalog-progress"><span>{Object.values(summaries).filter((percent) => percent === 100).length} / {modules.length}</span> modules completed</div>}
            {role === "teacher" && embedded && !drawer && (
              <div className="module-upload">
                <ModuleSharing classroomId={classroomId} onReady={setSharingSubject} onChanged={refreshList} />
                <label>Upload module
                <input ref={fileInput} type="file" accept=".json" onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])} disabled={uploading || !sharingSubject} />
                </label>
                {uploading && <small>Uploading…</small>}
              </div>
            )}
            {modules === null && <p>Loading…</p>}
            {modules?.length === 0 && <p>No module uploaded for this class yet.</p>}
            {(drawer && modules ? sortModuleCatalog(modules, summaries) : modules)?.map((module) => (
              <div key={module.moduleId} className={`module-list-row${drawer ? " module-catalog-card" : ""}${drawer && module.isActive ? " module-weekly-card" : ""}`}>
                {drawer ? <ModuleCatalogCard module={module} percent={summaries[module.moduleId] ?? 0} role={role} onOpen={() => module.moduleAccess ? setAccessBlock(module.moduleAccess) : openModule(module.moduleId)} /> : <button type="button" onClick={() => module.moduleAccess ? setAccessBlock(module.moduleAccess) : openModule(module.moduleId)}>Week {module.week} — {module.title}</button>}
                {role === "teacher" && embedded && !drawer && <button type="button" className="danger-button" disabled={sharingSubject === undefined} onClick={() => removeModule(module.moduleId)}>Delete</button>}
              </div>
            ))}
          </div>
        )}
        {selected && <ModuleContent key={selected.id} worksheet={worksheet} paged={drawer} module={selected} classroomId={classroomId} role={role} onStartActivity={onStartActivity} progressRevision={progressRevision} />}
    </>
  );

  if (embedded) return <div className={`activity-modal class-module-panel${drawer ? " drawer-module-viewer" : ""}${worksheet ? " printed-module-viewer" : ""}`}>{content}</div>;
  return (
    <div className="activity-overlay" onClick={(event) => event.target === event.currentTarget && onClose?.()}>
      <div className="activity-modal module-viewer-modal">{content}</div>
    </div>
  );
}
