"use client";

import { Star, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { fetchPendingReview, submitReview } from "@/server/actions/review";

const STORAGE_KEY = "meethub:review-prompted";

function alreadyPrompted(id: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]).includes(id) : false;
  } catch {
    return false;
  }
}

function markPrompted(id: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    if (!list.includes(id)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...list, id].slice(-50)));
    }
  } catch {
    // Ignore storage errors (private mode etc.) — worst case it re-prompts.
  }
}

/**
 * One-time "rate this event" prompt. Shown once (ever, per browser) when a
 * participant whose event has finished lands on the home page. `pending` is the
 * event to review (or null); we additionally gate on localStorage so it never
 * pops up twice even if the user dismisses without reviewing.
 */
export function ReviewPrompt() {
  const t = useTranslations("Reviews");
  const [pending, setPending] = useState<{ id: string; title: string } | null>(
    null,
  );
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pendingSubmit, startTransition] = useTransition();

  // Fetch the pending review lazily (after paint) so it never blocks the home
  // page's server render. Only opens once per event (localStorage-gated).
  useEffect(() => {
    let cancelled = false;
    fetchPendingReview().then((ev) => {
      if (cancelled || !ev || alreadyPrompted(ev.id)) return;
      markPrompted(ev.id);
      setPending(ev);
      setOpen(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!pending || !open) return null;

  function submit() {
    setError(null);
    if (rating < 1) {
      setError(t("ratingRequired"));
      return;
    }
    startTransition(async () => {
      const res = await submitReview(pending!.id, rating, comment);
      if (res?.error) {
        setError(t(`error.${res.error}`));
      } else {
        setDone(true);
        setTimeout(() => setOpen(false), 1200);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-120 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-card relative w-full max-w-md rounded-2xl border p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t("later")}
          className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-3 right-3 rounded-full p-2 transition-colors"
        >
          <X className="size-4" aria-hidden />
        </button>

        {done ? (
          <p className="py-8 text-center text-lg font-medium">{t("thanks")}</p>
        ) : (
          <>
            <h2 className="text-lg font-semibold tracking-tight">
              {t("promptTitle")}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("promptSubtitle", { event: pending.title })}
            </p>

            {/* Star picker */}
            <div className="mt-4 flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((i) => {
                const active = (hover || rating) >= i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(0)}
                    aria-label={`${i}`}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "size-8",
                        active
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/40",
                      )}
                    />
                  </button>
                );
              })}
            </div>

            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("commentPlaceholder")}
              maxLength={1000}
              rows={3}
              className="mt-4 resize-none"
            />

            {error && (
              <p className="text-destructive mt-2 text-sm">{error}</p>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
              >
                {t("later")}
              </Button>
              <Button type="button" onClick={submit} disabled={pendingSubmit}>
                {pendingSubmit ? t("submitting") : t("submit")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
