"use client";

import { useTranslations } from "next-intl";

import { useHeaderAuth } from "@/components/header-auth";
import { MessagesNavLink } from "@/components/messages-nav-link";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/** Signed-in-only links in the desktop nav (People + Messages with badge). */
export function HeaderNavLinks() {
  const { userId, loaded } = useHeaderAuth();
  const t = useTranslations("Nav");

  if (!loaded || !userId) return null;

  return (
    <>
      <Link
        href="/feed"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        {t("feed")}
      </Link>
      <Link
        href="/people"
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        {t("people")}
      </Link>
      <MessagesNavLink userId={userId} />
    </>
  );
}
