import { getTranslations, setRequestLocale } from "next-intl/server";

import { UserAvatar } from "@/components/user-avatar";
import { Link } from "@/i18n/navigation";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Messages");
  const me = await requireUser();

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ userAId: me.id }, { userBId: me.id }] },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
    select: {
      id: true,
      lastMessageAt: true,
      userA: { select: { id: true, name: true, imageUrl: true } },
      userB: { select: { id: true, name: true, imageUrl: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, senderId: true },
      },
    },
  });

  // Unread counts per conversation (incoming + unread).
  const unreadGroups = await prisma.directMessage.groupBy({
    by: ["conversationId"],
    where: {
      conversationId: { in: conversations.map((c) => c.id) },
      senderId: { not: me.id },
      readAt: null,
    },
    _count: { _all: true },
  });
  const unread = new Map(
    unreadGroups.map((g) => [g.conversationId, g._count._all]),
  );

  const timeFmt = new Intl.DateTimeFormat(locale, { timeStyle: "short" });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>

      {conversations.length === 0 ? (
        <p className="text-muted-foreground mt-6 text-sm">{t("inboxEmpty")}</p>
      ) : (
        <ul className="divide-border mt-6 divide-y rounded-lg border">
          {conversations.map((c) => {
            const other = c.userA.id === me.id ? c.userB : c.userA;
            const last = c.messages[0];
            const count = unread.get(c.id) ?? 0;
            return (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className="hover:bg-accent flex items-center gap-3 p-3 transition-colors"
                >
                  <UserAvatar name={other.name} imageUrl={other.imageUrl} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{other.name}</span>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {timeFmt.format(c.lastMessageAt)}
                      </span>
                    </span>
                    <span className="text-muted-foreground block truncate text-sm">
                      {last
                        ? `${last.senderId === me.id ? `${t("you")}: ` : ""}${last.content}`
                        : t("noMessagesYet")}
                    </span>
                  </span>
                  {count > 0 && (
                    <span className="bg-primary text-primary-foreground grid size-5 shrink-0 place-items-center rounded-full text-xs font-medium">
                      {count}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
