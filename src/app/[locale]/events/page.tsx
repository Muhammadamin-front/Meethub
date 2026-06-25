import { Building2, CalendarDays, MapPin, Users } from "lucide-react";
import { unstable_cache } from "next/cache";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AttendeeAvatars } from "@/components/attendee-avatars";
import { EventCountdown } from "@/components/event-countdown";
import { EventsFilter } from "@/components/events-filter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventStatus } from "@/generated/prisma/client";
import { Link } from "@/i18n/navigation";
import { cn, formatEventRange } from "@/lib/utils";
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
            const card = (
              <Card
                data-theme={event.theme}
                className={cn(
                  "event-theme h-full overflow-hidden pt-0 transition-all duration-200",
                  finished
                    ? "opacity-75 grayscale-35"
                    : "hover:shadow-primary/10 hover:-translate-y-1 hover:shadow-xl",
                )}
              >
                <div className="relative">
                  {event.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.coverUrl}
                      alt=""
                      className={cn(
                        "aspect-video w-full object-cover",
                        finished && "grayscale",
                      )}
                    />
                  ) : (
                    <div className="from-primary/20 to-primary/5 aspect-video w-full bg-linear-to-br" />
                  )}
                  {finished && <div className="absolute inset-0 bg-black/40" />}
                  {/* Highlighted category */}
                  <Badge className="bg-primary text-primary-foreground absolute top-3 left-3 border-transparent shadow-sm">
                    {event.category}
                  </Badge>
                  {/* Finished marker */}
                  {finished && (
                    <Badge className="absolute top-3 right-3 border-transparent bg-zinc-900/80 text-white shadow-sm">
                      {t("status.finished")}
                    </Badge>
                  )}
                  {/* Live countdown until the event starts */}
                  {!finished && (
                    <EventCountdown
                      startsAt={event.startsAt}
                      endsAt={event.endsAt}
                      className="absolute bottom-3 left-3 shadow-sm"
                    />
                  )}
                </div>
                <CardHeader>
                  <CardTitle
                    className={cn(
                      "transition-colors",
                      !finished && "group-hover:text-primary",
                    )}
                  >
                    {event.title}
                  </CardTitle>
                  {/* Highlighted organizer */}
                  <p className="flex items-center gap-1.5 text-sm">
                    <Building2 className="text-primary size-3.5" aria-hidden />
                    <span className="text-foreground font-medium">
                      {event.organization.name}
                    </span>
                  </p>
                </CardHeader>
                <CardContent className="text-muted-foreground space-y-1.5 text-sm">
                  <p className="flex items-center gap-1.5">
                    <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                    {formatEventRange(event.startsAt, event.endsAt, locale)}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    {event.location}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users className="size-3.5 shrink-0" aria-hidden />
                    {finished
                      ? t("status.finished")
                      : left > 0
                        ? t("spotsLeft", { count: left })
                        : t("full")}
                  </p>
                  {total > 0 && (
                    <div className="pt-1">
                      <AttendeeAvatars people={going} total={total} />
                    </div>
                  )}
                </CardContent>
              </Card>
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
