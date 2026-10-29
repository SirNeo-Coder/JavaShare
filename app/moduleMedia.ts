import { api, getApiUrl } from "./apiClient";
import { readDeviceRecord, writeDeviceRecord } from "./moduleDeviceStore";
import type { PersonalMedia } from "../backend/src/personal-performance";

// A module's media files: one shared copy in Cloudflare R2 (teacher, 2026-10-29). Offline there is no
// media storage, so the list is empty and media steps stay teacher-checked.
export type MediaFile = { path: string; size: number; etag: string };
const mediaBase = (classroomId: string, moduleId: string) => `/api/classrooms/${classroomId}/modules/${moduleId}/media`;

export function listModuleMedia(classroomId: string, moduleId: string) {
  return api<{ files: MediaFile[] }>(mediaBase(classroomId, moduleId)).then((result) => result.files, () => [] as MediaFile[]);
}

const dataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

// path -> data: URL for the preview. With cacheKey, this device keeps the files after the first
// download and fetches only files the teacher changed since.
export async function loadModuleMedia(classroomId: string, moduleId: string, files: MediaFile[], cacheKey?: string) {
  type Cached = Record<string, { etag: string; data: string }>;
  const cached = cacheKey ? await readDeviceRecord<Cached>(cacheKey).catch(() => null) ?? {} : {};
  const next: Cached = {};
  for (const file of files) {
    if (cached[file.path]?.etag === file.etag) { next[file.path] = cached[file.path]; continue; }
    const response = await fetch(`${getApiUrl()}${mediaBase(classroomId, moduleId)}/${file.path}`, { credentials: "include" });
    if (!response.ok) throw new Error(`Could not load ${file.path}`);
    next[file.path] = { etag: file.etag, data: await dataUrl(await response.blob()) };
  }
  if (cacheKey) await writeDeviceRecord(cacheKey, next).catch(() => undefined);
  return Object.fromEntries(Object.entries(next).map(([path, file]) => [path, file.data]));
}

// A student's own media in a web personal project. Each upload is a new copy with its own id, so this tab
// keeps what it downloaded; nothing is kept on the device (students' own pictures, shared computers).
const personalCopies = new Map<string, string>();
export async function loadPersonalMedia(classroomId: string, studentId: string, media: PersonalMedia[]) {
  const loaded: Record<string, string> = {};
  for (const { path, id } of media) {
    if (!personalCopies.has(id)) {
      const response = await fetch(`${getApiUrl()}/api/classrooms/${classroomId}/students/${studentId}/personal-media/${id}`, { credentials: "include" });
      if (!response.ok) throw new Error(`Could not load ${path}`);
      personalCopies.set(id, await dataUrl(await response.blob()));
    }
    loaded[path] = personalCopies.get(id)!;
  }
  return loaded;
}
