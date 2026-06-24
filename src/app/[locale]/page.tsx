import { Show } from "@clerk/nextjs";
import { unstable_cache } from "next/cache";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { CategoriesGrid } from "@/components/landing/categories-grid";
import { FAQSection } from "@/components/landing/faq-section";
import { FeaturedEvents } from "@/components/landing/featured-events";
import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { Reveal } from "@/components/landing/reveal";
import { StatsSection } from "@/components/landing/stats-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/server/db";

const getLandingData = unstable_cache(
  async () => {
    const [events, rawCats, totalEvents, totalUsers, totalOrgs] =
      await Promise.all([
        // Nearest upcoming events first (skip ones that already ended).
        prisma.event.findMany({
          where: { status: "PUBLISHED", endsAt: { gte: new Date() } },
          take: 6,
          orderBy: { startsAt: "asc" },
          include: { organization: { select: { name: true } } },
        }),
        prisma.event.findMany({
          where: { status: "PUBLISHED" },
          select: { category: true },
          distinct: ["category"],
        }),
        prisma.event.count(),
        prisma.user.count(),
        prisma.organization.count(),
      ]);

    return {
      events,
      categories: rawCats.map((c) => c.category).filter(Boolean),
      stats: { events: totalEvents, users: totalUsers, organizers: totalOrgs },
    };
  },
  ["landing-data"],
  { revalidate: 60 },
);

type FAQItem = { q: string; a: string };

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Home");
  const tl = await getTranslations("Landing");
  const { events, categories, stats } = await getLandingData();

  const faqItems = tl.raw("faq") as FAQItem[];

  return (
    <div className="flex flex-1 flex-col">
      {/* 1 — Hero */}
      <HeroSection />

      {/* 2 — Live platform stats with animated counters */}
      <StatsSection stats={stats} />

      {/* 3 — Featured events (real DB data) */}
      <FeaturedEvents events={events} />

      {/* 4 — Category grid (real DB data) */}
      <CategoriesGrid categories={categories} />

      {/* 5 — Why MeetHub feature cards */}
      <FeaturesSection />

      {/* 6 — Testimonials */}
      <TestimonialsSection />

      {/* 7 — FAQ accordion */}
      <FAQSection
        items={faqItems}
        title={tl("faqTitle")}
        subtitle={tl("faqSubtitle")}
      />

      {/* 9 — CTA banner */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
        <Reveal>
          <div className="glass relative overflow-hidden rounded-3xl px-6 py-14 text-center shadow-xl">
            {/* Subtle brand-tinted glow, not a solid fill */}
            <div
              aria-hidden
              className="from-primary/15 pointer-events-none absolute inset-0 bg-linear-to-br via-transparent to-blue-500/15"
            />
            <div
              aria-hidden
              className="bg-primary/20 pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl"
            />
            <div className="relative">
              <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                {t("ctaTitle")}
              </h2>
              <p className="text-muted-foreground mx-auto mt-2 max-w-md text-pretty">
                {t("ctaSubtitle")}
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Show when="signed-out">
                  <Link
                    href="/organizations/apply"
                    className={buttonVariants({ size: "lg" })}
                  >
                    {t("ctaButton")}
                  </Link>
                  <Link
                    href="/events"
                    className={buttonVariants({
                      variant: "outline",
                      size: "lg",
                    })}
                  >
                    {t("exploreEvents")}
                  </Link>
                </Show>
                <Show when="signed-in">
                  <Link
                    href="/dashboard"
                    className={buttonVariants({ size: "lg" })}
                  >
                    {t("goToDashboard")}
                  </Link>
                </Show>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
