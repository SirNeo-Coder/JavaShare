import { Buffer } from "node:buffer";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import { courseModule } from "./course-module-schema.ts";
import { sourcePath, type ModuleFile } from "./module-activities.ts";
import { database } from "./database.ts";
import { JAVA_PATH, JAVA_PATH_MAX_LENGTH } from "./file-paths.ts";
import { broadcast, realtimePass } from "./realtime.ts";
import { createRouter, type ApiRequest, type ApiResponse, type NextFn } from "./router.ts";
import {
  approveSupabasePasswordReset,
  assignLateStudentToGroup,
  autoGroupSupabaseClass,
  bootstrapFromSupabase,
  canAccessSupabaseClass,
  changeSupabaseResetPassword,
  createSupabaseActivity,
  createSupabaseClassroom,
  createSupabaseFile,
  createSupabaseWebProject,
  createSupabaseSavedWork,
  deleteSupabaseModule,
  deleteSupabaseStudent,
  deleteSupabaseActivity,
  endSupabaseActivity,
  getSupabaseModule,
  getSupabaseModuleProgress,
  prepareSupabaseModuleActivity,
  prepareSupabasePerformanceProject,
  saveSupabasePerformanceProject,
  runSupabaseModuleActivity,
  recordSupabaseModuleActivityResult,
  getSupabaseStudentWebProject,
  joinSupabaseClass,
  listSupabaseClassroomStudents,
  getSupabaseTeacherClassProgress,
  listSupabaseModules,
  listSupabaseModuleProgressSummary,
  listSupabaseMessages,
  listSupabaseSavedWork,
  listSupabaseStudents,
  listSupabaseStudentWebProjects,
  listSupabaseSubmissions,
  loginWithSupabase,
  registerWithSupabase,
  renameSupabaseFile,
  requestSupabasePasswordReset,
  reopenSupabaseActivity,
  restoreSupabaseSavedWork,
  updateSupabaseSavedWork,
  saveSupabaseFile,
  sendSupabaseMessage,
  setSupabaseClassroomChatMuted,
  setSupabaseClassroomActiveModule,
  setSupabaseLiveShare,
  setSupabaseModuleAvailability,
  setSupabaseModulePerformanceTask,
  setSupabaseModuleProjectFiles,
  setSupabaseModuleStepState,
  submitSupabaseProject,
  supabaseActivitySummary,
  supabaseClassIds,
  supabaseLiveSharePayload,
  SupabaseRepositoryError,
  updateSupabaseGroup,
  updateSupabaseGroupPermissions,
  updateSupabaseStudent,
  uploadSupabaseModule,
  uploadSupabaseStudentPhoto,
  uploadSupabaseTeacherPhoto,
} from "./supabase-repository.ts";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "local-development-secret-change-before-deploy");
// The laptop's Java runner: only when asked for, and never on a hosted server (Render sets
// NODE_ENV=production; the classroom launcher sets CODESHARE_LAPTOP=true for next start).
const localJavaEnabled = process.env.LOCAL_JAVA_EXECUTION === "true" && (process.env.NODE_ENV !== "production" || process.env.CODESHARE_LAPTOP === "true");
let activeExecutions = 0;
const lastExecution = new Map<string, number>();

// Set by the Express wrapper on Render, where pages (Vercel) and API (Render) are on different sites.
export const apiConfig = { crossSiteCookies: false };

type SessionUser = { id: string; role: "teacher" | "student"; email: string; name: string; passwordResetRequired: boolean };
type AuthedRequest = ApiRequest & { user?: SessionUser };

