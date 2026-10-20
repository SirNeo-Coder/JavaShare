import type { CourseModule, Lesson, Block, StepBlock } from "./ModuleViewer";

export type ModulePart = { id: string; title: string; blocks: Block[]; lessons: Lesson[]; exitLessons: Lesson[]; closed: boolean };

// Author-defined parts may span days. Older modules keep one part per lesson.
export function groupModuleParts(module: CourseModule): ModulePart[] {
  const parts: ModulePart[] = [];
  const findPart = (id: string, title: string, lesson: Lesson) => {
    let part = parts.find((item) => item.id === id);
    if (!part) { part = { id, title, blocks: [], lessons: [], exitLessons: [], closed: Boolean(lesson.closed) }; parts.push(part); }
    if (!part.lessons.some((item) => item.id === lesson.id)) part.lessons.push(lesson);
    return part;
  };
  for (const lesson of module.lessons) {
    let pending: Block[] = [];
    let lastPart: ModulePart | undefined;
    for (const block of lesson.blocks) {
      if (block.type !== "step") { pending.push(block); continue; }
      const step = block as StepBlock;
      const part = findPart(step.part ? `part:${step.part}` : lesson.id, step.part || lesson.title, lesson);
      part.closed ||= Boolean(step.locked);
      part.blocks.push(...pending, step);
      pending = [];
      lastPart = part;
    }
    lastPart ??= findPart(lesson.id, lesson.title, lesson);
    lastPart.blocks.push(...pending);
    lastPart.exitLessons.push(lesson);
  }
  return parts;
}

// Break before each step without moving the following discussion out of reading order.
export function modulePartPages(part: ModulePart): { step: StepBlock | null; blocks: Block[] }[] {
  const pages: { step: StepBlock | null; blocks: Block[] }[] = [{ step: null, blocks: [] }];
  for (const block of part.blocks) {
    if (block.type === "step") pages.push({ step: block as StepBlock, blocks: [] });
    else pages[pages.length - 1].blocks.push(block);
  }
  return pages;
}
