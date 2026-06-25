import { getTranslations } from "next-intl/server";

import { computeBadges, type BadgeStats } from "@/lib/badges";
import { cn } from "@/lib/utils";

/**
 * Achievements grid for the dashboard. Server component (no client JS): earned
 * badges are highlighted, locked ones are dimmed with a hint in the tooltip.
 */
export async function BadgesSection(stats: BadgeStats) {
  const t = await getTranslations("Badges");
  const badges = computeBadges(stats);
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold tracking-tight">{t("title")}</h2>
        <span className="text-muted-foreground text-sm">
          {t("progress", { earned: earnedCount, total: badges.length })}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {badges.map((b) => (
          <div
            key={b.id}
            title={t(`${b.id}.desc`)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border p-4 text-center transition-colors",
              b.earned
                ? "bg-card"
                : "bg-muted/30 opacity-55 grayscale",
            )}
          >
            <span className="text-3xl leading-none">{b.emoji}</span>
            <span className="text-sm font-medium">{t(`${b.id}.title`)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
