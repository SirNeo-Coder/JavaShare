# Putting CodeShare on Cloudflare: step by step

This guide is for the teacher. It connects Cloudflare to the CodeShare GitHub repository, so every change on GitHub is built and published automatically, and adds the private settings CodeShare needs. You click through the Cloudflare website; you don't need to type commands.

**Your current site keeps working while you do this.** Vercel and Render keep running the code that's on `main`. Cloudflare first gives you a **preview** address to test. Only when you're happy do you merge the pull requests and start using Cloudflare.

What stays the same:

- **Supabase** still stores everything.
- **Offline mode** (`npm run classroom:offline`) doesn't use Cloudflare at all.
- **Java** can run online after the separate [online Java setup](online-java-setup.md). Without its setting, Java reports that setup is missing. The laptop runner remains for offline use.

---

## Before you start

You need:

1. A **GitHub** account that can see the repository `SirNeo-Coder/JavaShare` (or `CodeShare`, if you renamed it).
2. A free **Cloudflare** account: sign up at https://dash.cloudflare.com/sign-up.
3. Your **Supabase** project open in another tab: https://supabase.com/dashboard.
4. **The two new database migrations applied to the hosted Supabase project.** Apply them the way you normally do:
   - `20261016000100_project_language.sql` (web projects)
   - `20261016000200_realtime_private_channels.sql` (live features)

Never paste a secret key into a chat, an email, or a GitHub file. Only into the Cloudflare boxes below.

---

## Part 1: Connect Cloudflare to GitHub

