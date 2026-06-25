import type { MetadataRoute } from "next";

import { APP_URL } from "@/lib/constants";

/**
 * /robots.txt — allow crawling of public pages, keep private/auth/admin out of
 * the index, and point search engines at the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/dashboard", "/sign-in", "/sign-up"],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
