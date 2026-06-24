import { getLocale, getTranslations } from "next-intl/server";

import { ReviewForm } from "@/components/review-form";
import { StarRating } from "@/components/star-rating";
import { displayName } from "@/lib/utils";
import { prisma } from "@/server/db";

/**
 * Ratings & reviews for a finished event. Anyone can read them; only
 * participants (passed `canReview`) get the submit form.
 */
export async function EventReviews({
  eventId,
  finished,
  canReview,
  userId,
}: {
  eventId: string;
  finished: boolean;
  canReview: boolean;
  userId: string | null;
}) {
  // Reviews only make sense once the event has ended.
  if (!finished) return null;

  const [t, locale] = await Promise.all([
    getTranslations("Reviews"),
    getLocale(),
  ]);

  const reviews = await prisma.review.findMany({
    where: { eventId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, imageUrl: true } } },
  });

  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const mine = userId ? reviews.find((r) => r.userId === userId) : undefined;

  return (
    <section className="mt-12 border-t pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">{t("title")}</h2>
        {count > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={avg} />
            <span className="text-sm font-medium">{avg.toFixed(1)}</span>
            <span className="text-muted-foreground text-sm">
              · {t("count", { count })}
            </span>
          </div>
        )}
      </div>

      {canReview && (
        <div className="mt-5">
          <ReviewForm
            eventId={eventId}
            initialRating={mine?.rating ?? 0}
            initialComment={mine?.comment ?? ""}
          />
        </div>
      )}

      <div className="mt-6 space-y-5">
        {count === 0 ? (
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="flex gap-3">
              <div className="bg-muted size-9 shrink-0 overflow-hidden rounded-full">
                {r.user.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.user.imageUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground flex size-full items-center justify-center text-xs font-semibold">
                    {displayName(r.user.name).charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">
                    {displayName(r.user.name)}
                  </span>
                  <StarRating value={r.rating} size="size-3.5" />
                  <span className="text-muted-foreground text-xs">
                    {new Date(r.createdAt).toLocaleDateString(locale, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {r.comment && (
                  <p className="text-muted-foreground mt-1 text-sm whitespace-pre-wrap">
                    {r.comment}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