// Sign-in lasts 7 days, online and offline; a server restart no longer signs people out
// (decided 2026-10-16: Cloudflare runs many short-lived copies of the server).
async function setSession(req: ApiRequest, res: ApiResponse, user: SessionUser) {
  const { id, role, email, name, passwordResetRequired } = user;
  const token = await new SignJWT({ id, role, email, name, passwordResetRequired }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(JWT_SECRET);
  const secure = apiConfig.crossSiteCookies || req.url.protocol === "https:";
  res.cookie("javashare_session", token, {
    httpOnly: true,
    secure,
    sameSite: apiConfig.crossSiteCookies ? "none" : "lax",
    maxAge: 7 * 86400000,
    path: "/",
  });
}

async function requireAuth(req: AuthedRequest, res: ApiResponse, next: NextFn) {
  const token = req.cookies.javashare_session;
  if (!token) return res.status(401).json({ error: "Sign in required" });
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const session = payload as unknown as SessionUser;
    req.user = { id: session.id, role: session.role, email: session.email, name: session.name, passwordResetRequired: session.passwordResetRequired };
    next();
  } catch {
    return res.status(401).json({ error: "Session expired" });
  }
}

function requireTeacher(req: AuthedRequest, res: ApiResponse, next: NextFn) {
  if (req.user?.role !== "teacher") return res.status(403).json({ error: "Teacher access required" });
  next();
}

const app = createRouter<AuthedRequest>((error, res) => {
  if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message || "Invalid request" });
  if (error instanceof SupabaseRepositoryError) return res.status(error.status).json({ error: error.message });
  console.error(error);
  return res.status(500).json({ error: "Unexpected server error" });
});
export const handleApi = app.handle;

app.get("/api/health", async (_req, res) => {
  const health = await database.health();
  res.status(health.connected ? 200 : 503).json({ ok: health.connected, database: health });
});

const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(2).max(80).optional() });

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const input = credentialsSchema.parse(req.body);
    if (!input.name) return res.status(400).json({ error: "Name is required" });
    const user = await registerWithSupabase({ name: input.name, email: input.email, password: input.password });
    await setSession(req, res, user);
    return res.status(201).json({ user });
  } catch (error) { next(error); }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const input = z.object({ email: z.string().email(), password: z.string().max(128).optional().default("") }).parse(req.body);
    const user = await loginWithSupabase(input);
    await setSession(req, res, user);
    return res.json({ user });
  } catch (error) { next(error); }
});

app.post("/api/auth/forgot-password", async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    return res.json(await requestSupabasePasswordReset(email));
  } catch (error) { next(error); }
});

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("javashare_session", { path: "/" });
  res.status(204).end();
});

app.get("/api/auth/me", requireAuth, (req: AuthedRequest, res) => res.json({ user: req.user }));

app.get("/api/realtime/pass", requireAuth, async (req: AuthedRequest, res) => {
  const pass = await realtimePass(req.user!.id);
  if (!pass) return res.status(503).json({ error: "Live features are not configured (SUPABASE_JWT_SECRET is missing)" });
  return res.json(pass);
});

app.post("/api/auth/change-reset-password", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { password } = z.object({ password: z.string().min(8).max(128) }).parse(req.body);
    const user = await changeSupabaseResetPassword(req.user!, password);
    await setSession(req, res, user);
    return res.json({ user });
  } catch (error) { next(error); }
});

app.get("/api/teacher/students", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try {
    const result = await listSupabaseStudents(req.user!);
    return res.json({ students: result.students, classroomIds: await supabaseClassIds(req.user!) });
  }
  catch (error) { next(error); }
});

app.post("/api/teacher/students/:studentId/reset-password", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try { return res.json(await approveSupabasePasswordReset(req.user!, z.string().uuid().parse(req.params.studentId))); }
  catch (error) { next(error); }
});

app.patch("/api/teacher/students/:studentId", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try {
    const studentId = z.string().uuid().parse(req.params.studentId);
    const input = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(254) }).parse(req.body);
    return res.json(await updateSupabaseStudent(req.user!, studentId, input));
  } catch (error) { next(error); }
});

