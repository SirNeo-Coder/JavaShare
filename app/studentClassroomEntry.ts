type EntryUser = { id: string; role: "teacher" | "student"; passwordResetRequired: boolean };

export function studentEntryClassroom(user: EntryUser, classrooms: { id: string }[], remembered: string | null, choosingClass: boolean): string | null {
  if (user.role !== "student" || user.passwordResetRequired || choosingClass) return null;
  if (classrooms.length === 1) return classrooms[0].id;
  return classrooms.some((classroom) => classroom.id === remembered) ? remembered : null;
}

const storageKey = (userId: string) => `javashare-last-classroom-${userId}`;

export function rememberedStudentClassroom(userId: string, storage?: Pick<Storage, "getItem">): string | null {
  try { return (storage ?? window.localStorage).getItem(storageKey(userId)); }
  catch { return null; }
}

export function rememberStudentClassroom(userId: string, classroomId: string, storage?: Pick<Storage, "setItem">): void {
  try { (storage ?? window.localStorage).setItem(storageKey(userId), classroomId); }
  catch { /* Class entry still works when browser storage is unavailable. */ }
}
