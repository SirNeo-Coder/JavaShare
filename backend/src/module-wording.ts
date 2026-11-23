// Module editor, wording stage (teacher, 2026-11-23): the text a teacher may change in the app. Ids, code,
// expected output, points, answers and the list of steps are not wording, so they never change here.
import type { CourseModule } from "./course-module-schema.ts";

export type WordingField = { path: (string | number)[]; group: string; label: string };

export function wordingFields(module: CourseModule): WordingField[] {
  const fields: WordingField[] = [{ path: ["title"], group: "Module", label: "Module title" }];
  if (module.continues !== undefined) fields.push({ path: ["continues"], group: "Module", label: "Continues" });
  module.lessons.forEach((lesson, l) => {
    const group = lesson.dayLabel || `Lesson ${l + 1}`;
    const at = (label: string, ...path: (string | number)[]) => fields.push({ path: ["lessons", l, ...path], group, label });
    at("Day label", "dayLabel");
    at("Day title", "title");
    for (const kind of ["cognitive", "affective", "psychomotor"] as const) at(`Objective (${kind})`, "objectives", kind);
    lesson.blocks.forEach((block, b) => {
      const name = block.type === "step" ? `Step ${block.number}` : `Block ${b + 1} (${block.type})`;
      const blockAt = (label: string, ...path: (string | number)[]) => at(`${name} · ${label}`, "blocks", b, ...path);
      if (block.type === "definition") blockAt("Term", "term");
      if ("markdown" in block) blockAt("Text", "markdown");
      if (block.type === "table") {
        block.columns.forEach((_, c) => blockAt(`Column ${c + 1}`, "columns", c));
        block.rows.forEach((row, r) => row.forEach((_, c) => blockAt(`Row ${r + 1}, cell ${c + 1}`, "rows", r, c)));
      }
      if (block.type === "errorGuide") block.rows.forEach((_, r) => (["see", "means", "fix"] as const).forEach((key) => blockAt(`Row ${r + 1} · ${key}`, "rows", r, key)));
      if (block.type !== "step") return;
      blockAt("Instruction", "instruction");
      if (block.checkYourself !== undefined) blockAt("Check yourself", "checkYourself");
      if (!block.activity) return;
      blockAt("Your task", "activity", "instruction");
      if (block.activity.guided?.discussion !== undefined) blockAt("Guided example discussion", "activity", "guided", "discussion");
      if (block.activity.guided) blockAt("Guided example instruction", "activity", "guided", "instruction");
    });
    lesson.exitSlip.questions.forEach((_, q) => at(`Liplet question ${q + 1}`, "exitSlip", "questions", q, "prompt"));
  });
  const task = module.performanceTask;
  if (task) {
    const at = (label: string, ...path: (string | number)[]) => fields.push({ path: ["performanceTask", ...path], group: "Performance task", label });
    at("Title", "title");
    at("Description", "markdown");
    task.steps?.forEach((_, i) => at(`Step ${i + 1}`, "steps", i));
    task.checklist.forEach((_, i) => at(`Checklist ${i + 1}`, "checklist", i));
    task.presentationOutline.forEach((_, i) => at(`Presentation outline ${i + 1}`, "presentationOutline", i));
    task.questionsToPrepare.forEach((_, i) => at(`Question to prepare ${i + 1}`, "questionsToPrepare", i));
    task.rubric.forEach((_, i) => at(`Rubric ${i + 1}`, "rubric", i, "criterion"));
  }
  return fields;
}

export function getWording(module: unknown, path: (string | number)[]): string {
  return path.reduce<unknown>((value, key) => (value as Record<string | number, unknown>)[key], module) as string;
}

export function setWording<T>(module: T, path: (string | number)[], text: string): T {
  const copy = structuredClone(module);
  const parent = path.slice(0, -1).reduce<unknown>((value, key) => (value as Record<string | number, unknown>)[key], copy) as Record<string | number, unknown>;
  parent[path.at(-1)!] = text;
  return copy;
}

// The same module once every wording field is blanked: two modules that differ only in wording match.
// Keys are sorted because the database stores them in its own order.
function withoutWording(module: CourseModule) {
  return JSON.stringify(wordingFields(module).reduce((copy, field) => setWording(copy, field.path, ""), module), (_, value) =>
    value && typeof value === "object" && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)) : value);
}

export function onlyWordingChanged(before: CourseModule, after: CourseModule) {
  return withoutWording(before) === withoutWording(after);
}