app.put("/api/teacher/students/:studentId/photo", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try {
    const studentId = z.string().uuid().parse(req.params.studentId);
    const contentType = (req.headers.get("content-type") || "").split(";")[0];
    if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) return res.status(415).json({ error: "Choose a JPG, PNG, or WebP image" });
    if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: "Choose an image to upload" });
    return res.json(await uploadSupabaseStudentPhoto(req.user!, studentId, req.body, contentType));
  } catch (error) { next(error); }
});

app.put("/api/teacher/profile/photo", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try {
    const contentType = (req.headers.get("content-type") || "").split(";")[0];
    if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) return res.status(415).json({ error: "Choose a JPG, PNG, or WebP image" });
    if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: "Choose an image to upload" });
    return res.json(await uploadSupabaseTeacherPhoto(req.user!, req.body, contentType));
  } catch (error) { next(error); }
});

app.delete("/api/teacher/students/:studentId", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try {
    await deleteSupabaseStudent(req.user!, z.string().uuid().parse(req.params.studentId));
    return res.status(204).end();
  } catch (error) { next(error); }
});

// Teacher landing page: one classroom's roster, and (lazily, on clicking a student) that
// student's module-progress summary - see listSupabaseModuleProgressSummary below.
app.get("/api/classes/:classroomId/students", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try { return res.json(await listSupabaseClassroomStudents(req.user!, String(req.params.classroomId))); }
  catch (error) { next(error); }
});

app.get("/api/classes/:classroomId/module-progress", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try { return res.json(await getSupabaseTeacherClassProgress(req.user!, z.string().uuid().parse(req.params.classroomId))); }
  catch (error) { next(error); }
});

app.get("/api/classes/:classroomId/students/:studentId/modules-summary", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try {
    const studentId = z.string().uuid().parse(req.params.studentId);
    return res.json(await listSupabaseModuleProgressSummary(req.user!, String(req.params.classroomId), studentId));
  } catch (error) { next(error); }
});

app.get("/api/classes/:classroomId/students/:studentId/web-projects", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try {
    const { classroomId, studentId } = z.object({ classroomId: z.string().uuid(), studentId: z.string().uuid() }).parse(req.params);
    return res.json(await listSupabaseStudentWebProjects(req.user!, classroomId, studentId));
  } catch (error) { next(error); }
});

app.get("/api/classes/:classroomId/students/:studentId/web-projects/:projectId", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try {
    const { classroomId, studentId, projectId } = z.object({ classroomId: z.string().uuid(), studentId: z.string().uuid(), projectId: z.string().uuid() }).parse(req.params);
    return res.json(await getSupabaseStudentWebProject(req.user!, classroomId, studentId, projectId));
  } catch (error) { next(error); }
});

app.post("/api/classes/join", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { joinCode } = z.object({ joinCode: z.string().min(4).max(20) }).parse(req.body);
    return res.json(await joinSupabaseClass(req.user!, joinCode));
  } catch (error) { next(error); }
});

app.get("/api/bootstrap", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const teacherView = req.query.view === "groups" ? "groups" : "students";
    const classroomId = req.query.classroomId ? String(req.query.classroomId) : undefined;
    return res.json(await bootstrapFromSupabase(req.user!, teacherView, classroomId));
  } catch (error) { next(error); }
});

// Teacher creates an additional class beyond the one auto-created at signup (Google-Classroom-
// style class list). Reuses the same classroom-workspace setup as that starter class.
app.post("/api/classes", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try {
    const input = z.object({ name: z.string().trim().min(2).max(80), subject: z.string().trim().min(2).max(80).optional() }).parse(req.body);
    return res.status(201).json(await createSupabaseClassroom(req.user!.id, input));
  } catch (error) { next(error); }
});

// Called when a browser opens a class: places a student who missed group forming into a group.
app.post("/api/classes/:classroomId/arrive", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const classroomId = String(req.params.classroomId);
    if (!await canAccessSupabaseClass(req.user!, classroomId)) return res.status(403).json({ error: "Classroom access denied" });
    const lateAssignment = await assignLateStudentToGroup(req.user!, classroomId);
    if (lateAssignment) await broadcast(`class:${classroomId}`, "groups:updated", lateAssignment);
    return res.json({ lateAssignment });
  } catch (error) { next(error); }
});

