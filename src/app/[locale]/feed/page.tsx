import { CalendarDays } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/empty-state";
import { EventCard } from "@/components/event-card";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getAttendeeSamples } from "@/server/attendees";
import { requireUser } from "@/server/auth";
import { getFollowedUpcomingEvents } from "@/server/follow";

export default async function FeedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const t = await getTranslations("Feed");

  const events = await getFollowedUpcomingEvents(user.id);
  const { byEvent, totals } = await getAttendeeSamples(events.map((e) => e.id));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground mt-1">{t("subtitle")}</p>

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={t("empty")}
          description={t("emptyDesc")}
          className="mt-10"
          action={
            <Link href="/organizations" className={buttonVariants()}>
              {t("discover")}
            </Link>
          }
        />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              total={totals.get(event.id) ?? 0}
              going={byEvent.get(event.id) ?? []}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
