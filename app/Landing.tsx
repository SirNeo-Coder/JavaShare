"use client";

// Landing page shown right after sign-in, before the classroom workspace: a teacher sees class
// cards that drill into a student roster and, lazily per click, that student's module progress;
// a student sees one card per class they've joined, each with its own module list and progress.
// Nothing here is fetched until a card is clicked, except each class's own light summary (name,
// subject, live status) already included in the initial response.
import { useEffect, useState } from "react";
import { api } from "./apiClient";

type LandingClassroom = { id: string; name: string; subject: string; joinCode?: string; hasActivity?: boolean; hasLiveShare?: boolean };
type RosterStudent = { id: string; name: string; email: string; joinedAt?: string };
type ModuleStatus = "done" | "in-progress" | "not-started";
type ModuleSummary = { moduleId: string; title: string; week: number; percent: number; status: ModuleStatus; isLatest: boolean };

type Props = {
  role: "teacher" | "student";
  name: string;
  classrooms: LandingClassroom[];
  onEnter: (classroomId: string, moduleId?: string) => void;
  onLogout: () => void;
  onRefresh: () => void;
};

function statusLabel(summary: ModuleSummary) {
  if (summary.status === "done") return "Finished";
  if (summary.status === "in-progress") return "In progress";
  return summary.isLatest ? "New this week" : "Not started";
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="activity-progress">
      <div><span>Progress</span><b>{percent}%</b></div>
      <i><span style={{ width: `${percent}%` }} /></i>
    </div>
  );
}

function LiveBadge({ classroom }: { classroom: LandingClassroom }) {
  if (!classroom.hasActivity && !classroom.hasLiveShare) return null;
  return <span className="activity-state active">Live now</span>;
}

function StudentModulePanel({ classroomId, studentId }: { classroomId: string; studentId: string }) {
  const [modules, setModules] = useState<ModuleSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api<ModuleSummary[]>(`/api/classes/${classroomId}/students/${studentId}/modules-summary`)
      .then((result) => { if (active) setModules(result); })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Could not load this student's progress"); });
    return () => { active = false; };
  }, [classroomId, studentId]);

  if (error) return <p className="dashboard-error"><span>{error}</span></p>;
  if (modules === null) return <p className="dashboard-loading">Loading progress…</p>;
  if (!modules?.length) return <p className="empty-activities">No modules uploaded for this class yet.</p>;
  return (
    <div className="activity-summary-list">
      {modules.map((module) => (
        <div className="activity-summary-card" key={module.moduleId}>
          <div className="activity-summary-head">
            <div><span className={`activity-state ${module.status === "done" ? "active" : ""}`}>{statusLabel(module)}</span><h3>Week {module.week} — {module.title}</h3></div>
          </div>
          <ProgressBar percent={module.percent} />
        </div>
      ))}
    </div>
  );
}

function CreateClass({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await api("/api/classes", { method: "POST", body: JSON.stringify({ name, subject: subject || undefined }) });
      setOpen(false);
      setName("");
      setSubject("");
      onCreated();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create the class");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return <button onClick={() => setOpen(true)}>Create a class</button>;
  return (
    <form onSubmit={create} className="dashboard-inline-form">
      <label>
        Class name
        <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={80} />
      </label>
      <label>
        Subject (optional)
        <input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={80} />
      </label>
      {message && <div className="auth-message">{message}</div>}
      <button className="auth-submit" disabled={saving}>{saving ? "Creating…" : "Create class"}</button>
      <button type="button" onClick={() => setOpen(false)}>Cancel</button>
    </form>
  );
}

function JoinAnotherClass({ onJoined }: { onJoined: () => void }) {
  const [open, setOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState("");

  async function join(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api("/api/classes/join", { method: "POST", body: JSON.stringify({ joinCode }) });
      setOpen(false);
      setJoinCode("");
      onJoined();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to join class");
    }
  }

  if (!open) return <button onClick={() => setOpen(true)}>Join another class</button>;
  return (
    <form onSubmit={join} className="dashboard-inline-form">
      <label>
        Class code
        <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} required />
      </label>
      {message && <div className="auth-message">{message}</div>}
      <button className="auth-submit">Join classroom</button>
      <button type="button" onClick={() => setOpen(false)}>Cancel</button>
    </form>
  );
}

