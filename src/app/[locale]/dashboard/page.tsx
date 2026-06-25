import { getTranslations, setRequestLocale } from "next-intl/server";

import { AvatarUploader } from "@/components/avatar-uploader";
import { BadgesSection } from "@/components/badges-section";
import { NameEditor } from "@/components/name-editor";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import {
  EventStatus,
  OrgStatus,
  RegistrationStatus,
} from "@/generated/prisma/client";
import { Link } from "@/i18n/navigation";
import { displayName, formatEventRange } from "@/lib/utils";
import { computeXp } from "@/lib/xp";
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

  // XP is derived from the user's attended events (+ a streak bonus), so we
  // load the event dates and compute it the same way the leaderboard does.
  const attendedRegs = await prisma.registration.findMany({
    where: { userId: user.id, status: RegistrationStatus.ATTENDED },
    select: { event: { select: { startsAt: true } } },
  });
  const xp = computeXp(attendedRegs.map((r) => r.event.startsAt));

  const reviewCount = await prisma.review.count({ where: { userId: user.id } });

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
          <p className="text-2xl font-semibold">{xp.attended}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-sm">{t("Dashboard.xp")}</p>
          <p className="text-primary text-2xl font-semibold">{xp.total}</p>
          {xp.streakBonus > 0 && (
            <p className="text-muted-foreground text-xs">
              {t("Dashboard.xpBreakdown", {
                base: xp.base,
                bonus: xp.streakBonus,
              })}
            </p>
          )}
        </div>
        <div>
          <p className="text-muted-foreground text-sm">
            {t("Dashboard.streak")}
          </p>
          <p className="text-2xl font-semibold">
            🔥 {t("Dashboard.streakDays", { count: xp.currentStreak })}
          </p>
          {xp.longestStreak > 1 && (
            <p className="text-muted-foreground text-xs">
              {t("Dashboard.streakBest", { count: xp.longestStreak })}
            </p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-4">
          <div className="text-right">
            <NameEditor
              currentName={user.name}
              display={displayName(user.name)}
              isEmailName={!!user.email && user.name === user.email}
            />
            {user.email && (
              <p className="text-muted-foreground text-sm">{user.email}</p>
            )}
          </div>
          <AvatarUploader currentUrl={user.imageUrl} name={user.name} />
        </div>
      </section>

      <BadgesSection
        attended={xp.attended}
        longestStreak={xp.longestStreak}
        reviews={reviewCount}
        organized={ownedEvents.length}
        reputation={user.reputation}
        verifiedOrg={org?.status === OrgStatus.VERIFIED}
      />

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
