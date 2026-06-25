import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { DmThread } from "@/components/dm-thread";
import { UserAvatar } from "@/components/user-avatar";
import { serializeDM } from "@/lib/social";
import { Link } from "@/i18n/navigation";
import { displayName } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const me = await requireUser();

  const convo = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      userA: { select: { id: true, name: true, imageUrl: true } },
      userB: { select: { id: true, name: true, imageUrl: true } },
    },
  });
  // 404 if missing or the current user isn't a participant.
  if (!convo || (convo.userA.id !== me.id && convo.userB.id !== me.id)) {
    notFound();
  }
  const other = convo.userA.id === me.id ? convo.userB : convo.userA;

  const rows = await prisma.directMessage.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  // Mark incoming messages as read on open.
  await prisma.directMessage.updateMany({
    where: { conversationId: id, senderId: { not: me.id }, readAt: null },
    data: { readAt: new Date() },
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/messages"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <Link href={`/u/${other.id}`} className="flex items-center gap-2">
          <UserAvatar
            name={displayName(other.name)}
            imageUrl={other.imageUrl}
            className="size-9"
          />
          <span className="font-semibold">{displayName(other.name)}</span>
        </Link>
      </div>

      <DmThread
        conversationId={convo.id}
        currentUserId={me.id}
        initialMessages={rows.map(serializeDM)}
      />
    </div>
  );
}
