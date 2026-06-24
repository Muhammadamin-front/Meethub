"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

/**
 * Light/dark switch (no System). The knob position + icons are driven by the
 * `dark` CSS class (set by next-themes before hydration) so there's no flash;
 * the slide/colour transitions make the toggle feel smooth.
 */
export function ThemeToggle() {
  const t = useTranslations("Nav");
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      aria-label={t("toggleTheme")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="bg-muted dark:bg-primary relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-300"
    >
      <span className="bg-background text-foreground absolute top-0.5 left-0.5 flex size-6 items-center justify-center rounded-full shadow-sm transition-transform duration-300 ease-out dark:translate-x-5">
        <Sun className="size-3.5 dark:hidden" aria-hidden />
        <Moon className="hidden size-3.5 dark:block" aria-hidden />
      </span>
    </button>
  );
}
