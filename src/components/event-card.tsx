import { CalendarDays, ChevronRight, Clock, MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AttendeeAvatars } from "@/components/attendee-avatars";
import { EventStatus } from "@/generated/prisma/client";
import { Link } from "@/i18n/navigation";
import { coverGradient } from "@/lib/cover";
import { coverSrc } from "@/lib/upload";
import { cn, EVENT_TZ } from "@/lib/utils";
import type { AttendeePreview } from "@/server/attendees";

export type EventCardData = {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  coverUrl: string | null;
  status: EventStatus;
};

/**
 * The green cover-image event card, shared by the events grid and the Following
 * feed so they stay visually identical. Finished events render unclickable.
 */
export async function EventCard({
  event,
  total,
  going,
  locale,
}: {
  event: EventCardData;
  total: number;
  going: AttendeePreview[];
  locale: string;
}) {
  const t = await getTranslations("Event");
  const now = new Date();
  const finished =
    event.status === EventStatus.FINISHED || event.endsAt < now;
  const left = Math.max(0, event.capacity - total);
  const hasPhoto = !!event.coverUrl;
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: EVENT_TZ,
  });
  const timeFmt = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: EVENT_TZ,
  });

  const card = (
    <div
      className={cn(
        "event-card-border relative flex h-full min-h-80 flex-col overflow-hidden rounded-3xl border border-white/15 shadow-sm",
        finished && "opacity-75 grayscale-35",
      )}
      style={hasPhoto ? undefined : { backgroundImage: coverGradient(event.id) }}
    >
      {hasPhoto ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverSrc(event.coverUrl)}
            alt=""
            loading="lazy"
            className="absolute inset-0 size-full object-cover object-center"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-black/5"
          />
        </>
      ) : (
        <>
          {/* Oversized category initial as a subtle watermark. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-8 -right-2 text-[140px] leading-none font-black text-white/10 select-none"
          >
            {event.category.charAt(0).toUpperCase()}
          </span>
          <div
            aria-hidden
            className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-transparent"
          />
        </>
      )}

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
        <p className="mt-1.5 line-clamp-2 text-sm text-white/75">
          {event.description}
        </p>

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

  return finished ? (
    <div className="block cursor-default select-none">{card}</div>
  ) : (
    <Link href={`/events/${event.id}`} className="group block">
      {card}
    </Link>
  );
}
