# Set up online Java for CodeShare

Students keep using **Run code**. Online it compiles every project file together in
Java 8 inside their browser, including packages, supporting classes and Program input.
They need a `Main.java` with `public static void main(String[] args)`. Java 9+ syntax
or libraries are not supported online in this first version. Offline still uses the
laptop's installed JDK. A failed run cannot complete a module sample.

The teacher approved a separate public runner address as a workflow change on
2026-10-20. The repository prepares it; these steps are for the teacher. No assistant
has deployed it or changed any hosted setting.

## 1. Create the public Java runner

In Cloudflare **Workers & Pages**, connect this same GitHub repository to a second
Worker. Use these settings (separate from the existing `codeshare` Worker):

| Setting | Value |
| --- | --- |
| Worker/project name | `codeshare-java` |
| Production branch | `main` (after the teacher merges the reviewed changes) |
| Root directory | leave empty: repository root |
| Build command | leave empty: the Java assets are already committed |
| Deploy command | `npx wrangler deploy --config java-runtime/wrangler.jsonc` |

For a branch preview, use the reviewed branch and
`npx wrangler versions upload --config java-runtime/wrangler.jsonc` as its preview
command; enable preview URLs as in [the Cloudflare guide](cloudflare-setup.md).
Do not promote a preview until the teacher has tested it.

The settings file serves only `java-runtime/public`. **Add no secrets or login
settings to this Worker.** It must have a separate HTTPS origin, such as
`https://codeshare-java.YOUR_ACCOUNT.workers.dev/`. Do not place it at `/java` under
the signed-in CodeShare site or reverse proxy it there. The whole origin is reserved
for public Java execution; it must not host other private applications.

Open its address. It should say “CodeShare Java 8 runner. Open a project in CodeShare
and choose Run code.” Check `/javac.jar`, `/codeshare-runner.jar`,
`/javac-sources.zip` and `/OPENJDK-LICENSE` are available. The compiler needs normal
HTTP range requests; Cloudflare static assets supply these. Do not replace the
provided `_headers`: its policy permits CheerpJ's own runtime frame while keeping
other network destinations blocked.

## 2. Connect CodeShare to that address

In the existing **codeshare** Worker, open **Settings → Runtime variables and
secrets**. Add `JAVA_RUNNER_URL` as a Text variable, for **Production and Previews**,
with the full public runner root address including `https://` and the trailing `/`.
Publish/rebuild the intended preview using the normal Cloudflare workflow.
`LOCAL_JAVA_EXECUTION` must be absent or `false` on hosted CodeShare.
`NEXT_PUBLIC_JAVA_RUNNER_URL` is not needed. No database migration is needed.

For the separate Render deployment, use the same `JAVA_RUNNER_URL` server setting
and `LOCAL_JAVA_EXECUTION=false`. For `classroom:online` on the laptop, add those two
settings to `backend/.env.online`; see its example. Keep offline settings separate:
`classroom:offline` uses `LOCAL_JAVA_EXECUTION=true`, ignores the browser address and
runs `javac` locally. Do not put hosted database keys in the offline profile.

## 3. Test the preview before using it with a class

1. Sign in as a test student. Open a module and choose **Work in code editor**.
2. Confirm every supporting Java class appears in the file tabs. Use its sample code
   and press **Run code**. First load needs internet and may take longer; CheerpJ's
   logo appears beside the console. Exact output completes the step. All samples in
   a part unlock the next part for this student.
3. Introduce a compile error or print the wrong output. It must show failure and
   must not unlock a new part. Previously completed steps stay completed.
4. After the required samples, open **Projects → Personal performance-task project**.
   Edit/run multiple files and Program input. Running must not submit or complete a
   module step. **Submit this version** is still the separate submission action.
5. Test an endless loop: it stops after five seconds of program execution. Loading
   and compilation have a separate 120-second limit; output is capped at 64 KB.
   Run a correct program afterward to check recovery.
6. Run `npm run classroom:offline` and repeat a Java run over classroom Wi-Fi with
   internet disconnected. The laptop must run Java with no CheerpJ request or logo.

Browser output is approved **practice evidence**, not secure grading: developer
tools can falsify it. The server still enforces student/class access, part order,
the weekly live-class restriction, the latest saved version and its own expected
output. Paper assessment and performance-task assessment remain separate.

## If a run fails

“Online Java is not set up yet” means the CodeShare server lacks `JAVA_RUNNER_URL`.
A separate-origin/HTTPS error means that setting is invalid. A startup timeout can
mean no internet, a blocked CheerpJ site, missing compiler files, or replaced runtime
headers. Saves happen before execution, so reopen the saved project before retrying.
The runner is public static files; never solve a startup problem by adding a Supabase
key there or by moving it onto CodeShare's signed-in origin.

Vendor source, checksums and licence notices: [vendor/README.md](../vendor/README.md).
Primary deployment reference: [Cloudflare static assets](https://developers.cloudflare.com/workers/static-assets/).
Runtime reference: [CheerpJ library mode](https://cheerpj.com/docs/guides/library-mode).
