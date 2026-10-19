"use client";

// Class list and class home, kept separate from the live classroom workspace.
import { useEffect, useRef, useState } from "react";
import { api, getApiUrl } from "./apiClient";
import { realtimeClient } from "./realtime";
import { listenForLiveClasses, pendingLiveClasses, type LiveClassroom } from "./liveClasses";
import ModuleViewer from "./ModuleViewer";
import TeacherClassDashboard from "./TeacherClassDashboard";

type LandingClassroom = LiveClassroom;
type ModuleStatus = "done" | "in-progress" | "not-started";
type ModuleSummary = { moduleId: string; title: string; week: number; percent: number; status: ModuleStatus; isLatest: boolean };

type Props = {
  role: "teacher" | "student";
  name: string;
  classrooms: LandingClassroom[];
  initialClassroomId?: string | null;
  onEnter: (classroomId: string) => void;
  onLogout: () => void;
  onRefresh: () => Promise<void>;
  onLiveStatusChange: (classrooms: LiveClassroom[]) => void;
  dismissedLiveSessions: Record<string, string>;
  onDismissLiveClasses: (classrooms: LiveClassroom[]) => void;
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

function StudentModules({ classroomId, selectedModuleId, onSelectModule }: { classroomId: string; selectedModuleId: string | null; onSelectModule: (moduleId: string | null) => void }) {
  const [modules, setModules] = useState<ModuleSummary[] | null>(null);
  const [error, setError] = useState("");

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
            <button type="button" className="activity-summary-card" key={module.moduleId} onClick={() => onSelectModule(module.moduleId)} style={{ textAlign: "left", cursor: "pointer" }}>
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
          onClose={() => onSelectModule(null)}
        />
      )}
    </section>
  );
}

