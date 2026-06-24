# MeetHub

A production-ready meetup platform where verified organizations host events and
users discover, join, and chat around them — with attendance tracking, a
reputation/auto-block system, real-time chat, media sharing, and notifications.

Built phase by phase. See [Build status](#build-status) for what's wired up.

## Tech stack

| Concern        | Choice                                            |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 16 (App Router) + TypeScript              |
| Styling        | Tailwind CSS v4 + shadcn/ui                        |
| i18n           | next-intl (Uzbek default, Russian, English)       |
| Theming        | next-themes (light / dark / system)               |
| Auth           | Clerk (Google OAuth + phone/SMS OTP)              |
| Database       | PostgreSQL (Neon/Supabase) + Prisma ORM           |
| Realtime       | Pusher Channels (private + presence)              |
| Media          | Cloudinary (images + video)                       |
| Email          | Resend                                            |
| Scheduled jobs | Vercel Cron                                        |
| Deploy         | Vercel + Neon/Supabase                            |

> The original spec named Next.js 15; `create-next-app` now provisions Next.js
> 16 (current stable), which is a drop-in for everything here. Ask if you need
> 15 pinned.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env   # then fill in the values

# 3. Run the dev server
npm run dev            # http://localhost:3000
```

### Required services (Phase 1)

The app needs a Clerk app and a Postgres database before it will run.

1. **Clerk** — create an app at [clerk.com](https://clerk.com), enable **Google,
   GitHub, and Apple** social sign-in and turn **Phone OFF** (User &
   authentication → Email, phone, username), then copy the keys into `.env`:
   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`. The prebuilt
   `<SignIn/>` / `<SignUp/>` render whatever the dashboard enables.
   - Add a webhook pointing at `<APP_URL>/api/webhooks/clerk` (events
     `user.created`, `user.updated`, `user.deleted`) and copy its signing secret
     into `CLERK_WEBHOOK_SIGNING_SECRET`. For local dev, expose the route with a
     tunnel (e.g. `ngrok`) — or rely on the built-in lazy sync (a DB user is
     created on first authenticated request).
2. **Postgres** — create a database on [Neon](https://neon.tech) or
   [Supabase](https://supabase.com) and set `DATABASE_URL` (pooled, used at
   runtime via the pg adapter) and `DIRECT_URL` (non-pooled, used by Prisma
   Migrate).

Then:

```bash
npm run db:migrate   # create tables (first migration)
npm run dev          # sign in once with SEED_ADMIN_EMAIL
npm run db:seed      # promote that user to ADMIN
```

> Prisma 7 generates its client into `src/generated/prisma` (git-ignored) and
> connects via a driver adapter — there are no connection URLs in
> `schema.prisma`; they live in `.env` (+ `prisma.config.ts` for the CLI).

### Scripts

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start the dev server                 |
| `npm run build`        | Production build                     |
| `npm run start`        | Run the production build             |
| `npm run lint`         | ESLint                               |
| `npm run lint:fix`     | ESLint with autofix                  |
| `npm run typecheck`    | TypeScript (`tsc --noEmit`)          |
| `npm run format`       | Format with Prettier                 |
| `npm run format:check` | Check formatting without writing     |

## Project structure

```
messages/              # Translation catalogs: en.json, uz.json, ru.json
src/
  app/
    [locale]/          # Locale-prefixed routes (/uz, /ru, /en)
      layout.tsx       # Root layout: intl + theme providers, header/footer
      page.tsx         # Landing page
      not-found.tsx    # Localized 404
      [...rest]/       # Catch-all -> localized not-found
    global-not-found.tsx  # English 404 for non-route requests
    globals.css        # Tailwind + theme tokens (light/dark)
  components/          # Shared React components
    ui/                # shadcn/ui primitives (Base UI based)
    site-header.tsx    # site-footer, theme-toggle, locale-switcher, mobile-nav
    theme-provider.tsx
  i18n/                # next-intl: routing, navigation, request config
  hooks/               # Client-side React hooks (Pusher, etc.)
  lib/                 # Utilities, constants, config
    validations/       # Zod schemas (shared by actions & forms)
    constants.ts
    utils.ts
  server/              # Server-only modules (DB, auth/permission helpers)
  types/               # Shared types + next-intl message typing (global.d.ts)
  proxy.ts             # next-intl locale middleware (Next 16 "proxy" convention)
```

## Internationalization & theming

- **Languages:** Uzbek (default, Latin), Russian, English. URLs are
  locale-prefixed (`/uz`, `/ru`, `/en`); `/` redirects to `/uz`.
- Add UI strings to all three files in `messages/`. The English catalog
  (`en.json`) is the typed source of truth — message keys are autocompleted and
  type-checked via `src/types/global.d.ts`.
- Use `Link` / `useRouter` from `@/i18n/navigation` (not `next/*`) for internal
  navigation so the locale prefix is preserved.
- **Dark mode:** `next-themes` with `attribute="class"`; toggle in the header
  offers Light / Dark / System.

## Conventions

- App Router with Server Components by default; mutations via Server Actions or
  Route Handlers.
- Validate all input with Zod. Centralize auth/permission checks in reusable
  helpers under `src/server`.
- All secrets live in env vars (see `.env.example`). Never expose service keys to
  the client — only `NEXT_PUBLIC_*` values reach the browser.
- For link-styled buttons use `buttonVariants()` on a `Link` (keeps anchor
  semantics); reserve `<Button>` for real buttons.

## Build status

- [x] **Phase 0** — Project setup (Next.js, Tailwind, shadcn/ui, lint/format, base layout)
- [x] **i18n & theming** — next-intl (uz/ru/en) + dark mode + responsive header/nav
- [x] **Phase 1** — Auth (Clerk) + DB foundation (Prisma 7) + user-sync webhook + admin seed
- [x] **Phase 2** — Organizations (apply → PENDING, admin verify/reject, public list)
- [x] **Phase 3** — Events (org create/edit/publish/cancel, list/detail, join/leave + capacity/blocked checks, dashboard)
- [x] **Phase 4** — Attendance marking + reputation + no-show auto-block cron + admin block/unblock + blocked banner
- [x] **Phase 5** — Per-event chat: membership-enforced Pusher channel auth, DB-persisted text messages, read-only for blocked users (add `PUSHER_*` keys for realtime)
- [x] **Phase 6** — Media (Cloudinary): profile photo, event cover, event gallery, image/video chat messages — server-validated (add `CLOUDINARY_*` + upload preset to enable)
- [x] **Phase 7** — Notifications: in-app bell with unread count + Pusher realtime, triggers (attendance, org approve/reject, blocked), Resend email on block & org approval (add `RESEND_API_KEY` to enable)
- [x] **Phase 8** — Polish: loading + error boundaries (localized), in-memory rate limiting on key mutations, per-page metadata, responsive layouts

**All phases complete.** Realtime chat/notifications, media uploads, and email
activate once their service keys are added to `.env` (everything else runs and
degrades gracefully without them).
