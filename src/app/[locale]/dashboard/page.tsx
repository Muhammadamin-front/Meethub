import { getTranslations, setRequestLocale } from "next-intl/server";

import { AvatarUploader } from "@/components/avatar-uploader";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import {
  EventStatus,
  OrgStatus,
  RegistrationStatus,
} from "@/generated/prisma/client";
import { Link } from "@/i18n/navigation";
import { XP_PER_ATTENDED } from "@/lib/constants";
import { displayName, formatEventRange } from "@/lib/utils";
import { getOwnedOrganization, requireUser } from "@/server/auth";
import { prisma } from "@/server/db";

const ACTIVE = [RegistrationStatus.JOINED, RegistrationStatus.ATTENDED];

const STATUS_KEY = {
  [EventStatus.DRAFT]: "draft",
  [EventStatus.PUBLISHED]: "published",
  [EventStatus.CANCELLED]: "cancelled",
  [EventStatus.FINISHED]: "finished",
} as const;

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser();
  const t = await getTranslations();
  const org = await getOwnedOrganization();

  const ownedEvents = org
    ? await prisma.event.findMany({
        where: { organizationId: org.id },
        orderBy: { startsAt: "desc" },
      })
    : [];

  const joined = await prisma.registration.findMany({
    where: { userId: user.id, status: { in: ACTIVE } },
    include: {
      event: { include: { organization: { select: { name: true } } } },
    },
    orderBy: { joinedAt: "desc" },
  });

  const attendedCount = await prisma.registration.count({
    where: { userId: user.id, status: RegistrationStatus.ATTENDED },
  });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-12 px-4 py-12 sm:px-6">
      <section className="flex flex-wrap items-center gap-8 rounded-xl border p-6">
        <div>
          <p className="text-muted-foreground text-sm">
            {t("Dashboard.reputation")}
          </p>
          <p className="text-2xl font-semibold">{user.reputation}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">
            {t("Dashboard.attendedLabel")}
          </p>
          <p className="text-2xl font-semibold">{attendedCount}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">{t("Dashboard.xp")}</p>
          <p className="text-primary text-2xl font-semibold">
            {attendedCount * XP_PER_ATTENDED}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right">
            <p className="font-medium">{displayName(user.name)}</p>
            {user.email && (
              <p className="text-muted-foreground text-sm">{user.email}</p>
            )}
          </div>
          <AvatarUploader currentUrl={user.imageUrl} name={user.name} />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("Dashboard.yourEventsTitle")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {org
                ? t("Dashboard.yourEventsSubtitle")
                : t("Dashboard.becomeOrganizer")}
            </p>
          </div>
          {org?.status === OrgStatus.VERIFIED ? (
            <Link href="/events/new" className={buttonVariants({ size: "sm" })}>
              {t("Dashboard.createEvent")}
            </Link>
          ) : !org ? (
            <Link
              href="/organizations/apply"
              className={buttonVariants({ size: "sm" })}
            >
              {t("Org.becomeOrganizer")}
            </Link>
          ) : null}
        </div>

        {org && ownedEvents.length === 0 && (
          <p className="text-muted-foreground mt-6">
            {t("Dashboard.noEvents")}
          </p>
        )}
        {org && ownedEvents.length > 0 && (
          <div className="mt-6 space-y-3">
            {ownedEvents.map((e) => (
              <Card key={e.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/events/${e.id}`}
                      className="font-medium hover:underline"
                    >
                      {e.title}
                    </Link>
                    <Badge variant="secondary">
                      {t(`Event.status.${STATUS_KEY[e.status]}`)}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {formatEventRange(e.startsAt, e.endsAt, locale)}
                  </p>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">
          {t("Dashboard.joinedTitle")}
        </h2>
        {joined.length === 0 ? (
          <p className="text-muted-foreground mt-6">
            {t("Dashboard.noJoined")}
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {joined.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <Link
                    href={`/events/${r.event.id}`}
                    className="font-medium hover:underline"
                  >
                    {r.event.title}
                  </Link>
                  <p className="text-muted-foreground text-sm">
                    {t("Event.by", { org: r.event.organization.name })} ·{" "}
                    {formatEventRange(r.event.startsAt, r.event.endsAt, locale)}
                  </p>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
