"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Label } from "@/components/ui/label";
import { EVENT_THEMES, type EventThemeId } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Card-design picker for the event form. Renders five mini previews using the
 * same `.event-theme[data-theme]` styles as the real cards, and submits the
 * chosen id via a hidden `theme` input.
 */
export function EventThemePicker({
  defaultTheme = "LIGHT_MINIMAL",
}: {
  defaultTheme?: EventThemeId;
}) {
  const t = useTranslations("Event.form");
  const [theme, setTheme] = useState<EventThemeId>(defaultTheme);

  return (
    <div className="space-y-2">
      <Label>{t("cardTheme")}</Label>
      <input type="hidden" name="theme" value={theme} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {EVENT_THEMES.map((opt) => {
          const active = opt.id === theme;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              aria-pressed={active}
              className={cn(
                "group rounded-xl border p-1 text-left transition",
                active
                  ? "border-primary ring-primary ring-2"
                  : "hover:border-foreground/30",
              )}
            >
              {/* Mini card preview — reuses the live theme styles. */}
              <div
                data-theme={opt.id}
                className="event-theme bg-card text-card-foreground relative flex h-20 flex-col justify-between rounded-lg border p-3"
              >
                <div className="bg-current h-2 w-10 rounded opacity-80" />
                <div className="space-y-1">
                  <div className="bg-current h-1.5 w-full rounded opacity-30" />
                  <div className="bg-current h-1.5 w-2/3 rounded opacity-30" />
                </div>
                {active && (
                  <span className="bg-primary text-primary-foreground absolute -top-2 -right-2 grid size-5 place-items-center rounded-full shadow">
                    <Check className="size-3" />
                  </span>
                )}
              </div>
              <p
                className={cn(
                  "mt-1.5 px-1 text-xs",
                  active
                    ? "text-primary font-medium"
                    : "text-muted-foreground",
                )}
              >
                {opt.label}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
