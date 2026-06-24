import { Building2, CalendarDays, MapPin, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { Reveal } from "./reveal";

type EventCard = {
  id: string;
  title: string;
  category: string;
  startsAt: Date | string;
  endsAt: Date | string;
  status: string;
  location: string;
  capacity: number;
  coverUrl: string | null;
  organization: { name: string };
  _count?: { registrations: number };
};

function formatShortDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function FeaturedEvents({ events }: { events: EventCard[] }) {
  const t = await getTranslations("Event");
  const tHome = await getTranslations("Home");
  const tl = await getTranslations("Landing");

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <Reveal>
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            {tl("featuredTitle")}
          </h2>
          <p className="text-muted-foreground mt-2">{tl("featuredSubtitle")}</p>
        </div>
      </Reveal>

      {events.length === 0 ? (
        <Reveal delay={1}>
          <div className="glass rounded-2xl py-20 text-center">
            <CalendarDays className="text-muted-foreground mx-auto mb-4 size-12 opacity-40" />
            <p className="text-muted-foreground">{t("empty")}</p>
            <Link
              href="/events"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
            >
              {tHome("exploreEvents")}
            </Link>
          </div>
        </Reveal>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, i) => {
            const spots =
              event._count !== undefined
                ? event.capacity - event._count.registrations
                : event.capacity;
            const finished =
              event.status === "FINISHED" ||
              new Date(event.endsAt) < new Date();
            const card = (
              <div
                className={cn(
                  "glass overflow-hidden rounded-2xl transition-all duration-300",
                  finished
                    ? "opacity-75"
                    : "group-hover:shadow-primary/10 group-hover:-translate-y-1 group-hover:shadow-xl",
                )}
              >
                {/* Cover image or gradient */}
                <div className="relative h-44 overflow-hidden">
                  {event.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.coverUrl}
                      alt={event.title}
                      className={cn(
                        "h-full w-full object-cover transition-transform duration-500",
                        finished ? "grayscale" : "group-hover:scale-105",
                      )}
                      loading="lazy"
                    />
                  ) : (
                    <div className="from-primary/30 h-full w-full bg-linear-to-br to-blue-500/30" />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  <Badge className="bg-primary text-primary-foreground absolute top-3 left-3 border-0">
                    {event.category}
                  </Badge>
                  {finished && (
                    <Badge className="absolute top-3 right-3 border-0 bg-zinc-900/80 text-white">
                      {t("status.finished")}
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="line-clamp-2 text-base leading-snug font-semibold">
                    {event.title}
                  </h3>
                  <p className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-sm">
                    <Building2 className="size-3.5 shrink-0" />
                    {event.organization.name}
                  </p>

                  <div className="text-muted-foreground mt-3 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {formatShortDate(event.startsAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {event.location}
                    </span>
                  </div>

                  <div className="border-border/50 mt-3 flex items-center justify-between border-t pt-3">
                    <span className="text-muted-foreground flex items-center gap-1 text-xs">
                      <Users className="size-3.5" />
                      {finished
                        ? t("status.finished")
                        : spots > 0
                          ? t("spotsLeft", { count: spots })
                          : t("full")}
                    </span>
                    {!finished && (
                      <span className="text-primary text-xs font-medium">
                        {t("join")} →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );

            return (
              <Reveal key={event.id} delay={Math.min(i, 3) as 0 | 1 | 2 | 3}>
                {finished ? (
                  <div className="block cursor-default select-none">{card}</div>
                ) : (
                  <Link href={`/events/${event.id}`} className="group block">
                    {card}
                  </Link>
                )}
              </Reveal>
            );
          })}
        </div>
      )}

      <Reveal delay={2}>
        <div className="mt-10 text-center">
          <Link
            href="/events"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            {tHome("exploreEvents")}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
