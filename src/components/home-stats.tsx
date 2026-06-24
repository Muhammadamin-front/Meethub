import { Building2, CalendarCheck, Globe2, Users } from "lucide-react";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";

import { prisma } from "@/server/db";

// We don't store a country per event yet, so this reflects the single country
// the platform currently operates in (Uzbekistan). Make it data-driven later
// by adding a country field.
const COUNTRIES = 1;

// Real counts, cached for 60s (global, not per-user) — no extra DB load per hit.
const getHomeStats = unstable_cache(
  async () => {
    const [events, users, organizers] = await Promise.all([
      prisma.event.count(),
      prisma.user.count(),
      prisma.organization.count(),
    ]);
    return { events, users, organizers };
  },
  ["home-stats"],
  { revalidate: 60 },
);

export async function HomeStats() {
  const t = await getTranslations("Stats");
  const { events, users, organizers } = await getHomeStats();

  const items = [
    { value: events, label: t("events"), Icon: CalendarCheck },
    { value: users, label: t("members"), Icon: Users },
    { value: organizers, label: t("organizers"), Icon: Building2 },
    { value: COUNTRIES, label: t("countries"), Icon: Globe2 },
  ];

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-16 sm:px-6">
      <div className="bg-card/60 grid grid-cols-2 gap-4 rounded-2xl border p-6 backdrop-blur-sm sm:grid-cols-4 sm:p-8">
        {items.map(({ value, label, Icon }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1 text-center"
          >
            <Icon className="text-primary mb-1 size-5" aria-hidden />
            <p className="text-3xl font-semibold sm:text-4xl">
              {value.toLocaleString()}
            </p>
            <p className="text-muted-foreground text-sm">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
