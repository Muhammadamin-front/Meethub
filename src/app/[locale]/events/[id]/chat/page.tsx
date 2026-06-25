import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChatModal } from "@/components/chat-modal";
import { ChatRoom } from "@/components/chat-room";
import { serializeMessage } from "@/lib/chat";
import { getEventAccess } from "@/server/auth";
import { prisma } from "@/server/db";

export default async function EventChatPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // Members-only; non-members get a 404 (don't reveal the chat exists).
  const access = await getEventAccess(id);
  if (!access || !access.canRead) notFound();
  const t = await getTranslations("Chat");

  const rows = await prisma.message.findMany({
    where: { eventId: id },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: { user: { select: { id: true, name: true, imageUrl: true } } },
  });

  return (
    <ChatModal eventId={id} title={t("title")} subtitle={access.event.title}>
      <ChatRoom
        eventId={id}
        canWrite={access.canWrite}
        currentUserId={access.user.id}
        initialMessages={rows.map(serializeMessage)}
      />
    </ChatModal>
  );
}
