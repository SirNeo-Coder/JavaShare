import { paperPerformanceTask, personalProjectFiles, type PersonalSubmission } from "./personal-performance.ts";
import { moduleAccessBlock, type ModuleAccessBlock, type ModuleAccessSummary } from "./module-prerequisites.ts";
import { createHash, randomBytes } from "node:crypto";
import { activityStateId, activityTask, activityAccess, checkModuleRun, checkableStep, findActivity, matchesActivityOutput, matchesSample, unchangedSample, samplePending, sampleStateId, mergeProjectFiles, teacherCheckedStep, webPerformanceTask, webStep, type ActivityStep, type ModuleFile, type ActivityProjects } from "./module-activities.ts";
import { courseModule, type CourseModule } from "./course-module-schema.ts";
import { createSupabaseAuthClient, getSupabaseAdmin } from "./database.ts";
import { JAVA_PATH, JAVA_PATH_MAX_LENGTH, fileLanguage, moduleWebPathError, projectPathError } from "./file-paths.ts";

export type SupabaseSessionUser = {
  id: string;
  role: "teacher" | "student";
  email: string;
  name: string;
  passwordResetRequired: boolean;
};

export class SupabaseRepositoryError extends Error {
  readonly status: number;
  readonly moduleAccess?: ModuleAccessBlock;
  constructor(status: number, message: string, moduleAccess?: ModuleAccessBlock) { super(message); this.status = status; this.moduleAccess = moduleAccess; }
}

type ModuleSubject = "java" | "net-mvc";
type ClassroomRow = { module_subject: ModuleSubject | null; id: string; name: string; subject: string; join_code: string; teacher_id: string; current_activity_id: string | null; live_share_project_id: string | null; chat_muted: boolean; active_module_id: string | null };
type TeamRow = { id: string; classroom_id: string; owner_id: string | null; slug: string; name: string; leader_id: string | null; chat_muted: boolean; editing_locked: boolean };
type ProjectRow = { id: string; classroom_id: string; team_id: string; activity_id: string | null; title: string; description: string; language?: string };
type ActivityRow = { id: string; classroom_id: string; title: string; mode: "individual" | "group"; ended_at: string | null };
type ProfileSummary = { id: string; name: string; email: string; photo_path?: string | null; photoUrl?: string | null };

function fail(error: { message: string } | null, fallback: string): asserts error is null {
  if (error) throw new Error(`${fallback}: ${error.message}`);
}

function sessionUser(profile: Record<string, unknown>): SupabaseSessionUser {
  return {
    id: String(profile.id),
    role: profile.role === "teacher" ? "teacher" : "student",
    email: String(profile.email || ""),
    name: String(profile.name || "User"),
    passwordResetRequired: Boolean(profile.password_reset_required),
  };
}

const starterCode = `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, CodeShare!");
    }
}`;

async function createClassroomWorkspace(classroomId: string, teacherId: string) {
  const db = getSupabaseAdmin();
  const { error: memberError } = await db.from("classroom_members").insert({ classroom_id: classroomId, user_id: teacherId });
  fail(memberError, "Could not add teacher to classroom");
  const { data: team, error: teamError } = await db.from("teams").insert({
    classroom_id: classroomId, owner_id: teacherId, slug: "teacher-demo", name: "Teacher Demo Workspace",
  }).select("id").single();
  fail(teamError, "Could not create teacher workspace");
  const { error: teamMemberError } = await db.from("team_members").insert({ team_id: team.id, user_id: teacherId });
  fail(teamMemberError, "Could not add teacher to workspace");
  const { data: project, error: projectError } = await db.from("projects").insert({
    classroom_id: classroomId,
    team_id: team.id,
    title: "Live Lesson Code",
    description: "The teacher's persistent workspace for live coding demonstrations.",
  }).select("id").single();
  fail(projectError, "Could not create teacher project");
  const { error: fileError } = await db.from("code_files").insert({
    project_id: project.id, path: "src/Main.java", content: starterCode, updated_by: teacherId,
  });
  fail(fileError, "Could not create starter file");
}

async function createStarterClass(teacherId: string) {
  const db = getSupabaseAdmin();
  const { data: classroom, error: classroomError } = await db.from("classrooms").insert({
    name: "CS 101 · Period 3", join_code: "JAVA101", teacher_id: teacherId,
  }).select("id").single();
  fail(classroomError, "Could not create starter classroom");
  await createClassroomWorkspace(classroom.id, teacherId);
}

function generateJoinCode() {
  return randomBytes(5).toString("hex").toUpperCase().slice(0, 6);
}

export async function createSupabaseClassroom(teacherId: string, input: { name: string; subject: "Java" | "Net MVC" }) {
  const db = getSupabaseAdmin();
  const row = { name: input.name, teacher_id: teacherId, subject: input.subject, module_subject: input.subject === "Java" ? "java" : "net-mvc" };
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: classroom, error } = await db.from("classrooms")
      .insert({ ...row, join_code: generateJoinCode() })
      .select("id,name,subject,module_subject,join_code").single();
    if (!error) {
      await createClassroomWorkspace(classroom.id, teacherId);
      return { id: classroom.id, name: classroom.name, subject: classroom.subject, joinCode: classroom.join_code };
    }
    if (!error.message.includes("join_code")) throw new Error(`Could not create classroom: ${error.message}`);
  }
  throw new Error("Could not generate a unique join code");
}

export async function registerWithSupabase(input: { name: string; email: string; password: string }) {
  const db = getSupabaseAdmin();
  const email = input.email.toLowerCase();
  const { count, error: countError } = await db.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher");
  fail(countError, "Could not inspect teacher accounts");
  const role: "teacher" | "student" = count === 0 ? "teacher" : "student";
  const { data, error } = await db.auth.admin.createUser({
    email, password: input.password, email_confirm: true, user_metadata: { name: input.name },
  });
  if (error) throw new SupabaseRepositoryError(error.message.toLowerCase().includes("already") ? 409 : 400, error.message);
  if (!data.user) throw new Error("Supabase did not return the created user");
  try {
    if (role === "teacher") {
      const { error: roleError } = await db.from("profiles").update({ role: "teacher" }).eq("id", data.user.id);
      fail(roleError, "Could not assign teacher role");
      await createStarterClass(data.user.id);
    }
    const { data: profile, error: profileError } = await db.from("profiles").select("*").eq("id", data.user.id).single();
    fail(profileError, "Could not load new profile");
    return sessionUser(profile);
  } catch (creationError) {
    await db.auth.admin.deleteUser(data.user.id);
    throw creationError;
  }
}

export async function loginWithSupabase(input: { email: string; password: string }) {
  const db = getSupabaseAdmin();
  if (!input.password) {
    const { data: resetProfile, error: resetError } = await db.from("profiles").select("*").eq("email", input.email.toLowerCase()).eq("password_reset_required", true).maybeSingle();
    fail(resetError, "Could not inspect reset account");
    if (!resetProfile) throw new SupabaseRepositoryError(401, "Invalid email or password");
    return sessionUser(resetProfile);
  }
  const auth = createSupabaseAuthClient();
  const { data, error } = await auth.auth.signInWithPassword({ email: input.email.toLowerCase(), password: input.password });
  if (error || !data.user) throw new SupabaseRepositoryError(401, "Invalid email or password");
  const { data: profile, error: profileError } = await db.from("profiles").select("*").eq("id", data.user.id).single();
  fail(profileError, "Could not load account profile");
  return sessionUser(profile);
}

async function ensurePersonalWorkspace(classroom: ClassroomRow, user: SupabaseSessionUser) {
  const db = getSupabaseAdmin();
  const { data: existing, error: existingError } = await db.from("teams").select("*")
    .eq("classroom_id", classroom.id).eq("owner_id", user.id).maybeSingle();
  fail(existingError, "Could not inspect personal workspace");
  if (existing) return existing;
  const { data: team, error: teamError } = await db.from("teams").insert({
    classroom_id: classroom.id, owner_id: user.id, slug: `student-${user.id}`,
    name: `${user.name}'s Workspace`,
  }).select("*").single();
  fail(teamError, "Could not create personal workspace");
  const { error: memberError } = await db.from("team_members").insert({ team_id: team.id, user_id: user.id });
  fail(memberError, "Could not join personal workspace");
  const { data: project, error: projectError } = await db.from("projects").insert({
    classroom_id: classroom.id, team_id: team.id, title: "My Practice Code",
    description: "Your permanent space for code you create outside assigned activities.",
  }).select("id").single();
  fail(projectError, "Could not create personal project");
  const { error: fileError } = await db.from("code_files").insert({
    project_id: project.id, path: "src/Main.java", content: starterCode, updated_by: user.id,
  });
  fail(fileError, "Could not create personal starter file");
  return team;
}