app.post("/api/classes/:classroomId/auto-group", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const classroomId = String(req.params.classroomId);
    const { groupSize, studentIds } = z.object({ groupSize: z.number().int().min(2).max(10).default(3), studentIds: z.array(z.string().uuid()) }).parse(req.body || {});
    const result = await autoGroupSupabaseClass(req.user!, classroomId, groupSize, studentIds);
    await broadcast(`class:${classroomId}`, "groups:updated");
    return res.json(result);
  } catch (error) { next(error); }
});

app.post("/api/classes/:classroomId/activities", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const classroomId = String(req.params.classroomId);
    const input = z.object({
      title: z.string().trim().min(2).max(100),
      description: z.string().trim().max(1000).optional().default(""),
      mode: z.enum(["individual", "group"]),
      starterCode: z.string().max(200000).optional().default(""),
    }).parse(req.body);
    const payload = await createSupabaseActivity(req.user!, classroomId, input);
    await broadcast(`class:${classroomId}`, "class:activity-deployed", payload);
    return res.status(201).json(payload);
  } catch (error) { next(error); }
});

app.post("/api/classes/:classroomId/end-activity", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const classroomId = String(req.params.classroomId);
    const payload = await endSupabaseActivity(req.user!, classroomId);
    await broadcast(`class:${classroomId}`, "class:activity-ended", payload);
    return res.json(payload);
  } catch (error) { next(error); }
});

app.post("/api/classes/:classroomId/activities/:activityId/reopen", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try {
    const classroomId = String(req.params.classroomId);
    const activityId = z.string().uuid().parse(req.params.activityId);
    const payload = await reopenSupabaseActivity(req.user!, classroomId, activityId);
    await broadcast(`class:${classroomId}`, "class:activity-deployed", payload);
    return res.json(payload);
  } catch (error) { next(error); }
});

app.delete("/api/classes/:classroomId/activities/:activityId", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try {
    const payload = await deleteSupabaseActivity(req.user!, String(req.params.classroomId), z.string().uuid().parse(req.params.activityId));
    return res.json(payload);
  } catch (error) { next(error); }
});

app.get("/api/teacher/activity-summary", requireAuth, async (req: AuthedRequest, res, next) => {
  try { return res.json(await supabaseActivitySummary(req.user!)); }
  catch (error) { next(error); }
});

app.get("/api/teams/:teamId/messages", requireAuth, async (req: AuthedRequest, res, next) => {
  try { return res.json(await listSupabaseMessages(req.user!, String(req.params.teamId))); }
  catch (error) { next(error); }
});

app.put("/api/teams/:teamId/group-profile", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const teamId = String(req.params.teamId);
    const input = z.object({ name: z.string().trim().min(2).max(60), leaderId: z.string().uuid() }).parse(req.body);
    const payload = await updateSupabaseGroup(req.user!, teamId, input);
    await broadcast(`class:${payload.classroomId}`, "groups:updated", payload);
    await broadcast(`team:${teamId}`, "team:profile-updated", payload);
    return res.json(payload);
  } catch (error) { next(error); }
});

app.put("/api/teams/:teamId/group-permissions", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const teamId = String(req.params.teamId);
    const input = z.object({ userId: z.string().uuid(), chatMuted: z.boolean(), editingLocked: z.boolean() }).parse(req.body);
    const payload = await updateSupabaseGroupPermissions(req.user!, teamId, input);
    await broadcast(`team:${teamId}`, "team:permissions-updated", payload);
    await broadcast(`class:${payload.classroomId}`, "groups:updated");
    return res.json(payload);
  } catch (error) { next(error); }
});

