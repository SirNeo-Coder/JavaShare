import "dotenv/config";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { z } from "zod";
import { database } from "./database.js";
import {
  approveSupabasePasswordReset,
  assignLateStudentToGroup,
  autoGroupSupabaseClass,
  bootstrapFromSupabase,
  canAccessSupabaseClass,
  canAccessSupabaseTeam,
  canEditSupabaseTeamFile,
  canSendSupabaseLiveDraft,
  changeSupabaseResetPassword,
  createSupabaseActivity,
  createSupabaseFile,
  createSupabaseSavedWork,
  deleteSupabaseStudent,
  deleteSupabaseActivity,
  endSupabaseActivity,
  joinSupabaseClass,
  listSupabaseMessages,
  listSupabaseSavedWork,
  listSupabaseStudents,
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
  setSupabaseLiveShare,
  submitSupabaseProject,
  supabaseActivitySummary,
  supabaseClassIds,
  supabaseClassMemberIds,
  supabaseFileBelongsToTeam,
  supabaseLiveSharePayload,
  SupabaseRepositoryError,
  updateSupabaseGroup,
  updateSupabaseGroupPermissions,
  updateSupabaseStudent,
  uploadSupabaseStudentPhoto,
  uploadSupabaseTeacherPhoto,
} from "./supabase-repository.js";

const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "local-development-secret-change-before-deploy";
const isProduction = process.env.NODE_ENV === "production";
const localJavaEnabled = process.env.LOCAL_JAVA_EXECUTION === "true" && !isProduction;
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000").split(",").map((value) => value.trim());
const serverSessionId = randomUUID();
let activeExecutions = 0;
const lastExecution = new Map<string, number>();
const onlineConnections = new Map<string, number>();
const fileOperationQueues = new Map<string, Promise<void>>();
const fileOperationRevisions = new Map<string, number>();
const liveFileSnapshots = new Map<string, { teamId: string; fileId: string; content: string; updatedById: string; updatedBy: string }>();
const liveActiveFiles = new Map<string, { teamId: string; fileId: string; path: string; language: string; content: string; version: number; updatedById: string; updatedBy: string; changedAt: number }>();

type SessionUser = { id: string; role: "teacher" | "student"; email: string; name: string; passwordResetRequired: boolean };
type SessionToken = SessionUser & { serverSessionId: string };
type AuthedRequest = Request & { user?: SessionUser };

function sessionUserFromToken(session: SessionToken): SessionUser {
  return { id: session.id, role: session.role, email: session.email, name: session.name, passwordResetRequired: session.passwordResetRequired };
}

function sessionToken(user: SessionUser) {
  return jwt.sign({ ...user, serverSessionId }, JWT_SECRET, { expiresIn: "7d" });
}

function setSession(res: Response, user: SessionUser) {
  res.cookie("javashare_session", sessionToken(user), {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 86400000,
    path: "/",
  });
}

function readToken(cookieHeader = "") {
  const token = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith("javashare_session="))?.split("=")[1];
  if (!token) return null;
  try {
    const session = jwt.verify(decodeURIComponent(token), JWT_SECRET) as SessionToken;
    if (session.serverSessionId !== serverSessionId) return null;
    return sessionUserFromToken(session);
  } catch {
    return null;
  }
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.javashare_session;
  if (!token) return res.status(401).json({ error: "Sign in required" });
  try {
    const session = jwt.verify(token, JWT_SECRET) as SessionToken;
    if (session.serverSessionId !== serverSessionId) {
      res.clearCookie("javashare_session", { path: "/" });
      return res.status(401).json({ error: "The app restarted. Please sign in again." });
    }
    req.user = sessionUserFromToken(session);
    next();
  } catch {
    return res.status(401).json({ error: "Session expired" });
  }
}

function requireTeacher(req: AuthedRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "teacher") return res.status(403).json({ error: "Teacher access required" });
  next();
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: isProduction ? allowedOrigins : true, credentials: true } });
app.use(cors({ origin: isProduction ? allowedOrigins : true, credentials: true }));
app.use(express.json({ limit: "300kb" }));
app.use(cookieParser());

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
    setSession(res, user);
    return res.status(201).json({ user });
  } catch (error) { next(error); }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const input = z.object({ email: z.string().email(), password: z.string().max(128).optional().default("") }).parse(req.body);
    const user = await loginWithSupabase(input);
    setSession(res, user);
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

