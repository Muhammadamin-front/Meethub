import {
  Briefcase,
  Code2,
  Gamepad2,
  GraduationCap,
  Heart,
  Mountain,
  Music,
  Network,
  Palette,
  Star,
  Trophy,
  UtensilsCrossed,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { Reveal } from "./reveal";

const ICON_MAP: [string, LucideIcon][] = [
  ["tech", Code2],
  ["sport", Trophy],
  ["football", Trophy],
  ["music", Music],
  ["art", Palette],
  ["design", Palette],
  ["business", Briefcase],
  ["education", GraduationCap],
  ["network", Network],
  ["hik", Mountain],
  ["gaming", Gamepad2],
  ["game", Gamepad2],
  ["health", Heart],
  ["food", UtensilsCrossed],
];

const GRADIENTS = [
  "from-violet-500/25 to-purple-600/25 border-violet-400/20",
  "from-blue-500/25 to-cyan-500/25 border-blue-400/20",
  "from-emerald-500/25 to-teal-500/25 border-emerald-400/20",
  "from-orange-500/25 to-amber-500/25 border-orange-400/20",
  "from-rose-500/25 to-pink-500/25 border-rose-400/20",
  "from-indigo-500/25 to-sky-500/25 border-indigo-400/20",
  "from-lime-500/25 to-green-500/25 border-lime-400/20",
  "from-yellow-400/25 to-orange-400/25 border-yellow-400/20",
];

function iconFor(category: string): LucideIcon {
  const lower = category.toLowerCase();
  for (const [key, Icon] of ICON_MAP) {
    if (lower.includes(key)) return Icon;
  }
  return Star;
}

export async function CategoriesGrid({ categories }: { categories: string[] }) {
  const t = await getTranslations("Event");
  const tl = await getTranslations("Landing");

  if (categories.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <Reveal>
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            {tl("categoriesTitle")}
          </h2>
          <p className="text-muted-foreground mt-2">
            {tl("categoriesSubtitle")}
          </p>
        </div>
      </Reveal>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {categories.map((cat, i) => {
          const Icon = iconFor(cat);
          const gradient = GRADIENTS[i % GRADIENTS.length];
          return (
            <Reveal key={cat} delay={Math.min(i % 4, 3) as 0 | 1 | 2 | 3}>
              <Link
                href={`/events?category=${encodeURIComponent(cat)}`}
                className="group block"
              >
                <div
                  className={cn(
                    "glass overflow-hidden rounded-2xl border bg-linear-to-br p-5 transition-all duration-300",
                    "group-hover:-translate-y-1 group-hover:shadow-lg",
                    gradient,
                  )}
                >
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-white/20 dark:bg-white/10">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <p className="leading-snug font-medium">{cat}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {t("join")} →
                  </p>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
