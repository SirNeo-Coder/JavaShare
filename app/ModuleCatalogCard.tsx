type ModuleCard = { title: string; week: number; course: string; isActive?: boolean; locked?: boolean };

// Saved progress and availability come from the existing module routes.
export default function ModuleCatalogCard({ module, percent, role, onOpen }: {
  module: ModuleCard; percent: number; role: "teacher" | "student"; onOpen: () => void;
}) {
  return (
    <button type="button" disabled={module.locked} onClick={onOpen}>
      <span className="catalog-card-label">
        {module.isActive ? "● THIS WEEK’S MODULE" : `WEEK ${module.week}`}
        <span>{module.course.toUpperCase()}</span>
      </span>
      <strong>{module.title}</strong>
      <span className="catalog-card-description">{module.locked ? "Available after the live class" : "Read the lesson and practise your code."}</span>
      {role === "student" && <>
        <span className="catalog-card-meter"><i style={{ width: `${percent}%` }} /></span>
        <span className="catalog-card-footer">
          <span>{percent}% complete</span>
          <b>{module.locked ? "Locked" : percent === 100 ? "Review lesson →" : "Continue lesson →"}</b>
        </span>
      </>}
    </button>
  );
}