app.post("/api/teams/:teamId/messages", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const teamId = String(req.params.teamId);
    const { text } = z.object({ text: z.string().trim().min(1).max(1000) }).parse(req.body);
    const payload = await sendSupabaseMessage(req.user!, teamId, text);
    await broadcast(`team:${teamId}`, "chat:message", payload);
    return res.status(201).json(payload);
  } catch (error) { next(error); }
});

app.put("/api/classes/:classroomId/chat-mute", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try {
    const { muted } = z.object({ muted: z.boolean() }).parse(req.body);
    const payload = await setSupabaseClassroomChatMuted(req.user!, String(req.params.classroomId), muted);
    await broadcast(`class:${payload.classroomId}`, "class:chat-muted", payload);
    return res.json(payload);
  } catch (error) { next(error); }
});

app.get("/api/classes/:classroomId/live-share", requireAuth, async (req: AuthedRequest, res, next) => {
  try { return res.json(await supabaseLiveSharePayload(req.user!, String(req.params.classroomId))); }
  catch (error) { next(error); }
});

app.post("/api/classes/:classroomId/live-share", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { projectId } = z.object({ projectId: z.string().uuid().nullable() }).parse(req.body);
    const classroomId = String(req.params.classroomId);
    const payload = await setSupabaseLiveShare(req.user!, classroomId, projectId);
    await broadcast(`class:${classroomId}`, "class:live-share", payload);
    return res.json(payload);
  } catch (error) { next(error); }
});

app.put("/api/files/:fileId", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const input = z.object({ content: z.string().max(200000), version: z.number().int().positive() }).parse(req.body);
    const result = await saveSupabaseFile(req.user!, String(req.params.fileId), input);
    await broadcast(`team:${result.teamId}`, "file:updated", result.update);
    if (result.presenting) await broadcast(`class:${result.classroomId}`, "class:live-share-update", { projectId: result.projectId, ...result.update });
    return res.json(result.update);
  } catch (error) { next(error); }
});

// The repository checks the name against the project's language (Java or web).
const projectFilePath = z.string().trim().min(1).max(160).transform((value) => value.replace(/\\/g, "/"));

app.post("/api/classes/:classroomId/web-projects", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { title } = z.object({ title: z.string().trim().min(1).max(60) }).parse(req.body);
    return res.status(201).json(await createSupabaseWebProject(req.user!, String(req.params.classroomId), title));
  } catch (error) { next(error); }
});

app.post("/api/projects/:projectId/files", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const input = z.object({ path: projectFilePath, content: z.string().max(200000).default("") }).parse(req.body);
    return res.status(201).json(await createSupabaseFile(req.user!, String(req.params.projectId), input));
  } catch (error) { next(error); }
});

app.patch("/api/files/:fileId", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { path } = z.object({ path: projectFilePath }).parse(req.body);
    return res.json(await renameSupabaseFile(req.user!, String(req.params.fileId), path));
  } catch (error) { next(error); }
});

app.post("/api/projects/:projectId/submit", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const payload = await submitSupabaseProject(req.user!, String(req.params.projectId));
    await broadcast(`team:${payload.teamId}`, "team:submitted", payload);
    return res.status(201).json(payload);
  } catch (error) { next(error); }
});

app.get("/api/projects/:projectId/saved-work", requireAuth, async (req: AuthedRequest, res, next) => {
  try { return res.json(await listSupabaseSavedWork(req.user!, String(req.params.projectId))); }
  catch (error) { next(error); }
});

app.post("/api/projects/:projectId/saved-work", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { label } = z.object({ label: z.string().trim().min(1).max(80).optional() }).parse(req.body || {});
    return res.status(201).json(await createSupabaseSavedWork(req.user!, String(req.params.projectId), label));
  } catch (error) { next(error); }
});

app.put("/api/saved-work/:savedWorkId", requireAuth, async (req: AuthedRequest, res, next) => {
  try { return res.json(await updateSupabaseSavedWork(req.user!, String(req.params.savedWorkId))); }
  catch (error) { next(error); }
});

