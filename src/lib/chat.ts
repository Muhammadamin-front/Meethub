import type { MessageType } from "@/generated/prisma/client";

/** Serializable chat message sent to the client + over Pusher. */
export type ChatMessage = {
  id: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: "TEXT" | "IMAGE" | "VIDEO";
  createdAt: string;
  user: { id: string; name: string; imageUrl: string | null };
};

export type MessageRow = {
  id: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: MessageType;
  createdAt: Date;
  user: { id: string; name: string; imageUrl: string | null };
};

export function serializeMessage(m: MessageRow): ChatMessage {
  return {
    id: m.id,
    content: m.content,
    mediaUrl: m.mediaUrl,
    mediaType: m.mediaType,
    createdAt: m.createdAt.toISOString(),
    user: m.user,
  };
}
