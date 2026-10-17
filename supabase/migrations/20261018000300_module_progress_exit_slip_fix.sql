-- CKB-007: exit_slip_done was one flag for the whole module, but a module has one lesson per
-- class day and one exit slip per lesson - the flag couldn't tell lessons apart. Exit-slip
-- completion is folded into step_states instead (keyed by the exit slip's own "id" field from
-- docs/course-format.md, e.g. "java-2-w15-d1-slip"), reusing the per-lesson map that already
-- existed for steps rather than adding a second one.
alter table public.module_progress drop column exit_slip_done;