app.post("/api/saved-work/:savedWorkId/restore", requireAuth, async (req: AuthedRequest, res, next) => {
  try { return res.json(await restoreSupabaseSavedWork(req.user!, String(req.params.savedWorkId))); }
  catch (error) { next(error); }
});

app.get("/api/submissions", requireAuth, async (req: AuthedRequest, res, next) => {
  try { return res.json(await listSupabaseSubmissions(req.user!)); }
  catch (error) { next(error); }
});

// Module progress (docs/course-format.md): the goal meter, per-step checklist, and the two
// performance-task submissions (sample code run, student's own version). moduleId is the
// module file's own "id" field.
app.get("/api/classrooms/:classroomId/modules/:moduleId/progress", requireAuth, async (req: AuthedRequest, res, next) => {
  try { return res.json(await getSupabaseModuleProgress(req.user!, String(req.params.classroomId), String(req.params.moduleId))); }
  catch (error) { next(error); }
});

app.put("/api/classrooms/:classroomId/modules/:moduleId/progress/step", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { stepId, status } = z.object({ stepId: z.string().trim().min(1).max(100), status: z.enum(["pass", "fail"]) }).parse(req.body);
    return res.json(await setSupabaseModuleStepState(req.user!, String(req.params.classroomId), String(req.params.moduleId), stepId, status));
  } catch (error) { next(error); }
});

app.put("/api/classrooms/:classroomId/modules/:moduleId/progress/performance-task", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { variant, files, status, updatedAt } = z.object({
      variant: z.enum(["sample", "own"]),
      files: z.array(z.object({ path: z.string().trim().min(1).max(160), content: z.string().max(200000) })).min(1).max(50),
      status: z.enum(["pass", "fail"]),
      updatedAt: z.string().datetime({ offset: true }).optional(),
    }).parse(req.body);
    return res.json(await setSupabaseModulePerformanceTask(req.user!, String(req.params.classroomId), String(req.params.moduleId), variant, files, status, updatedAt));
  } catch (error) { next(error); }
});

// The student's one shared project for a module (e.g. one Main.java replaced step by step) -
// separate from the two performance-task submissions above.
app.put("/api/classrooms/:classroomId/modules/:moduleId/progress/project", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { files, updatedAt } = z.object({
      files: z.array(z.object({ path: z.string().trim().min(1).max(160), content: z.string().max(200000) })).min(1).max(50),
      updatedAt: z.string().datetime({ offset: true }).optional(),
    }).parse(req.body);
    return res.json(await setSupabaseModuleProjectFiles(req.user!, String(req.params.classroomId), String(req.params.moduleId), files, updatedAt));
  } catch (error) { next(error); }
});

// Course modules (docs/course-format.md): the teacher uploads a weekly module file for a class;
// members of that class (teacher and students) can list and view it.
app.post("/api/classrooms/:classroomId/modules", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const parsed = courseModule.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: `This module file doesn't match the expected format: ${parsed.error.issues[0].message} (at ${parsed.error.issues[0].path.join(".") || "top level"})` });
    return res.status(201).json(await uploadSupabaseModule(req.user!, String(req.params.classroomId), parsed.data));
  } catch (error) { next(error); }
});

app.get("/api/classrooms/:classroomId/modules", requireAuth, async (req: AuthedRequest, res, next) => {
  try { return res.json(await listSupabaseModules(req.user!, String(req.params.classroomId))); }
  catch (error) { next(error); }
});

// Student landing page: the signed-in student's own module list with percent/status. Must be
// registered before the :moduleId route below, or "summary" would be matched as a moduleId
// (first-match routing in router.ts).
app.get("/api/classrooms/:classroomId/modules/summary", requireAuth, async (req: AuthedRequest, res, next) => {
  try { return res.json(await listSupabaseModuleProgressSummary(req.user!, String(req.params.classroomId))); }
  catch (error) { next(error); }
});