function LiveClassInvitation({ classrooms, onJoin, onDismiss }: { classrooms: LiveClassroom[]; onJoin: (classroom: LiveClassroom) => void; onDismiss: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return (
    <dialog ref={dialog} className="activity-modal live-class-invitation" aria-labelledby="live-class-title" onCancel={(event) => { event.preventDefault(); onDismiss(); }}>
      <header><h2 id="live-class-title">Your class is live</h2></header>
      <p>{classrooms.length > 1 ? "Choose the class you want to join." : "Your teacher has started an activity or live share."}</p>
      {classrooms.map((classroom) => (
        <div className="module-list-row" key={classroom.id}>
          <b>{classroom.name}</b>
          <button type="button" aria-label={`Join live class: ${classroom.name}`} onClick={() => onJoin(classroom)}>Join live class</button>
        </div>
      ))}
      <footer><button type="button" onClick={onDismiss}>Not now</button></footer>
    </dialog>
  );
}

export default function Landing({ role, name, classrooms, initialClassroomId, onEnter, onLogout, onRefresh, onLiveStatusChange, dismissedLiveSessions, onDismissLiveClasses }: Props) {
  const [selectedClassroomId, setSelectedClassroomId] = useState(initialClassroomId ?? null);
  const [liveClassrooms, setLiveClassrooms] = useState<Record<string, LiveClassroom>>({});
  const displayedClassrooms = classrooms.map((item) => liveClassrooms[item.id] || item);
  const classroom = displayedClassrooms.find((item) => item.id === selectedClassroomId);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  // A module id from the previous classroom must never carry over (keyboard "Classes" bypasses
  // the remount boundary the mouse "Close" path relies on to reset it).
  const openClassroom = (id: string | null) => {
    setSelectedClassroomId(id);
    setSelectedModuleId(null);
  };
  const [connectionError, setConnectionError] = useState("");
  const [connectionAttempt, setConnectionAttempt] = useState(0);
  const [refreshError, setRefreshError] = useState("");
  const statusChangeRef = useRef(onLiveStatusChange);
  useEffect(() => { statusChangeRef.current = onLiveStatusChange; }, [onLiveStatusChange]);
  const classroomIds = JSON.stringify(classrooms.map((item) => item.id).sort());
  const invitations = role === "student" ? pendingLiveClasses(displayedClassrooms, dismissedLiveSessions) : [];
  const enterClassroom = (item: LiveClassroom) => {
    onDismissLiveClasses([item]);
    onEnter(item.id);
  };

  useEffect(() => {
    if (role !== "student" || classroomIds === "[]") return;
    let cancelled = false;
    let refreshing = false;
    let refreshAgain = false;
    let connecting = false;
    let stopListening: (() => Promise<void>) | null = null;
    // Coalesce simultaneous channel joins and serialize refreshes so an older reply cannot
    // overwrite newer class status. An announcement during a request gets a follow-up request.
    const refresh = async () => {
      if (cancelled) return;
      if (refreshing) { refreshAgain = true; return; }
      refreshing = true;
      try {
        // Keep background status local: a late class-list reply must never replace the
        // workspace's teams/files after the student has chosen Join live class.
        const result = await api<{ classrooms: LiveClassroom[] }>("/api/bootstrap");
        if (cancelled) return;
        setLiveClassrooms(Object.fromEntries(result.classrooms.map((item) => [item.id, item])));
        statusChangeRef.current(result.classrooms);
        setRefreshError("");
      } catch (error) {
        if (!cancelled) setRefreshError(error instanceof Error ? error.message : "Could not refresh live classes");
      } finally {
        refreshing = false;
        if (refreshAgain) { refreshAgain = false; void refresh(); }
      }
    };
    const connect = async () => {
      if (connecting || stopListening || cancelled) return;
      connecting = true;
      try {
        const client = await realtimeClient(getApiUrl());
        if (cancelled) return;
        const stop = await listenForLiveClasses(client, JSON.parse(classroomIds), () => void refresh(), (available) => {
          if (!cancelled) setConnectionError(available ? "" : "Live invitations are unavailable. You can still enter a classroom.");
        });
        if (cancelled) { void stop(); return; }
        stopListening = stop;
      } catch {
        if (!cancelled) setConnectionError("Live invitations are unavailable. You can still enter a classroom.");
      } finally { connecting = false; }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") { void refresh(); void connect(); }
    };
    void refresh();
    void connect();
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      cancelled = true;
      void stopListening?.();
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [role, classroomIds, connectionAttempt]);

  if (role === "teacher" && classroom) return <TeacherClassDashboard key={classroom.id} classroom={classroom} name={name} onClasses={() => openClassroom(null)} onEnter={() => enterClassroom(classroom)} onLogout={onLogout} />;

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
        {role === "student" && (connectionError || refreshError) && (
          <div className="dashboard-error" role="status">
            <span>{refreshError || connectionError}</span>
            <button onClick={() => setConnectionAttempt((attempt) => attempt + 1)}>Reconnect</button>
          </div>
        )}
        {classroom ? (
          <div key={classroom.id}>
            <div className="dashboard-heading">
              <div>
                <button onClick={() => openClassroom(null)}>Classes</button>
                <h1>{classroom.name}</h1>
                <p>{classroom.subject}{role === "teacher" && classroom.joinCode ? ` · Code ${classroom.joinCode}` : ""}</p>
              </div>
              <div className="dashboard-actions">
                <LiveBadge classroom={classroom} />
                <button onClick={() => enterClassroom(classroom)}>Enter classroom</button>
              </div>
            </div>
            <StudentModules classroomId={classroom.id} selectedModuleId={selectedModuleId} onSelectModule={setSelectedModuleId} />
          </div>
        ) : (
          <>
            <div className="dashboard-heading">
              <div><span className="eyebrow">YOUR CLASSES</span><h1>Classes</h1><p>Open a class to see its modules{role === "teacher" ? " and students" : ""}.</p></div>
              {role === "teacher" ? <CreateClass onCreated={onRefresh} /> : <JoinAnotherClass onJoined={onRefresh} />}
            </div>
            {!classrooms.length && <div className="empty-activities"><b>{role === "teacher" ? "No classes yet" : "Join a class to see your modules"}</b></div>}
            {displayedClassrooms.map((item) => (
              <section className="class-summary" key={item.id}>
                <header>
                  <div><h2>{item.name}</h2><p>{item.subject}{role === "teacher" && item.joinCode ? ` · Code ${item.joinCode}` : ""}</p></div>
                  <div className="dashboard-actions">
                    <LiveBadge classroom={item} />
                    <button onClick={() => openClassroom(item.id)}>Open class</button>
                  </div>
                </header>
              </section>
            ))}
          </>
        )}
      </section>
      {!selectedModuleId && invitations.length > 0 && (
        <LiveClassInvitation classrooms={invitations} onJoin={enterClassroom} onDismiss={() => onDismissLiveClasses(invitations)} />
      )}
    </main>
  );
}
