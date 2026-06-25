import "server-only";

import type { NotificationType } from "@/generated/prisma/client";
import { prisma } from "@/server/db";
import { pusherServer } from "@/server/pusher";

/** Notification types that have in-app UI rendering (subset of the DB enum). */
export type NotificationView = {
  id: string;
  type:
    | "ATTENDANCE_MARKED"
    | "ORG_APPROVED"
    | "ORG_REJECTED"
    | "BLOCKED"
    | "FRIEND_REQUEST"
    | "FRIEND_ACCEPTED";
  data: Record<string, string>;
  isRead: boolean;
  createdAt: string;
};

type NotificationRow = {
  id: string;
  type: NotificationType;
  data: unknown;
  isRead: boolean;
  createdAt: Date;
};

export function userChannel(userId: string) {
  return `private-user-${userId}`;
}

export function serializeNotification(n: NotificationRow): NotificationView {
  return {
    id: n.id,
    type: n.type as NotificationView["type"],
    data: (n.data as Record<string, string>) ?? {},
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

/**
 * Create an in-app notification and push it to the user's private channel.
 * `title`/`body` are an English fallback (also used for email); the in-app UI
 * localizes from `type` + `data`.
 */
export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  const n = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: input.data ?? {},
    },
  });

  try {
    await pusherServer.trigger(
      userChannel(input.userId),
      "new-notification",
      serializeNotification(n),
    );
  } catch (err) {
    console.error("Notification push failed:", err);
  }

  return n;
}

/** Recent notifications + unread count for a user (header bell). */
export async function getMyNotifications(userId: string) {
  const [rows, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { items: rows.map(serializeNotification), unread };
}
