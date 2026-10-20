"use client";

import { useEffect, useState } from "react";
import { watchSessionActivity } from "./sessionActivity";
import { api } from "./apiClient";

export default function SessionActivity() {
  const [warning, setWarning] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  useEffect(() => {
    const signedIn = (event: Event) => { if ((event as CustomEvent).detail) setSignedOut(false); };
    window.addEventListener("codeshare:session", signedIn);
    queueMicrotask(() => setSignedOut(new URLSearchParams(window.location.search).has("signedOut")));
    const stop = watchSessionActivity(setWarning, (accountChanged) => {
      // Reload clears the previous user's editor, live channels and teacher-page data.
      document.body.style.visibility = "hidden";
      if (accountChanged) { window.location.replace("/"); return; }
      void api("/api/auth/logout", { method: "POST", signal: AbortSignal.timeout(3000) })
        .catch(() => {}).finally(() => window.location.replace("/?signedOut=1"));
    });
    return () => { stop(); window.removeEventListener("codeshare:session", signedIn); };
  }, []);
  if (!warning && !signedOut) return null;
  return <div className="session-notice" role="alert">
    {warning ? "You will be signed out in one minute. Save work now, or keep using CodeShare to stay signed in." : "You have been signed out. Sign in again to continue. Saved work is safe; unsaved edits may have been lost."}
  </div>;
}
