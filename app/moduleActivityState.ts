import type { StudentActivity } from "./StudentModuleActivity";

// During sign-in the student can exist before their class/project has loaded.
export function moduleProjectForClass(activity: StudentActivity | null, classroomId: string | undefined, role: string | undefined) {
  if (!activity || !classroomId || role !== "student") return null;
  return activity.classroomId === classroomId ? activity : null;
}
