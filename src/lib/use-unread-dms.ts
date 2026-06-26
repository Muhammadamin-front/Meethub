"use client";

import { useEffect, useState } from "react";

import { getPusherClient } from "@/lib/pusher-client";
import { getUnreadDmIds } from "@/server/actions/dm";

/**
 * Browser event a chat thread fires when it reads a conversation, so the
 * Messages badge can clear that conversation from its unread set.
 */
export const DM_READ_EVENT = "meethub:dm-read";

export function dispatchDmRead(conversationId: string) {
  window.dispatchEvent(
    new CustomEvent(DM_READ_EVENT, { detail: { conversationId } }),
  );
}

/**
 * Live count of conversations with unread incoming DMs for the badge on the
 * Messages nav item. Starts from the server snapshot, then:
 *  - a new DM (Pusher `new-dm`) adds its conversation to the unread set;
 *  - reading a conversation (`meethub:dm-read`) removes it.
 *
 * We only ever bind/unbind our own handler on the shared user channel — never
 * unsubscribe it (chat + notifications share it).
 */
export function useUnreadDms(userId: string | undefined) {
  const [ids, setIds] = useState<Set<string>>(() => new Set());

  // Initial unread set is fetched after paint (off the layout's render path).
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getUnreadDmIds().then((list) => {
      if (!cancelled) setIds(new Set(list));
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const onRead = (e: Event) => {
      const id = (e as CustomEvent<{ conversationId: string }>).detail
        ?.conversationId;
      if (!id) return;
      setIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    };
    window.addEventListener(DM_READ_EVENT, onRead);

    const pusher = getPusherClient();
    const channel = pusher?.subscribe(`private-user-${userId}`);
    const onDm = (m: { conversationId: string }) => {
      setIds((prev) => {
        if (prev.has(m.conversationId)) return prev;
        const next = new Set(prev);
        next.add(m.conversationId);
        return next;
      });
    };
    channel?.bind("new-dm", onDm);

    return () => {
      window.removeEventListener(DM_READ_EVENT, onRead);
      channel?.unbind("new-dm", onDm);
    };
  }, [userId]);

  return ids.size;
}
