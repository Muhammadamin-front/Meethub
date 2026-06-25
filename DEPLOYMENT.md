# MeetHub — Production Deployment Guide

Step-by-step deploy to **Vercel** with your custom domain. This is tailored to
this repo: Next.js 16, Prisma 7 + Postgres, Clerk, Pusher, Cloudinary, Resend,
and a daily Vercel cron. Region is pinned to **`fra1`** (Frankfurt — closest to
Uzbekistan) and the build already runs `prisma migrate deploy` for you
(`vercel.json`).

> Replace `meethub.uz` below with **your real domain** everywhere.

---

## Overview — what you'll set up

| Service | Purpose | Free tier? |
|---|---|---|
| **GitHub** | Source repo Vercel deploys from | ✅ |
| **Vercel** | Hosting + cron + custom domain | ✅ |
| **Neon** | Production PostgreSQL (pooled + direct) | ✅ |
| **Clerk** | Auth (production instance) | ✅ |
| **Pusher** | Realtime chat | ✅ |
| **Cloudinary** | Image/video uploads | ✅ |
| **Resend** | Transactional email | ✅ |

Order matters: provision the services first (to collect keys), then deploy, then
attach the domain, then flip URLs to the domain.

---

## Step 0 — Pre-flight (already done in this repo ✅)

- `vercel.json` → build runs `prisma migrate deploy && next build`, region `fra1`,
  daily cron `/api/cron/auto-block` at 03:00.
- `robots.ts` + `sitemap.ts` added for SEO.
- PWA (`manifest.ts`, `sw.js`) — installs once you're on HTTPS.
- All secrets read from env; nothing hardcoded. `.env` is git-ignored.

Verify locally one last time:
```bash
npm run typecheck && npm run build
```

---

## Step 1 — Push the code to GitHub

```bash
git add -A
git commit -m "Production prep: robots, sitemap"
# create an empty repo on github.com first, then:
git remote add origin https://github.com/<you>/meethub.git   # skip if it exists
git push -u origin main
```

---

## Step 2 — Production database (Neon)

1. Create a project at **neon.tech** → pick region **EU (Frankfurt)**.
2. From the dashboard copy **two** connection strings:
   - **Pooled** (host contains `-pooler`) → this is `DATABASE_URL`.
   - **Direct** (no `-pooler`) → this is `DIRECT_URL` (used by migrations).
3. Keep `?sslmode=require` on both. Example:
   ```
   DATABASE_URL = postgresql://USER:PASS@ep-xxx-pooler.eu-central-1.aws.neon.tech/meethub?sslmode=require
   DIRECT_URL   = postgresql://USER:PASS@ep-xxx.eu-central-1.aws.neon.tech/meethub?sslmode=require
   ```

> The `pg` SSL warning you saw during build is harmless. To silence it you can
> use `?sslmode=require&channel_binding=require`.

You do **not** run migrations manually — Vercel's build command applies them on
every deploy via `prisma migrate deploy`.

---

## Step 3 — Clerk (production instance)

Test keys (`pk_test_…`) won't work on a real domain. Create a **production**
instance:

1. Clerk Dashboard → create/switch to **Production**.
2. Set the application domain to **`meethub.uz`**. Clerk gives you DNS records
   (CNAMEs like `clerk`, `accounts`, `clkmail…`) — add them at your domain
   registrar. Clerk verifies them (can take minutes–hours).
3. Enable sign-in methods (per `.env.example`): Google / GitHub / Apple **ON**,
   Phone/SMS **OFF**.
4. Copy the production keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `pk_live_…`
   - `CLERK_SECRET_KEY` = `sk_live_…`
5. **Webhook** (syncs Clerk users → your DB): Dashboard → Webhooks → add endpoint
   `https://meethub.uz/api/webhooks/clerk`, subscribe to
   `user.created`, `user.updated`, `user.deleted`. Copy the **Signing Secret**
   (`whsec_…`) → `CLERK_WEBHOOK_SIGNING_SECRET`.

Keep these Clerk URL vars as-is:
```
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/"
```

---

## Step 4 — Pusher, Cloudinary, Resend

**Pusher** (pusher.com → Channels app, cluster **`eu`**):
```
PUSHER_APP_ID, PUSHER_SECRET, NEXT_PUBLIC_PUSHER_KEY,  NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

**Cloudinary** (cloudinary.com):
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
```
Then Settings → Upload → add an **unsigned** upload preset and set its name in
`NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` (e.g. `meetup_uploads`).

**Resend** (resend.com): verify your domain (add the DKIM/SPF records they give
you), then:
```
RESEND_API_KEY=re_…
EMAIL_FROM="MeetHub <noreply@meethub.uz>"   # must be on the verified domain
```

**Cron secret** — generate a long random string:
```bash
openssl rand -hex 32      # → CRON_SECRET
```

---

## Step 5 — Deploy to Vercel

1. **vercel.com** → New Project → import your GitHub repo. Framework auto-detects
   as **Next.js**. Leave build settings default (`vercel.json` controls them).
