"use client";

import { useEffect, useId, useState } from "react";
import { api } from "./apiClient";
import type { getSupabaseSessionStepProgress } from "../backend/src/supabase-repository";

type StepProgress = Awaited<ReturnType<typeof getSupabaseSessionStepProgress>>;
type Student = { id: string; name: string };

// Only students online now count (teacher, 2026-11-20). Done: a saved pass of the step, or a matching class-step run
// this page load, which the student's device reports on the class live channel as "moduleId:stepId" (CKB-129).
export function onlineStepDone(data: { step: { moduleId: string; stepId: string }; done: Student[]; notDone: Student[] }, online: string[], practiceDone: Record<string, string[]>) {
  const key = `${data.step.moduleId}:${data.step.stepId}`;
  const all = [...data.done, ...data.notDone].filter((student) => online.includes(student.id)).sort((a, b) => a.name.localeCompare(b.name));
  const done = (student: Student) => data.done.includes(student) || Boolean(practiceDone[student.id]?.includes(key));
  return { done: all.filter(done).map((student) => student.name), notDone: all.filter((student) => !done(student)).map((student) => student.name) };
}

// Class session bar: how many students finished the step the class is on; hover or focus lists them
// (teacher, 2026-11-11). revision changes when the followed page moves or a student finishes a task.
export default function SessionStepDone({ classroomId, revision, online, practiceDone }: { classroomId: string; revision: number; online: string[]; practiceDone: Record<string, string[]> }) {
  const [data, setData] = useState<StepProgress | null>(null);
  const listId = useId();
  useEffect(() => {
    let active = true;
    api<StepProgress>(`/api/classes/${classroomId}/session/step-progress`)
      .then((result) => { if (active) setData(result); }, () => { if (active) setData(null); });
    return () => { active = false; };
  }, [classroomId, revision]);
  if (!data?.step) return null;
  const { done, notDone } = onlineStepDone(data, online, practiceDone);
  const total = done.length + notDone.length;
  const names = (list: string[]) => list.length ? <ul>{list.map((name, index) => <li key={index}>{name}</li>)}</ul> : <p>Nobody yet</p>;
  return <div className="session-step-done">
    <button type="button" aria-describedby={listId}>Step {data.step.number} · <b>{done.length}/{total}</b> done</button>
    <div id={listId} role="tooltip">
      <b>Done ({done.length})</b>{names(done)}
      <b>Not yet ({notDone.length})</b>{names(notDone)}
    </div>
  </div>;
}
