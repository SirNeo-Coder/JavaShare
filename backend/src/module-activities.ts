import type { CourseModule } from "./course-module-schema.ts";

export type ModuleFile = { path: string; content: string };
export type ActivityStep = Extract<CourseModule["lessons"][number]["blocks"][number], { type: "step" }>;

// Adding a distinct challenge must not inherit a pass earned by running the old sample.
export function activityStateId(step: { id: string; activity?: unknown }) { return step.activity ? `${step.id}:activity` : step.id; }

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
  return { parts, performanceTaskOpen: parts.every((part) => part.done) };
}

export function findActivity(module: CourseModule, stepId: string) {
  return module.lessons.flatMap((lesson) => lesson.blocks).find((block): block is ActivityStep => block.type === "step" && block.id === stepId);
}

// Java strips src/ before compiling; treat those two paths as the same source file.
export function sourcePath(path: string) { return path.replace(/\\/g, "/").replace(/^src\//, ""); }

export function mergeProjectFiles(...groups: ModuleFile[][]) {
  const files = new Map<string, ModuleFile>();
  for (const group of groups) for (const file of group) files.set(sourcePath(file.path), file);
  return [...files.values()];
}

export function matchesActivityOutput(result: { success: boolean; output: string }, expected: string) {
  return result.success && result.output.replace(/\r\n/g, "\n").trim() === expected.replace(/\r\n/g, "\n").trim();
}