2. Add **Environment Variables** (Production scope) — paste everything collected
   above. Full list:

   ```
   NEXT_PUBLIC_APP_URL            ← set to http://localhost:3000 FOR NOW (fixed in Step 7)
   DATABASE_URL                   (Neon pooled)
   DIRECT_URL                     (Neon direct)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   CLERK_SECRET_KEY
   CLERK_WEBHOOK_SIGNING_SECRET
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
   PUSHER_APP_ID
   PUSHER_SECRET
   NEXT_PUBLIC_PUSHER_KEY
   NEXT_PUBLIC_PUSHER_CLUSTER=eu
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
   CLOUDINARY_API_KEY
   CLOUDINARY_API_SECRET
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=meetup_uploads
   RESEND_API_KEY
   EMAIL_FROM=MeetHub <noreply@meethub.uz>
   CRON_SECRET
   SEED_ADMIN_EMAIL=you@yourmail.com
   ```
3. Click **Deploy**. The build runs migrations against Neon, then builds. First
   deploy lands on a `*.vercel.app` URL — open it to confirm it boots.

---

## Step 6 — Connect your custom domain

1. Vercel → Project → **Settings → Domains** → add `meethub.uz` (and `www.meethub.uz`).
2. Vercel shows the DNS records to create at your **registrar**:
   - Apex `meethub.uz` → **A** record → `76.76.21.21`
   - `www` → **CNAME** → `cname.vercel-dns.com`
   (Use whatever Vercel displays — it's authoritative.)
3. Wait for DNS to propagate; Vercel auto-issues the SSL certificate. Status
   turns **Valid / Active**.

> If you also added Clerk/Resend DNS records (Steps 3–4) at the same registrar,
> they coexist fine — they're different subdomains/record types.

---

## Step 7 — Flip URLs to the real domain (important)

1. Vercel env vars → set **`NEXT_PUBLIC_APP_URL=https://meethub.uz`** → **Redeploy**
   (this fixes sitemap/robots/OG/email links, which bake in the URL).
2. Confirm the Clerk **webhook** endpoint and Clerk **domain** point at
   `meethub.uz` (Step 3).
3. Pusher → app settings → if you restrict origins, allow `https://meethub.uz`.

---

## Step 8 — Seed the admin user

The seed **promotes an existing user** to ADMIN — so:

1. Open `https://meethub.uz`, **sign up** with your admin email (the one in
   `SEED_ADMIN_EMAIL`). This creates the User row (via the Clerk webhook).
2. Run the seed locally against the **production** DB:
   ```bash
   # .env locally must hold the PROD DIRECT_URL + SEED_ADMIN_EMAIL
   DIRECT_URL="<neon direct url>" SEED_ADMIN_EMAIL="you@yourmail.com" npm run db:seed
   ```
   You should see `✓ Promoted you@yourmail.com to ADMIN.`

---

## Step 9 — Post-deploy verification checklist

- [ ] `https://meethub.uz` loads over HTTPS; locale redirect `/` → `/uz` works.
- [ ] Sign up / sign in works (Google etc.); a User row appears (webhook OK).
- [ ] `/uz/events/new` → create an event (organizer flow).
- [ ] Realtime chat sends/receives (Pusher OK).
- [ ] Image upload on an event works (Cloudinary OK).
- [ ] `https://meethub.uz/robots.txt` and `/sitemap.xml` return content.
- [ ] `https://meethub.uz/manifest.webmanifest` loads → "Add to Home Screen" works.
- [ ] Admin panel `/uz/admin` is reachable by the seeded admin only.
- [ ] Cron: Vercel → Project → Cron Jobs shows `/api/cron/auto-block` scheduled;
      trigger "Run" once and confirm `200`.
- [ ] A test email (e.g. event notification) arrives (Resend domain verified).

---

## Step 10 — Operational notes

- **Migrations:** edit `schema.prisma` → `npm run db:migrate` locally (creates a
  migration) → commit → push. Vercel applies it on deploy. Never run
  `db:push` against production.
- **Rollbacks:** Vercel → Deployments → promote a previous build. (DB migrations
  don't auto-roll-back — write reversible migrations.)
- **Secrets rotation:** rotate in the provider → update Vercel env → redeploy.
- **Monitoring:** enable Vercel Analytics + Logs; watch Neon's connection count
  (the app uses the **pooled** URL, so you're fine).
- **Backups:** Neon keeps point-in-time history; enable/extend retention.
- **Mobile later:** once live, set `CAP_SERVER_URL=https://meethub.uz` and follow
  `MOBILE.md` to build the Capacitor native shell.

---

## Quick reference — first deploy in 6 commands

```bash
npm run typecheck && npm run build          # 1. verify
git add -A && git commit -m "prod prep"     # 2. commit
git push -u origin main                      # 3. push (repo connected to Vercel)
# 4. Vercel: import repo + paste env vars + Deploy   (dashboard)
# 5. Vercel: add domain meethub.uz + DNS records      (dashboard)
# 6. set NEXT_PUBLIC_APP_URL=https://meethub.uz + redeploy, then seed admin
```
