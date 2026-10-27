"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import useOutsideDismiss from "./useOutsideDismiss";

export default function WorkspaceDrawer({ id, title, side, open, onClose, children, className = "", autoFocus = true }: {
  id: string; title: string; side: "left" | "right"; open: boolean; onClose: () => void; children: ReactNode; className?: string; autoFocus?: boolean;
}) {
  const [pinned, setPinned] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useOutsideDismiss(id, open, onClose);

  useEffect(() => {
    if (!open || !autoFocus) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    return () => { if (previousFocus?.isConnected && !previousFocus.closest("[inert]")) previousFocus.focus({ preventScroll: true }); };
  }, [open, autoFocus]);

  return (
    <aside id={id} aria-label={title} data-open={open} aria-hidden={!open} inert={!open}
      className={`workspace-drawer drawer-${side}${pinned ? " drawer-pinned" : ""} ${className}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.stopPropagation(); onClose(); }
      }}>
      <header className="drawer-heading">
        <span className="drawer-symbol" aria-hidden="true">{side === "left" ? "▤" : "☏"}</span>
        <div><b>{title}</b><small>{side === "left" ? "Read, practise, and keep learning" : "Your classroom conversations"}</small></div>
        <button type="button" className="drawer-pin" aria-pressed={pinned} onClick={() => setPinned(!pinned)}>{pinned ? "Unpin" : "Pin"}</button>
        <button ref={closeRef} type="button" onClick={onClose} aria-label={`Close ${title.toLowerCase()}`}>×</button>
      </header>
      <div className="drawer-body">{children}</div>
    </aside>
  );
}
