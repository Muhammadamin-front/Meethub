import {
  MessageCircle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Reveal } from "./reveal";

type FeatureItem = {
  Icon: LucideIcon;
  color: string;
  bg: string;
  title: string;
  desc: string;
};

export async function FeaturesSection() {
  const t = await getTranslations("Landing");

  const features: FeatureItem[] = [
    {
      Icon: Users,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      title: t("feature.networking.title"),
      desc: t("feature.networking.desc"),
    },
    {
      Icon: TrendingUp,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      title: t("feature.career.title"),
      desc: t("feature.career.desc"),
    },
    {
      Icon: Sparkles,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      title: t("feature.learning.title"),
      desc: t("feature.learning.desc"),
    },
    {
      Icon: ShieldCheck,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      title: t("feature.community.title"),
      desc: t("feature.community.desc"),
    },
    {
      Icon: Zap,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      title: t("feature.access.title"),
      desc: t("feature.access.desc"),
    },
    {
      Icon: MessageCircle,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      title: t("feature.chat.title"),
      desc: t("feature.chat.desc"),
    },
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <Reveal>
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            {t("whyTitle")}
          </h2>
          <p className="text-muted-foreground mx-auto mt-2 max-w-lg">
            {t("whySubtitle")}
          </p>
        </div>
      </Reveal>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ Icon, color, bg, title, desc }, i) => (
          <Reveal
            key={title}
            className="h-full"
            delay={Math.min(i, 3) as 0 | 1 | 2 | 3}
          >
            <div className="glass group flex h-full flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <div
                className={`mb-4 flex size-11 items-center justify-center rounded-xl ${bg}`}
              >
                <Icon className={`size-5 ${color}`} aria-hidden />
              </div>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                {desc}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
