import type { Metadata } from "next";
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

import { BlockedBanner } from "@/components/blocked-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { routing } from "@/i18n/routing";
import { APP_NAME } from "@/lib/constants";

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
    title: { default: t("title"), template: `%s · ${APP_NAME}` },
    description: t("description"),
  };
}

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
      signInUrl={`/${locale}/sign-in`}
      signUpUrl={`/${locale}/sign-up`}
    >
      <html
        lang={locale}
        suppressHydrationWarning
        className={`${fontSans.variable} ${fontMono.variable}`}
      >
        <body className="bg-background text-foreground flex min-h-dvh flex-col antialiased">
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
              <SiteHeader />
              <BlockedBanner />
              <main className="flex flex-1 flex-col">{children}</main>
              <SiteFooter />
              {modal}
            </ThemeProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