app.post("/api/auth/change-reset-password", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { password } = z.object({ password: z.string().min(8).max(128) }).parse(req.body);
    const user = await changeSupabaseResetPassword(req.user!, password);
    setSession(res, user);
    return res.json({ user });
  } catch (error) { next(error); }
});

app.get("/api/teacher/students", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try {
    const result = await listSupabaseStudents(req.user!);
    return res.json({ students: result.students.map((student) => ({ ...student, online: onlineConnections.has(student.id) })) });
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

app.put("/api/teacher/students/:studentId/photo", requireAuth, requireTeacher, express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "2mb" }), async (req: AuthedRequest, res, next) => {
  try {
    const studentId = z.string().uuid().parse(req.params.studentId);
    const contentType = String(req.headers["content-type"] || "").split(";")[0];
    if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) return res.status(415).json({ error: "Choose a JPG, PNG, or WebP image" });
    if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: "Choose an image to upload" });
    return res.json(await uploadSupabaseStudentPhoto(req.user!, studentId, req.body, contentType));
  } catch (error) { next(error); }
});

app.put("/api/teacher/profile/photo", requireAuth, requireTeacher, express.raw({ type: ["image/jpeg", "image/png", "image/webp"], limit: "2mb" }), async (req: AuthedRequest, res, next) => {
  try {
    const contentType = String(req.headers["content-type"] || "").split(";")[0];
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

app.post("/api/classes/join", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { joinCode } = z.object({ joinCode: z.string().min(4).max(20) }).parse(req.body);
    return res.json(await joinSupabaseClass(req.user!, joinCode));
  } catch (error) { next(error); }
});

app.get("/api/bootstrap", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const teacherView = req.query.view === "groups" ? "groups" : "students";
    return res.json(await bootstrapFromSupabase(req.user!, teacherView));
  } catch (error) { next(error); }
});

app.post("/api/classes/:classroomId/auto-group", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const classroomId = String(req.params.classroomId);
    const { groupSize, studentIds } = z.object({ groupSize: z.number().int().min(2).max(10).default(3), studentIds: z.array(z.string().uuid()).optional() }).parse(req.body || {});
    const result = await autoGroupSupabaseClass(req.user!, classroomId, groupSize, studentIds || [...onlineConnections.keys()]);
    io.to(`class:${classroomId}`).emit("groups:updated");
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
    io.to(`class:${classroomId}`).emit("class:activity-deployed", payload);
    return res.status(201).json(payload);
  } catch (error) { next(error); }
});

app.post("/api/classes/:classroomId/end-activity", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const classroomId = String(req.params.classroomId);
    const payload = await endSupabaseActivity(req.user!, classroomId);
    io.to(`class:${classroomId}`).emit("class:activity-ended", payload);
    return res.json(payload);
  } catch (error) { next(error); }
});

app.post("/api/classes/:classroomId/activities/:activityId/reopen", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try {
    const classroomId = String(req.params.classroomId);
    const activityId = z.string().uuid().parse(req.params.activityId);
    const payload = await reopenSupabaseActivity(req.user!, classroomId, activityId);
    io.to(`class:${classroomId}`).emit("class:activity-deployed", payload);
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
    io.to(`class:${payload.classroomId}`).emit("groups:updated", payload);
    io.to(`team:${teamId}`).emit("team:profile-updated", payload);
    return res.json(payload);
  } catch (error) { next(error); }
});

app.put("/api/teams/:teamId/group-permissions", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const teamId = String(req.params.teamId);
    const input = z.object({ userId: z.string().uuid(), chatMuted: z.boolean(), editingLocked: z.boolean() }).parse(req.body);
    const payload = await updateSupabaseGroupPermissions(req.user!, teamId, input);
    io.to(`team:${teamId}`).emit("team:permissions-updated", payload);
    io.to(`class:${payload.classroomId}`).emit("groups:updated");
    return res.json(payload);
  } catch (error) { next(error); }
});

app.post("/api/teams/:teamId/messages", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const teamId = String(req.params.teamId);
    const { text } = z.object({ text: z.string().trim().min(1).max(1000) }).parse(req.body);
    const payload = await sendSupabaseMessage(req.user!, teamId, text);
    io.to(`team:${teamId}`).emit("chat:message", payload);
    return res.status(201).json(payload);
  } catch (error) { next(error); }
});

