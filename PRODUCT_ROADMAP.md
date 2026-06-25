# MeetHub — Growth & Retention Roadmap

> Goal: turn MeetHub into the event platform Uzbeks open every day. This plan is
> grounded in the **current codebase** (Next.js 16 App Router, React 19, Server
> Actions, Prisma 7 + Postgres, Clerk, Pusher, Cloudinary, next-intl uz/ru/en,
> Leaflet). Several requested features already exist — we extend them.

---

## 0. What already exists (audit)

| Area | Status today | Implication |
|---|---|---|
| Reviews & ratings | ✅ `Review` model (1 per user/event, upsert) | Add anti-spam + attendance gating + analytics |
| Gamification | ⚠️ XP & 10 badges **derived** (not stored) in `lib/xp.ts`, `lib/badges.ts` | Add a stored **PointsLedger** for non-attendance points |
| Event gallery | ⚠️ `EventMedia` model + Cloudinary exist | Add post-event upload UX + galleries + perf |
| Nearby events | ⚠️ `Event.latitude/longitude` + `UZ_CITIES` | Add PostGIS/distance query + map UI |
| Notifications | ✅ `Notification` + Pusher | Reuse as the spine for follow/Telegram |
| Profiles | ❌ only `updateProfileName` exists | Build real profiles (biggest gap) |
| Follow / social graph | ❌ none | New |
| DM / connections | ❌ none | New (heaviest) |
| Recommendations | ❌ none | New (depends on follow + attendance data) |
| Telegram | ❌ none | New — **highest leverage for UZ** |
| Requests marketplace | ❌ none | New (supply generation) |

**Architecture note that shapes everything:** business logic lives in **Server
Actions**, not a REST API. That is fine for the web app (recommendations, feeds,
profiles are all React Server Components reading Postgres directly). The moment
we want the **mobile app or the Telegram bot** to reuse this logic, we need a
thin API layer. So: build a small set of **Route Handlers** (`/api/v1/*`) for
exactly the data the bot + future RN app need, and keep everything else as
Server Components/Actions. Don't build a full API speculatively.

---

## 1. Feature ranking (retention × growth ÷ effort)

Scored 1–5. **Priority = (Retention + Growth) weighted, divided by Effort.**

| # | Feature | Retention | Growth | Effort | Verdict |
|---|---|:--:|:--:|:--:|---|
| 8 | **Telegram integration** | 5 | 5 | 3 | 🟢 Do first — UZ distribution channel |
| 2 | **Follow organizers** | 5 | 5 | 2 | 🟢 Do first — cheap, viral, feeds recs |
| 3 | **Profiles + attendance history** | 4 | 3 | 2 | 🟢 Foundation for 1, 5, 7 |
| 9 | **Nearby events** | 4 | 3 | 2 | 🟢 Coords already exist — quick win |
| 4 | **Event gallery (memories)** | 4 | 4 | 3 | 🟡 FOMO + shareability |
| 7 | **Gamification (stored)** | 4 | 3 | 3 | 🟡 Extends existing XP |
| 6 | **Reviews v2 (verified)** | 3 | 3 | 2 | 🟡 Mostly exists, harden it |
| 1 | **Recommendations** | 5 | 4 | 4 | 🟡 Needs follow+attendance data first |
| 10 | **Event requests marketplace** | 3 | 4 | 3 | 🟡 Solves cold-start supply |
| 5 | **Networking + DM** | 5 | 4 | 5 | 🔴 Highest value, heaviest — last |

**Sequencing logic:** ship the cheap viral loops (Telegram, Follow, Profiles,
Nearby) first because they generate the *data* (interests, follows, attendance)
that recommendations and networking later depend on.

---

## 2. Roadmaps

### MVP (the retention loop) — features 2, 3, 8, 9
The minimum that makes someone come back: a profile, organizers to follow,
Telegram pings when those organizers post, and events near them.

### 30-day roadmap
- **Week 1** — Profiles + attendance history (feature 3). Add `UserProfile`
  fields (bio, interests, skills, socials, privacy). Public profile page.
- **Week 2** — Follow organizers (feature 2). `Follow` model, follow button,
  organizer profile pages, follower counts, "new event from X" notification.
