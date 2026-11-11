"use client";

import { useEffect, useId, useState } from "react";
import { api } from "./apiClient";
import type { getSupabaseSessionStepProgress } from "../backend/src/supabase-repository";

type StepProgress = Awaited<ReturnType<typeof getSupabaseSessionStepProgress>>;

// Class session bar: how many students finished the step the class is on; hover or focus lists them
// (teacher, 2026-11-11). revision changes when the followed page moves or a student finishes a task.
export default function SessionStepDone({ classroomId, revision }: { classroomId: string; revision: number }) {
  const [data, setData] = useState<StepProgress | null>(null);
  const listId = useId();
  useEffect(() => {
    let active = true;
    api<StepProgress>(`/api/classes/${classroomId}/session/step-progress`)
      .then((result) => { if (active) setData(result); }, () => { if (active) setData(null); });
    return () => { active = false; };
  }, [classroomId, revision]);
  if (!data?.step) return null;
  const total = data.done.length + data.notDone.length;
  const names = (list: string[]) => list.length ? <ul>{list.map((name, index) => <li key={index}>{name}</li>)}</ul> : <p>Nobody yet</p>;
  return <div className="session-step-done">
    <button type="button" aria-describedby={listId}>Step {data.step.number} · <b>{data.done.length}/{total}</b> done</button>
    <div id={listId} role="tooltip">
      <b>Done ({data.done.length})</b>{names(data.done)}
      <b>Not yet ({data.notDone.length})</b>{names(data.notDone)}
    </div>
  </div>;
}
