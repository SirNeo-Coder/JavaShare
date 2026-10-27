"use client";

import { useEffect, useState } from "react";
import { api } from "./apiClient";
import type { getSupabaseModuleSharing } from "../backend/src/supabase-repository";

type Sharing = Awaited<ReturnType<typeof getSupabaseModuleSharing>>;
type Subject = Sharing["subject"];

export default function ModuleSharing({ classroomId, onReady, onChanged }: {
  classroomId: string; onReady: (subject: Subject) => void; onChanged: () => void;
}) {
  const [data, setData] = useState<Sharing | null>(null);
  const [choice, setChoice] = useState("java");
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    api<Sharing>(`/api/classrooms/${classroomId}/module-sharing`)
      .then((result) => { if (!cancelled) { setData(result); onReady(result.subject); } })
      .catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load module sharing"); });
    return () => { cancelled = true; };
  }, [classroomId, revision, onReady]);

  const change = async (path: string, method: string, body: object) => {
    setBusy(true); setError("");
    try {
      await api(path, { method, body: JSON.stringify(body) });
      setRevision((value) => value + 1); onChanged();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save module sharing"); }
    finally { setBusy(false); }
  };
  const label = data?.subject === "java" ? "Java" : "Net MVC";
  return <section className="module-sharing" aria-label="Subject module sharing">
    {error && <p role="alert">{error}</p>}
    {!data ? <p>Loading class subject…</p> : !data.subject ? <>
      <h2>Choose this class’s subject</h2>
      <p>Each class uses one module set: Java or Net MVC. This choice cannot be changed after saving. Existing uploads and student work are kept.</p>
      <label>Subject <select value={choice} onChange={(event) => setChoice(event.target.value)} disabled={busy}><option value="java">Java</option><option value="net-mvc">Net MVC</option></select></label>{" "}
      <button disabled={busy} onClick={() => void change(`/api/classrooms/${classroomId}/module-subject`, "PATCH", { subject: choice })}>Use {choice === "java" ? "Java" : "Net MVC"} for this class</button>
    </> : <>
      <p><strong>{label} modules</strong> — shared across all your {label} classes. Uploading a correction updates every class in this subject. New {label} classes receive the same set.</p>
      {data.savedUploads.length > 0 && <details><summary>Saved uploads from this class</summary>
        <p>These original copies are kept. Share a matching upload to add it to the subject’s module set.</p>
        <ul>{data.savedUploads.map((item) => <li key={item.moduleId}>
          <span>{item.title}</span>{" "}
          {!item.matchesSubject ? <span>Kept as a backup — belongs to the other subject.</span> : item.sameContent ? <span>Already shared.</span> : <button disabled={busy} onClick={() => {
            if (item.sharedUpdatedAt && !window.confirm(`Replace the shared version of ${item.title} with this class’s saved copy for ALL your ${label} classes? Student work and progress will be kept, but changed activities may affect completion.`)) return;
            void change(`/api/classrooms/${classroomId}/modules/${encodeURIComponent(item.moduleId)}/share`, "POST", item.sharedUpdatedAt ? { expectedUpdatedAt: item.sharedUpdatedAt } : {});
          }}>{item.sharedUpdatedAt ? "Replace shared version" : `Share across ${label} classes`}</button>}
        </li>)}</ul>
      </details>}
    </>}
  </section>;
}