- **Week 3** — Telegram bot (feature 8). Account linking, event reminders,
  new-event-from-followed-org pushes. This rides on features 2 & 3.
- **Week 4** — Nearby events (feature 9). Distance query + map list + "near me"
  filter (the geolocation hook already exists in constants).

### 90-day roadmap
- **Month 2** — Event gallery (4) + Reviews v2 (6) + stored Gamification (7).
  Post-event "memories" drive re-engagement; verified reviews build trust;
  points reward the behaviors above.
- **Month 3** — Recommendations v1 (1). Now we have interests + follows +
  attendance + categories to score against. Ship the "For You" feed.

### 6-month roadmap
- **Month 4** — Event requests marketplace (10). Fixes supply cold-start in
  smaller cities (Fergana, Namangan…).
- **Month 5–6** — Networking + DM (5). LinkedIn-for-events: connections,
  suggested people you met, direct messaging (reuse Pusher).
- Plus: thin `/api/v1` layer + Capacitor native shell + native push.

---

## 3. Feature specs

Each feature: **DB schema → API/actions → UI wireframe → Next.js strategy →
performance/scale.** Prisma snippets follow the existing style (cuid ids,
`onDelete: Cascade`, composite indexes).

---

### Feature 3 — User Profiles & Attendance History *(build first; foundation)*

**DB** — extend `User`, add a 1:1 `UserProfile` to keep `User` lean:
```prisma
model UserProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  username    String   @unique          // @handle for public URLs
  bio         String?
  headline    String?                    // "Frontend dev @ Uzum"
  city        String?
  interests   String[]                   // category slugs (reuse EVENT_CATEGORIES)
  skills      String[]
  website     String?
  telegram    String?
  linkedin    String?
  github      String?
  instagram   String?
  visibility  ProfileVisibility @default(PUBLIC)
  showAttendance Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
enum ProfileVisibility { PUBLIC CONNECTIONS PRIVATE }
```

**Server actions** (`server/actions/profile.ts`, extend existing):
- `upsertProfile(input)` — Zod-validated, owner only.
- `updatePrivacy(settings)`.
- Reads are Server Components — no action needed.

**UI wireframe** — `/[locale]/u/[username]`:
```
┌───────────────────────────────────────────────┐
│  [avatar]  Aziz Karimov   ✅                    │
│            Frontend dev @ Uzum · Toshkent       │
│            🔥 12-day streak · ⭐ Level 4 · 320 XP │
│            [ Follow ]  [ Message ]  [ tg ][ in ] │
│  Interests:  IT  Startup  Design                │
│  Skills:     React  TypeScript  Figma           │
├── Tabs: [Upcoming] [Attended] [Organized] [Badges]
│  Upcoming (3)                                    │
│   • React Meetup — Jun 28 · IT Park             │
│  Attended (27)   ←  privacy: showAttendance      │
│   ▸ grid of past event cards (links to gallery) │
│  Badges:  🌱 ⭐ 🏆 🔥 ✍️ 🎤                       │
└───────────────────────────────────────────────┘
```

**Next.js strategy** — Server Component page; `generateMetadata` for OG (already
patterned in the events page). Attendance lists derive from `Registration`
(status filters: JOINED+future = upcoming, ATTENDED = attended). Organized list
from `Organization.events`. Reuse `computeXp`/`computeBadges`.

**Performance/scale** — index `Registration(userId, status)` (exists). Paginate
attended events (cursor on `joinedAt`). Cache the public profile with
`revalidateTag('profile:'+username)` on edits.

**Privacy** — `visibility` + `showAttendance` checked in the Server Component
before rendering; `CONNECTIONS` resolves against feature 5's `Connection`.

---

### Feature 2 — Follow Organizers *(cheap, viral, feeds recs)*

**DB**:
```prisma
model Follow {
  id          String   @id @default(cuid())
  followerId  String                      // User.id
  follower    User     @relation("Follower", fields: [followerId], references: [id], onDelete: Cascade)
  orgId       String                      // Organization.id (follow orgs first)
  organization Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  @@unique([followerId, orgId])
  @@index([orgId])                        // follower counts / lists
  @@index([followerId])                   // "who I follow" feed
}
```
Add `followersCount Int @default(0)` denormalized on `Organization` (updated in
the same transaction as follow/unfollow) to avoid `COUNT(*)` on hot paths.