app.put("/api/classes/:classroomId/chat-mute", requireAuth, requireTeacher, async (req: AuthedRequest, res, next) => {
  try {
    const { muted } = z.object({ muted: z.boolean() }).parse(req.body);
    const payload = await setSupabaseClassroomChatMuted(req.user!, String(req.params.classroomId), muted);
    io.to(`class:${payload.classroomId}`).emit("class:chat-muted", payload);
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
    io.to(`class:${classroomId}`).emit("class:live-share", payload);
    return res.json(payload);
  } catch (error) { next(error); }
});

app.put("/api/files/:fileId", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const input = z.object({ content: z.string().max(200000), version: z.number().int().positive() }).parse(req.body);
    const result = await saveSupabaseFile(req.user!, String(req.params.fileId), input);
    liveFileSnapshots.set(result.update.fileId, { teamId: result.teamId, fileId: result.update.fileId, content: result.update.content, updatedById: req.user!.id, updatedBy: req.user!.name });
    io.to(`team:${result.teamId}`).emit("file:updated", result.update);
    if (result.presenting) io.to(`class:${result.classroomId}`).emit("class:live-share-update", { projectId: result.projectId, ...result.update });
    return res.json(result.update);
  } catch (error) { next(error); }
});

const javaFilePath = z.string().trim().min(1).max(160).transform((value) => value.replace(/\\/g, "/")).refine(
  (value) => /^(?:[A-Za-z_$][\w$]*\/)*[A-Za-z_$][\w$]*\.java$/.test(value) && !value.includes(".."),
  "Use a valid Java filename, for example src/Helper.java",
);

app.post("/api/projects/:projectId/files", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const input = z.object({ path: javaFilePath, content: z.string().max(200000).default("") }).parse(req.body);
    return res.status(201).json(await createSupabaseFile(req.user!, String(req.params.projectId), input));
  } catch (error) { next(error); }
});

app.patch("/api/files/:fileId", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const { path } = z.object({ path: javaFilePath }).parse(req.body);
    return res.json(await renameSupabaseFile(req.user!, String(req.params.fileId), path));
  } catch (error) { next(error); }
});

