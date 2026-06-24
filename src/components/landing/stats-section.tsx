import { Building2, CalendarCheck, Globe2, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { AnimatedCounter } from "./animated-counter";
import { Reveal } from "./reveal";

export async function StatsSection({
  stats,
}: {
  stats: { events: number; users: number; organizers: number };
}) {
  const t = await getTranslations("Stats");

  const items = [
    { value: stats.events, label: t("events"), Icon: CalendarCheck },
    { value: stats.users, label: t("members"), Icon: Users },
    { value: stats.organizers, label: t("organizers"), Icon: Building2 },
    { value: 1, label: t("countries"), Icon: Globe2 },
  ];

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <Reveal>
        <div className="glass grid grid-cols-2 gap-px overflow-hidden rounded-2xl sm:grid-cols-4">
          {items.map(({ value, label, Icon }, i) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 px-6 py-8 text-center"
            >
              <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-xl">
                <Icon className="size-5" aria-hidden />
              </div>
              <p className="text-primary text-4xl font-semibold tabular-nums sm:text-5xl">
                <AnimatedCounter value={value} />
                {i === 3 ? "" : "+"}
              </p>
              <p className="text-muted-foreground mt-0.5 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