**API / actions**:
- `followOrg(orgId)` / `unfollowOrg(orgId)` — Server Actions; upsert + counter in
  one `prisma.$transaction`.
- On organizer publishing an event → fan-out: create `Notification` (type
  `NEW_EVENT_FROM_FOLLOW`) for each follower + enqueue Telegram (feature 8).
- `GET /api/v1/feed` (Route Handler) — for the Telegram bot + future RN app.

**UI** — Follow button (optimistic, `useOptimistic`) on organizer cards, event
pages, and the new **organizer profile** `/[locale]/o/[orgId]`:
```
┌──────────────────────────────────────┐
│ [logo] IT Park Events   ✅ Verified    │
│        1,204 followers · 38 events     │
│        [ Following ▾ ]                  │
│  About …                                │
│  Tabs: [Upcoming] [Past] [Reviews]      │
└──────────────────────────────────────┘
```
Plus a **"Following" feed** on the home/dashboard: events from orgs you follow,
newest first.

**Next.js strategy** — organizer page is a Server Component. Fan-out on publish
runs in the `publishEvent` action; for large follower counts push it to a
background job (see scale).

**Performance/scale** — denormalized counters; fan-out >1k followers → write a
`NotificationOutbox` row and drain via the existing cron pattern
(`/api/cron/*`) or a queue, instead of inline loops in the request.

---

### Feature 8 — Telegram Integration *(critical for UZ — do first)*

**Why first:** in Uzbekistan Telegram *is* the notification layer. Email/web push
have low reach; a Telegram bot has near-100% open rates and is the cheapest
growth + retention channel.

**Bot architecture**
```
Telegram  ──webhook──▶  /api/telegram/webhook (Route Handler)
   ▲                          │  verify secret token header
   │ sendMessage              ▼
   └──────────  lib/telegram.ts (Bot API client)
Outbox drain (cron) ───▶ sendMessage(chatId, …)  ← reminders, fan-out
```
Use **webhook mode** (not long-polling) — set webhook to
`https://<app>/api/telegram/webhook` with a secret token; Telegram includes
`X-Telegram-Bot-Api-Secret-Token` which you verify on every request.

**DB**:
```prisma
model TelegramAccount {
  id         String   @id @default(cuid())
  userId     String   @unique
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  chatId     BigInt   @unique          // Telegram chat id
  username   String?
  linkedAt   DateTime @default(now())
  // granular opt-ins
  remindEvents     Boolean @default(true)
  notifyNewEvents  Boolean @default(true)  // from followed orgs
  notifyFollowers  Boolean @default(true)  // for organizers
}

model NotificationOutbox {           // reliable fan-out / scheduled sends
  id         String   @id @default(cuid())
  channel    OutboxChannel           // TELEGRAM | PUSH | EMAIL
  userId     String
  payload    Json
  sendAfter  DateTime @default(now())
  sentAt     DateTime?
  attempts   Int      @default(0)
  @@index([sentAt, sendAfter])
}
enum OutboxChannel { TELEGRAM PUSH EMAIL }
```

**Account linking (secure)** — deep link with a one-time token:
1. User clicks "Connect Telegram" → server mints a short-lived `linkToken`
   (signed, 10 min) and opens `https://t.me/MeetHubBot?start=<linkToken>`.
2. Bot receives `/start <linkToken>` → webhook verifies token → binds
   `chatId ↔ userId` in `TelegramAccount`. No phone number needed.

**Features delivered**
- **Event reminders** — outbox rows created on join (`sendAfter = startsAt - 2h`).
- **New event from followed org** — fan-out writes outbox rows.
- **New follower alert** — for organizers.
- **Organizer broadcasts** — verified orgs send a message to all followers who
  opted in (rate-limited, abuse-guarded).

**Security** — verify secret token header on webhook; sign link tokens (HMAC,
short TTL); rate-limit broadcasts (reuse `server/rate-limit.ts`); store `chatId`
as `BigInt`; never expose the bot token client-side (server env only); honor
opt-outs; respect Telegram's 30 msg/sec global limit (drain queue with throttle).

