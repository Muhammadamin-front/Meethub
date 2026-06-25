import type { MetadataRoute } from "next";

import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

/**
 * Web App Manifest — makes MeetHub installable ("Add to Home Screen") as a PWA.
 * Served at /manifest.webmanifest. The locale-aware UI still works because the
 * middleware redirects `/` to the user's locale.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#5468ee",
    categories: ["social", "events", "lifestyle"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // Maskable variant lets Android crop the icon into its adaptive shape.
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
