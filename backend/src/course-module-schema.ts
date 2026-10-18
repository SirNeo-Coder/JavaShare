// Validates a module upload against docs/course-format.md so a malformed file is rejected with
// a plain-English error instead of corrupting a class. Keep this in sync with that doc.
import { z } from "zod";
import { JAVA_PATH, JAVA_PATH_MAX_LENGTH } from "./file-paths.ts";

const file = z.object({ path: z.string().trim().min(1).max(200), content: z.string().max(200000) });

const language = z.enum(["java", "html", "css", "javascript", "csharp"]);

const block = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), markdown: z.string().max(5000) }),
  z.object({ type: z.literal("definition"), term: z.string().max(200), markdown: z.string().max(5000) }),
  z.object({ type: z.literal("analogy"), markdown: z.string().max(5000) }),
  z.object({ type: z.literal("note"), markdown: z.string().max(5000) }),
  z.object({ type: z.literal("table"), columns: z.array(z.string().max(200)).min(1), rows: z.array(z.array(z.string().max(500))) }),
  z.object({
    type: z.literal("step"),
    id: z.string().trim().min(1).max(100),
    number: z.number().int().positive(),
    instruction: z.string().max(5000),
    language,
    files: z.array(file).min(1).max(50),
    run: z.string().trim().min(1).max(200).optional(),
    expectedOutput: z.string().max(100000),
    checkYourself: z.string().max(5000).optional(),
    // Groups this step (and any text/definition/analogy/table/note blocks leading into it) under
    // one named, gated part of the module viewer - a part can span several lessons (e.g. a
    // "Reading files" part covering both a Tuesday and a Wednesday lesson) because grouping
    // follows the discussion, not the day. Optional and omitted by every module uploaded before
    // this field existed; the viewer falls back to one part per lesson when a step has no part.
    part: z.string().trim().min(1).max(200).optional(),
  }),
  z.object({ type: z.literal("error"), language, markdown: z.string().max(5000), message: z.string().max(5000) }),
  z.object({
    type: z.literal("errorGuide"),
    rows: z.array(z.object({ see: z.string().max(500), means: z.string().max(500), fix: z.string().max(500) })).min(1),
  }),
]);

const exitSlip = z.object({
  id: z.string().trim().min(1).max(100),
  points: z.number().int().nonnegative(),
  afterStep: z.string().trim().min(1).max(100),
  questions: z.array(z.object({
    id: z.string().trim().min(1).max(20),
    kind: z.enum(["Define", "Explain", "Connect", "Identify", "Choose", "Point", "Evaluate", "Apply", "Reflect"]),
    points: z.number().int().nonnegative(),
    prompt: z.string().max(2000),
  })).min(1),
});

const lesson = z.object({
  id: z.string().trim().min(1).max(100),
  order: z.number().int().positive(),
  dayLabel: z.string().max(40),
  title: z.string().max(200),
  hours: z.number().positive(),
  objectives: z.object({ cognitive: z.string().max(1000), affective: z.string().max(1000), psychomotor: z.string().max(1000) }),
  blocks: z.array(block).min(1).max(100),
  exitSlip,
});

const performanceTask = z.object({
  id: z.string().trim().min(1).max(100),
  title: z.string().max(200),
  markdown: z.string().max(10000),
  checklist: z.array(z.string().max(500)).min(1),
  exampleFiles: z.array(file).min(1).max(50),
  starterFiles: z.array(file).min(1).max(50),
  presentationOutline: z.array(z.string().max(500)),
  questionsToPrepare: z.array(z.string().max(500)),
  rubric: z.array(z.object({ criterion: z.string().max(500), points: z.number().int().nonnegative() })).min(1),
  totalPoints: z.number().int().nonnegative(),
});

export const courseModule = z.object({
  format: z.literal("codeshare-module"),
  version: z.literal(1),
  course: z.enum(["java-1", "java-2", "dotnet-1", "dotnet-2"]),
  week: z.number().int().positive(),
  id: z.string().trim().min(1).max(100),
  title: z.string().max(200),
  continues: z.string().max(200).optional(),
  starterFiles: z.array(file).max(50).default([]),
  lessons: z.array(lesson).min(1).max(10),
  performanceTask: performanceTask.optional(),
}).refine((module) => {
  // Student progress (step_states) is one flat map per module, keyed by whichever id was marked -
  // a step block's own id or a lesson's exitSlip id (supabase-repository.ts). A collision between
  // any two of those ids, even across different lessons, would make marking one done silently
  // mark the other done too (CKB-007's bug class, reachable here if an upload isn't checked).
  // Lesson ids also identify availability switches, so they must not collide (CKB-019).
  const progressIds = module.lessons.flatMap((lesson) => [
    lesson.id, lesson.exitSlip.id,
    ...lesson.blocks.filter((block) => block.type === "step").map((block) => block.id),
  ]);
  return progressIds.length === new Set(progressIds).size;
}, { message: "Two lessons, steps or exit slips in this module share the same id - their ids must be unique across the whole module" })
  .refine((module) => {
    // /api/execute only runs java files whose path matches a strict identifier-style regex, at
    // most JAVA_PATH_MAX_LENGTH characters (routes.ts). A java step's files, and any .java
    // performance-task file (both always sent to /api/execute - app/ModuleViewer.tsx), must pass
    // that same rule or the step becomes permanently unrunnable with no warning at upload time.
    const javaFiles = [
      ...module.lessons.flatMap((lesson) => lesson.blocks.flatMap((block) => (block.type === "step" && block.language === "java" ? block.files : []))),
      ...(module.performanceTask ? [...module.performanceTask.exampleFiles, ...module.performanceTask.starterFiles].filter((file) => file.path.endsWith(".java")) : []),
    ];
    return javaFiles.every((file) => file.path.length <= JAVA_PATH_MAX_LENGTH && JAVA_PATH.test(file.path));
  }, { message: `A java step's file path (or a .java performance-task file) must be a valid Java filename of at most ${JAVA_PATH_MAX_LENGTH} characters, e.g. "src/Main.java" - no spaces or punctuation besides "/" and "_"` });

export type CourseModule = z.infer<typeof courseModule>;