**Next.js strategy** — webhook + a `GET /api/cron/telegram-drain` (Vercel cron,
like the existing `auto-block` cron) that pulls due outbox rows and sends.

---

### Feature 9 — Nearby Events *(coords already exist — quick win)*

**DB** — coords exist on `Event`. For real distance ranking add **PostGIS**:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE "Event" ADD COLUMN geo geography(Point,4326);
UPDATE "Event" SET geo = ST_MakePoint(longitude, latitude)::geography
  WHERE longitude IS NOT NULL;
CREATE INDEX event_geo_idx ON "Event" USING GIST (geo);
```
(Trigger keeps `geo` in sync with lat/lng on write.) **Without PostGIS** you can
ship v1 with a bounding-box prefilter + Haversine in SQL — fine at current scale.

**Search strategy**
- Get the user's coords (browser geolocation; fallback = nearest `UZ_CITIES`).
- `ST_DWithin(geo, :point, :radiusMeters)` ordered by `ST_Distance`, filtered to
  `status = PUBLISHED AND startsAt > now()`.
- "Location-based recommendations" = nearby × user interests (feeds feature 1).

**API** — `getNearbyEvents({lat,lng,radiusKm,category?})` Server Action +
`GET /api/v1/events/nearby` for bot/mobile.

**UI / maps** — Leaflet is already in deps. Split view:
```
┌─────────────┬───────────────────────────┐
│  Map (Leaflet) │  Events near you (sorted) │
│   • pins by     │  • React Meetup · 1.2 km  │
│     distance    │  • Startup Talk · 3.8 km  │
│  [my location]  │  [ Radius: 5km ▾ ]        │
└─────────────┴───────────────────────────┘
```
Maps ideas: cluster pins (leaflet.markercluster), "events within 5/10/25 km"
chips, deep-link a pin → event modal (the intercepting `@modal` route exists).

**Performance/scale** — GIST index makes radius queries O(log n); cache results
per (city, category) for a few minutes; lazy-load the map (`next/dynamic`,
`ssr:false`) so Leaflet stays out of the server bundle.

---

### Feature 1 — Event Recommendation System *(after follow + attendance data)*

**Strategy: hybrid, start simple.** v1 = content-based + popularity + social
signals computed in SQL. v2 = item-item collaborative filtering (users who
attended X also attended Y). Avoid a heavy ML service until scale demands it.

**DB**:
```prisma
model UserInterest {                  // explicit + inferred interests
  userId   String
  category String                     // from EVENT_CATEGORIES
  weight   Float   @default(1)        // inferred from attendance decays/grows
  source   InterestSource            // EXPLICIT | INFERRED
  @@id([userId, category])
}
enum InterestSource { EXPLICIT INFERRED }

model EventScore {                    // precomputed per-user recommendations
  userId    String
  eventId   String
  score     Float
  reason     String                   // "Because you follow IT Park"
  computedAt DateTime @default(now())
  @@id([userId, eventId])
  @@index([userId, score])
}
```

**Recommendation logic (v1 score)** — for each upcoming PUBLISHED event:
```
score =  w1 * categoryMatch(userInterests, event.category)
       + w2 * isFromFollowedOrg(user, event.org)
       + w3 * proximity(user.city, event)         // feature 9
       + w4 * similarUsersAttending(event)         // collaborative seed
       + w5 * popularity(registrations / capacity, recency)
       - penalty(alreadyJoined, full, conflictsWithUserSchedule)
```
- **User interests:** explicit (profile) + inferred — when a user attends, bump
  `UserInterest.weight` for that category (with time decay via cron).
- **Similar users:** item-item CF — precompute category/co-attendance overlap.
- Recompute in a **nightly cron** (`/api/cron/recommend`) writing `EventScore`;
  serve instantly from the table. New users → fall back to popular + nearby.

**UI** — "For You" feed on home/dashboard with reason chips:
```
For you
 ┌──────────────────────────────────────┐
 │ [cover]  React Meetup                  │
 │  Jun 28 · IT Park · 1.2 km             │
 │  💡 Because you follow IT Park & like IT│
 │  [ Join ]                              │
 └──────────────────────────────────────┘
