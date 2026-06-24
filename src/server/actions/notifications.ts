"use server";

import { requireUser } from "@/server/auth";
import { prisma } from "@/server/db";

/** Mark all of the current user's notifications as read. */
export async function markAllNotificationsRead() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
}
