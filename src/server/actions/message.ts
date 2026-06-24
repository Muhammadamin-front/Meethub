"use server";

import { MessageType } from "@/generated/prisma/client";
import { serializeMessage, type ChatMessage } from "@/lib/chat";
import {
  validateUpload,
  type UploadError,
  type UploadInfo,
} from "@/lib/cloudinary";
import { getEventAccess } from "@/server/auth";
import { prisma } from "@/server/db";
import { triggerNewMessage } from "@/server/pusher";
import { rateLimit } from "@/server/rate-limit";

const MAX_LENGTH = 2000;

const MESSAGE_INCLUDE = {
  user: { select: { id: true, name: true, imageUrl: true } },
} as const;

export type TextSendResult = {
  message?: ChatMessage;
  error?: "forbidden" | "blocked" | "empty" | "tooLong" | "rateLimited";
};

export type MediaSendResult = {
  message?: ChatMessage;
  error?: "forbidden" | "blocked" | "rateLimited" | UploadError;
};

/**
 * Post a text message to an event's chat. Membership + block state are enforced
 * server-side (never trust the client). Returns the created message so the
 * sender can render it immediately; the Pusher broadcast handles other clients.
 */
export async function sendMessage(
  eventId: string,
  content: string,
): Promise<TextSendResult> {
  const access = await getEventAccess(eventId);
  if (!access || !access.canRead) return { error: "forbidden" };
  if (!access.canWrite) return { error: "blocked" };
  if (!rateLimit(`msg:${access.user.id}`, 15, 10_000)) {
    return { error: "rateLimited" };
  }

  const text = content.trim();
  if (!text) return { error: "empty" };
  if (text.length > MAX_LENGTH) return { error: "tooLong" };

  const row = await prisma.message.create({
    data: {
      eventId,
      userId: access.user.id,
      content: text,
      mediaType: MessageType.TEXT,
    },
    include: MESSAGE_INCLUDE,
  });

  const message = serializeMessage(row);
  await triggerNewMessage(eventId, message);
  return { message };
}

/** Post an image/video message to an event's chat. */
export async function sendMediaMessage(
  eventId: string,
  info: UploadInfo,
): Promise<MediaSendResult> {
  const access = await getEventAccess(eventId);
  if (!access || !access.canRead) return { error: "forbidden" };
  if (!access.canWrite) return { error: "blocked" };
  if (!rateLimit(`msg:${access.user.id}`, 15, 10_000)) {
    return { error: "rateLimited" };
  }

  const err = validateUpload(info, "both");
  if (err) return { error: err };

  const row = await prisma.message.create({
    data: {
      eventId,
      userId: access.user.id,
      mediaUrl: info.url,
      mediaType:
        info.resourceType === "video" ? MessageType.VIDEO : MessageType.IMAGE,
    },
    include: MESSAGE_INCLUDE,
  });

  const message = serializeMessage(row);
  await triggerNewMessage(eventId, message);
  return { message };
}
