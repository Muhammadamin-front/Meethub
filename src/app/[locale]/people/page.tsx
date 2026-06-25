import { getTranslations, setRequestLocale } from "next-intl/server";

import { FriendButton, RemoveFriendButton } from "@/components/friend-button";
import { MessageButton } from "@/components/message-button";
import { UserAvatar } from "@/components/user-avatar";
import { UserSearch } from "@/components/user-search";
import { FriendStatus } from "@/generated/prisma/client";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";

export default async function PeoplePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Social");
  const me = await requireUser();

  const [incoming, friendships] = await Promise.all([
    prisma.friendship.findMany({
      where: { addresseeId: me.id, status: FriendStatus.PENDING },
      select: {
        requester: { select: { id: true, name: true, imageUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendship.findMany({
      where: {
        status: FriendStatus.ACCEPTED,
        OR: [{ requesterId: me.id }, { addresseeId: me.id }],
      },
      select: {
        requester: { select: { id: true, name: true, imageUrl: true } },
        addressee: { select: { id: true, name: true, imageUrl: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  // Resolve "the other person" in each accepted friendship.
  const friends = friendships.map((f) =>
    f.requester.id === me.id ? f.addressee : f.requester,
  );

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>

      <div className="mt-6">
        <UserSearch />
      </div>

      {/* Friend requests */}
      {incoming.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            {t("requests")} ({incoming.length})
          </h2>
          <ul className="divide-border mt-3 divide-y rounded-lg border">
            {incoming.map(({ requester }) => (
              <li
                key={requester.id}
                className="flex items-center justify-between gap-3 p-3"
              >
                <Link
                  href={`/u/${requester.id}`}
                  className="flex min-w-0 items-center gap-3"
                >
                  <UserAvatar name={requester.name} imageUrl={requester.imageUrl} />
                  <span className="truncate font-medium">{requester.name}</span>
                </Link>
                <FriendButton targetId={requester.id} state="incoming" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Friends */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          {t("friendsList")} ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <p className="text-muted-foreground mt-3 text-sm">{t("noFriends")}</p>
        ) : (
          <ul className="divide-border mt-3 divide-y rounded-lg border">
            {friends.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between gap-3 p-3"
              >
                <Link
                  href={`/u/${u.id}`}
                  className="flex min-w-0 items-center gap-3"
                >
                  <UserAvatar name={u.name} imageUrl={u.imageUrl} />
                  <span className="truncate font-medium">{u.name}</span>
                </Link>
                <div className="flex items-center gap-1">
                  <MessageButton targetId={u.id} />
                  <RemoveFriendButton targetId={u.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