function TeacherLanding({ name, classrooms, onEnter, onLogout, onRefresh }: Omit<Props, "role">) {
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [roster, setRoster] = useState<Record<string, RosterStudent[]>>({});
  const [rosterError, setRosterError] = useState<Record<string, string>>({});
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  const toggleClass = (classroomId: string) => {
    const opening = expandedClass !== classroomId;
    setExpandedClass(opening ? classroomId : null);
    setExpandedStudent(null);
    if (opening && !roster[classroomId] && !rosterError[classroomId]) {
      api<{ students: RosterStudent[] }>(`/api/classes/${classroomId}/students`)
        .then((result) => setRoster((current) => ({ ...current, [classroomId]: result.students })))
        .catch((loadError) => setRosterError((current) => ({ ...current, [classroomId]: loadError instanceof Error ? loadError.message : "Could not load students" })));
    }
  };

  return (
    <main className="teacher-dashboard">
      <header className="dashboard-topbar">
        <div className="dashboard-brand"><span className="brand-mark">C</span><span><b>CodeShare</b><small>Teacher dashboard</small></span></div>
        <div className="dashboard-actions">
          <span>{name}</span>
          <button onClick={onLogout}>Sign out</button>
        </div>
      </header>
      <section className="dashboard-content">
        <div className="dashboard-heading">
          <div><span className="eyebrow">YOUR CLASSES</span><h1>Classes</h1><p>Select a class to see its students and their module progress.</p></div>
          <CreateClass onCreated={onRefresh} />
        </div>
        {!classrooms.length && <div className="empty-activities"><b>No classes yet</b></div>}
        {classrooms.map((classroom) => (
          <section className="class-summary" key={classroom.id}>
            <header>
              <div>
                <h2>{classroom.name}</h2>
                <p>{classroom.subject}{classroom.joinCode ? ` · Code ${classroom.joinCode}` : ""}</p>
              </div>
              <span>
                <LiveBadge classroom={classroom} />
                {" "}
                <button onClick={() => toggleClass(classroom.id)}>{expandedClass === classroom.id ? "Hide students" : "View students"}</button>
                {" "}
                <button onClick={() => onEnter(classroom.id)}>Enter classroom</button>
              </span>
            </header>
            {expandedClass === classroom.id && (
              rosterError[classroom.id] ? <p className="dashboard-error"><span>{rosterError[classroom.id]}</span></p> :
              !roster[classroom.id] ? <p className="dashboard-loading">Loading students…</p> :
              !roster[classroom.id].length ? <div className="empty-activities">No students have joined this class yet.</div> :
              <div className="activity-summary-list">
                {roster[classroom.id].map((student) => (
                  <div className="activity-summary-card" key={student.id}>
                    <div className="activity-summary-head">
                      <div><h3>{student.name}</h3><p>{student.email}</p></div>
                      <button onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)}>
                        {expandedStudent === student.id ? "Hide progress" : "View module progress"}
                      </button>
                    </div>
                    {expandedStudent === student.id && <StudentModulePanel classroomId={classroom.id} studentId={student.id} />}
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}
      </section>
    </main>
  );
}

function StudentClassCard({ classroom, onEnter }: { classroom: LandingClassroom; onEnter: Props["onEnter"] }) {
  const [modules, setModules] = useState<ModuleSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api<ModuleSummary[]>(`/api/classrooms/${classroom.id}/modules/summary`)
      .then((result) => { if (active) setModules(result); })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Could not load your modules"); });
    return () => { active = false; };
  }, [classroom.id]);

  return (
    <section className="class-summary">
      <header>
        <div>
          <h2>{classroom.name}</h2>
          <p>{classroom.subject}</p>
        </div>
        <span>
          <LiveBadge classroom={classroom} />
          {" "}
          <button onClick={() => onEnter(classroom.id)}>Enter classroom</button>
        </span>
      </header>
      {error && <p className="dashboard-error"><span>{error}</span></p>}
      {modules === null && !error && <p className="dashboard-loading">Loading your modules…</p>}
      {modules?.length === 0 && <div className="empty-activities">No module uploaded for this class yet.</div>}
      {modules && modules.length > 0 && (
        <div className="activity-summary-list">
          {modules.map((module) => (
            <button type="button" className="activity-summary-card" key={module.moduleId} onClick={() => onEnter(classroom.id, module.moduleId)} style={{ textAlign: "left", cursor: "pointer" }}>
              <div className="activity-summary-head">
                <div><span className={`activity-state ${module.status === "done" ? "active" : ""}`}>{statusLabel(module)}</span><h3>Week {module.week} — {module.title}</h3></div>
              </div>
              <ProgressBar percent={module.percent} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function StudentLanding({ name, classrooms, onEnter, onLogout, onRefresh }: Omit<Props, "role">) {
  return (
    <main className="teacher-dashboard">
      <header className="dashboard-topbar">
        <div className="dashboard-brand"><span className="brand-mark">C</span><span><b>CodeShare</b><small>Your classes</small></span></div>
        <div className="dashboard-actions">
          <span>{name}</span>
          <button onClick={onLogout}>Sign out</button>
        </div>
      </header>
      <section className="dashboard-content">
        <div className="dashboard-heading">
          <div><span className="eyebrow">YOUR CLASSES</span><h1>Classes</h1><p>Pick a class to see this term&apos;s modules.</p></div>
          <JoinAnotherClass onJoined={onRefresh} />
        </div>
        {!classrooms.length && <div className="empty-activities"><b>Join a class to see your modules</b></div>}
        {classrooms.map((classroom) => <StudentClassCard key={classroom.id} classroom={classroom} onEnter={onEnter} />)}
      </section>
    </main>
  );
}

export default function Landing({ role, name, classrooms, onEnter, onLogout, onRefresh }: Props) {
  return role === "teacher"
    ? <TeacherLanding name={name} classrooms={classrooms} onEnter={onEnter} onLogout={onLogout} onRefresh={onRefresh} />
    : <StudentLanding name={name} classrooms={classrooms} onEnter={onEnter} onLogout={onLogout} onRefresh={onRefresh} />;
}
