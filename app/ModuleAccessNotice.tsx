import type { ModuleAccessBlock } from "../backend/src/module-prerequisites";

export default function ModuleAccessNotice({ block, onContinue }: {
  block: ModuleAccessBlock; onContinue: (moduleId: string) => void;
}) {
  return <div className="module-access-notice" role="alert">
    <strong>{block.message}</strong>
    {block.kind === "prerequisite" && block.moduleId && <button type="button" onClick={() => onContinue(block.moduleId!)}>Continue Week {block.week}</button>}
  </div>;
}
