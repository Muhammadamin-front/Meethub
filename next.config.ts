import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Points at src/i18n/request.ts by convention.
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  experimental: {
    // Our root layout lives under the dynamic `[locale]` segment, so we provide
    // a dedicated global 404 for unmatched routes (app/global-not-found.tsx).
    globalNotFound: true,
    // Enables React's <ViewTransition> so the locale switch can crossfade.
    viewTransition: true,
  },
};

export default withNextIntl(nextConfig);
