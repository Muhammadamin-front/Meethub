import { getTranslations } from "next-intl/server";

const ITEMS = [
  { key: "football", emoji: "⚽" },
  { key: "speakingClub", emoji: "🗣️" },
  { key: "hackathon", emoji: "💻" },
  { key: "hiking", emoji: "🥾" },
  { key: "music", emoji: "🎵" },
  { key: "workshop", emoji: "🛠️" },
  { key: "networking", emoji: "🤝" },
  { key: "gaming", emoji: "🎮" },
] as const;

/**
 * Auto-scrolling band of event types on the landing page. Pure CSS marquee
 * (no JS, no external images); pauses on hover.
 */
export async function EventShowcase() {
  const t = await getTranslations("Showcase");
  const row = [...ITEMS, ...ITEMS];

  return (
    <section className="pb-8">
      <p className="text-muted-foreground mx-auto mb-4 max-w-6xl px-4 text-center text-sm font-medium sm:px-6">
        {t("title")}
      </p>
      <div className="group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="animate-marquee flex w-max gap-4 group-hover:[animation-play-state:paused]">
          {row.map((item, i) => (
            <div
              key={i}
              className="bg-card flex items-center gap-3 rounded-2xl border px-5 py-3 shadow-sm"
            >
              <span className="text-2xl" aria-hidden>
                {item.emoji}
              </span>
              <span className="font-medium whitespace-nowrap">
                {t(item.key)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
