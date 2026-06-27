import type { Metadata, Viewport } from "next";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { ClerkProvider } from "@clerk/nextjs";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";

import { SpeedInsights } from "@vercel/speed-insights/next";

import { Analytics } from "@/components/analytics";
import { AppSplash } from "@/components/app-splash";
import { BlockedBanner } from "@/components/blocked-banner";
import { BottomNav } from "@/components/bottom-nav";
import { HeaderAuthProvider } from "@/components/header-auth";
import { PwaRegister } from "@/components/pwa-register";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { clerkLocalization } from "@/lib/clerk-localization";
import { routing } from "@/i18n/routing";
import { APP_NAME, APP_URL } from "@/lib/constants";

import "../globals.css";

// Font variables feed the Tailwind theme tokens (`--font-sans` / `--font-mono`).
const fontSans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const fontMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

// Pre-render every locale at build time.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });

  return {
    metadataBase: new URL(APP_URL),
    title: { default: t("title"), template: `%s · ${APP_NAME}` },
    description: t("description"),
    openGraph: {
      type: "website",
      siteName: APP_NAME,
      title: t("title"),
      description: t("description"),
    },
    twitter: { card: "summary_large_image" },
    // PWA: tells iOS Safari to launch standalone with our home-screen icon.
    appleWebApp: {
      capable: true,
      title: APP_NAME,
      statusBarStyle: "default",
    },
    icons: {
      icon: "/icon.svg",
      apple: "/apple-icon.png",
    },
  };
}

// Status-bar / toolbar tint when installed as a PWA.
export const viewport: Viewport = {
  themeColor: "#5468ee",
};

export default async function LocaleLayout({
  children,
  modal,
  params,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Reject unknown locales (e.g. /xx) with a 404.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering for this request's locale.
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    // Locale-aware Clerk URLs so auth redirects keep the active language.
    <ClerkProvider
      localization={clerkLocalization(locale)}
      signInUrl={`/${locale}/sign-in`}
      signUpUrl={`/${locale}/sign-up`}
    >
      <html
        lang={locale}
        suppressHydrationWarning
        className={`${fontSans.variable} ${fontMono.variable}`}
      >
        <body className="bg-background text-foreground flex min-h-dvh flex-col pb-24 antialiased md:pb-0">
          <AppSplash />
          {/* Site-wide theme background (fixed, optimized via next/image). */}
          <div aria-hidden className="fixed inset-0 -z-10">
            <Image
              src="/assets/hero-light.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover dark:hidden"
            />
            <Image
              src="/assets/hero-dark.jpg"
              alt=""
              fill
              sizes="100vw"
              className="hidden object-cover dark:block"
            />
            {/* Readability scrim over the image. */}
            <div className="bg-background/50 dark:bg-background/35 absolute inset-0" />
          </div>
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider
              attribute="class"
              defaultTheme="light"
              enableSystem={false}
              disableTransitionOnChange
            >
              <HeaderAuthProvider>
                <SiteHeader />
                <BlockedBanner />
                <main className="flex flex-1 flex-col">{children}</main>
                <SiteFooter />
                {modal}
                <BottomNav />
              </HeaderAuthProvider>
            </ThemeProvider>
            <PwaRegister />
            <Analytics />
            <SpeedInsights />
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
