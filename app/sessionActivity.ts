import { api } from "./apiClient";

type Session = { id: string; expiresAt: number; absoluteExpiresAt: number };
const storageKey = "javashare-session-activity";
const interactions = ["pointerdown", "pointermove", "keydown", "input", "wheel", "touchstart"];
const renewalInterval = 60000;

export function watchSessionActivity(warn: (visible: boolean) => void, expire: (accountChanged: boolean) => void) {
  let session: Session | null = null;
  let stopped = false;
  let lastInput = 0;
  let lastRenewal = 0;
  let renewing = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let renewalTimer: ReturnType<typeof setTimeout> | undefined;
  const abort = new AbortController();

  const store = (value: Session | null) => {
    try {
      if (value) localStorage.setItem(storageKey, JSON.stringify(value));
      else localStorage.removeItem(storageKey);
    } catch { /* Private browsing can disable storage; this tab still expires. */ }
  };
  const finish = (accountChanged = false) => {
    if (stopped) return;
    stopped = true;
    abort.abort(); clearTimeout(timer); clearTimeout(renewalTimer);
    if (!accountChanged) store(null);
    warn(false); expire(accountChanged);
  };
  const check = () => {
    clearTimeout(timer);
    if (!session || stopped) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved?.id === session.id && Number.isFinite(saved.expiresAt) && saved.expiresAt > session.expiresAt) session = { ...session, expiresAt: saved.expiresAt };
    } catch { /* A resumed timer still works without shared storage. */ }
    const remaining = session.expiresAt - Date.now();
    if (remaining <= 0) { finish(); return; }
    warn(remaining <= 60000);
    timer = setTimeout(check, remaining > 60000 ? remaining - 60000 : remaining);
  };
  const accept = (value: Session | null, broadcast = true) => {
    if (stopped) return;
    if (!value) { if (session) finish(); return; }
    if (typeof value.id !== "string" || !Number.isFinite(value.expiresAt) || !Number.isFinite(value.absoluteExpiresAt)) return;
    if (session && session.id !== value.id) { finish(true); return; }
    if (session && value.expiresAt < session.expiresAt) return;
    session = value;
    if (broadcast) store(value);
    check();
  };
  const renew = async () => {
    clearTimeout(renewalTimer); renewalTimer = undefined;
    if (!session || stopped || renewing || !lastInput) return;
    check();
    if (stopped) return;
    const id = session.id, sentInput = lastInput;
    const elapsedMs = Math.max(0, Date.now() - sentInput);
    if (elapsedMs > renewalInterval) return;
    renewing = true; lastRenewal = Date.now();
    try {
      const result = await api<{ session: Session }>("/api/auth/activity", { method: "POST", signal: abort.signal, body: JSON.stringify({ elapsedMs }) });
      if (!stopped && session?.id === id) accept(result.session);
    } catch { /* Failed renewal cannot extend the signed server deadline. */ }
    finally {
      renewing = false;
      if (!stopped && lastInput > sentInput) renewalTimer = setTimeout(() => void renew(), renewalInterval);
    }
  };
  const interact = (event: Event) => {
    if (!event.isTrusted || document.visibilityState !== "visible" || !session || stopped) return;
    check();
    if (stopped) return;
    lastInput = Date.now();
    if (renewing || renewalTimer) return;
    const delay = Math.max(0, renewalInterval - (Date.now() - lastRenewal));
    if (!delay) void renew();
    else renewalTimer = setTimeout(() => void renew(), delay);
  };
  const changed = (event: Event) => accept((event as CustomEvent<Session | null>).detail);
  const expired = () => { if (session || window.location.pathname !== "/") finish(); };
  const storage = (event: StorageEvent) => {
    if (event.key !== storageKey) return;
    try { accept(event.newValue ? JSON.parse(event.newValue) : null, false); }
    catch { /* Ignore unrelated malformed browser storage. */ }
  };
  const wake = () => {
    if (document.visibilityState !== "visible" || stopped) return;
    // A suspended tab may have missed another tab's renewal before its timer resumes.
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) accept(JSON.parse(saved), false);
    } catch { /* The server check below also works without storage. */ }
    check();
    if (!stopped) void api("/api/auth/me", { signal: abort.signal }).catch(() => {});
  };
  window.addEventListener("codeshare:session", changed);
  window.addEventListener("codeshare:session-expired", expired);
  window.addEventListener("storage", storage);
  window.addEventListener("focus", wake);
  window.addEventListener("pageshow", wake);
  document.addEventListener("visibilitychange", wake);
  for (const name of interactions) window.addEventListener(name, interact, { passive: true, capture: true });
  void api("/api/auth/me", { signal: abort.signal }).catch(() => {});
  return () => {
    stopped = true; abort.abort(); clearTimeout(timer); clearTimeout(renewalTimer);
    window.removeEventListener("codeshare:session", changed);
    window.removeEventListener("codeshare:session-expired", expired);
    window.removeEventListener("storage", storage);
    window.removeEventListener("focus", wake);
    window.removeEventListener("pageshow", wake);
    document.removeEventListener("visibilitychange", wake);
    for (const name of interactions) window.removeEventListener(name, interact, { capture: true });
  };
}
