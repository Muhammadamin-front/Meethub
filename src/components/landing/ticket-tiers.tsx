import { Award, Check, Crown, Medal, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Reveal } from "./reveal";

type Tier = {
  key: "bronze" | "silver" | "gold" | "vip";
  Icon: LucideIcon;
  // gradient for the stub + accent colour for icon / checks
  stub: string;
  accent: string;
  ring: string;
};

const TIERS: Tier[] = [
  {
    key: "bronze",
    Icon: Medal,
    stub: "from-amber-700/30 to-orange-800/30",
    accent: "text-amber-700 dark:text-amber-500",
    ring: "ring-amber-700/20",
  },
  {
    key: "silver",
    Icon: Award,
    stub: "from-slate-300/40 to-zinc-400/40",
    accent: "text-slate-500 dark:text-slate-300",
    ring: "ring-slate-400/20",
  },
  {
    key: "gold",
    Icon: Trophy,
    stub: "from-yellow-400/40 to-amber-500/40",
    accent: "text-yellow-600 dark:text-yellow-400",
    ring: "ring-yellow-500/30",
  },
  {
    key: "vip",
    Icon: Crown,
    stub: "from-violet-500/40 to-fuchsia-600/40",
    accent: "text-violet-600 dark:text-violet-400",
    ring: "ring-violet-500/30",
  },
];

export async function TicketTiers() {
  const t = await getTranslations("Landing");

  return (
    <section className="mx-auto mt-20 w-full max-w-5xl">
      <Reveal>
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("tiersTitle")}
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-xl text-pretty">
            {t("tiersSubtitle")}
          </p>
        </div>
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map(({ key, Icon, stub, accent, ring }, i) => {
          const features = t.raw(`tiers.${key}.features`) as string[];
          return (
            <Reveal key={key} delay={Math.min(i, 3) as 0 | 1 | 2 | 3}>
              {/* Mini example ticket */}
              <div
                className={`glass h-full overflow-hidden rounded-2xl ring-1 transition-transform duration-300 hover:-translate-y-1 ${ring}`}
              >
                {/* Stub header */}
                <div
                  className={`relative flex items-center gap-3 bg-linear-to-br p-4 ${stub}`}
                >
                  <div className="bg-background/60 flex size-10 items-center justify-center rounded-xl">
                    <Icon className={`size-5 ${accent}`} aria-hidden />
                  </div>
                  <div>
                    <p className="text-base font-bold">
                      {t(`tiers.${key}.name`)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {t(`tiers.${key}.tagline`)}
                    </p>
                  </div>
                </div>

                {/* Perforation */}
                <div className="relative flex items-center px-3">
                  <div className="bg-background/70 -ml-4 size-3 shrink-0 rounded-full" />
                  <div className="border-border/50 flex-1 border-t border-dashed" />
                  <div className="bg-background/70 -mr-4 size-3 shrink-0 rounded-full" />
                </div>

                {/* Features */}
                <ul className="space-y-2 p-4">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check
                        className={`mt-0.5 size-4 shrink-0 ${accent}`}
                        aria-hidden
                      />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