```

**Next.js strategy** — Server Component reads top-N `EventScore` for the user;
cron does the heavy work off the request path. `revalidateTag('recs:'+userId)`.

**Scalability** — precomputed table = O(1) reads. CF overlap is the expensive
part; cap to recent events, compute incrementally, shard the cron by user range.
Graduate to a dedicated recsys (e.g. embeddings + pgvector, or a separate
service) only when catalog + users grow past what nightly SQL handles.

---

### Feature 4 — Event Gallery (Memories)

**DB** — `EventMedia` exists. Extend for galleries:
```prisma
// add to EventMedia:
caption    String?
width      Int?
height     Int?
blurhash   String?     // instant placeholder
thumbUrl   String?     // Cloudinary derived transform
likeCount  Int  @default(0)
```
Optional `MediaLike(userId, mediaId)` for engagement.

**Upload system** — gated to **organizers + attendees of FINISHED events**.
Reuse `next-cloudinary` (already a dep): client-side **signed direct upload** to
Cloudinary (offloads bandwidth from the server), then a Server Action persists
the returned URL/metadata. Accept images + video; Cloudinary does transcoding +
thumbnails.

**Storage strategy** — Cloudinary as source of truth for media (don't store
blobs in Postgres). Use **named transformations** for thumb/grid/full sizes; let
Cloudinary CDN serve. Store only URLs + metadata in `EventMedia`.

**UI / UX**:
```
Event ▸ Memories
 ┌──┬──┬──┐   masonry grid, lazy-loaded
 │📷│🎥│📷│   tap → lightbox (swipe, ❤️, download)
 ├──┼──┼──┤   [ + Upload ] (only attendees/organizer)
 │📷│📷│🎥│
 └──┴──┴──┘
 "327 memories from 41 people"  →  drives FOMO + re-shares
```

**Performance** — `next/image` with `blurhash`/thumb placeholders; infinite
scroll (cursor on `createdAt`); video lazy + poster frame; `loading="lazy"`;
serve thumbs in grid, full only in lightbox; cache gallery per event.

---

### Feature 6 — Reviews & Ratings v2 *(harden the existing model)*

**DB** — `Review` exists (1/user/event, upsert). Add:
```prisma
// add to Review:
attendedVerified Boolean @default(false)  // set true only if Registration.ATTENDED
photos           String[]                 // Cloudinary urls
helpfulCount     Int     @default(0)
hidden           Boolean @default(false)  // moderation
// add denormalized aggregates to Event:
ratingAvg   Float @default(0)
ratingCount Int   @default(0)
```

**Anti-spam / verification**
- **Attendance gate:** only allow a review if a `Registration` with status
  `ATTENDED` exists for that user+event (and event is `FINISHED`). Set
  `attendedVerified`.
- One review per user per event (the `@@unique` already enforces this).
- Rate-limit submissions (`server/rate-limit.ts`); strip links / profanity;
  optional admin moderation queue (`hidden`).
- Recompute `ratingAvg/ratingCount` in the same transaction.

**API routes / actions** — `submitReview`, `editReview`, `markHelpful`,
`reportReview` (Server Actions). `GET /api/v1/events/:id/reviews` for bot/mobile.

**Organizer review analytics** — dashboard widget:
```
Reviews — IT Park        ⭐ 4.6 (213)
  5★ ████████████  72%
  4★ ████          18%
  Trend ▁▂▃▅▆  ·  Top words: "well organized", "great speakers"
  Recent low ratings → action items
```

**UI** — star input + optional photos on the post-event screen; review list with
"✓ Attended" verified badge, helpful votes, photo thumbnails.

---

### Feature 7 — Gamification & Leaderboards v2 *(extend existing XP)*

Today XP/badges are **derived from attendance only**. New point sources (create
event, write review, invite friend) aren't date-derivable, so introduce a
**stored ledger** — keep derived attendance XP, add ledger for the rest, sum
both.

**DB**:
```prisma
model PointsLedger {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  amount    Int
  reason    PointReason
  refId     String?                  // event/review/invite id (idempotency)
  createdAt DateTime @default(now())
  @@unique([userId, reason, refId])  // award once per source
  @@index([userId, createdAt])
}
enum PointReason {
  ATTEND_EVENT CREATE_EVENT WRITE_REVIEW UPLOAD_MEDIA
  INVITE_ACCEPTED RECEIVE_REVIEW DAILY_STREAK
}

