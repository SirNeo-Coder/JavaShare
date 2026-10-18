"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { RealtimeChannel } from "@supabase/supabase-js";
import CodeEditor, { languageLabel } from "./CodeEditor";
import Landing from "./Landing";
import ModuleViewer from "./ModuleViewer";
import { api, getApiUrl } from "./apiClient";
import { buildPreview, originOf, type ConsoleMessage, type Preview } from "./webPreview";
import { LIVE_CAPS, forgetRealtimeClient, privateChannel, realtimeClient, throttle } from "./realtime";

const FRESH_LESSON_CODE = `public class Main {
    public static void main(String[] args) {
        // Start today's lesson here
    }
}`;

function getSavedTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("javashare-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getSavedFontScale() {
  if (typeof window === "undefined") return 1.15;
  const saved = Number(localStorage.getItem("javashare-font-scale"));
  return saved >= 1 && saved <= 1.45 ? saved : 1.15;
}

type User = {
  id: string;
  name: string;
  email: string;
  role: "teacher" | "student";
  passwordResetRequired: boolean;
  photoUrl?: string | null;
};
type FileData = {
  id: string;
  path: string;
  language: string;
  content: string;
  version: number;
};
type TeamMember = {
  id: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  isLeader?: boolean;
  chatMuted?: boolean;
  editingLocked?: boolean;
};
type TeamData = {
  id: string;
  slug: string;
  name: string;
  isGroup: boolean;
  isTeacherWorkspace?: boolean;
  leaderId: string | null;
  myLeaderVoteId: string | null;
  chatMuted: boolean;
  editingLocked: boolean;
  members: TeamMember[];
  completed: boolean;
  project: {
    id: string;
    title: string;
    description: string;
    language?: string;
    activityId?: string;
  } | null;
  files: FileData[];
};
type ChatMessage = {
  id: string;
  text: string;
  createdAt: string;
  author: { _id?: string; id?: string; name: string; photoUrl?: string | null };
};
type Bootstrap = {
  user: User;
  classrooms: {
    id: string;
    name: string;
    subject: string;
    joinCode?: string;
    hasActivity?: boolean;
    hasLiveShare?: boolean;
  }[];
  teams: TeamData[];
  groupCount?: number;
  classroomChatTeamId?: string | null;
  classroomChatMuted?: boolean;
  currentActivity?: {
    id: string;
    title: string;
    mode: "individual" | "group";
  } | null;
  needsJoin: boolean;
};
type SavedWork = {
  id: string;
  label: string;
  createdAt: string;
  files: { path?: string; content?: string }[];
};
type Submission = {
  id: string;
  projectId: string;
  student?: { name?: string; email?: string };
  submittedAt: string;
  status: string;
  files: { path?: string; content?: string }[];
};
type LiveShare = {
  active: boolean;
  projectId?: string;
  title?: string;
  presenterName?: string;
  presenterPhotoUrl?: string | null;
  studentName?: string;
  files?: FileData[];
};
type TextPoint = { line: number; column: number };
type FileOperation = {
  teamId: string;
  fileId: string;
  start: TextPoint;
  end: TextPoint;
  text: string;
  content: string;
  sequence: number;
};
type RemoteCursor = TextPoint & {
  userId: string;
  name: string;
  color: string;
  photoUrl?: string | null;
};

