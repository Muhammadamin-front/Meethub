import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { FriendButton } from "@/components/friend-button";
import { MessageButton } from "@/components/message-button";
import { UserAvatar } from "@/components/user-avatar";
import { buttonVariants } from "@/components/ui/button";
import { OrgStatus, RegistrationStatus } from "@/generated/prisma/client";
import { Link } from "@/i18n/navigation";
import { computeBadges } from "@/lib/badges";
import { computeXp } from "@/lib/xp";
import { getCurrentUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { friendCount, getFriendState } from "@/server/social";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Profile");
  const tb = await getTranslations("Badges");

  const me = await getCurrentUser();
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      imageUrl: true,
      reputation: true,
      createdAt: true,
      organization: { select: { status: true } },
    },
  });
  if (!user) notFound();

  const [attendedRegs, reviews, organized, friends, friendState] =
    await Promise.all([
      prisma.registration.findMany({
        where: { userId: id, status: RegistrationStatus.ATTENDED },
        select: {
          id: true,
          event: {
            select: { id: true, title: true, startsAt: true, category: true },
          },
        },
        orderBy: { event: { startsAt: "desc" } },
        take: 50,
      }),
      prisma.review.count({ where: { userId: id } }),
      prisma.event.count({ where: { organization: { ownerUserId: id } } }),
      friendCount(id),
      getFriendState(me?.id ?? null, id),
    ]);

  const xp = computeXp(attendedRegs.map((r) => r.event.startsAt));
  const badges = computeBadges({
    attended: xp.attended,
    longestStreak: xp.longestStreak,
    reviews,
    organized,
    reputation: user.reputation,
    verifiedOrg: user.organization?.status === OrgStatus.VERIFIED,
  }).filter((b) => b.earned);

  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <UserAvatar
          name={user.name}
          imageUrl={user.imageUrl}
          className="size-20 text-2xl"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("memberSince", { date: dateFmt.format(user.createdAt) })} ·{" "}
            {t("friendsCount", { count: friends })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {me ? (
              friendState !== "self" && (
                <>
                  <FriendButton targetId={id} state={friendState} />
                  <MessageButton targetId={id} />
                </>
              )
            ) : (
              <Link
                href="/sign-up"
                className={buttonVariants({ size: "sm" })}
              >
                {t("signInToConnect")}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-3 gap-3">
        <Stat label={t("xp")} value={xp.total} />
        <Stat label={t("attended")} value={xp.attended} />
        <Stat label={t("streak")} value={xp.longestStreak} />
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            {t("badges")}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {badges.map((b) => (
              <span
                key={b.id}
                className="bg-muted inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm"
                title={tb(`${b.id}.desc`)}
              >
                <span aria-hidden>{b.emoji}</span>
                {tb(`${b.id}.title`)}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Attended events */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          {t("attendedEvents")}
        </h2>
        {attendedRegs.length === 0 ? (
          <p className="text-muted-foreground mt-3 text-sm">{t("noEvents")}</p>
        ) : (
          <ul className="divide-border mt-3 divide-y rounded-lg border">
            {attendedRegs.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/events/${r.event.id}`}
                  className="hover:bg-accent flex items-center justify-between gap-3 p-3 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {r.event.title}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {r.event.category}
                    </span>
                  </span>
                  <span className="text-muted-foreground shrink-0 text-sm">
                    {dateFmt.format(r.event.startsAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card/50 rounded-xl border p-4 text-center">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-muted-foreground mt-0.5 text-xs">{label}</p>
    </div>
  );
}
