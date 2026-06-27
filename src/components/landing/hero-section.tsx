import { ArrowRight, CalendarCheck, MapPin, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { LiveClock } from "@/components/live-clock";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Floating demo event card — pure decoration
function FloatCard({
  title,
  tag,
  seats,
  date,
  className,
}: {
  title: string;
  tag: string;
  seats: string;
  date: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass absolute hidden w-56 rounded-2xl p-4 shadow-2xl md:block",
        className,
      )}
    >
      <span className="bg-primary/20 text-primary mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium">
        {tag}
      </span>
      <p className="text-sm leading-snug font-semibold">{title}</p>
      <div className="text-muted-foreground mt-2 flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1">
          <CalendarCheck className="size-3" />
          {date}
        </span>
        <span className="flex items-center gap-1">
          <Users className="size-3" />
          {seats}
        </span>
      </div>
    </div>
  );
}

export async function HeroSection() {
  const t = await getTranslations("Home");
  const tl = await getTranslations("Landing");

  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] items-center justify-center overflow-hidden px-4">
      {/* Ambient glow orbs */}
      <div
        aria-hidden
        className="animate-glow-pulse pointer-events-none absolute -top-32 left-1/4 h-120 w-120 rounded-full bg-violet-500/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="animate-glow-pulse pointer-events-none absolute right-1/4 -bottom-32 h-90 w-90 rounded-full bg-blue-500/20 blur-[100px] [animation-delay:2s]"
      />

      {/* Floating decoration cards */}
      <FloatCard
        title="Tashkent Tech Summit"
        tag="Technology"
        seats="42 seats"
        date="Jul 12"
        className="animate-float-alt top-1/3 left-6 lg:left-12"
      />
      <FloatCard
        title="Speaking Club — B2 Level"
        tag="Education"
        seats="18 seats"
        date="Jul 15"
        className="animate-float top-1/2 right-6 lg:right-12"
      />

      {/* Hero content */}
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        {/* Status badge — always rendered (static) to keep the vertically
            centered hero from shifting when client auth resolves. */}
        <span className="glass animate-fade-in-up inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium">
          <span className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
          {t("badge")}
        </span>

        <h1 className="animate-fade-in-up text-4xl font-semibold tracking-tight text-balance [animation-delay:.1s] sm:text-5xl lg:text-6xl">
          <span className="text-foreground">{tl("heroTitlePrefix")}</span>
          <span className="from-primary bg-linear-to-r to-blue-500 bg-clip-text text-transparent">
            {tl("heroTitleHighlight")}
          </span>
          <span className="text-foreground">{tl("heroTitleSuffix")}</span>
        </h1>

        <p className="text-muted-foreground animate-fade-in-up max-w-xl text-lg text-pretty [animation-delay:.2s]">
          {t("heroSubtitle")}
        </p>

        <div className="animate-fade-in-up flex flex-col gap-3 [animation-delay:.3s] sm:flex-row">
          <Link
            href="/events"
            className={cn(buttonVariants({ size: "lg" }), "gap-2")}
          >
            {t("exploreEvents")}
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/sign-up"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            {t("createAccount")}
          </Link>
        </div>

        {/* Floating location + live local-time pills */}
        <div className="animate-fade-in-up flex flex-wrap items-center justify-center gap-2 [animation-delay:.45s]">
          <div className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm">
            <MapPin className="text-primary size-4" />
            <span className="text-muted-foreground">{tl("heroLocation")}</span>
          </div>
          <LiveClock className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm" />
        </div>
      </div>
    </section>
  );
}
