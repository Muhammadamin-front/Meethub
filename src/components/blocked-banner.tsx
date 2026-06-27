"use client";

import { useTranslations } from "next-intl";

import { useHeaderAuth } from "@/components/header-auth";

/** Site-wide banner shown while the current user is blocked (client-driven so
 * it doesn't force the layout to render dynamically). */
export function BlockedBanner() {
  const { blocked, loaded } = useHeaderAuth();
  const t = useTranslations("Blocked");

  if (!loaded || !blocked) return null;

  return (
    <div className="border-destructive/30 bg-destructive/10 border-b">
      <div className="text-destructive mx-auto max-w-6xl px-4 py-2 text-sm sm:px-6">
        <span className="font-medium">{t("title")}</span> {t("body")}
      </div>
    </div>
  );
}
