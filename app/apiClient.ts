// Shared browser-side fetch helper, used by both the main workspace (page.tsx) and the module
// viewer, so there is one place that knows how CodeShare's API calls carry the session cookie.
const DEPLOYED_API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function getApiUrl() {
  return DEPLOYED_API_URL;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(body?.error || "Request failed");
  return body as T;
}
