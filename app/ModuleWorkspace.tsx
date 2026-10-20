"use client";

import { useRef, useState } from "react";
import ModuleViewer, { type CourseModule, type StepBlock, type Progress } from "./ModuleViewer";
import { activityStateId } from "../backend/src/module-activities";
import { api } from "./apiClient";
import WorkspaceDrawer from "./WorkspaceDrawer";

export default function ModuleWorkspace({ classroomId, role, browserOpen, projectsOpen, onBrowserChange, onProjectsChange, onStartActivity, progressRevision = 0 }: {
  onStartActivity: (module: CourseModule, step?: StepBlock) => Promise<void>; progressRevision?: number;
  classroomId: string; role: "teacher" | "student"; browserOpen: boolean; projectsOpen: boolean; onBrowserChange: (open: boolean) => void; onProjectsChange: (open: boolean) => void;
}) {
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
      <ModuleViewer role={role} classroomId={classroomId} embedded drawer active={browserOpen} progressRevision={progressRevision} onOpenModule={async (id) => {
        try {
          setError("");
          if (role === "student") {
            const [module, progress] = await Promise.all([
              api<CourseModule>(`/api/classrooms/${classroomId}/modules/${id}`),
              api<Progress>(`/api/classrooms/${classroomId}/modules/${id}/progress`),
            ]);
            const steps = module.lessons.flatMap((lesson) => lesson.blocks).filter((block): block is StepBlock => block.type === "step" && !(block as StepBlock).locked && (block as StepBlock).language === "java");
            const step = steps.find((item) => progress.stepStates[activityStateId(item)] !== "pass") ?? steps[0];
            if (step) await onStartActivity(module, step);
          }
          setSelection((current) => ({ id, visit: (current?.visit ?? 0) + 1 })); setOpen(true); setHoverPreview(false); onBrowserChange(false);
        } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Could not open the module project"); }
      }} />
      {error && <p className="module-error" role="alert">{error}</p>}
    </WorkspaceDrawer>
    {selection && <div className="worksheet-drawer-group">
      <WorkspaceDrawer id="classroom-worksheet" title="Module worksheet" side="left" className="worksheet-drawer" open={open && !browserOpen && !projectsOpen} autoFocus={!hoverPreview} onClose={() => close(true)}>
        <ModuleViewer key={selection.visit} role={role} classroomId={classroomId} initialModuleId={selection.id} embedded worksheet progressRevision={progressRevision} onStartActivity={async (module, step) => { await onStartActivity(module, step); close(); }} onClose={() => { close(); onBrowserChange(true); }} />
      </WorkspaceDrawer>
    </div>}
  </>;
}
