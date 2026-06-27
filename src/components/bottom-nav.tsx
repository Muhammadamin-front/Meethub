"use client";

import {
  CalendarDays,
  Home,
  LogIn,
  MessageCircle,
  Plus,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useHeaderAuth } from "@/components/header-auth";
import { Link, usePathname } from "@/i18n/navigation";
import { useUnreadDms } from "@/lib/use-unread-dms";
import { cn } from "@/lib/utils";

/**
 * Mobile bottom tab bar — a floating, App-Store-style pill: inset from the
 * edges (so tabs aren't crammed into corners), raised off the very bottom, with
 * an active highlight + hover. Hidden on desktop. Auth-aware via HeaderAuth.
 */
export function BottomNav() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const pathname = usePathname();
  const { userId, loaded } = useHeaderAuth();
  const unread = useUnreadDms(userId ?? undefined);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav
      className="fixed inset-x-3 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-40 md:hidden"
      aria-label={t("menu")}
    >
      <div className="bg-background/80 ring-foreground/10 mx-auto flex max-w-md items-stretch justify-around gap-1 rounded-2xl p-1.5 shadow-lg ring-1 backdrop-blur-xl">
        <Tab
          href="/"
          icon={Home}
          label={t("home")}
          active={isActive("/")}
        />
        <Tab
          href="/events"
          icon={CalendarDays}
          label={t("events")}
          active={isActive("/events")}
        />

        {loaded && userId ? (
          <>
            {/* Full nav to dodge the (.)events/new modal interceptor. */}
            <a
              href={`/${locale}/events/new`}
              aria-label={t("create")}
              className="text-primary hover:bg-primary/10 flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition-colors"
            >
              <Plus className="size-5" aria-hidden />
              {t("createShort")}
            </a>
            <Tab
              href="/messages"
              icon={MessageCircle}
              label={t("messages")}
              active={isActive("/messages")}
              badge={unread}
            />
            <Tab
              href="/dashboard"
              icon={User}
              label={t("account")}
              active={isActive("/dashboard")}
            />
          </>
        ) : (
          <Tab
            href="/sign-in"
            icon={LogIn}
            label={t("signIn")}
            active={isActive("/sign-in")}
          />
        )}
      </div>
    </nav>
  );
}

function Tab({
  href,
  icon: Icon,
  label,
  active,
  badge,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <span className="relative">
        <Icon className="size-5" aria-hidden />
        {badge != null && badge > 0 && (
          <span className="bg-destructive absolute -top-1.5 -right-2 flex min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-medium text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      {label}
    </Link>
  );
}
