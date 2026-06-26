"use server";

import { getCurrentUser, requireUser } from "@/server/auth";
import { prisma } from "@/server/db";
import { getMyNotifications } from "@/server/notifications";

/**
 * Recent notifications + unread count for the current user. Called from the
 * header bell after paint so these two queries never block the layout's render
 * on every navigation / locale switch.
 */
export async function getNotifications() {
  const user = await getCurrentUser();
  if (!user) return { items: [], unread: 0 };
  return getMyNotifications(user.id);
}

/** Mark all of the current user's notifications as read. */
export async function markAllNotificationsRead() {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
}
