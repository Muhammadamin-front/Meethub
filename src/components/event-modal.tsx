"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";

/**
 * Modal chrome for the intercepted event route. Frosted backdrop + card so it
 * stands out over the page; closes back to where you came from.
 *
 * Next.js keeps a parallel-route slot's previous subtree on *soft* navigation,
 * so when you click e.g. "Open chat" the modal would otherwise stay in front of
 * the chat page. We watch the pathname and hide the modal whenever the route is
 * no longer this event's detail page (`/events/<id>`).
 */
export function EventModal({
  eventId,
  children,
}: {
  eventId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // next-intl's usePathname is locale-stripped, e.g. "/events/abc123".
  const visible = pathname === `/events/${eventId}`;
  const close = () => router.back();

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.back();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [router, visible]);

  if (!visible) return null;

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
        <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
