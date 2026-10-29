import type { ModuleFile } from "./module-activities.ts";

// A student's own picture, sound or video: its path in the project and the id of its copy in R2.
// Every upload is a new copy, so a frozen submission keeps the copies it was submitted with (teacher, 2026-10-29).
export type PersonalMedia = { path: string; id: string; size: number };

export type PersonalSubmission = {
  files: ModuleFile[]; media?: PersonalMedia[]; status: "pass" | "fail"; submittedAt: string;
  id?: string; checklist?: string[]; legacyChecklist?: boolean;
  review?: { checked: boolean[]; savedAt: string };
};

// Week 20 is the agreed paper proposal, even though its upload contains a Java placeholder.
export function paperPerformanceTask(module: { course: string; week: number }) {
  return module.course === "java-2" && module.week === 20;
}

// The files and media carry forward together from the same source.
type PersonalSource = { files: ModuleFile[]; media?: PersonalMedia[] };
export function personalProjectFiles(starters: ModuleFile[], previous: { own?: PersonalSubmission; project?: PersonalSource } | undefined,
  current: { own?: PersonalSubmission; project?: PersonalSource }): PersonalSource {
  const { files, media } = current.project ?? current.own ?? previous?.own ?? previous?.project ?? { files: starters };
  return { files, media };
}