app.patch("/api/classrooms/:classroomId/modules/:moduleId/availability", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try {
    const change = z.discriminatedUnion("target", [
      z.object({ target: z.literal("lesson"), lessonId: z.string().trim().min(1).max(100), open: z.boolean() }),
      z.object({ target: z.literal("performance-task"), open: z.boolean() }),
    ]).parse(req.body);
    return res.json(await setSupabaseModuleAvailability(req.user!, String(req.params.classroomId), String(req.params.moduleId), change));
  } catch (error) { next(error); }
});

// Teacher's weekly pick of one module for a class (docs/knowledgebase/workflow-state.md). While
// a live activity is running, a student's module catalog locks to just this pick - see
// enforceModuleLiveLock in supabase-repository.ts.
app.patch("/api/classrooms/:classroomId/active-module", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try {
    const { moduleId } = z.object({ moduleId: z.string().trim().min(1).max(100).nullable() }).parse(req.body);
    return res.json(await setSupabaseClassroomActiveModule(req.user!, String(req.params.classroomId), moduleId));
  } catch (error) { next(error); }
});

app.get("/api/classrooms/:classroomId/modules/:moduleId", requireAuth, async (req: AuthedRequest, res, next) => {
  try { return res.json(await getSupabaseModule(req.user!, String(req.params.classroomId), String(req.params.moduleId))); }
  catch (error) { next(error); }
});

app.delete("/api/classrooms/:classroomId/modules/:moduleId", requireAuth, async (req: AuthedRequest, res, next) => {
  try { return res.json(await deleteSupabaseModule(req.user!, String(req.params.classroomId), String(req.params.moduleId))); }
  catch (error) { next(error); }
});

const javaPath = z.string().trim().min(1).max(JAVA_PATH_MAX_LENGTH).transform((value) => value.replace(/\\/g, "/")).refine((value) => JAVA_PATH.test(value) && !value.includes(".."));
const javaFiles = z.array(z.object({ path: javaPath, content: z.string().max(200000) })).min(1).max(50)
  .refine((files) => new Set(files.map((file) => sourcePath(file.path))).size === files.length, "Each Java source file must have a different path");

type JudgeResult = { compile_output?: string; stderr?: string; stdout?: string; message?: string; status?: { id?: number; description?: string } };

