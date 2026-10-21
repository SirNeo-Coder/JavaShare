# Set up shared Java and Net MVC modules

This change needs the new migration before the updated app starts. No hosted change has been
performed by the assistant. Keep a normal database backup before applying database changes.

## Hosted CodeShare

1. In your Supabase project’s SQL Editor, open a new query.
2. Copy the complete contents of
   `supabase/migrations/20261022000100_subject_module_library.sql` into the query and run it.
   This adds the library and optional class subject without changing existing uploads or work.
3. After reviewing and merging the feature pull request, let your normal app rollout finish.
4. Open an existing class → **Curriculum** → choose **Java** or **Net MVC** →
   **Use Java for this class** / **Use Net MVC for this class**. This choice cannot be changed
   through the app. The old subject label and all saved work remain stored.
5. Open **Saved uploads from this class** and share each intended matching upload. If a shared
   version differs, check it before confirming **Replace shared version**. Stable activity ids
   must still change when task requirements change; old completions are retained.
6. For every other existing class, choose its subject. It immediately gets the same subject set;
   there is no need to re-upload the modules. New classes require their subject when created.
7. Correct a module through **Add module** in any same-subject class. Check another class’s
   Curriculum and a student’s module list after Refresh or reopening. Pages already open do
   not receive a new live content-replacement event.
8. Confirm Java never appears in Net MVC, and confirm a student’s work/progress is still separate
   in two classes. Deleting a shared module removes it for all your classes of that subject;
   it does not erase student work or the original uploaded backups.

## Offline classroom laptop

From the project folder, run `npx supabase migration up --local`, then
`npm run classroom:offline`. Follow the same Curriculum steps against the local database.
A hosted upload is not automatically copied to the offline database (or vice versa).
Offline Java continues using the laptop’s `javac`.

## Compatibility and rollback

The new migration leaves existing `course_modules` and `module_progress` rows untouched and can
be repeated. Unknown legacy subjects stay unassigned until the teacher chooses; nothing guesses
which old copy should win. Existing unassigned classes stay readable until that choice.

Older app versions cannot read the new shared library. Rolling back the app preserves old
uploads/student data but hides new shared modules; export the required shared JSON before
rolling back. Do not delete the library or rewrite existing migrations as a rollback shortcut.

Verification and outstanding limits: `docs/verification/subject-module-sharing.md`.
