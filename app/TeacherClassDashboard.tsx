"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import { api } from "./apiClient";
import ModuleViewer from "./ModuleViewer";
import TeacherWebProjects from "./TeacherWebProjects";
import type { LiveClassroom } from "./liveClasses";
import type { getSupabaseTeacherClassProgress } from "../backend/src/supabase-repository";

type ClassProgress = Awaited<ReturnType<typeof getSupabaseTeacherClassProgress>>;
type Student = ClassProgress["students"][number];
type Section = "Overview" | "Students" | "Curriculum";
type Filter = "all" | "finished" | "in-progress" | "not-started";

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();
const statusLabel = (value: Exclude<Filter, "all">) => value === "finished" ? "Finished" : value === "in-progress" ? "In progress" : "Not started";
const matchesFilter = (value: Exclude<Filter, "all">, filter: Filter) => filter === "all" || value === filter;

function Icon({ kind }: { kind: "Overview" | "Students" | "Curriculum" | "code" }) {
  const paths = {
    Overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    Students: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87",
    Curriculum: "M4 3h15v18H4a2 2 0 0 1 0-4h15 M4 3v14",
    code: "m8 8-4 4 4 4 m8-8 4 4-4 4 m-3-12-2 16",
  };
  return <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>;
}

function Meter({ percent, label = "Progress" }: { percent: number; label?: string }) {
  return <div className="teacher-meter"><div><span>{label}</span><b>{percent}%</b></div><progress aria-label={label} value={percent} max={100} /></div>;
}

function DeleteModuleDialog({ title, busy, error, dialogRef, onCancel, onDelete }: { title: string; busy: boolean; error: string; dialogRef: RefObject<HTMLDialogElement | null>; onCancel: () => void; onDelete: () => void }) {
  useEffect(() => { dialogRef.current?.showModal(); }, [dialogRef]);
  return <dialog className="teacher-delete-dialog" ref={dialogRef} aria-labelledby="teacher-delete-title" onCancel={(event) => { event.preventDefault(); if (!busy) onCancel(); }}>
    <h2 id="teacher-delete-title">Delete {title}?</h2><p>This removes the uploaded module from this class. Students will no longer be able to open it.</p>
    {error && <p role="alert">{error}</p>}
    <div><button onClick={onCancel} disabled={busy} autoFocus>Cancel</button><button className="teacher-danger" onClick={onDelete} disabled={busy}>{busy ? "Deleting…" : "Delete module"}</button></div>
  </dialog>;
}

