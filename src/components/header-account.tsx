"use client";

import { Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useHeaderAuth } from "@/components/header-auth";
import { NotificationMenu } from "@/components/notification-menu";
import { buttonVariants } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Right-hand header cluster (notifications + avatar, or sign in/up). */
export function HeaderAccount() {
  const { userId, isAdmin, profileIncomplete, loaded } = useHeaderAuth();
  const t = useTranslations("Nav");
  const tp = useTranslations("Profile");
  const locale = useLocale();

  if (!loaded) return null;

  if (userId) {
    return (
      <div className="ml-1 flex items-center gap-1">
        {/* Full nav (<a>) — the (.)events/new modal interceptor breaks soft-nav. */}
        <a
          href={`/${locale}/events/new`}
          className={cn(
            buttonVariants({ size: "sm" }),
            "mr-1 hidden md:inline-flex",
          )}
        >
          <Plus className="size-4" aria-hidden />
          {t("createShort")}
        </a>
        <NotificationMenu userId={userId} />
        <UserMenu
          profileLabel={tp("menuItem")}
          profileHref={`/${locale}/profile`}
          dashboardLabel={t("dashboard")}
          dashboardHref={`/${locale}/dashboard`}
          adminLabel={t("admin")}
          adminHref={isAdmin ? `/${locale}/admin` : undefined}
          profileIncomplete={profileIncomplete}
        />
      </div>
    );
  }

  return (
    <div className="ml-1 hidden items-center gap-2 md:flex">
      <Link
        href="/sign-in"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        {t("signIn")}
      </Link>
      <Link href="/sign-up" className={buttonVariants({ size: "sm" })}>
        {t("getStarted")}
      </Link>
    </div>
  );
}
