import { defineRouting } from "next-intl/routing";

/**
 * Supported locales and routing config for the whole app.
 * Uzbek (Latin) is the default; URLs are locale-prefixed (e.g. /uz, /ru, /en).
 */
export const routing = defineRouting({
  locales: ["uz", "ru", "en"],
  defaultLocale: "uz",
  // Always default to Uzbek instead of guessing from the browser's
  // Accept-Language, so `/` redirects to `/uz` for everyone.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