app.post("/api/projects/:projectId/submit", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const payload = await submitSupabaseProject(req.user!, String(req.params.projectId));
    io.to(`team:${payload.teamId}`).emit("team:submitted", payload);
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

type JudgeResult = { compile_output?: string; stderr?: string; stdout?: string; message?: string; status?: { description?: string } };
type ProcessResult = { stdout: string; stderr: string; exitCode: number | null; timedOut: boolean; outputLimited: boolean };

function runLimitedProcess(command: string, args: string[], cwd: string, stdin: string, timeoutMs: number): Promise<ProcessResult> {
  return new Promise((resolveProcess, rejectProcess) => {
    const child = spawn(command, args, { cwd, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = ""; let stderr = ""; let outputLimited = false; let finished = false; let timedOut = false;
    const outputLimit = 64 * 1024;
    const stopTree = () => {
      if (process.platform === "win32" && child.pid) spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { windowsHide: true, stdio: "ignore" });
      else child.kill("SIGKILL");
    };
    const collect = (target: "stdout" | "stderr", chunk: Buffer) => {
      const text = chunk.toString("utf8");
      if (stdout.length + stderr.length + text.length > outputLimit) { outputLimited = true; stopTree(); return; }
      if (target === "stdout") stdout += text; else stderr += text;
    };
    child.stdout.on("data", (chunk: Buffer) => collect("stdout", chunk));
    child.stderr.on("data", (chunk: Buffer) => collect("stderr", chunk));
    child.on("error", rejectProcess);
    child.stdin.end(stdin);
    const timer = setTimeout(() => { if (!finished) { timedOut = true; stopTree(); } }, timeoutMs);
    child.on("close", (exitCode) => {
      finished = true;
      clearTimeout(timer);
      resolveProcess({ stdout, stderr, exitCode, timedOut, outputLimited });
    });
  });
}

type ExecutableJavaFile = { path: string; content: string };

async function executeLocally(files: ExecutableJavaFile[], stdin: string) {
  const code = files.map((file) => file.content).join("\n");
  const blocked = [
    /\b(?:java\.io|java\.nio\.file|java\.net)\b/,
    /\b(?:ProcessBuilder|Runtime\.getRuntime|System\.exit|ClassLoader|javax\.script)\b/,
  ];
  if (blocked.some((pattern) => pattern.test(code))) throw new Error("This local classroom runner blocks file, network, process, and system-control APIs.");
  const directory = await mkdtemp(join(tmpdir(), "javashare-"));
  try {
    for (const file of files) {
      const relativePath = file.path.replace(/\\/g, "/").replace(/^src\//, "");
      const destination = join(directory, ...relativePath.split("/"));
      await mkdir(join(destination, ".."), { recursive: true });
      await writeFile(destination, file.content, "utf8");
    }
    const sourcePaths = files.map((file) => file.path.replace(/\\/g, "/").replace(/^src\//, ""));
    const compiled = await runLimitedProcess("javac", ["-encoding", "UTF-8", "-d", directory, ...sourcePaths], directory, "", 10000);
    if (compiled.outputLimited) return "Compilation stopped: output exceeded 64 KB.";
    if (compiled.timedOut) return "Compilation stopped after 10 seconds.";
    if (compiled.exitCode !== 0) return compiled.stderr || compiled.stdout || "Compilation failed.";
    const mainFile = files.find((file) => /(?:^|\/)Main\.java$/.test(file.path));
    if (!mainFile) return "Run failed: this project needs a Main.java file containing public static void main(String[] args).";
    const packageName = mainFile.content.match(/^\s*package\s+([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\s*;/m)?.[1];
    const mainClass = packageName ? `${packageName}.Main` : "Main";
    const executed = await runLimitedProcess("java", ["-Xmx128m", "-Xss1m", "-cp", directory, mainClass], directory, stdin, 5000);
    if (executed.outputLimited) return `${executed.stdout}${executed.stderr}\n\nExecution stopped: output exceeded 64 KB.`;
    if (executed.timedOut) return `${executed.stdout}${executed.stderr}\n\nExecution stopped after 5 seconds.`;
    return executed.stdout || executed.stderr || `Process finished with exit code ${executed.exitCode}.`;
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

app.post("/api/execute", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const javaPath = z.string().trim().min(1).max(160).transform((value) => value.replace(/\\/g, "/")).refine((value) => /^(?:[A-Za-z_$][\w$]*\/)*[A-Za-z_$][\w$]*\.java$/.test(value) && !value.includes(".."));
    const { files, stdin = "" } = z.object({ files: z.array(z.object({ path: javaPath, content: z.string().max(200000) })).min(1).max(50), stdin: z.string().max(10000).optional() }).parse(req.body);
    if (!process.env.JUDGE0_URL && localJavaEnabled) {
      const lastRun = lastExecution.get(req.user!.id) || 0;
      if (Date.now() - lastRun < 1500) return res.status(429).json({ error: "Please wait briefly before running again" });
      if (activeExecutions >= 2) return res.status(429).json({ error: "The classroom runner is busy; try again shortly" });
      lastExecution.set(req.user!.id, Date.now());
      activeExecutions += 1;
      try { return res.json({ mode: "local", output: await executeLocally(files, stdin) }); }
      finally { activeExecutions -= 1; }
    }
    if (!process.env.JUDGE0_URL) return res.json({ mode: "demo", output: "Java execution is not configured. Enable the guarded local runner for development or connect Judge0.\n\n[Demo execution mode]" });
    if (files.length > 1) return res.status(501).json({ error: "Multi-file execution requires the classroom local Java runner" });
    const response = await fetch(`${process.env.JUDGE0_URL.replace(/\/$/, "")}/submissions?base64_encoded=false&wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(process.env.JUDGE0_API_KEY ? { "X-Auth-Token": process.env.JUDGE0_API_KEY } : {}) },
      body: JSON.stringify({ source_code: files[0].content, stdin, language_id: 62, cpu_time_limit: 3, memory_limit: 128000 }),
    });
    if (!response.ok) return res.status(502).json({ error: `Judge0 returned ${response.status}` });
    const result = await response.json() as JudgeResult;
    return res.json({ mode: "judge0", output: result.compile_output || result.stderr || result.stdout || result.message || result.status?.description || "Program completed without output." });
  } catch (error) { next(error); }
});

io.use((socket, next) => {
  const user = readToken(socket.handshake.headers.cookie);
  if (!user) return next(new Error("Unauthorized"));
  socket.data.user = user;
  next();
});

io.on("connection", (socket) => {
  const connectedUser = socket.data.user as SessionUser;
  const connectionCount = (onlineConnections.get(connectedUser.id) || 0) + 1;
  onlineConnections.set(connectedUser.id, connectionCount);

  void supabaseClassIds(connectedUser)
    .then((classIds) => classIds.forEach((classroomId) => {
      void socket.join(`class:${classroomId}`);
      if (connectionCount === 1) io.to(`class:${classroomId}`).emit("class:presence", { userId: connectedUser.id, online: true });
    }))
    .catch((error) => console.error("Could not join classroom socket rooms:", error));

  socket.on("class:join", async (classroomId: string, acknowledge?: (payload: unknown) => void) => {
    try {
      if (!await canAccessSupabaseClass(connectedUser, classroomId)) return;
      await socket.join(`class:${classroomId}`);
      const lateAssignment = await assignLateStudentToGroup(connectedUser, classroomId);
      if (lateAssignment) {
        io.to(`class:${classroomId}`).emit("groups:updated", lateAssignment);
        socket.emit("group:late-assigned", lateAssignment);
      }
      const memberIds = await supabaseClassMemberIds(connectedUser, classroomId);
      socket.emit("class:presence-snapshot", memberIds.filter((id) => onlineConnections.has(id)));
      const payload = await supabaseLiveSharePayload(connectedUser, classroomId);
      if (typeof acknowledge === "function") acknowledge(payload);
      else socket.emit("class:live-share", payload);
    } catch (error) { console.error("Could not join classroom room:", error); }
  });

  socket.on("team:join", async (teamId: string, acknowledge?: (joined: boolean) => void) => {
    try {
      const joined = await canAccessSupabaseTeam(connectedUser, teamId);
      if (joined) {
        await socket.join(`team:${teamId}`);
        const snapshots = [...liveFileSnapshots.values()].filter((snapshot) => snapshot.teamId === teamId);
        if (snapshots.length) socket.emit("team:live-snapshots", snapshots);
        const activeSelection = [...liveActiveFiles.values()].filter((selection) => selection.teamId === teamId).sort((a, b) => b.changedAt - a.changedAt)[0];
        if (activeSelection) socket.emit("team:active-file", activeSelection);
      }
      if (typeof acknowledge === "function") acknowledge(joined);
    } catch (error) {
      console.error("Could not join team room:", error);
      if (typeof acknowledge === "function") acknowledge(false);
    }
  });

  socket.on("team:file-draft", async (draft: { teamId?: string; fileId?: string; content?: string; sequence?: number }) => {
    try {
      if (!draft || typeof draft.content !== "string" || draft.content.length > 200000 || !Number.isSafeInteger(draft.sequence) || (draft.sequence ?? 0) < 1) return;
      if (!draft.teamId || !draft.fileId || !await canEditSupabaseTeamFile(connectedUser, draft.fileId, draft.teamId)) return;
      socket.to(`team:${draft.teamId}`).emit("team:file-draft", {
        fileId: draft.fileId,
        content: draft.content,
        sequence: draft.sequence,
        updatedById: connectedUser.id,
        updatedBy: connectedUser.name,
      });
    } catch (error) { console.error("Could not relay team draft:", error); }
  });

  socket.on("team:file-operation", (operation: { teamId?: string; fileId?: string; start?: { line?: number; column?: number }; end?: { line?: number; column?: number }; text?: string; content?: string; sequence?: number }) => {
    const pointIsValid = (point: typeof operation.start) => point && Number.isSafeInteger(point.line) && Number.isSafeInteger(point.column) && (point.line ?? -1) >= 0 && (point.column ?? -1) >= 0;
    if (!operation || typeof operation.text !== "string" || typeof operation.content !== "string" || operation.text.length > 200000 || operation.content.length > 200000 || !pointIsValid(operation.start) || !pointIsValid(operation.end) || !Number.isSafeInteger(operation.sequence) || (operation.sequence ?? 0) < 1 || !operation.teamId || !operation.fileId) return;
    const fileId = operation.fileId;
    const previous = fileOperationQueues.get(fileId) || Promise.resolve();
    const queued = previous.catch(() => undefined).then(async () => {
      if (!await canEditSupabaseTeamFile(connectedUser, fileId, operation.teamId!)) return;
      const revision = (fileOperationRevisions.get(fileId) || 0) + 1;
      fileOperationRevisions.set(fileId, revision);
      liveFileSnapshots.set(fileId, { teamId: operation.teamId!, fileId, content: operation.content!, updatedById: connectedUser.id, updatedBy: connectedUser.name });
      socket.to(`team:${operation.teamId}`).emit("team:file-operation", { ...operation, revision, updatedById: connectedUser.id, updatedBy: connectedUser.name });
    }).catch((error) => console.error("Could not relay team operation:", error));
    fileOperationQueues.set(fileId, queued);
  });

  socket.on("team:cursor", async (cursor: { teamId?: string; fileId?: string; line?: number; column?: number }) => {
    try {
      if (!cursor?.teamId || !cursor.fileId || !Number.isSafeInteger(cursor.line) || !Number.isSafeInteger(cursor.column) || (cursor.line ?? -1) < 0 || (cursor.column ?? -1) < 0) return;
      if (!await supabaseFileBelongsToTeam(connectedUser, cursor.fileId, cursor.teamId)) return;
      socket.to(`team:${cursor.teamId}`).emit("team:cursor", { fileId: cursor.fileId, line: cursor.line, column: cursor.column, userId: connectedUser.id, name: connectedUser.name });
    } catch (error) { console.error("Could not relay team cursor:", error); }
  });

  socket.on("team:active-file", async (selection: { teamId?: string; fileId?: string; path?: string; language?: string; content?: string; version?: number }) => {
    try {
      if (connectedUser.role !== "student" || !selection?.teamId || !selection.fileId || typeof selection.path !== "string" || typeof selection.content !== "string" || selection.content.length > 200000 || !Number.isSafeInteger(selection.version) || (selection.version ?? 0) < 1) return;
      if (!await supabaseFileBelongsToTeam(connectedUser, selection.fileId, selection.teamId)) return;
      const payload = { teamId: selection.teamId, fileId: selection.fileId, path: selection.path, language: selection.language || "java", content: selection.content, version: selection.version!, updatedById: connectedUser.id, updatedBy: connectedUser.name, changedAt: Date.now() };
      liveActiveFiles.set(`${selection.teamId}:${connectedUser.id}`, payload);
      socket.to(`team:${selection.teamId}`).emit("team:active-file", payload);
    } catch (error) { console.error("Could not relay active team file:", error); }
  });

  socket.on("class:live-share-draft", async (draft: { classroomId?: string; projectId?: string; fileId?: string; content?: string; sequence?: number }) => {
    try {
      if (!draft || typeof draft.content !== "string" || draft.content.length > 200000 || !Number.isSafeInteger(draft.sequence) || (draft.sequence ?? 0) < 1) return;
      if (!draft.classroomId || !draft.projectId || !draft.fileId || !await canSendSupabaseLiveDraft(connectedUser, draft.classroomId, draft.projectId, draft.fileId)) return;
      socket.to(`class:${draft.classroomId}`).emit("class:live-share-draft", {
        projectId: draft.projectId,
        fileId: draft.fileId,
        content: draft.content,
        sequence: draft.sequence,
      });
    } catch (error) { console.error("Could not relay live-share draft:", error); }
  });

  socket.on("disconnect", () => {
    const remaining = Math.max(0, (onlineConnections.get(connectedUser.id) || 1) - 1);
    if (remaining) onlineConnections.set(connectedUser.id, remaining);
    else {
      onlineConnections.delete(connectedUser.id);
      void supabaseClassIds(connectedUser).then((classIds) => classIds.forEach((classroomId) => {
        io.to(`class:${classroomId}`).emit("class:presence", { userId: connectedUser.id, online: false });
      })).catch((error) => console.error("Could not broadcast presence:", error));
    }
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  void _next;
  if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message || "Invalid request" });
  if (error instanceof SupabaseRepositoryError) return res.status(error.status).json({ error: error.message });
  console.error(error);
  return res.status(500).json({ error: "Unexpected server error" });
});

async function startServer() {
  try {
    await database.connect();
    console.log(`${database.mode} database connected`);
  } catch (error) {
    console.error("Database connection failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
    return;
  }
  httpServer.listen(PORT, "0.0.0.0", () => console.log(`JavaShare backend listening on http://0.0.0.0:${PORT}`));
}

void startServer();