model UserStats {                    // denormalized totals for leaderboard
  userId      String @id
  totalPoints Int    @default(0)
  level       Int    @default(1)
  attended    Int    @default(0)
  organized   Int    @default(0)
  updatedAt   DateTime @updatedAt
  @@index([totalPoints])             // leaderboard sort
}
```

**Logic**
- On each rewarded action, `award(userId, reason, refId, amount)` — idempotent
  via the `@@unique`, updates `UserStats.totalPoints` in the same transaction.
- **Levels:** `level = floor(sqrt(totalPoints / 50))` (tunable curve).
- **Badges:** extend `computeBadges` with ledger-based ones (inviter, creator,
  photographer…). Keep the existing 10.
- **Leaderboards:** global + **per-city** + **monthly** (filter ledger by
  `createdAt`) + **friends** (feature 5). Sort `UserStats.totalPoints`.

**UI** — level ring + progress bar on profile; leaderboard tabs
`[Global][Toshkent][This month][Friends]`; toast + confetti on level-up & badge
unlock (retention dopamine).

**Performance** — read totals from `UserStats` (no aggregation at read time);
monthly board can be a cached materialized query refreshed by cron.

**Anti-abuse** — points only for verified actions (attended, not just joined);
idempotency keys prevent double-award; invite points require the invitee to
actually attend an event (not just sign up).

---

### Feature 10 — Event Requests Marketplace *(supply cold-start)*

Demand-side input: users request events; organizers see validated demand. Fixes
the empty-calendar problem in smaller cities.

**DB**:
```prisma
model EventRequest {
  id          String   @id @default(cuid())
  title       String                 // "React Meetup in Fergana"
  description String?
  category    String
  city        String
  createdById String
  createdBy   User     @relation(fields: [createdById], references: [id], onDelete: Cascade)
  status      RequestStatus @default(OPEN)
  fulfilledByEventId String?         // links to the Event that satisfied it
  voteCount   Int      @default(0)   // denormalized
  createdAt   DateTime @default(now())
  @@index([city, category, status])
  @@index([status, voteCount])       // trending requests
}
enum RequestStatus { OPEN PLANNED FULFILLED CLOSED }

model EventRequestVote {
  requestId String
  userId    String
  createdAt DateTime @default(now())
  @@id([requestId, userId])          // one vote per user
  @@index([requestId])
}
```

**Matching algorithm** — when a request gains votes, notify organizers whose
`category` history + `city` match (and who have followers in that city). When an
organizer creates an event matching `(city, category)` of OPEN requests, suggest
linking it → on publish, mark requests `FULFILLED` and notify all voters
(Telegram!) — a built-in audience on day one.

**UI**:
```
Requests — Fergana
 🔥 React Meetup            ▲ 142 votes   [ Vote ]
    Startup Networking      ▲  88 votes   [ Voted ]
    [ + Request an event ]
Organizer dashboard ▸ "Demand near you":
   Fergana · React · 142 people waiting → [ Create event ]
```

**Performance/scale** — denormalized `voteCount`; trending = index on
`(status, voteCount)`; dedupe via composite PK on votes.

---

### Feature 5 — Networking & Direct Messaging *(LinkedIn-for-events; last)*

Heaviest feature; depends on profiles (3) + the event social graph.

**DB**:
```prisma
model Connection {                   // mutual, like LinkedIn
  id          String   @id @default(cuid())
  requesterId String
  addresseeId String
  status      ConnectionStatus @default(PENDING)
  metEventId  String?              // "you met at React Meetup"
  createdAt   DateTime @default(now())
  @@unique([requesterId, addresseeId])
  @@index([addresseeId, status])
}
enum ConnectionStatus { PENDING ACCEPTED DECLINED BLOCKED }

