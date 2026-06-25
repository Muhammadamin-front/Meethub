"use client";

import { ImagePlus, SendHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { MediaUpload } from "@/components/media-upload";
import { StickerPicker } from "@/components/sticker-picker";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage } from "@/lib/chat";
import { emojiOnlyCount } from "@/lib/emoji";
import { getPusherClient } from "@/lib/pusher-client";
import { cn } from "@/lib/utils";
import { sendMediaMessage, sendMessage } from "@/server/actions/message";

export function ChatRoom({
  eventId,
  canWrite,
  currentUserId,
  initialMessages,
}: {
  eventId: string;
  canWrite: boolean;
  currentUserId: string;
  initialMessages: ChatMessage[];
}) {
  const t = useTranslations("Chat");
  const tMedia = useTranslations("Media");
  const locale = useLocale();
  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }),
    [locale],
  );
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  function addMessage(m: ChatMessage) {
    setMessages((prev) =>
      prev.some((x) => x.id === m.id) ? prev : [...prev, m],
    );
  }

  // Subscribe to the event's private channel via the shared Pusher connection.
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;
    const name = `private-event-${eventId}`;
    const channel = pusher.subscribe(name);
    channel.bind("new-message", (m: ChatMessage) => addMessage(m));
    return () => {
      channel.unbind("new-message");
      pusher.unsubscribe(name);
    };
  }, [eventId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function submitText(content: string) {
    if (!content.trim()) return;
    setError(null);
    startTransition(async () => {
      const res = await sendMessage(eventId, content);
      if (res.error) setError(t(`error.${res.error}`));
      else if (res.message) addMessage(res.message);
    });
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const content = String(new FormData(formEl).get("content") ?? "");
    if (!content.trim()) return;
    formEl.reset();
    submitText(content);
  }

  return (
    <div className="bg-card/70 flex h-[60vh] flex-col rounded-lg border shadow-sm backdrop-blur-md">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        ) : (
          messages.map((m) => {
            const mine = m.user.id === currentUserId;
            // Emoji-only text renders large and bubble-less, like a sticker.
            const sticker =
              !m.mediaUrl && m.content ? emojiOnlyCount(m.content) : null;
            return (
              <div
                key={m.id}
                className={cn("flex flex-col", mine && "items-end")}
              >
                {!mine && (
                  <p className="text-muted-foreground mb-0.5 px-1 text-xs font-medium">
                    {m.user.name}
                  </p>
                )}
                {sticker ? (
                  <span
                    className={cn(
                      "px-1 leading-none",
                      sticker <= 2 ? "text-5xl" : "text-4xl",
                    )}
                  >
                    {m.content}
                  </span>
                ) : (
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {m.mediaUrl ? (
                      m.mediaType === "VIDEO" ? (
                        <video
                          src={m.mediaUrl}
                          controls
                          className="max-h-64 rounded-md"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.mediaUrl}
                          alt=""
                          className="max-h-64 rounded-md"
                        />
                      )
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                )}
                <span className="text-muted-foreground mt-0.5 px-1 text-[11px]">
                  {timeFmt.format(new Date(m.createdAt))}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-destructive px-3 text-sm">{error}</p>}

      {canWrite ? (
        <form onSubmit={onSubmit} className="flex items-end gap-2 border-t p-3">
          <Textarea
            name="content"
            rows={1}
            placeholder={t("placeholder")}
            maxLength={2000}
            className="max-h-32 min-h-10 resize-none"
          />
          <StickerPicker
            label={t("stickers")}
            disabled={pending}
            onPick={(s) => submitText(s)}
          />
          <MediaUpload
            accept="both"
            label={tMedia("attachMedia")}
            icon={<ImagePlus className="size-5" />}
            disabled={pending}
            onUploaded={(info) =>
              startTransition(async () => {
                setError(null);
                const res = await sendMediaMessage(eventId, info);
                if (res.error) setError(tMedia(`error.${res.error}`));
                else if (res.message) addMessage(res.message);
              })
            }
          />
          <Button
            type="submit"
            size="icon"
            disabled={pending}
            aria-label={t("send")}
            title={t("send")}
          >
            <SendHorizontal className="size-5" />
          </Button>
        </form>
      ) : (
        <p className="text-muted-foreground border-t p-3 text-sm">
          {t("readOnly")}
        </p>
      )}
    </div>
  );
}
