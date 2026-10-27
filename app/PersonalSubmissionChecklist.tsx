"use client";

import { useState } from "react";
import { api } from "./apiClient";
import type { StudentActivity } from "./StudentModuleActivity";

export default function PersonalSubmissionChecklist({ activity }: { activity: StudentActivity }) {
  const review = activity.review!;
  const checklist = review.submission.checklist ?? [];
  const [checked, setChecked] = useState(review.submission.review?.checked ?? checklist.map(() => false));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return <section aria-label="Personal submission review">
    <h3>{review.studentName} · {activity.moduleTitle}</h3>
    <p>Submitted · teacher checklist review is separate from student progress.</p>
    {review.submission.legacyChecklist && <p>Older submission: checklist captured from module content when first opened for review.</p>}
    {checklist.map((item, index) => <label key={index} style={{ display: "block", marginBottom: 12 }}><input type="checkbox" checked={checked[index]} disabled={busy} onChange={(event) => { setChecked(checked.map((value, i) => i === index ? event.target.checked : value)); setMessage(""); }} /> {item}</label>)}
    <button type="button" disabled={busy} onClick={async () => {
      setBusy(true); setMessage("");
      try {
        await api(`/api/classes/${activity.classroomId}/students/${review.studentId}/modules/${activity.moduleId}/personal-review`, { method: "PUT", body: JSON.stringify({ submissionId: review.submissionId, checked }) });
        setMessage("Review saved");
      } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save review"); }
      finally { setBusy(false); }
    }}>Save review</button><p role="status">{message}</p>
  </section>;
}
