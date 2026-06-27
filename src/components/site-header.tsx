import { getTranslations } from "next-intl/server";

import { HeaderAccount } from "@/components/header-account";
import { HeaderNavLinks } from "@/components/header-nav-links";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Logo } from "@/components/logo";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { NAV_LINKS } from "@/lib/constants";

/**
 * Top navigation bar. This is a *static* server component — it never calls
 * Clerk `auth()`, so the public pages under the shared layout can be statically
 * rendered. Auth-dependent bits (signed-in links, notifications, avatar) are
 * client components that read state via the HeaderAuth context.
 *
 * Links use `buttonVariants` (not `<Button render=…>`) so they stay real
 * anchors with proper link semantics while looking like buttons.
 */
export async function SiteHeader() {
  const t = await getTranslations("Nav");

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
          <HeaderNavLinks />
        </nav>

        <div className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeToggle />
          <HeaderAccount />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