model Conversation {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  participants ConversationParticipant[]
  messages  DirectMessage[]
}
model ConversationParticipant {
  conversationId String
  userId         String
  lastReadAt     DateTime?
  @@id([conversationId, userId])
  @@index([userId])
}
model DirectMessage {
  id             String   @id @default(cuid())
  conversationId String
  senderId       String
  content        String?
  mediaUrl       String?
  createdAt      DateTime @default(now())
  @@index([conversationId, createdAt])
}
```

**DM architecture** — reuse **Pusher** (already wired for event chat):
private channel per conversation (`private-dm-<conversationId>`), auth via the
existing `/api/pusher/auth` route extended to check participant membership.
Persist messages via Server Action; deliver realtime via Pusher; unread =
`createdAt > lastReadAt`. Telegram mirror for offline users (feature 8).

**Suggested connections** — "People you met" = other `ATTENDED` users of events
you attended; rank by shared events + shared interests/skills. Cron-precomputed
like recommendations.

**UI** — public profile (feature 3) + Connect button; "People you met at
[event]" prompt after an event finishes (high-intent moment); inbox with
realtime DM; skills/interests/socials already on the profile.

**Privacy/safety** — messaging gated to connections or co-attendees by default;
block/report; rate-limit; respect `ProfileVisibility`.

**Scale** — Pusher handles fan-out; paginate messages (cursor); archive old
conversations; the connection graph stays small per user.

---

## 4. Cross-cutting: performance & scalability

- **Denormalized counters** (followers, votes, ratingAvg, totalPoints) updated in
  transactions — never `COUNT(*)` on read paths.
- **Precompute heavy reads** (recommendations, suggested connections, monthly
  leaderboard) in **cron Route Handlers** (the `auto-block` cron is the pattern);
  serve from tables.
- **Outbox pattern** for all fan-out (notifications, Telegram) → reliable,
  retryable, rate-limited; never loop sends inside a request.
- **Caching:** `revalidateTag` per entity (`profile:`, `org:`, `recs:`); tag
  invalidation on writes.
- **Media:** Cloudinary signed direct uploads + CDN + derived transforms; only
  URLs/metadata in Postgres.
- **Indexes:** every new query path gets a composite index (shown per feature).
- **Geo:** PostGIS GIST index for nearby.
- **Thin API later:** `/api/v1/*` Route Handlers only for the Telegram bot and
  future RN/Capacitor app — don't pre-build a full API.

---

## 5. Viral / growth features (UZ-specific)

1. **Telegram-first invites** — "Invite 3 friends, unlock a badge + priority RSVP";
   shareable `t.me` deep links with referral attribution (`INVITE_ACCEPTED`
   points only when the invitee attends).
2. **Event memories auto-recap** — after an event, auto-generate a shareable
   image/story (cover + photo collage + "X people attended") → users post it →
   inbound traffic.
3. **Digital tickets / check-in QR** — a `/ticket` route exists; add QR check-in
   that flips `Registration → ATTENDED` (also powers verified reviews + points).
4. **Streaks & "city leaderboard"** — "Top 10 in Toshkent this month" → local
   competition; Telegram weekly digest of your rank.
5. **Organizer broadcast channels** — verified orgs get a Telegram broadcast to
   followers; makes MeetHub the distribution tool organizers depend on (supply
   lock-in).
6. **"Bring a friend" RSVP** — +1 invites pre-fill a Telegram share.
7. **FOMO notifications** — "5 people you follow joined React Meetup" (social
   proof via the follow graph).
8. **Post-event "people you met"** networking nudge (feature 5) at peak intent.
9. **Request → fulfilled loop** — when a requested event gets created, every
   voter gets a Telegram ping: instant audience + delight.
10. **University / company hubs** — sub-communities (TUIT, Uzum…) with their own
    leaderboards → built-in cohorts.

---

## 6. Recommended build order (TL;DR)

1. **Profiles + attendance history** (foundation)
2. **Follow organizers** (viral, feeds recs)
3. **Telegram** (UZ distribution + retention)
4. **Nearby events** (quick win, coords exist)
5. **Gallery + Reviews v2 + Gamification v2** (engagement loop)
6. **Recommendations v1** (now there's data)
7. **Requests marketplace** (supply)
8. **Networking + DM** (deepest moat)

Then: thin `/api/v1`, Capacitor native shell, native push.