const webStarterFiles = [
  { path: "index.html", language: "html", content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Web Page</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello, CodeShare!</h1>
  <p>Edit index.html, style.css, and script.js, then press Run.</p>
  <script src="script.js"></script>
</body>
</html>
` },
  { path: "style.css", language: "css", content: `body {
  font-family: Arial, sans-serif;
  margin: 2rem;
}

h1 {
  color: #2563eb;
}
` },
  { path: "script.js", language: "javascript", content: `console.log("Hello from script.js");
` },
];

export async function createSupabaseWebProject(user: SupabaseSessionUser, classroomId: string, title: string) {
  if (user.role !== "student") throw new SupabaseRepositoryError(403, "Only students can create web projects");
  const db = getSupabaseAdmin();
  const { data: team, error: teamError } = await db.from("teams").select("id").eq("classroom_id", classroomId).eq("owner_id", user.id).maybeSingle();
  fail(teamError, "Could not load personal workspace");
  if (!team) throw new SupabaseRepositoryError(404, "Join the class before creating a web project");
  const { count, error: countError } = await db.from("projects").select("id", { count: "exact", head: true }).eq("team_id", team.id).is("activity_id", null);
  fail(countError, "Could not count personal projects");
  if ((count ?? 0) >= 20) throw new SupabaseRepositoryError(400, "You already have 20 personal projects");
  const { data: project, error: projectError } = await db.from("projects").insert({
    classroom_id: classroomId, team_id: team.id, title, language: "web",
    description: "An HTML, CSS, and JavaScript page that runs in your browser.",
  }).select("*").single();
  fail(projectError, "Could not create web project");
  const { data: files, error: fileError } = await db.from("code_files")
    .insert(webStarterFiles.map((file) => ({ ...file, project_id: project.id, updated_by: user.id })))
    .select("id,path,language,content,version").order("path");
  if (fileError) {
    await db.from("projects").delete().eq("id", project.id);
    fail(fileError, "Could not create web project files");
  }
  return { project: { id: project.id, title: project.title, description: project.description, language: "web" }, files };
}

export async function joinSupabaseClass(user: SupabaseSessionUser, joinCode: string) {
  const db = getSupabaseAdmin();
  const { data: classroom, error } = await db.from("classrooms").select("*").eq("join_code", joinCode.toUpperCase()).maybeSingle();
  fail(error, "Could not find classroom");
  if (!classroom) throw new SupabaseRepositoryError(404, "Class code not found");
  const { error: joinError } = await db.from("classroom_members").upsert(
    { classroom_id: classroom.id, user_id: user.id }, { onConflict: "classroom_id,user_id" },
  );
  fail(joinError, "Could not join classroom");
  const team = user.role === "student" ? await ensurePersonalWorkspace(classroom, user) : null;
  return { teamId: team?.id, teamName: team?.name };
}

async function loadClasses(user: SupabaseSessionUser): Promise<ClassroomRow[]> {
  const db = getSupabaseAdmin();
  if (user.role === "teacher") {
    const { data, error } = await db.from("classrooms").select("*").eq("teacher_id", user.id).order("created_at");
    fail(error, "Could not load classrooms");
    return data as ClassroomRow[];
  }
  const { data: memberships, error: membershipError } = await db.from("classroom_members").select("classroom_id").eq("user_id", user.id);
  fail(membershipError, "Could not load classroom memberships");
  const ids = memberships.map((item) => item.classroom_id);
  if (!ids.length) return [];
  const { data, error } = await db.from("classrooms").select("*").in("id", ids).order("created_at");
  fail(error, "Could not load classrooms");
  return data as ClassroomRow[];
}

export async function supabaseClassIds(user: SupabaseSessionUser) {
  return (await loadClasses(user)).map((classroom) => classroom.id);
}

export async function canAccessSupabaseClass(user: SupabaseSessionUser, classroomId: string) {
  return (await supabaseClassIds(user)).includes(classroomId);
}

function classSummary(user: SupabaseSessionUser, classroom: ClassroomRow) {
  return {
    id: classroom.id, name: classroom.name, subject: classroom.module_subject === "java" ? "Java" : classroom.module_subject === "net-mvc" ? "Net MVC" : classroom.subject,
    hasActivity: Boolean(classroom.current_activity_id), hasLiveShare: Boolean(classroom.live_share_project_id),
    // shortcut: a same-project restart missed entirely while disconnected has the same id;
    // add a persisted session start time if those restarts must be distinguished too.
    liveSessionId: classroom.current_activity_id ? `activity:${classroom.current_activity_id}`
      : classroom.live_share_project_id ? `share:${classroom.live_share_project_id}` : null,
    ...(user.role === "teacher" ? { joinCode: classroom.join_code } : {}),
  };
}

// The class list screen: every class the user belongs to, with no workspace data loaded.
export async function listSupabaseClassSummaries(user: SupabaseSessionUser) {
  return (await loadClasses(user)).map((classroom) => classSummary(user, classroom));
}

async function canAccessSupabaseTeam(user: SupabaseSessionUser, teamId: string) {
  const db = getSupabaseAdmin();
  const { data: requestedTeam, error: requestedTeamError } = await db.from("teams").select("classroom_id,slug").eq("id", teamId).maybeSingle();
  fail(requestedTeamError, "Could not verify team classroom");
  if (requestedTeam?.slug === "teacher-demo") return canAccessSupabaseClass(user, requestedTeam.classroom_id);
  if (user.role === "student") {
    const { data, error } = await db.from("team_members").select("team_id").eq("team_id", teamId).eq("user_id", user.id).maybeSingle();
    fail(error, "Could not verify team membership");
    return Boolean(data);
  }
  const { data: team, error } = await db.from("teams").select("classroom_id").eq("id", teamId).maybeSingle();
  fail(error, "Could not verify team classroom");
  return Boolean(team && await canAccessSupabaseClass(user, team.classroom_id));
}

export async function bootstrapFromSupabase(user: SupabaseSessionUser, teacherView: "students" | "groups", classroomId?: string) {
  const db = getSupabaseAdmin();
  // No classroomId: this is the class list screen - every class, no workspace data (teams,
  // activities, ...) loaded for any of them, so one class's activity/team state can never mix
  // with another's (see CKB-010 for the same class of bug in module progress).
  if (!classroomId) {
    const classrooms = await listSupabaseClassSummaries(user);
    return { user, classrooms, teams: [], groupCount: 0, classroomChatTeamId: null, classroomChatMuted: false, currentActivity: null, needsJoin: user.role === "student" && classrooms.length === 0 };
  }
  if (!await canAccessSupabaseClass(user, classroomId)) throw new SupabaseRepositoryError(403, "Classroom access denied");
  const { data: classroomRow, error: classroomRowError } = await db.from("classrooms").select("*").eq("id", classroomId).single();
  fail(classroomRowError, "Could not load classroom");
  const classes = [classroomRow as ClassroomRow];
  if (user.role === "student") await Promise.all(classes.map((classroom) => ensurePersonalWorkspace(classroom, user)));
  const classIds = classes.map((item) => item.id);

  const { data: activityData, error: activityError } = await db.from("activities").select("*").in("classroom_id", classIds).order("created_at", { ascending: false });
  fail(activityError, "Could not load activities");
  const activities = activityData as ActivityRow[];
  for (const classroom of classes) {
    const pointedActivity = activities.find((activity) => activity.id === classroom.current_activity_id && !activity.ended_at);
    if (pointedActivity) continue;
    const recoverable = activities.find((activity) => activity.classroom_id === classroom.id && !activity.ended_at);
    const recoveredId = recoverable?.id || null;
    const staleOpenIds = activities.filter((activity) => activity.classroom_id === classroom.id && !activity.ended_at && activity.id !== recoveredId).map((activity) => activity.id);
    if (staleOpenIds.length) {
      const endedAt = new Date().toISOString();
      const { error: staleError } = await db.from("activities").update({ ended_at: endedAt }).in("id", staleOpenIds);
      fail(staleError, "Could not reconcile duplicate open activities");
      activities.forEach((activity) => { if (staleOpenIds.includes(activity.id)) activity.ended_at = endedAt; });
    }
    if (classroom.current_activity_id !== recoveredId) {
      const { error: recoveryError } = await db.from("classrooms").update({ current_activity_id: recoveredId }).eq("id", classroom.id);
      fail(recoveryError, "Could not recover classroom activity state");
      classroom.current_activity_id = recoveredId;
    }
  }
  let teams: TeamRow[] = [];
  if (user.role === "teacher") {
    const result = await db.from("teams").select("*").in("classroom_id", classIds).order("created_at");
    fail(result.error, "Could not load teams"); teams = result.data as TeamRow[];
  } else {
    const memberships = await db.from("team_members").select("team_id").eq("user_id", user.id);
    fail(memberships.error, "Could not load team memberships");
    const teamIds = memberships.data.map((item) => item.team_id);
    if (teamIds.length) {
      const result = await db.from("teams").select("*").in("id", teamIds).in("classroom_id", classIds).order("created_at");
      fail(result.error, "Could not load teams"); teams = result.data as TeamRow[];
    }
  }
  const classroomChatResult = await db.from("teams").select("id,classroom_id").in("classroom_id", classIds).eq("slug", "teacher-demo");
  fail(classroomChatResult.error, "Could not load classroom chat channel");
  const teamIds = teams.map((item) => item.id);
  let projects: ProjectRow[] = [];
  if (teamIds.length) {
    const result = await db.from("projects").select("*").in("team_id", teamIds).order("created_at", { ascending: false });
    fail(result.error, "Could not load projects"); projects = result.data as ProjectRow[];
  }
  const activeActivityIds = new Set(activities.filter((item) => !item.ended_at).map((item) => item.id));
  const entries: Array<{ team: TeamRow; project: ProjectRow | null }> = [];
  for (const team of teams) {
    const teamProjects = projects.filter((project) => project.team_id === team.id);
    if (user.role === "student") {
      teamProjects.filter((project) => project.activity_id && activeActivityIds.has(project.activity_id)).forEach((project) => entries.push({ team, project }));
      const personal = team.owner_id ? teamProjects.filter((project) => !project.activity_id).reverse() : [];
      personal.forEach((project) => entries.push({ team, project }));
      if (!entries.some((entry) => entry.team.id === team.id)) entries.push({ team, project: teamProjects[0] || null });
      continue;
    }
    if (team.slug === "teacher-demo") {
      entries.unshift({ team, project: teamProjects.find((project) => !project.activity_id) || teamProjects[0] || null });
      continue;
    }
    const classroom = classes.find((item) => item.id === team.classroom_id);
    const currentActivity = activities.find((item) => item.id === classroom?.current_activity_id && !item.ended_at);
    if (teacherView === "groups") {
      if (team.owner_id) continue;
      entries.push({ team, project: teamProjects.find((project) => project.activity_id === currentActivity?.id) || teamProjects.find((project) => !project.activity_id) || null });
    } else {
      if (!team.owner_id || currentActivity?.mode === "group") continue;
      entries.push({ team, project: teamProjects.find((project) => project.activity_id === currentActivity?.id) || teamProjects.filter((project) => !project.activity_id).at(-1) || null });
    }
  }
  const projectIds = entries.flatMap((entry) => entry.project ? [entry.project.id] : []);
  const filesResult = projectIds.length ? await db.from("code_files").select("*").in("project_id", projectIds).order("path") : { data: [], error: null };
  fail(filesResult.error, "Could not load files");
  const memberResult = teamIds.length ? await db.from("team_members").select("team_id,user_id").in("team_id", teamIds) : { data: [], error: null };
  fail(memberResult.error, "Could not load team members");
  const memberIds = [...new Set(memberResult.data.map((item) => item.user_id))];
  const profilesResult = memberIds.length ? await db.from("profiles").select("id,name,email,photo_path").in("id", memberIds) : { data: [], error: null };
  fail(profilesResult.error, "Could not load member profiles");
  const profiles = profilesResult.data as ProfileSummary[];
  await Promise.all(profiles.map(async (profile) => {
    if (!profile.photo_path) return;
    const { data } = await db.storage.from("student-photos").createSignedUrl(profile.photo_path, 3600);
    profile.photoUrl = data?.signedUrl || null;
  }));
  const submissionResult = projectIds.length ? await db.from("submissions").select("id,project_id,submitted_by").in("project_id", projectIds) : { data: [], error: null };
  fail(submissionResult.error, "Could not load submissions");
  const submissionIds = submissionResult.data.map((item) => item.id);
  const creditsResult = submissionIds.length ? await db.from("submission_credits").select("submission_id,user_id").in("submission_id", submissionIds) : { data: [], error: null };
  fail(creditsResult.error, "Could not load submission credits");
  const voteResult = user.role === "student" && teamIds.length ? await db.from("group_leader_votes").select("team_id,candidate_id").eq("voter_id", user.id).in("team_id", teamIds) : { data: [], error: null };
  fail(voteResult.error, "Could not load member leader votes");
  const permissionResult = teamIds.length ? await db.from("group_member_permissions").select("team_id,user_id,chat_muted,editing_locked").in("team_id", teamIds) : { data: [], error: null };
  fail(permissionResult.error, "Could not load group member permissions");

  const payload = entries.map(({ team, project }) => {
    const memberships = memberResult.data.filter((item) => item.team_id === team.id);
    const members = memberships.map((membership) => profiles.find((profile) => profile.id === membership.user_id)).filter((member): member is ProfileSummary => Boolean(member));
    const submissions = project ? submissionResult.data.filter((item) => item.project_id === project.id) : [];
    const completed = submissions.some((submission) => team.owner_id === null || submission.submitted_by === user.id || creditsResult.data.some((credit) => credit.submission_id === submission.id && credit.user_id === user.id));
    const isGroup = team.owner_id === null;
    return {
      id: team.id, slug: team.slug,
      name: user.role === "student" && !isGroup ? project?.title || "My Practice Code" : team.name,
      isGroup, isTeacherWorkspace: team.slug === "teacher-demo", leaderId: team.leader_id, myLeaderVoteId: voteResult.data.find((vote) => vote.team_id === team.id)?.candidate_id || null, chatMuted: Boolean(team.chat_muted), editingLocked: Boolean(team.editing_locked),
      members: members.map((member) => { const permission = permissionResult.data.find((item) => item.team_id === team.id && item.user_id === member.id); return { id: member.id, name: member.name, email: member.email, photoUrl: member.photoUrl || null, isLeader: member.id === team.leader_id, chatMuted: Boolean(permission?.chat_muted), editingLocked: Boolean(permission?.editing_locked) }; }),
      completed,
      project: project ? { id: project.id, title: project.title, description: project.description, language: project.language || "java", ...(project.activity_id ? { activityId: project.activity_id } : {}) } : null,
      files: project ? filesResult.data.filter((file) => file.project_id === project.id).map((file) => ({ id: file.id, path: file.path, language: file.language, content: file.content, version: file.version })) : [],
    };
  });
  const firstClass = classes[0];
  const classroomChatTeamId = classroomChatResult.data.find((team) => team.classroom_id === firstClass?.id)?.id || null;
  const currentActivity = activities.find((item) => item.id === firstClass?.current_activity_id && !item.ended_at) || null;
  const populatedGroupIds = new Set(memberResult.data.map((item) => item.team_id));
  const groupCount = user.role === "teacher" ? teams.filter((team) => team.owner_id === null && team.slug.startsWith("group-") && populatedGroupIds.has(team.id)).length : 0;
  const visiblePayload = user.role === "teacher" && teacherView === "groups"
    ? payload.filter((team) => team.isTeacherWorkspace || team.members.length > 0)
    : payload;
  return {
    user: { ...user, photoUrl: profiles.find((profile) => profile.id === user.id)?.photoUrl || null },
    classrooms: classes.map((item) => classSummary(user, item)),
    teams: visiblePayload, groupCount, classroomChatTeamId, classroomChatMuted: Boolean(firstClass?.chat_muted),
    currentActivity: currentActivity ? { id: currentActivity.id, title: currentActivity.title, mode: currentActivity.mode } : null,
    needsJoin: false,
  };
}

async function accessibleProject(user: SupabaseSessionUser, projectId: string) {
  const db = getSupabaseAdmin();
  const { data: project, error } = await db.from("projects").select("*").eq("id", projectId).maybeSingle();
  fail(error, "Could not load project");
  if (!project || !await canAccessSupabaseTeam(user, project.team_id)) throw new SupabaseRepositoryError(403, "Workspace access denied");
  return project as ProjectRow;
}

export async function listSupabaseMessages(user: SupabaseSessionUser, teamId: string) {
  if (!await canAccessSupabaseTeam(user, teamId)) throw new SupabaseRepositoryError(403, "Team access denied");
  const db = getSupabaseAdmin();
  const { data: messages, error } = await db.from("messages").select("id,text,created_at,author_id").eq("team_id", teamId).order("created_at").limit(100);
  fail(error, "Could not load messages");
  const authorIds = [...new Set(messages.map((message) => message.author_id))];
  const profilesResult = authorIds.length ? await db.from("profiles").select("id,name,email,photo_path").in("id", authorIds) : { data: [], error: null };
  fail(profilesResult.error, "Could not load message authors");
  const profiles = profilesResult.data as ProfileSummary[];
  await Promise.all(profiles.map(async (profile) => {
    if (!profile.photo_path) return;
    const { data } = await db.storage.from("student-photos").createSignedUrl(profile.photo_path, 3600);
    profile.photoUrl = data?.signedUrl || null;
  }));
  return { messages: messages.map((message) => ({
    id: message.id, text: message.text, createdAt: message.created_at,
    author: profiles.find((profile) => profile.id === message.author_id) || { id: message.author_id, name: "User" },
  })) };
}

export async function sendSupabaseMessage(user: SupabaseSessionUser, teamId: string, text: string) {
  if (!await canAccessSupabaseTeam(user, teamId)) throw new SupabaseRepositoryError(403, "Team access denied");
  const db = getSupabaseAdmin();
  const { data: team, error: teamError } = await db.from("teams").select("owner_id,leader_id").eq("id", teamId).single();
  fail(teamError, "Could not load chat permissions");
  if (!team.owner_id && team.leader_id !== user.id) {
    const { data: permission, error: permissionError } = await db.from("group_member_permissions").select("chat_muted").eq("team_id", teamId).eq("user_id", user.id).maybeSingle();
    fail(permissionError, "Could not load member chat permission");
    if (permission?.chat_muted) throw new SupabaseRepositoryError(403, "The group leader muted your chat");
  }
  const { data: channel, error: channelError } = await db.from("teams").select("slug,classroom_id").eq("id", teamId).maybeSingle();
  fail(channelError, "Could not load chat channel");
  if (channel?.slug === "teacher-demo" && user.role === "student") {
    const { data: classroom, error: classroomError } = await db.from("classrooms").select("chat_muted").eq("id", channel.classroom_id).maybeSingle();
    fail(classroomError, "Could not load classroom chat settings");
    if (classroom?.chat_muted) throw new SupabaseRepositoryError(403, "The teacher has muted classroom chat");
  }
  const { data: message, error } = await db.from("messages").insert({ team_id: teamId, author_id: user.id, text }).select("id,text,created_at").single();
  fail(error, "Could not send message");
  const { data: profile, error: profileError } = await db.from("profiles").select("photo_path").eq("id", user.id).single();
  fail(profileError, "Could not load message author");
  let photoUrl: string | null = null;
  if (profile.photo_path) {
    const { data } = await db.storage.from("student-photos").createSignedUrl(profile.photo_path, 3600);
    photoUrl = data?.signedUrl || null;
  }
  return { id: message.id, text: message.text, createdAt: message.created_at, author: { id: user.id, _id: user.id, name: user.name, photoUrl } };
}

export async function setSupabaseClassroomChatMuted(user: SupabaseSessionUser, classroomId: string, muted: boolean) {
  if (user.role !== "teacher" || !await canAccessSupabaseClass(user, classroomId)) throw new SupabaseRepositoryError(403, "Only the classroom teacher can mute chat");
  const db = getSupabaseAdmin();
  const { error } = await db.from("classrooms").update({ chat_muted: muted }).eq("id", classroomId);
  fail(error, "Could not update classroom chat");
  return { classroomId, muted };
}

export async function updateSupabaseGroup(user: SupabaseSessionUser, teamId: string, input: { name: string; leaderId: string }) {
  if (!await canAccessSupabaseTeam(user, teamId)) throw new SupabaseRepositoryError(403, "Group access denied");
  const db = getSupabaseAdmin();
  const { data: team, error: teamError } = await db.from("teams").select("id,classroom_id,owner_id,leader_id,name").eq("id", teamId).maybeSingle();
  fail(teamError, "Could not load group");
  if (!team || team.owner_id) throw new SupabaseRepositoryError(400, "This is not a group workspace");
  const { data: voterMembership, error: voterError } = await db.from("team_members").select("user_id").eq("team_id", teamId).eq("user_id", user.id).maybeSingle();
  fail(voterError, "Could not verify voter membership");
  if (!voterMembership) throw new SupabaseRepositoryError(403, "Only group members can vote for their leader");
  const { data: existingVote, error: existingVoteError } = await db.from("group_leader_votes").select("candidate_id").eq("team_id", teamId).eq("voter_id", user.id).maybeSingle();
  fail(existingVoteError, "Could not inspect leader vote");
  if (existingVote) {
    if (team.leader_id !== user.id) throw new SupabaseRepositoryError(403, "Your vote is complete; only the elected leader can open group settings");
    const { error: renameError } = await db.from("teams").update({ name: input.name }).eq("id", teamId);
    fail(renameError, "Could not rename group");
    return { teamId, classroomId: team.classroom_id, name: input.name, leaderId: team.leader_id, renamed: true };
  }
  const { data: membership, error: memberError } = await db.from("team_members").select("user_id").eq("team_id", teamId).eq("user_id", input.leaderId).maybeSingle();
  fail(memberError, "Could not verify group leader");
  if (!membership) throw new SupabaseRepositoryError(400, "Vote for a student who belongs to this group");
  const { error: voteError } = await db.from("group_leader_votes").insert({ team_id: teamId, voter_id: user.id, candidate_id: input.leaderId });
  fail(voteError, "Could not save leader vote");
  const { data: votes, error: votesError } = await db.from("group_leader_votes").select("candidate_id").eq("team_id", teamId);
  fail(votesError, "Could not count leader votes");
  const counts = new Map<string, number>();
  votes.forEach((vote) => counts.set(vote.candidate_id, (counts.get(vote.candidate_id) || 0) + 1));
  const highest = Math.max(...counts.values());
  const tied = [...counts.entries()].filter(([, count]) => count === highest).map(([candidateId]) => candidateId);
  const leaderId = tied[Math.floor(Math.random() * tied.length)];
  const { error } = await db.from("teams").update({ leader_id: leaderId }).eq("id", teamId);
  fail(error, "Could not update group");
  const { data: classroom } = await db.from("classrooms").select("current_activity_id").eq("id", team.classroom_id).maybeSingle();
  if (classroom?.current_activity_id) {
    const { data: project } = await db.from("projects").select("id").eq("team_id", teamId).eq("activity_id", classroom.current_activity_id).maybeSingle();
    if (project) {
      const { error: clearLeaderError } = await db.from("activity_workspace_members").update({ is_leader: false }).eq("project_id", project.id);
      fail(clearLeaderError, "Could not update activity leader snapshot");
      const { error: leaderSnapshotError } = await db.from("activity_workspace_members").update({ is_leader: true }).eq("project_id", project.id).eq("user_id", leaderId);
      fail(leaderSnapshotError, "Could not save elected leader snapshot");
    }
  }
  return { teamId, classroomId: team.classroom_id, name: team.name, leaderId, votes: [...counts.entries()].map(([candidateId, count]) => ({ candidateId, count })), totalVotes: votes.length };
}

export async function updateSupabaseGroupPermissions(user: SupabaseSessionUser, teamId: string, input: { userId: string; chatMuted: boolean; editingLocked: boolean }) {
  const db = getSupabaseAdmin();
  const { data: team, error: teamError } = await db.from("teams").select("classroom_id,owner_id,leader_id").eq("id", teamId).maybeSingle();
  fail(teamError, "Could not load group permissions");
  if (!team || team.owner_id) throw new SupabaseRepositoryError(400, "This is not a group workspace");
  if (team.leader_id !== user.id) throw new SupabaseRepositoryError(403, "Only the elected group leader can change group permissions");
  if (input.userId === user.id) throw new SupabaseRepositoryError(400, "The leader cannot restrict their own account");
  const { data: member, error: memberError } = await db.from("team_members").select("user_id").eq("team_id", teamId).eq("user_id", input.userId).maybeSingle();
  fail(memberError, "Could not verify group member");
  if (!member) throw new SupabaseRepositoryError(404, "Group member not found");
  const { error } = await db.from("group_member_permissions").upsert({ team_id: teamId, user_id: input.userId, chat_muted: input.chatMuted, editing_locked: input.editingLocked, updated_at: new Date().toISOString() }, { onConflict: "team_id,user_id" });
  fail(error, "Could not update member permissions");
  return { teamId, classroomId: team.classroom_id, userId: input.userId, chatMuted: input.chatMuted, editingLocked: input.editingLocked };
}

export async function supabaseLiveSharePayload(user: SupabaseSessionUser, classroomId: string) {
  if (!await canAccessSupabaseClass(user, classroomId)) throw new SupabaseRepositoryError(403, "Classroom access denied");
  const db = getSupabaseAdmin();
  const { data: classroom, error: classError } = await db.from("classrooms").select("teacher_id,live_share_project_id").eq("id", classroomId).single();
  fail(classError, "Could not load classroom sharing state");
  if (!classroom.live_share_project_id) return { active: false as const };
  const { data: project, error: projectError } = await db.from("projects").select("id,team_id,title").eq("id", classroom.live_share_project_id).eq("classroom_id", classroomId).maybeSingle();
  fail(projectError, "Could not load shared project");
  if (!project) return { active: false as const };
  const [{ data: files, error: fileError }, { data: teacher, error: teacherError }] = await Promise.all([
    db.from("code_files").select("id,path,language,content,version").eq("project_id", project.id).order("path"),
    db.from("profiles").select("name,photo_path").eq("id", classroom.teacher_id).single(),
  ]);
  fail(fileError, "Could not load shared files"); fail(teacherError, "Could not load presenter");
  let presenterPhotoUrl: string | null = null;
  if (teacher.photo_path) {
    const { data } = await db.storage.from("student-photos").createSignedUrl(teacher.photo_path, 3600);
    presenterPhotoUrl = data?.signedUrl || null;
  }
  return { active: true as const, projectId: project.id, title: project.title, presenterName: teacher.name, presenterPhotoUrl, files };
}

export async function setSupabaseLiveShare(user: SupabaseSessionUser, classroomId: string, projectId: string | null) {
  if (user.role !== "teacher") throw new SupabaseRepositoryError(403, "Only a teacher can control class sharing");
  const db = getSupabaseAdmin();
  const { data: classroom, error: classError } = await db.from("classrooms").select("id").eq("id", classroomId).eq("teacher_id", user.id).maybeSingle();
  fail(classError, "Could not load classroom");
  if (!classroom) throw new SupabaseRepositoryError(403, "Classroom access denied");
  if (projectId) {
    const { data: project, error: projectError } = await db.from("projects").select("team_id").eq("id", projectId).eq("classroom_id", classroomId).maybeSingle();
    fail(projectError, "Could not load presentation project");
    const { data: team, error: teamError } = project ? await db.from("teams").select("slug").eq("id", project.team_id).maybeSingle() : { data: null, error: null };
    fail(teamError, "Could not load presentation workspace");
    if (!project || team?.slug !== "teacher-demo") throw new SupabaseRepositoryError(400, "Only the Teacher Demo Workspace can be presented");
  }
  const { error } = await db.from("classrooms").update({ live_share_project_id: projectId }).eq("id", classroomId);
  fail(error, "Could not update sharing state");
  return supabaseLiveSharePayload(user, classroomId);
}

async function fileContext(user: SupabaseSessionUser, fileId: string) {
  const db = getSupabaseAdmin();
  const { data: file, error } = await db.from("code_files").select("*").eq("id", fileId).maybeSingle();
  fail(error, "Could not load file");
  if (!file) throw new SupabaseRepositoryError(404, "File not found");
  const project = await accessibleProject(user, file.project_id);
  const { data: team, error: teamError } = await db.from("teams").select("owner_id,leader_id").eq("id", project.team_id).single();
  fail(teamError, "Could not load editing permissions");
  if (!team.owner_id && team.leader_id !== user.id) {
    const { data: permission, error: permissionError } = await db.from("group_member_permissions").select("editing_locked").eq("team_id", project.team_id).eq("user_id", user.id).maybeSingle();
    fail(permissionError, "Could not load member editing permission");
    if (permission?.editing_locked) throw new SupabaseRepositoryError(403, "The group leader locked your code editing");
  }
  return { db, file, project };
}

export async function saveSupabaseFile(user: SupabaseSessionUser, fileId: string, input: { content: string; version: number }) {
  const { db, file, project } = await fileContext(user, fileId);
  const { data: team, error: teamError } = await db.from("teams").select("owner_id").eq("id", project.team_id).single();
  fail(teamError, "Could not identify file workspace");
  const isGroup = team.owner_id === null;
  if (isGroup && file.version !== input.version) throw new SupabaseRepositoryError(409, "A teammate saved a newer version");
  const versionWrite = { file_id: file.id, version: file.version, content: file.content, author_id: user.id };
  const versionResult = isGroup
    ? await db.from("file_versions").insert(versionWrite)
    : await db.from("file_versions").upsert(versionWrite, { onConflict: "file_id,version", ignoreDuplicates: true });
  if (versionResult.error) throw new SupabaseRepositoryError(versionResult.error.code === "23505" ? 409 : 500, isGroup && versionResult.error.code === "23505" ? "A teammate saved a newer version" : versionResult.error.message);
  const { data: updated, error: updateError } = await db.from("code_files").update({ content: input.content, version: file.version + 1, updated_by: user.id })
    .eq("id", file.id).eq("version", file.version).select("id,content,version").maybeSingle();
  fail(updateError, "Could not save file");
  if (!updated) throw new SupabaseRepositoryError(409, isGroup ? "A teammate saved a newer version" : "The file changed while saving. Please try again");
  const { data: presenting } = await db.from("classrooms").select("id").eq("id", project.classroom_id).eq("live_share_project_id", project.id).maybeSingle();
  return { update: { fileId: updated.id, content: updated.content, version: updated.version, updatedBy: user.name, updatedById: user.id }, teamId: project.team_id, classroomId: project.classroom_id, projectId: project.id, presenting: Boolean(presenting) };
}

export async function createSupabaseFile(user: SupabaseSessionUser, projectId: string, input: { path: string; content: string }) {
  const project = await accessibleProject(user, projectId);
  const db = getSupabaseAdmin();
  const { data: team, error: teamError } = await db.from("teams").select("owner_id,leader_id").eq("id", project.team_id).single();
  fail(teamError, "Could not load editing permissions");
  if (!team.owner_id && team.leader_id !== user.id) {
    const { data: permission, error: permissionError } = await db.from("group_member_permissions").select("editing_locked").eq("team_id", project.team_id).eq("user_id", user.id).maybeSingle();
    fail(permissionError, "Could not load member editing permission");
    if (permission?.editing_locked) throw new SupabaseRepositoryError(403, "The group leader locked your code editing");
  }
  const pathError = projectPathError(project.language, input.path);
  if (pathError) throw new SupabaseRepositoryError(400, pathError);
  const { data: file, error } = await db.from("code_files").insert({ project_id: project.id, path: input.path, content: input.content, language: fileLanguage(input.path), updated_by: user.id })
    .select("id,path,language,content,version").single();
  if (error) throw new SupabaseRepositoryError(error.code === "23505" ? 409 : 500, error.code === "23505" ? "A file with that name already exists" : error.message);
  return file;
}

export async function renameSupabaseFile(user: SupabaseSessionUser, fileId: string, path: string) {
  const { db, file, project } = await fileContext(user, fileId);
  const pathError = projectPathError(project.language, path);
  if (pathError) throw new SupabaseRepositoryError(400, pathError);
  const { data: updated, error } = await db.from("code_files").update({ path, language: fileLanguage(path), updated_by: user.id }).eq("id", file.id)
    .select("id,path,language,content,version").single();
  if (error) throw new SupabaseRepositoryError(error.code === "23505" ? 409 : 500, error.code === "23505" ? "A file with that name already exists" : error.message);
  return updated;
}

async function teacherClassroom(user: SupabaseSessionUser, classroomId: string) {
  if (user.role !== "teacher") throw new SupabaseRepositoryError(403, "Teacher access required");
  const db = getSupabaseAdmin();
  const { data, error } = await db.from("classrooms").select("*").eq("id", classroomId).eq("teacher_id", user.id).maybeSingle();
  fail(error, "Could not load classroom");
  if (!data) throw new SupabaseRepositoryError(403, "Classroom access denied");
  return data as ClassroomRow;
}

async function ensureSupabaseProject(input: {
  classroomId: string;
  teamId: string;
  activityId: string | null;
  title: string;
  description: string;
  starterCode: string;
  updatedBy: string;
}) {
  const db = getSupabaseAdmin();
  const syncRoster = async (projectId: string) => {
    if (!input.activityId) return;
    const [{ data: members, error: memberError }, { data: team, error: teamError }] = await Promise.all([
      db.from("team_members").select("user_id").eq("team_id", input.teamId),
      db.from("teams").select("leader_id").eq("id", input.teamId).single(),
    ]);
    fail(memberError, "Could not snapshot activity members"); fail(teamError, "Could not snapshot activity leader");
    if (members.length) {
      const { error } = await db.from("activity_workspace_members").upsert(members.map((member) => ({ project_id: projectId, user_id: member.user_id, is_leader: member.user_id === team.leader_id })), { onConflict: "project_id,user_id" });
      fail(error, "Could not save activity roster");
    }
  };
  let query = db.from("projects").select("*").eq("team_id", input.teamId);
  query = input.activityId ? query.eq("activity_id", input.activityId) : query.is("activity_id", null);
  const { data: existing, error: existingError } = await query.maybeSingle();
  fail(existingError, "Could not inspect activity project");
  if (existing) { await syncRoster(existing.id); return existing as ProjectRow; }
  const { data: project, error: projectError } = await db.from("projects").insert({
    classroom_id: input.classroomId,
    team_id: input.teamId,
    activity_id: input.activityId,
    title: input.title,
    description: input.description,
  }).select("*").single();
  fail(projectError, "Could not create activity project");
  const { error: fileError } = await db.from("code_files").insert({
    project_id: project.id,
    path: "src/Main.java",
    content: input.starterCode,
    updated_by: input.updatedBy,
  });
  fail(fileError, "Could not create activity starter file");
  await syncRoster(project.id);
  return project as ProjectRow;
}

export async function createSupabaseActivity(user: SupabaseSessionUser, classroomId: string, input: {
  title: string;
  description: string;
  mode: "individual" | "group";
  starterCode: string;
}) {
  const classroom = await teacherClassroom(user, classroomId);
  const db = getSupabaseAdmin();
  if (classroom.current_activity_id) {
    const { data: current, error } = await db.from("activities").select("ended_at").eq("id", classroom.current_activity_id).maybeSingle();
    fail(error, "Could not inspect the current activity");
    if (current && !current.ended_at) throw new SupabaseRepositoryError(409, "End the current activity before starting a new one");
    const { error: clearError } = await db.from("classrooms").update({ current_activity_id: null }).eq("id", classroomId).eq("current_activity_id", classroom.current_activity_id);
    fail(clearError, "Could not recover the classroom from its previous activity");
  }
  const { data: activity, error: activityError } = await db.from("activities").insert({
    classroom_id: classroomId, created_by: user.id, title: input.title,
    description: input.description, mode: input.mode, starter_code: input.starterCode,
  }).select("*").single();
  fail(activityError, "Could not create activity");
  const teamResult = input.mode === "individual"
    ? await db.from("teams").select("id").eq("classroom_id", classroomId).not("owner_id", "is", null).neq("slug", "teacher-demo")
    : await db.from("teams").select("id").eq("classroom_id", classroomId).is("owner_id", null).like("slug", "group-%");
  fail(teamResult.error, "Could not load activity workspaces");
  let targetIds = teamResult.data.map((team) => team.id);
  if (input.mode === "group" && targetIds.length) {
    const { data: memberships, error } = await db.from("team_members").select("team_id").in("team_id", targetIds);
    fail(error, "Could not load group memberships");
    const populated = new Set(memberships.map((item) => item.team_id));
    targetIds = targetIds.filter((id) => populated.has(id));
  }
  if (!targetIds.length) {
    await db.from("activities").delete().eq("id", activity.id);
    throw new SupabaseRepositoryError(400, input.mode === "group" ? "Create student groups first with Auto group" : "No students have joined this class yet");
  }
  await Promise.all(targetIds.map((teamId) => ensureSupabaseProject({
    classroomId, teamId, activityId: activity.id, title: activity.title,
    description: activity.description, starterCode: activity.starter_code, updatedBy: user.id,
  })));
  const { error: classError } = await db.from("classrooms").update({ current_activity_id: activity.id, live_share_project_id: null }).eq("id", classroomId);
  fail(classError, "Could not activate activity");
  return { id: activity.id, title: activity.title, description: activity.description, mode: activity.mode, workspaces: targetIds.length };
}

export async function endSupabaseActivity(user: SupabaseSessionUser, classroomId: string) {
  const classroom = await teacherClassroom(user, classroomId);
  if (!classroom.current_activity_id) throw new SupabaseRepositoryError(400, "There is no active activity to end");
  const db = getSupabaseAdmin();
  const { data: activity, error: activityError } = await db.from("activities").update({ ended_at: new Date().toISOString() })
    .eq("id", classroom.current_activity_id).select("id,title,mode").maybeSingle();
  fail(activityError, "Could not end activity");
  if (!activity) throw new SupabaseRepositoryError(404, "Active activity was not found");
  const { error: clearError } = await db.from("classrooms").update({ current_activity_id: null, live_share_project_id: null })
    .eq("id", classroomId).eq("current_activity_id", classroom.current_activity_id);
  fail(clearError, "Could not clear current activity");
  if (activity.mode === "group") {
    const { data: groups, error: groupError } = await db.from("teams").select("id,slug").eq("classroom_id", classroomId).is("owner_id", null).like("slug", "group-%");
    if (groupError) console.warn("Activity ended, but groups could not be loaded for cleanup:", groupError.message);
    const groupRows = groups ?? [];
    const groupIds = groupRows.map((group) => group.id);
    if (groupIds.length) {
      const cleanup = await Promise.all([
        db.from("messages").delete().in("team_id", groupIds),
        db.from("group_leader_votes").delete().in("team_id", groupIds),
        db.from("group_member_permissions").delete().in("team_id", groupIds),
        db.from("team_members").delete().in("team_id", groupIds),
      ]);
      for (const result of cleanup) {
        if (result.error) console.warn("Activity ended, but optional group cleanup failed:", result.error.message);
      }
      for (const group of groupRows) {
        const groupNumber = group.slug.match(/^group-(\d+)$/)?.[1] || "";
        const { error: resetError } = await db.from("teams").update({ name: `Group ${groupNumber}`.trim(), leader_id: null, chat_muted: false, editing_locked: false }).eq("id", group.id);
        if (resetError) console.warn("Activity ended, but a group profile could not be reset:", resetError.message);
      }
    }
  }
  return activity;
}

export async function reopenSupabaseActivity(user: SupabaseSessionUser, classroomId: string, activityId: string) {
  const classroom = await teacherClassroom(user, classroomId);
  if (classroom.current_activity_id) throw new SupabaseRepositoryError(409, "End the current activity before reopening another one");
  const db = getSupabaseAdmin();
  const { data: activity, error: activityError } = await db.from("activities").select("*").eq("id", activityId).eq("classroom_id", classroomId).maybeSingle();
  fail(activityError, "Could not load activity");
  if (!activity) throw new SupabaseRepositoryError(404, "Activity not found");
  if (!activity.ended_at) throw new SupabaseRepositoryError(409, "This activity is already open");
  const teamResult = activity.mode === "individual"
    ? await db.from("teams").select("id").eq("classroom_id", classroomId).not("owner_id", "is", null).neq("slug", "teacher-demo")
    : await db.from("teams").select("id").eq("classroom_id", classroomId).is("owner_id", null).like("slug", "group-%");
  fail(teamResult.error, "Could not load activity workspaces");
  let targetIds = teamResult.data.map((team) => team.id);
  if (activity.mode === "group" && targetIds.length) {
    const { data: memberships, error } = await db.from("team_members").select("team_id").in("team_id", targetIds);
    fail(error, "Could not load current groups");
    const populated = new Set(memberships.map((item) => item.team_id));
    targetIds = targetIds.filter((id) => populated.has(id));
  }
  if (!targetIds.length) throw new SupabaseRepositoryError(400, activity.mode === "group" ? "Create groups first, then reopen this activity" : "No students have joined this class yet");
  await Promise.all(targetIds.map((teamId) => ensureSupabaseProject({
    classroomId, teamId, activityId: activity.id, title: activity.title,
    description: activity.description, starterCode: activity.starter_code, updatedBy: user.id,
  })));
  const { error: reopenError } = await db.from("activities").update({ ended_at: null }).eq("id", activity.id);
  fail(reopenError, "Could not reopen activity");
  const { error: classError } = await db.from("classrooms").update({ current_activity_id: activity.id, live_share_project_id: null }).eq("id", classroomId);
  fail(classError, "Could not activate reopened activity");
  return { id: activity.id, title: activity.title, description: activity.description, mode: activity.mode, workspaces: targetIds.length, reopened: true };
}

export async function deleteSupabaseActivity(user: SupabaseSessionUser, classroomId: string, activityId: string) {
  const classroom = await teacherClassroom(user, classroomId);
  if (classroom.current_activity_id === activityId) throw new SupabaseRepositoryError(409, "End this activity before deleting it");
  const db = getSupabaseAdmin();
  const { data: activity, error: activityError } = await db.from("activities").select("id,title").eq("id", activityId).eq("classroom_id", classroomId).maybeSingle();
  fail(activityError, "Could not load activity");
  if (!activity) throw new SupabaseRepositoryError(404, "Activity not found");
  const { error } = await db.from("activities").delete().eq("id", activityId).eq("classroom_id", classroomId);
  fail(error, "Could not delete activity");
  return { id: activity.id, title: activity.title, deleted: true };
}

export async function autoGroupSupabaseClass(user: SupabaseSessionUser, classroomId: string, groupSize: number, activeUserIds: string[]) {
  await teacherClassroom(user, classroomId);
  const db = getSupabaseAdmin();
  const { data: classMembers, error: classMemberError } = await db.from("classroom_members").select("user_id").eq("classroom_id", classroomId).in("user_id", activeUserIds.length ? activeUserIds : ["00000000-0000-0000-0000-000000000000"]);
  fail(classMemberError, "Could not load active classroom members");
  const memberIds = classMembers.map((item) => item.user_id);
  const { data: students, error: studentError } = memberIds.length
    ? await db.from("profiles").select("id").in("id", memberIds).eq("role", "student")
    : { data: [], error: null };
  fail(studentError, "Could not load active students");
  if (!students.length) throw new SupabaseRepositoryError(400, "No active students are currently connected");
  const shuffled = [...students].sort(() => Math.random() - 0.5);
  const count = Math.ceil(shuffled.length / groupSize);
  const { data: existingGroups, error: groupError } = await db.from("teams").select("*").eq("classroom_id", classroomId).is("owner_id", null).like("slug", "group-%").order("created_at");
  fail(groupError, "Could not load groups");
  const groups = existingGroups as TeamRow[];
  while (groups.length < count) {
    let number = groups.length + 1;
    const used = new Set(groups.map((group) => group.slug));
    while (used.has(`group-${number}`)) number += 1;
    const { data: group, error } = await db.from("teams").insert({ classroom_id: classroomId, slug: `group-${number}`, name: `Group ${number}` }).select("*").single();
    fail(error, "Could not create group"); groups.push(group as TeamRow);
    await ensureSupabaseProject({ classroomId, teamId: group.id, activityId: null, title: "Group Assignment", description: "Work together in your shared workspace.", starterCode, updatedBy: user.id });
  }
  const groupIds = groups.map((group) => group.id);
  if (groupIds.length) {
    const { error: messageError } = await db.from("messages").delete().in("team_id", groupIds);
    fail(messageError, "Could not clear previous group messages");
    const { error: voteError } = await db.from("group_leader_votes").delete().in("team_id", groupIds);
    if (voteError) console.warn("Groups can still be created, but previous leader votes could not be cleared:", voteError.message);
    const { error: permissionError } = await db.from("group_member_permissions").delete().in("team_id", groupIds);
    if (permissionError) console.warn("Groups can still be created, but previous member permissions could not be cleared:", permissionError.message);
    const { error: clearError } = await db.from("team_members").delete().in("team_id", groupIds);
    fail(clearError, "Could not clear previous group assignments");
    for (const group of groups) {
      const groupNumber = group.slug.match(/^group-(\d+)$/)?.[1] || "";
      const { error: resetError } = await db.from("teams").update({ name: `Group ${groupNumber}`.trim(), leader_id: null, chat_muted: false, editing_locked: false }).eq("id", group.id);
      fail(resetError, "Could not reset group profiles");
    }
  }
  const assignments = shuffled.map((student, index) => ({ team_id: groups[index % count].id, user_id: student.id }));
  const { error: assignmentError } = await db.from("team_members").insert(assignments);
  fail(assignmentError, "Could not assign student groups");
  const { data: groupActivities, error: activityError } = await db.from("activities").select("*").eq("classroom_id", classroomId).eq("mode", "group").is("ended_at", null);
  fail(activityError, "Could not load group activities");
  await Promise.all(groups.slice(0, count).flatMap((group) => groupActivities.map((activity) => ensureSupabaseProject({
    classroomId, teamId: group.id, activityId: activity.id, title: activity.title,
    description: activity.description, starterCode: activity.starter_code, updatedBy: user.id,
  }))));
  return { groups: count, students: shuffled.length };
}

export async function assignLateStudentToGroup(user: SupabaseSessionUser, classroomId: string) {
  if (user.role !== "student") return null;
  const db = getSupabaseAdmin();
  const { data: classroom, error: classError } = await db.from("classrooms").select("current_activity_id").eq("id", classroomId).maybeSingle();
  fail(classError, "Could not inspect active group activity");
  if (!classroom?.current_activity_id) return null;
  const { data: activity, error: activityError } = await db.from("activities").select("*").eq("id", classroom.current_activity_id).eq("mode", "group").is("ended_at", null).maybeSingle();
  fail(activityError, "Could not inspect group activity");
  if (!activity) return null;
  const { data: groups, error: groupError } = await db.from("teams").select("id,name").eq("classroom_id", classroomId).is("owner_id", null).like("slug", "group-%");
  fail(groupError, "Could not load active groups");
  if (!groups.length) return null;
  const groupIds = groups.map((group) => group.id);
  const { data: existing, error: existingError } = await db.from("team_members").select("team_id").eq("user_id", user.id).in("team_id", groupIds).maybeSingle();
  fail(existingError, "Could not inspect student group");
  if (existing) return null;
  const { data: memberships, error: memberError } = await db.from("team_members").select("team_id").in("team_id", groupIds);
  fail(memberError, "Could not count group members");
  const counts = new Map(groupIds.map((id) => [id, 0]));
  memberships.forEach((membership) => counts.set(membership.team_id, (counts.get(membership.team_id) || 0) + 1));
  const smallest = [...groups].sort((a, b) => (counts.get(a.id) || 0) - (counts.get(b.id) || 0))[0];
  const { error: assignError } = await db.from("team_members").insert({ team_id: smallest.id, user_id: user.id });
  fail(assignError, "Could not assign reconnecting student");
  await ensureSupabaseProject({ classroomId, teamId: smallest.id, activityId: activity.id, title: activity.title, description: activity.description, starterCode: activity.starter_code, updatedBy: user.id });
  return { teamId: smallest.id, teamName: smallest.name, studentId: user.id, studentName: user.name };
}

export async function submitSupabaseProject(user: SupabaseSessionUser, projectId: string) {
  const project = await accessibleProject(user, projectId);
  if (!project.activity_id) throw new SupabaseRepositoryError(400, "Practice code is not an assigned activity and cannot be submitted");
  const db = getSupabaseAdmin();
  const { data: team, error: teamError } = await db.from("teams").select("id,owner_id,leader_id").eq("id", project.team_id).single();
  fail(teamError, "Could not load submission team");
  if (!team.owner_id) {
    if (!team.leader_id) throw new SupabaseRepositoryError(400, "Select a group leader before submitting");
    if (team.leader_id !== user.id) throw new SupabaseRepositoryError(403, "Only the selected group leader can submit group code");
  }
  const { data: files, error: fileError } = await db.from("code_files").select("path,language,content,version").eq("project_id", projectId).order("path");
  fail(fileError, "Could not load submission files");
  const { data: submission, error: submissionError } = await db.from("submissions").insert({
    project_id: projectId, team_id: team.id, submitted_by: user.id, files,
  }).select("id,created_at").single();
  fail(submissionError, "Could not submit project");
  let creditedMemberIds: string[];
  if (team.owner_id) creditedMemberIds = [user.id];
  else {
    const { data: members, error } = await db.from("team_members").select("user_id").eq("team_id", team.id);
    fail(error, "Could not load credited group members"); creditedMemberIds = members.map((member) => member.user_id);
  }
  if (creditedMemberIds.length) {
    const { error } = await db.from("submission_credits").insert(creditedMemberIds.map((userId) => ({ submission_id: submission.id, user_id: userId })));
    fail(error, "Could not credit submission members");
  }
  return { id: submission.id, projectId, teamId: team.id, submittedAt: submission.created_at, submittedBy: user.name, creditedMemberIds };
}

export async function listSupabaseSubmissions(user: SupabaseSessionUser) {
  const db = getSupabaseAdmin();
  let projectIds: string[] = [];
  if (user.role === "teacher") {
    const classIds = await supabaseClassIds(user);
    if (classIds.length) {
      const { data, error } = await db.from("projects").select("id").in("classroom_id", classIds);
      fail(error, "Could not load teacher projects"); projectIds = data.map((project) => project.id);
    }
  }
  let query = db.from("submissions").select("id,project_id,submitted_by,created_at,status,files").order("created_at", { ascending: false });
  if (user.role === "teacher") {
    if (!projectIds.length) return { submissions: [] };
    query = query.in("project_id", projectIds);
  } else query = query.eq("submitted_by", user.id);
  const { data: submissions, error } = await query;
  fail(error, "Could not load submissions");
  const submitterIds = [...new Set(submissions.map((submission) => submission.submitted_by))];
  const profileResult = submitterIds.length ? await db.from("profiles").select("id,name,email").in("id", submitterIds) : { data: [], error: null };
  fail(profileResult.error, "Could not load submitters");
  const profiles = profileResult.data as ProfileSummary[];
  return { submissions: submissions.map((item) => ({
    id: item.id, projectId: item.project_id,
    student: profiles.find((profile) => profile.id === item.submitted_by),
    submittedAt: item.created_at, status: item.status, files: item.files,
  })) };
}

export async function supabaseActivitySummary(user: SupabaseSessionUser) {
  if (user.role !== "teacher") throw new SupabaseRepositoryError(403, "Teacher access required");
  const db = getSupabaseAdmin();
  const classes = await loadClasses(user);
  const result = await Promise.all(classes.map(async (classroom) => {
    const { data: activities, error } = await db.from("activities").select("*").eq("classroom_id", classroom.id).order("created_at", { ascending: false });
    fail(error, "Could not load activity summary");
    const activitySummaries = await Promise.all(activities.map(async (activity) => {
      const { data: projects, error: projectError } = await db.from("projects").select("id,team_id").eq("activity_id", activity.id);
      fail(projectError, "Could not load activity projects");
      const workspaces = await Promise.all(projects.map(async (project) => {
        const [{ data: team, error: teamError }, { data: submission, error: submissionError }] = await Promise.all([
          db.from("teams").select("id,name").eq("id", project.team_id).single(),
          db.from("submissions").select("id,status,files,created_at,submitted_by").eq("project_id", project.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        ]);
        fail(teamError, "Could not load summary workspace"); fail(submissionError, "Could not load summary submission");
        const { data: roster, error: rosterError } = await db.from("activity_workspace_members").select("user_id,is_leader").eq("project_id", project.id);
        fail(rosterError, "Could not load activity roster");
        let memberships = roster;
        if (!memberships.length) {
          const current = await db.from("team_members").select("user_id").eq("team_id", team.id);
          fail(current.error, "Could not load summary members");
          memberships = current.data.map((item) => ({ user_id: item.user_id, is_leader: false }));
        }
        if (!memberships.length && submission) {
          const credits = await db.from("submission_credits").select("user_id").eq("submission_id", submission.id);
          fail(credits.error, "Could not load submitted group members");
          memberships = credits.data.map((item) => ({ user_id: item.user_id, is_leader: item.user_id === submission.submitted_by }));
        }
        const ids = memberships.map((item) => item.user_id);
        const profileResult = ids.length ? await db.from("profiles").select("id,name,email").in("id", ids) : { data: [], error: null };
        fail(profileResult.error, "Could not load summary profiles");
        return { projectId: project.id, workspaceName: team.name, members: profileResult.data.map((profile) => ({ ...profile, isLeader: memberships.some((member) => member.user_id === profile.id && member.is_leader) })), status: submission ? "done" : "pending", submittedAt: submission?.created_at || null, submission: submission ? { id: submission.id, status: submission.status, files: submission.files } : null };
      }));
      const completed = workspaces.filter((workspace) => workspace.status === "done").length;
      return { id: activity.id, title: activity.title, description: activity.description, mode: activity.mode, createdAt: activity.created_at, endedAt: activity.ended_at, isActive: classroom.current_activity_id === activity.id, total: workspaces.length, completed, pending: workspaces.length - completed, workspaces };
    }));
    return { id: classroom.id, name: classroom.name, subject: classroom.subject, currentActivityId: classroom.current_activity_id, activities: activitySummaries };
  }));
  return { teacher: user, classrooms: result };
}

export async function requestSupabasePasswordReset(email: string) {
  const db = getSupabaseAdmin();
  const { error } = await db.from("profiles").update({ password_reset_requested_at: new Date().toISOString() })
    .eq("email", email.toLowerCase()).eq("role", "student");
  fail(error, "Could not request password reset");
  return { message: "If that student account exists, the reset request has been sent to the teacher." };
}

export async function changeSupabaseResetPassword(user: SupabaseSessionUser, password: string) {
  const db = getSupabaseAdmin();
  const { data: profile, error } = await db.from("profiles").select("*").eq("id", user.id).maybeSingle();
  fail(error, "Could not load account");
  if (!profile) throw new SupabaseRepositoryError(404, "Account not found");
  if (!profile.password_reset_required) throw new SupabaseRepositoryError(400, "A password change is not required");
  const { error: passwordError } = await db.auth.admin.updateUserById(user.id, { password });
  if (passwordError) throw new Error(`Could not update password: ${passwordError.message}`);
  const { data: updated, error: updateError } = await db.from("profiles").update({
    password_reset_required: false, password_reset_requested_at: null,
  }).eq("id", user.id).select("*").single();
  fail(updateError, "Could not finish password reset");
  return sessionUser(updated);
}

export async function listSupabaseStudents(user: SupabaseSessionUser) {
  if (user.role !== "teacher") throw new SupabaseRepositoryError(403, "Teacher access required");
  const db = getSupabaseAdmin();
  const classIds = await supabaseClassIds(user);
  if (!classIds.length) return { students: [] };
  const { data: memberships, error: membershipError } = await db.from("classroom_members").select("user_id,joined_at").in("classroom_id", classIds);
  fail(membershipError, "Could not load classroom students");
  const joinedAt = new Map(memberships.map((item) => [item.user_id, item.joined_at]));
  const ids = [...joinedAt.keys()];
  if (!ids.length) return { students: [] };
  const { data: students, error } = await db.from("profiles").select("id,name,email,password_reset_required,password_reset_requested_at,created_at")
    .in("id", ids).eq("role", "student").order("password_reset_requested_at", { ascending: false, nullsFirst: false }).order("name");
  fail(error, "Could not load student accounts");
  const studentIds = students.map((student) => student.id);
  const teamResult = studentIds.length ? await db.from("teams").select("owner_id").in("classroom_id", classIds).in("owner_id", studentIds) : { data: [], error: null };
  fail(teamResult.error, "Could not inspect student workspaces");
  const workspaceOwners = new Set(teamResult.data.map((team) => team.owner_id));
  return { students: students.map((student) => ({
    id: student.id, name: student.name, email: student.email,
    passwordResetRequired: Boolean(student.password_reset_required),
    passwordResetRequestedAt: student.password_reset_requested_at,
    joinedAt: joinedAt.get(student.id) || student.created_at,
    hasWorkspace: workspaceOwners.has(student.id),
  })) };
}

async function requireTeacherStudent(user: SupabaseSessionUser, studentId: string) {
  if (user.role !== "teacher") throw new SupabaseRepositoryError(403, "Teacher access required");
  const db = getSupabaseAdmin();
  const classIds = await supabaseClassIds(user);
  const { data: membership, error } = classIds.length
    ? await db.from("classroom_members").select("user_id").in("classroom_id", classIds).eq("user_id", studentId).limit(1).maybeSingle()
    : { data: null, error: null };
  fail(error, "Could not verify classroom student");
  if (!membership) throw new SupabaseRepositoryError(404, "Student is not in your classroom");
  return classIds;
}

export async function approveSupabasePasswordReset(user: SupabaseSessionUser, studentId: string) {
  await requireTeacherStudent(user, studentId);
  const db = getSupabaseAdmin();
  const temporaryPassword = randomBytes(32).toString("base64url");
  const { error: authError } = await db.auth.admin.updateUserById(studentId, { password: temporaryPassword });
  if (authError) throw new Error(`Could not invalidate old password: ${authError.message}`);
  const { data: student, error } = await db.from("profiles").update({ password_reset_required: true, password_reset_requested_at: null })
    .eq("id", studentId).eq("role", "student").select("id,name,email").maybeSingle();
  fail(error, "Could not approve password reset");
  if (!student) throw new SupabaseRepositoryError(404, "Student account not found");
  return { student: { id: student.id, name: student.name, email: student.email, passwordResetRequired: true } };
}

export async function updateSupabaseStudent(user: SupabaseSessionUser, studentId: string, input: { name: string; email: string }) {
  await requireTeacherStudent(user, studentId);
  const db = getSupabaseAdmin();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const { data: current, error: currentError } = await db.from("profiles").select("name,email").eq("id", studentId).eq("role", "student").maybeSingle();
  fail(currentError, "Could not load student account");
  if (!current) throw new SupabaseRepositoryError(404, "Student account not found");
  const { error: authError } = await db.auth.admin.updateUserById(studentId, { email, email_confirm: true, user_metadata: { name } });
  if (authError) throw new SupabaseRepositoryError(authError.message.toLowerCase().includes("already") ? 409 : 400, `Could not update student login: ${authError.message}`);
  const { data: student, error } = await db.from("profiles").update({ name, email }).eq("id", studentId).eq("role", "student").select("id,name,email").single();
  if (error) {
    await db.auth.admin.updateUserById(studentId, { email: current.email, email_confirm: true, user_metadata: { name: current.name } });
    fail(error, "Could not update student details");
  }
  return { student };
}

export async function deleteSupabaseStudent(user: SupabaseSessionUser, studentId: string) {
  const classIds = await requireTeacherStudent(user, studentId);
  const db = getSupabaseAdmin();
  const { data: ownedTeams, error: teamError } = await db.from("teams").select("id").in("classroom_id", classIds).eq("owner_id", studentId);
  fail(teamError, "Could not load student workspaces");
  const ownedTeamIds = ownedTeams.map((team) => team.id);
  const cleanup = await Promise.all([
    db.from("submissions").delete().eq("submitted_by", studentId),
    db.from("messages").delete().eq("author_id", studentId),
    db.from("file_versions").delete().eq("author_id", studentId),
    db.from("teams").update({ leader_id: null }).in("classroom_id", classIds).eq("leader_id", studentId),
    ownedTeamIds.length ? db.from("teams").delete().in("id", ownedTeamIds) : Promise.resolve({ error: null }),
  ]);
  const cleanupError = cleanup.find((result) => result.error)?.error || null;
  fail(cleanupError, "Could not remove student classroom data");
  const { error: deleteError } = await db.auth.admin.deleteUser(studentId);
  if (deleteError) throw new Error(`Could not delete student account: ${deleteError.message}`);
}

export async function uploadSupabaseStudentPhoto(user: SupabaseSessionUser, studentId: string, image: Buffer, contentType: string) {
  await requireTeacherStudent(user, studentId);
  const db = getSupabaseAdmin();
  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const photoPath = `${studentId}/profile.${extension}`;
  const { data: current, error: profileError } = await db.from("profiles").select("photo_path").eq("id", studentId).single();
  fail(profileError, "Could not load student profile");
  if (current.photo_path && current.photo_path !== photoPath) {
    await db.storage.from("student-photos").remove([current.photo_path]);
  }
  const { error: uploadError } = await db.storage.from("student-photos").upload(photoPath, image, { contentType, upsert: true });
  fail(uploadError, "Could not upload student photo");
  const { error: updateError } = await db.from("profiles").update({ photo_path: photoPath }).eq("id", studentId);
  fail(updateError, "Could not save student photo");
  const { data: signed, error: signedError } = await db.storage.from("student-photos").createSignedUrl(photoPath, 3600);
  fail(signedError, "Could not open student photo");
  return { photoUrl: signed.signedUrl };
}

export async function uploadSupabaseTeacherPhoto(user: SupabaseSessionUser, image: Buffer, contentType: string) {
  if (user.role !== "teacher") throw new SupabaseRepositoryError(403, "Teacher access required");
  const db = getSupabaseAdmin();
  const extension = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
  const photoPath = `${user.id}/profile.${extension}`;
  const { data: current, error: profileError } = await db.from("profiles").select("photo_path").eq("id", user.id).single();
  fail(profileError, "Could not load teacher profile");
  if (current.photo_path && current.photo_path !== photoPath) await db.storage.from("student-photos").remove([current.photo_path]);
  const { error: uploadError } = await db.storage.from("student-photos").upload(photoPath, image, { contentType, upsert: true });
  fail(uploadError, "Could not upload teacher photo");
  const { error: updateError } = await db.from("profiles").update({ photo_path: photoPath }).eq("id", user.id);
  fail(updateError, "Could not save teacher photo");
  const { data: signed, error: signedError } = await db.storage.from("student-photos").createSignedUrl(photoPath, 3600);
  fail(signedError, "Could not open teacher photo");
  return { photoUrl: signed.signedUrl };
}

export async function listSupabaseSavedWork(user: SupabaseSessionUser, projectId: string) {
  await accessibleProject(user, projectId);
  const db = getSupabaseAdmin();
  const { data, error } = await db.from("saved_works").select("id,label,created_at,files").eq("project_id", projectId).eq("owner_id", user.id).order("created_at", { ascending: false });
  fail(error, "Could not load saved work");
  return { saved: data.map((item) => ({ id: item.id, label: item.label, createdAt: item.created_at, files: item.files })) };
}

export async function createSupabaseSavedWork(user: SupabaseSessionUser, projectId: string, label?: string) {
  await accessibleProject(user, projectId);
  const db = getSupabaseAdmin();
  const { data: files, error: fileError } = await db.from("code_files").select("path,language,content").eq("project_id", projectId).order("path");
  fail(fileError, "Could not snapshot project files");
  const finalLabel = label || `Saved work ${new Date().toLocaleString("en-US")}`;
  const { data, error } = await db.from("saved_works").insert({ project_id: projectId, owner_id: user.id, label: finalLabel, files })
    .select("id,label,created_at,files").single();
  fail(error, "Could not save work");
  return { id: data.id, label: data.label, createdAt: data.created_at, files: data.files };
}

export async function updateSupabaseSavedWork(user: SupabaseSessionUser, savedWorkId: string) {
  const db = getSupabaseAdmin();
  const { data: saved, error: savedError } = await db.from("saved_works").select("id,project_id").eq("id", savedWorkId).eq("owner_id", user.id).maybeSingle();
  fail(savedError, "Could not load saved work");
  if (!saved) throw new SupabaseRepositoryError(404, "Saved work not found");
  await accessibleProject(user, saved.project_id);
  const { data: files, error: fileError } = await db.from("code_files").select("path,language,content").eq("project_id", saved.project_id).order("path");
  fail(fileError, "Could not snapshot project files");
  const { data, error } = await db.from("saved_works").update({ files, updated_at: new Date().toISOString() }).eq("id", saved.id).eq("owner_id", user.id)
    .select("id,label,created_at,files").single();
  fail(error, "Could not update saved work");
  return { id: data.id, label: data.label, createdAt: data.created_at, files: data.files };
}

export async function restoreSupabaseSavedWork(user: SupabaseSessionUser, savedWorkId: string) {
  const db = getSupabaseAdmin();
  const { data: saved, error } = await db.from("saved_works").select("project_id,files").eq("id", savedWorkId).eq("owner_id", user.id).maybeSingle();
  fail(error, "Could not load saved work");
  if (!saved) throw new SupabaseRepositoryError(404, "Saved work not found");
  await accessibleProject(user, saved.project_id);
  const snapshots = saved.files as Array<{ path?: string; language?: string; content?: string }>;
  for (const snapshot of snapshots) {
    if (!snapshot.path) continue;
    const { data: file, error: fileError } = await db.from("code_files").select("*").eq("project_id", saved.project_id).eq("path", snapshot.path).maybeSingle();
    fail(fileError, "Could not inspect restored file");
    if (file) {
      const { error: versionError } = await db.from("file_versions").upsert(
        { file_id: file.id, version: file.version, content: file.content, author_id: user.id },
        { onConflict: "file_id,version", ignoreDuplicates: true },
      );
      fail(versionError, "Could not version restored file");
      const { data: updated, error: updateError } = await db.from("code_files")
        .update({ content: snapshot.content ?? "", version: file.version + 1, updated_by: user.id })
        .eq("id", file.id).eq("version", file.version).select("id").maybeSingle();
      fail(updateError, "Could not restore file");
      if (!updated) throw new SupabaseRepositoryError(409, "The file changed while restoring. Please try again");
    } else {
      const { error: insertError } = await db.from("code_files").insert({ project_id: saved.project_id, path: snapshot.path, language: snapshot.language || "java", content: snapshot.content ?? "", updated_by: user.id });
      fail(insertError, "Could not recreate restored file");
    }
  }
  return { restored: true };
}

// Progress through a weekly course module (docs/course-format.md). moduleId is the uploaded
// JSON file's own "id" field (e.g. "java-2-w15"), not a database foreign key. The server computes the goal meter against the full uploaded module, including
// closed lessons; students must not receive closed content just to calculate a percentage.
type ModuleStepStatus = "pass" | "fail";
type ModulePerformanceVariant = "sample" | "own";
type ModulePerformanceEntry = PersonalSubmission;
type ModuleProgressRow = {
  student_id: string; classroom_id: string; module_id: string;
  step_states: Record<string, ModuleStepStatus>;
  performance_task: Partial<Record<ModulePerformanceVariant, ModulePerformanceEntry>> & { project?: { files: ModuleFile[]; successfulRun?: string } };
  project_files: Array<{ path: string; content: string }>;
  activity_projects?: ActivityProjects;
  updated_at: string;
};

async function requireClassroomMember(user: SupabaseSessionUser, classroomId: string) {
  if (!await canAccessSupabaseClass(user, classroomId)) throw new SupabaseRepositoryError(403, "Join the class before tracking module progress");
}

// All student module entry points share the same prerequisite and live-class decision.
async function loadStudentModuleAccess(user: SupabaseSessionUser, classroomId: string, summaries?: ModuleSummaryRow[]) {
  const db = getSupabaseAdmin();
  const [classroomResult, modulesResult, progressResult] = await Promise.all([
    db.from("classrooms").select("current_activity_id,active_module_id").eq("id", classroomId).maybeSingle(),
    summaries ?? loadModuleSummaries(classroomId),
    db.from("module_progress").select("module_id,step_states").eq("student_id", user.id).eq("classroom_id", classroomId),
  ]);
  fail(classroomResult.error, "Could not check class status");
  fail(progressResult.error, "Could not check prerequisite completion");
  if (!classroomResult.data) throw new SupabaseRepositoryError(404, "Classroom not found");
  const modules = new Map<string, ModuleAccessSummary>(modulesResult.map((row) => [row.module_id, row.content]));
  const states = new Map<string, Record<string, string>>(progressResult.data.map((row) => [row.module_id, row.step_states]));
  const classroom = classroomResult.data;
  return (module: { id: string }) => {
    const target = modules.get(module.id);
    if (!target) throw new SupabaseRepositoryError(404, "Module not found");
    return moduleAccessBlock(target, modules, states, classroom);
  };
}

async function enforceStudentModuleAccess(user: SupabaseSessionUser, classroomId: string, moduleId: string) {
  if (user.role !== "student") return;
  const access = await loadStudentModuleAccess(user, classroomId);
  const block = access({ id: moduleId });
  if (block) throw new SupabaseRepositoryError(403, block.message, block);
}

async function loadOrCreateModuleProgress(user: SupabaseSessionUser, classroomId: string, moduleId: string): Promise<ModuleProgressRow> {
  const db = getSupabaseAdmin();
  // module_id is free text from a module's own JSON file, not unique across classrooms - the same
  // id can be uploaded to two different classrooms, so every lookup/write here must also scope by
  // classroom_id or a student in both would share one module's progress between them.
  const { data: existing, error } = await db.from("module_progress").select("*").eq("student_id", user.id).eq("classroom_id", classroomId).eq("module_id", moduleId).maybeSingle();
  fail(error, "Could not load module progress");
  if (existing) return existing as ModuleProgressRow;
  // Two simultaneous first touches of the same module both land here with no existing row.
  // An upsert that does nothing on conflict (instead of a plain insert) lets the loser fetch the
  // winner's row instead of throwing a raw unique-violation.
  const { data: created, error: insertError } = await db.from("module_progress")
    .upsert({ student_id: user.id, classroom_id: classroomId, module_id: moduleId }, { onConflict: "student_id,classroom_id,module_id", ignoreDuplicates: true })
    .select("*").maybeSingle();
  fail(insertError, "Could not start module progress");
  if (created) return created as ModuleProgressRow;
  const { data: raceWinner, error: raceError } = await db.from("module_progress").select("*").eq("student_id", user.id).eq("classroom_id", classroomId).eq("module_id", moduleId).single();
  fail(raceError, "Could not load module progress");
  return raceWinner as ModuleProgressRow;
}

// step_states/performance_task are read-merge-written as whole jsonb columns, so two
// near-simultaneous writes (e.g. submitting both performance-task variants close together) can
// silently drop one if both read the same row before either writes. updated_at is trigger-managed
// (set_updated_at) and changes on every write with no client input, so it doubles as an optimistic
// lock: write back only if the row is still the version we read, otherwise reload and retry.
async function updateModuleProgressWithMerge(
  user: SupabaseSessionUser, classroomId: string, moduleId: string,
  merge: (row: ModuleProgressRow) => Partial<Pick<ModuleProgressRow, "step_states" | "performance_task" | "project_files" | "activity_projects">>,
  failMessage: string,
): Promise<ModuleProgressRow> {
  const db = getSupabaseAdmin();
  for (let attempt = 0; attempt < 5; attempt++) {
    const row = await loadOrCreateModuleProgress(user, classroomId, moduleId);
    const { data, error } = await db.from("module_progress").update(merge(row))
      .eq("student_id", user.id).eq("classroom_id", classroomId).eq("module_id", moduleId).eq("updated_at", row.updated_at)
      .select("*").maybeSingle();
    fail(error, failMessage);
    if (data) return data as ModuleProgressRow;
  }
  throw new SupabaseRepositoryError(409, "Module progress changed while saving. Please try again");
}

function moduleProgressView(row: ModuleProgressRow, module: CourseModule) {
  return {
    moduleId: row.module_id, stepStates: row.step_states, performanceTask: row.performance_task,
    performanceProjectFiles: row.performance_task.project?.files ?? [],
    projectFiles: row.project_files, percent: moduleCompletionPercent(module, row), updatedAt: row.updated_at,
    ...(module.sampleFirst ? { activityProjects: row.activity_projects ?? {} } : {}),
  };
}

export async function getSupabaseModuleProgress(user: SupabaseSessionUser, classroomId: string, moduleId: string, includeModuleVersion = false) {
  if (user.role !== "student") throw new SupabaseRepositoryError(403, "Only students have module progress");
  await requireClassroomMember(user, classroomId);
  await enforceStudentModuleAccess(user, classroomId, moduleId);
  const courseRow = await loadCourseModuleRow(classroomId, moduleId);
  return { ...moduleProgressView(await loadOrCreateModuleProgress(user, classroomId, moduleId), courseRow.content), ...(includeModuleVersion ? { moduleVersion: courseRow.updated_at } : {}) };
}

// stepId is either a step block's own "id" (docs/course-format.md) or a lesson's exitSlip "id" -
// both are just "something the student marked done", one map, one route (CKB-007).
export async function setSupabaseModuleStepState(user: SupabaseSessionUser, classroomId: string, moduleId: string, stepId: string, status: ModuleStepStatus) {
  if (user.role !== "student") throw new SupabaseRepositoryError(403, "Only students have module progress");
  await requireClassroomMember(user, classroomId);
  await enforceStudentModuleAccess(user, classroomId, moduleId);
  const courseRow = await loadCourseModuleRow(classroomId, moduleId);
  const lesson = courseRow.content.lessons.find((item) => item.exitSlip.id === stepId || item.blocks.some((block) => block.type === "step" && block.id === stepId));
  if (!lesson) throw new SupabaseRepositoryError(400, "Step or exit slip not found in this module");
  if (findActivity(courseRow.content, stepId)) throw new SupabaseRepositoryError(403, "Use Run code in the module project to check this activity");
  // Retained for older clients recording paper liplets; these never unlock parts or earn progress.
  const data = await updateModuleProgressWithMerge(
    user, classroomId, moduleId,
    (row) => ({ step_states: { ...row.step_states, [stepId]: status } }),
    "Could not save step result",
  );
  return moduleProgressView(data, courseRow.content);
}

export async function setSupabaseModulePerformanceTask(
  user: SupabaseSessionUser, classroomId: string, moduleId: string, variant: ModulePerformanceVariant,
  files: Array<{ path: string; content: string }>, status: ModuleStepStatus, updatedAt?: string,
) {
  if (user.role !== "student") throw new SupabaseRepositoryError(403, "Only students have module progress");
  await requireClassroomMember(user, classroomId);
  await enforceStudentModuleAccess(user, classroomId, moduleId);
  const courseRow = await loadCourseModuleRow(classroomId, moduleId);
  if (!courseRow.content.performanceTask) throw new SupabaseRepositoryError(404, "Performance task not found in this module");
  if (paperPerformanceTask(courseRow.content)) throw new SupabaseRepositoryError(400, "Submit this proposal on paper to your teacher");
  const progress = await loadOrCreateModuleProgress(user, classroomId, moduleId);
  if (!activityAccess(courseRow.content, progress.step_states).performanceTaskOpen) throw new SupabaseRepositoryError(403, "Complete the module activities before the performance task");
  const data = await updateModuleProgressWithMerge(
    user, classroomId, moduleId,
    (row) => {
      if (updatedAt && row.updated_at !== updatedAt) throw new SupabaseRepositoryError(409, "This project changed in another tab. Reopen it before submitting");
      if (variant === "own") {
        const project = row.performance_task.project;
        if (!updatedAt || !project?.successfulRun || project.successfulRun !== personalFilesHash(project.files) || personalFilesHash(files) !== project.successfulRun) {
          throw new SupabaseRepositoryError(409, "Run the current personal files successfully before submitting");
        }
        return { performance_task: { ...row.performance_task, own: { id: randomBytes(16).toString("hex"), files: project.files,
          status: "pass", submittedAt: new Date().toISOString(), checklist: [...courseRow.content.performanceTask!.checklist] } } };
      }
      return { performance_task: { ...row.performance_task, [variant]: { files, status, submittedAt: new Date().toISOString() } } };
    },
    "Could not save performance task submission",
  );
  return moduleProgressView(data, courseRow.content);
}

// A working project is not a submission. Keep it beside the existing sample/own snapshots
// in performance_task JSON, so saving and running cannot silently mark the task submitted.
async function requirePerformanceProject(user: SupabaseSessionUser, classroomId: string, moduleId: string) {
  if (user.role !== "student") throw new SupabaseRepositoryError(403, "Only students have performance projects");
  await requireClassroomMember(user, classroomId);
  await enforceStudentModuleAccess(user, classroomId, moduleId);
  const courseRow = await loadCourseModuleRow(classroomId, moduleId);
  if (!courseRow.content.performanceTask) throw new SupabaseRepositoryError(404, "Performance task not found in this module");
  if (paperPerformanceTask(courseRow.content)) throw new SupabaseRepositoryError(400, "Submit this proposal on paper to your teacher");
  const progress = await loadOrCreateModuleProgress(user, classroomId, moduleId);
  if (!activityAccess(courseRow.content, progress.step_states).performanceTaskOpen) throw new SupabaseRepositoryError(403, "Complete the module activities before the performance task");
  return { content: courseRow.content, progress };
}

// Web personal projects keep web and .txt files; Java ones keep Java files (teacher, 2026-10-29).
function personalPathError(web: boolean, path: string) {
  return web ? Boolean(moduleWebPathError(path)) : path.length > JAVA_PATH_MAX_LENGTH || !JAVA_PATH.test(path);
}

export async function prepareSupabasePerformanceProject(user: SupabaseSessionUser, classroomId: string, moduleId: string) {
  const { content, progress } = await requirePerformanceProject(user, classroomId, moduleId);
  const web = webPerformanceTask(content);
  let previous: ModuleProgressRow["performance_task"] | undefined;
  if (!progress.performance_task.project && !progress.performance_task.own) {
    let previousId = content.previousModuleId;
    const visited = new Set([moduleId]);
    while (previousId && !visited.has(previousId)) {
      visited.add(previousId);
      const db = getSupabaseAdmin();
      const { data, error } = await db.from("module_progress").select("performance_task")
        .eq("student_id", user.id).eq("classroom_id", classroomId).eq("module_id", previousId).maybeSingle();
      fail(error, "Could not load the previous personal project");
      previous = data?.performance_task;
      if (previous?.own || previous?.project) break;
      const prior = await loadCourseModuleRow(classroomId, previousId);
      previousId = prior && paperPerformanceTask(prior.content) ? prior.content.previousModuleId : undefined;
    }
  }
  const saved = await updateModuleProgressWithMerge(user, classroomId, moduleId, (row) => {
    const files = personalProjectFiles(content.performanceTask!.starterFiles, previous, row.performance_task);
    if (files.length > 50 || files.some((file) => personalPathError(web, file.path))) throw new SupabaseRepositoryError(400, `This performance task needs at most 50 valid ${web ? "web" : "Java"} files`);
    return { performance_task: { ...row.performance_task, project: { ...row.performance_task.project, files } } };
  }, "Could not open your personal project");
  return moduleProgressView(saved, content);
}

export async function saveSupabasePerformanceProject(user: SupabaseSessionUser, classroomId: string, moduleId: string, files: ModuleFile[], updatedAt: string) {
  const { content } = await requirePerformanceProject(user, classroomId, moduleId);
  if (files.some((file) => personalPathError(webPerformanceTask(content), file.path))) throw new SupabaseRepositoryError(400, "These files do not belong to this personal project");
  const saved = await updateModuleProgressWithMerge(user, classroomId, moduleId, (row) => {
    if (row.updated_at !== updatedAt) throw new SupabaseRepositoryError(409, "This personal project changed in another tab. Reopen it before saving");
    return { performance_task: { ...row.performance_task, project: { files } } };
  }, "Could not save your personal project");
  return moduleProgressView(saved, content);
}

function personalFilesHash(files: ModuleFile[]) {
  return createHash("sha256").update(JSON.stringify(files.map(({ path, content }) => ({ path, content })).sort((a, b) => a.path.localeCompare(b.path)))).digest("hex");
}

export async function beginSupabasePersonalRun(user: SupabaseSessionUser, classroomId: string, moduleId: string, updatedAt: string) {
  const { content } = await requirePerformanceProject(user, classroomId, moduleId);
  if (paperPerformanceTask(content)) throw new SupabaseRepositoryError(400, "This proposal is submitted on paper");
  if (webPerformanceTask(content)) throw new SupabaseRepositoryError(400, "Web pages run in your browser, not the Java runner");
  const saved = await updateModuleProgressWithMerge(user, classroomId, moduleId, (row) => {
    if (row.updated_at !== updatedAt || !row.performance_task.project) throw new SupabaseRepositoryError(409, "Save and reopen the current personal project before running");
    return { performance_task: { ...row.performance_task, project: { files: row.performance_task.project.files } } };
  }, "Could not start the personal run");
  return moduleProgressView(saved, content);
}

// A web page's evidence is the exact files it ran plus its page text; never a bare success flag.
export async function recordSupabasePersonalRun(user: SupabaseSessionUser, classroomId: string, moduleId: string, updatedAt: string, success: boolean,
  page?: { files: ModuleFile[]; output: string }) {
  const { content } = await requirePerformanceProject(user, classroomId, moduleId);
  if (webPerformanceTask(content) !== Boolean(page)) throw new SupabaseRepositoryError(400, page ? "These files do not belong to this personal project" : "Run your web page again to send its result");
  if (page && success && !page.output.startsWith("Tab title: ")) throw new SupabaseRepositoryError(400, "A successful page run reports its page text");
  const saved = await updateModuleProgressWithMerge(user, classroomId, moduleId, (row) => {
    const project = row.performance_task.project;
    if (row.updated_at !== updatedAt || !project || (page && personalFilesHash(page.files) !== personalFilesHash(project.files))) {
      throw new SupabaseRepositoryError(409, "The project changed while running. Run the current files again");
    }
    return { performance_task: { ...row.performance_task, project: { files: project.files, ...(success ? { successfulRun: personalFilesHash(project.files) } : {}) } } };
  }, "Could not save the personal run result");
  return moduleProgressView(saved, content);
}

export async function getSupabasePersonalSubmission(user: SupabaseSessionUser, classroomId: string, studentId: string, moduleId: string) {
  await teacherStudentWorkspace(user, classroomId, studentId);
  const { content } = await loadCourseModuleRow(classroomId, moduleId);
  const db = getSupabaseAdmin();
  const { data, error } = await db.from("module_progress").select("*").eq("classroom_id", classroomId).eq("student_id", studentId).eq("module_id", moduleId).maybeSingle();
  fail(error, "Could not load the personal submission");
  let submission = (data as ModuleProgressRow | null)?.performance_task.own;
  if (!submission) throw new SupabaseRepositoryError(404, "No personal submission for this module");
  if (!submission.checklist) {
    const saved = await updateModuleProgressWithMerge({ ...user, id: studentId }, classroomId, moduleId, (row) => {
      const own = row.performance_task.own;
      if (!own) throw new SupabaseRepositoryError(409, "The submission changed. Reopen it");
      return { performance_task: { ...row.performance_task, own: own.checklist ? own : { ...own, checklist: [...(content.performanceTask?.checklist ?? [])], legacyChecklist: true } } };
    }, "Could not preserve the submission checklist");
    submission = saved.performance_task.own!;
  }
  return { module: content, submission, submissionId: submission.id ?? submission.submittedAt };
}

export async function saveSupabasePersonalReview(user: SupabaseSessionUser, classroomId: string, studentId: string, moduleId: string, submissionId: string, checked: boolean[]) {
  await teacherStudentWorkspace(user, classroomId, studentId);
  await loadCourseModuleRow(classroomId, moduleId);
  const saved = await updateModuleProgressWithMerge({ ...user, id: studentId }, classroomId, moduleId, (row) => {
    const own = row.performance_task.own;
    if (!own || (own.id ?? own.submittedAt) !== submissionId) throw new SupabaseRepositoryError(409, "The student resubmitted. Reopen the submission before reviewing");
    if (!own.checklist || checked.length !== own.checklist.length) throw new SupabaseRepositoryError(400, "Review every item from the saved submission checklist");
    return { performance_task: { ...row.performance_task, own: { ...own, review: { checked, savedAt: new Date().toISOString() } } } };
  }, "Could not save the teacher review");
  return saved.performance_task.own!.review!;
}

// Steps whose output depends on pictures, sound or video pass when the teacher marks them done.
export async function markSupabaseTeacherCheckedStep(user: SupabaseSessionUser, classroomId: string, studentId: string, moduleId: string, stepId: string) {
  await teacherStudentWorkspace(user, classroomId, studentId);
  const { content } = await loadCourseModuleRow(classroomId, moduleId);
  const step = findActivity(content, stepId);
  if (!step || !teacherCheckedStep(step)) throw new SupabaseRepositoryError(404, "This step is checked automatically, not by the teacher");
  const saved = await updateModuleProgressWithMerge({ ...user, id: studentId }, classroomId, moduleId,
    (row) => ({ step_states: { ...row.step_states, [activityStateId(step)]: "pass" } }), "Could not mark the step done");
  return { stepStates: saved.step_states, percent: moduleCompletionPercent(content, saved) };
}

async function requireModuleActivity(user: SupabaseSessionUser, classroomId: string, moduleId: string, stepId: string) {
  if (user.role !== "student") throw new SupabaseRepositoryError(403, "Only students have module projects");
  await requireClassroomMember(user, classroomId);
  await enforceStudentModuleAccess(user, classroomId, moduleId);
  const { content, updated_at: moduleVersion } = await loadCourseModuleRow(classroomId, moduleId);
  const step = findActivity(content, stepId);
  if (!step) throw new SupabaseRepositoryError(404, "Activity not found in this module");
  const progress = await loadOrCreateModuleProgress(user, classroomId, moduleId);
  if (!activityAccess(content, progress.step_states).openStepIds.includes(activityStateId(step))) throw new SupabaseRepositoryError(403, "Complete the previous activity first");
  return { content, step, progress, moduleVersion };
}

export async function prepareSupabaseModuleActivity(user: SupabaseSessionUser, classroomId: string, moduleId: string, stepId: string, persist = true) {
  const { content, step, progress, moduleVersion } = await requireModuleActivity(user, classroomId, moduleId, stepId);
  let previous: ModuleFile[] = [];
  if (content.previousModuleId && !progress.project_files.length) {
    // Copy only this student's work in this class. Never write to the preceding project.
    const { data, error } = await getSupabaseAdmin().from("module_progress").select("project_files")
      .eq("student_id", user.id).eq("classroom_id", classroomId).eq("module_id", content.previousModuleId).maybeSingle();
    fail(error, "Could not load the previous module project");
    previous = data?.project_files ?? [];
  }
  const files = mergeProjectFiles(content.starterFiles, step.files, activityTask(step).files, previous);
  const prepare = (row: ModuleProgressRow): Pick<ModuleProgressRow, "project_files" | "activity_projects"> => {
    const history = row.activity_projects ?? {};
    const key = activityStateId(step);
    const sampleFirst = content.sampleFirst && step.activity?.id;
    let project = mergeProjectFiles(files, row.project_files);
    let projects = history;
    if (sampleFirst) {
      const drafts = { ...history.drafts };
      if (history.activeKey) drafts[history.activeKey] = row.project_files;
      const beforeSampleFiles = history.beforeSampleFiles ?? (!history.activeKey && row.project_files.length ? row.project_files : undefined);
      project = drafts[key] ?? (row.step_states[key] === "pass" && !history.activeKey && row.project_files.length
        ? row.project_files : mergeProjectFiles(content.starterFiles, previous, row.project_files, step.files));
      drafts[key] = project;
      projects = { activeKey: key, drafts, ...(beforeSampleFiles ? { beforeSampleFiles } : {}) };
    }
    if (project.length > 50 || (step.language === "java" && project.some((file) => file.path.length > JAVA_PATH_MAX_LENGTH || !JAVA_PATH.test(file.path)))) throw new SupabaseRepositoryError(400, "This activity needs a project of at most 50 valid Java files");
    return { project_files: project, ...(sampleFirst ? { activity_projects: projects } : {}) };
  };
  const saved = persist ? await updateModuleProgressWithMerge(user, classroomId, moduleId, prepare, "Could not open the module project")
    : { ...progress, ...prepare(progress) };
  return { ...moduleProgressView(saved, content), ...(!persist ? { moduleVersion } : {}) };
}

export async function runSupabaseModuleActivity(
  user: SupabaseSessionUser, classroomId: string, moduleId: string, stepId: string,
  files: ModuleFile[], updatedAt: string,
  execute: (files: ModuleFile[], stdin: string) => Promise<{ mode: string; success: boolean; output: string }>,
) {
  const { content, step, progress: beforeRun, moduleVersion } = await requireModuleActivity(user, classroomId, moduleId, stepId);
  if (step.language !== "java") throw new SupabaseRepositoryError(400, "Automatic activity checking currently supports Java only");
  if (beforeRun.updated_at !== updatedAt) throw new SupabaseRepositoryError(409, "This module project changed in another tab. Reopen the activity before running");
  const sample = samplePending(content, step, beforeRun.step_states);
  const result = await execute(files, (sample ? step : activityTask(step)).stdin ?? "");
  if (result.mode === "demo") throw new SupabaseRepositoryError(503, "Java execution is unavailable here. Run this activity in offline classroom mode");
  const { check, sampleMatched, passed } = checkModuleRun(content, step, beforeRun.step_states, files, result);
  if (!passed) return { ...result, passed, check, sampleMatched, progress: moduleProgressView(beforeRun, content) };
  const stateId = check === "sample" ? sampleStateId(step) : activityStateId(step);
  const progress = await updateModuleProgressWithMerge(user, classroomId, moduleId, (row) => {
    if (row.updated_at !== updatedAt) throw new SupabaseRepositoryError(409, "The project changed while running. Run the current files again");
    const states = { ...row.step_states, [stateId]: "pass" as const };
    if (check === "sample") return { step_states: states };
    if (!content.sampleFirst || !step.activity?.id) return { project_files: files, step_states: states };
    const key = activityStateId(step);
    const history = row.activity_projects ?? {};
    return {
      project_files: files,
      step_states: states,
      activity_projects: {
        ...history,
        activeKey: key,
        drafts: { ...history.drafts, [key]: files },
        ...(!history.beforeSampleFiles && !history.activeKey && row.project_files.length ? { beforeSampleFiles: row.project_files } : {}),
      },
    };
  }, "Could not save the completed module activity");
  return { ...result, passed, check, sampleMatched, progress: moduleProgressView(progress, content), module: studentModuleView(content, progress.step_states, moduleVersion) };
}

// Browser results are practice evidence, explicitly approved by the teacher, not grades.
// Identity, part access, expected output and the saved version remain server controlled.
export async function recordSupabaseModuleActivityResult(
  user: SupabaseSessionUser, classroomId: string, moduleId: string, stepId: string, updatedAt: string,
  result: { mode: string; success: boolean; output: string },
) {
  const { content, step, progress: beforeRun } = await requireModuleActivity(user, classroomId, moduleId, stepId);
  if (step.language !== "java") throw new SupabaseRepositoryError(400, "Automatic activity checking currently supports Java only");
  const { check, sampleMatched, passed } = checkModuleRun(content, step, beforeRun.step_states, beforeRun.project_files, result);
  if (content.sampleFirst && step.activity?.id && beforeRun.activity_projects?.activeKey !== activityStateId(step)) throw new SupabaseRepositoryError(409, "Open this step in the code editor before running it");
  const stateId = check === "sample" ? sampleStateId(step) : activityStateId(step);
  const progress = await updateModuleProgressWithMerge(user, classroomId, moduleId, (row) => {
    // A changed project must not receive a result from an earlier run.
    if (row.updated_at !== updatedAt) throw new SupabaseRepositoryError(409, "The project changed while running. Run the current files again");
    return { step_states: { ...row.step_states, [stateId]: row.step_states[stateId] === "pass" || passed ? "pass" : "fail" } };
  }, "Could not save the activity result");
  return { ...result, passed, check, sampleMatched, progress: moduleProgressView(progress, content) };
}

export type ModuleCheckpoint = {
  stepId: string; updatedAt: string; moduleVersion: string; completionId: string;
  files: ModuleFile[]; success: boolean; output: string;
  sample?: { files: ModuleFile[]; success: boolean; output: string };
};

export async function completeSupabaseModuleActivity(user: SupabaseSessionUser, classroomId: string, moduleId: string, checkpoint: ModuleCheckpoint) {
  const { content, step, progress, moduleVersion } = await requireModuleActivity(user, classroomId, moduleId, checkpoint.stepId);
  if (!checkableStep(step)) throw new SupabaseRepositoryError(400, "Automatic activity checking currently supports Java and web pages only");
  if (teacherCheckedStep(step)) throw new SupabaseRepositoryError(400, "Your teacher checks this step for now");
  // The route lets web files through without the online Java runner, so they must belong to a web step.
  if (webStep(step) !== checkpoint.files.every((file) => !moduleWebPathError(file.path))) throw new SupabaseRepositoryError(400, "These files do not belong to this step");
  if (moduleVersion !== checkpoint.moduleVersion) throw new SupabaseRepositoryError(409, "This module changed. Reopen it before saving completion; your device draft is kept.");
  if (!matchesActivityOutput(checkpoint, activityTask(step).expectedOutput)) throw new SupabaseRepositoryError(400, "This task has not completed successfully");
  if (samplePending(content, step, progress.step_states) && (!checkpoint.sample || !matchesSample(checkpoint.sample, step) || !unchangedSample(checkpoint.sample.files, step.files))) {
    throw new SupabaseRepositoryError(400, "Run the supplied sample unchanged before completing this task");
  }
  const key = activityStateId(step);
  const sameFiles = (files: ModuleFile[] | undefined) => files?.length === checkpoint.files.length && unchangedSample(files, checkpoint.files);
  const accepted = (row: ModuleProgressRow) => row.activity_projects?.checkpoints?.[key]?.id === checkpoint.completionId
    && row.activity_projects.checkpoints[key].moduleVersion === moduleVersion && row.step_states[key] === "pass" && sameFiles(row.activity_projects.drafts?.[key]);
  const reply = (row: ModuleProgressRow) => ({ mode: "browser", success: true, output: checkpoint.output, check: "task" as const,
    passed: true, sampleMatched: matchesSample(checkpoint, step), progress: moduleProgressView(row, content), module: studentModuleView(content, row.step_states, moduleVersion) });
  if (accepted(progress)) return reply(progress);
  if (progress.updated_at !== checkpoint.updatedAt) throw new SupabaseRepositoryError(409, "This module project changed in another tab. Your device draft is kept; reopen before syncing.");
  const history = progress.activity_projects ?? {};
  const drafts = { ...history.drafts, ...(history.activeKey ? { [history.activeKey]: progress.project_files } : {}), [key]: checkpoint.files };
  const projects: ActivityProjects = { ...history, activeKey: key, drafts,
    ...(!history.beforeSampleFiles && !history.activeKey && progress.project_files.length ? { beforeSampleFiles: progress.project_files } : {}),
    checkpoints: { ...history.checkpoints, [key]: { id: checkpoint.completionId, moduleVersion } } };
  const states = { ...progress.step_states, [key]: "pass", ...(content.sampleFirst && step.activity?.id ? { [sampleStateId(step)]: "pass" } : {}) };
  const { data, error } = await getSupabaseAdmin().rpc("codeshare_complete_module_activity", {
    p_classroom_id: classroomId, p_student_id: user.id, p_module_id: moduleId,
    p_progress_version: checkpoint.updatedAt, p_module_version: moduleVersion,
    p_files: checkpoint.files, p_states: states, p_projects: projects,
  }).maybeSingle();
  fail(error, "Could not save task completion");
  if (data) return reply(data as ModuleProgressRow);
  const latest = await loadOrCreateModuleProgress(user, classroomId, moduleId);
  if (accepted(latest)) return reply(latest);
  throw new SupabaseRepositoryError(409, "The module or project changed while syncing. Your device draft is kept.");
}

// The student's one shared project for this module (e.g. one Main.java replaced step by step),
// separate from the two performance-task submissions above. No open-lesson check: unlike a step
// result or a performance-task submission, saving the working copy of a file the student is
// mid-edit on shouldn't be blocked by which lesson happens to be open right now.
export async function setSupabaseModuleProjectFiles(user: SupabaseSessionUser, classroomId: string, moduleId: string, files: Array<{ path: string; content: string }>, updatedAt?: string, stepId?: string) {
  if (user.role !== "student") throw new SupabaseRepositoryError(403, "Only students have module progress");
  await requireClassroomMember(user, classroomId);
  await enforceStudentModuleAccess(user, classroomId, moduleId);
  const courseRow = await loadCourseModuleRow(classroomId, moduleId);
  const data = await updateModuleProgressWithMerge(
    user, classroomId, moduleId,
    (row) => {
      if (updatedAt && row.updated_at !== updatedAt) throw new SupabaseRepositoryError(409, "This module project changed in another tab. Reopen the activity before saving");
      const key = row.activity_projects?.activeKey;
      if (courseRow.content.sampleFirst && key) {
        const step = stepId ? findActivity(courseRow.content, stepId) : undefined;
        if (!step || activityStateId(step) !== key || !updatedAt) throw new SupabaseRepositoryError(409, "This step changed in another tab. Reopen it before saving");
        return { project_files: files, activity_projects: { ...row.activity_projects, drafts: { ...row.activity_projects?.drafts, [key]: files } } };
      }
      return { project_files: files };
    },
    "Could not save your project",
  );
  return moduleProgressView(data, courseRow.content);
}

// A single classroom's student roster, for the teacher landing page's class-card drill-down.
// listSupabaseStudents merges every class the teacher has; this is scoped to just one.
export async function listSupabaseClassroomStudents(user: SupabaseSessionUser, classroomId: string) {
  await teacherClassroom(user, classroomId);
  const db = getSupabaseAdmin();
  const { data: memberships, error: membershipError } = await db.from("classroom_members").select("user_id,joined_at").eq("classroom_id", classroomId);
  fail(membershipError, "Could not load classroom students");
  const studentMemberships = memberships.filter((item) => item.user_id !== user.id);
  if (!studentMemberships.length) return { students: [] };
  const ids = studentMemberships.map((item) => item.user_id);
  const { data: students, error } = await db.from("profiles").select("id,name,email").in("id", ids).eq("role", "student").order("name");
  fail(error, "Could not load student accounts");
  const joinedAt = new Map(studentMemberships.map((item) => [item.user_id, item.joined_at]));
  return { students: students.map((student) => ({ id: student.id, name: student.name, email: student.email, joinedAt: joinedAt.get(student.id) })) };
}

async function teacherStudentWorkspace(user: SupabaseSessionUser, classroomId: string, studentId: string) {
  await teacherClassroom(user, classroomId);
  const db = getSupabaseAdmin();
  const { data: membership, error: memberError } = await db.from("classroom_members").select("user_id").eq("classroom_id", classroomId).eq("user_id", studentId).maybeSingle();
  fail(memberError, "Could not verify classroom student");
  const { data: student, error: studentError } = await db.from("profiles").select("id").eq("id", studentId).eq("role", "student").maybeSingle();
  fail(studentError, "Could not verify student account");
  if (!membership || !student) throw new SupabaseRepositoryError(404, "Student is not in this classroom");
  const { data: team, error } = await db.from("teams").select("id").eq("classroom_id", classroomId).eq("owner_id", studentId).maybeSingle();
  fail(error, "Could not load student's personal workspace");
  return team?.id as string | undefined;
}

export async function listSupabaseStudentWebProjects(user: SupabaseSessionUser, classroomId: string, studentId: string) {
  const teamId = await teacherStudentWorkspace(user, classroomId, studentId);
  if (!teamId) return { projects: [] };
  const { data, error } = await getSupabaseAdmin().from("projects").select("id,title,description")
    .eq("classroom_id", classroomId).eq("team_id", teamId).eq("language", "web").is("activity_id", null).order("created_at");
  fail(error, "Could not load student's web projects");
  return { projects: data };
}

export async function getSupabaseStudentWebProject(user: SupabaseSessionUser, classroomId: string, studentId: string, projectId: string) {
  const teamId = await teacherStudentWorkspace(user, classroomId, studentId);
  if (!teamId) throw new SupabaseRepositoryError(404, "Web project not found for this student in this class");
  const db = getSupabaseAdmin();
  const { data: project, error } = await db.from("projects").select("id,title,description")
    .eq("id", projectId).eq("classroom_id", classroomId).eq("team_id", teamId).eq("language", "web").is("activity_id", null).maybeSingle();
  fail(error, "Could not load web project");
  if (!project) throw new SupabaseRepositoryError(404, "Web project not found for this student in this class");
  const { data: files, error: fileError } = await db.from("code_files").select("id,path,language,content,version").eq("project_id", project.id).order("path");
  fail(fileError, "Could not load web project files");
  return { project, files };
}

// One percentage calculation for the viewer and class-home summaries, always against the
// full module. Closing content neither deletes work nor changes the goal-meter denominator.
function moduleCompletionPercent(module: CourseModule | ModuleSummaryRow["content"], progress: Pick<ModuleProgressRow, "step_states" | "performance_task">) {
  const steps = "requiredActivityIds" in module ? module.requiredActivityIds
    : module.lessons.flatMap((lesson) => lesson.blocks.filter((block) => block.type === "step")).map(activityStateId);
  const hasTask = "hasPerformanceTask" in module ? module.hasPerformanceTask : Boolean(module.performanceTask);
  const total = steps.length + (hasTask && !paperPerformanceTask(module) ? 1 : 0);
  if (total === 0) return 0;
  const stepsDone = steps.filter((step) => progress.step_states[step] === "pass").length;
  const taskDone = hasTask && !paperPerformanceTask(module) && progress.performance_task.own ? 1 : 0;
  return Math.round(((stepsDone + taskDone) / total) * 100);
}

// Load a class together, rather than making one request and repeating module queries per student.
export async function getSupabaseTeacherClassProgress(user: SupabaseSessionUser, classroomId: string) {
  const { students: roster } = await listSupabaseClassroomStudents(user, classroomId);
  const db = getSupabaseAdmin();
  const loadProgress = async () => {
    const rows: Pick<ModuleProgressRow, "student_id" | "module_id" | "step_states" | "performance_task">[] = [];
    // Supabase caps each reply; a full year's class can have more than 1,000 progress rows.
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await db.from("module_progress").select("student_id,module_id,step_states,performance_task")
        .eq("classroom_id", classroomId).order("student_id").order("module_id").range(offset, offset + 499);
      fail(error, "Could not load class progress");
      rows.push(...data);
      if (data.length < 500) return rows;
    }
  };
  const [moduleResult, progressRows] = await Promise.all([
    loadCourseModules(classroomId),
    loadProgress(),
  ]);
  const courseRows = moduleResult
    .sort((a, b) => a.content.week - b.content.week || a.content.title.localeCompare(b.content.title));
  const progressByStudent = new Map<string, Map<string, Pick<ModuleProgressRow, "step_states" | "performance_task">>>();
  for (const row of progressRows) {
    if (!progressByStudent.has(row.student_id)) progressByStudent.set(row.student_id, new Map());
    progressByStudent.get(row.student_id)!.set(row.module_id, row);
  }
  const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  const completionStatus = (values: number[]) => values.length && values.every((value) => value === 100) ? "finished" as const : values.some((value) => value > 0) ? "in-progress" as const : "not-started" as const;
  const students = roster.map((student) => {
    const modules = courseRows.map(({ module_id, content }) => {
      const progress = progressByStudent.get(student.id)?.get(module_id) ?? { step_states: {}, performance_task: {} };
      return {
        moduleId: module_id,
        percent: moduleCompletionPercent(content, progress),
        personalSubmitted: Boolean(progress.performance_task.own),
        teacherChecks: content.lessons.flatMap((lesson) => lesson.blocks.filter((block): block is ActivityStep => block.type === "step" && teacherCheckedStep(block)))
          .map((step) => ({ stepId: step.id, number: step.number, done: progress.step_states[activityStateId(step)] === "pass" })),
        submissions: content.performanceTask ? Number(Boolean(progress.performance_task.sample)) + Number(Boolean(progress.performance_task.own)) : 0,
      };
    });
    return { ...student, modules, averagePercent: average(modules.map((module) => module.percent)), status: completionStatus(modules.map((module) => module.percent)), completedModules: modules.filter((module) => module.percent === 100).length };
  });
  const modules = courseRows.map(({ module_id, content }) => {
    const progress = students.flatMap((student) => student.modules.filter((module) => module.moduleId === module_id));
    return {
      moduleId: module_id, title: content.title, week: content.week, course: content.course,
      lessons: content.lessons.length,
      steps: content.lessons.reduce((total, lesson) => total + lesson.blocks.filter((block) => block.type === "step").length, 0),
      completedStudents: progress.filter((module) => module.percent === 100).length,
      averagePercent: average(progress.map((module) => module.percent)),
      status: completionStatus(progress.map((module) => module.percent)),
      submissions: progress.reduce((total, module) => total + module.submissions, 0),
    };
  });
  return {
    students, modules,
    totals: {
      students: students.length, modules: modules.length,
      averagePercent: average(students.flatMap((student) => student.modules.map((module) => module.percent))),
      completedModules: students.reduce((total, student) => total + student.completedModules, 0),
      notStartedStudents: students.filter((student) => student.modules.every((module) => module.percent === 0)).length,
      submissions: modules.reduce((total, module) => total + module.submissions, 0),
    },
  };
}

// Landing-page module list for one classroom: each module's title/week plus one student's
// percent and a status bucket. targetStudentId lets a teacher view a specific student (must be
// in that classroom); omitted, it's the signed-in student's own progress.
export async function listSupabaseModuleProgressSummary(user: SupabaseSessionUser, classroomId: string, targetStudentId?: string) {
  const db = getSupabaseAdmin();
  let studentId: string;
  if (targetStudentId) {
    await teacherClassroom(user, classroomId);
    const { data: membership, error } = await db.from("classroom_members").select("user_id").eq("classroom_id", classroomId).eq("user_id", targetStudentId).maybeSingle();
    fail(error, "Could not verify classroom student");
    if (!membership) throw new SupabaseRepositoryError(404, "Student is not in this classroom");
    studentId = targetStudentId;
  } else {
    if (user.role !== "student") throw new SupabaseRepositoryError(403, "Only students have module progress");
    await requireClassroomMember(user, classroomId);
    studentId = user.id;
  }
  const modules = await loadModuleSummaries(classroomId);
  if (!modules.length) return [];
  const { data: progressRows, error: progressError } = await db.from("module_progress").select("module_id,step_states,performance_task").eq("classroom_id", classroomId).eq("student_id", studentId);
  fail(progressError, "Could not load module progress");
  const progressByModule = new Map(progressRows.map((row) => [row.module_id, row]));
  const latestModuleId = (modules as { module_id: string }[])[0]?.module_id;
  return modules.map((row) => {
    const progress = progressByModule.get(row.module_id) || { step_states: {}, performance_task: {} };
    const percent = moduleCompletionPercent(row.content, progress);
    return {
      moduleId: row.module_id, title: row.content.title, week: row.content.week, percent,
      status: percent === 100 ? "done" as const : percent > 0 ? "in-progress" as const : "not-started" as const,
      isLatest: row.module_id === latestModuleId,
    };
  });
}

// Assigned classes read the teacher’s one subject library. Unassigned legacy classes retain
// their old uploads until the teacher selects a subject and explicitly shares saved copies.
type CourseModuleRow = { classroom_id: string; module_id: string; content: CourseModule; open_lesson_ids: string[]; performance_task_open: boolean; created_at: string; updated_at: string };

type ModuleSummaryRow = { module_id: string; content: ModuleAccessSummary & Pick<CourseModule, "title" | "course"> & { hasPerformanceTask: boolean }; created_at: string; updated_at: string };

async function loadModuleSummaries(classroomId: string): Promise<ModuleSummaryRow[]> {
  const { data, error } = await getSupabaseAdmin().rpc("codeshare_module_summaries", { p_classroom_id: classroomId });
  fail(error, "Could not read module summaries. Ask your teacher to apply the module summary migration.");
  return data as ModuleSummaryRow[];
}

async function moduleClassroom(classroomId: string) {
  const { data, error } = await getSupabaseAdmin().from("classrooms").select("teacher_id,module_subject").eq("id", classroomId).maybeSingle();
  fail(error, "Could not load class subject");
  if (!data) throw new SupabaseRepositoryError(404, "Classroom not found");
  return data as Pick<ClassroomRow, "teacher_id" | "module_subject">;
}

function subjectAccepts(subject: ModuleSubject, content: CourseModule) {
  return content.course.startsWith(subject === "java" ? "java-" : "dotnet-");
}

async function loadCourseModules(classroomId: string): Promise<CourseModuleRow[]> {
  const classroom = await moduleClassroom(classroomId);
  const db = getSupabaseAdmin();
  const query = classroom.module_subject
    ? db.from("subject_modules").select("*").eq("teacher_id", classroom.teacher_id).eq("subject", classroom.module_subject)
    : db.from("course_modules").select("*").eq("classroom_id", classroomId);
  const { data, error } = await query.order("created_at", { ascending: false }).order("module_id");
  fail(error, "Could not list modules");
  return data as CourseModuleRow[];
}

async function loadCourseModuleRow(classroomId: string, moduleId: string): Promise<CourseModuleRow> {
  const classroom = await moduleClassroom(classroomId);
  const db = getSupabaseAdmin();
  const { data: local, error } = await db.from("course_modules").select("*").eq("classroom_id", classroomId).eq("module_id", moduleId).maybeSingle();
  fail(error, "Could not load module");
  if (!classroom.module_subject) {
    if (!local) throw new SupabaseRepositoryError(404, "Module not found");
    return local as CourseModuleRow;
  }
  const { data: shared, error: sharedError } = await db.from("subject_modules").select("*")
    .eq("teacher_id", classroom.teacher_id).eq("subject", classroom.module_subject).eq("module_id", moduleId).maybeSingle();
  fail(sharedError, "Could not load shared module");
  if (!shared) throw new SupabaseRepositoryError(404, "Module not found");
  return { ...shared, classroom_id: classroomId, open_lesson_ids: local?.open_lesson_ids ?? [], performance_task_open: local?.performance_task_open ?? false } as CourseModuleRow;
}

export async function setSupabaseModuleSubject(user: SupabaseSessionUser, classroomId: string, subject: ModuleSubject) {
  const classroom = await teacherClassroom(user, classroomId);
  if (classroom.module_subject && classroom.module_subject !== subject) throw new SupabaseRepositoryError(409, "This class already has a subject. Its subject cannot be changed because student work belongs to it.");
  const { data, error } = await getSupabaseAdmin().from("classrooms").update({ module_subject: subject, active_module_id: null })
    .eq("id", classroomId).is("module_subject", null).select("id").maybeSingle();
  fail(error, "Could not save class subject");
  if (!data && !classroom.module_subject) throw new SupabaseRepositoryError(409, "The class subject changed. Refresh and try again.");
  return { subject };
}

export async function getSupabaseModuleSharing(user: SupabaseSessionUser, classroomId: string) {
  const classroom = await teacherClassroom(user, classroomId);
  const { data, error } = await getSupabaseAdmin().from("course_modules").select("module_id,content").eq("classroom_id", classroomId).order("module_id");
  fail(error, "Could not load saved class uploads");
  const shared = classroom.module_subject ? await loadCourseModules(classroomId) : [];
  return {
    subject: classroom.module_subject,
    savedUploads: (data as { module_id: string; content: CourseModule }[]).map((row) => {
      const current = shared.find((item) => item.module_id === row.module_id);
      return { moduleId: row.module_id, title: row.content.title, course: row.content.course,
        matchesSubject: classroom.module_subject ? subjectAccepts(classroom.module_subject, row.content) : false,
        sharedUpdatedAt: current?.updated_at ?? null,
        sameContent: current ? JSON.stringify(current.content) === JSON.stringify(row.content) : false };
    }),
  };
}

export async function shareSupabaseModule(user: SupabaseSessionUser, classroomId: string, moduleId: string, expectedUpdatedAt?: string) {
  const classroom = await teacherClassroom(user, classroomId);
  if (!classroom.module_subject) throw new SupabaseRepositoryError(400, "Choose Java or Net MVC for this class first.");
  const db = getSupabaseAdmin();
  const { data: saved, error } = await db.from("course_modules").select("content").eq("classroom_id", classroomId).eq("module_id", moduleId).maybeSingle();
  fail(error, "Could not load saved class upload");
  if (!saved) throw new SupabaseRepositoryError(404, "Saved class upload not found");
  const parsed = courseModule.safeParse(saved.content);
  if (!parsed.success) throw new SupabaseRepositoryError(400, "This saved upload no longer matches the module format. Upload a corrected file instead.");
  if (!subjectAccepts(classroom.module_subject, parsed.data)) throw new SupabaseRepositoryError(400, "This module belongs to a different subject.");
  const values = { teacher_id: user.id, subject: classroom.module_subject, module_id: moduleId, content: parsed.data };
  const result = expectedUpdatedAt
    ? await db.from("subject_modules").update({ content: parsed.data }).eq("teacher_id", user.id).eq("subject", classroom.module_subject).eq("module_id", moduleId).eq("updated_at", expectedUpdatedAt).select("module_id").maybeSingle()
    : await db.from("subject_modules").insert(values).select("module_id").single();
  if (result.error?.code === "23505" || (!result.error && !result.data)) throw new SupabaseRepositoryError(409, "A shared version already exists or changed. Refresh before choosing which version to keep.");
  fail(result.error, "Could not share module");
  return { shared: true };
}

function moduleAvailability(row: CourseModuleRow) {
  return { openLessonIds: row.open_lesson_ids, performanceTaskOpen: row.performance_task_open };
}

type AvailabilityChange = { target: "lesson"; lessonId: string; open: boolean } | { target: "performance-task"; open: boolean };

export async function setSupabaseModuleAvailability(user: SupabaseSessionUser, classroomId: string, moduleId: string, change: AvailabilityChange) {
  const classroom = await teacherClassroom(user, classroomId);
  const content = await loadCourseModuleRow(classroomId, moduleId);
  if (classroom.module_subject) {
    const { error } = await getSupabaseAdmin().from("course_modules").upsert({ classroom_id: classroomId, module_id: moduleId, content: content.content, created_by: user.id }, { onConflict: "classroom_id,module_id", ignoreDuplicates: true });
    fail(error, "Could not prepare class availability");
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: local, error: loadError } = await getSupabaseAdmin().from("course_modules").select("*").eq("classroom_id", classroomId).eq("module_id", moduleId).single();
    fail(loadError, "Could not load class availability");
    const row = { ...local, content: content.content } as CourseModuleRow;
    if (change.target === "lesson" && !row.content.lessons.some((lesson) => lesson.id === change.lessonId)) throw new SupabaseRepositoryError(400, "Lesson not found in this module");
    if (change.target === "performance-task" && !row.content.performanceTask) throw new SupabaseRepositoryError(400, "This module has no performance task");
    const patch = change.target === "performance-task" ? { performance_task_open: change.open } : {
      open_lesson_ids: change.open ? [...new Set([...row.open_lesson_ids, change.lessonId])] : row.open_lesson_ids.filter((id) => id !== change.lessonId),
    };
    // A second teacher tab may have changed another switch; retry from its latest row.
    const { data, error } = await getSupabaseAdmin().from("course_modules").update(patch)
      .eq("classroom_id", classroomId).eq("module_id", moduleId).eq("updated_at", row.updated_at).select("*").maybeSingle();
    fail(error, "Could not save lesson availability");
    if (data) return moduleAvailability(data as CourseModuleRow);
  }
  throw new SupabaseRepositoryError(409, "Module changed while saving. Please try again");
}

// Prerequisite cards stay selectable so students can open their explanation and Continue action.
function courseModuleSummary(row: Pick<CourseModuleRow, "module_id" | "updated_at"> & { content: Pick<CourseModule, "title" | "week" | "course"> }, classroom: Pick<ClassroomRow, "active_module_id" | "current_activity_id">, role: "teacher" | "student", block?: ModuleAccessBlock) {
  const isActive = row.module_id === classroom.active_module_id;
  const locked = role === "student" && block?.kind === "live";
  return { moduleId: row.module_id, title: row.content.title, week: row.content.week, course: row.content.course, updatedAt: row.updated_at, isActive, locked, ...(block ? { moduleAccess: block } : {}) };
}

export async function uploadSupabaseModule(user: SupabaseSessionUser, classroomId: string, content: CourseModule) {
  const classroom = await teacherClassroom(user, classroomId);
  const db = getSupabaseAdmin();
  if (!classroom.module_subject) throw new SupabaseRepositoryError(400, "Choose Java or Net MVC for this class before uploading modules.");
  if (!subjectAccepts(classroom.module_subject, content)) throw new SupabaseRepositoryError(400, "This module belongs to a different subject. Java classes accept Java modules; Net MVC classes accept .NET modules.");
  const { data, error } = await db.from("subject_modules")
    .upsert({ teacher_id: user.id, subject: classroom.module_subject, module_id: content.id, content }, { onConflict: "teacher_id,subject,module_id" })
    .select("*").single();
  fail(error, "Could not save module");
  return courseModuleSummary(data as CourseModuleRow, classroom, user.role);
}

export async function listSupabaseModules(user: SupabaseSessionUser, classroomId: string) {
  await requireClassroomMember(user, classroomId);
  const db = getSupabaseAdmin();
  const { data: classroom, error: classroomError } = await db.from("classrooms").select("active_module_id,current_activity_id").eq("id", classroomId).maybeSingle();
  fail(classroomError, "Could not load class status");
  if (!classroom) throw new SupabaseRepositoryError(404, "Classroom not found");
  const data = await loadModuleSummaries(classroomId);
  const access = user.role === "student" ? await loadStudentModuleAccess(user, classroomId, data) : undefined;
  return data.map((row) => {
    const block = access?.(row.content);
    return courseModuleSummary(row, classroom, user.role, block);
  });
}

// Teacher's weekly pick of one module for a class (docs/knowledgebase/workflow-state.md). null
// clears the pick. Validates the module belongs to this classroom so a stale/foreign module_id
// can't be set active.
export async function setSupabaseClassroomActiveModule(user: SupabaseSessionUser, classroomId: string, moduleId: string | null) {
  await teacherClassroom(user, classroomId);
  const db = getSupabaseAdmin();
  if (moduleId) await loadCourseModuleRow(classroomId, moduleId);
  const { error } = await db.from("classrooms").update({ active_module_id: moduleId }).eq("id", classroomId);
  fail(error, "Could not set this week's module");
  return { activeModuleId: moduleId };
}

function studentModuleView(content: CourseModule, states: Record<string, string>, moduleVersion?: string) {
  const access = activityAccess(content, states);
  const openSteps = new Set(access.openStepIds);
  const lessons = content.lessons.map((lesson) => {
    const steps = lesson.blocks.filter((block) => block.type === "step");
    const blocks = lesson.blocks.map((block, index) => {
      const owner = lesson.blocks.slice(index).find((item) => item.type === "step") ?? steps.at(-1);
      if (!owner || owner.type !== "step" || openSteps.has(activityStateId(owner))) return block;
      if (block.type !== "step") return { type: "text", markdown: "" };
      return { type: "step", id: block.id, number: block.number, part: block.part, language: block.language, locked: true,
        ...(block.activity?.id ? { activity: { id: block.activity.id, instruction: "", files: [], expectedOutput: "" } } : {}),
        instruction: "Complete the previous activity to unlock this step.", files: [], expectedOutput: "" };
    });
    const open = !steps.length || steps.some((step) => openSteps.has(activityStateId(step)));
    return { ...lesson, closed: !open, blocks, exitSlip: steps.length && !openSteps.has(activityStateId(steps.at(-1)!)) ? { ...lesson.exitSlip, questions: [] } : lesson.exitSlip };
  });
  return {
    id: content.id, title: content.title, course: content.course, week: content.week, ...(moduleVersion ? { moduleVersion } : {}),
    continues: content.continues, starterFiles: content.starterFiles, sampleFirst: content.sampleFirst,
    lessons, availability: { openLessonIds: lessons.filter((lesson) => !lesson.closed).map((lesson) => lesson.id), performanceTaskOpen: access.performanceTaskOpen },
    ...(content.performanceTask ? access.performanceTaskOpen ? { performanceTask: content.performanceTask }
      : { closedPerformanceTask: { title: content.performanceTask.title } } : {}),
  };
}

export async function getSupabaseModule(user: SupabaseSessionUser, classroomId: string, moduleId: string) {
  await requireClassroomMember(user, classroomId);
  await enforceStudentModuleAccess(user, classroomId, moduleId);
  const row = await loadCourseModuleRow(classroomId, moduleId);
  if (user.role === "teacher") return { ...row.content, availability: moduleAvailability(row) };
  const progress = await loadOrCreateModuleProgress(user, classroomId, moduleId);
  return studentModuleView(row.content, progress.step_states, row.updated_at);
}

export async function deleteSupabaseModule(user: SupabaseSessionUser, classroomId: string, moduleId: string) {
  const classroom = await teacherClassroom(user, classroomId);
  const db = getSupabaseAdmin();
  const query = classroom.module_subject
    ? db.from("subject_modules").delete().eq("teacher_id", user.id).eq("subject", classroom.module_subject).eq("module_id", moduleId)
    : db.from("course_modules").delete().eq("classroom_id", classroomId).eq("module_id", moduleId);
  const { error } = await query;
  fail(error, "Could not delete module");
  const clear = db.from("classrooms").update({ active_module_id: null }).eq("active_module_id", moduleId);
  const { error: clearError } = await (classroom.module_subject
    ? clear.eq("teacher_id", user.id).eq("module_subject", classroom.module_subject)
    : clear.eq("id", classroomId));
  fail(clearError, "Could not clear this week's module after deleting it");
  return { deleted: true };
}
