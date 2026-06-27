"use client";

import {
  CalendarDays,
  Home,
  LogIn,
  MessageCircle,
  Plus,
  User,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useHeaderAuth } from "@/components/header-auth";
import { Link, usePathname } from "@/i18n/navigation";
import { useUnreadDms } from "@/lib/use-unread-dms";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom tab bar (thumb-reachable). Hidden on desktop. Auth-aware via the
 * HeaderAuth context; the Create tab uses a full navigation to bypass the
 * `(.)events/new` modal interceptor.
 */
export function BottomNav() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { userId, loaded } = useHeaderAuth();
  const unread = useUnreadDms(userId ?? undefined);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const tab = (active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
      active ? "text-primary" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <nav
      className="bg-background/90 fixed inset-x-0 bottom-0 z-40 flex border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label={t("menu")}
    >
      <Link href="/" className={tab(isActive("/"))}>
        <Home className="size-5" aria-hidden />
        {t("home")}
      </Link>
      <Link href="/events" className={tab(isActive("/events"))}>
        <CalendarDays className="size-5" aria-hidden />
        {t("events")}
      </Link>

      {loaded && userId ? (
        <>
          {/* Center Create — full nav to dodge the modal interceptor. */}
          <a
            href={`/${locale}/events/new`}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium"
            aria-label={t("create")}
          >
            <span className="bg-primary text-primary-foreground -mt-5 flex size-11 items-center justify-center rounded-full shadow-lg">
              <Plus className="size-6" aria-hidden />
            </span>
          </a>
          <Link href="/messages" className={tab(isActive("/messages"))}>
            <span className="relative">
              <MessageCircle className="size-5" aria-hidden />
              {unread > 0 && (
                <span className="bg-destructive absolute -top-1 -right-1.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[9px] text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </span>
            {t("messages")}
          </Link>
          <Link href="/dashboard" className={tab(isActive("/dashboard"))}>
            <User className="size-5" aria-hidden />
            {t("account")}
          </Link>
        </>
      ) : (
        <Link href="/sign-in" className={tab(isActive("/sign-in"))}>
          <LogIn className="size-5" aria-hidden />
          {t("signIn")}
        </Link>
      )}
    </nav>
  );
}
