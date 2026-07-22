"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

type Student = {
  id: string;
  name: string;
  email: string;
  passwordResetRequired: boolean;
  passwordResetRequestedAt: string | null;
  joinedAt: string;
  hasWorkspace: boolean;
  online: boolean;
};

async function api<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...options.headers } });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(body?.error || "Request failed");
  return body as T;
}

export default function StudentAccountsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState("");
  const [resetApproved, setResetApproved] = useState<{ name: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("javashare-theme");
    document.documentElement.dataset.theme = savedTheme === "dark" ? "dark" : "light";
  }, []);

  useEffect(() => {
    let active = true;
    const loadStudents = (initial = false) => api<{ students: Student[] }>("/api/teacher/students")
      .then((result) => { if (active) { setStudents(result.students); if (initial) setError(""); } })
      .catch((loadError) => { if (active && initial) setError(loadError instanceof Error ? loadError.message : "Could not load student accounts"); })
      .finally(() => { if (active && initial) setLoading(false); });
    void loadStudents(true);
    const interval = window.setInterval(() => void loadStudents(), 5000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  useEffect(() => {
    if (!pendingDelete) return;
    function closeOnEscape(event: KeyboardEvent) { if (event.key === "Escape" && !workingId) setPendingDelete(null); }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [pendingDelete, workingId]);

  const visibleStudents = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? students.filter((student) => `${student.name} ${student.email}`.toLowerCase().includes(term)) : students;
  }, [query, students]);

  async function resetPassword(student: Student) {
    setWorkingId(student.id); setError("");
    try {
      await api(`/api/teacher/students/${student.id}/reset-password`, { method: "POST" });
      setStudents((items) => items.map((item) => item.id === student.id ? { ...item, passwordResetRequired: true, passwordResetRequestedAt: null } : item));
      setResetApproved({ name: student.name });
    } catch (resetError) { setError(resetError instanceof Error ? resetError.message : "Could not reset password"); }
    finally { setWorkingId(""); }
  }

  async function deleteStudent(student: Student) {
    setWorkingId(student.id); setError("");
    try {
      await api(`/api/teacher/students/${student.id}`, { method: "DELETE" });
      setStudents((items) => items.filter((item) => item.id !== student.id));
      setPendingDelete(null);
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Could not delete account"); }
    finally { setWorkingId(""); }
  }

  function openEdit(student: Student) {
    setEditingStudent(student); setEditName(student.name); setEditEmail(student.email); setError("");
  }

  async function saveStudent(event: React.FormEvent) {
    event.preventDefault();
    if (!editingStudent) return;
    setWorkingId(editingStudent.id); setError("");
    try {
      const result = await api<{ student: Pick<Student, "id" | "name" | "email"> }>(`/api/teacher/students/${editingStudent.id}`, { method: "PATCH", body: JSON.stringify({ name: editName, email: editEmail }) });
      setStudents((items) => items.map((item) => item.id === result.student.id ? { ...item, ...result.student } : item));
      setEditingStudent(null);
    } catch (editError) { setError(editError instanceof Error ? editError.message : "Could not update student details"); }
    finally { setWorkingId(""); }
  }

  return <main className="teacher-dashboard account-dashboard">
    <header className="dashboard-topbar">
      <Link href="/" className="dashboard-brand"><span className="brand-mark">J</span><span><b>JavaShare</b><small>Student account management</small></span></Link>
      <div className="dashboard-actions"><Link href="/teacher">Activity summary</Link><Link href="/">Back to classroom</Link></div>
    </header>
    <section className="dashboard-content">
      <div className="accounts-heading"><div><span className="eyebrow">TEACHER ADMIN</span><h1>Student accounts</h1><p>Edit student details, reset forgotten passwords, or remove accounts.</p></div><label className="student-search"><span>Search students</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or school email" /></label></div>
      <div className="account-metrics"><article><span>Total students</span><b>{students.length}</b></article><article><span>Online now</span><b>{students.filter((student) => student.online).length}</b></article><article><span>Reset requests</span><b>{students.filter((student) => student.passwordResetRequestedAt).length}</b></article><article><span>Awaiting new password</span><b>{students.filter((student) => student.passwordResetRequired).length}</b></article></div>
      {error && <div className="dashboard-error"><b>Account action could not be completed</b><span>{error}</span></div>}
      <section className="student-account-card">
        <div className="student-account-row student-account-header"><span>Student</span><span>Live / account status</span><span>Actions</span></div>
        {loading ? <div className="account-empty">Loading student accounts…</div> : visibleStudents.length ? visibleStudents.map((student) => <div className="student-account-row" key={student.id}>
          <span className="student-identity"><i>{student.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</i><span><b>{student.name}</b><small>{student.email}</small></span></span>
          <span><i className={`account-status ${student.passwordResetRequestedAt ? "requested" : student.passwordResetRequired ? "reset" : student.online ? "active" : "offline"}`}>{student.passwordResetRequestedAt ? "Reset requested" : student.passwordResetRequired ? "Reset pending" : student.online ? "Online" : "Offline"}</i><small className="account-detail">{student.passwordResetRequestedAt ? `Requested ${new Date(student.passwordResetRequestedAt).toLocaleString()}` : student.passwordResetRequired ? "Must choose a new password" : student.online ? "Connected to this JavaShare server" : student.hasWorkspace ? "Account enabled · not connected" : "No workspace yet"}</small></span>
          <span className="account-actions"><button onClick={() => openEdit(student)} disabled={workingId === student.id}>Edit details</button><button className={student.passwordResetRequestedAt ? "approve-reset" : ""} onClick={() => resetPassword(student)} disabled={workingId === student.id}>{workingId === student.id ? "Working…" : student.passwordResetRequestedAt ? "Approve reset" : "Reset password"}</button><button className="delete-account" onClick={() => setPendingDelete(student)} disabled={workingId === student.id}>Delete account</button></span>
        </div>) : <div className="account-empty">{query ? "No students match your search." : "No students have joined your classroom yet."}</div>}
      </section>
    </section>
    {resetApproved && <div className="activity-overlay"><section className="activity-modal reset-result-modal"><header><div><span className="eyebrow">PASSWORD RESET APPROVED</span><h2>{resetApproved.name} can create a new password</h2><p>The account is now flagged for a required password change. You do not need to create or share a temporary password.</p></div><button onClick={() => setResetApproved(null)} aria-label="Close">×</button></header><div className="reset-approved-message"><span aria-hidden="true">✓</span><p><b>Reset is ready</b><small>Ask the student to enter their school email on the login screen and leave the password blank. JavaShare will then ask them to create and confirm their own password.</small></p></div><div className="reset-steps"><b>What happens next?</b><span>1. The student enters their school email on the login screen.</span><span>2. JavaShare tells them the teacher reset their password.</span><span>3. The student creates and confirms their own new password.</span></div><footer><button className="deploy-button" onClick={() => setResetApproved(null)}>Done</button></footer></section></div>}
    {pendingDelete && <div className="confirm-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !workingId) setPendingDelete(null); }}><section className="confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="delete-account-title" aria-describedby="delete-account-description"><div className="confirm-icon danger" aria-hidden="true">!</div><div className="confirm-copy"><span className="eyebrow">DELETE STUDENT</span><h2 id="delete-account-title">Delete {pendingDelete.name}&apos;s account?</h2><p id="delete-account-description">Their personal workspace, saved work, and account access will be permanently deleted. This action cannot be undone.</p></div><div className="confirm-actions"><button onClick={() => setPendingDelete(null)} disabled={Boolean(workingId)} autoFocus>Keep account</button><button className="confirm-danger" onClick={() => deleteStudent(pendingDelete)} disabled={Boolean(workingId)}>{workingId ? "Deleting…" : "Delete account"}</button></div></section></div>}
    {editingStudent && <div className="activity-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !workingId) setEditingStudent(null); }}><section className="activity-modal student-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-student-title"><header><div><span className="eyebrow">EDIT STUDENT</span><h2 id="edit-student-title">Student details</h2><p>Changing the email also changes the address used to sign in.</p></div><button type="button" onClick={() => setEditingStudent(null)} aria-label="Close">×</button></header><form onSubmit={saveStudent}><label>Full name<input value={editName} onChange={(event) => setEditName(event.target.value)} minLength={2} maxLength={80} required autoFocus /></label><label>School email<input type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} maxLength={254} required /></label><footer><button type="button" onClick={() => setEditingStudent(null)} disabled={Boolean(workingId)}>Cancel</button><button className="deploy-button" disabled={Boolean(workingId)}>{workingId ? "Saving…" : "Save changes"}</button></footer></form></section></div>}
  </main>;
}
