"use client";

import { useRef, useState } from "react";
import ModuleViewer, { type CourseModule, type StepBlock, type Progress } from "./ModuleViewer";
import { moduleResumeStep } from "./moduleParts";
import { api, ApiError } from "./apiClient";
import ModuleAccessNotice from "./ModuleAccessNotice";
import type { ModuleAccessBlock } from "../backend/src/module-prerequisites";
import WorkspaceDrawer from "./WorkspaceDrawer";
import { isFreshDeviceRecord, moduleRecordKey, readDeviceRecord, writeDeviceRecord } from "./moduleDeviceStore";

export default function ModuleWorkspace({ classroomId, studentId, role, browserOpen, projectsOpen, onBrowserChange, onProjectsChange, onStartActivity, onSelectModule, progressRevision = 0 }: {
  onSelectModule?: (module: CourseModule) => void;
  onStartActivity: (module: CourseModule, step?: StepBlock) => Promise<void>; progressRevision?: number;
  classroomId: string; studentId?: string; role: "teacher" | "student"; browserOpen: boolean; projectsOpen: boolean; onBrowserChange: (open: boolean) => void; onProjectsChange: (open: boolean) => void;
}) {
  const [accessBlock, setAccessBlock] = useState<ModuleAccessBlock | null>(null);
  const [error, setError] = useState("");
  const [selection, setSelection] = useState<{ id: string; visit: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [hoverPreview, setHoverPreview] = useState(false);
  const [projectsHoverPreview, setProjectsHoverPreview] = useState(false);
  const earRef = useRef<HTMLButtonElement>(null);
  const close = (restoreFocus = false) => { setOpen(false); setHoverPreview(false); if (restoreFocus) earRef.current?.focus({ preventScroll: true }); };
  const moduleOpen = browserOpen || (open && !projectsOpen);
  const moduleId = browserOpen || !selection ? "classroom-modules" : "classroom-worksheet";
  const openModule = (hover: boolean) => {
    setHoverPreview(hover); onProjectsChange(false);
    if (moduleId === "classroom-modules") onBrowserChange(true);
    else setOpen(true);
  };
  const closeModule = () => { onBrowserChange(false); close(true); };
  const selectModule = async (id: string) => {
    try {
      setError(""); setAccessBlock(null);
      if (role === "student") {
        const key = studentId ? moduleRecordKey("content", studentId, classroomId, id) : "";
        const cached = key ? await readDeviceRecord<{ value: CourseModule; savedAt: number }>(key).catch(() => null) : null;
        const moduleRequest = cached && isFreshDeviceRecord(cached) ? Promise.resolve(cached.value) : api<CourseModule>(`/api/classrooms/${classroomId}/modules/${id}`).then(async (value) => {
          if (key) await writeDeviceRecord(key, { value, savedAt: Date.now() }).catch(() => undefined);
          return value;
        }).catch((error) => { if (cached && !(error instanceof ApiError)) return cached.value; throw error; });
        const [loadedModule, progress] = await Promise.all([
          moduleRequest,
          api<Progress>(`/api/classrooms/${classroomId}/modules/${id}/progress?includeModuleVersion=1`),
        ]);
        const currentModule = loadedModule.moduleVersion === progress.moduleVersion ? loadedModule : await api<CourseModule>(`/api/classrooms/${classroomId}/modules/${id}`);
        if (key && currentModule !== loadedModule) await writeDeviceRecord(key, { value: currentModule, savedAt: Date.now() }).catch(() => undefined);
        onSelectModule?.(currentModule);
        const steps = currentModule.lessons.flatMap((lesson) => lesson.blocks).filter((block): block is StepBlock => block.type === "step" && !(block as StepBlock).locked && (block as StepBlock).language === "java");
        const step = moduleResumeStep(currentModule, progress.stepStates) ?? steps.at(-1);
        if (step?.language === "java") await onStartActivity(currentModule, step);
      }
      setSelection((current) => ({ id, visit: (current?.visit ?? 0) + 1 })); setOpen(true); setHoverPreview(false); onBrowserChange(false);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.moduleAccess) setAccessBlock(loadError.moduleAccess);
      else setError(loadError instanceof Error ? loadError.message : "Could not open the module project");
    }
  };
  return <>
    <nav className="workspace-rail rail-left" aria-label="Learning panels">
      <button ref={earRef} type="button" aria-label="Module" aria-expanded={moduleOpen} aria-controls={moduleId}
        onPointerEnter={(event) => { if (event.pointerType === "mouse" && !moduleOpen) openModule(true); }}
        onKeyDown={(event) => { if (event.key === "Escape") closeModule(); }}
        onClick={() => { if (moduleOpen && !hoverPreview) closeModule(); else openModule(false); }}><span aria-hidden="true">▤</span> Module <span aria-hidden="true">{moduleOpen ? "‹" : "›"}</span></button>
      <button type="button" aria-expanded={projectsOpen} aria-controls="classroom-projects"
        onPointerEnter={(event) => { if (event.pointerType === "mouse" && !projectsOpen) { close(); onBrowserChange(false); setProjectsHoverPreview(true); onProjectsChange(true); } }}
        onKeyDown={(event) => { if (event.key === "Escape") onProjectsChange(false); }}
        onClick={() => { close(); onBrowserChange(false); onProjectsChange(!projectsOpen || projectsHoverPreview); setProjectsHoverPreview(false); }}><span aria-hidden="true">⌘</span> {role === "teacher" ? "Students / projects" : "Projects"}</button>
    </nav>
    <WorkspaceDrawer id="classroom-modules" title="Course modules" side="left" open={browserOpen} autoFocus={!hoverPreview} onClose={closeModule}>
      <ModuleViewer role={role} classroomId={classroomId} studentId={studentId} embedded drawer active={browserOpen} progressRevision={progressRevision} onOpenModule={selectModule} />
      {accessBlock && <ModuleAccessNotice block={accessBlock} onContinue={(id) => void selectModule(id)} />}
      {error && <p className="module-error" role="alert">{error}</p>}
    </WorkspaceDrawer>
    {selection && <div className="worksheet-drawer-group">
      <WorkspaceDrawer id="classroom-worksheet" title="Module worksheet" side="left" className="worksheet-drawer" open={open && !browserOpen && !projectsOpen} autoFocus={!hoverPreview} onClose={() => close(true)}>
        <ModuleViewer key={selection.visit} role={role} classroomId={classroomId} studentId={studentId} initialModuleId={selection.id} embedded worksheet progressRevision={progressRevision} onStartActivity={async (module, step) => { await onStartActivity(module, step); close(); }} onClose={() => { close(); onBrowserChange(true); }} />
      </WorkspaceDrawer>
    </div>}
  </>;
}
