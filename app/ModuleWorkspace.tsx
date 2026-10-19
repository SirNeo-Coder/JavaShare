"use client";

import { useRef, useState } from "react";
import ModuleViewer from "./ModuleViewer";
import WorkspaceDrawer from "./WorkspaceDrawer";

export default function ModuleWorkspace({ classroomId, role, browserOpen, projectsOpen, onBrowserChange }: {
  classroomId: string; role: "teacher" | "student"; browserOpen: boolean; projectsOpen: boolean; onBrowserChange: (open: boolean) => void;
}) {
  const [selection, setSelection] = useState<{ id: string; visit: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [hoverPreview, setHoverPreview] = useState(false);
  const [pinned, setPinned] = useState(false);
  const earRef = useRef<HTMLButtonElement>(null);
  const close = (restoreFocus = false) => { setOpen(false); setHoverPreview(false); if (restoreFocus) earRef.current?.focus({ preventScroll: true }); };
  return <>
    <WorkspaceDrawer id="classroom-modules" title="Course modules" side="left" open={browserOpen} onClose={() => onBrowserChange(false)}>
      <ModuleViewer role={role} classroomId={classroomId} embedded drawer active={browserOpen} onOpenModule={(id) => { setSelection((current) => ({ id, visit: (current?.visit ?? 0) + 1 })); setOpen(true); setHoverPreview(false); onBrowserChange(false); }} />
    </WorkspaceDrawer>
    {selection && <div className="worksheet-drawer-group" onPointerLeave={(event) => {
      if (hoverPreview && !pinned && !(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) close();
    }}>
      {open && !browserOpen && !projectsOpen && <span className="worksheet-hover-bridge" aria-hidden="true" />}
      <button ref={earRef} type="button" className="worksheet-ear" hidden={browserOpen || projectsOpen} data-open={open} aria-label="Module worksheet" aria-expanded={open} aria-controls="classroom-worksheet"
        onPointerEnter={(event) => { if (event.pointerType === "mouse" && !open) { setHoverPreview(true); setOpen(true); } }}
        onKeyDown={(event) => { if (event.key === "Escape") close(true); }}
        onClick={() => { if (open && !hoverPreview) close(true); else { setHoverPreview(false); setOpen(true); } }}>▤ <span>Module</span> {open ? "‹" : "›"}</button>
      <WorkspaceDrawer id="classroom-worksheet" title="Module worksheet" side="left" className="worksheet-drawer" open={open && !browserOpen && !projectsOpen} autoFocus={!hoverPreview} onPinnedChange={setPinned} onClose={() => close(true)}>
        <ModuleViewer key={selection.visit} role={role} classroomId={classroomId} initialModuleId={selection.id} embedded worksheet onClose={() => { close(); onBrowserChange(true); }} />
      </WorkspaceDrawer>
    </div>}
  </>;
}