1. Sign in at https://dash.cloudflare.com.
2. In the left menu, open **Workers & Pages** (under "Compute").
3. Click **Create**, choose the **Workers** tab, then **Import a repository**.
4. Click **Connect GitHub** (or choose your GitHub account if it's already listed). GitHub asks which repositories Cloudflare may see: choose **Only select repositories**, pick the CodeShare repository, and click **Install & Authorize**.
5. Back in Cloudflare, select the CodeShare repository and fill in:

   | Box | Type exactly |
   | --- | --- |
   | Project name | `codeshare` (it must match the name in `wrangler.jsonc`, or the build fails) |
   | Production branch | `main` |
   | Build command | `npx opennextjs-cloudflare build` |
   | Deploy command | `npx opennextjs-cloudflare deploy` |
   | Root directory | leave empty (the top of the repository) |

6. Set **Preview command** to `npx opennextjs-cloudflare upload` and leave **Enable Preview builds** on. This makes a **preview** for other branches, without touching the main site. (Older Cloudflare screens call this "Builds for non-production branches", with its own deploy command.)
   - Leave **Protect with Cloudflare Access** off.
   - Under **Advanced settings**, leave **Path** as `/`, the API token as **Create new token**, and the **Variable name / value** boxes **empty**. Those boxes are for building only; the secrets go in Part 2.
7. Click **Create and deploy** (or **Deploy**). The first build takes a few minutes. If `main` doesn't have the Cloudflare changes yet, it fails with "could not determine executable to run". That's expected.
8. Open **Settings**, then **Domains & Routes**. Under **Worker URL**, switch on **Preview** (`*-codeshare.<your-account>.workers.dev`). Without it, preview addresses give "error code: 1042".

---

## Part 2: Add CodeShare's private settings

1. In **Workers & Pages**, click **codeshare**, then **Settings**.
2. Find **Runtime variables and secrets** (near the top) and click **Add variable**. **Not** the "Variables and secrets" inside the **Build** section: the running app can't see those.
3. In the form, tick **both** environments: **Production** and **Previews**. Previews have their own list, so the preview can't sign anyone in without them.
4. For each row below, type the **Key** exactly, paste the **Value**, and tick **Secret**. Use **+ Add** for the next row. Then click **Add variables and deploy**. Add them all as **Secret**, even the ones that aren't really secret; secrets are kept safely between deploys.

| Variable name | Where to find the value |
| --- | --- |
| `SUPABASE_URL` | Supabase: **Project Settings**, then **Data API** (or **API**): the Project URL, like `https://abcd.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase: **Project Settings**, then **API Keys**: the **anon public** key (or the **publishable** key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase: **Project Settings**, then **API Keys**: the **service_role** key (or the **secret** key). Keep this one private. |
| `SUPABASE_JWT_SECRET` | Supabase: **Project Settings**, then **JWT Keys**: the **Legacy JWT secret**. Keep this one private. If you can't find a legacy secret, stop and ask; your project may need a different setup. |
| `JWT_SECRET` | Make up a long random password (40 or more letters and numbers) and don't reuse it anywhere. It signs CodeShare's own sign-in cookie. |

**Do not add `NEXT_PUBLIC_API_URL` on Cloudflare.** Without it, the pages use their own server routes, which is what you want here. (Vercel still has it, pointing at Render.)

`DATABASE_MODE` is already set to `supabase-online` in `wrangler.jsonc`, so you don't need to add it.

5. Rebuild the preview so it picks up the secrets: in **Deployments**, on the row for the branch, click **⋯**, then **Retry build**. (Not **Promote version**; that makes it the main site.)
6. Check it: open `https://cloudflare-c2-codeshare.<your-account>.workers.dev/api/health`. It should say `"connected":true`.

---

## Part 3: Test the preview before merging

The Cloudflare changes are on the branch `cloudflare-c2` (pull request c2). Because you turned on builds for non-production branches, Cloudflare builds that branch too.

1. Open the preview: `https://cloudflare-c2-codeshare.<your-account>.workers.dev`. The end of each build's log also lists it as "Version Preview Alias URL". If nothing is built for that branch yet, push any small change to it.
2. On the preview:
   1. **Sign in.** Use a real account from your hosted Supabase.
   2. **Live features.** The status at the bottom says **Live classroom connected**. If it says "Live features are not configured", `SUPABASE_JWT_SECRET` is missing.
   3. **Classes and files.** Open a class, open a file, edit it, and press **Save work**. Reload the page: the change is still there.
   4. **Web project.** Make one with **New web project** and press **Run code**. The page and its console appear.
   5. **Live typing.** Sign in as a student on a second device and check that typing, chat and live share reach the other device.
   6. **Java.** **Run code** on a Java project shows the demo-mode message. That's expected online.
3. If something fails, note what you saw. In **codeshare**, the **Logs** tab (**Observability**) shows server errors.

---

## Part 4: Switching over (only after Part 3 works)

1. Merge the pull requests in order on GitHub. Cloudflare then builds `main` and publishes it at `https://codeshare.<your-account>.workers.dev`. You can add your own domain later under **Settings**, then **Domains & Routes**.
2. Tell students the new address.
3. Keep Vercel and Render running until you're sure. They keep working: Vercel's pages still call Render's server, which runs the same shared routes. Turning them off is a later step, and you decide when.

---

## Module media files: the R2 bucket (do this BEFORE merging Slice 3b)

Slice 3b keeps each module's pictures, sound and video in Cloudflare R2, one shared copy per module
(teacher, 2026-10-29). `wrangler.jsonc` names the bucket, so **Cloudflare's build fails until the
bucket exists**. Assistants never create it.

**Check the cost first.** Cloudflare's R2 guide says turning R2 on means completing a **checkout that
adds an R2 subscription** to the account. Use within the free amounts (below) costs nothing; use beyond
them is billed monthly, and the checkout may ask for a payment card. CodeShare must stay free: if
Cloudflare asks for anything you are not willing to give, **stop and do not merge Slice 3b**; media
steps then stay **Mark done** as before.

1. In the Cloudflare dashboard, open **Storage & databases → R2 → Overview** (from Cloudflare's guide;
   the labels may differ slightly).
2. If R2 is not turned on yet, Cloudflare shows its checkout. Read it (see "Check the cost first").
3. Choose **Create bucket**. Name it exactly `codeshare-module-media`. Keep the default location and
   the **Standard** storage class (the free amounts apply only to Standard). Do not make it public.
4. Merge the Slice 3b pull request. Cloudflare connects the bucket to CodeShare by itself (the
   `r2_buckets` entry in `wrangler.jsonc`); there is no secret to add.
5. Check it on the hosted site: Curriculum → Week 3 → **View module details** → **Media files** →
   **Add media files** (choose `snacks.svg`, `counter.svg`, `chime.wav`, `canteen.webm` from
   `Week_03/project_end`). The four files are listed. **Run** on Week 3 Steps 2–7 shows ticks for the
   page text, page checks and each picture, sound and video.
6. In **codeshare → Logs**, look for `exceededCpu` or errors on `.../media/...` and
   `progress/complete` (CKB-065 steps).

## Free plan limits (as of October 2026)

- **R2 (module media):** 10 GB of storage, 1 million uploads/changes and 10 million downloads a month,
  and no charge for data sent (Cloudflare's R2 pricing page, 2026-10-29). Each file a student
  downloads is also one CodeShare request; each device keeps a module's files after the first download.

- **Cloudflare Workers Free:** 100,000 requests a day, and the packed app must be under 3 MB compressed. CodeShare's is about 1.2 MB.
- **Pictures, styles and scripts** are served as static files and don't count towards the request limit.
- **Live features run through Supabase Realtime,** not Cloudflare: 200 connections at once, 100 messages a second, and 2 million messages a month on Supabase's free plan.

## Undoing

Nothing here changes Supabase, Vercel, or Render. To stop using Cloudflare, delete the **codeshare** Worker in **Workers & Pages** (open it, then **Settings**, then **Delete**). In GitHub, under **Settings**, then **Applications**, you can also remove the Cloudflare app.

## Module saves fail with exceededCpu

CKB-065 (2026-10-22): the teacher supplied a failed module-project save with
status 503, `outcome: exceededCpu`, `cpuTimeMs: 10` and `wallTimeMs: 404`.
That request exhausted its CPU allowance. CPU is time executing code, separate
from total request time, which includes waiting on Supabase.

[Cloudflare's limits](https://developers.cloudflare.com/workers/platform/limits/#cpu-time)
list 10 ms per request on Workers Free. This matches the invocation, although the
account plan/effective setting has not been inspected. A working public health
page does not establish that a heavier signed-in save stays within this limit.

The teacher requires CodeShare to stay free. **No paid-plan change is approved.**

1. Keep unsaved work in the editor; copy it locally before refreshing after a
   failed save. A failed response does not establish whether a database write
   happened, so reload saved progress carefully before trying again.
2. Keep one cleaned example per failed route: status, outcome, CPU and total time.
   Omit cookies, keys, account/trace ids, network identifiers and student information.
3. Profile the existing app locally with representative Week 12–21 module content.
   Compare cold/warm requests and identify actual CPU work before proposing changes.
   [Cloudflare's profiling guide](https://developers.cloudflare.com/workers/observability/dev-tools/cpu-usage/)
   explains local CPU profiling. Laptop/Node timing alone does not prove hosted CPU usage.
4. Propose the smallest measured reduction, preserving class/student scope,
   prerequisites, saved versions, draft backups and offline behavior. A local
   cpu_ms setting cannot raise the Workers Free cap. Do not remove validation or
   access checks just to make a request faster. Code changes need the normal plan approval.
5. After the teacher reviews/merges an approved repair and the normal build runs,
   check **Modules → Week 13 → Save work**, **Run code**, progress and reload on
   the affected browser. Inspect the resulting Worker invocations for success and
   CPU use. Check the other failed routes too; one save log does not prove their causes.

The shared API error-message repair (CKB-064) prevents HTML parsing messages but
does not reduce the server's CPU work. No hosted plan, limits, deployment, secrets
or database changes have been made by the assistant.

Local profiling is now complete. [Measured findings and the approval proposal](verification/free-worker-cpu-investigation.md)
recommend small server-only module metadata reads and reusing the selected module
within each request. This needs one new migration and server changes; neither is
implemented or approved yet. Local profiles do not guarantee hosted requests fit 10 ms.
