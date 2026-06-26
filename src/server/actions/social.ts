"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";

import { FriendStatus, NotificationType } from "@/generated/prisma/client";
import { displayName } from "@/lib/utils";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { createNotification } from "@/server/notifications";
import { rateLimit } from "@/server/rate-limit";

export type PersonResult = {
  id: string;
  name: string;
  nickname?: string | null;
  imageUrl: string | null;
};

export type FriendActionResult = { error?: string };

/** Find users by name (case-insensitive), excluding the current user. */
export async function searchPeople(query: string): Promise<PersonResult[]> {
  const me = await requireUser();
  const q = query.trim();
  if (q.length < 2) return [];
  return prisma.user.findMany({
    where: {
      id: { not: me.id },
      OR: [
        { nickname: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, nickname: true, imageUrl: true },
    take: 20,
    orderBy: { name: "asc" },
  });
}

/** Send a friend request (or auto-accept if the other user already sent one). */
export async function sendFriendRequest(
  targetId: string,
): Promise<FriendActionResult> {
  const me = await requireUser();
  if (targetId === me.id) return { error: "self" };
  if (!rateLimit(`friend:${me.id}`, 30, 60_000)) {
    return { error: "rateLimited" };
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: me.id, addresseeId: targetId },
        { requesterId: targetId, addresseeId: me.id },
      ],
    },
  });

  if (existing) {
    // They already requested me -> accept. Otherwise it's already pending/friends.
    if (
      existing.status === FriendStatus.PENDING &&
      existing.addresseeId === me.id
    ) {
      await prisma.friendship.update({
        where: { id: existing.id },
        data: { status: FriendStatus.ACCEPTED },
      });
      // Tell the original requester their request was accepted.
      await createNotification({
        userId: existing.requesterId,
        type: NotificationType.FRIEND_ACCEPTED,
        title: "Friend request accepted",
        body: `${displayName(me.name)} accepted your friend request`,
        data: { user: displayName(me.name), userId: me.id },
      });
    }
  } else {
    await prisma.friendship.create({
      data: {
        requesterId: me.id,
        addresseeId: targetId,
        status: FriendStatus.PENDING,
      },
    });
    // Notify the recipient of the incoming request.
    await createNotification({
      userId: targetId,
      type: NotificationType.FRIEND_REQUEST,
      title: "New friend request",
      body: `${displayName(me.name)} sent you a friend request`,
      data: { user: displayName(me.name), userId: me.id },
    });
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/u/${targetId}`);
  revalidatePath(`/${locale}/people`);
  return {};
}

/** Accept or decline a pending request the current user received. */
export async function respondFriendRequest(
  requesterId: string,
  accept: boolean,
): Promise<FriendActionResult> {
  const me = await requireUser();
  const fr = await prisma.friendship.findUnique({
    where: {
      requesterId_addresseeId: { requesterId, addresseeId: me.id },
    },
  });
  if (!fr || fr.status !== FriendStatus.PENDING) return { error: "notFound" };

  if (accept) {
    await prisma.friendship.update({
      where: { id: fr.id },
      data: { status: FriendStatus.ACCEPTED },
    });
    // Let the requester know their request was accepted.
    await createNotification({
      userId: requesterId,
      type: NotificationType.FRIEND_ACCEPTED,
      title: "Friend request accepted",
      body: `${displayName(me.name)} accepted your friend request`,
      data: { user: displayName(me.name), userId: me.id },
    });
  } else {
    await prisma.friendship.delete({ where: { id: fr.id } });
  }

  const locale = await getLocale();
  revalidatePath(`/${locale}/people`);
  revalidatePath(`/${locale}/u/${requesterId}`);
  return {};
}

/** Remove a friend, or cancel a request in either direction. */
export async function removeFriend(
  otherId: string,
): Promise<FriendActionResult> {
  const me = await requireUser();
  await prisma.friendship.deleteMany({
    where: {
      OR: [
        { requesterId: me.id, addresseeId: otherId },
        { requesterId: otherId, addresseeId: me.id },
      ],
    },
  });
  const locale = await getLocale();
  revalidatePath(`/${locale}/people`);
  revalidatePath(`/${locale}/u/${otherId}`);
  return {};
}
