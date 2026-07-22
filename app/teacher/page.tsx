"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
type SubmittedFile = { path?: string; language?: string; content?: string };
type WorkspaceStatus = { projectId: string; workspaceName: string; members: { id: string; name: string; email: string; isLeader?: boolean }[]; status: "done" | "pending"; submittedAt: string | null; submission: { id: string; status: "submitted" | "reviewed"; files: SubmittedFile[] } | null };
type ActivitySummary = { id: string; title: string; description: string; mode: "individual" | "group"; createdAt: string; endedAt: string | null; isActive: boolean; total: number; completed: number; pending: number; workspaces: WorkspaceStatus[] };
type ClassroomSummary = { id: string; name: string; subject: string; currentActivityId: string | null; activities: ActivitySummary[] };
type Summary = { teacher: { name: string }; classrooms: ClassroomSummary[] };

async function getSummary() {
  const response = await fetch(`${API_URL}/api/teacher/activity-summary`, { credentials: "include" });
  const body = await response.json();
  if (!response.ok) throw new Error(body?.error || "Could not load activity summary");
  return body as Summary;
}

const workspaceKey = (workspace: WorkspaceStatus) => workspace.members.map((member) => member.id).sort().join(":") || workspace.workspaceName;

export default function TeacherActivityPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<{ activity: ActivitySummary; workspace: WorkspaceStatus } | null>(null);
  const [activeFile, setActiveFile] = useState(0);
  const [managingId, setManagingId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ classroom: ClassroomSummary; activity: ActivitySummary } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("javashare-theme");
    document.documentElement.dataset.theme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const savedScale = Number(localStorage.getItem("javashare-font-scale"));
    if (savedScale >= 1 && savedScale <= 1.45) document.documentElement.style.setProperty("--ui-scale", String(savedScale));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try { setSummary(await getSummary()); }
    catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Could not load activity summary"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    getSummary().then((result) => { if (active) setSummary(result); }).catch((loadError) => { if (active) setError(loadError instanceof Error ? loadError.message : "Could not load activity summary"); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!review && !deleteTarget) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") { setReview(null); setDeleteTarget(null); } };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [review, deleteTarget]);

  const totals = useMemo(() => {
    const activities = summary?.classrooms.flatMap((classroom) => classroom.activities) || [];
    return { activities: activities.length, completed: activities.reduce((sum, activity) => sum + activity.completed, 0), pending: activities.reduce((sum, activity) => sum + activity.pending, 0) };
  }, [summary]);

  const reopenActivity = async (classroom: ClassroomSummary, activity: ActivitySummary) => {
    setManagingId(activity.id); setError("");
    try {
      const response = await fetch(`${API_URL}/api/classes/${classroom.id}/activities/${activity.id}/reopen`, { method: "POST", credentials: "include" });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "Could not reopen activity");
      await refresh();
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Could not reopen activity"); }
    finally { setManagingId(""); }
  };

  const deleteActivity = async () => {
    if (!deleteTarget) return;
    const { classroom, activity } = deleteTarget;
    setManagingId(activity.id); setError("");
    try {
      const response = await fetch(`${API_URL}/api/classes/${classroom.id}/activities/${activity.id}`, { method: "DELETE", credentials: "include" });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || "Could not delete activity");
      setDeleteTarget(null);
      await refresh();
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Could not delete activity"); }
    finally { setManagingId(""); }
  };

  return <main className="teacher-dashboard">
    <header className="dashboard-topbar"><Link href="/" className="dashboard-brand"><span className="brand-mark">J</span><span><b>JavaShare</b><small>Teacher activity summary</small></span></Link><div className="dashboard-actions"><span>{summary?.teacher.name || "Teacher"}</span><button onClick={refresh} disabled={loading}>Refresh</button><Link href="/teacher/accounts">Student accounts</Link><Link href="/">Back to classroom</Link></div></header>
    <section className="dashboard-content">
      <div className="dashboard-heading"><div><span className="eyebrow">CLASSROOM OVERVIEW</span><h1>Submitted activities</h1><p>Review submissions, reopen ended work, or remove activities you no longer need.</p></div></div>
      {error && <div className="dashboard-error"><b>Activity action needs attention</b><span>{error}</span><button onClick={() => setError("")}>Dismiss</button></div>}
      <div className="summary-metrics"><article><span>Activities</span><b>{totals.activities}</b><small>Deployed assignments</small></article><article className="complete"><span>Completed</span><b>{totals.completed}</b><small>Submitted workspaces</small></article><article className="pending"><span>Still pending</span><b>{totals.pending}</b><small>Open for editing</small></article></div>
      {loading && !summary ? <div className="dashboard-loading">Loading classroom activities…</div> : summary?.classrooms.map((classroom) => {
        const rows = Array.from(new Map(classroom.activities.flatMap((activity) => activity.workspaces).map((workspace) => [workspaceKey(workspace), workspace])).entries());
        return <section className="class-summary" key={classroom.id}>
          <header><div><h2>{classroom.name}</h2><p>{classroom.subject}</p></div><span>{classroom.activities.length} {classroom.activities.length === 1 ? "activity" : "activities"}</span></header>
          {classroom.activities.length ? <div className="submission-matrix-wrap"><table className="submission-matrix">
            <thead><tr><th>Student / group</th>{classroom.activities.map((activity) => <th key={activity.id}>
              <div className="activity-column-top"><span className={`mode-badge ${activity.mode}`}>{activity.mode}</span><span className={`activity-state ${activity.isActive ? "active" : "ended"}`}>{activity.isActive ? "Open" : "Ended"}</span></div>
              <b>{activity.title}</b><small>{activity.completed}/{activity.total} submitted</small>
              <div className="activity-column-actions">{!activity.isActive && <button disabled={Boolean(classroom.currentActivityId) || managingId === activity.id} title={classroom.currentActivityId ? "End the currently open activity first" : activity.mode === "group" ? "Current groups will receive this activity" : "Students will receive this activity again"} onClick={() => void reopenActivity(classroom, activity)}>Reopen</button>}<button className="delete-activity-button" disabled={activity.isActive || managingId === activity.id} title={activity.isActive ? "End this activity before deleting it" : "Permanently delete activity"} onClick={() => setDeleteTarget({ classroom, activity })}>Delete</button></div>
            </th>)}</tr></thead>
            <tbody>{rows.map(([rowKey, identity]) => <tr key={rowKey}><th><b>{identity.members.map((member) => member.name).join(", ") || identity.workspaceName}</b><small>{identity.members.length > 1 ? `${identity.workspaceName} · Leader: ${identity.members.find((member) => member.isLeader)?.name || "Not elected"}` : identity.members[0]?.email || "Student workspace"}</small></th>{classroom.activities.map((activity) => { const workspace = activity.workspaces.find((item) => workspaceKey(item) === rowKey); return <td key={activity.id}>{workspace?.submission ? <button className="submitted-code-button" onClick={() => { setActiveFile(0); setReview({ activity, workspace }); }}><b>Submitted</b><small>{workspace.submittedAt ? new Date(workspace.submittedAt).toLocaleString() : "View code"}</small></button> : <span className="pending-code"><b>Pending</b><small>Not submitted</small></span>}</td>; })}</tr>)}</tbody>
          </table></div> : <div className="empty-activities"><b>No activities deployed yet</b><p>Return to the classroom and select New activity to get started.</p><Link href="/">Create an activity</Link></div>}
        </section>;
      })}
    </section>
    {review && <div className="submission-review-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setReview(null); }}><section className="submission-review-card" role="dialog" aria-modal="true" aria-labelledby="submission-review-title"><header><div><span className="eyebrow">SUBMITTED CODE</span><h2 id="submission-review-title">{review.workspace.workspaceName}</h2><p>{review.activity.title} · Submitted {review.workspace.submittedAt ? new Date(review.workspace.submittedAt).toLocaleString() : "recently"}</p><div className="submission-roster"><b>Members</b>{review.workspace.members.map((member) => <span key={member.id}>{member.name}{member.isLeader && <i>Leader</i>}</span>)}</div></div><button onClick={() => setReview(null)} aria-label="Close submitted code">×</button></header><div className="submission-file-tabs">{review.workspace.submission?.files.map((file, index) => <button className={activeFile === index ? "active" : ""} key={`${file.path || "file"}-${index}`} onClick={() => setActiveFile(index)}><span className="java-icon">J</span>{file.path || `File ${index + 1}`}</button>)}</div><pre className="submitted-code-view"><code>{review.workspace.submission?.files[activeFile]?.content || "No code was included in this submission."}</code></pre><footer><span>Read-only submission snapshot</span><button onClick={() => setReview(null)}>Close review</button></footer></section></div>}
    {deleteTarget && <div className="confirm-overlay"><section className="confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="delete-activity-title"><span className="confirm-icon danger">!</span><div className="confirm-copy"><span className="eyebrow">PERMANENT DELETE</span><h2 id="delete-activity-title">Delete {deleteTarget.activity.title}?</h2><p>This permanently removes the activity, student code workspaces, submissions, credits, and saved copies. This action cannot be undone.</p></div><div className="confirm-actions"><button onClick={() => setDeleteTarget(null)} disabled={Boolean(managingId)}>Cancel</button><button className="confirm-danger" onClick={() => void deleteActivity()} disabled={Boolean(managingId)}>{managingId ? "Deleting…" : "Delete activity"}</button></div></section></div>}
  </main>;
}
