import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { routing } from "@/i18n/routing";

import "./globals.css";

// global-not-found bypasses the normal layout, so it must import its own styles
// and fonts. It's served for URLs that don't match any route at all.
const fontSans = Geist({ variable: "--font-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "404 — Page not found · MeetHub",
};

export default function GlobalNotFound() {
  return (
    <html lang={routing.defaultLocale} className={fontSans.variable}>
      <body className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center font-sans antialiased">
        <p className="text-muted-foreground text-6xl font-bold">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="text-muted-foreground max-w-md">
          The page you’re looking for doesn’t exist or has moved.
        </p>
        <a
          href={`/${routing.defaultLocale}`}
          className="bg-primary text-primary-foreground hover:bg-primary/80 rounded-lg px-4 py-2 text-sm font-medium"
        >
          Back to home
        </a>
      </body>
    </html>
  );
}