async function executeJava(userId: string, files: ModuleFile[], stdin: string) {
  if (localJavaEnabled) {
    const lastRun = lastExecution.get(userId) || 0;
    if (Date.now() - lastRun < 1500) throw new SupabaseRepositoryError(429, "Please wait briefly before running again");
    if (activeExecutions >= 2) throw new SupabaseRepositoryError(429, "The classroom runner is busy; try again shortly");
    lastExecution.set(userId, Date.now());
    activeExecutions += 1;
    const { executeLocallyResult } = await import("./java-runner.ts");
    try { return { mode: "local", ...await executeLocallyResult(files, stdin) }; }
    finally { activeExecutions -= 1; }
  }
  if (!process.env.JUDGE0_URL) return { mode: "demo", success: false, output: "Java execution is not configured. Enable the guarded local runner for development or connect Judge0.\n\n[Demo execution mode]" };
  if (files.length > 1) throw new SupabaseRepositoryError(501, "Multi-file execution requires the classroom local Java runner");
  const response = await fetch(`${process.env.JUDGE0_URL.replace(/\/$/, "")}/submissions?base64_encoded=false&wait=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(process.env.JUDGE0_API_KEY ? { "X-Auth-Token": process.env.JUDGE0_API_KEY } : {}) },
    body: JSON.stringify({ source_code: files[0].content, stdin, language_id: 62, cpu_time_limit: 3, memory_limit: 128000 }),
  });
  if (!response.ok) throw new SupabaseRepositoryError(502, `Judge0 returned ${response.status}`);
  const result = await response.json() as JudgeResult;
  return { mode: "judge0", success: result.status?.id === 3 && !result.stderr && !result.compile_output, output: result.compile_output || result.stderr || result.stdout || result.message || result.status?.description || "" };
}

app.get("/api/java-runner", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    if (localJavaEnabled) return res.json({ mode: "local" });
    if (process.env.JAVA_RUNNER_URL) {
      let url: URL;
      try { url = new URL(process.env.JAVA_RUNNER_URL); }
      catch { throw new SupabaseRepositoryError(503, "JAVA_RUNNER_URL must be a separate HTTPS origin"); }
      if (url.origin === req.url.origin || url.username || url.password || url.search || url.hash || url.pathname !== "/" ||
          (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))) throw new SupabaseRepositoryError(503, "JAVA_RUNNER_URL must be a separate HTTPS origin");
      return res.json({ mode: "browser", url: url.href });
    }
    if (process.env.JUDGE0_URL) return res.json({ mode: "judge0" });
    throw new SupabaseRepositoryError(503, "Online Java is not set up yet. Ask your teacher to configure JAVA_RUNNER_URL.");
  } catch (error) { next(error); }
});

app.post("/api/classrooms/:classroomId/modules/:moduleId/progress/browser-result", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    if (localJavaEnabled) throw new SupabaseRepositoryError(403, "Offline progress must use the classroom Java runner");
    if (!process.env.JAVA_RUNNER_URL) throw new SupabaseRepositoryError(503, "Online Java is not configured");
    const { stepId, updatedAt, success, output } = z.object({ stepId: z.string().trim().min(1).max(100), updatedAt: z.string().datetime({ offset: true }), success: z.boolean(), output: z.string().max(70000) }).parse(req.body);
    return res.json(await recordSupabaseModuleActivityResult(req.user!, String(req.params.classroomId), String(req.params.moduleId), stepId, updatedAt, { mode: "browser", success, output }));
  } catch (error) { next(error); }
});

app.post("/api/execute", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { files, stdin = "" } = z.object({ files: javaFiles, stdin: z.string().max(10000).optional() }).parse(req.body);
    return res.json(await executeJava(req.user!.id, files, stdin));
  } catch (error) { next(error); }
});

app.post("/api/classrooms/:classroomId/modules/:moduleId/progress/performance-project", requireAuth, async (req: AuthedRequest, res, next) => {
  try { return res.json(await prepareSupabasePerformanceProject(req.user!, String(req.params.classroomId), String(req.params.moduleId))); }
  catch (error) { next(error); }
});

app.put("/api/classrooms/:classroomId/modules/:moduleId/progress/performance-project", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { files, updatedAt } = z.object({ files: javaFiles, updatedAt: z.string().datetime({ offset: true }) }).parse(req.body);
    return res.json(await saveSupabasePerformanceProject(req.user!, String(req.params.classroomId), String(req.params.moduleId), files, updatedAt));
  } catch (error) { next(error); }
});

app.post("/api/classrooms/:classroomId/modules/:moduleId/progress/activity", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { stepId } = z.object({ stepId: z.string().trim().min(1).max(100) }).parse(req.body);
    return res.json(await prepareSupabaseModuleActivity(req.user!, String(req.params.classroomId), String(req.params.moduleId), stepId));
  } catch (error) { next(error); }
});

app.post("/api/classrooms/:classroomId/modules/:moduleId/progress/run", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { stepId, files, updatedAt } = z.object({ stepId: z.string().trim().min(1).max(100), files: javaFiles, updatedAt: z.string().datetime({ offset: true }) }).parse(req.body);
    return res.json(await runSupabaseModuleActivity(req.user!, String(req.params.classroomId), String(req.params.moduleId), stepId, files, updatedAt, (sources, stdin) => executeJava(req.user!.id, sources, stdin)));
  } catch (error) { next(error); }
});
