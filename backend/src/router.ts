// A tiny Express-style router on standard web Request/Response objects, so the same route
// handlers run inside Next.js (offline laptop and Cloudflare) and behind the old Express
// server on Render (backend/src/server.ts). Supports only what CodeShare's routes use.
import { Buffer } from "node:buffer";
import { MEDIA_LIMIT } from "./file-paths.ts";

export type ApiRequest = {
  method: string;
  url: URL;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Headers;
  cookies: Record<string, string>;
  body: unknown;
};
type CookieOptions = { httpOnly?: boolean; secure?: boolean; sameSite?: "lax" | "none"; maxAge?: number; path?: string };
export type ApiResponse = {
  status(code: number): ApiResponse;
  json(body: unknown): void;
  // A file's bytes (module media), sent as they come from storage.
  send(body: BodyInit, contentType: string): void;
  end(): void;
  cookie(name: string, value: string, options: CookieOptions): void;
  clearCookie(name: string, options: { path?: string }): void;
};
export type NextFn = (error?: unknown) => void;
export type Handler<R extends ApiRequest = ApiRequest> = (req: R, res: ApiResponse, next: NextFn) => unknown;
export type ErrorHandler = (error: unknown, res: ApiResponse) => void;

const JSON_LIMIT = 300 * 1024;
const IMAGE_LIMIT = 2 * 1024 * 1024;
// A weekly course module upload (docs/course-format.md) can have several lessons of embedded
// Java step files that add up past the default cap - only that one route gets the larger limit.
const MODULE_UPLOAD_JSON_LIMIT = 2 * 1024 * 1024;
const MODULE_UPLOAD_PATTERN = /^\/api\/classrooms\/[^/]+\/modules$/;
// Module media uploads: pictures, sound and video up to MEDIA_LIMIT (teacher, 2026-10-29).
const MEDIA_UPLOAD_PATTERN = /^\/api\/classes\/[^/]+\/modules\/[^/]+\/media\//;

export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

function serializeCookie(name: string, value: string, options: CookieOptions) {
  return [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path ?? "/"}`,
    options.maxAge !== undefined ? `Max-Age=${Math.floor(options.maxAge / 1000)}` : "",
    options.httpOnly ? "HttpOnly" : "",
    options.secure ? "Secure" : "",
    options.sameSite ? `SameSite=${options.sameSite === "none" ? "None" : "Lax"}` : "",
  ].filter(Boolean).join("; ");
}

function parseCookies(header: string | null) {
  const cookies: Record<string, string> = {};
  for (const part of (header || "").split(";")) {
    const index = part.indexOf("=");
    if (index > 0) cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return cookies;
}

async function readBody(request: Request, jsonLimit: number, media: boolean) {
  if (request.method === "GET" || request.method === "HEAD") return undefined;
  const type = (request.headers.get("content-type") || "").split(";")[0].trim();
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length) return undefined;
  if (media && /^(?:image|audio|video)\//.test(type)) {
    if (bytes.length > MEDIA_LIMIT) throw new HttpError(413, "Media files must be 5 MB or smaller");
    return Buffer.from(bytes);
  }
  if (type.startsWith("image/")) {
    if (bytes.length > IMAGE_LIMIT) throw new HttpError(413, "Images must be 2 MB or smaller");
    return Buffer.from(bytes);
  }
  if (bytes.length > jsonLimit) throw new HttpError(413, "Request is too large");
  if (type !== "application/json") return undefined;
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch { throw new HttpError(400, "Invalid JSON"); }
}

export function createRouter<R extends ApiRequest = ApiRequest>(onError: ErrorHandler) {
  const routes: { method: string; pattern: RegExp; keys: string[]; handlers: Handler<R>[] }[] = [];
  const add = (method: string) => (path: string, ...handlers: Handler<R>[]) => {
    const keys: string[] = [];
    const pattern = new RegExp(`^${path.replace(/:(\w+)/g, (_, key: string) => { keys.push(key); return "([^/]+)"; })}$`);
    routes.push({ method, pattern, keys, handlers });
  };

  async function handle(request: Request): Promise<Response> {
    let status = 200;
    let body: BodyInit | null = null;
    const headers = new Headers();
    let sent = false;
    const res: ApiResponse = {
      status(code) { status = code; return res; },
      json(value) { headers.set("Content-Type", "application/json"); body = JSON.stringify(value); sent = true; },
      send(value, contentType) { headers.set("Content-Type", contentType); body = value; sent = true; },
      end() { sent = true; },
      cookie(name, value, options) { headers.append("Set-Cookie", serializeCookie(name, value, options)); },
      clearCookie(name, options) { headers.append("Set-Cookie", serializeCookie(name, "", { path: options.path, maxAge: 0 })); },
    };
    const url = new URL(request.url);
    try {
      const route = routes.find((item) => item.method === request.method && item.pattern.test(url.pathname));
      if (!route) return Response.json({ error: "Not found" }, { status: 404 });
      const match = url.pathname.match(route.pattern)!;
      const req: ApiRequest = {
        method: request.method,
        url,
        params: Object.fromEntries(route.keys.map((key, index) => [key, decodeURIComponent(match[index + 1])])),
        query: Object.fromEntries(url.searchParams),
        headers: request.headers,
        cookies: parseCookies(request.headers.get("cookie")),
        body: await readBody(request, request.method === "POST" && MODULE_UPLOAD_PATTERN.test(url.pathname) ? MODULE_UPLOAD_JSON_LIMIT : JSON_LIMIT,
          request.method === "PUT" && MEDIA_UPLOAD_PATTERN.test(url.pathname)),
      };
      // Express semantics: a handler either responds, or calls next() to pass on, or next(error).
      for (const handler of route.handlers) {
        let advanced = false;
        let failure: unknown;
        await handler(req as R, res, (error) => { advanced = true; failure = error; });
        if (failure !== undefined) throw failure;
        if (!advanced || sent) break;
      }
    } catch (error) {
      if (error instanceof HttpError) { status = error.status; res.json({ error: error.message }); }
      else onError(error, res);
    }
    if (!sent) { status = 500; body = JSON.stringify({ error: "No response" }); }
    return new Response(status === 204 ? null : body, { status, headers });
  }

  return { get: add("GET"), post: add("POST"), put: add("PUT"), patch: add("PATCH"), delete: add("DELETE"), handle };
}
