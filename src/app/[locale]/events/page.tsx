import { CalendarDays, ChevronRight, Clock, MapPin } from "lucide-react";
import { unstable_cache } from "next/cache";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AttendeeAvatars } from "@/components/attendee-avatars";
import { EventsFilter } from "@/components/events-filter";
import { EventStatus } from "@/generated/prisma/client";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getAttendeeSamples } from "@/server/attendees";
import { prisma } from "@/server/db";

// Distinct categories are global and rarely change — cache for 60s.
const getCategories = unstable_cache(
  async () => {
    const rows = await prisma.event.findMany({
      where: { status: EventStatus.PUBLISHED, endsAt: { gte: new Date() } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    return rows.map((c) => c.category);
  },
  ["event-categories"],
  { revalidate: 60 },
);

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const near = typeof sp.near === "string" ? sp.near : "";
  setRequestLocale(locale);
  const t = await getTranslations("Event");

  // Show published + finished events; finished ones are rendered dimmed and
  // sorted to the end so users can still see past meetups.
  const now = new Date();
  const baseWhere = {
    status: { in: [EventStatus.PUBLISHED, EventStatus.FINISHED] },
  };

  // Run the (param-dependent) event query and the cached category list together.
  const [rawEvents, categories] = await Promise.all([
    prisma.event.findMany({
      where: {
        ...baseWhere,
        ...(category ? { category } : {}),
        ...(near
          ? { location: { contains: near, mode: "insensitive" as const } }
          : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" as const } },
                { description: { contains: q, mode: "insensitive" as const } },
              ],
            }
          : {}),
      },
      orderBy: { startsAt: "asc" },
      include: { organization: { select: { name: true } } },
    }),
    getCategories(),
  ]);

  const isFinished = (e: (typeof rawEvents)[number]) =>
    e.status === EventStatus.FINISHED || e.endsAt < now;

  // Upcoming first (soonest first), finished last (most recent first).
  const events = [...rawEvents].sort((a, b) => {
    const fa = isFinished(a);
    const fb = isFinished(b);
    if (fa !== fb) return fa ? 1 : -1;
    return fa
      ? b.startsAt.getTime() - a.startsAt.getTime()
      : a.startsAt.getTime() - b.startsAt.getTime();
  });

  // Active counts + a small avatar sample per event for "who's going".
  const { byEvent: attendees, totals: taken } = await getAttendeeSamples(
    events.map((e) => e.id),
  );

  const filtering = Boolean(q || category || near);

  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">
        {t("listTitle")}
      </h1>
      <p className="text-muted-foreground mt-1">{t("listSubtitle")}</p>

      <EventsFilter
        categories={categories}
        q={q}
        category={category}
        near={near}
      />

      {events.length === 0 ? (
        <p className="text-muted-foreground mt-12">
          {filtering ? t("noResults") : t("empty")}
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const total = taken.get(event.id) ?? 0;
            const left = Math.max(0, event.capacity - total);
            const going = attendees.get(event.id) ?? [];
            const finished = isFinished(event);
            // The event's own cover photo, falling back to the green graphic.
            const cover = event.coverUrl || "/assets/event-bg.png";
            const card = (
              <div
                className={cn(
                  "event-card-border relative flex h-full min-h-80 flex-col overflow-hidden rounded-3xl border border-white/15 shadow-sm",
                  finished && "opacity-75 grayscale-35",
                )}
              >
                {/* Cover image, kept visible behind the content. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cover}
                  alt=""
                  className="absolute inset-0 size-full object-cover object-center"
                />
                {/* Readability scrim — darkest at the bottom, where text sits. */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/5"
                />

                {/* Content */}
                <div className="relative z-10 flex flex-1 flex-col p-5 text-white">
                  {/* Category (+ finished marker) */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {event.category}
                    </span>
                    {finished && (
                      <span className="rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                        {t("status.finished")}
                      </span>
                    )}
                  </div>

                  {/* Title + description, pinned to the bottom over the scrim */}
                  <h3 className="mt-auto line-clamp-2 text-xl font-bold">
                    {event.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-white/75">
                    {event.description}
                  </p>

                  {/* Date · time · location */}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-white/90">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="size-4 shrink-0" aria-hidden />
                      {dateFmt.format(event.startsAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-4 shrink-0" aria-hidden />
                      {timeFmt.format(event.startsAt)}
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5">
                      <MapPin className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{event.location}</span>
                    </span>
                  </div>

                  {/* Footer: attendees + CTA */}
                  <div className="mt-4 flex items-center justify-between gap-3">
                    {total > 0 ? (
                      <AttendeeAvatars people={going} total={total} />
                    ) : (
                      <span className="text-xs font-medium text-white/70">
                        {left > 0 ? t("spotsLeft", { count: left }) : t("full")}
                      </span>
                    )}
                    {!finished && (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 shadow-sm transition-colors group-hover:bg-emerald-50">
                        {t("join")}
                        <ChevronRight className="size-4" aria-hidden />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );

            // Finished events are informational only — not clickable.
            return finished ? (
              <div key={event.id} className="block cursor-default select-none">
                {card}
              </div>
            ) : (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group block"
              >
                {card}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
