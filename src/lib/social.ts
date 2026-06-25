/** Pure social/DM helpers and types (safe to import anywhere). */

export type DMView = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export function serializeDM(m: {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
}): DMView {
  return {
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  };
}

/** Sorted user pair so each two users map to exactly one conversation row. */
export function conversationPair(a: string, b: string) {
  return a < b ? { userAId: a, userBId: b } : { userAId: b, userBId: a };
}

/** The current user's relationship to another user. */
export type FriendState =
  | "self"
  | "none"
  | "friends"
  | "outgoing"
  | "incoming";
