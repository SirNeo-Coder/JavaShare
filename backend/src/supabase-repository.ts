import { randomBytes } from "node:crypto";
import { createSupabaseAuthClient, getSupabaseAdmin } from "./database.js";

export type SupabaseSessionUser = {
  id: string;
  role: "teacher" | "student";
  email: string;
  name: string;
  passwordResetRequired: boolean;
};

export class SupabaseRepositoryError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

type ClassroomRow = { id: string; name: string; subject: string; join_code: string; teacher_id: string; current_activity_id: string | null; live_share_project_id: string | null; chat_muted: boolean };
type TeamRow = { id: string; classroom_id: string; owner_id: string | null; slug: string; name: string; leader_id: string | null; chat_muted: boolean; editing_locked: boolean };
type ProjectRow = { id: string; classroom_id: string; team_id: string; activity_id: string | null; title: string; description: string };
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
        System.out.println("Hello, JavaShare!");
    }
}`;

async function createStarterClass(teacherId: string) {
  const db = getSupabaseAdmin();
  const { data: classroom, error: classroomError } = await db.from("classrooms").insert({
    name: "CS 101 · Period 3", join_code: "JAVA101", teacher_id: teacherId,
  }).select("id").single();
  fail(classroomError, "Could not create starter classroom");
  const { error: memberError } = await db.from("classroom_members").insert({ classroom_id: classroom.id, user_id: teacherId });
  fail(memberError, "Could not add teacher to starter classroom");
  const { data: team, error: teamError } = await db.from("teams").insert({
    classroom_id: classroom.id, owner_id: teacherId, slug: "teacher-demo", name: "Teacher Demo Workspace",
  }).select("id").single();
  fail(teamError, "Could not create teacher workspace");
  const { error: teamMemberError } = await db.from("team_members").insert({ team_id: team.id, user_id: teacherId });
  fail(teamMemberError, "Could not add teacher to workspace");
  const { data: project, error: projectError } = await db.from("projects").insert({
    classroom_id: classroom.id,
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

export async function supabaseClassMemberIds(user: SupabaseSessionUser, classroomId: string) {
  if (!await canAccessSupabaseClass(user, classroomId)) throw new SupabaseRepositoryError(403, "Classroom access denied");
  const db = getSupabaseAdmin();
  const { data, error } = await db.from("classroom_members").select("user_id").eq("classroom_id", classroomId);
  fail(error, "Could not load classroom members");
  return data.map((item) => item.user_id);
}

export async function canAccessSupabaseTeam(user: SupabaseSessionUser, teamId: string) {
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

export async function bootstrapFromSupabase(user: SupabaseSessionUser, teacherView: "students" | "groups") {
  const db = getSupabaseAdmin();
  const classes = await loadClasses(user);
  if (user.role === "student") await Promise.all(classes.map((classroom) => ensurePersonalWorkspace(classroom, user)));
  const classIds = classes.map((item) => item.id);
  if (!classIds.length) return { user, classrooms: [], teams: [], groupCount: 0, currentActivity: null, needsJoin: user.role === "student" };

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
      const personal = team.owner_id ? teamProjects.find((project) => !project.activity_id) : null;
      if (personal) entries.push({ team, project: personal });
      else if (!entries.some((entry) => entry.team.id === team.id)) entries.push({ team, project: teamProjects[0] || null });
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
      entries.push({ team, project: teamProjects.find((project) => project.activity_id === currentActivity?.id) || teamProjects.find((project) => !project.activity_id) || null });
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
      name: user.role === "student" && !isGroup ? (project?.activity_id ? project.title : "My Practice Code") : team.name,
      isGroup, isTeacherWorkspace: team.slug === "teacher-demo", leaderId: team.leader_id, myLeaderVoteId: voteResult.data.find((vote) => vote.team_id === team.id)?.candidate_id || null, chatMuted: Boolean(team.chat_muted), editingLocked: Boolean(team.editing_locked),
      members: members.map((member) => { const permission = permissionResult.data.find((item) => item.team_id === team.id && item.user_id === member.id); return { id: member.id, name: member.name, email: member.email, photoUrl: member.photoUrl || null, isLeader: member.id === team.leader_id, chatMuted: Boolean(permission?.chat_muted), editingLocked: Boolean(permission?.editing_locked) }; }),
      completed,
      project: project ? { id: project.id, title: project.title, description: project.description, ...(project.activity_id ? { activityId: project.activity_id } : {}) } : null,
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
    classrooms: classes.map((item) => ({ id: item.id, name: item.name, subject: item.subject, ...(user.role === "teacher" ? { joinCode: item.join_code } : {}) })),
    teams: visiblePayload, groupCount, classroomChatTeamId, classroomChatMuted: Boolean(firstClass?.chat_muted),
    currentActivity: currentActivity ? { id: currentActivity.id, title: currentActivity.title, mode: currentActivity.mode } : null,
    needsJoin: user.role === "student" && classes.length === 0,
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
  const { data: file, error } = await db.from("code_files").insert({ project_id: project.id, path: input.path, content: input.content, language: "java", updated_by: user.id })
    .select("id,path,language,content,version").single();
  if (error) throw new SupabaseRepositoryError(error.code === "23505" ? 409 : 500, error.code === "23505" ? "A file with that name already exists" : error.message);
  return file;
}

export async function renameSupabaseFile(user: SupabaseSessionUser, fileId: string, path: string) {
  const { db, file } = await fileContext(user, fileId);
  const { data: updated, error } = await db.from("code_files").update({ path, updated_by: user.id }).eq("id", file.id)
    .select("id,path,language,content,version").single();
  if (error) throw new SupabaseRepositoryError(error.code === "23505" ? 409 : 500, error.code === "23505" ? "A file with that name already exists" : error.message);
  return updated;
}

export async function supabaseFileBelongsToTeam(user: SupabaseSessionUser, fileId: string, teamId: string) {
  if (!await canAccessSupabaseTeam(user, teamId)) return false;
  const db = getSupabaseAdmin();
  const { data: file } = await db.from("code_files").select("project_id").eq("id", fileId).maybeSingle();
  if (!file) return false;
  const { data: project } = await db.from("projects").select("id").eq("id", file.project_id).eq("team_id", teamId).maybeSingle();
  return Boolean(project);
}

export async function canEditSupabaseTeamFile(user: SupabaseSessionUser, fileId: string, teamId: string) {
  if (!await supabaseFileBelongsToTeam(user, fileId, teamId)) return false;
  const db = getSupabaseAdmin();
  const { data: team } = await db.from("teams").select("owner_id,leader_id").eq("id", teamId).maybeSingle();
  if (!team) return false;
  if (team.owner_id || team.leader_id === user.id) return true;
  const { data: permission } = await db.from("group_member_permissions").select("editing_locked").eq("team_id", teamId).eq("user_id", user.id).maybeSingle();
  return !permission?.editing_locked;
}

export async function canSendSupabaseLiveDraft(user: SupabaseSessionUser, classroomId: string, projectId: string, fileId: string) {
  if (user.role !== "teacher") return false;
  const db = getSupabaseAdmin();
  const { data: classroom } = await db.from("classrooms").select("id").eq("id", classroomId).eq("teacher_id", user.id).eq("live_share_project_id", projectId).maybeSingle();
  if (!classroom) return false;
  const { data: project } = await db.from("projects").select("team_id").eq("id", projectId).eq("classroom_id", classroomId).maybeSingle();
  if (!project) return false;
  const [{ data: team }, { data: file }] = await Promise.all([
    db.from("teams").select("slug").eq("id", project.team_id).maybeSingle(),
    db.from("code_files").select("id").eq("id", fileId).eq("project_id", projectId).maybeSingle(),
  ]);
  return team?.slug === "teacher-demo" && Boolean(file);
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
