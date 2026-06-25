"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getPusherClient } from "@/lib/pusher-client";
import type { DMView } from "@/lib/social";
import { cn } from "@/lib/utils";
import { sendDirectMessage } from "@/server/actions/dm";

export function DmThread({
  conversationId,
  currentUserId,
  initialMessages,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: DMView[];
}) {
  const t = useTranslations("Messages");
  const [messages, setMessages] = useState<DMView[]>(initialMessages);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  function add(m: DMView) {
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }

  // Realtime: listen on our own private user channel and keep messages for this
  // conversation. The channel is shared with notifications, so we only unbind
  // our own handler (never unsubscribe the channel).
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;
    const name = `private-user-${currentUserId}`;
    const channel = pusher.subscribe(name);
    const handler = (m: DMView) => {
      if (m.conversationId === conversationId) add(m);
    };
    channel.bind("new-dm", handler);
    return () => {
      channel.unbind("new-dm", handler);
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const content = String(new FormData(formEl).get("content") ?? "");
    if (!content.trim()) return;
    setError(null);
    formEl.reset();
    startTransition(async () => {
      const res = await sendDirectMessage(conversationId, content);
      if (res.error) setError(t(`error.${res.error}`));
      else if (res.message) add(res.message);
    });
  }

  return (
    <div className="bg-card/70 flex h-[70vh] flex-col rounded-xl border shadow-sm backdrop-blur-md">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            {t("empty")}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div
                key={m.id}
                className={cn("flex flex-col", mine && "items-end")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                    mine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md",
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-destructive px-4 text-sm">{error}</p>}

      <form onSubmit={onSubmit} className="flex items-end gap-2 border-t p-3">
        <Textarea
          name="content"
          rows={1}
          placeholder={t("placeholder")}
          maxLength={2000}
          className="max-h-32 min-h-10 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <Button type="submit" disabled={pending}>
          {t("send")}
        </Button>
      </form>
    </div>
  );
}
