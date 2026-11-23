"use client";

// Module editor, wording stage (teacher, 2026-11-23): change a shared module's wording in the app. The server
// refuses anything but wording and keeps the old content as an earlier version before every change.
import { useEffect, useState } from "react";
import { api } from "./apiClient";
import { ModuleContent, type CourseModule as ViewerModule } from "./ModuleViewer";
import type { CourseModule } from "../backend/src/course-module-schema";
import { setWording } from "../backend/src/module-wording";
import ModuleEditPage from "./ModuleEditPage";

type Editor = { content: CourseModule; updatedAt: string; subject: "java" | "net-mvc"; classNames: string[];
  versions: { id: string; replacedBy: string; savedAt: string; title: string }[] };

const when = (value: string) => new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const subjectName = (subject: Editor["subject"]) => subject === "java" ? "Java" : "Net MVC";

// What students see: the same module without the teacher-only answer key.
export function studentPreview(module: CourseModule): CourseModule {
  return { ...module, lessons: module.lessons.map((lesson) => ({ ...lesson, blocks: lesson.blocks.map((block) =>
    block.type === "step" && block.activity?.solution ? { ...block, activity: { ...block.activity, solution: undefined } } : block) })) };
}

export function saveWarning(editor: Pick<Editor, "subject" | "classNames">) {
  return `This change reaches every class in ${subjectName(editor.subject)}: ${editor.classNames.join(", ")}.\n\n`
    + "Students' work, completions and submissions are not changed.\n\n"
    + "The printed PDF and Word lesson plan are not updated. Change them yourself if this wording appears there.";
}

export default function ModuleEditor({ classroomId, moduleId, onClose }: { classroomId: string; moduleId: string; onClose: () => void }) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [draft, setDraft] = useState<CourseModule | null>(null);
  const [preview, setPreview] = useState(false);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  const base = `/api/classrooms/${classroomId}/modules/${encodeURIComponent(moduleId)}`;

  useEffect(() => {
    let active = true;
    api<Editor>(`${base}/editor`).then((loaded) => { if (active) { setEditor(loaded); setDraft(loaded.content); } })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "Could not open the module editor"); });
    return () => { active = false; };
  }, [base, revision]);

  const act = async (run: () => Promise<unknown>, done: string) => {
    setBusy(true); setMessage("");
    try { await run(); setMessage(done); setRevision((value) => value + 1); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Something went wrong"); }
    finally { setBusy(false); }
  };
  const save = () => editor && draft && window.confirm(saveWarning(editor)) && act(() => api(`${base}/wording`, { method: "PUT", body: JSON.stringify({ content: draft, expectedUpdatedAt: editor.updatedAt }) }), "Saved. Every class in this subject now shows the new wording.");
  const restore = (id: string, savedAt: string) => editor && window.confirm(`Restore the version kept on ${when(savedAt)}? ${saveWarning(editor)}\n\nThe current version is kept as an earlier version first.`)
    && act(() => api(`${base}/versions/${id}/restore`, { method: "POST", body: JSON.stringify({ expectedUpdatedAt: editor.updatedAt }) }), "Restored.");
  const download = () => {
    if (!editor) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([`${JSON.stringify(editor.content, null, 2)}\n`], { type: "application/json" }));
    link.download = `${editor.content.id}.codeshare.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (!editor || !draft) return <section className="module-editor"><button className="teacher-back" onClick={onClose}>← Back to modules</button>{message ? <p role="alert">{message}</p> : <p role="status">Loading module editor…</p>}</section>;
  const changed = JSON.stringify(draft) !== JSON.stringify(editor.content);
  const pages = ["Overview", ...draft.lessons.map((lesson, index) => lesson.dayLabel || `Lesson ${index + 1}`), ...(draft.performanceTask ? ["Performance task"] : [])];
  return <section className="module-editor" aria-label={`Edit ${editor.content.title}`}>
    <button className="teacher-back" onClick={() => { if (!changed || window.confirm("Leave without saving your changes?")) onClose(); }}>← Back to modules</button>
    <h2>Edit module: {editor.content.title}</h2>
    <p className="module-editor-note">Wording only for now, so students keep their work and completions. Shared with every {subjectName(editor.subject)} class: {editor.classNames.join(", ")}.</p>
    <div className="module-editor-actions">
      <button onClick={() => setPreview((value) => !value)}>{preview ? "Back to editing" : "Preview as student"}</button>
      <button className="teacher-primary" onClick={save} disabled={busy || !changed}>{busy ? "Saving…" : "Save changes"}</button>
      <button onClick={download} disabled={busy}>Download module file</button>
      {changed && <span>Unsaved changes. Download gives the saved version.</span>}
    </div>
    {message && <p role="status" className="module-editor-message">{message}</p>}
    {preview ? <div className="module-editor-preview"><ModuleContent module={{ ...studentPreview(draft), availability: { openLessonIds: [], performanceTaskOpen: true } } as ViewerModule} classroomId={classroomId} role="teacher" worksheet /></div>
      : <><nav className="worksheet-tabs module-edit-tabs" aria-label="Module pages">{pages.map((name, index) => <button key={index} type="button" aria-current={page === index ? "page" : undefined} onClick={() => setPage(index)}>{name}</button>)}</nav>
        <p className="module-editor-note">Click any wording to change it. Greyed parts (code, outputs, answers, points) cannot change yet.</p>
        <ModuleEditPage module={draft} page={page} onChange={(path, text) => setDraft((current) => current && setWording(current, path, text))} /></>}
    <h3>Earlier versions</h3>
    {editor.versions.length ? <ul className="module-editor-versions">{editor.versions.map((version) => <li key={version.id}>
      <span>Kept {when(version.savedAt)} before {version.replacedBy === "upload" ? "an upload" : version.replacedBy === "edit" ? "an edit" : "a restore"} · {version.title}</span>
      <button onClick={() => restore(version.id, version.savedAt)} disabled={busy}>Restore</button></li>)}</ul>
      : <p>No earlier versions yet. One is kept before every upload, edit or restore from now on.</p>}
  </section>;
}
