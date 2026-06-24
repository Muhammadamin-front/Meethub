"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { submitReview } from "@/server/actions/review";

export function ReviewForm({
  eventId,
  initialRating = 0,
  initialComment = "",
}: {
  eventId: string;
  initialRating?: number;
  initialComment?: string;
}) {
  const t = useTranslations("Reviews");
  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(initialComment);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const editing = initialRating > 0;

  function onSubmit() {
    setError(null);
    setDone(false);
    if (rating < 1) {
      setError(t("ratingRequired"));
      return;
    }
    startTransition(async () => {
      const res = await submitReview(eventId, rating, comment);
      if (res?.error) setError(t(`error.${res.error}`));
      else setDone(true);
    });
  }

  return (
    <div className="bg-card/50 rounded-xl border p-4 backdrop-blur-sm">
      <p className="text-sm font-medium">
        {editing ? t("updateTitle") : t("writeTitle")}
      </p>

      {/* Star picker */}
      <div className="mt-3">
        <p className="text-muted-foreground mb-1.5 text-xs">
          {t("yourRating")}
        </p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => {
            const active = (hover || rating) >= i;
            return (
              <button
                key={i}
                type="button"
                aria-label={`${i}`}
                onClick={() => setRating(i)}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "size-7",
                    active
                      ? "fill-amber-400 text-amber-400"
                      : "fill-transparent text-zinc-400/50",
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t("commentPlaceholder")}
        rows={3}
        maxLength={1000}
        className="mt-3"
      />

      <div className="mt-3 flex items-center gap-3">
        <Button onClick={onSubmit} disabled={pending} size="sm">
          {pending ? t("submitting") : editing ? t("update") : t("submit")}
        </Button>
        {done && (
          <span className="text-sm text-emerald-500">{t("thanks")}</span>
        )}
        {error && <span className="text-destructive text-sm">{error}</span>}
      </div>
    </div>
  );
}
