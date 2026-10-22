import type { CourseModule } from "./course-module-schema.ts";
import { activityAccess } from "./module-activities.ts";

export type ModuleAccessBlock = {
  kind: "prerequisite" | "missing" | "invalid" | "live";
  message: string;
  moduleId?: string;
  week?: number;
};

export type ModuleAccessSummary = Pick<CourseModule, "id" | "week" | "previousModuleId"> & {
  requiredActivityIds: string[];
};
type AccessModule = CourseModule | ModuleAccessSummary;

// Walk the declared links, never infer prerequisites from week numbers or upload order.
function prerequisiteChain(module: AccessModule, modules: Map<string, AccessModule>): { chain: AccessModule[]; block?: ModuleAccessBlock } {
  const chain: AccessModule[] = [];
  const seen = new Set([module.id]);
  let previous = module.previousModuleId;
  while (previous) {
    if (seen.has(previous)) return { chain, block: { kind: "invalid", message: "This module's prerequisite links form a loop. Ask your teacher to correct the module files." } };
    seen.add(previous);
    const content = modules.get(previous);
    if (!content) return { chain, block: { kind: "missing", message: `Your teacher needs to upload prerequisite module ${previous} before you can start Week ${module.week}.` } };
    chain.push(content);
    previous = content.previousModuleId;
  }
  return { chain };
}

export function moduleAccessBlock(
  module: AccessModule, modules: Map<string, AccessModule>, states: Map<string, Record<string, string>>,
  classroom: { current_activity_id: string | null; active_module_id: string | null },
): ModuleAccessBlock | undefined {
  if (classroom.current_activity_id) {
    const active = classroom.active_module_id ? modules.get(classroom.active_module_id) : undefined;
    if (!active || (module.id !== active.id && !prerequisiteChain(active, modules).chain.some((item) => item.id === module.id))) {
      return { kind: "live", message: "Only this week's module and its prerequisites are open while class is live" };
    }
  }
  const { chain, block } = prerequisiteChain(module, modules);
  if (block) return block;
  const unfinished = chain.reverse().find((item) => {
    const saved = states.get(item.id) ?? {};
    return "requiredActivityIds" in item ? !item.requiredActivityIds.every((id) => saved[id] === "pass")
      : !activityAccess(item, saved).performanceTaskOpen;
  });
  if (unfinished) return { kind: "prerequisite", message: `Complete Week ${unfinished.week} before starting Week ${module.week}.`, moduleId: unfinished.id, week: unfinished.week };
}
