"use client";

import { Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

// Short codes shown in the switcher; native name kept as a secondary hint.
const LOCALE_CODES: Record<string, string> = { uz: "UZ", ru: "RU", en: "EN" };
const LOCALE_LABELS: Record<string, string> = {
  uz: "O‘zbekcha",
  ru: "Русский",
  en: "English",
};

export function LocaleSwitcher() {
  const t = useTranslations("Nav");
  const activeLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchTo(nextLocale: Locale) {
    if (nextLocale === activeLocale) return;
    startTransition(() => {
      // Keep the current path, just change the locale prefix.
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("language")}
            disabled={isPending}
            className="px-2.5 font-semibold"
          />
        }
      >
        {LOCALE_CODES[activeLocale]}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {routing.locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => switchTo(locale)}
            className="justify-between gap-4"
          >
            <span className="flex items-baseline gap-2">
              <span className="font-semibold">{LOCALE_CODES[locale]}</span>
              <span className="text-muted-foreground text-xs">
                {LOCALE_LABELS[locale]}
              </span>
            </span>
            {locale === activeLocale && <Check className="size-4" aria-hidden />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
