"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/i18n/navigation";
import { getPusherClient } from "@/lib/pusher-client";
import { cn } from "@/lib/utils";
import { markAllNotificationsRead } from "@/server/actions/notifications";
import type { NotificationView } from "@/server/notifications";

type T = ReturnType<typeof useTranslations<"Notifications">>;

function renderText(t: T, n: NotificationView) {
  switch (n.type) {
    case "ATTENDANCE_MARKED":
      return t("types.ATTENDANCE_MARKED", { event: n.data.event ?? "" });
    case "ORG_APPROVED":
      return t("types.ORG_APPROVED", { org: n.data.org ?? "" });
    case "ORG_REJECTED":
      return t("types.ORG_REJECTED", { org: n.data.org ?? "" });
    case "BLOCKED":
      return t("types.BLOCKED", { reason: n.data.reason ?? "" });
    case "FRIEND_REQUEST":
      return t("types.FRIEND_REQUEST", { user: n.data.user ?? "" });
    case "FRIEND_ACCEPTED":
      return t("types.FRIEND_ACCEPTED", { user: n.data.user ?? "" });
  }
}

/** Where clicking a notification should take the user (if anywhere). */
function notificationHref(n: NotificationView): string | null {
  switch (n.type) {
    case "FRIEND_REQUEST":
      return "/people";
    case "FRIEND_ACCEPTED":
      return n.data.userId ? `/u/${n.data.userId}` : "/people";
    default:
      return null;
  }
}

export function NotificationMenu({
  userId,
  items,
  unread,
}: {
  userId: string;
  items: NotificationView[];
  unread: number;
}) {
  const t = useTranslations("Notifications");
  const [list, setList] = useState(items);
  const [count, setCount] = useState(unread);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;
    const name = `private-user-${userId}`;
    const channel = pusher.subscribe(name);
    channel.bind("new-notification", (n: NotificationView) => {
      setList((prev) => [n, ...prev].slice(0, 20));
      setCount((c) => c + 1);
    });
    return () => {
      channel.unbind("new-notification");
      pusher.unsubscribe(name);
    };
  }, [userId]);

  function onOpenChange(open: boolean) {
    if (open && count > 0) {
      setCount(0);
      setList((prev) => prev.map((n) => ({ ...n, isRead: true })));
      startTransition(() => {
        markAllNotificationsRead();
      });
    }
  }

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label={t("title")} />}
      >
        <span className="relative inline-flex">
          <Bell className="size-5" aria-hidden />
          {count > 0 && (
            <span className="bg-destructive absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <p className="px-3 py-2 text-sm font-medium">{t("title")}</p>
        <div className="max-h-80 overflow-y-auto">
          {list.length === 0 ? (
            <p className="text-muted-foreground px-3 py-8 text-center text-sm">
              {t("empty")}
            </p>
          ) : (
            list.map((n) => {
              const href = notificationHref(n);
              const className = cn(
                "block border-t px-3 py-2 text-sm",
                !n.isRead && "bg-muted/50",
                href && "hover:bg-accent transition-colors",
              );
              return href ? (
                <Link key={n.id} href={href} className={className}>
                  {renderText(t, n)}
                </Link>
              ) : (
                <div key={n.id} className={className}>
                  {renderText(t, n)}
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
