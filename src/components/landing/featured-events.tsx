import { CalendarDays, ChevronRight, Clock, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AttendeeAvatars } from "@/components/attendee-avatars";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { coverSrc } from "@/lib/upload";
import { cn } from "@/lib/utils";
import type { AttendeePreview } from "@/server/attendees";

import { Reveal } from "./reveal";

type EventCard = {
  id: string;
  title: string;
  category: string;
  startsAt: Date | string;
  endsAt: Date | string;
  status: string;
  location: string;
  capacity: number;
  coverUrl: string | null;
  organization: { name: string };
  attendees?: AttendeePreview[];
  attendeeTotal?: number;
};

function formatShortDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function FeaturedEvents({ events }: { events: EventCard[] }) {
  const t = await getTranslations("Event");
  const tHome = await getTranslations("Home");
  const tl = await getTranslations("Landing");

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <Reveal>
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            {tl("featuredTitle")}
          </h2>
          <p className="text-muted-foreground mt-2">{tl("featuredSubtitle")}</p>
        </div>
      </Reveal>

      {events.length === 0 ? (
        <Reveal delay={1}>
          <div className="glass rounded-2xl py-20 text-center">
            <CalendarDays className="text-muted-foreground mx-auto mb-4 size-12 opacity-40" />
            <p className="text-muted-foreground">{t("empty")}</p>
            <Link
              href="/events"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
            >
              {tHome("exploreEvents")}
            </Link>
          </div>
        </Reveal>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, i) => {
            const total = event.attendeeTotal ?? 0;
            const spots = event.capacity - total;
            const finished =
              event.status === "FINISHED" ||
              new Date(event.endsAt) < new Date();
            const cover = coverSrc(event.coverUrl);
            const card = (
              <div
                className={cn(
                  "event-card-border relative flex h-full min-h-80 flex-col overflow-hidden rounded-3xl border border-white/15 bg-linear-to-br from-emerald-700 to-emerald-950 shadow-sm",
                  finished && "opacity-75 grayscale-35",
                )}
              >
                {/* Cover image (event photo or the green fallback graphic). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cover}
                  alt=""
                  className="absolute inset-0 size-full object-cover object-center"
                  loading="lazy"
                />
                {/* Readability scrim — darkest at the bottom, where text sits. */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/5"
                />

                <div className="relative z-10 flex flex-1 flex-col p-5 text-white">
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

                  <h3 className="mt-auto line-clamp-2 text-xl font-bold">
                    {event.title}
                  </h3>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-white/90">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="size-4 shrink-0" aria-hidden />
                      {formatShortDate(event.startsAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-4 shrink-0" aria-hidden />
                      {formatTime(event.startsAt)}
                    </span>
                    <span className="flex min-w-0 items-center gap-1.5">
                      <MapPin className="size-4 shrink-0" aria-hidden />
                      <span className="truncate">{event.location}</span>
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    {total > 0 ? (
                      <AttendeeAvatars
                        people={event.attendees ?? []}
                        total={total}
                        size="size-6"
                      />
                    ) : (
                      <span className="text-xs font-medium text-white/70">
                        {spots > 0 ? t("spotsLeft", { count: spots }) : t("full")}
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

            return (
              <Reveal key={event.id} delay={Math.min(i, 3) as 0 | 1 | 2 | 3}>
                {finished ? (
                  <div className="block cursor-default select-none">{card}</div>
                ) : (
                  <Link href={`/events/${event.id}`} className="group block">
                    {card}
                  </Link>
                )}
              </Reveal>
            );
          })}
        </div>
      )}

      <Reveal delay={2}>
        <div className="mt-10 text-center">
          <Link
            href="/events"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            {tHome("exploreEvents")}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
