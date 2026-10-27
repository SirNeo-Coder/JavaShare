// Shared browser-side fetch helper, used by both the main workspace (page.tsx) and the module
// viewer, so there is one place that knows how CodeShare's API calls carry the session cookie.
const DEPLOYED_API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function getApiUrl() {
  return DEPLOYED_API_URL;
}

// A stalled connection (classroom Wi-Fi) must not hang this call forever: callers like the
// module editor's Run/Save stay locked (readOnly) until the request settles, so an unresolved
// fetch leaves the editor stuck non-editable with no error shown.
const REQUEST_TIMEOUT_MS = 20000;

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  options.signal?.addEventListener("abort", () => controller.abort(), { once: true });
  let response: Response;
  try {
    response = await fetch(`${getApiUrl()}${path}`, {
      ...options,
      signal: controller.signal,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch (error) {
    if (controller.signal.aborted && !options.signal?.aborted) throw new Error("Request timed out. Check your connection and try again.");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  const body = response.status === 204 ? null : await response.json();
  if (typeof window !== "undefined") {
    if (response.ok && body?.session && path !== "/api/auth/activity") window.dispatchEvent(new CustomEvent("codeshare:session", { detail: body.session }));
    if (response.ok && path === "/api/auth/logout") window.dispatchEvent(new CustomEvent("codeshare:session", { detail: null }));
    if (response.status === 401 && !["/api/auth/login", "/api/auth/register"].includes(path)) window.dispatchEvent(new CustomEvent("codeshare:session-expired"));
  }
  if (!response.ok) throw new Error(body?.error || "Request failed");
  return body as T;
}
