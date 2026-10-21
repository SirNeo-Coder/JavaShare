"use client";

// Class chooser and teacher class home; student modules live in the classroom.
import { useEffect, useRef, useState } from "react";
import { api, getApiUrl } from "./apiClient";
import { realtimeClient } from "./realtime";
import { listenForLiveClasses, pendingLiveClasses, type LiveClassroom } from "./liveClasses";
import TeacherClassDashboard from "./TeacherClassDashboard";

type LandingClassroom = LiveClassroom;
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
      await api("/api/classes", { method: "POST", body: JSON.stringify({ name, subject }) });
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
        Subject
        <select value={subject} onChange={(event) => setSubject(event.target.value)} required><option value="" disabled>Choose a subject</option><option>Java</option><option>Net MVC</option></select>
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
  const [selectedClassroomId, setSelectedClassroomId] = useState(role === "teacher" ? initialClassroomId ?? null : null);
  const [liveClassrooms, setLiveClassrooms] = useState<Record<string, LiveClassroom>>({});
  const displayedClassrooms = classrooms.map((item) => liveClassrooms[item.id] || item);
  const classroom = displayedClassrooms.find((item) => item.id === selectedClassroomId);
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

  if (role === "teacher" && classroom) return <TeacherClassDashboard key={classroom.id} classroom={classroom} name={name} onClasses={() => setSelectedClassroomId(null)} onEnter={() => enterClassroom(classroom)} onLogout={onLogout} />;

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
        <div className="dashboard-heading">
          <div><span className="eyebrow">YOUR CLASSES</span><h1>Classes</h1><p>{role === "teacher" ? "Open a class to see its modules and students." : "Choose a class to enter its classroom."}</p></div>
          {role === "teacher" ? <CreateClass onCreated={onRefresh} /> : <JoinAnotherClass onJoined={onRefresh} />}
        </div>
        {!classrooms.length && <div className="empty-activities"><b>{role === "teacher" ? "No classes yet" : "Join a class to enter its classroom"}</b></div>}
        {displayedClassrooms.map((item) => (
          <section className="class-summary" key={item.id}>
            <header>
              <div><h2>{item.name}</h2><p>{item.subject}{role === "teacher" && item.joinCode ? ` · Code ${item.joinCode}` : ""}</p></div>
              <div className="dashboard-actions">
                <LiveBadge classroom={item} />
                <button onClick={() => role === "student" ? enterClassroom(item) : setSelectedClassroomId(item.id)}>Open class</button>
              </div>
            </header>
          </section>
        ))}
      </section>
      {invitations.length > 0 && (
        <LiveClassInvitation classrooms={invitations} onJoin={enterClassroom} onDismiss={() => onDismissLiveClasses(invitations)} />
      )}
    </main>
  );
}
