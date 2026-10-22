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
