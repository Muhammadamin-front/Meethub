import { getLocale, getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { MessagesNavLink } from "@/components/messages-nav-link";
import { MobileNav } from "@/components/mobile-nav";
import { NotificationMenu } from "@/components/notification-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { UserRole } from "@/generated/prisma/client";
import { Link } from "@/i18n/navigation";
import { NAV_LINKS } from "@/lib/constants";
import { getCurrentUser } from "@/server/auth";

/**
 * Top navigation bar. Auth state comes from Clerk: signed-in users see a
 * UserButton; signed-out users see sign in / get started.
 *
 * Links use `buttonVariants` (not `<Button render=…>`) so they stay real
 * anchors with proper link semantics while looking like buttons.
 */
export async function SiteHeader() {
  const t = await getTranslations("Nav");
  const tp = await getTranslations("Profile");
  const locale = await getLocale();
  const user = await getCurrentUser();
  const isAdmin = user?.role === UserRole.ADMIN;
  // Nudge the user to fill in their app profile (nickname + city).
  const profileIncomplete = !!user && (!user.nickname || !user.city);

  return (
    <header className="bg-background/80 sticky top-0 z-40 w-full border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo className="size-7" />
          <span className="text-lg tracking-tight">
            Meet<span className="text-primary">Hub</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {t(link.key)}
            </Link>
          ))}
          {user && (
            <>
              <Link
                href="/people"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                {t("people")}
              </Link>
              <MessagesNavLink userId={user.id} />
            </>
          )}
        </nav>

        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />

          {user && (
            <div className="ml-1 flex items-center gap-1">
              <NotificationMenu userId={user.id} />
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
          )}

          {!user && (
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
          )}

          <MobileNav userId={user?.id} />
        </div>
      </div>
    </header>
  );
}
