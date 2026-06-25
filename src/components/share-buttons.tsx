"use client";

import { Check, Link2, MessageCircle, Send, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const btn =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors hover:bg-muted";

export function ShareButtons({ title }: { title: string }) {
  const t = useTranslations("Event");
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    // `window` is only available after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(window.location.href);
    setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const text = title;
  const tg = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — ignore.
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // User dismissed — ignore.
    }
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm font-medium">
        <Share2 className="size-4" aria-hidden />
        {t("share")}
      </span>

      <a href={tg} target="_blank" rel="noopener noreferrer" className={btn}>
        <Send className="size-4 text-sky-500" aria-hidden />
        Telegram
      </a>
      <a href={wa} target="_blank" rel="noopener noreferrer" className={btn}>
        <MessageCircle className="size-4 text-green-500" aria-hidden />
        WhatsApp
      </a>
      <a href={x} target="_blank" rel="noopener noreferrer" className={btn}>
        <span className="font-semibold">𝕏</span>
      </a>

      <button type="button" onClick={copy} className={cn(btn)}>
        {copied ? (
          <Check className="size-4 text-green-500" aria-hidden />
        ) : (
          <Link2 className="size-4" aria-hidden />
        )}
        {copied ? t("copied") : t("copyLink")}
      </button>

      {canNativeShare && (
        <button type="button" onClick={nativeShare} className={cn(btn, "sm:hidden")}>
          <Share2 className="size-4" aria-hidden />
          {t("shareMore")}
        </button>
      )}
    </div>
  );
}
