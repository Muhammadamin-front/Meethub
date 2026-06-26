import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Points at src/i18n/request.ts by convention.
const withNextIntl = createNextIntlPlugin();

// Hardening headers applied to every response. These are intentionally the
// "safe" set that doesn't depend on per-request nonces, so they can't break the
// third-party scripts we rely on (Clerk, Pusher, Cloudinary, OSM maps):
//  - HSTS forces HTTPS; nosniff stops MIME confusion; DENY/frame-ancestors stop
//    clickjacking; Referrer-Policy limits URL leakage; Permissions-Policy turns
//    off device APIs we don't use (geolocation/camera stay on, they're used).
//  - The CSP only sets directives that don't govern script execution
//    (object-src/base-uri/frame-ancestors/upgrade-insecure-requests), so it adds
//    real protection without risking the app. A full script-src CSP would need
//    nonce wiring + live testing of every provider first.
const SECURITY_HEADERS = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), autoplay=(self), camera=(self), microphone=(), " +
      "geolocation=(self), gyroscope=(), magnetometer=(), payment=(), " +
      "usb=(), fullscreen=(self), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value:
      "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; " +
      "upgrade-insecure-requests",
  },
];

const nextConfig: NextConfig = {
  // Don't advertise the framework/version.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  experimental: {
    // Our root layout lives under the dynamic `[locale]` segment, so we provide
    // a dedicated global 404 for unmatched routes (app/global-not-found.tsx).
    globalNotFound: true,
  },
};

export default withNextIntl(nextConfig);
