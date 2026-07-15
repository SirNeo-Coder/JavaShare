"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const starterCode = `public class Main {
    public static void main(String[] args) {
        Student[] team = {
            new Student("Maya", 95),
            new Student("Liam", 88),
            new Student("Sofia", 92)
        };

        for (Student member : team) {
            System.out.println(member.name + ": " + member.score);
        }
    }
}

class Student {
    String name;
    int score;

    Student(String name, int score) {
        this.name = name;
        this.score = score;
    }
}`;

const teams = [
  { name: "Team Orion", members: "4 online", status: "Working", pct: 72, color: "blue" },
  { name: "Team Nova", members: "3 online", status: "Submitted", pct: 100, color: "orange" },
  { name: "Team Pixel", members: "2 online", status: "Needs help", pct: 45, color: "purple" },
];
const teamIds = ["team-orion", "team-nova", "team-pixel"];

export default function Home() {
  const [code, setCode] = useState(starterCode);
  const [activeTeam, setActiveTeam] = useState(0);
  const [panel, setPanel] = useState<"console" | "chat">("console");
  const [output, setOutput] = useState("Ready — click Run to compile Main.java");
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState("");
  const [version, setVersion] = useState(1);
  const [syncStatus, setSyncStatus] = useState("Connecting…");
  const codeRef = useRef(code);
  const versionRef = useRef(version);
  const lastServerCode = useRef(code);
  const lines = useMemo(() => code.split("\n").length, [code]);

  useEffect(() => { codeRef.current = code; }, [code]);
  useEffect(() => { versionRef.current = version; }, [version]);

  useEffect(() => {
    let active = true;
    const teamId = teamIds[activeTeam];
    setSyncStatus("Loading workspace…");

    async function loadWorkspace(initial = false) {
      try {
        const response = await fetch(`/api/workspace?team=${teamId}`, { cache: "no-store" });
        if (!response.ok) throw new Error("Workspace unavailable");
        const workspace = await response.json() as { code: string; version: number; updated_by: string };
        if (!active) return;
        if (initial || (workspace.version > versionRef.current && codeRef.current === lastServerCode.current)) {
          lastServerCode.current = workspace.code;
          setCode(workspace.code);
          setVersion(workspace.version);
        }
        setSyncStatus(workspace.updated_by.includes("local-teacher") ? "Saved locally" : `Synced with ${workspace.updated_by}`);
      } catch {
        if (active) setSyncStatus("Offline demo mode");
      }
    }

    loadWorkspace(true);
    const poll = setInterval(() => loadWorkspace(false), 2000);
    return () => { active = false; clearInterval(poll); };
  }, [activeTeam]);

  useEffect(() => {
    if (code === lastServerCode.current) return;
    setSyncStatus("Saving…");
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/workspace", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teamId: teamIds[activeTeam], code, version: versionRef.current }),
        });
        const result = await response.json() as { version?: number; latest?: { version: number }; error?: string };
        if (response.status === 409 && result.latest) {
          setVersion(result.latest.version);
          setSyncStatus("Merged with a newer team version");
          return;
        }
        if (!response.ok || !result.version) throw new Error(result.error);
        lastServerCode.current = code;
        setVersion(result.version);
        setSyncStatus("Everyone is in sync");
      } catch {
        setSyncStatus("Changes waiting to sync");
      }
    }, 700);
    return () => clearTimeout(timer);
  }, [code, activeTeam]);

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2600);
  }

  async function runCode() {
    setPanel("console");
    setOutput("Sending Main.java to the secure Java runner…");
    try {
      const response = await fetch("/api/execute", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const result = await response.json() as { output?: string; error?: string; mode?: string };
      if (!response.ok) throw new Error(result.error);
      setOutput(`${result.output ?? "Program completed without output."}${result.mode === "demo" ? "\n\n[Demo execution mode]" : ""}`);
    } catch (error) {
      setOutput(`Execution failed: ${error instanceof Error ? error.message : "Runner unavailable"}`);
    }
  }

  async function submitWork() {
    try {
      const response = await fetch("/api/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teamId: teamIds[activeTeam], code }) });
      if (!response.ok) throw new Error("Submission failed");
      setSubmitted(true);
      notify("Team work submitted for teacher review");
    } catch {
      notify("Could not submit while offline");
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">J</span><span>JavaShare</span><span className="teacher-pill">TEACHER</span></div>
        <div className="class-context"><b>CS 101 · Period 3</b><span>Object-Oriented Programming</span></div>
        <div className="header-actions"><button className="icon-button" aria-label="Notifications">♢<i /></button><div className="teacher-avatar">MS</div><div className="teacher-name"><b>Ms. Santos</b><span>Teacher</span></div><button className="chevron">⌄</button></div>
      </header>

      <section className="workspace">
        <aside className="sidebar">
          <div className="side-title"><span>TEAMS</span><button aria-label="Add team" onClick={() => notify("New team creation is ready for backend setup")}>＋</button></div>
          <div className="team-list">
            {teams.map((team, index) => (
              <button className={`team-card ${activeTeam === index ? "active" : ""}`} key={team.name} onClick={() => { setActiveTeam(index); setSubmitted(team.status === "Submitted"); }}>
                <span className={`team-icon ${team.color}`}>{team.name.split(" ")[1][0]}</span>
                <span className="team-copy"><b>{team.name}</b><small><i className="online-dot" />{team.members}</small></span>
                <span className={`status ${team.status.toLowerCase().replace(" ", "-")}`}>{team.status}</span>
              </button>
            ))}
          </div>

          <div className="assignment-block">
            <span className="eyebrow">CURRENT ASSIGNMENT</span>
            <h3>Student Grade Tracker</h3>
            <p>Build a program using classes, arrays, and loops.</p>
            <div className="due"><span>◷</span><span><small>Due today</small><b>11:59 PM</b></span></div>
            <button className="brief-button" onClick={() => notify("Assignment brief opened")}>View assignment brief <span>↗</span></button>
          </div>

          <button className="all-teams" onClick={() => notify("Showing all 9 students")}>⌘ View all students <span>9</span></button>
        </aside>

        <section className="main-area">
          <div className="team-header">
            <div><div className="team-heading"><span className="team-icon blue">{teams[activeTeam].name.split(" ")[1][0]}</span><div><h1>{teams[activeTeam].name}</h1><p>Student Grade Tracker · Main.java</p></div></div></div>
            <div className="presence"><div className="avatars"><span className="av a1">MC</span><span className="av a2">LK</span><span className="av a3">SR</span><span className="av a4">＋</span></div><span><b>{teams[activeTeam].members.split(" ")[0]} students</b><small><i className="online-dot" /> Live now</small></span></div>
            <div className="team-buttons"><button className="secondary" onClick={() => setPanel("chat")}>▱ Team chat <span className="count">3</span></button><button className="secondary" onClick={() => notify("Teacher feedback panel is ready")}>✎ Give feedback</button></div>
          </div>

          <div className="content-grid">
            <section className="editor-card">
              <div className="file-tabs"><button className="file-tab active"><span className="java-icon">J</span>Main.java <i className="unsaved" /></button><button className="add-file" aria-label="Add file" onClick={() => notify("Create-file flow is ready")}>＋</button><span className="editing-now"><i className="online-dot" /> Maya is editing line 8</span></div>
              <div className="editor-wrap">
                <div className="line-numbers" aria-hidden="true">{Array.from({ length: lines }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
                <textarea value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} aria-label="Java source code editor" />
              </div>
              <div className="editor-status"><span>Main.java</span><span>Java 21</span><span>Version {version}</span><span className="saved">✓ {syncStatus}</span></div>
            </section>

            <aside className="right-panel">
              <div className="panel-tabs"><button className={panel === "console" ? "active" : ""} onClick={() => setPanel("console")}>Console</button><button className={panel === "chat" ? "active" : ""} onClick={() => setPanel("chat")}>Team chat <i /></button><button aria-label="Expand panel">↗</button></div>
              {panel === "console" ? <pre className="console">{output}</pre> : <div className="chat"><div><b>Maya</b><p>I added the Student class. Can someone check the constructor?</p></div><div><b>Liam</b><p>Looks good! I’ll work on calculating the average.</p></div><div className="teacher-msg"><b>Ms. Santos</b><p>Nice teamwork. Remember to handle an empty student list.</p></div><input placeholder="Message the team…" aria-label="Message the team" /></div>}
              <div className="checks"><span className="eyebrow">AUTOMATED CHECKS</span><div><span>✓</span><p><b>Program compiles</b><small>Passed</small></p></div><div><span>✓</span><p><b>Uses a Student class</b><small>Passed</small></p></div><div className="pending"><span>○</span><p><b>Calculates class average</b><small>Not run yet</small></p></div></div>
            </aside>
          </div>

          <footer className="actionbar">
            <div><span className="sync"><i className="online-dot" /> {syncStatus}</span><button className="link-button" onClick={() => notify("Version history opened")}>↶ Version history</button></div>
            <div><button className="run-button" onClick={runCode}>▶ Run code <kbd>Ctrl ↵</kbd></button><button className={`submit-button ${submitted ? "done" : ""}`} onClick={submitWork}>{submitted ? "✓ Submitted" : "Submit for review"}</button></div>
          </footer>
        </section>
      </section>
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
