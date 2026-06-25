import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor (native shell) configuration — CONFIG ONLY.
 *
 * MeetHub is a server-rendered Next.js app (Server Actions + Clerk auth), so it
 * cannot be statically exported. The native iOS/Android shell therefore loads
 * the LIVE deployed site inside a WebView via `server.url`.
 *
 * Before building a native app:
 *   1. Deploy the web app (e.g. to Vercel) and copy its HTTPS URL.
 *   2. Set CAP_SERVER_URL to that URL (env var) — or hardcode it below.
 *   3. Generate the native projects:  npx cap add ios   &&   npx cap add android
 *   4. Open them:                      npx cap open ios  /   npx cap open android
 *
 * Native build requires Xcode (iOS) / Android Studio (Android).
 */
const SERVER_URL = process.env.CAP_SERVER_URL; // e.g. https://meethub.vercel.app

const config: CapacitorConfig = {
  appId: "com.meethub.app",
  appName: "MeetHub",
  // Required by the CLI. Unused at runtime when server.url points at the live
  // site; acts only as the bundled fallback shell.
  webDir: "public",
  server: SERVER_URL
    ? {
        url: SERVER_URL,
        cleartext: false,
      }
    : undefined,
  ios: {
    contentInset: "always",
  },
  android: {
    // Allow Clerk / Pusher / Cloudinary cookies & websockets over https.
    allowMixedContent: false,
  },
};

export default config;
