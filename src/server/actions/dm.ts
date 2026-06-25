"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

import { conversationPair, serializeDM, type DMView } from "@/lib/social";
import { isUserBlocked, requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { userChannel } from "@/server/notifications";
import { pusherServer } from "@/server/pusher";
import { rateLimit } from "@/server/rate-limit";

const MAX_LENGTH = 2000;

export type DMSendResult = {
  message?: DMView;
  error?: "forbidden" | "blocked" | "empty" | "tooLong" | "rateLimited";
};

/** Get (or create) the 1:1 conversation with a user and open it. */
export async function openConversation(targetUserId: string): Promise<void> {
  const me = await requireUser();
  const locale = await getLocale();
  if (targetUserId === me.id) redirect(`/${locale}/messages`);

  const pair = conversationPair(me.id, targetUserId);
  const convo = await prisma.conversation.upsert({
    where: { userAId_userBId: pair },
    create: pair,
    update: {},
  });
  redirect(`/${locale}/messages/${convo.id}`);
}

/** Send a text DM. Membership is verified server-side. */
export async function sendDirectMessage(
  conversationId: string,
  content: string,
): Promise<DMSendResult> {
  const me = await requireUser();
  if (isUserBlocked(me)) return { error: "blocked" };
  if (!rateLimit(`dm:${me.id}`, 20, 10_000)) return { error: "rateLimited" };

  const text = content.trim();
  if (!text) return { error: "empty" };
  if (text.length > MAX_LENGTH) return { error: "tooLong" };

  const convo = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { userAId: true, userBId: true },
  });
  if (!convo || (convo.userAId !== me.id && convo.userBId !== me.id)) {
    return { error: "forbidden" };
  }

  const row = await prisma.directMessage.create({
    data: { conversationId, senderId: me.id, content: text },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { lastMessageAt: row.createdAt },
  });

  const message = serializeDM(row);
  // Deliver to the other participant's private user channel (already auth'd).
  const otherId = convo.userAId === me.id ? convo.userBId : convo.userAId;
  try {
    await pusherServer.trigger(userChannel(otherId), "new-dm", message);
  } catch {
    // Realtime is best-effort; the message is already persisted.
  }
  return { message };
}

/** Mark all incoming messages in a conversation as read. */
export async function markConversationRead(conversationId: string) {
  const me = await requireUser();
  await prisma.directMessage.updateMany({
    where: { conversationId, senderId: { not: me.id }, readAt: null },
    data: { readAt: new Date() },
  });
  return {};
}
