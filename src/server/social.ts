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
