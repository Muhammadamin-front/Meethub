import { Building2, MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AttendeeAvatars } from "@/components/attendee-avatars";
import { EventCountdown } from "@/components/event-countdown";
import { EventGallery } from "@/components/event-gallery";
import { EventJoinButton } from "@/components/event-join-button";
import { EventManageActions } from "@/components/event-manage-actions";
import { EventReviews } from "@/components/event-reviews";
import { LocationView } from "@/components/location-view";
import { ShareButtons } from "@/components/share-buttons";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  EventStatus,
  RegistrationStatus,
  UserRole,
} from "@/generated/prisma/client";
import { Link } from "@/i18n/navigation";
import { formatEventRange, mapsUrl } from "@/lib/utils";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";

const ACTIVE: RegistrationStatus[] = [
  RegistrationStatus.JOINED,
  RegistrationStatus.ATTENDED,
];

const STATUS_KEY = {
  [EventStatus.DRAFT]: "draft",
  [EventStatus.PUBLISHED]: "published",
  [EventStatus.CANCELLED]: "cancelled",
  [EventStatus.FINISHED]: "finished",
} as const;

/**
 * Shared event detail content. Rendered both by the full page
 * (events/[id]) and the intercepted modal (@modal/(.)events/[id]).
 */
export async function EventDetail({
  locale,
  id,
}: {
  locale: string;
  id: string;
}) {
  setRequestLocale(locale);
  const t = await getTranslations("Event");

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      organization: { select: { id: true, name: true, ownerUserId: true } },
    },
  });
  if (!event) notFound();

  const user = await getCurrentUser();
  const [used, attendeeSample] = await Promise.all([
    prisma.registration.count({
      where: { eventId: id, status: { in: ACTIVE } },
    }),
    prisma.registration.findMany({
      where: { eventId: id, status: { in: ACTIVE } },
      select: { user: { select: { name: true, imageUrl: true } } },
      orderBy: { joinedAt: "asc" },
      take: 8,
    }),
  ]);
  const left = Math.max(0, event.capacity - used);

  const canManage =
    !!user &&
    (user.role === UserRole.ADMIN ||
      event.organization.ownerUserId === user.id);

  const myReg = user
    ? await prisma.registration.findUnique({
        where: { eventId_userId: { eventId: id, userId: user.id } },
      })
    : null;
  const joined = !!myReg && ACTIVE.includes(myReg.status);

  // Reviews open once the event has ended; participants can rate it.
  const finished =
    event.status === EventStatus.FINISHED || event.endsAt < new Date();
  const canReview = finished && joined && !canManage;

  const media = await prisma.eventMedia.findMany({
    where: { eventId: id },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: { id: true, url: true, type: true },
  });

  return (
    <>
      {event.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.coverUrl}
          alt=""
          className="mb-8 aspect-video w-full rounded-xl object-cover"
        />
      )}

      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{event.title}</h1>
        {event.status !== EventStatus.PUBLISHED && (
          <Badge variant="secondary">
            {t(`status.${STATUS_KEY[event.status]}`)}
          </Badge>
        )}
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-sm">
        <Building2 className="text-primary size-4" aria-hidden />
        <span className="font-medium">{event.organization.name}</span>
      </p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <Info label={t("when")}>
          {formatEventRange(event.startsAt, event.endsAt, locale)}
          {event.status === EventStatus.PUBLISHED && (
            <EventCountdown
              startsAt={event.startsAt}
              endsAt={event.endsAt}
              showLabel
              className="mt-1.5 flex w-fit"
            />
          )}
        </Info>
        <Info label={t("where")}>
          {/* Tapping the location opens the phone's map app (Google/Apple Maps). */}
          <a
            href={mapsUrl(event.location, event.latitude, event.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex items-start gap-1.5 hover:underline"
          >
            <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{event.location}</span>
          </a>
        </Info>
        <Info label={t("categoryLabel")}>
          <Badge variant="secondary">{event.category}</Badge>
        </Info>
        <Info label={t("capacityLabel")}>
          {t("participants", { count: used })} ·{" "}
          {left > 0 ? t("spotsLeft", { count: left }) : t("full")}
        </Info>
      </dl>

      <div className="mt-8 text-sm leading-7 whitespace-pre-wrap">
        {event.description}
      </div>

      {event.latitude != null && event.longitude != null && (
        <div className="mt-8 space-y-3">
          <LocationView lat={event.latitude} lng={event.longitude} />
          <a
            href={mapsUrl(event.location, event.latitude, event.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <MapPin className="size-4" aria-hidden />
            {t("openInMaps")}
          </a>
        </div>
      )}

      <div className="mt-8">
        {canManage ? (
          <EventManageActions eventId={event.id} status={event.status} />
        ) : event.status === EventStatus.PUBLISHED ? (
          user ? (
            <EventJoinButton
              eventId={event.id}
              joined={joined}
              disabled={!joined && left <= 0}
            />
          ) : (
            <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
              {t("signInToJoin")}
            </Link>
          )
        ) : null}
        {joined && !canManage && (
          <p className="text-muted-foreground mt-2 text-sm">{t("joined")}</p>
        )}
      </div>

      {(canManage || joined) && (
        <div className="mt-4">
          <Link
            href={`/events/${event.id}/chat`}
            className={buttonVariants({ variant: "outline" })}
          >
            {t("openChat")}
          </Link>
        </div>
      )}

      {used > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium">{t("whosGoing", { count: used })}</p>
          <div className="mt-2">
            <AttendeeAvatars
              people={attendeeSample.map((r) => r.user)}
              total={used}
              size="size-9"
            />
          </div>
        </div>
      )}

      <ShareButtons title={event.title} />

      <EventGallery
        eventId={event.id}
        items={media}
        canUpload={canManage || joined}
      />

      <EventReviews
        eventId={event.id}
        finished={finished}
        canReview={canReview}
        userId={user?.id ?? null}
      />
    </>
  );
}

function Info({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}
