import { Show, UserButton } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

import { AdminNavLink } from "@/components/admin-nav-link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { NotificationBell } from "@/components/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { NAV_LINKS } from "@/lib/constants";

/**
 * Top navigation bar. Auth state comes from Clerk: signed-in users see a
 * UserButton; signed-out users see sign in / get started.
 *
 * Links use `buttonVariants` (not `<Button render=…>`) so they stay real
 * anchors with proper link semantics while looking like buttons.
 */
export function SiteHeader() {
  const t = useTranslations("Nav");

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
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              {t("dashboard")}
            </Link>
          </Show>
          <AdminNavLink />
        </nav>

        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />

          <Show when="signed-in">
            <div className="ml-1 flex items-center gap-1">
              <NotificationBell />
              <UserButton />
            </div>
          </Show>

          <Show when="signed-out">
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
          </Show>

          <MobileNav />
        </div>
      </div>
    </header>
  );
}
