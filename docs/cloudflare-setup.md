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

## Free plan limits (as of October 2026)

- **Cloudflare Workers Free:** 100,000 requests a day, and the packed app must be under 3 MB compressed. CodeShare's is about 1.2 MB.
- **Pictures, styles and scripts** are served as static files and don't count towards the request limit.
- **Live features run through Supabase Realtime,** not Cloudflare: 200 connections at once, 100 messages a second, and 2 million messages a month on Supabase's free plan.

## Undoing

Nothing here changes Supabase, Vercel, or Render. To stop using Cloudflare, delete the **codeshare** Worker in **Workers & Pages** (open it, then **Settings**, then **Delete**). In GitHub, under **Settings**, then **Applications**, you can also remove the Cloudflare app.
