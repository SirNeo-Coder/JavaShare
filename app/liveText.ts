// Live typing: each change travels as a small edit (an "operation") rather than the whole file,
// so two people typing in the same file at once keep both changes.
export type TextPoint = { line: number; column: number };
export type FileOperation = {
  teamId: string;
  fileId: string;
  start: TextPoint;
  end: TextPoint;
  text: string;
  content: string;
  sequence: number;
};

export function pointAt(source: string, offset: number): TextPoint {
  const before = source.slice(0, offset).split("\n");
  return { line: before.length - 1, column: before.at(-1)?.length ?? 0 };
}

export function createOperation(
  previous: string,
  next: string,
  teamId: string,
  fileId: string,
  sequence: number,
): FileOperation {
  let start = 0;
  while (
    start < previous.length &&
    start < next.length &&
    previous[start] === next[start]
  )
    start += 1;
  let suffix = 0;
  while (
    suffix < previous.length - start &&
    suffix < next.length - start &&
    previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]
  )
    suffix += 1;
  return {
    teamId,
    fileId,
    start: pointAt(previous, start),
    end: pointAt(previous, previous.length - suffix),
    text: next.slice(start, next.length - suffix),
    content: next,
    sequence,
  };
}

export function applyOperation(source: string, operation: FileOperation) {
  const lines = source.split("\n");
  const offsetAt = ({ line, column }: TextPoint) => {
    const safeLine = Math.max(0, Math.min(lines.length - 1, line));
    return (
      lines
        .slice(0, safeLine)
        .reduce((length, item) => length + item.length + 1, 0) +
      Math.min(column, lines[safeLine]?.length ?? 0)
    );
  };
  const start = offsetAt(operation.start);
  const end = Math.max(start, offsetAt(operation.end));
  return source.slice(0, start) + operation.text + source.slice(end);
}

// One open file shared live: the current text, and the text before the first change not yet sent.
export type LiveMirror = { path: string; content: string; base: string | null };

export function localEdit(mirror: LiveMirror, content: string) {
  mirror.base ??= mirror.content;
  mirror.content = content;
}

// Someone else's change also moves our unsent base, so our next edit is described against their text.
export function remoteEdit(mirror: LiveMirror, operation: FileOperation) {
  mirror.content = applyOperation(mirror.content, operation);
  if (mirror.base !== null) mirror.base = applyOperation(mirror.base, operation);
}

export function takeOperation(mirror: LiveMirror, teamId: string, sequence: number) {
  if (mirror.base === null) return null;
  const operation = createOperation(mirror.base, mirror.content, teamId, mirror.path, sequence);
  mirror.base = null;
  return operation;
}

// Unfinished module or personal work travels only on the student's own one-person workspace channel
// (never a group or Teacher Demo channel), and only while the teacher has that student selected.
export function shareModuleLive(role: string | undefined, team: { isGroup: boolean; isTeacherWorkspace?: boolean } | undefined, watching: boolean) {
  return role === "student" && watching && Boolean(team) && !team!.isGroup && !team!.isTeacherWorkspace;
}

export function teacherWatching(presence: Record<string, unknown[]>) {
  return Object.values(presence).flat().some((entry) => (entry as { teacher?: unknown }).teacher === true);
}
