import { matchesSample, unchangedSample, webChecksPass, type ModuleFile, type WebCheck, type WebCheckSeen } from "../backend/src/module-activities.ts";

export type ModuleDeviceDraft = {
  files: ModuleFile[]; moduleVersion?: string; stateId?: string;
  sample?: { files: ModuleFile[]; success: boolean; output: string; checks?: WebCheckSeen[] };
  pending?: Record<string, unknown>;
  backups?: { files: ModuleFile[]; moduleVersion?: string; stateId?: string }[];
};

export function restoreModuleDraft(draft: ModuleDeviceDraft | null, current: Pick<ModuleDeviceDraft, "files" | "moduleVersion" | "stateId">,
  step: { files: ModuleFile[]; expectedOutput: string; expectedError?: string; webChecks?: WebCheck[] }, needsSample: boolean): ModuleDeviceDraft {
  if (!draft) return current;
  const sameActivity = Boolean(current.moduleVersion) && draft.moduleVersion === current.moduleVersion && draft.stateId === current.stateId;
  const sample = sameActivity && draft.sample && matchesSample(draft.sample, step) && webChecksPass(step.webChecks, draft.sample.checks) && unchangedSample(draft.sample.files, step.files) ? draft.sample : undefined;
  if (!sameActivity || (needsSample && !sample && !unchangedSample(draft.files, step.files))) {
    return { ...current, backups: [...(draft.backups ?? []), { files: draft.files, moduleVersion: draft.moduleVersion, stateId: draft.stateId }] };
  }
  return { ...draft, sample };
}

const STORE = "codeshare-module-device-v1";
const FRESH_FOR = 5 * 60 * 1000;

let database: Promise<IDBDatabase> | null = null;

function openStore() {
  return database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(STORE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("records");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => { database = null; reject(request.error); };
  });
}

export async function readDeviceRecord<T>(key: string): Promise<T | null> {
  const db = await openStore();
  return new Promise((resolve, reject) => {
    const request = db.transaction("records").objectStore("records").get(key);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function writeDeviceRecord(key: string, value: unknown) {
  const db = await openStore();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("records", "readwrite");
    transaction.objectStore("records").put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onabort = transaction.onerror = () => reject(transaction.error);
  });
}

export function moduleRecordKey(kind: "content" | "activity", userId: string, classroomId: string, moduleId: string, stepId = "") {
  return [kind, userId, classroomId, moduleId, stepId].join(":");
}

export function isFreshDeviceRecord(record: { savedAt: number } | null, now = Date.now()) {
  return Boolean(record && now - record.savedAt < FRESH_FOR);
}
