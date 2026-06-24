import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChatRoom } from "@/components/chat-room";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
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
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">{access.event.title}</p>
        </div>
        <Link
          href={`/events/${id}`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          {t("backToEvent")}
        </Link>
      </div>

      <div className="mt-6">
        <ChatRoom
          eventId={id}
          canWrite={access.canWrite}
          currentUserId={access.user.id}
          initialMessages={rows.map(serializeMessage)}
        />
      </div>
    </div>
  );
}
