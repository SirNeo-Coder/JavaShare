"use client";

// Class list and class home, kept separate from the live classroom workspace.
import { useEffect, useState } from "react";
import { api } from "./apiClient";
import ModuleViewer from "./ModuleViewer";

type LandingClassroom = { id: string; name: string; subject: string; joinCode?: string; hasActivity?: boolean; hasLiveShare?: boolean };
type RosterStudent = { id: string; name: string; email: string; joinedAt?: string };
type ModuleStatus = "done" | "in-progress" | "not-started";
type ModuleSummary = { moduleId: string; title: string; week: number; percent: number; status: ModuleStatus; isLatest: boolean };

type Props = {
  role: "teacher" | "student";
  name: string;
  classrooms: LandingClassroom[];
  initialClassroomId?: string | null;
  onEnter: (classroomId: string) => void;
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

function ClassRoster({ classroomId }: { classroomId: string }) {
  const [roster, setRoster] = useState<RosterStudent[] | null>(null);
  const [error, setError] = useState("");
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api<{ students: RosterStudent[] }>(`/api/classes/${classroomId}/students`)
      .then((result) => { if (active) setRoster(result.students); })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Could not load students"); });
    return () => { active = false; };
  }, [classroomId]);

  return (
    <section className="class-summary" aria-label="Students">
      <h2>Students</h2>
      {error ? <p className="dashboard-error" role="alert">{error}</p> :
        roster === null ? <p className="dashboard-loading">Loading students…</p> :
        !roster.length ? <div className="empty-activities">No students have joined this class yet.</div> :
        <div className="activity-summary-list">
          {roster.map((student) => (
            <div className="activity-summary-card" key={student.id}>
              <div className="activity-summary-head">
                <div><h3>{student.name}</h3><p>{student.email}</p></div>
                <button onClick={() => setExpandedStudent(expandedStudent === student.id ? null : student.id)} aria-expanded={expandedStudent === student.id}>
                  {expandedStudent === student.id ? "Hide progress" : "View module progress"}
                </button>
              </div>
              {expandedStudent === student.id && <StudentModulePanel classroomId={classroomId} studentId={student.id} />}
            </div>
          ))}
        </div>
      }
    </section>
  );
}

function StudentModules({ classroomId }: { classroomId: string }) {
  const [modules, setModules] = useState<ModuleSummary[] | null>(null);
  const [error, setError] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedModuleId) return;
    let active = true;
    api<ModuleSummary[]>(`/api/classrooms/${classroomId}/modules/summary`)
      .then((result) => { if (active) setModules(result); })
      .catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Could not load your modules"); });
    return () => { active = false; };
  }, [classroomId, selectedModuleId]);

  return (
    <section className="class-summary" aria-label="Your modules">
      <h2>Your modules</h2>
      {error && <p className="dashboard-error"><span>{error}</span></p>}
      {modules === null && !error && <p className="dashboard-loading">Loading your modules…</p>}
      {modules?.length === 0 && <div className="empty-activities">No module uploaded for this class yet.</div>}
      {modules && modules.length > 0 && (
        <div className="activity-summary-list">
          {modules.map((module) => (
            <button type="button" className="activity-summary-card" key={module.moduleId} onClick={() => setSelectedModuleId(module.moduleId)} style={{ textAlign: "left", cursor: "pointer" }}>
              <div className="activity-summary-head">
                <div><span className={`activity-state ${module.status === "done" ? "active" : ""}`}>{statusLabel(module)}</span><h3>Week {module.week} — {module.title}</h3></div>
              </div>
              <ProgressBar percent={module.percent} />
            </button>
          ))}
        </div>
      )}
      {selectedModuleId && (
        <ModuleViewer
          role="student"
          classroomId={classroomId}
          initialModuleId={selectedModuleId}
          onClose={() => setSelectedModuleId(null)}
        />
      )}
    </section>
  );
}

export default function Landing({ role, name, classrooms, initialClassroomId, onEnter, onLogout, onRefresh }: Props) {
  const [selectedClassroomId, setSelectedClassroomId] = useState(initialClassroomId ?? null);
  const classroom = classrooms.find((item) => item.id === selectedClassroomId);

  return (
    <main className="teacher-dashboard">
      <header className="dashboard-topbar">
        <div className="dashboard-brand"><span className="brand-mark">C</span><span><b>CodeShare</b><small>{role === "teacher" ? "Teacher dashboard" : "Your classes"}</small></span></div>
        <div className="dashboard-actions">
          <span>{name}</span>
          <button onClick={onLogout}>Sign out</button>
        </div>
      </header>
      <section className="dashboard-content">
        {classroom ? (
          <div key={classroom.id}>
            <div className="dashboard-heading">
              <div>
                <button onClick={() => setSelectedClassroomId(null)}>Classes</button>
                <h1>{classroom.name}</h1>
                <p>{classroom.subject}{role === "teacher" && classroom.joinCode ? ` · Code ${classroom.joinCode}` : ""}</p>
              </div>
              <div className="dashboard-actions">
                <LiveBadge classroom={classroom} />
                <button onClick={() => onEnter(classroom.id)}>Enter classroom</button>
              </div>
            </div>
            {role === "teacher" ? (
              <>
                <section className="class-summary" aria-label="Modules">
                  <ModuleViewer role="teacher" classroomId={classroom.id} embedded />
                </section>
                <ClassRoster classroomId={classroom.id} />
              </>
            ) : <StudentModules classroomId={classroom.id} />}
          </div>
        ) : (
          <>
            <div className="dashboard-heading">
              <div><span className="eyebrow">YOUR CLASSES</span><h1>Classes</h1><p>Open a class to see its modules{role === "teacher" ? " and students" : ""}.</p></div>
              {role === "teacher" ? <CreateClass onCreated={onRefresh} /> : <JoinAnotherClass onJoined={onRefresh} />}
            </div>
            {!classrooms.length && <div className="empty-activities"><b>{role === "teacher" ? "No classes yet" : "Join a class to see your modules"}</b></div>}
            {classrooms.map((item) => (
              <section className="class-summary" key={item.id}>
                <header>
                  <div><h2>{item.name}</h2><p>{item.subject}{role === "teacher" && item.joinCode ? ` · Code ${item.joinCode}` : ""}</p></div>
                  <div className="dashboard-actions">
                    <LiveBadge classroom={item} />
                    <button onClick={() => setSelectedClassroomId(item.id)}>Open class</button>
                  </div>
                </header>
              </section>
            ))}
          </>
        )}
      </section>
    </main>
  );
}
