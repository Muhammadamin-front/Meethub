import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { APP_URL } from "@/lib/constants";
import { prisma } from "@/server/db";

// Re-crawl the sitemap hourly so new events get indexed quickly.
export const revalidate = 3600;

/**
 * /sitemap.xml — static marketing pages plus every published event, emitted for
 * all locales so search engines index the uz/ru/en variants.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { locales, defaultLocale } = routing;

  // Locale-prefixed URL helper (default locale is also prefixed in this app).
  const localized = (path: string) =>
    locales.map((locale) => `${APP_URL}/${locale}${path}`);

  const staticPaths = ["", "/events", "/organizations", "/leaderboard"];
  const staticEntries: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    localized(path).map((url) => ({
      url,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: path === "" ? 1 : 0.8,
    })),
  );

  // Only index events that are publicly viewable.
  let events: { id: string; updatedAt: Date }[] = [];
  try {
    events = await prisma.event.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, updatedAt: true },
      orderBy: { startsAt: "desc" },
      take: 5000,
    });
  } catch {
    // Never fail the whole sitemap if the DB is briefly unreachable at build.
    events = [];
  }

  const eventEntries: MetadataRoute.Sitemap = events.flatMap((e) =>
    locales.map((locale) => ({
      url: `${APP_URL}/${locale}/events/${e.id}`,
      lastModified: e.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${APP_URL}/${l}/events/${e.id}`]),
        ),
      },
    })),
  );

  // Reference defaultLocale so the canonical home is unambiguous to crawlers.
  void defaultLocale;

  return [...staticEntries, ...eventEntries];
}