export default function TeacherClassDashboard({ classroom, name, onClasses, onEnter, onLogout }: {
  classroom: LiveClassroom; name: string; onClasses: () => void; onEnter: () => void; onLogout: () => void;
}) {
  const [section, setSection] = useState<Section>("Overview");
  const [data, setData] = useState<ClassProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState("week");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [webStudent, setWebStudent] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const uploadInput = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const deleteTrigger = useRef<HTMLButtonElement | null>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let active = true;
    api<ClassProgress>(`/api/classes/${classroom.id}/module-progress`)
      .then((result) => { if (active) { setData(result); setError(""); } })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Could not load class progress"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [classroom.id, revision]);

  const refresh = () => { setLoading(true); setRevision((current) => current + 1); };
  const navigate = (next: Section) => {
    setSection(next); setStudentId(null); setPreviewId(null); setSearch(""); setFilter("all");
    heading.current?.focus();
  };
  const upload = async (file: File) => {
    setBusy(true); setError("");
    try {
      await api(`/api/classrooms/${classroom.id}/modules`, { method: "POST", body: JSON.stringify(JSON.parse(await file.text())) });
      refresh();
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "Could not upload module"); }
    finally { setBusy(false); if (uploadInput.current) uploadInput.current.value = ""; }
  };
  const closeDelete = () => { deleteDialog.current?.close(); setDeleteId(null); deleteTrigger.current?.focus(); };
  const remove = async () => {
    if (!deleteId) return;
    setBusy(true); setError("");
    try {
      await api(`/api/classrooms/${classroom.id}/modules/${deleteId}`, { method: "DELETE" });
      deleteDialog.current?.close(); setDeleteId(null); refresh(); heading.current?.focus();
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Could not delete module"); }
    finally { setBusy(false); }
  };
  const selectedStudent = data?.students.find((student) => student.id === studentId);
  const query = search.trim().toLowerCase();
  const students = data?.students.filter((student) => `${student.name} ${student.email}`.toLowerCase().includes(query) && matchesFilter(student.status, filter)) ?? [];
  const modules = (data?.modules ?? []).filter((module) => `${module.title} ${module.course} ${module.week}`.toLowerCase().includes(query) && matchesFilter(module.status, filter))
    .toSorted((a, b) => sort === "title" ? a.title.localeCompare(b.title) : a.week - b.week || a.title.localeCompare(b.title));
  const totals = data?.totals;
  const title = selectedStudent ? selectedStudent.name : section === "Students" ? "Student progress" : section === "Curriculum" ? "Curriculum" : "Class overview";
  const stats = section === "Curriculum" ? [
    ["Total modules", totals?.modules, `${data?.modules.reduce((total, module) => total + module.lessons, 0) ?? 0} lessons in this class`],
    ["Average completion", `${totals?.averagePercent ?? 0}%`, "Across students and modules"],
    ["Performance-task submissions", totals?.submissions, "Sample code and own versions"],
    ["Completed modules", totals?.completedModules, "Student–module completions"],
  ] : [
    ["Total students", totals?.students, "In this class"],
    ["Average progress", `${totals?.averagePercent ?? 0}%`, "Across all uploaded modules"],
    ["Completed modules", totals?.completedModules, "Student–module completions"],
    ["No completed items", totals?.notStartedStudents, "Students with 0% progress"],
  ];

  const moduleCards = (forStudent?: Student) => <div className="teacher-card-grid">
    {(forStudent ? data?.modules ?? [] : modules).map((module, index) => {
      const percent = forStudent ? forStudent.modules.find((item) => item.moduleId === module.moduleId)?.percent ?? 0 : module.averagePercent;
      const state = forStudent ? percent === 100 ? "finished" : percent > 0 ? "in-progress" : "not-started" : module.status;
      return <article className={`teacher-module-card teacher-tone-${index % 3}`} key={module.moduleId}>
        <div className="teacher-module-banner"><span><Icon kind={index % 3 === 0 ? "code" : "Curriculum"} /></span><small>Week {module.week}</small></div>
        <div className="teacher-module-body">
          <span className={`teacher-status ${state === "finished" ? "finished" : state === "in-progress" ? "started" : ""}`}>{statusLabel(state)}</span>
          <h3>{module.title}</h3><p className="teacher-course-name">{module.course.replaceAll("-", " ")}</p>
          <div className="teacher-module-facts"><span><b>{module.lessons}</b>Lessons</span><span><b>{module.steps}</b>Practice steps</span><span><b>{forStudent ? forStudent.modules.find((item) => item.moduleId === module.moduleId)?.submissions ?? 0 : module.submissions}</b>Task submissions</span></div>
          <Meter percent={percent} label={forStudent ? "Saved completion" : "Average student completion"} />
          {!forStudent && <><p className="teacher-card-caption"><b>{module.completedStudents}/{totals?.students ?? 0}</b> students finished</p><button className="teacher-card-action" onClick={() => { setPreviewId(module.moduleId); heading.current?.focus(); }}>View module details <span aria-hidden="true">›</span></button><button className="teacher-delete-link" onClick={(event) => { deleteTrigger.current = event.currentTarget; setError(""); setDeleteId(module.moduleId); }} disabled={busy}>Delete module</button></>}
        </div>
      </article>;
    })}
  </div>;

  return <main className="teacher-class-dashboard">
    <aside className="teacher-sidebar">
      <button className="teacher-brand" onClick={onClasses}><span><Icon kind="code" /></span><b>CodeShare</b></button>
      <small className="teacher-nav-label">WORKSPACE</small>
      <nav aria-label="Teacher class navigation">{(["Overview", "Students", "Curriculum"] as const).map((item) => <button key={item} aria-current={section === item ? "page" : undefined} onClick={() => navigate(item)}><Icon kind={item} /><span>{item}</span>{item === "Students" && data && <small>{totals?.students}</small>}</button>)}</nav>
      <small className="teacher-nav-label">MANAGE</small>
      <div className="teacher-manage-links"><Link href="/teacher">Activity summary</Link><Link href="/teacher/accounts">Student accounts</Link><button onClick={onClasses}>All classes</button></div>
      <div className="teacher-sidebar-bottom"><div className="teacher-class-label"><Icon kind="Curriculum" /><div><b>{classroom.name}</b><small>{classroom.subject}{classroom.joinCode ? ` · Code ${classroom.joinCode}` : ""}</small></div></div><div className="teacher-account"><span className="teacher-progress-avatar">{initials(name)}</span><div><b>{name}</b><small>Teacher</small></div></div><button className="teacher-signout" onClick={onLogout}>Sign out</button></div>
    </aside>
    <div className="teacher-main">
      <header className="teacher-dashboard-bar"><span>{classroom.name}{(classroom.hasActivity || classroom.hasLiveShare) && <b className="teacher-status finished">Live now</b>}</span><div><button onClick={refresh} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button><button onClick={onEnter}>Enter classroom <span aria-hidden="true">↗</span></button></div></header>
      <section className="teacher-page" aria-busy={loading}>
        <div className="teacher-page-heading"><div><span className="teacher-eyebrow">{classroom.subject || "YOUR CLASS"} · {section === "Curriculum" ? `${totals?.modules ?? 0} MODULES` : "SAVED MODULE PROGRESS"}</span><h1 ref={heading} tabIndex={-1}>{title}</h1><p>{selectedStudent ? selectedStudent.email : section === "Curriculum" ? "Manage weekly modules and monitor class completion." : "Track how your students are moving through their modules."}</p></div>{section === "Curriculum" && !previewId && <button className="teacher-primary" onClick={() => uploadInput.current?.click()} disabled={busy || loading}>+ {busy ? "Uploading…" : "Add module"}</button>}</div>
        <input ref={uploadInput} type="file" accept=".json" aria-label="Upload module" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
        {error && <div className="teacher-load-error" role="alert">{error} <button onClick={refresh} disabled={loading}>Try again</button></div>}
        {loading && !data && <p role="status">Loading class progress…</p>}
        {data && <>
          {previewId ? <ModuleViewer key={previewId} role="teacher" classroomId={classroom.id} initialModuleId={previewId} embedded onClose={() => { setPreviewId(null); refresh(); }} /> : selectedStudent ? <>
            <button className="teacher-back" onClick={() => { setStudentId(null); heading.current?.focus(); }}>← Back to students</button>
            <div className="teacher-student-summary"><span className="teacher-progress-avatar">{initials(selectedStudent.name)}</span><div><h2>{selectedStudent.completedModules} of {data.modules.length} modules complete</h2><p>Completion records practice checks, exit-slip checkboxes, and task submissions.</p><Meter percent={selectedStudent.averagePercent} label="Overall progress" /></div><button onClick={() => setWebStudent(selectedStudent)}>View web projects</button></div>
            <h2 className="teacher-list-title">Learning modules</h2>{data.modules.length ? moduleCards(selectedStudent) : <p className="teacher-empty">No modules uploaded for this class yet.</p>}
          </> : <>
            <div className="teacher-stats">{stats.map(([label, value, note], index) => <article key={label}><span className={`teacher-stat-icon teacher-tone-${index % 3}`}><Icon kind={index === 0 && section !== "Curriculum" ? "Students" : "Curriculum"} /></span><div><span>{label}</span><b>{value ?? 0}</b><small>{note}</small></div></article>)}</div>
            {section === "Overview" ? <><div className="teacher-list-heading"><h2>Your class at a glance</h2></div><div className="teacher-overview-links"><button onClick={() => navigate("Students")}><Icon kind="Students" /><b>Student progress</b><span>See each student’s saved completion across modules.</span><strong>View students ›</strong></button><button onClick={() => navigate("Curriculum")}><Icon kind="Curriculum" /><b>Curriculum</b><span>Upload modules, preview lessons, and open content to students.</span><strong>View modules ›</strong></button></div><p className="teacher-explainer">Progress measures completion, not a grade. Figures include closed lessons and refresh when you press Refresh.</p></> : <>
              <div className="teacher-list-heading"><h2>{section === "Students" ? "All students" : "All modules"}</h2><small>{section === "Students" ? students.length : modules.length} {section === "Students" ? "students" : "modules"}</small></div>
              <div className="teacher-filters"><label><span className="sr-only">{section === "Students" ? "Search students" : "Search modules"}</span><input placeholder={section === "Students" ? "Search students…" : "Search modules…"} value={search} onChange={(event) => setSearch(event.target.value)} /></label><select aria-label="Completion status" value={filter} onChange={(event) => setFilter(event.target.value as Filter)}><option value="all">All {section === "Students" ? "students" : "modules"}</option><option value="finished">Finished</option><option value="in-progress">In progress</option><option value="not-started">Not started</option></select>{section === "Curriculum" && <select aria-label="Module order" value={sort} onChange={(event) => setSort(event.target.value)}><option value="week">Week order</option><option value="title">Title order</option></select>}</div>
              {section === "Curriculum" ? modules.length ? moduleCards() : <p className="teacher-empty">{data.modules.length ? "No modules match your search or filter." : "No modules yet. Use Add module to upload your first module."}</p> : students.length ? <div className="teacher-card-grid">{students.map((student) => <article className="teacher-student-card" key={student.id}><div className="teacher-student-card-head"><span className="teacher-progress-avatar">{initials(student.name)}</span><span className={`teacher-status ${student.status === "finished" ? "finished" : student.status === "in-progress" ? "started" : ""}`}>{statusLabel(student.status)}</span></div><h3>{student.name}</h3><p>{student.email}</p><Meter percent={student.averagePercent} label="Overall progress" /><p className="teacher-card-caption"><b>{student.completedModules}/{data.modules.length}</b> modules complete</p><button className="teacher-card-action" aria-label={`Open ${student.name}'s progress`} onClick={() => { setStudentId(student.id); heading.current?.focus(); }}>View module progress <span aria-hidden="true">›</span></button><button className="teacher-web-link" onClick={() => setWebStudent(student)}>View web projects</button></article>)}</div> : <p className="teacher-empty">{data.students.length ? "No students match your search or filter." : "No students have joined this class yet."}</p>}
            </>}
          </>}
          <p className="teacher-data-note">Saved completion only · Task submissions are not automatically graded · Each class is tracked separately</p>
        </>}
      </section>
    </div>
    {webStudent && <TeacherWebProjects key={webStudent.id} classroomId={classroom.id} student={webStudent} onClose={() => setWebStudent(null)} />}
    {deleteId && <DeleteModuleDialog title={data?.modules.find((module) => module.moduleId === deleteId)?.title ?? "this module"} busy={busy} error={error} dialogRef={deleteDialog} onCancel={closeDelete} onDelete={() => void remove()} />}
  </main>;
}
