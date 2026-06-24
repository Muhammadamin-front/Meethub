import { unstable_cache } from "next/cache";
import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrgStatus, RegistrationStatus } from "@/generated/prisma/client";
import { XP_PER_ATTENDED } from "@/lib/constants";
import { displayName } from "@/lib/utils";
import { prisma } from "@/server/db";

const ACTIVE = [RegistrationStatus.JOINED, RegistrationStatus.ATTENDED];

function rankLabel(i: number) {
  return i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : String(i + 1);
}

// Leaderboard data is global (not per-user) and a bit expensive to aggregate,
// so cache it for 60s instead of recomputing on every request.
const getLeaderboardData = unstable_cache(
  async () => {
    // Members ranked by XP earned from attended events.
    const attended = await prisma.registration.groupBy({
      by: ["userId"],
      where: { status: RegistrationStatus.ATTENDED },
      _count: true,
    });
    const topAttended = [...attended]
      .sort((a, b) => b._count - a._count)
      .slice(0, 10);
    const memberUsers = topAttended.length
      ? await prisma.user.findMany({
          where: { id: { in: topAttended.map((r) => r.userId) } },
          select: { id: true, name: true, imageUrl: true },
        })
      : [];
    const userById = new Map(memberUsers.map((u) => [u.id, u]));
    const members = topAttended.flatMap((row) => {
      const u = userById.get(row.userId);
      return u
        ? [{ ...u, attended: row._count, xp: row._count * XP_PER_ATTENDED }]
        : [];
    });

    // Organizers ranked by participants gathered across their events.
    const [events, orgs, regCounts] = await Promise.all([
      prisma.event.findMany({ select: { id: true, organizationId: true } }),
      prisma.organization.findMany({
        where: { status: OrgStatus.VERIFIED },
        select: { id: true, name: true },
      }),
      prisma.registration.groupBy({
        by: ["eventId"],
        where: { status: { in: ACTIVE } },
        _count: true,
      }),
    ]);
    const regByEvent = new Map(regCounts.map((r) => [r.eventId, r._count]));
    const orgStats = new Map<
      string,
      { events: number; participants: number }
    >();
    for (const e of events) {
      const s = orgStats.get(e.organizationId) ?? {
        events: 0,
        participants: 0,
      };
      s.events += 1;
      s.participants += regByEvent.get(e.id) ?? 0;
      orgStats.set(e.organizationId, s);
    }
    const organizers = orgs
      .map((o) => ({
        ...o,
        ...(orgStats.get(o.id) ?? { events: 0, participants: 0 }),
      }))
      .sort((a, b) => b.participants - a.participants || b.events - a.events)
      .slice(0, 10);

    return { members, organizers };
  },
  ["leaderboard"],
  { revalidate: 60 },
);

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Leaderboard");

  const { members, organizers } = await getLeaderboardData();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground mt-1">{t("subtitle")}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("membersTitle")}</CardTitle>
            <CardDescription>{t("membersSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("empty")}</p>
            ) : (
              <ol className="divide-y">
                {members.map((m, i) => (
                  <li key={m.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-6 text-center text-sm font-semibold">
                      {rankLabel(i)}
                    </span>
                    <div className="bg-muted size-8 shrink-0 overflow-hidden rounded-full">
                      {m.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.imageUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      )}
                    </div>
                    <span className="flex-1 truncate font-medium">
                      {displayName(m.name)}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {t("attended", { count: m.attended })}
                    </span>
                    <span className="text-primary font-semibold tabular-nums">
                      {t("xp", { xp: m.xp })}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("organizersTitle")}</CardTitle>
            <CardDescription>{t("organizersSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            {organizers.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("empty")}</p>
            ) : (
              <ol className="divide-y">
                {organizers.map((o, i) => (
                  <li key={o.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-6 text-center text-sm font-semibold">
                      {rankLabel(i)}
                    </span>
                    <span className="flex-1 truncate font-medium">
                      {o.name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {t("events", { count: o.events })}
                    </span>
                    <span className="text-primary font-semibold tabular-nums">
                      {t("participants", { count: o.participants })}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
