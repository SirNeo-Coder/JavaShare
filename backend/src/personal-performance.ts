import type { ModuleFile } from "./module-activities.ts";

export type PersonalSubmission = {
  files: ModuleFile[]; status: "pass" | "fail"; submittedAt: string;
  id?: string; checklist?: string[]; legacyChecklist?: boolean;
  review?: { checked: boolean[]; savedAt: string };
};

// Week 20 is the agreed paper proposal, even though its upload contains a Java placeholder.
export function paperPerformanceTask(module: { course: string; week: number }) {
  return module.course === "java-2" && module.week === 20;
}

export function personalProjectFiles(starters: ModuleFile[], previous: { own?: PersonalSubmission; project?: { files: ModuleFile[] } } | undefined,
  current: { own?: PersonalSubmission; project?: { files: ModuleFile[] } }) {
  return current.project?.files ?? current.own?.files ?? previous?.own?.files ?? previous?.project?.files ?? starters;
}
