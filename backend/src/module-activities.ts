import type { CourseModule } from "./course-module-schema.ts";

export type ModuleFile = { path: string; content: string };
export type ActivityStep = Extract<CourseModule["lessons"][number]["blocks"][number], { type: "step" }>;

// Explicit task ids opt in; legacy samples/challenges keep their existing completion records.
export function activityStateId(step: { id: string; activity?: { id?: string } }) {
  return step.activity?.id ? `task:${step.activity.id}` : step.id;
}

export function sampleStateId(step: { activity?: { id?: string } }) { return `sample:${step.activity?.id}`; }

export function samplePending(module: { sampleFirst?: boolean }, step: { id: string; activity?: { id?: string } }, states: Record<string, string>) {
  return Boolean(module.sampleFirst && step.activity?.id && states[activityStateId(step)] !== "pass" && states[sampleStateId(step)] !== "pass");
}

export type ActivityProjects = { activeKey?: string; drafts?: Record<string, ModuleFile[]>; beforeSampleFiles?: ModuleFile[]; checkpoints?: Record<string, { id: string; moduleVersion: string }> };

export function activityTask(step: { instruction: string; files: ModuleFile[]; expectedOutput: string; stdin?: string;
  activity?: { id?: string; instruction: string; files: ModuleFile[]; expectedOutput: string; stdin?: string } }) {
  return step.activity?.id ? step.activity : step;
}

// Same author-defined parts as the worksheet, including parts spanning several lessons.
export function activityParts(module: CourseModule) {
  const parts: { id: string; stepIds: string[] }[] = [];
  for (const lesson of module.lessons) {
    const steps = lesson.blocks.filter((block) => block.type === "step");
    if (!steps.length) parts.push({ id: lesson.id, stepIds: [] });
    for (const step of steps) {
      const id = step.part ? `part:${step.part}` : lesson.id;
      let part = parts.find((item) => item.id === id);
      if (!part) { part = { id, stepIds: [] }; parts.push(part); }
      part.stepIds.push(activityStateId(step));
    }
  }
  return parts;
}

export function activityAccess(module: CourseModule, states: Record<string, string>) {
  let previousDone = true;
  const parts = activityParts(module).map((part) => {
    const done = part.stepIds.every((id) => states[id] === "pass");
    const open = previousDone || done;
    previousDone = previousDone && done;
    return { ...part, done, open };
  });
  const steps = module.lessons.flatMap((lesson) => lesson.blocks).filter((block) => block.type === "step");
  let openStepIds = parts.filter((part) => part.open).flatMap((part) => part.stepIds);
  if (steps.some((step) => step.activity?.id)) {
    let precedingDone = true;
    openStepIds = steps.flatMap((step) => {
      const id = activityStateId(step), done = states[id] === "pass";
      const open = precedingDone || done;
      precedingDone &&= done;
      return open ? [id] : [];
    });
    for (const part of parts) part.open = part.stepIds.some((id) => openStepIds.includes(id)) || !part.stepIds.length;
  }
  return { parts, openStepIds, performanceTaskOpen: parts.every((part) => part.done) };
}

export function findActivity(module: CourseModule, stepId: string) {
  return module.lessons.flatMap((lesson) => lesson.blocks).find((block): block is ActivityStep => block.type === "step" && block.id === stepId);
}

// Java strips src/ before compiling; treat those two paths as the same source file. Web files keep src/.
export function sourcePath(path: string) { return path.replace(/\\/g, "/").replace(/^src\/(?=.*\.java$)/, ""); }

// A web step is decided by its files' endings, not a module field (teacher, 2026-10-28).
export function webStep(step: { files?: ModuleFile[] }) {
  return Boolean(step.files?.length) && step.files!.every((file) => /\.(?:html|css|js)$/.test(file.path));
}

export function checkableStep(step: { language: string; files: ModuleFile[] }) { return step.language === "java" || webStep(step); }

// Output naming pictures, sound or video cannot be checked automatically yet; the teacher marks it done.
export function teacherCheckedStep(step: { expectedOutput: string; activity?: { id?: string; expectedOutput: string } }) {
  return [step.expectedOutput, step.activity?.id ? step.activity.expectedOutput : ""].some((text) => /(?:^|\n)Media checks:/.test(text));
}

export function mergeProjectFiles(...groups: ModuleFile[][]) {
  const files = new Map<string, ModuleFile>();
  for (const group of groups) for (const file of group) files.set(sourcePath(file.path), file);
  return [...files.values()];
}

export function matchesActivityOutput(result: { success: boolean; output: string }, expected: string) {
  // Ignore platform line endings and one final println terminator, never spaces or blank lines.
  const text = (value: string) => value.replace(/\r\n/g, "\n").replace(/\n$/, "");
  return result.success && text(result.output) === text(expected);
}

export function matchesSample(result: { success: boolean; output: string }, step: { expectedOutput: string; expectedError?: string; files?: ModuleFile[] }) {
  if (!step.expectedError || webStep(step)) return matchesActivityOutput(result, step.expectedOutput);
  // Match the declared exception, never JVM-specific stack frames or an unrelated failed run.
  const firstLine = result.output.split(/\r?\n/, 1)[0].replace(/^Exception in thread "[^"]+" /, "");
  return !result.success && (firstLine === step.expectedError || firstLine.startsWith(`${step.expectedError}: `));
}

export function unchangedSample(files: ModuleFile[], sample: ModuleFile[]) {
  return sample.every((file) => files.some((saved) => sourcePath(saved.path) === sourcePath(file.path) && saved.content === file.content));
}

export function checkModuleRun(module: { sampleFirst?: boolean },
  step: Pick<ActivityStep, "id" | "activity" | "instruction" | "files" | "expectedOutput" | "expectedError" | "stdin">,
  states: Record<string, string>, files: ModuleFile[], result: { success: boolean; output: string }) {
  const check = samplePending(module, step, states) ? "sample" as const : "task" as const;
  const sampleMatched = matchesSample(result, step);
  const passed = check === "sample" ? sampleMatched && unchangedSample(files, step.files)
    : matchesActivityOutput(result, activityTask(step).expectedOutput);
  return { check, sampleMatched, passed };
}