function collaboratorColor(id: string) {
  let hash = 2166136261;
  for (const character of id) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 72% 43%)`;
}

function pointAt(source: string, offset: number): TextPoint {
  const before = source.slice(0, offset).split("\n");
  return { line: before.length - 1, column: before.at(-1)?.length ?? 0 };
}

function createOperation(
  previous: string,
  next: string,
  teamId: string,
  fileId: string,
  sequence: number,
): FileOperation {
  let start = 0;
  while (
    start < previous.length &&
    start < next.length &&
    previous[start] === next[start]
  )
    start += 1;
  let suffix = 0;
  while (
    suffix < previous.length - start &&
    suffix < next.length - start &&
    previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]
  )
    suffix += 1;
  return {
    teamId,
    fileId,
    start: pointAt(previous, start),
    end: pointAt(previous, previous.length - suffix),
    text: next.slice(start, next.length - suffix),
    content: next,
    sequence,
  };
}

function applyOperation(source: string, operation: FileOperation) {
  const lines = source.split("\n");
  const offsetAt = ({ line, column }: TextPoint) => {
    const safeLine = Math.max(0, Math.min(lines.length - 1, line));
    return (
      lines
        .slice(0, safeLine)
        .reduce((length, item) => length + item.length + 1, 0) +
      Math.min(column, lines[safeLine]?.length ?? 0)
    );
  };
  const start = offsetAt(operation.start);
  const end = Math.max(start, offsetAt(operation.end));
  return source.slice(0, start) + operation.text + source.slice(end);
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">(getSavedTheme);
  const [fontScale, setFontScale] = useState(getSavedFontScale);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);
  const [homeClassroomId, setHomeClassroomId] = useState<string | null>(null);
  const [enteredClassroomId, setEnteredClassroomId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<Bootstrap | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTeam, setActiveTeam] = useState(0);
  const [activeFile, setActiveFile] = useState<FileData | null>(null);
  const [code, setCode] = useState("");
  const [syncStatus, setSyncStatus] = useState("Connecting…");
  const [panel, setPanel] = useState<
    "console" | "chat" | "saved" | "submissions"
  >("console");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [consoleInput, setConsoleInput] = useState("");
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState(
    "Ready — click Run to compile Main.java",
  );
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState("");
  const [workspaceError, setWorkspaceError] = useState("");
  const [savedWorks, setSavedWorks] = useState<SavedWork[]>([]);
  const [activeSavedWork, setActiveSavedWork] = useState<{
    id: string;
    label: string;
    projectId: string;
  } | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [liveShare, setLiveShare] = useState<LiveShare>({ active: false });
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [activityMode, setActivityMode] = useState<"individual" | "group">(
    "individual",
  );
  const [activityStarter, setActivityStarter] = useState("");
  const [deployingActivity, setDeployingActivity] = useState(false);
  const [autoGrouping, setAutoGrouping] = useState(false);
  const [autoGroupOpen, setAutoGroupOpen] = useState(false);
  const [autoGroupSize, setAutoGroupSize] = useState(3);
  const [groupRoster, setGroupRoster] = useState<TeamMember[]>([]);
  const [excludedGroupStudentIds, setExcludedGroupStudentIds] = useState<
    string[]
  >([]);
  const [teacherWorkspaceView, setTeacherWorkspaceView] = useState<
    "students" | "groups"
  >("students");
  const [endActivityOpen, setEndActivityOpen] = useState(false);
  const [endingActivity, setEndingActivity] = useState(false);
  const [groupProfileOpen, setGroupProfileOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupLeaderId, setGroupLeaderId] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);
  const [newFileOpen, setNewFileOpen] = useState(false);
  const [newFilePath, setNewFilePath] = useState("src/Helper.java");
  const [creatingFile, setCreatingFile] = useState(false);
  const [newWebProjectOpen, setNewWebProjectOpen] = useState(false);
  const [newWebProjectTitle, setNewWebProjectTitle] = useState("");
  const [creatingWebProject, setCreatingWebProject] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewRun, setPreviewRun] = useState(0);
  const [previewLogs, setPreviewLogs] = useState<
    { kind: ConsoleMessage["kind"]; text: string; where: string }[]
  >([]);
  const previewFrameRef = useRef<HTMLIFrameElement | null>(null);
  const lastSaved = useRef("");
  const teamChannelRef = useRef<RealtimeChannel | null>(null);
  const classChannelRef = useRef<RealtimeChannel | null>(null);
  const refreshLiveShareRef = useRef<(() => void) | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveDraftSequenceRef = useRef(0);
  const receivedDraftSequenceRef = useRef(0);
  const groupDraftSequenceRef = useRef(0);
  const receivedGroupDraftsRef = useRef(new Map<string, number>());
  const memberPhotoUrlsRef = useRef(new Map<string, string | null>());
  const remoteGroupDraftRef = useRef<string | null>(null);
  // Latest render values for live handlers and throttled senders, which outlive a single render.
  const liveRef = useRef<{ code: string; activeFile: FileData | null; team?: TeamData; userId: string; userName: string }>({ code: "", activeFile: null, userId: "", userName: "" });
  // Text of the file before the first local edit that teammates have not been sent yet.
  const unsentBaseRef = useRef<{ fileId: string; content: string } | null>(null);
  // Approved caps: typing 3 a second, cursors 4 a second, live share 2 a second (app/realtime.ts).
  const [sendTyping] = useState(() =>
    throttle((sendTeamId: string, fileId: string, content: string) => {
      const channel = teamChannelRef.current;
      const base = unsentBaseRef.current;
      if (!base || base.fileId !== fileId) return;
      if (!channel) return; // kept in unsentBaseRef; sent once the channel is ready
      groupDraftSequenceRef.current += 1;
      const operation = createOperation(base.content, content, sendTeamId, fileId, groupDraftSequenceRef.current);
      unsentBaseRef.current = null;
      void channel.send({
        type: "broadcast",
        event: "team:file-operation",
        payload: { ...operation, updatedById: liveRef.current.userId, updatedBy: liveRef.current.userName },
      });
    }, LIVE_CAPS.typingMs),
  );
  const [sendCursor] = useState(() =>
    throttle((cursor: TextPoint & { teamId: string; fileId: string; userId: string; name: string }) => {
      void teamChannelRef.current?.send({ type: "broadcast", event: "team:cursor", payload: cursor });
    }, LIVE_CAPS.cursorMs),
  );
  const [sendLiveShareDraft] = useState(() =>
    throttle((draft: { projectId: string; fileId: string; content: string; sequence: number }) => {
      void classChannelRef.current?.send({ type: "broadcast", event: "class:live-share-draft", payload: draft });
    }, LIVE_CAPS.liveShareMs),
  );
  const consoleInputRef = useRef<HTMLTextAreaElement | null>(null);
  const studentPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const teacherPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const photoStudentIdRef = useRef<string | null>(null);
  const loadedWorkspaceKeyRef = useRef("");
  const promptedGroupActivityRef = useRef("");
  const team = data?.teams[activeTeam];
  const myGroupMembership = team?.members.find((member) => member.id === user?.id);
  const teamId = team?.id;
  const activityChatUnavailable = Boolean(
    data?.currentActivity && team?.isTeacherWorkspace,
  );
  const chatTeamId = data?.currentActivity
    ? activityChatUnavailable
      ? undefined
      : teamId
    : data?.classroomChatTeamId;
  const activeProjectId = team?.project?.id;
  const isWebProject = team?.project?.language === "web";
  const currentSavedCopy =
    activeSavedWork?.projectId === activeProjectId ? activeSavedWork : null;
  const workspaceTitle =
    user?.role === "student" && currentSavedCopy
      ? currentSavedCopy.label
      : team?.name || "Workspace";
  const workspaceSubtitle =
    user?.role === "student" && currentSavedCopy
      ? `Saved copy · ${activeFile?.path || "Java project"}`
      : `${team?.project?.title || "Java project"} · ${activeFile?.path || ""}`;
  const userId = user?.id;
  const classroomId = data?.classrooms[0]?.id;
  memberPhotoUrlsRef.current = new Map(
    data?.teams.flatMap((entry) =>
      entry.members.map(
        (member) => [member.id, member.photoUrl || null] as const,
      ),
    ) || [],
  );

  useEffect(() => {
    const activityId =
      data?.currentActivity?.mode === "group" ? data.currentActivity.id : "";
    const shouldPrompt =
      user?.role === "student" &&
      Boolean(activityId) &&
      team?.isGroup &&
      team.project?.activityId === activityId &&
      !team.myLeaderVoteId &&
      promptedGroupActivityRef.current !== activityId;
    if (!shouldPrompt) return;
    promptedGroupActivityRef.current = activityId;
    const timer = setTimeout(() => {
      setGroupName(team.name.startsWith("Group ") ? "" : team.name);
      setGroupLeaderId(team.members[0]?.id || "");
      setGroupProfileOpen(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [data?.currentActivity, team, user?.role]);

  function chooseStudentPhoto(studentId: string) {
    photoStudentIdRef.current = studentId;
    studentPhotoInputRef.current?.click();
  }

  async function uploadStudentPhoto(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    const studentId = photoStudentIdRef.current;
    event.target.value = "";
    if (!file || !studentId) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return notify("Choose a JPG, PNG, or WebP image");
    if (file.size > 2 * 1024 * 1024)
      return notify("Student photos must be 2 MB or smaller");
    try {
      const result = await api<{ photoUrl: string }>(
        `/api/teacher/students/${studentId}/photo`,
        { method: "PUT", body: file, headers: { "Content-Type": file.type } },
      );
      setData((current) =>
        current
          ? {
              ...current,
              teams: current.teams.map((entry) => ({
                ...entry,
                members: entry.members.map((member) =>
                  member.id === studentId
                    ? { ...member, photoUrl: result.photoUrl }
                    : member,
                ),
              })),
            }
          : current,
      );
      notify("Student picture saved to Supabase");
    } catch (uploadError) {
      notify(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload student picture",
      );
    }
  }

  async function uploadTeacherPhoto(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return notify("Choose a JPG, PNG, or WebP image");
    if (file.size > 2 * 1024 * 1024)
      return notify("Profile pictures must be 2 MB or smaller");
    try {
      const result = await api<{ photoUrl: string }>(
        "/api/teacher/profile/photo",
        { method: "PUT", body: file, headers: { "Content-Type": file.type } },
      );
      setUser((current) =>
        current ? { ...current, photoUrl: result.photoUrl } : current,
      );
      setData((current) =>
        current
          ? {
              ...current,
              user: { ...current.user, photoUrl: result.photoUrl },
              teams: current.teams.map((entry) => ({
                ...entry,
                members: entry.members.map((member) =>
                  member.id === user?.id
                    ? { ...member, photoUrl: result.photoUrl }
                    : member,
                ),
              })),
            }
          : current,
      );
      notify("Your profile picture was saved to Supabase");
    } catch (uploadError) {
      notify(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload profile picture",
      );
    }
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty("--ui-scale", String(fontScale));
    localStorage.setItem("javashare-theme", theme);
    localStorage.setItem("javashare-font-scale", String(fontScale));
  }, [theme, fontScale]);

  useEffect(() => {
    if (panel !== "chat") return;
    const frame = requestAnimationFrame(() => {
      const chatMessages =
        document.querySelector<HTMLElement>(".chat-messages");
      if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    });
    return () => cancelAnimationFrame(frame);
  }, [messages, panel, chatTeamId]);

  useEffect(() => {
    api<{ user: User }>("/api/auth/me")
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const loadWorkspace = useCallback(
    async (viewOverride?: "students" | "groups") => {
      if (!user) return;
      try {
        const view = viewOverride || teacherWorkspaceView;
        const params = new URLSearchParams();
        if (user.role === "teacher") params.set("view", view);
        if (enteredClassroomId) params.set("classroomId", enteredClassroomId);
        const query = params.toString();
        const next = await api<Bootstrap>(`/api/bootstrap${query ? `?${query}` : ""}`);
        setData(next);
        setUser(next.user);
        setWorkspaceError("");
        const currentActivity = next.currentActivity;
        const assignedActivityIndex =
          user.role === "student" && currentActivity
            ? next.teams.findIndex(
                (item) =>
                  item.project?.activityId === currentActivity.id &&
                  (currentActivity.mode !== "group" || item.isGroup),
              )
            : -1;
        const firstActivityGroupIndex =
          user.role === "teacher" &&
          view === "groups" &&
          currentActivity?.mode === "group"
            ? next.teams.findIndex(
                (item) =>
                  item.isGroup &&
                  !item.isTeacherWorkspace &&
                  item.project?.activityId === currentActivity.id,
              )
            : -1;
        const currentSelectionIsTeacherWorkspace = Boolean(
          next.teams[activeTeam]?.isTeacherWorkspace,
        );
        const selectedIndex =
          assignedActivityIndex >= 0
            ? assignedActivityIndex
            : firstActivityGroupIndex >= 0 && currentSelectionIsTeacherWorkspace
              ? firstActivityGroupIndex
              : next.teams[activeTeam]
                ? activeTeam
                : 0;
        const selectedTeam = next.teams[selectedIndex];
        if (selectedIndex !== activeTeam) setActiveTeam(selectedIndex);
        const selected = selectedTeam?.files[0] ?? null;
        setActiveFile(selected);
        setCode(selected?.content ?? "");
        lastSaved.current = selected?.content ?? "";
        setSubmitted(Boolean(selectedTeam?.completed));
        setSyncStatus("Your work is saved");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Backend unavailable";
        if (message === "Sign in required" || message === "Session expired") {
          forgetRealtimeClient();
          setUser(null);
          setData(null);
          return;
        }
        setSyncStatus(message);
        setWorkspaceError(message);
      }
    },
    [user, activeTeam, teacherWorkspaceView, enteredClassroomId],
  );
  useEffect(() => {
    if (!user) {
      loadedWorkspaceKeyRef.current = "";
      return;
    }
    const workspaceKey = `${user.id}:${user.role === "teacher" ? teacherWorkspaceView : "student"}:${enteredClassroomId || "list"}`;
    if (loadedWorkspaceKeyRef.current === workspaceKey) return;
    loadedWorkspaceKeyRef.current = workspaceKey;
    const timer = setTimeout(() => void loadWorkspace(), 0);
    return () => clearTimeout(timer);
  }, [user, loadWorkspace, teacherWorkspaceView, enteredClassroomId]);
  useEffect(() => {
    if (!classroomId) return;
    let cancelled = false;
    const refreshLiveShare = async () => {
      try {
        const next = await api<LiveShare>(
          `/api/classes/${classroomId}/live-share`,
        );
        if (cancelled) return;
        setLiveShare((current) => {
          if (
            !next.active ||
            !current.active ||
            next.projectId !== current.projectId
          )
            return next;
          // Live drafts are newer than the saved REST snapshot but have the same
          // version. Only accept files whose persisted version has moved forward.
          const files = next.files?.map((file) => {
            const existing = current.files?.find((item) => item.id === file.id);
            return existing && existing.version >= file.version
              ? existing
              : file;
          });
          return { ...next, files };
        });
      } catch {
        // Keep the last known presentation on screen while the connection recovers.
      }
    };
    void refreshLiveShare();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshLiveShare();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    // Safety net for a missed live message (decided 2026-10-16: no timer, to stay within
    // Cloudflare's free request limit): check when the page opens, when the student returns
    // to the tab, and whenever the class live channel (re)connects.
    refreshLiveShareRef.current = () => void refreshLiveShare();
    return () => {
      cancelled = true;
      refreshLiveShareRef.current = null;
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [classroomId]);
  useEffect(() => {
    if (!chatTeamId) {
      queueMicrotask(() => setMessages([]));
      return;
    }
    api<{ messages: ChatMessage[] }>(`/api/teams/${chatTeamId}/messages`)
      .then((result) => setMessages(result.messages))
      .catch(() => setMessages([]));
  }, [chatTeamId]);

  useEffect(() => {
    if (!preview) return;
    function receive(event: MessageEvent) {
      // Only trust messages from the preview frame we created for this run.
      if (!preview || event.source !== previewFrameRef.current?.contentWindow) return;
      const message = event.data as ConsoleMessage;
      if (message?.codeshare !== "console") return;
      const origin = originOf(preview, message.line);
      setPreviewLogs((logs) =>
        logs.length >= 500
          ? logs
          : [
              ...logs,
              {
                kind: message.kind,
                text: String(message.text),
                where: origin ? `${origin.file}:${origin.line}` : "",
              },
            ],
      );
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [preview]);

  function chooseTeam(index: number) {
    const selected = data?.teams[index]?.files[0] ?? null;
    setActiveTeam(index);
    setActiveFile(selected);
    setCode(selected?.content ?? "");
    lastSaved.current = selected?.content ?? "";
    setSubmitted(Boolean(data?.teams[index]?.completed));
    setRemoteCursors([]);
    setActiveSavedWork(null);
    setPreview(null);
    setPreviewLogs([]);
  }

  useEffect(() => {
    liveRef.current = { code, activeFile, team, userId: user?.id || "", userName: user?.name || "" };
  });
  useEffect(() => {
    if (!teamId || !userId || !classroomId) return;
    let cancelled = false;
    const channels: RealtimeChannel[] = [];
    // Live events arrive as Supabase Realtime broadcasts: "class:*" and "groups:*" events on the
    // class channel, everything else on the team channel(s). See app/realtime.ts.
    const handlers: { event: string; handler: (payload: never) => void }[] = [];
    const on = <T,>(event: string, handler: (payload: T) => void) =>
      handlers.push({ event, handler: handler as (payload: never) => void });
    const isClassEvent = (event: string) =>
      event.startsWith("class:") || event.startsWith("groups:");
    const answerSyncRequest = () => {
      const { code: current, activeFile: file, userName } = liveRef.current;
      if (user?.role !== "student" || !file) return;
      const channel = teamChannelRef.current;
      void channel?.send({
        type: "broadcast",
        event: "team:active-file",
        payload: { teamId, fileId: file.id, path: file.path, language: file.language, content: current, version: file.version, updatedById: userId, updatedBy: userName },
      });
      if (current !== lastSaved.current)
        void channel?.send({
          type: "broadcast",
          event: "team:live-snapshots",
          payload: [{ fileId: file.id, content: current, updatedById: userId, updatedBy: userName }],
        });
    };
    void api<{ lateAssignment: { teamName: string } | null }>(
      `/api/classes/${classroomId}/arrive`,
      { method: "POST" },
    )
      .then(({ lateAssignment }) => {
        if (lateAssignment && !cancelled)
          notify(`You reconnected and joined ${lateAssignment.teamName}`);
      })
      .catch(() => undefined);
    on("class:live-share", (share: LiveShare) => {
      receivedDraftSequenceRef.current = 0;
      setLiveShare(share);
    });
    on("class:chat-muted", ({ muted }: { muted: boolean }) =>
      setData((current) =>
        current ? { ...current, classroomChatMuted: muted } : current,
      ),
    );
    on(
      "groups:updated",
      (assignment?: { studentName?: string; teamName?: string }) => {
        void loadWorkspace();
        if (
          user.role === "teacher" &&
          assignment?.studentName &&
          assignment.teamName
        )
          notify(
            `${assignment.studentName} reconnected and was added to ${assignment.teamName}`,
          );
      },
    );
    on("class:activity-deployed", (activity: { title: string }) => {
      setLiveShare({ active: false });
      void loadWorkspace();
      notify(`New activity: ${activity.title}`);
    });
    on(
      "class:activity-ended",
      (activity: { title: string; mode: "individual" | "group" }) => {
        setLiveShare({ active: false });
        setMessages([]);
        setChatText("");
        setGroupProfileOpen(false);
        setPanel("console");
        if (activity.mode === "group" && user.role === "teacher") {
          setTeacherWorkspaceView("students");
          setActiveTeam(0);
          void loadWorkspace("students");
        } else {
          void loadWorkspace();
        }
        notify(`${activity.title} has ended`);
      },
    );
    on("chat:message", (message: ChatMessage) =>
      setMessages((items) =>
        items.some((item) => item.id === message.id)
          ? items
          : [...items, message],
      ),
    );
    on(
      "team:submitted",
      (submission: {
        projectId: string;
        submittedBy: string;
        creditedMemberIds: string[];
      }) => {
        setData((current) =>
          current
            ? {
                ...current,
                teams: current.teams.map((item) =>
                  item.project?.id === submission.projectId
                    ? { ...item, completed: true }
                    : item,
                ),
              }
            : current,
        );
        if (
          submission.projectId === activeProjectId &&
          submission.creditedMemberIds.includes(userId)
        ) {
          setSubmitted(true);
          notify(
            `Group code submitted by ${submission.submittedBy}. Every member received credit.`,
          );
        }
      },
    );
    on(
      "class:live-share-update",
      (update: {
        projectId: string;
        fileId: string;
        content: string;
        version: number;
      }) => {
        setLiveShare((share) =>
          share.active && share.projectId === update.projectId
            ? {
                ...share,
                files: share.files?.map((file) =>
                  file.id === update.fileId
                    ? {
                        ...file,
                        content: update.content,
                        version: update.version,
                      }
                    : file,
                ),
              }
            : share,
        );
      },
    );
    on(
      "class:live-share-draft",
      (update: {
        projectId: string;
        fileId: string;
        content: string;
        sequence: number;
      }) => {
        if (update.sequence <= receivedDraftSequenceRef.current) return;
        receivedDraftSequenceRef.current = update.sequence;
        setLiveShare((share) =>
          share.active && share.projectId === update.projectId
            ? {
                ...share,
                files: share.files?.map((file) =>
                  file.id === update.fileId
                    ? { ...file, content: update.content }
                    : file,
                ),
              }
            : share,
        );
      },
    );
    on(
      "team:file-draft",
      (update: {
        fileId: string;
        content: string;
        sequence: number;
        updatedById: string;
        updatedBy: string;
      }) => {
        const previousSequence =
          receivedGroupDraftsRef.current.get(update.updatedById) || 0;
        if (update.sequence <= previousSequence) return;
        receivedGroupDraftsRef.current.set(update.updatedById, update.sequence);
        setActiveFile((file) => {
          if (update.fileId !== file?.id) return file;
          remoteGroupDraftRef.current = update.content;
          setCode(update.content);
          setSyncStatus(`${update.updatedBy} is typing…`);
          return { ...file, content: update.content };
        });
      },
    );
    on(
      "team:file-operation",
      (update: FileOperation & { updatedById: string; updatedBy: string }) => {
        // The channel only checks team membership; ignore typing from a member the leader locked.
        const liveTeam = liveRef.current.team;
        const sender = liveTeam?.members.find((member) => member.id === update.updatedById);
        if (liveTeam?.isGroup && sender?.editingLocked && liveTeam.leaderId !== sender.id) return;
        if (unsentBaseRef.current?.fileId === update.fileId)
          unsentBaseRef.current = { fileId: update.fileId, content: applyOperation(unsentBaseRef.current.content, update) };
        const previousSequence =
          receivedGroupDraftsRef.current.get(update.updatedById) || 0;
        if (update.sequence <= previousSequence) return;
        receivedGroupDraftsRef.current.set(update.updatedById, update.sequence);
        setActiveFile((file) => {
          if (update.fileId !== file?.id) return file;
          setCode((current) => {
            const next = applyOperation(current, update);
            remoteGroupDraftRef.current = next;
            return next;
          });
          setSyncStatus(`${update.updatedBy} is typing…`);
          return file;
        });
      },
    );
    on(
      "team:live-snapshots",
      (
        snapshots: {
          fileId: string;
          content: string;
          updatedById: string;
          updatedBy: string;
        }[],
      ) => {
        const snapshot = snapshots.find(
          (item) => item.fileId === activeFile?.id,
        );
        if (!snapshot) return;
        remoteGroupDraftRef.current = snapshot.content;
        setCode(snapshot.content);
        setSyncStatus(`${snapshot.updatedBy} has unsaved live changes`);
        setRemoteCursors([]);
      },
    );
    on(
      "team:cursor",
      (cursor: {
        fileId: string;
        line: number;
        column: number;
        userId: string;
        name: string;
      }) => {
        if (cursor.fileId !== activeFile?.id) return;
        setRemoteCursors((items) => [
          ...items.filter((item) => item.userId !== cursor.userId),
          {
            ...cursor,
            color: collaboratorColor(cursor.userId),
            photoUrl: memberPhotoUrlsRef.current.get(cursor.userId) || null,
          },
        ]);
      },
    );
    on(
      "team:active-file",
      (selection: {
        teamId: string;
        fileId: string;
        path: string;
        language: string;
        content: string;
        version: number;
        updatedById: string;
        updatedBy: string;
      }) => {
        if (
          user?.role !== "teacher" ||
          team?.isTeacherWorkspace ||
          selection.teamId !== teamId
        )
          return;
        const selected: FileData = {
          id: selection.fileId,
          path: selection.path,
          language: selection.language,
          content: selection.content,
          version: selection.version,
        };
        updateTeamFile(selected);
        setActiveFile(selected);
        setCode(selected.content);
        lastSaved.current = selected.content;
        remoteGroupDraftRef.current = null;
        setRemoteCursors([]);
        setSyncStatus(`Following ${selection.updatedBy}`);
      },
    );
    on(
      "file:updated",
      (update: {
        fileId: string;
        content: string;
        version: number;
        updatedBy: string;
        updatedById?: string;
      }) => {
        if (update.updatedById === userId) return;
        setActiveFile((file) => {
          if (
            update.fileId !== file?.id ||
            update.content === lastSaved.current
          )
            return file;
          remoteGroupDraftRef.current = null;
          lastSaved.current = update.content;
          setCode(update.content);
          setSyncStatus(`Updated by ${update.updatedBy}`);
          return { ...file, content: update.content, version: update.version };
        });
      },
    );
    realtimeClient(getApiUrl())
      .then((client) => {
        if (cancelled) return;
        setSyncStatus("Joining live classroom…");
        const join = (topic: string, presenceKey?: string) => {
          const channel = privateChannel(client, topic, presenceKey);
          for (const { event, handler } of handlers)
            if (isClassEvent(event) === topic.startsWith("class:"))
              channel.on("broadcast", { event }, ({ payload }) => handler(payload as never));
          channels.push(channel);
          return channel;
        };
        const classChannel = join(`class:${classroomId}`, userId);
        classChannel.on("presence", { event: "sync" }, () =>
          setOnlineUserIds(Object.keys(classChannel.presenceState())),
        );
        classChannel.subscribe((status) => {
          if (status !== "SUBSCRIBED") {
            classChannelRef.current = null;
            return;
          }
          classChannelRef.current = classChannel;
          void classChannel.track({ online: true });
          refreshLiveShareRef.current?.();
        });
        const teamChannel = join(`team:${teamId}`);
        teamChannel.on("broadcast", { event: "team:sync-request" }, answerSyncRequest);
        teamChannel.subscribe((status) => {
          if (status !== "SUBSCRIBED") {
            teamChannelRef.current = null;
            setSyncStatus(status === "CLOSED" ? "Reconnecting…" : "Live connection unavailable; retrying…");
            return;
          }
          teamChannelRef.current = teamChannel;
          setSyncStatus("Live classroom connected");
          // Ask teammates for their unsaved typing and current file, and share ours.
          void teamChannel.send({ type: "broadcast", event: "team:sync-request", payload: {} });
          answerSyncRequest();
          const unsent = unsentBaseRef.current;
          const { code: current, activeFile: file } = liveRef.current;
          if (unsent && file?.id === unsent.fileId) sendTyping(teamId, unsent.fileId, current);
        });
        if (chatTeamId && chatTeamId !== teamId) join(`team:${chatTeamId}`).subscribe();
      })
      .catch((error) =>
        setSyncStatus(error instanceof Error ? error.message : "Live connection unavailable"),
      );
    return () => {
      cancelled = true;
      teamChannelRef.current = null;
      classChannelRef.current = null;
      void realtimeClient(getApiUrl())
        .then((client) => channels.forEach((channel) => void client.removeChannel(channel)))
        .catch(() => undefined);
    };
  }, [
    teamId,
    chatTeamId,
    userId,
    classroomId,
    activeProjectId,
    activeFile?.id,
    loadWorkspace,
    user?.role,
  ]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (team?.isGroup && myGroupMembership?.chatMuted && team.leaderId !== user?.id) {
      notify("The group leader muted member chat");
      return;
    }
    const text = chatText.trim();
    if (!chatTeamId || !text) return;
    setChatText("");
    try {
      await api(`/api/teams/${chatTeamId}/messages`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
    } catch (error) {
      setChatText(text);
      notify(error instanceof Error ? error.message : "Message not sent");
    }
  }

  async function toggleClassroomChatMute() {
    if (!classroomId || user?.role !== "teacher") return;
    try {
      const result = await api<{ muted: boolean }>(
        `/api/classes/${classroomId}/chat-mute`,
        {
          method: "PUT",
          body: JSON.stringify({ muted: !data?.classroomChatMuted }),
        },
      );
      setData((current) =>
        current ? { ...current, classroomChatMuted: result.muted } : current,
      );
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Could not update classroom chat",
      );
    }
  }

  async function autoGroup(event: React.FormEvent) {
    event.preventDefault();
    const title = activityTitle.trim();
    if (!classroomId || autoGrouping) return;
    if (title.length < 2)
      return notify("Activity name must contain at least 2 characters");
    setAutoGrouping(true);
    try {
      const studentIds = groupRoster
        .filter((student) => !excludedGroupStudentIds.includes(student.id))
        .map((student) => student.id);
      const result = await api<{ groups: number; students: number }>(
        `/api/classes/${classroomId}/auto-group`,
        {
          method: "POST",
          body: JSON.stringify({ groupSize: autoGroupSize, studentIds }),
        },
      );
      const activity = await api<{ title: string }>(
        `/api/classes/${classroomId}/activities`,
        {
          method: "POST",
          body: JSON.stringify({
            title,
            description: activityDescription,
            mode: "group",
            starterCode: activityStarter,
          }),
        },
      );
      setTeacherWorkspaceView("groups");
      setAutoGroupOpen(false);
      setActivityTitle("");
      setActivityDescription("");
      setActivityStarter("");
      setActiveTeam(0);
      await loadWorkspace("groups");
      setPanel("chat");
      notify(
        `Deployed ${activity.title} to ${result.students} students in ${result.groups} group${result.groups === 1 ? "" : "s"}`,
      );
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Could not create groups",
      );
    } finally {
      setAutoGrouping(false);
    }
  }

  async function deployActivity(event: React.FormEvent) {
    event.preventDefault();
    const title = activityTitle.trim();
    if (!classroomId) return;
    if (title.length < 2)
      return notify("Activity name must contain at least 2 characters");
    setDeployingActivity(true);
    try {
      const result = await api<{
        title: string;
        mode: string;
        workspaces: number;
      }>(`/api/classes/${classroomId}/activities`, {
        method: "POST",
        body: JSON.stringify({
          title,
          description: activityDescription,
          mode: activityMode,
          starterCode: activityStarter,
        }),
      });
      setActivityOpen(false);
      setActivityTitle("");
      setActivityDescription("");
      setActivityStarter("");
      await loadWorkspace();
      notify(
        `Deployed ${result.title} to ${result.workspaces} ${result.mode} workspace${result.workspaces === 1 ? "" : "s"}`,
      );
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Could not deploy activity",
      );
    } finally {
      setDeployingActivity(false);
    }
  }

  async function endCurrentActivity(event: React.FormEvent) {
    event.preventDefault();
    if (!classroomId || endingActivity) return;
    setEndingActivity(true);
    try {
      const ended = await api<{ title: string; mode: "individual" | "group" }>(
        `/api/classes/${classroomId}/end-activity`,
        { method: "POST" },
      );
      setEndActivityOpen(false);
      setMessages([]);
      setChatText("");
      setGroupProfileOpen(false);
      setPanel("console");
      setActiveTeam(0);
      if (ended.mode === "group") setTeacherWorkspaceView("students");
      await loadWorkspace(
        ended.mode === "group" ? "students" : teacherWorkspaceView,
      );
      notify(`${ended.title} ended. You can now start a new activity.`);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Could not end the activity",
      );
    } finally {
      setEndingActivity(false);
    }
  }

  function openGroupProfile() {
    if (!team?.isGroup) return;
    setGroupName(team.name);
    setGroupLeaderId(team.leaderId || team.members[0]?.id || "");
    setGroupProfileOpen(true);
  }

  async function saveGroupProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!team?.isGroup || (team.myLeaderVoteId ? !groupName.trim() : !groupLeaderId)) return;
    setSavingGroup(true);
    try {
      await api(`/api/teams/${team.id}/group-profile`, {
        method: "PUT",
        body: JSON.stringify({ name: groupName, leaderId: groupLeaderId }),
      });
      setGroupProfileOpen(false);
      await loadWorkspace();
      notify(team.myLeaderVoteId ? "Group name updated" : "Your leader vote was counted");
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Could not save group settings",
      );
    } finally {
      setSavingGroup(false);
    }
  }

  async function updateMemberPermissions(member: TeamMember, changes: { chatMuted?: boolean; editingLocked?: boolean }) {
    if (!team?.isGroup || team.leaderId !== user?.id) return;
    try {
      await api(`/api/teams/${team.id}/group-permissions`, { method: "PUT", body: JSON.stringify({ userId: member.id, chatMuted: changes.chatMuted ?? Boolean(member.chatMuted), editingLocked: changes.editingLocked ?? Boolean(member.editingLocked) }) });
      await loadWorkspace();
      notify(`${member.name}'s permissions updated`);
    } catch (error) { notify(error instanceof Error ? error.message : "Could not update member permissions"); }
  }

  useEffect(() => {
    if (!activeFile || code === lastSaved.current) return;
    if (code === remoteGroupDraftRef.current) return;
    if (user?.role === "student") return;
    saveTimerRef.current = setTimeout(async () => {
      setSyncStatus("Saving…");
      try {
        const result = await api<{ content: string; version: number }>(
          `/api/files/${activeFile.id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              content: code,
              version: activeFile.version,
            }),
          },
        );
        lastSaved.current = result.content;
        setActiveFile((file) =>
          file
            ? { ...file, content: result.content, version: result.version }
            : file,
        );
        setSyncStatus("Your work is saved");
      } catch (error) {
        setSyncStatus(
          error instanceof Error ? error.message : "Changes not saved",
        );
      }
    }, 700);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [code, activeFile, user?.role]);

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(""), 2600);
  }
  function updateCode(nextCode: string) {
    remoteGroupDraftRef.current = null;
    setCode(nextCode);
    if (user?.role === "student")
      setSyncStatus("Unsaved changes — click Save work");
    const presentationProjectId = team?.project?.id;
    if (
      user?.role === "teacher" &&
      team?.isTeacherWorkspace &&
      liveShare.active &&
      liveShare.projectId === presentationProjectId &&
      presentationProjectId &&
      activeFile &&
      classroomId
    ) {
      liveDraftSequenceRef.current += 1;
      const draft = {
        projectId: presentationProjectId,
        fileId: activeFile.id,
        content: nextCode,
        sequence: liveDraftSequenceRef.current,
      };
      sendLiveShareDraft(draft);
    }
    if (user?.role === "student" && teamId && activeFile) {
      unsentBaseRef.current ??= { fileId: activeFile.id, content: code };
      sendTyping(teamId, activeFile.id, nextCode);
    }
  }
  function updateCursor(offset: number) {
    if (user?.role !== "student" || !teamId || !activeFile) return;
    sendCursor({ teamId, fileId: activeFile.id, ...pointAt(code, offset), userId: user.id, name: user.name });
  }
  async function persistCurrentCode() {
    if (!activeFile || code === lastSaved.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSyncStatus("Saving…");
    const result = await api<{ content: string; version: number }>(
      `/api/files/${activeFile.id}`,
      {
        method: "PUT",
        body: JSON.stringify({ content: code, version: activeFile.version }),
      },
    );
    lastSaved.current = result.content;
    const nextFile = {
      ...activeFile,
      content: result.content,
      version: result.version,
    };
    setActiveFile(nextFile);
    updateTeamFile(nextFile);
    setSyncStatus("Your work is saved");
  }
  function updateTeamFile(nextFile: FileData) {
    setData((current) =>
      current
        ? {
            ...current,
            teams: current.teams.map((item, index) =>
              index === activeTeam
                ? {
                    ...item,
                    files: item.files.some((file) => file.id === nextFile.id)
                      ? item.files.map((file) =>
                          file.id === nextFile.id ? nextFile : file,
                        )
                      : [...item.files, nextFile],
                  }
                : item,
            ),
          }
        : current,
    );
  }
  async function chooseFile(file: FileData) {
    if (file.id === activeFile?.id) return;
    if (user?.role === "student" && code !== lastSaved.current) {
      notify("Save your changes before switching files");
      return;
    }
    try {
      await persistCurrentCode();
      setActiveFile(file);
      setCode(file.content);
      lastSaved.current = file.content;
      remoteGroupDraftRef.current = null;
      setSyncStatus("Your work is saved");
      setRemoteCursors([]);
      if (user?.role === "student" && teamId)
        void teamChannelRef.current?.send({ type: "broadcast", event: "team:active-file", payload: {
          teamId,
          fileId: file.id,
          path: file.path,
          language: file.language,
          content: file.content,
          version: file.version,
        }, });
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not switch files");
    }
  }
  function openCreateFile() {
    if (!team?.project) return;
    setNewFilePath(isWebProject ? "about.html" : "src/Helper.java");
    setNewFileOpen(true);
  }
  async function createFile(event: React.FormEvent) {
    event.preventDefault();
    if (!team?.project || creatingFile) return;
    const path = newFilePath.trim().replace(/\\/g, "/");
    if (!path) return;
    const className =
      path
        .split("/")
        .pop()
        ?.replace(/\.java$/i, "") || "Helper";
    const content = !isWebProject
      ? `public class ${className} {\n    \n}\n`
      : path.endsWith(".html")
        ? `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>${className.replace(/\.html$/, "")}</title>\n</head>\n<body>\n  \n</body>\n</html>\n`
        : "";
    setCreatingFile(true);
    try {
      await persistCurrentCode();
      const created = await api<FileData>(
        `/api/projects/${team.project.id}/files`,
        {
          method: "POST",
          body: JSON.stringify({ path, content }),
        },
      );
      updateTeamFile(created);
      setActiveFile(created);
      setCode(created.content);
      lastSaved.current = created.content;
      setNewFileOpen(false);
      notify(`Created ${created.path}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not create file");
    } finally {
      setCreatingFile(false);
    }
  }
  async function createWebProject(event: React.FormEvent) {
    event.preventDefault();
    const title = newWebProjectTitle.trim();
    if (!classroomId || !title || creatingWebProject) return;
    if (code !== lastSaved.current) {
      notify("Save your changes before opening another project");
      return;
    }
    setCreatingWebProject(true);
    try {
      const created = await api<{ project: NonNullable<TeamData["project"]>; files: FileData[] }>(
        `/api/classes/${classroomId}/web-projects`,
        { method: "POST", body: JSON.stringify({ title }) },
      );
      // The new project lives in the student's personal workspace, next to "My Practice Code".
      const personal = data?.teams.find(
        (item) => !item.isGroup && item.project && !item.project.activityId,
      );
      if (!data || !personal) {
        await loadWorkspace();
      } else {
        const entry: TeamData = { ...personal, name: created.project.title, completed: false, project: created.project, files: created.files };
        setData({ ...data, teams: [...data.teams, entry] });
        setActiveTeam(data.teams.length);
        const first = created.files[0] ?? null;
        setActiveFile(first);
        setCode(first?.content ?? "");
        lastSaved.current = first?.content ?? "";
        setSubmitted(false);
        setRemoteCursors([]);
        setActiveSavedWork(null);
        setPreview(null);
        setPreviewLogs([]);
      }
      setNewWebProjectOpen(false);
      notify(`Created ${created.project.title}. Press Run to see your page.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not create web project");
    } finally {
      setCreatingWebProject(false);
    }
  }
  async function renameFile(file: FileData) {
    const entered = window.prompt("Rename file:", file.path);
    if (!entered?.trim() || entered.trim() === file.path) return;
    try {
      if (file.id === activeFile?.id) await persistCurrentCode();
      const renamed = await api<FileData>(`/api/files/${file.id}`, {
        method: "PATCH",
        body: JSON.stringify({ path: entered.trim() }),
      });
      updateTeamFile(renamed);
      if (file.id === activeFile?.id) setActiveFile(renamed);
      notify(`Renamed to ${renamed.path}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not rename file");
    }
  }
  async function openSavedWork() {
    if (!team?.project) return;
    try {
      const result = await api<{ saved: SavedWork[] }>(
        `/api/projects/${team.project.id}/saved-work`,
      );
      setSavedWorks(result.saved);
      setPanel("saved");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Could not load saved work",
      );
    }
  }
  async function saveWork() {
    if (!team?.project) return;
    try {
      await persistCurrentCode();
      if (activeSavedWork?.projectId === team.project.id) {
        const saved = await api<SavedWork>(
          `/api/saved-work/${activeSavedWork.id}`,
          { method: "PUT", body: JSON.stringify({}) },
        );
        setSavedWorks((items) =>
          items.map((item) => (item.id === saved.id ? saved : item)),
        );
        notify(`Updated ${saved.label}`);
        return;
      }
      const label = team.project.activityId
        ? team.project.title
        : window.prompt("Name this code so you can find it later:", "");
      if (!label?.trim()) return;
      const saved = await api<SavedWork>(
        `/api/projects/${team.project.id}/saved-work`,
        { method: "POST", body: JSON.stringify({ label: label.trim() }) },
      );
      setActiveSavedWork({
        id: saved.id,
        label: saved.label,
        projectId: team.project.id,
      });
      setSavedWorks((items) => [saved, ...items]);
      setPanel("saved");
      notify(`Saved ${saved.label}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save work");
    }
  }
  async function startNewLesson() {
    if (!team?.isTeacherWorkspace || !team.project) return;
    const suggested = `Lesson ${new Date().toLocaleDateString()}`;
    const label = window.prompt(
      "Save the current lesson before starting fresh:",
      suggested,
    );
    if (!label?.trim()) return;
    try {
      await persistCurrentCode();
      const saved = await api<SavedWork>(
        `/api/projects/${team.project.id}/saved-work`,
        { method: "POST", body: JSON.stringify({ label: label.trim() }) },
      );
      setSavedWorks((items) => [saved, ...items]);
      updateCode(FRESH_LESSON_CODE);
      setPanel("console");
      notify(`Saved ${saved.label}. New lesson ready.`);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Could not start a new lesson",
      );
    }
  }
  async function restoreWork(item: SavedWork) {
    try {
      await api(`/api/saved-work/${item.id}/restore`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      await loadWorkspace();
      if (team?.project)
        setActiveSavedWork({
          id: item.id,
          label: item.label,
          projectId: team.project.id,
        });
      setPanel("console");
      notify(`Reopened ${item.label}. Save will update this copy.`);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Could not reopen saved work",
      );
    }
  }
  async function openSubmissions() {
    try {
      const result = await api<{ submissions: Submission[] }>(
        "/api/submissions",
      );
      setSubmissions(result.submissions);
      setPanel("submissions");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Could not load submissions",
      );
    }
  }
  async function shareProject(projectId: string, workspaceName: string) {
    const classroomId = classroom?.id;
    if (!classroomId) return;
    try {
      const stopping = liveShare.active && liveShare.projectId === projectId;
      const share = await api<LiveShare>(
        `/api/classes/${classroomId}/live-share`,
        {
          method: "POST",
          body: JSON.stringify({ projectId: stopping ? null : projectId }),
        },
      );
      setLiveShare(share);
      notify(
        stopping
          ? "Class sharing stopped"
          : `Now sharing ${workspaceName} with the class`,
      );
    } catch (error) {
      notify(
        error instanceof Error
          ? error.message
          : "Could not update class sharing",
      );
    }
  }
  async function runCode() {
    if (!team) return;
    setPanel("console");
    // Web projects run in this browser (see app/webPreview.ts). In-browser Java (CheerpJ) and
    // C# (.NET WebAssembly) runners will be chosen here by project language in a later stage.
    if (isWebProject) {
      try {
        await persistCurrentCode();
      } catch (error) {
        notify(error instanceof Error ? error.message : "Could not save before running");
      }
      const next = buildPreview(
        team.files.map((file) => ({
          path: file.path,
          content: file.id === activeFile?.id ? code : file.content,
        })),
      );
      setPreview(next);
      setPreviewLogs(next.warnings.map((text) => ({ kind: "warn", text, where: "" })));
      setPreviewRun((run) => run + 1);
      return;
    }
    setRunning(true);
    setOutput("Sending Main.java to the classroom Java runner…");
    try {
      await persistCurrentCode();
      const files = team.files.map((file) => ({
        path: file.path,
        content: file.id === activeFile?.id ? code : file.content,
      }));
      const result = await api<{ output: string }>("/api/execute", {
        method: "POST",
        body: JSON.stringify({ files, stdin: consoleInput }),
      });
      setOutput(result.output);
    } catch (error) {
      setOutput(
        `Execution failed: ${error instanceof Error ? error.message : "Runner unavailable"}`,
      );
    } finally {
      setRunning(false);
    }
  }
  async function submitWork() {
    if (!team?.project?.activityId) return;
    if (team.isGroup && team.leaderId !== user?.id) {
      notify(
        team.leaderId
          ? "Only the selected group leader can submit group code"
          : "Select a group leader before submitting",
      );
      return;
    }
    try {
      await persistCurrentCode();
      await api(`/api/projects/${team.project.id}/submit`, { method: "POST" });
      setSubmitted(true);
      setData((current) =>
        current
          ? {
              ...current,
              teams: current.teams.map((item, index) =>
                index === activeTeam ? { ...item, completed: true } : item,
              ),
            }
          : current,
      );
      notify(
        team.isGroup
          ? "Group code submitted. Every member received credit."
          : "Your work was submitted to the teacher",
      );
    } catch (error) {
      notify(error instanceof Error ? error.message : "Submission failed");
    }
  }
  async function logout() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (
      user?.role === "student" &&
      activeFile &&
      code !== lastSaved.current &&
      !window.confirm("You have unsaved changes. Sign out without saving them?")
    )
      return;
    if (user?.role === "teacher" && activeFile && code !== lastSaved.current) {
      try {
        await persistCurrentCode();
      } catch (error) {
        notify(
          error instanceof Error
            ? `Could not log out: ${error.message}`
            : "Could not save your work",
        );
        return;
      }
    }
    await api("/api/auth/logout", { method: "POST" });
    forgetRealtimeClient(); // the live pass belongs to the signed-out user
    setUser(null);
    setData(null);
    setEnteredClassroomId(null);
    setHomeClassroomId(null);
    setModulesOpen(false);
  }

  if (loading) return <CenteredCard title="Starting CodeShare…" />;
  if (!user) return <AuthScreen onAuthenticated={setUser} />;
  if (user.passwordResetRequired)
    return <ResetPasswordScreen user={user} onChanged={setUser} />;
  if (data?.needsJoin)
    return <JoinClass user={user} onJoined={loadWorkspace} onLogout={logout} />;
  if (!enteredClassroomId && data)
    return (
      <Landing
        role={user.role}
        name={user.name}
        classrooms={data.classrooms}
        initialClassroomId={homeClassroomId}
        onEnter={(classroomId) => {
          setHomeClassroomId(classroomId);
          setEnteredClassroomId(classroomId);
        }}
        onLogout={logout}
        onRefresh={() => void loadWorkspace()}
      />
    );
  if (!data || !team)
    return (
      <CenteredCard
        title="Preparing your classroom…"
        message={
          workspaceError || "Loading your team repository from Supabase…"
        }
      />
    );

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const classroom = data.classrooms[0];
  const onlineStudentCount = new Set(
    data.teams
      .filter((item) => !item.isTeacherWorkspace)
      .flatMap((item) => item.members.map((member) => member.id))
      .filter((id) => onlineUserIds.includes(id)),
  ).size;
  const visibleGroups = data.teams.filter(
    (item) => item.isGroup && !item.isTeacherWorkspace,
  );
  const teacherGroupView =
    user.role === "teacher" && teacherWorkspaceView === "groups";
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">C</span>
          <span>CodeShare</span>
          <span className="teacher-pill">{user.role.toUpperCase()}</span>
        </div>
        <div className="class-context">
          <b>{classroom?.name || "CodeShare Classroom"}</b>
          <span>
            {classroom?.subject || "Collaborative Java programming"}
            {classroom?.joinCode ? ` · Join code: ${classroom.joinCode}` : ""}
            {user.role === "teacher" && (
              <>
                <Link className="summary-link" href="/teacher">
                  Activity summary →
                </Link>
                <Link className="summary-link" href="/teacher/accounts">
                  Student accounts →
                </Link>
              </>
            )}
          </span>
        </div>
        <div className="header-actions">
          <button
            className="settings-button"
            type="button"
            onClick={() => { setModulesOpen(false); setEnteredClassroomId(null); }}
            title="Back to class home"
          >
            Class home
          </button>
          {classroomId && user.role === "student" && (
            <button
              className="settings-button modules-button"
              type="button"
              onClick={() => setModulesOpen(true)}
              title="This week's module"
            >
              Modules
            </button>
          )}
          <div className="display-settings">
            <button
              className="settings-button"
              onClick={() => setSettingsOpen((open) => !open)}
              aria-expanded={settingsOpen}
              aria-haspopup="dialog"
              aria-label="Display settings"
              title="Display settings"
            >
              Aa
            </button>
            {settingsOpen && (
              <div
                className="settings-popover"
                role="dialog"
                aria-label="Display settings"
              >
                <div className="settings-title">
                  <b>Display</b>
                  <button
                    onClick={() => setSettingsOpen(false)}
                    aria-label="Close display settings"
                  >
                    ×
                  </button>
                </div>
                <label className="font-slider-label">
                  <span>
                    Text size <b>{Math.round(fontScale * 100)}%</b>
                  </span>
                  <div className="font-slider">
                    <small>A</small>
                    <input
                      type="range"
                      min="1"
                      max="1.45"
                      step="0.05"
                      value={fontScale}
                      onChange={(event) =>
                        setFontScale(Number(event.target.value))
                      }
                      aria-label="Text size"
                    />
                    <strong>A</strong>
                  </div>
                </label>
                <div className="theme-row">
                  <span>Appearance</span>
                  <button
                    className={`theme-switch ${theme === "dark" ? "on" : ""}`}
                    role="switch"
                    aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                    aria-checked={theme === "dark"}
                    onClick={() =>
                      setTheme((value) => (value === "dark" ? "light" : "dark"))
                    }
                  >
                    <span className="sun-icon" aria-hidden="true">
                      ☀
                    </span>
                    <span className="moon-icon" aria-hidden="true">
                      ☾
                    </span>
                    <i />
                  </button>
                </div>
              </div>
            )}
          </div>
          <button className="icon-button" aria-label="Notifications">
            ♢<i />
          </button>
          <button
            className={`teacher-avatar ${user.role === "teacher" ? "photo-editable" : ""}`}
            type="button"
            onClick={() =>
              user.role === "teacher" && teacherPhotoInputRef.current?.click()
            }
            title={
              user.role === "teacher"
                ? "Click to add or replace your profile picture"
                : undefined
            }
          >
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={`${user.name}'s profile`} />
            ) : (
              initials
            )}
          </button>
          <input
            ref={teacherPhotoInputRef}
            className="student-photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={uploadTeacherPhoto}
          />
          <div className="teacher-name">
            <b>{user.name}</b>
            <span>{user.role}</span>
          </div>
          <button className="chevron" onClick={logout} aria-label="Sign out">
            ↪
          </button>
        </div>
      </header>
      <section className="workspace">
        <aside className="sidebar">
          <div className="side-title">
            <span>
              {teacherGroupView
                ? `GROUPS · ${visibleGroups.length}`
                : user.role === "teacher"
                  ? `STUDENTS · ${onlineStudentCount} ONLINE`
                  : team.isGroup
                    ? "MY GROUP ACTIVITIES"
                    : "MY ACTIVITIES"}
            </span>
            {user.role === "student" && (
              <div className="teacher-tools">
                <button
                  onClick={() => {
                    setNewWebProjectTitle("");
                    setNewWebProjectOpen(true);
                  }}
                >
                  New web project
                </button>
              </div>
            )}
            {user.role === "teacher" && (
              <div className="teacher-tools">
                {data.currentActivity && (
                  <button
                    className="end-activity-button"
                    onClick={() => setEndActivityOpen(true)}
                  >
                    End{" "}
                    {data.currentActivity.mode === "group"
                      ? "group activity"
                      : "activity"}
                  </button>
                )}
                <button
                  onClick={() => setActivityOpen(true)}
                  disabled={Boolean(data.currentActivity)}
                  title={
                    data.currentActivity
                      ? "End the current activity first"
                      : "Create a new activity"
                  }
                >
                  New activity
                </button>
                <button
                  aria-label="Configure automatic groups"
                  title={
                    data.currentActivity
                      ? "End the current activity first"
                      : "Create groups and deploy a group activity"
                  }
                  disabled={Boolean(data.currentActivity)}
                  onClick={() => {
                    const roster = Array.from(
                      new Map(
                        data.teams
                          .filter((item) => !item.isTeacherWorkspace)
                          .flatMap((item) => item.members)
                          .filter((member) => onlineUserIds.includes(member.id))
                          .map((member) => [member.id, member]),
                      ).values(),
                    );
                    setGroupRoster(roster);
                    setExcludedGroupStudentIds([]);
                    setActivityMode("group");
                    setAutoGroupOpen(true);
                  }}
                >
                  Auto group
                </button>
              </div>
            )}
          </div>
          {user.role === "teacher" && (data.groupCount || teacherGroupView) ? (
            <div className="workspace-view-switch">
              <button
                className={!teacherGroupView ? "active" : ""}
                onClick={() => {
                  setTeacherWorkspaceView("students");
                  setActiveTeam(0);
                  void loadWorkspace("students");
                }}
              >
                Students
              </button>
              <button
                className={teacherGroupView ? "active" : ""}
                onClick={() => {
                  setTeacherWorkspaceView("groups");
                  setActiveTeam(0);
                  void loadWorkspace("groups");
                }}
              >
                Groups <span>{data.groupCount || visibleGroups.length}</span>
              </button>
            </div>
          ) : null}
          <input
            ref={studentPhotoInputRef}
            className="student-photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={uploadStudentPhoto}
          />
          <div className="team-list">
            {data.teams.map((item, index) => {
              const online = item.members.some((member) =>
                onlineUserIds.includes(member.id),
              );
              const studentStatus = item.completed
                ? "Submitted"
                : "Open for editing";
              const groupExpanded =
                item.isGroup && activeTeam === index && (teacherGroupView || (user.role === "student" && item.leaderId === user.id));
              return (
                <div
                  className={`team-card ${activeTeam === index ? "active" : ""} ${user.role === "teacher" && !online && !item.isTeacherWorkspace ? "offline" : ""} ${item.isTeacherWorkspace ? "teacher-workspace" : ""} ${item.isGroup ? "group-card" : ""}`}
                  key={`${item.id}:${item.project?.id || index}`}
                >
                  <button
                    className="team-select"
                    onClick={() => chooseTeam(index)}
                    aria-expanded={item.isGroup ? groupExpanded : undefined}
                  >
                    <span
                      className={`team-icon ${item.isTeacherWorkspace ? "teacher-demo" : index === 1 ? "orange" : index === 2 ? "purple" : "blue"} ${user.role === "teacher" && !item.isTeacherWorkspace && !item.isGroup ? "photo-editable" : ""}`}
                      onClick={(event) => {
                        if (
                          user.role === "teacher" &&
                          !item.isTeacherWorkspace &&
                          !item.isGroup &&
                          item.members[0]
                        ) {
                          event.stopPropagation();
                          chooseStudentPhoto(item.members[0].id);
                        }
                      }}
                      title={
                        user.role === "teacher" &&
                        !item.isTeacherWorkspace &&
                        !item.isGroup
                          ? "Click to add or replace student picture"
                          : undefined
                      }
                    >
                      {!item.isTeacherWorkspace && item.members[0]?.photoUrl ? (
                        <img
                          src={item.members[0].photoUrl}
                          alt={`${item.members[0].name}'s profile`}
                        />
                      ) : item.isTeacherWorkspace ? (
                        "J"
                      ) : (
                        item.name.split(" ")[1]?.[0] || "T"
                      )}
                    </span>
                    <span className="team-copy">
                      <b>{item.name}</b>
                      <small>
                        {item.isTeacherWorkspace ? (
                          <>
                            <i className="online-dot" />
                            Your lesson code
                          </>
                        ) : item.isGroup ? (
                          <>
                            {item.members.length} member
                            {item.members.length === 1 ? "" : "s"} ·{" "}
                            {online ? "Active" : "Offline"}
                          </>
                        ) : (
                          <>
                            <i
                              className={
                                user.role === "student"
                                  ? item.completed
                                    ? "online-dot"
                                    : "activity-dot"
                                  : online
                                    ? "online-dot"
                                    : "offline-dot"
                              }
                            />
                            {user.role === "student"
                              ? studentStatus
                              : online
                                ? "Online"
                                : "Offline · saved workspace"}
                          </>
                        )}
                      </small>
                    </span>
                    {teacherGroupView && item.isGroup && (
                      <span className="group-expand-icon">
                        {groupExpanded ? "⌃" : "⌄"}
                      </span>
                    )}
                  </button>
                  {user.role === "teacher" && !item.isTeacherWorkspace && (
                    <span
                      className={`completion-badge ${item.completed ? "done" : ""}`}
                    >
                      {item.completed ? "Done" : "Pending"}
                    </span>
                  )}
                  {user.role === "teacher" &&
                    item.isTeacherWorkspace &&
                    item.project && (
                      <button
                        className={`student-share ${liveShare.projectId === item.project.id ? "sharing" : ""}`}
                        onClick={() =>
                          shareProject(item.project!.id, item.name)
                        }
                      >
                        {liveShare.projectId === item.project.id
                          ? "Stop"
                          : "Present"}
                      </button>
                    )}
                  {groupExpanded && (
                    <div className="group-member-submenu">
                      {item.members.map((member) => (
                        <div key={member.id}>
                          <span className="group-member-identity">
                            {member.photoUrl ? (
                              <img src={member.photoUrl} alt="" />
                            ) : (
                              <i>
                                {member.name
                                  .split(" ")
                                  .map((part) => part[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </i>
                            )}
                            <span
                              className={`member-name ${onlineUserIds.includes(member.id) ? "online" : ""}`}
                            >
                              {member.name}
                            </span>
                          </span>
                          {member.isLeader ? <b>Leader</b> : user.role === "student" && item.leaderId === user.id ? <span className="member-permission-actions"><button type="button" className={member.chatMuted ? "active" : ""} onClick={() => void updateMemberPermissions(member, { chatMuted: !member.chatMuted })}>{member.chatMuted ? "Unmute" : "Mute chat"}</button><button type="button" className={member.editingLocked ? "active" : ""} onClick={() => void updateMemberPermissions(member, { editingLocked: !member.editingLocked })}>{member.editingLocked ? "Allow edit" : "Lock edit"}</button></span> : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="assignment-block">
            <span className="eyebrow">CURRENT ASSIGNMENT</span>
            <h3>{team.project?.title}</h3>
            <p>{team.project?.description}</p>
            <div className="due">
              <span>◷</span>
              <span>
                <small>Repository</small>
                <b>{team.files.length} {isWebProject ? "web" : "Java"} file(s)</b>
              </span>
            </div>
            <button className="brief-button">
              View assignment brief <span>↗</span>
            </button>
          </div>
          <button className="all-teams">
            ⌘ Classroom repository <span>{data.teams.length}</span>
          </button>
        </aside>
        <section className="main-area">
          <div
            className={`workspace-mode ${currentSavedCopy ? "saved-copy" : ""}`}
          >
            <span>
              {user.role === "student"
                ? currentSavedCopy
                  ? "EDITING SAVED COPY"
                  : "MY PRACTICE CODE"
                : team.isTeacherWorkspace
                  ? "TEACHER WORKSPACE"
                  : "LIVE STUDENT VIEW"}
            </span>
            <b>
              {user.role === "student"
                ? currentSavedCopy
                  ? currentSavedCopy.label
                  : "Current practice workspace"
                : team.isTeacherWorkspace
                  ? "Lesson demonstration"
                  : `Following ${team.members[0]?.name || team.name}`}
            </b>
            {user.role === "student" && (
              <small>
                {currentSavedCopy
                  ? "Save work updates this named copy"
                  : "Save work creates a new named copy"}
              </small>
            )}
          </div>
          <div className="team-header">
            <div className="team-heading">
              <span className="team-icon blue">
                {workspaceTitle[0]?.toUpperCase()}
              </span>
              <div>
                <h1>{workspaceTitle}</h1>
                <p>{workspaceSubtitle}</p>
              </div>
            </div>
            {team.isTeacherWorkspace ? (
              <div className="presence">
                <span>
                  <b>Lesson demonstration</b>
                  <small>
                    <i className="online-dot" />
                    Persistent teacher workspace
                  </small>
                </span>
              </div>
            ) : team.isGroup ? (
              <div className="group-roster">
                <b>Group members</b>
                <div>
                  {team.members.map((member) => (
                    <span key={member.id}>
                      {member.name}
                      {member.isLeader && <i>Leader</i>}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="presence">
                <div className="avatars">
                  {team.members.slice(0, 4).map((member, index) => (
                    <span
                      className={`av a${(index % 4) + 1}`}
                      key={member.id}
                      title={member.name}
                    >
                      {member.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  ))}
                </div>
                <span>
                  <b>Personal workspace</b>
                  <small>
                    <i className="online-dot" />
                    {team.members[0]?.name || "Student"}
                  </small>
                </span>
              </div>
            )}
            <div className="team-buttons">
              {user.role === "teacher" &&
                team.isTeacherWorkspace &&
                team.project && (
                  <button
                    className={`secondary present-code ${liveShare.projectId === team.project.id ? "sharing" : ""}`}
                    onClick={() => shareProject(team.project!.id, team.name)}
                  >
                    {liveShare.projectId === team.project.id
                      ? "Stop presenting"
                      : "Present this code"}
                  </button>
                )}
              {user.role === "student" && team.isGroup && (!team.myLeaderVoteId || team.leaderId === user.id) && (
                <button
                  className={`secondary ${team.leaderId ? "" : "needs-setup"}`}
                  onClick={openGroupProfile}
                >
                  {team.myLeaderVoteId ? "Rename group" : "Vote for leader"}
                </button>
              )}
              <button
                className="secondary"
                onClick={
                  team.isTeacherWorkspace
                    ? openSavedWork
                    : user.role === "teacher"
                      ? openSubmissions
                      : openSavedWork
                }
              >
                {team.isTeacherWorkspace
                  ? "Lesson library"
                  : user.role === "teacher"
                    ? "View submissions"
                    : "Open saved work"}
              </button>
            </div>
          </div>
          <div className="content-grid">
            <section className="editor-card">
              <div className="file-tabs">
                {team.files.map((file) => (
                  <button
                    className={`file-tab ${file.id === activeFile?.id ? "active" : ""}`}
                    key={file.id}
                    onClick={() => void chooseFile(file)}
                    onDoubleClick={(event) => {
                      event.preventDefault();
                      if (!myGroupMembership?.editingLocked || team.leaderId === user.id)
                        void renameFile(file);
                    }}
                    title={
                      team.isGroup &&
                      myGroupMembership?.editingLocked &&
                      team.leaderId !== user.id
                        ? "Group leader locked editing"
                        : "Double-click to rename"
                    }
                  >
                    <span className="java-icon">
                      {{ html: "H", css: "C", javascript: "JS" }[file.language] ?? "J"}
                    </span>
                    {file.path}
                    <i
                      className={
                        file.id === activeFile?.id && code !== lastSaved.current
                          ? "unsaved"
                          : ""
                      }
                    />
                  </button>
                ))}
                <button
                  className="add-file"
                  onClick={openCreateFile}
                  aria-label={isWebProject ? "Create web file" : "Create Java file"}
                  title={
                    team.isGroup &&
                    myGroupMembership?.editingLocked &&
                    team.leaderId !== user.id
                      ? "Group leader locked editing"
                      : isWebProject
                        ? "Create web file"
                        : "Create Java file"
                  }
                  disabled={
                    team.isGroup &&
                    myGroupMembership?.editingLocked &&
                    team.leaderId !== user.id
                  }
                >
                  ＋
                </button>
                <span className="editing-now">
                  <i className="online-dot" />
                  {team.isGroup &&
                  myGroupMembership?.editingLocked &&
                  team.leaderId !== user.id
                    ? " Leader locked member editing"
                    : team.isTeacherWorkspace &&
                        liveShare.projectId === team.project?.id
                      ? " Broadcasting live to students"
                      : user.role === "student"
                        ? " Manual save enabled"
                        : team.isTeacherWorkspace
                          ? " Repository autosave enabled"
                          : " Live student view"}
                </span>
              </div>
              <CodeEditor
                value={code}
                onChange={updateCode}
                onCursorChange={updateCursor}
                remoteCursors={remoteCursors}
                language={activeFile?.language || "java"}
                readOnly={
                  (user.role === "teacher" && !team.isTeacherWorkspace) ||
                  (team.isGroup &&
                    myGroupMembership?.editingLocked &&
                    team.leaderId !== user.id)
                }
              />
              <div className="editor-status">
                <button
                  className="rename-file"
                  onClick={() => activeFile && void renameFile(activeFile)}
                  title="Rename current file"
                  disabled={
                    team.isGroup &&
                    myGroupMembership?.editingLocked &&
                    team.leaderId !== user.id
                  }
                >
                  {activeFile?.path}
                </button>
                <span>{languageLabel(activeFile?.language || "java")}</span>
                <span>Version {activeFile?.version || 1}</span>
                <span className="saved">
                  {code !== lastSaved.current ? "●" : "✓"} {syncStatus}
                </span>
              </div>
            </section>
            <aside className="right-panel">
              <div className="panel-tabs">
                <button
                  className={panel === "console" ? "active" : ""}
                  onClick={() => setPanel("console")}
                >
                  Console
                </button>
                <button
                  className={panel === "chat" ? "active" : ""}
                  onClick={() => setPanel("chat")}
                >
                  {!data.currentActivity
                    ? "Classroom chat"
                    : data.currentActivity.mode === "individual"
                      ? "Private chat"
                      : "Group chat"}
                </button>
                <button
                  className={
                    panel === "saved" || panel === "submissions" ? "active" : ""
                  }
                  onClick={
                    team.isTeacherWorkspace
                      ? openSavedWork
                      : user.role === "teacher"
                        ? openSubmissions
                        : openSavedWork
                  }
                >
                  ↗
                </button>
              </div>
              {panel === "console" && isWebProject ? (
                <div className="web-preview">
                  {preview?.html ? (
                    <iframe
                      key={previewRun}
                      ref={previewFrameRef}
                      title="Web page preview"
                      sandbox="allow-scripts"
                      srcDoc={preview.html}
                    />
                  ) : (
                    <p className="web-preview-empty">
                      <span>
                        Press <b>Run</b> to see your page here.
                      </span>
                    </p>
                  )}
                  <ol className="preview-console" aria-label="Page console">
                    {previewLogs.length ? (
                      previewLogs.map((log, index) => (
                        <li className={`log-${log.kind}`} key={index}>
                          <span>{log.text}</span>
                          {log.where && <small>{log.where}</small>}
                        </li>
                      ))
                    ) : (
                      <li className="log-empty">
                        console.log output and errors appear here
                      </li>
                    )}
                  </ol>
                </div>
              ) : panel === "console" ? (
                <div
                  className="console"
                  onClick={() => consoleInputRef.current?.focus()}
                >
                  <pre>{output}</pre>
                  <label className="console-prompt">
                    <span>&gt;</span>
                    <textarea
                      ref={consoleInputRef}
                      value={consoleInput}
                      onChange={(event) => setConsoleInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.ctrlKey && event.key === "Enter") {
                          event.preventDefault();
                          void runCode();
                        }
                      }}
                      placeholder="Type program input here…"
                      aria-label="Program input"
                      maxLength={10000}
                      disabled={running}
                    />
                  </label>
                  <small>Ctrl+Enter runs with this input</small>
                </div>
              ) : panel === "chat" ? (
                <div className="chat">
                  <div className="chat-toolbar">
                    <b>
                      {activityChatUnavailable
                        ? data.currentActivity?.mode === "individual"
                          ? "Select a student to start a private chat"
                          : "Select a group to open its chat"
                        : !data.currentActivity
                          ? "Everyone in the classroom"
                          : data.currentActivity.mode === "individual"
                            ? `Teacher and ${team.members[0]?.name || "student"}`
                            : team.name}
                    </b>
                    {!data.currentActivity && user.role === "teacher" && (
                      <button type="button" onClick={toggleClassroomChatMute}>
                        {data.classroomChatMuted
                          ? "Unmute students"
                          : "Mute students"}
                      </button>
                    )}
                    {!data.currentActivity &&
                      user.role === "student" &&
                      data.classroomChatMuted && (
                        <span>Teacher muted chat</span>
                      )}
                  </div>
                  <div className="chat-messages">
                    {messages.length ? (
                      messages.map((message) => (
                        <div className="chat-message" key={message.id}>
                          {message.author.photoUrl ? (
                            <img src={message.author.photoUrl} alt="" />
                          ) : (
                            <i>
                              {message.author.name
                                .split(" ")
                                .map((part) => part[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </i>
                          )}
                          <div>
                            <b>{message.author.name}</b>
                            <p>{message.text}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="chat-empty">
                        No messages yet. Say hello to your group.
                      </p>
                    )}
                  </div>
                  <form onSubmit={sendMessage}>
                    <input
                      value={chatText}
                      onChange={(event) => setChatText(event.target.value)}
                      placeholder={
                        !data.currentActivity
                          ? "Message the classroom…"
                          : data.currentActivity.mode === "individual"
                            ? "Message your teacher…"
                            : "Message your group…"
                      }
                      maxLength={1000}
                      aria-label="Chat message"
                      disabled={
                        activityChatUnavailable ||
                        (team.isGroup && Boolean(myGroupMembership?.chatMuted) && team.leaderId !== user.id) ||
                        (!data.currentActivity &&
                          user.role === "student" &&
                          data.classroomChatMuted)
                      }
                    />
                  </form>
                </div>
              ) : panel === "saved" ? (
                <div className="record-list">
                  {savedWorks.length ? (
                    savedWorks.map((item) => (
                      <button key={item.id} onClick={() => restoreWork(item)}>
                        <b>{item.label}</b>
                        <small>
                          {new Date(item.createdAt).toLocaleString()} ·{" "}
                          {team.isTeacherWorkspace
                            ? "Open this lesson"
                            : "Click to reopen"}
                        </small>
                      </button>
                    ))
                  ) : (
                    <p>
                      {team.isTeacherWorkspace
                        ? "No archived lessons yet. Save this lesson or start a new one."
                        : "No saved copies yet. Click Save work below."}
                    </p>
                  )}
                </div>
              ) : (
                <div className="record-list">
                  {submissions.length ? (
                    submissions.map((item) => (
                      <article key={item.id}>
                        <b>{item.student?.name || "Student submission"}</b>
                        <small>
                          {new Date(item.submittedAt).toLocaleString()} ·{" "}
                          {item.status}
                        </small>
                        <pre>{item.files[0]?.content || "No code"}</pre>
                      </article>
                    ))
                  ) : (
                    <p>No student submissions yet.</p>
                  )}
                </div>
              )}
              <div className="checks">
                <span className="eyebrow">
                  {team.isTeacherWorkspace
                    ? "LESSON WORKSPACE"
                    : "GROUP STATUS"}
                </span>
                <div>
                  <span>✓</span>
                  <p>
                    <b>
                      {team.isTeacherWorkspace
                        ? "Lesson code autosaved"
                        : "Shared source autosaved"}
                    </b>
                    <small>
                      {team.isTeacherWorkspace
                        ? "Archive named copies anytime"
                        : "Visible to every teammate"}
                    </small>
                  </p>
                </div>
                <div>
                  <span>✓</span>
                  <p>
                    <b>
                      {team.isTeacherWorkspace
                        ? "Live presentation ready"
                        : "Group chat enabled"}
                    </b>
                    <small>
                      {team.isTeacherWorkspace
                        ? "Students receive each keystroke"
                        : `${team.members.length} participants`}
                    </small>
                  </p>
                </div>
                <div>
                  <span>✓</span>
                  <p>
                    <b>{isWebProject ? "Runs in your browser" : "Java execution enabled"}</b>
                    <small>{isWebProject ? "Sandboxed preview" : "Teacher computer"}</small>
                  </p>
                </div>
              </div>
            </aside>
          </div>
          <footer className="actionbar">
            <div>
              <span className="sync">
                <i className="online-dot" />
                {syncStatus}
              </span>
              <button
                className="link-button"
                onClick={
                  team.isTeacherWorkspace
                    ? openSavedWork
                    : user.role === "teacher"
                      ? openSubmissions
                      : openSavedWork
                }
              >
                {team.isTeacherWorkspace
                  ? "Lesson library"
                  : user.role === "teacher"
                    ? "View submissions"
                    : "Reopen saved work"}
              </button>
            </div>
            <div>
              <button className="run-button" onClick={runCode}>
                ▶ Run code <kbd>Ctrl ↵</kbd>
              </button>
              {team.isTeacherWorkspace && (
                <button className="run-button" onClick={saveWork}>
                  Save lesson
                </button>
              )}
              {team.isTeacherWorkspace && (
                <button className="submit-button" onClick={startNewLesson}>
                  New lesson
                </button>
              )}
              {user.role === "student" && (
                <button className="run-button" onClick={saveWork}>
                  Save work
                </button>
              )}
              {user.role === "student" && team.project?.activityId && (
                <button
                  className={`submit-button ${submitted ? "done" : ""}`}
                  onClick={submitWork}
                  disabled={
                    submitted || (team.isGroup && team.leaderId !== user.id)
                  }
                  title={
                    team.isGroup && team.leaderId !== user.id
                      ? team.leaderId
                        ? "Only the selected group leader can submit"
                        : "Select a group leader first"
                      : undefined
                  }
                >
                  {submitted
                    ? "✓ Submitted"
                    : team.isGroup
                      ? team.leaderId === user.id
                        ? "Submit group code"
                        : "Leader submits group code"
                      : "Submit to teacher"}
                </button>
              )}
            </div>
          </footer>
        </section>
      </section>
      {newFileOpen && (
        <div
          className="activity-overlay file-dialog-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !creatingFile)
              setNewFileOpen(false);
          }}
        >
          <form
            className="file-dialog"
            onSubmit={createFile}
            onKeyDown={(event) => {
              if (event.key === "Escape" && !creatingFile)
                setNewFileOpen(false);
            }}
          >
            <header>
              <span className="java-icon">{isWebProject ? "W" : "J"}</span>
              <div>
                <span className="eyebrow">
                  {isWebProject ? "WEB PAGE FILE" : "JAVA SOURCE FILE"}
                </span>
                <h2>Create a new file</h2>
                <p>
                  {isWebProject
                    ? "Add another page, stylesheet, or script."
                    : "Add another class to this repository."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewFileOpen(false)}
                aria-label="Close"
                disabled={creatingFile}
              >
                ×
              </button>
            </header>
            <label>
              File path
              <input
                value={newFilePath}
                onChange={(event) => setNewFilePath(event.target.value)}
                placeholder={isWebProject ? "about.html" : "src/Helper.java"}
                pattern={
                  isWebProject
                    ? "(?:[A-Za-z0-9_\\-]+/)*[A-Za-z0-9_\\-]+(?:\\.[A-Za-z0-9_\\-]+)*\\.(?:html|css|js)"
                    : "(?:[A-Za-z_$][A-Za-z0-9_$]*/)*[A-Za-z_$][A-Za-z0-9_$]*\\.java"
                }
                title={
                  isWebProject
                    ? "Use a name ending in .html, .css, or .js"
                    : "Use a Java path such as src/Helper.java"
                }
                autoFocus
                required
                spellCheck={false}
              />
            </label>
            <small>
              {isWebProject ? (
                <>
                  Use a unique name ending in .html, .css, or .js, for example{" "}
                  <b>about.html</b>.
                </>
              ) : (
                <>
                  Use a unique Java filename, for example{" "}
                  <b>src/Calculator.java</b>.
                </>
              )}
            </small>
            <footer>
              <button
                type="button"
                onClick={() => setNewFileOpen(false)}
                disabled={creatingFile}
              >
                Cancel
              </button>
              <button
                className="create-file-button"
                type="submit"
                disabled={creatingFile || !newFilePath.trim()}
              >
                {creatingFile ? "Creating…" : "Create file"}
              </button>
            </footer>
          </form>
        </div>
      )}
      {newWebProjectOpen && (
        <div
          className="activity-overlay file-dialog-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !creatingWebProject)
              setNewWebProjectOpen(false);
          }}
        >
          <form
            className="file-dialog"
            onSubmit={createWebProject}
            onKeyDown={(event) => {
              if (event.key === "Escape" && !creatingWebProject)
                setNewWebProjectOpen(false);
            }}
          >
            <header>
              <span className="java-icon">W</span>
              <div>
                <span className="eyebrow">HTML · CSS · JAVASCRIPT</span>
                <h2>New web project</h2>
                <p>Starts with index.html, style.css, and script.js.</p>
              </div>
              <button
                type="button"
                onClick={() => setNewWebProjectOpen(false)}
                aria-label="Close"
                disabled={creatingWebProject}
              >
                ×
              </button>
            </header>
            <label>
              Project name
              <input
                value={newWebProjectTitle}
                onChange={(event) => setNewWebProjectTitle(event.target.value)}
                placeholder="My Web Page"
                maxLength={60}
                autoFocus
                required
              />
            </label>
            <small>Press Run to see your page. It runs only in your browser.</small>
            <footer>
              <button
                type="button"
                onClick={() => setNewWebProjectOpen(false)}
                disabled={creatingWebProject}
              >
                Cancel
              </button>
              <button
                className="create-file-button"
                type="submit"
                disabled={creatingWebProject || !newWebProjectTitle.trim()}
              >
                {creatingWebProject ? "Creating…" : "Create project"}
              </button>
            </footer>
          </form>
        </div>
      )}
      {endActivityOpen && data.currentActivity && (
        <div className="activity-overlay">
          <form
            className="activity-modal end-activity-modal"
            onSubmit={endCurrentActivity}
          >
            <header>
              <div>
                <span className="eyebrow">END ACTIVITY</span>
                <h2>End {data.currentActivity.title}?</h2>
                <p>
                  Students will leave this activity and return to their normal
                  workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEndActivityOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </header>
            <div className="end-activity-note">
              <b>Student code and submissions will be preserved.</b>
              <span>
                You can review them later in Activity summary, then start a new
                activity.
              </span>
            </div>
            <footer>
              <button type="button" onClick={() => setEndActivityOpen(false)}>
                Keep activity open
              </button>
              <button
                className="danger-button"
                type="submit"
                disabled={endingActivity}
              >
                {endingActivity ? "Ending…" : "End activity"}
              </button>
            </footer>
          </form>
        </div>
      )}
      {autoGroupOpen && (
        <div className="activity-overlay">
          <form
            className="activity-modal auto-group-modal"
            onSubmit={autoGroup}
          >
            <header>
              <div>
                <span className="eyebrow">GROUP ACTIVITY</span>
                <h2>Create groups and activity</h2>
                <p>
                  The initially active roster stays reserved during brief
                  disconnections.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAutoGroupOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </header>
            <label>
              Activity name
              <input
                value={activityTitle}
                onChange={(event) => setActivityTitle(event.target.value)}
                placeholder="Example: Group Calculator"
                minLength={2}
                maxLength={100}
                autoFocus
                required
              />
            </label>
            <label>
              Maximum students per group
              <input
                type="number"
                min="2"
                max="10"
                value={autoGroupSize}
                onChange={(event) =>
                  setAutoGroupSize(
                    Math.min(10, Math.max(2, Number(event.target.value) || 2)),
                  )
                }
                required
              />
            </label>
            <div className="group-preview">
              <span>
                Included students
                <b>{groupRoster.length - excludedGroupStudentIds.length}</b>
              </span>
              <span>
                Groups to create
                <b>
                  {groupRoster.length - excludedGroupStudentIds.length
                    ? Math.ceil(
                        (groupRoster.length - excludedGroupStudentIds.length) /
                          autoGroupSize,
                      )
                    : 0}
                </b>
              </span>
              <p>
                Students who disconnect after opening this card remain included
                until you mark them absent.
              </p>
            </div>
            <div className="group-roster-check">
              <b>INITIAL ACTIVE ROSTER</b>
              {groupRoster.map((student) => {
                const online = onlineUserIds.includes(student.id);
                const excluded = excludedGroupStudentIds.includes(student.id);
                return (
                  <label key={student.id}>
                    <input
                      type="checkbox"
                      checked={!excluded}
                      onChange={() =>
                        setExcludedGroupStudentIds((ids) =>
                          ids.includes(student.id)
                            ? ids.filter((id) => id !== student.id)
                            : [...ids, student.id],
                        )
                      }
                    />
                    {student.photoUrl ? (
                      <img
                        className="group-roster-avatar"
                        src={student.photoUrl}
                        alt=""
                      />
                    ) : (
                      <i className="group-roster-avatar initials">
                        {student.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </i>
                    )}
                    <span>
                      <strong>{student.name}</strong>
                      <small className={online ? "online" : "reconnecting"}>
                        {online
                          ? "Online"
                          : "Disconnected — reconnecting or absent?"}
                      </small>
                    </span>
                  </label>
                );
              })}
              {!groupRoster.length && (
                <p>
                  No active students were detected. Close this card and wait for
                  students to connect.
                </p>
              )}
            </div>
            <label>
              Instructions (optional)
              <textarea
                value={activityDescription}
                onChange={(event) => setActivityDescription(event.target.value)}
                placeholder="What should each group build?"
                maxLength={1000}
              />
            </label>
            <label>
              Prepared starter code (optional)
              <textarea
                className="starter-code"
                value={activityStarter}
                onChange={(event) => setActivityStarter(event.target.value)}
                placeholder="Paste Java starter code here, or leave blank for a blank editor."
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </label>
            <button
              className="use-editor"
              type="button"
              onClick={() => setActivityStarter(code)}
            >
              Use code currently in editor
            </button>
            <footer>
              <button type="button" onClick={() => setAutoGroupOpen(false)}>
                Cancel
              </button>
              <button
                className="deploy-button"
                type="submit"
                disabled={
                  autoGrouping ||
                  groupRoster.length === excludedGroupStudentIds.length ||
                  activityTitle.trim().length < 2
                }
              >
                {autoGrouping
                  ? "Creating group activity…"
                  : "Create groups & deploy"}
              </button>
            </footer>
          </form>
        </div>
      )}
      {groupProfileOpen && (
        <div className="activity-overlay">
          <form
            className="activity-modal group-profile-modal"
            onSubmit={saveGroupProfile}
          >
            <header>
              <div>
                <span className="eyebrow">{team.myLeaderVoteId ? "LEADER GROUP SETTINGS" : "LEADER VOTING"}</span>
                <h2>{team.myLeaderVoteId ? "Rename your group" : "Vote for group leader"}</h2>
                <p>{team.myLeaderVoteId ? "Only the elected leader can change the group name." : "Every member gets one final vote. Tied candidates are chosen randomly."}</p>
              </div>
              <button
                type="button"
                onClick={() => setGroupProfileOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </header>
            {team.myLeaderVoteId && <label>
              Group name
              <input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="Example: Java Explorers"
                maxLength={60}
                autoFocus
                required
              />
            </label>}
            {!team.myLeaderVoteId && <label>
              Vote for group leader
              <select
                value={groupLeaderId}
                onChange={(event) => setGroupLeaderId(event.target.value)}
                required
              >
                <option value="">Select a member</option>
                {team.members.map((member) => (
                  <option value={member.id} key={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>}
            {!team.myLeaderVoteId && <div className="end-activity-note">
              <b>One vote per member</b>
              <span>
                Your vote is final and cannot be changed after submission.
              </span>
            </div>}
            <footer>
              <button type="button" onClick={() => setGroupProfileOpen(false)}>
                Cancel
              </button>
              <button
                className="deploy-button"
                type="submit"
                disabled={savingGroup}
              >
                {savingGroup
                  ? "Saving…"
                  : team.myLeaderVoteId
                    ? "Save group name"
                    : "Submit final vote"}
              </button>
            </footer>
          </form>
        </div>
      )}
      {activityOpen && (
        <div className="activity-overlay">
          <form className="activity-modal" onSubmit={deployActivity}>
            <header>
              <div>
                <span className="eyebrow">DEPLOY TO CLASS</span>
                <h2>Create today&apos;s activity</h2>
                <p>
                  Students receive the activity immediately after deployment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivityOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </header>
            <label>
              Activity name
              <input
                value={activityTitle}
                onChange={(event) => setActivityTitle(event.target.value)}
                placeholder="Example: If-Else Activity"
                maxLength={100}
                autoFocus
                required
              />
            </label>
            <label>
              Activity type
              <select
                value={activityMode}
                onChange={(event) =>
                  setActivityMode(event.target.value as "individual" | "group")
                }
              >
                <option value="individual">Individual activity</option>
                <option value="group">Group activity</option>
              </select>
            </label>
            <label>
              Instructions (optional)
              <textarea
                value={activityDescription}
                onChange={(event) => setActivityDescription(event.target.value)}
                placeholder="What should students build?"
                maxLength={1000}
              />
            </label>
            <label>
              Prepared starter code (optional)
              <textarea
                className="starter-code"
                value={activityStarter}
                onChange={(event) => setActivityStarter(event.target.value)}
                placeholder="Paste Java starter code here, or leave blank for the default Main class."
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
              />
            </label>
            <button
              className="use-editor"
              type="button"
              onClick={() => setActivityStarter(code)}
            >
              Use code currently in editor
            </button>
            <footer>
              <button type="button" onClick={() => setActivityOpen(false)}>
                Cancel
              </button>
              <button
                className="deploy-button"
                type="submit"
                disabled={deployingActivity}
              >
                {deployingActivity ? "Deploying…" : "Deploy activity"}
              </button>
            </footer>
          </form>
        </div>
      )}
      {liveShare.active && user.role === "student" && (
        <div
          className="live-share-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Live teacher code"
        >
          <section className="live-share-card">
            <header>
              <div className="live-presenter">
                {liveShare.presenterPhotoUrl ? (
                  <img
                    src={liveShare.presenterPhotoUrl}
                    alt={`${liveShare.presenterName || "Teacher"}'s profile`}
                  />
                ) : (
                  <i>
                    {(liveShare.presenterName || "Teacher")
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </i>
                )}
                <div>
                  <span className="live-badge">
                    <i /> LIVE TEACHER CODE
                  </span>
                  <h2>{liveShare.presenterName || "Teacher"}&apos;s code</h2>
                  <p>
                    {liveShare.title} · Updates automatically · Read-only · Your
                    teacher controls when this presentation ends
                  </p>
                </div>
              </div>
            </header>
            <div className="live-code-title">
              <span>{liveShare.files?.[0]?.path || "Main.java"}</span>
              <small>LIVE</small>
            </div>
            <pre>
              {liveShare.files?.[0]?.content ||
                "Waiting for the teacher to type…"}
            </pre>
          </section>
        </div>
      )}
      {modulesOpen && classroomId && (
        <ModuleViewer
          role={user.role}
          classroomId={classroomId}
          onClose={() => {
            setModulesOpen(false);
          }}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function AuthScreen({
  onAuthenticated,
}: {
  onAuthenticated: (user: User) => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "forgot") {
        const result = await api<{ message: string }>(
          "/api/auth/forgot-password",
          { method: "POST", body: JSON.stringify({ email }) },
        );
        setMessage(result.message);
      } else {
        const result = await api<{ user: User }>(
          `/api/auth/${mode === "signin" ? "login" : "register"}`,
          { method: "POST", body: JSON.stringify({ name, email, password }) },
        );
        onAuthenticated(result.user);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to continue");
    } finally {
      setBusy(false);
    }
  }
  const switchMode = (next: "signin" | "signup" | "forgot") => {
    setMode(next);
    setMessage("");
    setPassword("");
  };
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">C</span>
          <div>
            <b>CodeShare</b>
            <small>Collaborative coding classroom</small>
          </div>
        </div>
        <h1>
          {mode === "signin"
            ? "Welcome back"
            : mode === "signup"
              ? "Create your account"
              : "Forgot your password?"}
        </h1>
        <p>
          {mode === "signin"
            ? "Sign in to open your team repository."
            : mode === "signup"
              ? "The first registered account becomes the teacher; later accounts are students."
              : "Enter your school email and your teacher will receive a password reset request."}
        </p>
        <form onSubmit={submit}>
          {mode === "signup" && (
            <label>
              Full name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
          )}
          <label>
            School email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoFocus={mode === "forgot"}
            />
          </label>
          {mode !== "forgot" && (
            <label>
              Password
              <input
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required={mode === "signup"}
                placeholder={
                  mode === "signin" ? "Leave blank after an approved reset" : ""
                }
              />
            </label>
          )}
          {message && (
            <div
              className={`auth-message ${mode === "forgot" ? "success" : ""}`}
            >
              {message}
            </div>
          )}
          <button className="auth-submit" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset request"}
          </button>
        </form>
        {mode === "signin" && (
          <button
            className="forgot-password-link"
            onClick={() => switchMode("forgot")}
          >
            Forgot password?
          </button>
        )}
        <button
          className="auth-switch"
          onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin"
            ? "New to CodeShare? Create an account"
            : mode === "signup"
              ? "Already have an account? Sign in"
              : "Back to sign in"}
        </button>
      </div>
    </div>
  );
}

function ResetPasswordScreen({
  user,
  onChanged,
}: {
  user: User;
  onChanged: (user: User) => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword)
      return setMessage("Passwords do not match");
    setBusy(true);
    setMessage("");
    try {
      const result = await api<{ user: User }>(
        "/api/auth/change-reset-password",
        { method: "POST", body: JSON.stringify({ password }) },
      );
      onChanged(result.user);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not update password",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">C</span>
          <div>
            <b>CodeShare</b>
            <small>Signed in as {user.name}</small>
          </div>
        </div>
        <div className="reset-notice">
          <b>Your password was reset</b>
          <span>
            Your teacher reset your account. Choose a new private password
            before continuing.
          </span>
        </div>
        <h1>Create a new password</h1>
        <p>
          Use at least 8 characters. Enter it twice to make sure it is correct.
        </p>
        <form onSubmit={submit}>
          <label>
            New password
            <input
              type="password"
              minLength={8}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
              autoFocus
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              minLength={8}
              maxLength={128}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          {message && <div className="auth-message">{message}</div>}
          <button className="auth-submit" disabled={busy}>
            {busy ? "Saving…" : "Set new password"}
          </button>
        </form>
      </div>
    </div>
  );
}

function JoinClass({
  user,
  onJoined,
  onLogout,
}: {
  user: User;
  onJoined: () => void;
  onLogout: () => void;
}) {
  const [joinCode, setJoinCode] = useState("");
  const [message, setMessage] = useState("");
  async function join(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api("/api/classes/join", {
        method: "POST",
        body: JSON.stringify({ joinCode }),
      });
      await onJoined();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to join class",
      );
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">C</span>
          <div>
            <b>CodeShare</b>
            <small>Signed in as {user.name}</small>
          </div>
        </div>
        <h1>Join your class</h1>
        <p>
          Ask your teacher for the class code. The starter classroom code is{" "}
          <b>JAVA101</b>.
        </p>
        <form onSubmit={join}>
          <label>
            Class code
            <input
              value={joinCode}
              onChange={(event) =>
                setJoinCode(event.target.value.toUpperCase())
              }
              required
            />
          </label>
          {message && <div className="auth-message">{message}</div>}
          <button className="auth-submit">Join classroom</button>
        </form>
        <button className="auth-switch" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </div>
  );
}

function CenteredCard({ title, message }: { title: string; message?: string }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <span className="brand-mark">C</span>
        <h1>{title}</h1>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}
