import { CalendarDays } from "lucide-react";
import { unstable_cache } from "next/cache";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/empty-state";
import { EventCard } from "@/components/event-card";
import { EventsFilter } from "@/components/events-filter";
import { buttonVariants } from "@/components/ui/button";
import { EventStatus } from "@/generated/prisma/client";
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
  const tNav = await getTranslations("Nav");

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
        ...(near ? { city: near } : {}),
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
        <EmptyState
          icon={CalendarDays}
          title={filtering ? t("noResults") : t("empty")}
          className="mt-10"
          action={
            !filtering ? (
              <a
                href={`/${locale}/events/new`}
                className={buttonVariants()}
              >
                {tNav("create")}
              </a>
            ) : undefined
          }
        />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              total={taken.get(event.id) ?? 0}
              going={attendees.get(event.id) ?? []}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
