import "server-only";

import { FriendStatus } from "@/generated/prisma/client";
import type { FriendState } from "@/lib/social";
import { prisma } from "@/server/db";

/** The viewer's friendship relationship to another user. */
export async function getFriendState(
  meId: string | null,
  otherId: string,
): Promise<FriendState> {
  if (!meId) return "none";
  if (meId === otherId) return "self";
  const fr = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: meId, addresseeId: otherId },
        { requesterId: otherId, addresseeId: meId },
      ],
    },
    select: { requesterId: true, status: true },
  });
  if (!fr) return "none";
  if (fr.status === FriendStatus.ACCEPTED) return "friends";
  return fr.requesterId === meId ? "outgoing" : "incoming";
}

/** Number of accepted friends a user has. */
export function friendCount(userId: string) {
  return prisma.friendship.count({
    where: {
      status: FriendStatus.ACCEPTED,
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
  });
}

/**
 * Conversation ids with at least one unread incoming message for this user.
 * Drives the "unread DMs" badge on the Messages nav item.
 */
export async function getUnreadDmConversationIds(
  userId: string,
): Promise<string[]> {
  const groups = await prisma.directMessage.groupBy({
    by: ["conversationId"],
    where: {
      senderId: { not: userId },
      readAt: null,
      conversation: { OR: [{ userAId: userId }, { userBId: userId }] },
    },
  });
  return groups.map((g) => g.conversationId);
}
