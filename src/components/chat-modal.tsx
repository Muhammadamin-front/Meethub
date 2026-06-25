"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import { useRouter } from "@/i18n/navigation";

/**
 * Overlay chrome for the event chat. Clicking the backdrop, the close button, or
 * pressing Escape closes the chat with `router.back()` — which returns to the
 * event card without pushing a duplicate history entry (so the card's own close
 * then goes back to the list, not forward to the chat again).
 */
export function ChatModal({
  eventId,
  title,
  subtitle,
  children,
}: {
  eventId: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const close = () => {
    // Deep links have no history to go back to — fall back to the event.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.replace(`/events/${eventId}`);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:p-8"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-card/95 relative my-4 w-full max-w-2xl rounded-2xl border shadow-2xl backdrop-blur-xl sm:my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="text-muted-foreground hover:bg-muted hover:text-foreground bg-background/80 absolute top-3 right-3 z-10 rounded-full p-2 backdrop-blur transition-colors"
        >
          <X className="size-4" aria-hidden />
        </button>
        <div className="p-5 sm:p-6">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
          )}
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
