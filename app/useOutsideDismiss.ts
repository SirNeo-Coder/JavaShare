"use client";

import { useEffect } from "react";

export default function useOutsideDismiss(id: string, open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (document.getElementById(id)?.contains(target) || target.closest(`[aria-controls="${id}"]`)) return;
      onClose();
    };
    // shortcut: web-preview frame clicks stay in that frame; bridge them if its dismissal is needed.
    document.addEventListener("pointerdown", dismiss, true);
    return () => document.removeEventListener("pointerdown", dismiss, true);
  }, [id, open, onClose]);
}
